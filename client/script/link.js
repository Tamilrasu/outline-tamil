const editor = document.getElementById("editor");
const toolbar = document.getElementById("text-toolbar");

const boldBtn = toolbar.querySelector(".bold-btn");
const italicBtn = toolbar.querySelector(".italic-btn");
const underlineBtn = toolbar.querySelector(".underline-btn");
const strikeBtn = toolbar.querySelector(".strike-btn");
const highlightBtn = document.querySelector(".highlight-btn");
const linkBtn = toolbar.querySelector(".link-btn");

// 
const linkBody = document.getElementById("text-link-body");
const linkNavigateBtn = document.getElementById("link-navigate-btn");
const urlInputField = linkBody.querySelector(".text-link-url-input");

// Bold
function makeBold() {
  document.execCommand("bold", false, null);
  updateToolbarState()
}


// Show the link input popup
function openLinkInput() {

    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0);
    }

    toolbar.style.display = "none";
    showLinkBody();
}

// Close the link popup and remove the link
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

// -----------------------------------------------------------------

// Update toolbar button states
function updateToolbarState() {
  boldBtn.classList.toggle("active", document.queryCommandState("bold"));
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

// Window resize la link body position update
window.addEventListener("resize", () => {
  if (linkBody.style.display === "flex") {
    callShowLinkBody();
  }
});

// Selection change la link body position update
document.addEventListener("selectionchange", () => {
  if (document.activeElement === editor && linkBody.style.display === "flex") {
    callShowLinkBody();
  }
});


// window resize 
window.addEventListener("resize", callShowToolbar);

// keyboard changes 
document.addEventListener("selectionchange", () => {
  if (document.activeElement === editor) callShowToolbar();
});


// outside editor
document.addEventListener("click", (e) => {
    
  //  Toolbar
  if (!editor.contains(e.target) && !toolbar.contains(e.target)) {
    toolbar.style.display = "none";
  }

  //  linkBody 
  if (linkBody.style.display === "flex" && !linkBody.contains(e.target) && !editor.contains(e.target) && !toolbar.contains(e.target)) {
    linkBody.style.display = "none";
  }
  
});

// When page scrolls, update linkBody position if it’s visible
window.addEventListener("scroll", () => {
  if (linkBody.style.display === "flex") {
    callShowLinkBody();
  }
}, true);