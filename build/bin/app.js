tforster.saveRFI = function (e) {
   e.preventDefault();
   var data = {
      name: document.getElementById("name").value,
      establishment: document.getElementById("establishment").value,
      email: document.getElementById("email").value,
      telephone: document.getElementById("telephone").value,
      message: document.getElementById("message").value,
      brand: tforster.brand
   };
   
   var request = new XMLHttpRequest(); 
   request.open("POST", "/api/request-for-information", true);
   request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
   request.send(JSON.stringify(data));
   request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
         data = JSON.parse(request.responseText);
         if (data.success) {
            console.log("success");
         }
         else {
            console.error("failed");
         }
      } 
      else {
         console.error("failed");
      }
   };
   
   request.onerror = function (err) {
      console.error(err);
   };
};

document.addEventListener("DOMContentLoaded", function () {
   // Do page specific binding here
});