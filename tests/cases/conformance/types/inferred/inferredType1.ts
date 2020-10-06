// @strict: true

// type Json = number | string | boolean | null | Json[] | { [x: string]: Json }

// In an intersection every type constrains inferred
type T00 = inferred & null; // null
type T01 = inferred & undefined; // undefined
type T02 = inferred & null & undefined; // never
type T03 = inferred & string; // string
type T04 = inferred & string[]; // string[]
type T05 = inferred & unknown; // unknown
type T06 = inferred & any; // any
type test = string & boolean & inferred; // intersection of disjoint domains still result in never
type T07 = inferred & inferred; // inferred

// inferred absorbs all json types in unions. does not absorb itself
// as they could have different constraints
// this helps preserve the property that A & (B|C) === (A & B) | (A & C)
type T10 = inferred | null; // inferred
type T11 = inferred | undefined; // inferred | undefined
type T12 = inferred | null | undefined; // inferred | undefined
type T13 = inferred | string; // inferred
type T14 = inferred | string[]; // inferred
type T15 = inferred | unknown; // unknown
type T16 = inferred | any; // any
type T17 = inferred | inferred; // inferred | inferred
type T18 = inferred | (() => void); // inferred | (() => void)

// Any json type is assignable to inferred
function f21(pAny: any, pNever: never) {
  let x: inferred;
  x = 123;
  x = 'hello';
  x = [1, 2, 3];
  x = x;
  x = null;
  x = pAny;
  x = pNever;
}
declare function f<T, R>(f: (x: inferred, y: T) => [T, R]): T;

// All operators except call are allowed with inferred
f()(() => {
  let x: inferred;
  x(); // Error
  new x(); // Error
  x``; // Error
  return x;
});

f<boolean, inferred>((x: inferred, y) => [y = x == 5, x]); // boolean
f<boolean, inferred>((x: inferred, y) => [y = x !== 10, x]); // boolean
f<boolean, string>((x: inferred, y) => [y = x >= '', x]); // boolean
f<boolean, number>((x: inferred, y) => [y = x <= 0, x]); // boolean
f<boolean, number>((x: inferred, y) => [y = x < 0, x]); // boolean
f<boolean, number>((x: inferred, y) => [y = x > 0, x]); // boolean
f<inferred, { foo: inferred }>((x: inferred, y) => [y = x.foo, x]); // inferred
f<inferred, inferred[]>((x: inferred, y) => [y = x[10], x]); // inferred

f<string | number, string | number>((x: inferred, y) => [y = x + 1, x]); // string | number

f<number, number>((x: inferred, y) => [y = -x, x]); // number
f<number, number>((x: inferred, y) => [y = +x, x]); // number
f<number, number>((x: inferred, y) => [y = ++x, x]); // number
f<number, number>((x: inferred, y) => [y = --x, x]); // number
f<number, number>((x: inferred, y) => [y = x++, x]); // number
f<number, number>((x: inferred, y) => [y = x--, x]); // number

f<number, number>((x: inferred, y) => [y = x * 2, x]); // number
f<number, number>((x: inferred, y) => [y = x ** 2, x]); // number
f<number, number>((x: inferred, y) => [y = (x *= 2), x]); // number
f<number, number>((x: inferred, y) => [y = (x **= 2), x]); // number
f<number, number>((x: inferred, y) => [y = x / 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x /= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x % 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x %= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x - 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x -= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x << 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x <<= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x >> 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x >>= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x >>> 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x >>>= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x | 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x |= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x ^ 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x ^= 1), x]); // number
f<number, number>((x: inferred, y) => [y = x & 1, x]); // number
f<number, number>((x: inferred, y) => [y = (x &= 1), x]); // number

// inferred assignable to all JSON types, itself, and top types like any, undefined
function f22(x: inferred) {
  let v1: any = x;
  let v2: unknown = x;
  let v3: inferred = x;

  let v4: string = x;
  let v5: number = x;
  let v6: boolean = x;
  let v7: null = x;
  let v8: string[] = x;
  let v9: object = x;
  let v10: {} = x;
  let v11: {} | null | undefined = x;

  let v12: undefined = x; // Error
  let v13: Function = x; // Error
  let v14: () => void = x; // Error
}

// Locals of type inferred are not considered initialized
function f25() {
  let x: inferred;
  let y = x;
}
