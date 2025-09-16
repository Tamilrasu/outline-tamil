const editor = document.getElementById("editor");
const toolbar = document.getElementById("text-toolbar");
const boldBtn = toolbar.querySelector(".bold-btn");
const italicBtn = toolbar.querySelector(".italic-btn");
const underlineBtn = toolbar.querySelector(".underline-btn");
const strikeBtn = toolbar.querySelector(".strike-btn");
const highlightBtn = document.querySelector(".highlight-btn");
const colorList = highlightBtn.querySelector(".color-list-body");
const colorItems = colorList.querySelectorAll(".color-list-item");

// Bold
function makeBold() {
  document.execCommand("bold", false, null);
  updateToolbarState()
}

// Italic
function makeItalic() {
  document.execCommand("italic", false, null);
  updateToolbarState()
}

// Underline
function makeUnderline() {
  document.execCommand("underline", false, null);
  updateToolbarState()
}

// Strikethrough
function makeStrike() {
  document.execCommand("strikeThrough", false, null);
  updateToolbarState()
}

// Highlight dropdown open/close
function makeHighlight(e) {
  e.stopPropagation();

  colorList.style.display = (colorList.style.display === "block") ? "none" : "block";

  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const color = getHighlightColor(sel.anchorNode);

  const noneItem = [...colorItems].find(item => 
    item.querySelector(".color-list-item-color-name").textContent.trim() === "none"
  );

  if (color) {
    noneItem.style.display = "flex"; 
  } else {
    noneItem.style.display = "none"; 
  }
}

//  Apply highlight 
function applyHighlight(color) {
  if (color === "none") {
    document.execCommand("backColor", false, "transparent");
    highlightBtn.style.backgroundColor = "";
  } else {
    document.execCommand("backColor", false, color);
    highlightBtn.style.backgroundColor = color;
  }
}

// Select color from dropdown
colorItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    const colorName = item.querySelector(".color-list-item-color-name").textContent.trim();
    let color = "none";

    if (colorName !== "none") {

      if(colorName === "conal") {
        color = "rgba(253, 234, 155, 0.4)"
      }
      else if (colorName  ==="apricot") {
        color = "rgba(254, 212, 106, 0.4)"
      }
      else if (colorName  ==="sunset") {
        color = "rgba(250, 85, 30, 0.4)"
      }
      else if (colorName  ==="smoothie") {
        color = "rgba(180, 220, 25, 0.4)"
      }
      else if (colorName  === "bubblegum") {
        color = "rgba(200, 175, 240, 0.4)"
      }
      else if (colorName  === "neon") {
        color = "rgba(60, 190, 252, 0.4)"
      }
      else if (colorName  === "none") {
        color = "transparent"
      }
    }

    applyHighlight(color);

    colorList.style.display = "none";
  });
});

// Get highlight color of selected text
function getHighlightColor(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        return bg;
      }
    }
    node = node.parentElement;
  }
  return "";
}

// Update toolbar button states
function updateToolbarState() {
  boldBtn.classList.toggle("active", document.queryCommandState("bold"));
  italicBtn.classList.toggle("active", document.queryCommandState("italic"));
  underlineBtn.classList.toggle("active", document.queryCommandState("underline"));
  strikeBtn.classList.toggle("active", document.queryCommandState("strikeThrough"));

  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const color = getHighlightColor(sel.anchorNode);
    highlightBtn.style.backgroundColor = color;
  }
}

// Show toolbar at selection
function callShowToolbar () {
  setTimeout(() => {
    showToolbar();
  }, 0); 
};

function showToolbar() {
  const selection = window.getSelection();

  // No selection -> hide toolbar
  if (!selection.rangeCount || selection.isCollapsed) {
    toolbar.style.display = "none";
    return;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  if (!rects.length) {
    toolbar.style.display = "none";
    return;
  }

  const rect = rects[0];

  toolbar.style.display = "flex";

  requestAnimationFrame(() => {
    const tbRect = toolbar.getBoundingClientRect();
    let top = rect.top - tbRect.height - 8; 
    if (top < 8) {
      top = rect.bottom + 8; 
    }

    let left = rect.left + rect.width / 2 - tbRect.width / 2;
    const maxLeft = window.innerWidth - tbRect.width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    toolbar.style.top = `${top}px`;  
    toolbar.style.left = `${left}px`;

    updateToolbarState();
  });
}

// window resize 
window.addEventListener("resize", callShowToolbar);

// keyboard changes 
document.addEventListener("selectionchange", () => {
  if (document.activeElement === editor) callShowToolbar();
});


// outside editor
document.addEventListener("click", (e) => {
  if (!editor.contains(e.target) && !toolbar.contains(e.target)) {
    toolbar.style.display = "none";
  }
  colorList.style.display = "none";
});
