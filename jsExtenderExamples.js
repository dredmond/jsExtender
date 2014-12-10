var jsExtExamples = (function() {
	// Private Variables
	var output = null;
	
	function applyIndent(msg, indent) {
		var i = 0,
			spaces = '';
		while (i++ < indent) {
			spaces += '&nbsp;';
		}
		
		return spaces + msg;
	}
	
	// extenderExamplesClass Definition
	var extenderExamplesClass = jsExtender({
			constructor: function () {
				output = document.getElementById('output');
			},
			writeOutput: function (msg, indent) {
				if (output === null)
					return;
				
				msg = typeof(msg) !== 'undefined' ? msg : '';
				
				if (typeof(indent) === 'undefined' || indent == null)
					indent = 0;
				
				if (Object.prototype.toString.call(msg) === '[object Array]') {
					var objMsg = '';
					for (var i = 0; i < msg.length; i++) {
						var value = msg[i],
							propType = typeof (msg[i]);
						objMsg += applyIndent('[' + i + '] = ' + value + ' (' + propType + ')<br />', indent);
					}
					msg = objMsg;
				} else if (typeof (msg) === 'object') {
					var objMsg = '';
					for (var propName in msg) {
						var propType = typeof (msg[propName]);
						objMsg += applyIndent(propName + ' (' + propType + ')<br />', indent);
					}
					msg = objMsg;
				} else {
					msg = applyIndent(msg + '<br />', indent);
				}
				
				output.innerHTML += msg;
			}
		});
	
	// Create instance and return it.
	var extenderExamples = new extenderExamplesClass();
	return extenderExamples;
})();

jsExtExamples.writeOutput('jsExtExamples Properties:');
jsExtExamples.writeOutput(jsExtExamples, 4);
jsExtExamples.writeOutput();

// Default jsExtender
var defaultClass = jsExtender();
var defaultInstance = defaultClass.create();

jsExtExamples.writeOutput('defaultClass Properties:');
jsExtExamples.writeOutput(jsExtender.keys(defaultClass), 4);
jsExtExamples.writeOutput();

// jsExtender using Object Definition
var objectDefinedClass = jsExtender({
	constructor: function (arg1, arg2) {
		this.value1 = arg1;
		this.value2 = arg2;
	},
	publicVar: 'This is a public variable.',
	addValues: function (x, y, z) {
		return x + y + z;
	}
});

jsExtExamples.writeOutput('objectDefinedClass Properties:');
jsExtExamples.writeOutput(jsExtender.keys(objectDefinedClass), 4);
jsExtExamples.writeOutput();

var objectDefinedInstance = new objectDefinedClass('something1', 2);
jsExtExamples.writeOutput('objectDefinedInstance Properties:');
jsExtExamples.writeOutput(objectDefinedInstance, 4);
jsExtExamples.writeOutput();

jsExtExamples.writeOutput('objectDefinedInstance.addValues: ' + objectDefinedInstance.addValues(10, 2, 1));
jsExtExamples.writeOutput(objectDefinedInstance.value1);
jsExtExamples.writeOutput(objectDefinedInstance.value2);
jsExtExamples.writeOutput(objectDefinedInstance.publicVar);
jsExtExamples.writeOutput();

// Using jsExtender's default constructor.
var defaultClass = jsExtender({
	constructor: function () {
		function testFunc() {
			console.log('Testing the test function!');
		};
	
		defaultClass.prototype.testFunc = testFunc;
		this.testFunc = this.wrapFunction('testFunc', defaultClass.prototype);
	}
});

/*defaultClass.prototype.testFunc = function () {
    console.log('Testing the test function!');
};*/

// Create a defaultClass object.
var defaultInstance = defaultClass.create();
defaultInstance.testFunc();

// Extend the default class and override the constructor.
var defaultClassExtended = defaultClass.extend({
    constructor: function () {
        // Override default constructor.
        console.log('The default constructor has been overridden!');
    }
});

// Create a new instance of the extended default class.
defaultInstanceExtended = defaultClassExtended.create();

// The testFunc declared on defaultClass should still work in defaultClassExtended.
defaultInstanceExtended.testFunc();

// The constructor function that will inherit from defaultClass.
function ExtensionConstructor () {
    console.log('The default constructor has been overridden by the ExtensionConstructor!');
	
	ExtensionConstructor.prototype.testFunc = function () {
		console.log('New test func from ExtensionConstructor.');
		this.base.call(this);
	};

	this.testFunc = this.wrapFunction('testFunc');
}

// This prototyped function will be available after the inheritance occurs.
ExtensionConstructor.prototype.myPrototypedFunction = function (x, y) {
    console.log('x: ' + x);
    console.log('y: ' + y);
};

// Make ExtensionConstructor inherit from the default class.
var extensionFunctionClass = defaultClass.extend(ExtensionConstructor);

/* Note:
 *
 * This can be extensionFunctionClass.prototype.afterDeclare or defaultClass.prototype.afterDeclare.
 * It cannot be ExtensionConstructor.prototype.afterDeclare because the properties are copied during the extend 
 * call and not inherited.
 *
 */
extensionFunctionClass.prototype.afterDeclare = function () {
	console.log('Calling After Declare.');
};

// Create a new instance of the extended default class.
var extensionFunctionInstance = extensionFunctionClass.create();

// The function declared on the ExtensionConstructor should still work.
extensionFunctionInstance.myPrototypedFunction(20, 50);
extensionFunctionInstance.afterDeclare();

// The testFunc declared on defaultClass should still work in extensionFunctionInstance.
extensionFunctionInstance.testFunc();

var baseTestClass = extensionFunctionClass.extend({
    constructor: function() {
        console.log('Constructor from baseTestClass has been called.');
        this.base.call(this);
    },
    testFunc: function() {
        console.log('The test function has been called from the baseTestClass.');
        this.base.call(this);
    },
    testFunc2: function() {
        console.log('Testing testFunc2 from baseTestClass.');
    },
    myPrototypedFunction: function(x, y, z) {
        this.base.call(this, x, y);
        console.log('z: ' + z);
    }
});

// Make an instace of the baseTestClass. It should call 
// it's own constructor and the constructor of it's parent.
var baseTestInstance = baseTestClass.create();

// Make sure all other calls still work as expected. 
// They should also call the base functions.
baseTestInstance.testFunc();
baseTestInstance.testFunc2();
baseTestInstance.myPrototypedFunction(10, 20, 30);
baseTestInstance.afterDeclare();

// Multiple Inheritance with base calls.
var baseTestClass2 = baseTestClass.extend({
    constructor: function() {
        console.log('Constructor from baseTestClass2 has been called.');
        this.base.call(this);
    },
    testFunc: function() {
        console.log('The test function has been called from the baseTestClass2.');
        this.base.call(this);
    },
    testFunc2: function() {
        this.base.call(this);
        console.log('Testing testFunc2 from baseTestClass2.');
    },
    myPrototypedFunction: function(x, y, z) {
        console.log('myPrototypedFunction has been called from baseTestClass2.');
        this.base.call(this, x, y, z);
    },
    afterDeclare: function() {
        console.log('After declare overridden in baseTestClass2.');
        this.base.call(this);
    }
});

// Make an instace of the baseTestClass2. It should call 
// it's own constructor and the constructor of it's parent.
var baseTestInstance2 = baseTestClass2.create();

// Make sure all other calls still work as expected. 
// They should also call the base functions.
baseTestInstance2.testFunc();
baseTestInstance2.testFunc2();
baseTestInstance2.myPrototypedFunction(10, 10, 10);
baseTestInstance2.afterDeclare();