

// Right Click Disable
document.addEventListener("contextmenu", e => e.preventDefault());

// DevTools Detect
setInterval(() => {
  if (window.outerWidth - window.innerWidth > 150) {
    document.body.innerHTML = "⚠ Developer Tools Detected";
  }
}, 1000);

// Block F12
document.onkeydown = function(e){
  if (e.keyCode === 123) return false;
};