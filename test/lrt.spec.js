const Lrt = require("../src/js/lrt.js");

describe("LRT framework suite", () => {

  test("Should returns an object", () => {
    let obj = new Lrt({ handleBackButton: true });
    expect(typeof (obj)).toBe('object');
  });
});


