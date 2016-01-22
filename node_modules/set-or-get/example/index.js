// Dependencies
var SetOrGet = require("../lib");

// Create an object
var cache = {};

SetOrGet(cache, "foo", []).push(42);
// { foo: [42] }

SetOrGet(cache, "bar", {}).baz = 42;
// { foo: [42], bar: { baz: 42 } }

SetOrGet(cache, "foo", []).push(7);
// { foo: [42, 7], bar: { baz: 42 } }


console.log(cache);
// =>
// {
//   foo: [42, 7]
// , bar: { baz: 42 }
// }
