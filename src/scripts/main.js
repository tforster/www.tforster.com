document.addEventListener("DOMContentLoaded", async () => {
  // While we can toggle the nav with CSS only, it won't be as accessible as JS
  document.getElementById("mobile-nav-toggle").addEventListener("click", (e) => {
    e.preventDefault();
    // Toggle the hamburger icon between bars and X
    e.target.classList.toggle("is-clicked");
    // Toggle the menu between closed and open
    document.querySelector("body").classList.toggle("menu-is-open");
  });
});
