angular.module('indexBlogFilters', []).filter('type', function () {
   
   return function (input) {
      console.log(a);
      return input ? '\u2713' : '\u2718';
   };
});