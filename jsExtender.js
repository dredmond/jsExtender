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
 * Last Modified: 08/24/2014
 *
 */
var jsExtender = jsExtender || (function () {
	var hasOwnProperty = Object.prototype.hasOwnProperty,
		getOwnPropertyNames = Object.getOwnPropertyNames,
		keys = Object.keys;
		
	function isObjectConstructor(func) {
	    return Object.prototype.constructor === func;
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

				if (p !== 'constructor' && isFunction(destination[p]) && isFunction(source[p])) {
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

        function buildWrappedFunction(funcName, baseClass, sourceClass) {
            var parentClass = baseClass,
                wrappedFunc = null,
                funcArray = [];

            if (hasOwnProperty.call(sourceClass, funcName) && isFunction(sourceClass[funcName]))
                funcArray.push(sourceClass[funcName]);

            while (parentClass) {
                var parentProto = parentClass.prototype;

                if (hasOwnProperty.call(parentProto, funcName) && isFunction(parentProto[funcName]))
                    funcArray.unshift(parentProto[funcName]);

                parentClass = parentClass.prototype.parent;
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
		    destination.currentClass = base;
		    destination.prototype.parent = parent;
		    destination.prototype.currentClass = base;
            
			destination.extend = function (extender) {
			    var currentExtender = getPrototypeObject(extender);
			    var extendProto = createConstructor(currentExtender, destination);

			    extendProto.prototype = createProto(destination.prototype);

			    // currentExtender = extender constructor function
			    // extendProto = new extension
                // extendProto.prototype = destination.prototype
				copyProperties(extendProto.prototype, currentExtender, destination);
				addExtend(extendProto, currentExtender, destination);

				//extendProto.prototype.parent = base;
				//extendProto.prototype.currentClass = currentExtender;

				//extendProto.parent = destination;

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
		    destConstruct.wrapFunction = function (funcName, baseFunc) {
		        return baseFunc;
		        //return buildWrappedFunction(funcName, destConstruct, )
		    }
		}

		function createConstructor(source, destination) {
			function defaultConstructor() { }

			if (isUndefinedOrNull(source) || !isFunction(source.constructor)) {
				return defaultConstructor;
			}

			var invalidConstructor = isObjectConstructor(source.constructor);

			if (isUndefinedOrNull(destination) || !isFunction(destination.prototype.constructor)) {
			    if (!invalidConstructor) {
			        return source.constructor;
			    }

			    return defaultConstructor;
			}

			if (!invalidConstructor) {
			    return buildWrappedFunction('constructor', destination, source);
			}

			return destination.prototype.constructor;
		}

		if (!classExtension) {
			classExtension = {};
		}

	    var baseExtend = getPrototypeObject(classExtension),
			classConstruct = createConstructor(baseExtend);

	    classConstruct.prototype = createProto(baseExtend.prototype);
	    classConstruct.prototype.constructor = classConstruct;

	    addExtend(classConstruct, classConstruct);

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
 
