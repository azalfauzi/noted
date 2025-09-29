## `==` and `===`
-  `==` (loose equality) checks just the value, while `===` (strict equality) checks both value and type. 
- both operators check types, but they handle differences differently. 
### same types
- suppose we have two strings: `let a = "42"; let b = "42";`. 
	- `a == b` → `true`
	- `a === b` → `true`
- when the types match (both are strings), `==` behaves exactly like `===`.
### different types
- `let a = 42; let b = "42";` (a number and a string).
	- `a === b` → `false` (different types, so it stops and returns false).
	- `a == b` → `true`
- `==` allows coercion, meaning it converts one or both values to a common type before comparing.
	- the string `"42"` becomes the number `42`, and then `42 == 42` is `true`.
## how does `==` work? 
the double equals (`==`) follows a specific algorithm from the JavaScript spec.
1. **same types**: if both values are the same type, `==` uses `===`. 
	- no coercion needed. 
	- for example, `"hello" == "hello"` is true because they're both strings.
2. **null and undefined**: if one value is null and the other is undefined, they're equal (true). 
	- for example, `null == undefine`d is `true`. 
	- they're like JavaScript's two empty values, treated as interchangeable by `==`. 
	- nothing else equals `null` or `undefined`.
3. **non-primitives (objects, arrays)**: if you compare a non-primitive (like an array or object) with something else, `==` converts the non-primitive to a primitive using the ToPrimitive operation.
	- for example, an array `["42"]` becomes the string `"42"`, which might then become the number `42` for comparison.
4. **preference for numbers**: when comparing primitives of different types (e.g., string vs. number, or Boolean vs. string), `==` prefers to convert both to numbers. for example:
	- `"42" == 42`: the string `"42"` becomes the number `42`, so `true`.
	- `true == 1`: the Boolean true becomes the number `1`, so `true`.
	- `false == 0`: the Boolean false becomes the number `0`, so `true`.
5. **recursive process**: if the types don't match initially, `==` may convert values and re-run the comparison until it's comparing two primitives of the same type or determines they're not equal.
## the case for `==` when you know the types
the following cases, according to Kyle Simpson, are preferable to use `==`.
- **when types match**
	- if you know both values are the same type (e.g., both strings or both numbers), `==` and `===` are identical.
	- use `==` because it is shorter and just as clear.
- **when types differ (but are known)**
	- if you know one value is a number and the other is a string, and you want them to be compared (e.g., user input "42" vs. number 42), `==` handles the coercion for you.
	- `===` requires manual conversion, like `Number(b) === a`. more code and potentially slower.
- **better code through type awareness**
	- good code makes types obvious.
	- if you structure your code so you know `a` is a number and `b` is a string or number, `==` is safe and expressive.
- **null/undefined checks**
	- common use case for checking for empty values.
	- `x == null` checks if `x` is either `null` or `undefined`, concise and clear.
## corner cases to avoid with `==`
1. **avoid `==` with `0`, `""`, or whitespace strings**
	- `0 == ""` is true because both convert to the number 0. This can be unexpected.
	- `" " == 0` is true (whitespace string becomes 0).
	- **solution**: use `===` or ensure types are clear. 
		- for example, check if a string is empty with `str.length === 0`.
2. **don't use == with non-primitives**
	- comparing an array or object with `==` triggers ToPrimitive, which can lead to weird results. 
	- for example, `[] == ""` is `true` because the array becomes an empty string, then `0`, and compares to `0`.
	- **solution**: avoid comparing non-primitives with `==`. if you need to compare arrays or objects, check their identity (`===`) or use specific properties (e.g., `arr.length === 0`).
3. **never use `== true` or `== false`**
	- `[] == false` is `true` (array becomes `""`, then `0`, which equals false as `0`). But `[] == true` is `false`, which is confusing since arrays are truthy.
	- **solution**: use implicit `Boolean` coercion in if statements (e.g., `if (arr)` for truthy checks) or `===` for exact `Boolean` matches.
4. **avoid nonsensical comparisons**
	- `42 == [42]` works (`true`) because the array becomes `"42"`, then `42`. but this comparison doesn't make sense in real code.
	- **solution**: design code to compare similar types (e.g., extract the number from the array first).
## when to use `===`
- if you don't know the types of the values, `===` is safer. it prevents unexpected coercions. 
- using `===` signals to readers, "I'm unsure about types, so I'm being strict to avoid surprises."
- ideally, refactor your code to make types clear, reducing the need for `===`.