# Fork Details
This is a fork of the TypeScript compiler adding support for an inferred variable type `Q`, used for automatically determining the shape for a database query.

## Behavior of `Q`

It is intended that `Q` be introduced as the return type of a query function, i.e. `const res: Promise<Q> = query('https://example.com/json')`.  
We determine the proper shape of `Q` at runtime through type inference:
1. If we assign `Q` to a variable of type `T`, then we can infer/constrain that `Q` must be assignable to `T`  
    `const res: string = await query('...')` implies that the query will return a string
2. If we use dot notation to access a property `p` on `Q`, then we infer that a property `p` exists on `Q`  
    If we have a `q : Q`, then `const r = q.p` implies `r : Q` and `q : Q & { p: Q }`  
    Combining this with property 1, `const r: string = q.p` implies `q : Q & { p: string }`
3. `Q` must only be a JSON compatible type, i.e. classes, functions, and other stateful objects are not supported  
    Because of this, if we call a method such as `map` on a variable `a : Q`, then we can infer that `Q` must be an array,
    since the only JSON type with a `map` method is an array

`Q` can be thought as an opt-in top type to enable Hindley-Damas-Milner type inference?

## Examples
We use the symbols `<:` and `:>` to denote upper and lower type bounds respectively.
```typescript
const res = await query('...')
```
`res` has some unknown type `α <: Q`
```typescript
const blah = res.bar
```
now we know that `α :> { bar: β }`, where `β <: Q`
```typescript
declare const add(x: number, y: number): number
add(blah, 5)
```
Because `blah: β` is used in a position requiring a number, we know
`β :> number`, and consequently `α :> { bar: number }`
```typescript
res.foo.map(x => add(x, 1))
```
This is a more complicated example:
First we see that the `foo` property is accessed, so we know
`γ <: Q, α :> { bar: number, foo: γ }`  
Next the `map` method is called so we know
`δ <: Q, γ :> Array<δ>`, and `x: δ` in the lambda function. An array is the only option
because we know that `Q` must be a valid JSON type and so must not contain arbitrary
functions.  
Finally, `δ` is constrained by `add`, so we know `δ :> number, γ :> Array<number>`
and consequently `α :> { bar: number, foo: Array<number> }`
```typescript
declare const fn1(x: string)
declare const fn2(x: string)

fn1(res.baz)
fn2(res.baz)
```
Here we pass the same type into two functions taking different types.  
We know at first that `ε <: Q, α :> { bar: number, foo: Array<number>, baz: ε }`  
By passing `ε` into a function taking type `number`, we restrict `ε` to at least `number`, or `ε :> number`.  
However, on the next line we pass `ε` into a function taking a `string`.  
This means that `ε` must be restricted to some more general type which
is the supertype of both `string` and `number`, so `ε :> string & number`.  
Finally, `α :> { bar: number, foo: Array<number>, baz: string & number }`.
```typescript
if (typeof res.qux === 'string') {
    // do something with res.qux
} else {
    add(res.qux, 5)
}
```
Here we have an example of a subtype which can be a union.  
We introduce the type variable `ζ <: Q`, and restrict alpha `α :> { bar: number, foo: Array<number>, baz: string & number, qux: ζ }`.  
We have an if statement which splits the minimum type of `ζ` into two possibilities.  
In the true branch, we know that `ζ :> string`, since the `typeof` check restricts to strings.  
In the false branch, we don't know any information initially, but the call to `add` restricts `ζ :> number`.  
Finally, at the end of the if statement we can union the two possibilities to get the full minimum type: `ζ :> number | string`, so `α :> { bar: number, foo: Array<number>, baz: string & number, qux: string | number }`.

Type assertions should also introduce minimum bounds.
```typescript
const x = (res as { quux: string }).quux
```
This restricts `res` to have a minimum of `{ quux: string }`, which combines with the
other restrictions on `res` to make `α :> { bar: number, foo: Array<number>, baz: string & number, qux: string | number } & { quux: string }`

At the end of typechecking, we should have a fully constructed minimum bound type for
`α`, which was introduced by our query call. We write that type to a file as part of
compiling, and send it along with the query at runtime, so that the database knows
what the minimum type bound is and can send back data fitting the proper shape.

This does break one of TypeScript's core rules, which is `no type-directed emit`,
so there is no chance that this gets merged into master. However, it is conceivable
that a compiler plugin or external tool can read the final type of the query variable
and emit that type to a file.

## Edge Cases
In some cases it is hard to determine whether a property access is an array or just
an object with a numeric property:
```typescript
declare const foo: Q
const x = foo[0] // is foo an Array<Q>, or is it an object { 0: Q }
```
There are two options here: we could use the strict interpretation and say that
`β <: Q, α <: Q, β :> { 0: α }, foo: β`, or we could take the interpretation that would be more useful for the imperative programmer, and say `β <: Q, α <: Q, β :> Array<α>, foo: β`. Ideally this would be a compiler flag.  
Alternatively the user could be required to use a type assertion: `const x = (foo as Array<Q>)[0]` or `const x = (foo as { 0: Q })[0]`, or `const x = (foo as [Q])[0]`.  
There are similar cases in regular TypeScript for tuples vs arrays, so we should endeavor to match that behavior.

## Implimentation Ideas
1. Add a new top type `Q` (the actual keyword may differ), which behaves similar to `any`
2. The typescript compiler should produce a program graph with types as part of the compilation/typechecking process (not sure if explicit), so we can rely on using that.
3. we can use some internal methods (such as `symbolWalker` and `visitType`) to traverse and extract the section of the program that deals with symbols/expressions/statements of type `Q`
4. After we have our own subgraph of just the relevant program, we apply some algorithm to determine what each instance of `Q` should be,
and build up the final types.

Or we can go out of band using a program like ANTLR or Babel to statically analyze typescript source code. The problem with doing this is that we would have to analyze the entire program and construct our own program graph. This would mean reimplementing a lot of typescript's type system.

The problem with modifying TypeScript's compiler is that it is absolutely huge, and there is no public documentation on how to modify or add to it.

## References
+ https://github.com/masaeedu/TypeScript - adds basic type inference for function parameters
+ https://github.com/microsoft/TypeScript/issues/15114 - discussion on adding type inference for function params
+ https://github.com/muon52/TypeScript - adds `const` lifetime annotation
+ https://github.com/microsoft/TypeScript/pull/24439 - adds `unknown` type. Good reference for adding new type keyword and checker rules

## Notes on adding new types
### Important functions in `checker.ts`
+ `getUnionType` :: gets the type of a union from flags and type array
+ `addTypeToUnion` :: adds a type to a union
+ `addTypeToIntersection` :: adds a type to an intersection
+ `getIntersectionType` :: gets the type
of an intersection from type array
+ `isSimpleTypeRelatedTo`, `isTypeRelatedTo` :: allows checking if two types are related using some relation (such as identity - they are equal or equivalent, subtype, strict subtype, assignable, comparable)
### Things to look for in `checker.ts`
+ `TypeFlags.Any`
+ `anyType`
+ `TypeFlags.AnyOrUnknown` :: common behavior between any and unknown types, which our inferred type will share



# TypeScript

[![Build Status](https://travis-ci.org/microsoft/TypeScript.svg?branch=master)](https://travis-ci.org/microsoft/TypeScript)
[![VSTS Build Status](https://dev.azure.com/typescript/TypeScript/_apis/build/status/Typescript/node10)](https://dev.azure.com/typescript/TypeScript/_build/latest?definitionId=4&view=logs)
[![npm version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/typescript)
[![Downloads](https://img.shields.io/npm/dm/typescript.svg)](https://www.npmjs.com/package/typescript)

[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript. TypeScript adds optional types to JavaScript that support tools for large-scale JavaScript applications for any browser, for any host, on any OS. TypeScript compiles to readable, standards-based JavaScript. Try it out at the [playground](https://www.typescriptlang.org/play/), and stay up to date via [our blog](https://blogs.msdn.microsoft.com/typescript) and [Twitter account](https://twitter.com/typescript).

Find others who are using TypeScript at [our community page](https://www.typescriptlang.org/community/).

## Installing

For the latest stable version:

```bash
npm install -g typescript
```

For our nightly builds:

```bash
npm install -g typescript@next
```

## Contribute

There are many ways to [contribute](https://github.com/microsoft/TypeScript/blob/master/CONTRIBUTING.md) to TypeScript.
* [Submit bugs](https://github.com/microsoft/TypeScript/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/microsoft/TypeScript/pulls).
* Engage with other TypeScript users and developers on [StackOverflow](https://stackoverflow.com/questions/tagged/typescript).
* Help each other in the [TypeScript Community Discord](https://discord.gg/typescript).
* Join the [#typescript](https://twitter.com/search?q=%23TypeScript) discussion on Twitter.
* [Contribute bug fixes](https://github.com/microsoft/TypeScript/blob/master/CONTRIBUTING.md).
* Read the language specification ([docx](https://github.com/microsoft/TypeScript/blob/master/doc/TypeScript%20Language%20Specification.docx?raw=true),
 [pdf](https://github.com/microsoft/TypeScript/blob/master/doc/TypeScript%20Language%20Specification.pdf?raw=true), [md](https://github.com/microsoft/TypeScript/blob/master/doc/spec.md)).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.

## Documentation

*  [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
*  [Programming handbook](https://www.typescriptlang.org/docs/handbook/basic-types.html)
*  [Language specification](https://github.com/microsoft/TypeScript/blob/master/doc/spec.md)
*  [Homepage](https://www.typescriptlang.org/)

## Building

In order to build the TypeScript compiler, ensure that you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/) installed.

Clone a copy of the repo:

```bash
git clone https://github.com/microsoft/TypeScript.git
```

Change to the TypeScript directory:

```bash
cd TypeScript
```

Install [Gulp](https://gulpjs.com/) tools and dev dependencies:

```bash
npm install -g gulp
npm install
```

Use one of the following to build and test:

```
gulp local             # Build the compiler into built/local.
gulp clean             # Delete the built compiler.
gulp LKG               # Replace the last known good with the built one.
                       # Bootstrapping step to be executed when the built compiler reaches a stable state.
gulp tests             # Build the test infrastructure using the built compiler.
gulp runtests          # Run tests using the built compiler and test infrastructure.
                       # Some low-value tests are skipped when not on a CI machine - you can use the
                       # --skipPercent=0 command to override this behavior and run all tests locally.
                       # You can override the specific suite runner used or specify a test for this command.
                       # Use --tests=<testPath> for a specific test and/or --runner=<runnerName> for a specific suite.
                       # Valid runners include conformance, compiler, fourslash, project, user, and docker
                       # The user and docker runners are extended test suite runners - the user runner
                       # works on disk in the tests/cases/user directory, while the docker runner works in containers.
                       # You'll need to have the docker executable in your system path for the docker runner to work.
gulp runtests-parallel # Like runtests, but split across multiple threads. Uses a number of threads equal to the system
                       # core count by default. Use --workers=<number> to adjust this.
gulp baseline-accept   # This replaces the baseline test results with the results obtained from gulp runtests.
gulp lint              # Runs eslint on the TypeScript source.
gulp help              # List the above commands.
```


## Usage

```bash
node built/local/tsc.js hello.ts
```


## Roadmap

For details on our planned features and future direction please refer to our [roadmap](https://github.com/microsoft/TypeScript/wiki/Roadmap).
