Utils = function () { };

Utils.prototype.exists = function (value, otherwise) {
   if (typeof (otherwise) === "undefined") {
      return "Parameter otherwise was not defined.";
   }
   else {
      return ((typeof (value) !== "undefined") && (value)) ? value : otherwise;
   }
}

Utils.prototype.Sluggify = function (title) {
   return title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

Utils.prototype.test = function (callback) {
   console.log("TEST");
};


exports.Utils = Utils;