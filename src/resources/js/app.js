"use strict";

/**
 * CONSTRUCTOR
 *
 */
function Tforster() {
  this.globalBindings();
}

/**
 * GLOBALBINDINGS
 * - Some bindings common to all pages
 *
 */
Tforster.prototype.globalBindings = function() {
  // Toggle dropdown from hamburger icon
  document.querySelector(".w3-top i.fa-bars").addEventListener("click", function() {
    document.querySelector("#hamburgerMenu").classList.toggle("w3-show");
  });

  // Micro-interaction: hide hamburger menu on menu click before navigating away
  document.querySelectorAll("#hamburgerMenu a").forEach(function(a) {
    a.addEventListener("click", function() {
      document.querySelector("#hamburgerMenu").classList.remove("w3-show");
    });
  });
};

/**
 * TOGGLENAV
 * - Toggles the current-menu-item class to indicate which is the selected navigation item
 *
 */
Tforster.prototype.toggleNav = function() {
  const bodyClassList = document.querySelector("body").classList;
  if (bodyClassList.length > 0) {
    const bodyClass = bodyClassList[0];
    document.querySelector('.pi-mega-fw a[href="' + bodyClass + '.html"]').parentNode.classList.add("current-menu-item");
  }
};
(function() {
  if (document.readyState != "loading") {
    new Tforster();
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      new Tforster();
    });
  }
})();
