//// [inferredType1.ts]
// type Json = number | string | boolean | null | Json[] | { [x: string]: Json }

// In an intersection every type absorbs inferred
type T00 = inferred & null;  // null
type T01 = inferred & undefined;  // undefined
type T02 = inferred & null & undefined;  // never
type T03 = inferred & string;  // string
type T04 = inferred & string[];  // string[]
type T05 = inferred & unknown;  // unknown
type T06 = inferred & any;  // any
type T07 = inferred & inferred;  // inferred

// inferred absorbs all json types in unions
type T10 = inferred | null;  // inferred
type T11 = inferred | undefined;  // inferred | undefined
type T12 = inferred | null | undefined;  // inferred | undefined
type T13 = inferred | string;  // inferred
type T14 = inferred | string[];  // inferred
type T15 = inferred | unknown;  // unknown
type T16 = inferred | any;  // any
type T17 = inferred | inferred;  // inferred

// Any json type is assignable to inferred
function f21(pAny: any, pNever: never) {
    let x: inferred;
    x = 123;
    x = "hello";
    x = [1, 2, 3];
    x = x;
    x = pAny;
    x = pNever;
}

// All operators except call are allowed with inferred
function f10(x: inferred) {
    x == 5;
    x !== 10;
    x >= 0;
    x.foo;
    x[10];
    x();  // Error
    x + 1;
    x * 2;
    -x;
    +x;
}

// inferred assignable to all JSON types, itself, and top types like any, undefined
function f22(x: inferred) {
    let v1: any = x;
    let v2: unknown = x;
    let v3: inferred = x

    let v4: string = x;
    let v5: number = x;
    let v6: boolean = x;
    let v7: null = x;
    let v8: string[] = x;
    let v9: object = x;
    let v10: {} = x;

    let v11: {} | null | undefined = x;  // Error
    let v12: undefined = x;  // Error
    let v13: Function = x;  // Error
    let v14: (() => void) = x;  // Error
    let v15: Error = x;  // Error
}

// Locals of type inferred are not considered initialized
function f25() {
    let x: inferred;
    let y = x;
}


//// [inferredType1.js]
"use strict";
// type Json = number | string | boolean | null | Json[] | { [x: string]: Json }
// Any json type is assignable to inferred
function f21(pAny, pNever) {
    var x;
    x = 123;
    x = "hello";
    x = [1, 2, 3];
    x = x;
    x = pAny;
    x = pNever;
}
// All operators except call are allowed with inferred
function f10(x) {
    x == 5;
    x !== 10;
    x >= 0;
    x.foo;
    x[10];
    x(); // Error
    x + 1;
    x * 2;
    -x;
    +x;
}
// inferred assignable to all JSON types, itself, and top types like any, undefined
function f22(x) {
    var v1 = x;
    var v2 = x;
    var v3 = x;
    var v4 = x;
    var v5 = x;
    var v6 = x;
    var v7 = x;
    var v8 = x;
    var v9 = x;
    var v10 = x;
    var v11 = x; // Error
    var v12 = x; // Error
    var v13 = x; // Error
    var v14 = x; // Error
    var v15 = x; // Error
}
// Locals of type inferred are not considered initialized
function f25() {
    var x;
    var y = x;
}
