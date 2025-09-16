const body = document.body;
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const icons = document.querySelectorAll('.outline-icon');
const themeIcon = document.querySelector(".document_sidebar_header_img");
const modeBody = document.querySelector(".document_mode_body");

let currentTheme = 'system';

// // --- open / close modeBody ---
function toggleModeBody () {
  modeBody.classList.toggle("show")
}

function updateIcons(mode) {
  icons.forEach(icon => {
    if (mode === 'dark') {
      icon.src = icon.dataset.dark;
    } else if (mode === 'light') {
      icon.src = icon.dataset.light;
    } else { // system
      icon.src = mq.matches
        ? icon.dataset.dark
        : icon.dataset.light;
    }
  });
}

function setTheme(mode) {
  currentTheme = mode;

  if (mode === 'dark') {
    body.classList.add('dark-mode');
  } else if (mode === 'light') {
    body.classList.remove('dark-mode');
  } else {
    mq.matches
      ? body.classList.add('dark-mode')
      : body.classList.remove('dark-mode');
  }

  updateIcons(mode);  
}

mq.addEventListener('change', () => {
  if (currentTheme === 'system') {
    setTheme('system');
  }
});

setTheme('system');


// outside click -> close
document.addEventListener("click", function (e) {
  const clickedInside =
    modeBody.contains(e.target) || themeIcon.contains(e.target);

  if (!clickedInside) {
    modeBody.classList.remove("show");
  }
});

// // ---- Theme handler ----
// const body = document.body;
// const themeIcon = document.querySelector(".document_sidebar_header_img");
// const modeBody = document.querySelector(".document_mode_body");
// const mq = window.matchMedia('(prefers-color-scheme: dark)');
// let currentMode = "system";
// const allIcons = document.querySelectorAll('.outline-icon');


// applyTheme(currentMode);

// // --- open / close modeBody ---
// function toggleModeBody () {
//   modeBody.classList.toggle("show")
// }

// // --- buttons click ---
// function setTheme(mode) {
//   currentMode = mode;
//   applyTheme(mode);
//   modeBody.classList.remove("show");
// }

// function updateIcons(mode) {
//   allIcons.forEach(icon => {
//     if (mode === 'dark') {
//       icon.src = icon.dataset.dark;
//     } else if (mode === 'light') {
//       icon.src = icon.dataset.light;
//     } else { // system
//       icon.src = mq.matches
//         ? icon.dataset.dark
//         : icon.dataset.light;
//     }
//   });
// }


// // --- main logic ---
// function applyTheme(mode) {
  
//   body.classList.remove("dark-mode"); 

//   if (mode === "dark") {
//     body.classList.add("dark-mode");
//   } else if (mode === "light") {
//   } else if (mode === "system") {
//     const prefersDark = mq.matches;
//     if (prefersDark) {
//       body.classList.add("dark-mode");
//     } 
//   }
//   updateIcons(mode);  
// }

// // --- watch OS theme if user chose system ---
// mq.addEventListener("change", () => {
//   if (currentMode === "system") applyTheme("system");
// });