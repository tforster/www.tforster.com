/**
 * supports.js: es5 code to test for specific es6+ features used by www.tforster.com app
 * - writes corresponding class names into html element for positive results only
 * - safely uses eval inside an IIF
 * - tests are contained within the object parameter passed into the IIF
 * - tests are expressed as strings as required by eval, therefore written to be as 
 *   short and concise as possible since minification will not reach inside strings
 * - class names inspired by Modernizr (credit)
 */
(function (tests) {
  'use strict';
  for (var test in tests) {
    if (supports(tests[test])) {
      document.querySelector('html').classList.add(test);
    } else {
      document.querySelector('html').classList.add('no-' + test);
    }
  }

  function supports(test) {
    try {
      eval(test);
      return true;
    }
    catch (err) {
      return false;
    }
  }
}({
  'let': 'let a;',
  'const': 'const a=0;',
  'class': 'class c{}',
  'arrow': '()=>{}',
  'templateLiteral': 'var s=``'
}));
