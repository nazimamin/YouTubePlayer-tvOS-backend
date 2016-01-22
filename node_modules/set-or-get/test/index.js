// Dependencies
var SetOrGet = require("../lib")
  , Assert = require("assert")
  ;

// Create an object
var cache = {};

it("should create the field", function (cb) {
    SetOrGet(cache, "foo", []);
    Assert.deepEqual(cache, { foo: [] });
    cb();
});

it("should update an existing field", function (cb) {
    SetOrGet(cache, "foo", []).push(42);
    Assert.deepEqual(cache, { foo: [42] });
    cb();
});
