const editor = document.getElementById("editor");
const toolbar = document.getElementById("text-toolbar");
const boldBtn = toolbar.querySelector(".bold-btn");
const italicBtn = toolbar.querySelector(".italic-btn");
const underlineBtn = toolbar.querySelector(".underline-btn");
const strikeBtn = toolbar.querySelector(".strike-btn");
const highlightBtn = document.querySelector(".highlight-btn");
const colorList = highlightBtn.querySelector(".color-list-body");
const colorItems = colorList.querySelectorAll(".color-list-item");
const supBtn  = toolbar.querySelector(".sup-btn");
const subBtn = toolbar.querySelector(".sub-btn");

let savedRange = null;
let currentLine = null;
let skipRestoreOnce = false;

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

// Superscript
function makeSuperscript() {
  document.execCommand("superscript", false, null);
  updateToolbarState();
}

// Subscript
function makeSubscript() {
  document.execCommand("subscript", false, null);
  updateToolbarState();
}

// Superscript & Subscript Helper functions
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    return sel.getRangeAt(0).cloneRange();
  }
  return null;
}

function restoreSelection(range) {
  
  if (!range) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  savedRange = null
}

editor.addEventListener('input', () => {
  const range = saveSelection();

  setTimeout(() => {
    cleanEditor();

    if (!skipRestoreOnce && range) {  
      restoreSelection(range);
    }

    skipRestoreOnce = false; 
    updateToolbarState();
  }, 0);
});

// Update toolbar button states
function updateToolbarState() {
  boldBtn.classList.toggle("active", document.queryCommandState("bold"));
  italicBtn.classList.toggle("active", document.queryCommandState("italic"));
  underlineBtn.classList.toggle("active", document.queryCommandState("underline"));
  strikeBtn.classList.toggle("active", document.queryCommandState("strikeThrough"));
  supBtn.classList.toggle("active", document.queryCommandState("superscript"));
  subBtn.classList.toggle("active", document.queryCommandState("subscript"));

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

  const anchor = getSelectedAnchor();
  if (anchor) {
    savedRange = selection.getRangeAt(0);
    toolbar.style.display = "none";
    showLinkBody();
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


// Remove empty SUP/SUB/SPAN tags
function cleanEditor() {
  editor.querySelectorAll('sup:empty, sub:empty').forEach(el => el.remove());
  
  editor.querySelectorAll('span').forEach(span => {

    const styleAttr = span.getAttribute('style');

    // Remove empty spans always
    if (!span.textContent.trim()) {
      span.remove();
      return;
    }
    
    if (!styleAttr && span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE) {
      const text = span.textContent;
      const textNode = document.createTextNode(text);
      span.replaceWith(textNode);
    }
    // If completely empty, remove
    if (!span.textContent.trim()) span.remove();
  });
}

//  ------------- Link Text logic ------------------ 

// Link Variables
const linkBody = document.getElementById("text-link-body");
const linkNavigateBtn = document.getElementById("link-navigate-btn");
const urlInputField = linkBody.querySelector(".text-link-url-input");

// Show the link input popup
function openLinkInput() {

    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0);
    }

    toolbar.style.display = "none";
    showLinkBody();
}


function closeLinkBody() {

  linkBody.style.display = "none";

  if (savedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  document.execCommand("unlink");
  callShowToolbar();
}

// Close the link popup, restore selection, and remove the link
function updateNavigateBtnState() {

  const val = urlInputField.value.trim();
  const isEmpty = val === "";

  linkNavigateBtn.disabled = isEmpty;
  linkNavigateBtn.style.opacity = isEmpty ? "0.5" : "1";
  linkNavigateBtn.style.cursor = isEmpty ? "not-allowed" : "pointer";

}

// Initial state of the navigate button
updateNavigateBtnState();

// Open the link
function navigateLink(e) {
  e.preventDefault();

  let url = urlInputField.value.trim();

  if (!url) return; 

  // Add https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  window.open(url, '_blank');
}

// update a link in the editor with the given URL
function insertLink(e) {
  e.preventDefault();

  const urlInput = linkBody.querySelector('.text-link-url-input');
  let url = urlInput.value.trim();
    
  // Add https://  
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  if (savedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  if (url) {
    document.execCommand("createLink", false, url);
    const selection = window.getSelection();
    const anchor = selection.anchorNode.parentElement;
    
    if (anchor && anchor.tagName === "A") {
      anchor.target = "_blank";
    }

  }

  // Clear and close
  urlInput.value = '';
  skipRestoreOnce = true
  closeLinkBody();
}

// Get the <a> tag 
function getSelectedAnchor() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;

  let node = sel.anchorNode;
  if (node.nodeType === 3) node = node.parentElement; 

  return node.closest('a');
}

// Show the link popup 
function showLinkBody() {
  const selection = window.getSelection();
  
  if (!selection.rangeCount || selection.isCollapsed) {
    linkBody.style.display = "none";
    return;
  }
  
  const anchor = getSelectedAnchor();
  const urlInput = linkBody.querySelector('.text-link-url-input');

  if (anchor) {
    urlInput.value = anchor.getAttribute('href') || '';
  } 
  else {
    urlInput.value = '';
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  
  if (!rects.length) {
    linkBody.style.display = "none";
    return;
  }

  const rect = rects[0];
  
  linkBody.style.display = "flex";

  requestAnimationFrame(() => {
    const lbRect = linkBody.getBoundingClientRect();
    let top = rect.top - lbRect.height - 8;
    if (top < 8) {
      top = rect.bottom + 8;
    }

    let left = rect.left + rect.width / 2 - lbRect.width / 2;
    const maxLeft = window.innerWidth - lbRect.width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    linkBody.style.top = `${top}px`;
    linkBody.style.left = `${left}px`;
  });

}

// Open a clicked link in a new tab
function openLink (e)  {
  const link = e.target.closest('a');
  if (link) {
    e.preventDefault();
    window.open(link.href, '_blank');
  }
};

// Show the link popup  at selection
function callShowLinkBody() {
  setTimeout(() => {
    showLinkBody();
  }, 0);
}
