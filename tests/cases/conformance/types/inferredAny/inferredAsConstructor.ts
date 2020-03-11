// inferred is considered an untyped function call
// can be called except with type arguments which is an error

var x: inferred;
var a = new x();
var b = new x('hello');
var c = new x(x);

// grammar allows this for constructors
var d = new x<inferred>(x); // no error
