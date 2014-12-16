﻿/*
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
 * Last Modified: 12/16/2014
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
                
                destination[p] = source[p];
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
            copyProperties(destination.prototype, base, parent);
            destination.parent = parent;
            destination.prototype.parent = parent;

            destination.extend = function (extender) {
                var currentExtender = getPrototypeObject(extender);
                var extendProto = getBaseConstructor(currentExtender, destination);

                extendProto.prototype = createProto(destination.prototype);
                extendProto.constructor = extendProto;
                extendProto.prototype.constructor = extendProto;

                addExtend(extendProto, currentExtender, destination.prototype);

                return extendProto;
            };

            addCreate(destination);
            addWrapFunction(destination);
            addWrapAllFunctions(destination);
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
        
        function addWrapAllFunctions(destConstruct) {
            if (destConstruct.prototype.wrapAllFunctions)
                return;

            destConstruct.prototype.wrapAllFunctions = function () {
                var proto = getPrototypeOf(this),
                    propNames,
                    propName,
                    i,
                    funcCount = {};

                while (proto && !isObjectConstructor(proto.constructor)) {
                    propNames = getOwnPropertyNames(proto);

                    for (i = 0; i < propNames.length; i++) {
                        propName = propNames[i];
                        if (propName === 'constructor' || !isFunction(proto[propName]))
                            continue;

                        if (!funcCount[propName])
                            funcCount[propName] = 0;

                        funcCount[propName] += 1;
                    }

                    proto = getPrototypeOf(proto);
                }

                propNames = getOwnPropertyNames(funcCount);
                for (i = 0; i < propNames.length; i++) {
                    propName = propNames[i];
                    if (funcCount[propName] <= 1)
                        continue;

                    this[propName] = buildWrappedFunction(propName, this);
                }
            };
        }

        function addWrapFunction(destConstruct) {
            if (destConstruct.prototype.wrapFunction)
                return;
        
            destConstruct.prototype.wrapFunction = function (funcName, proto, fn) {
                // Add method to the class prototype
                if (proto && fn && !hasOwnProperty.call(proto, funcName))
                    proto[funcName] = fn;

                var wrappedFunc = buildWrappedFunction(funcName, this);
                this[funcName] = wrappedFunc;
                return wrappedFunc;
            };
        }
        
        function getBaseConstructor(child, base) {
            function defaultConstructor() { }

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

            return makeNewConstructor(child, c, base, b);
        }

        function makeNewConstructor(childClass, childConstructor, baseClass, baseConstructor) {
            return function() {
                baseConstructor.apply(this, arguments);
                childConstructor.apply(this, arguments);
                
                var proto = getPrototypeOf(this),
                    protoBaseConst = getPrototypeOf(proto).constructor,
                    baseDefined = !isUndefinedOrNull(baseClass);
                
                // Prototype of proto should have the same constructor as the baseConstructor
                // if the base is defined. Otherwise it will have the same constructor as the childConstructor.
                // This will tell us if we are on the final constructor call.
                if ((baseDefined && protoBaseConst !== baseConstructor) || 
                    (!baseDefined && protoBaseConst !== childConstructor))
                    return;
                
                // Wrap prototyped functions on the final constructor call.
                this.wrapAllFunctions();
            };
        }

        if (!classExtension) {
            classExtension = {};
        }

        var baseExtend = getPrototypeObject(classExtension),
            classConstruct = getBaseConstructor(baseExtend);

        classConstruct.prototype = createProto(baseExtend);
        classConstruct.constructor = classConstruct;
        classConstruct.prototype.constructor = classConstruct;

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
 
