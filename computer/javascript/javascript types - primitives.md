## primitive types
javascript primitive types based on specification:
1. **`undefined`**
	- one value `undefined`.
	- represents a variable that's declared but not assigned.
2. **`null`**
	- single value `null`. 
	- used to intentionally indicate "no value".
	- due to a historical bug, typeof null returns "object", but it's a primitive.
3. **`boolean`**
	- `true` and `false` value.
	- commonly used in logical operations.
4. **`number`**
	- covers all numeric values, like `42`, `3.14`, `Infinity`, and `NaN` (Not a Number).
	- numbers follow the IEEE 754 standard, meaning they're floating-point.
	- special cases: `NaN` and `-0` (negative zero).
5. **`bigint`**
	- a newer primitive for large integers (e.g., 123n).
	- unlike `Number`, `BigInt` can grow almost infinitely large (limited by system memory).
	- it's separate from `Number`, so `42n !== 42`.
	- use it for precise calculations with huge numbers.
6. **`string`**
	- text values, like `"hello"` or `'world'`.
7. **`symbol`**
	- introduced in ES6, symbols are unique identifiers (e.g., `Symbol('id')`).
	- often used as "hidden" keys in objects, common in frameworks but rare in everyday code.
8. **`object`**
	- the only non-primitive type here, objects are collections of key-value pairs.
	- include subtypes like arrays, functions, and more.
### subtypes and special cases
some values act like types but are **subtypes** of objects:
- **functions**: callable objects that can be invoked with `()`.
	- for example: `function myFunc() {}` can be called as `myFunc()`.
- **arrays**: objects with numeric indices and an auto-updating `length` property.
	- for example: `let arr = [1, 2, 3]; arr.push(4);` sets `arr.length` to 4. 
### special values in numbers
- **NaN (Not a Number)**
	- represents an invalid number, not "not a number".
	- for example: `"abc" - 5` yields `NaN` because it's not a valid numeric operation.
	- surprisingly, `NaN !== NaN` due to the IEEE 754 spec, so `===` can't test for it.
	- use `Number.isNaN(x)` to check if a value is `NaN` without coercion.
- **Negative Zero (-0)**
	- a distinct value from 0, where the sign bit is set.
	- mathematicians might scoff, but it's real in IEEE 754. early JavaScript hid it, so `toString()` on `-0` returns `"0"`, and `0 === -0` is true.
	- use `Object.is(-0, x)` to detect it.
	- why? it's useful for tracking direction. 
		- for example: in a game, `-0` can indicate a car stopped while facing left.
	- the `Math.sign()` function is flawed. it returns `-0` for negative zero, not `-1`.
	- stringifying a negative zero, `toString()` will convert it to a regular '0' without showing the negative sign.
### kinds of emptiness
JavaScript three distinct empty states:
- **undefined**: 
	- a variable exists but has no value. 
	- for example: `let x; typeof x` returns `"undefined"`. 
	- it's a deliberate state, not `undeclared`.
- **undeclared**: 
	- a variable that doesn't exist in any scope. 
	- accessing it throws a `ReferenceError`, but `typeof nonExistentVar` returns `"undefined"` (a historical quirk). it should've returned `"undeclared"`.
- **uninitialized (Temporal Dead Zone)** 
	- introduced in ES6, block-scoped variables (e.g., `let` or `const` in a block) are uninitialized until their declaration.
	- accessing them before initialization throws a `ReferenceError`.
	- for example:
```js
{ // Start of block
  console.log(x); // ReferenceError: x is not defined (TDZ)
  let x = 42;
}
```
### fundamental objects
JavaScript has **fundamental objects**, sometimes called built-in or native objects.
- **`Object`, `Array`, `Function`, `Date`, `RegExp`, `Error`**
	- use these with new, like new `Date()` for dates, since there's no date literal. 
- **`String`, `Number`, `Boolean`**
	- these can be used with new, but don't. they create objects that behave oddly. 
	- instead, use them as functions for coercion (e.g., `String(42)` returns `"42"`).
### the `typeof` operator
```js
let v;
typeof v; // "undefined"
v = "hello";
typeof v; // "string"
v = 42;
typeof v; // "number"
v = null;
typeof v; // "object" (historical bug!)
v = [1, 2, 3];
typeof v; // "object"
v = function() {};
typeof v; // "function"
v = 123n;
typeof v; // "bigint"
```
- `typeof` always returns a string from a fixed list: `"undefined"`, `"null"`, `"boolean"`, `"number"`, `"bigint"`, `"string"`, `"symbol"`, `"object"`, or `"function"`.
- it's safe. it doesn't throw errors for undeclared variables (returns `"undefined"`).
- for arrays, use `Array.isArray(v)` to distinguish them from objects.
- watch out for typeof null returning `"object"`.
### why types matter
- types define a value’s behavior. 
	- for example, numbers support arithmetic `(42 + 1)`, while strings allow character access (`"hello"[1]` gives `"e"`). 
	- JavaScript is **dynamically typed** (types belong to values, not variables). so, let `x = 42; x = "hello";` is valid.
	- this flexibility is powerful but requires understanding types to avoid bugs.
- the `"everything is an object"` myth stems from **boxing**, where primitives temporarily act like objects (e.g., `"hello".toUpperCase()`). 
	- `true`, `42`, or `"hello"` are primitives, not objects. knowing the spec clarifies these behaviors.