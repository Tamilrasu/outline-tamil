const editor = document.getElementById("editor");
const toolbar = document.getElementById("text-toolbar");
const boldBtn = toolbar.querySelector(".bold-btn");



// function makeBold() {
//   document.execCommand("bold", false, null);
//   updateToolbarState()
// }


// function updateToolbarState() {
//   boldBtn.classList.toggle("active", document.queryCommandState("bold"));
// }

function makeBold() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const parent = selection.anchorNode.parentElement;

  // Case 1: Already inside <b> → unwrap only that selection
  const boldEl = parent.closest("b,strong");
  if (boldEl) {
    // Extract the contents from <b>
    const frag = range.extractContents();
    boldEl.replaceWith(frag);

    // Reset selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(frag);
    selection.addRange(newRange);
  } 
  // Case 2: Not bold → wrap
  else {
    const strong = document.createElement("b");
    const contents = range.extractContents(); 
    strong.appendChild(contents);
    range.insertNode(strong);

    // Reset selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(strong);
    selection.addRange(newRange);
  }

  updateToolbarState();
}

function updateToolbarState() {
  const selection = window.getSelection();
  let isBold = false;

  if (selection.rangeCount > 0) {
    let node = selection.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    if (node) {
      isBold = node.closest("b,strong") !== null;
    }
  }

  boldBtn.classList.toggle("active", isBold);
}


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

  const rect = rects[0]; // selection box (viewport coords)

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

// Recalculate on window resize (viewport size changes)
window.addEventListener("resize", callShowToolbar);

// Track selection changes (keyboard selection, etc.)
document.addEventListener("selectionchange", () => {
  if (document.activeElement === editor) callShowToolbar();
});


// hide toolbar when click outside editor
document.addEventListener("click", (e) => {
  if (!editor.contains(e.target) && !toolbar.contains(e.target)) {
    toolbar.style.display = "none";
  }
});


