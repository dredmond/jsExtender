/*
 * jsExtender.js
 * A simple JavaScript Inheritance / Extension Library.
 *
 * jsExtender is an Open Source project avaiable under
 * The Code Project Open License (CPOL).
 * http://www.codeproject.com/info/cpol10.aspx
 *
 * Author: Donny Redmond
 * Created: 07/18/2014
 * Project Url: https://github.com/dredmond/jsExtender
 *
 * Last Modified: 12/09/2014
 *
 */
var jsExtender = jsExtender || (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        getOwnPropertyNames = Object.getOwnPropertyNames,
        getPrototypeOf = Object.getPrototypeOf,
        keys = Object.keys,
        objectConstructor = Object.prototype.constructor;

    function isObjectConstructor(func) {
        return objectConstructor === func;
    }

    function isUndefined(prop) {
        return typeof (prop) === 'undefined';
    }

    function isUndefinedOrNull(prop) {
        return isUndefined(prop) || prop == null;
    }

    function isObject(obj) {
        return typeof (obj) === 'object';
    }

    function isFunction(obj) {
        return typeof (obj) === 'function';
    }

    var jsExt = function (classExtension) {
        // Takes object or prototype and makes a new constructor function
        // that inherits it.
        function createProto(e) {
            function func() { }
            func.prototype = e;
            return new func();
        }

        function getPrototypeObject(extender) {
            return (isObject(extender)) ? extender : extender.prototype;
        }

        // Copys all properties from source to the destination if they don't already
        // exist in the destination. Otherwise, it creates a new function that wraps around
        // the source function and allows the inherited function to call the base function (destination).
        function copyProperties(destination, source, baseClass) {
            var propNames = getOwnPropertyNames(source);

            for (var i = 0; i < propNames.length; i++) {
                var p = propNames[i];

                if (p === 'constructor')
                    continue;

                if (isFunction(destination[p]) && isFunction(source[p]) && baseClass) {
                    destination[p] = buildWrappedFunction(p, baseClass, source);
                } else {
                    destination[p] = source[p];
                }
            }
        }

        /* 
        * Function wrapper for existing destination functions.
        * Creates and returns a new function that copies the old base function
        * and replaces it with the new base function. 
        * 
        * It calls the source function with the current arguments and stores the result.
        * Then it replaces the base function with the old base function and returns the
        * result of the source function.
        */
        function wrapFunction(baseFunc, sourceFunc) {
            return function () {
                var oldBase = this.base;

                this.base = baseFunc;
                var result = sourceFunc.apply(this, arguments);
                this.base = oldBase;

                return result;
            };
        }

        function findNextClassWithDefinition(funcName, baseClass) {
            var found = null,
                currentClass = baseClass,
                proto;
            
            while (found === null && currentClass) {
                if (isFunction(currentClass)) {
                    proto = currentClass.prototype;
                    if (hasOwnProperty.call(proto, funcName)) {
                        found = proto[funcName];
                    }
                } else if (isObject(currentClass)) {
                    proto = getPrototypeOf(currentClass);

                    if (hasOwnProperty.call(currentClass, funcName)) {
                        found = currentClass[funcName];
                    } else if (hasOwnProperty.call(proto, funcName)) {
                        found = proto[funcName];
                    }
                }
                
                currentClass = currentClass.parent;
            }
            
            return {
                found: found,
                currentClass: currentClass
            };
        }
        
        function buildWrappedFunction(funcName, baseClass, sourceClass) {
            var parentClass = baseClass,
                wrappedFunc = null,
                funcArray = [];

            if (sourceClass && hasOwnProperty.call(sourceClass, funcName) && isFunction(sourceClass[funcName]))
                funcArray.push(sourceClass[funcName]);

            var result = findNextClassWithDefinition(funcName, parentClass);
                
            while (result.found) {
                if (isFunction(result.found)) {
                    funcArray.unshift(result.found);
                }
                
                result = findNextClassWithDefinition(funcName, result.currentClass);
            }

            for (var i = 0; i < funcArray.length; i++) {
                // Re-wrap wrappedFunc
                wrappedFunc = wrapFunction(wrappedFunc, funcArray[i]);
            }

            return wrappedFunc;
        }

        /*
        * Creates a new extend function and adds it to the destination.
        * This allows the destination to stay in scope for the next extend call.
        */
        function addExtend(destination, base, parent) {
            destination.parent = parent;
            destination.prototype.parent = parent;

            destination.extend = function (extender) {
                var currentExtender = getPrototypeObject(extender);
                var extendProto = getBaseConstructor(currentExtender, destination);

                extendProto.prototype = createProto(destination.prototype);
                extendProto.constructor = extendProto;

                copyProperties(extendProto.prototype, currentExtender, destination);
                addExtend(extendProto, currentExtender, destination.prototype);

                return extendProto;
            };

            addCreate(destination);
            addWrapFunction(destination);
        }

        /*
        * Allow creation of object without the use of the new keyword.
        */
        function addCreate(destConstruct) {
            destConstruct.create = function() {
                var constructProto = createProto(destConstruct.prototype);
                constructProto = (destConstruct.apply(constructProto, arguments) || constructProto);
                return constructProto;
            };
        }
        
        function addWrapFunction(destConstruct) {
            if (destConstruct.prototype.wrapFunction)
                return;
        
            destConstruct.prototype.wrapFunction = function(funcName) {
                return buildWrappedFunction(funcName, this);
            };
        }
        
        function getBaseConstructor(child, base) {
            function defaultConstructor() { }

            function func() {
                b.apply(this, arguments);
                c.apply(this, arguments);
            }
            
            var c = defaultConstructor,
                b = defaultConstructor;

            if (isUndefinedOrNull(child) || !isFunction(child.constructor)) {
                return defaultConstructor;
            }
            
            if (!isObjectConstructor(child.constructor))
                c = child.constructor;

            if (!isUndefinedOrNull(base) && isFunction(base.constructor)) {
                b = base.constructor;
            }

            return func;
        }

        if (!classExtension) {
            classExtension = {};
        }

        var baseExtend = getPrototypeObject(classExtension),
            classConstruct = getBaseConstructor(baseExtend);

        classConstruct.prototype = createProto(baseExtend);
        classConstruct.constructor = classConstruct;

        copyProperties(classConstruct.prototype, classExtension);
        addExtend(classConstruct, baseExtend);

        return classConstruct;
    };

    jsExt.hasOwnProperty = hasOwnProperty;
    jsExt.getOwnPropertyNames = getOwnPropertyNames;
    jsExt.keys = keys;
    jsExt.isObjectConstructor = isObjectConstructor;
    jsExt.isUndefined = isUndefined;
    jsExt.isUndefinedOrNull = isUndefinedOrNull;
    jsExt.isObject = isObject;
    jsExt.isFunction = isFunction;

    return jsExt;
})();
 
