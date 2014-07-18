var jsExtender = jsExtender || (function (classExtension) {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        getOwnPropertyNames = Object.getOwnPropertyNames;

    // Takes object or prototype and makes a new constructor function
    // that inherits it.
    function createProto(e) {
        function func() { }
        func.prototype = e;
        return new func();
    }

    function isObjectConstructor(func) {
        return (Object.prototype.constructor === func);
    }

    function getPrototypeObject(extender) {
        return (typeof (extender) === 'object') ? extender : extender.prototype;
    }

    // Copys all properties from source to the destination if they don't already
    // exist in the destination. Otherwise, it creates a new function that wraps around
    // the source function and allows the inherited function to call the base function (destination).
    function copyProperties(destination, source) {
        var propNames = getOwnPropertyNames(source);

        for (var i = 0; i < propNames.length; i++) {
            var p = propNames[i];

            if (typeof (destination[p]) === 'function' && typeof (source[p]) === 'function') {
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
        }
    }

    function createConstructor(source, destination) {
        function defaultConstructor() { }

        if (!source || typeof (source.constructor) !== 'function') {
            return defaultConstructor;
        }

        var proto = source.constructor,
            invalidConstructor = isObjectConstructor(proto);

        if (!destination || typeof (destination.prototype.constructor) !== 'function') {
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
});