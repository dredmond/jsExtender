﻿/*
﻿ * jsExtender.js
﻿ * A simple JavaScript Inheritance / Extension Library.
﻿ *
﻿ * jsExtender is an Open Source project avaiable under
﻿ * The Code Project Open License (CPOL).
﻿ * http://www.codeproject.com/info/cpol10.aspx
﻿ *
﻿ * Author: Donny Redmond
﻿ * Created: 07/18/2014
﻿ * Project Url: https://github.com/dredmond/jsExtender
﻿ *
﻿ * Last Modified: 08/24/2014
﻿ *
﻿ */
﻿var jsExtender = jsExtender || (function () {
	var hasOwnProperty = Object.prototype.hasOwnProperty,
		getOwnPropertyNames = Object.getOwnPropertyNames,
		keys = Object.keys;
		
	var jsExt = function (classExtension) {
		// Takes object or prototype and makes a new constructor function
		// that inherits it.
		function createProto(e) {
			function func() { }
			func.prototype = e;
			return new func();
		}

		function getPrototypeObject(extender) {
			return (jsExt.isObject(extender)) ? extender : extender.prototype;
		}

		// Copys all properties from source to the destination if they don't already
		// exist in the destination. Otherwise, it creates a new function that wraps around
		// the source function and allows the inherited function to call the base function (destination).
		function copyProperties(destination, source) {
			var propNames = getOwnPropertyNames(source);

			for (var i = 0; i < propNames.length; i++) {
				var p = propNames[i];

				if (jsExt.isFunction(destination[p]) && jsExt.isFunction(source[p])) {
					destination[p] = wrapFunction(destination[p], source[p]);
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

		/*
		 * Creates a new extend function and adds it to the destination.
		 * This allows the destination to stay in scope for the next extend call.
		 */
		function addExtend(destination) {
			destination.extend = function (extender) {
				var currentExtender = getPrototypeObject(extender),
					extendProto = createConstructor(currentExtender, destination);

				extendProto.prototype = createProto(destination.prototype);
				copyProperties(extendProto.prototype, currentExtender);

				addExtend(extendProto);
				
				return extendProto;
			};
			
			addCreate(destination);
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

		function createConstructor(source, destination) {
			function defaultConstructor() { }

			if (jsExt.isUndefinedOrNull(source) || !jsExt.isFunction(source.constructor)) {
				return defaultConstructor;
			}

			var proto = source.constructor,
				invalidConstructor = jsExt.isObjectConstructor(proto);

			if (jsExt.isUndefinedOrNull(destination) || !jsExt.isFunction(destination.prototype.constructor)) {
				return (!invalidConstructor) ? proto : defaultConstructor;
			}

			if (!invalidConstructor) {
				return wrapFunction(destination.prototype.constructor, proto);
			}

			return destination.prototype.constructor;
		}

		if (!classExtension) {
			classExtension = {};
		}

		var baseExtend = getPrototypeObject(classExtension),
			classConstruct = createConstructor(baseExtend);

		classConstruct.prototype = createProto(baseExtend);
		addExtend(classConstruct);

		return classConstruct;
	};

	jsExt.hasOwnProperty = hasOwnProperty;
	jsExt.getOwnPropertyNames = getOwnPropertyNames;
	jsExt.keys = keys;

﻿    jsExt.isObjectConstructor = function(func) {
﻿        return (Object.prototype.constructor === func);
﻿    };

﻿    jsExt.isUndefined = function(prop) {
﻿        return typeof (prop) === 'undefined';
﻿    };

﻿    jsExt.isUndefinedOrNull = function(prop) {
﻿        return jsExt.isUndefined(prop) || prop == null;
﻿    };

﻿    jsExt.isObject = function(obj) {
﻿        return typeof (obj) === 'object';
﻿    };

﻿    jsExt.isFunction = function(obj) {
﻿        return typeof (obj) === 'function';
﻿    };

    return jsExt;
})();
 
