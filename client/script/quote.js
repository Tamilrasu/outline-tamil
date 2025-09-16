// Elements
const homeBody = document.getElementById('document_home_body');
const writteBody = document.getElementById('document_writte_body');
let editor = document.getElementById("editor");
let menu = document.getElementById("slash-menu");
let savedRange = null;
let currentLine = null;

// Open Writter
function openwritter() {
    homeBody.style.display = 'none';
    writteBody.style.display = 'block';
}

// Open Home
function openhome() {
    writteBody.style.display = 'none';
    homeBody.style.display = 'block';
}

// Show slash menu 
function slashOpen(e) {
  let sel = window.getSelection();
  if (!sel.rangeCount) return;
  let range = sel.getRangeAt(0);

  let node = range.startContainer;  
  let textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || "";

  let line = getLineNode(node);
  if (line && (line.nodeName === "TABLE" || line.nodeName === "#text" || line.nodeName === "BR")) {
    menu.classList.add("hidden");
    return;
  }

  // check if "/" typed
  if (textBefore === "/" || (/\s\/$/.test(textBefore))) {
    // clone range
    savedRange = range.cloneRange();

    // rect
    let rects = range.getClientRects();
    let rect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();

    // window scroll offset
    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    let container = document.querySelector('.document_writte_main'); 

    top = top - container.getBoundingClientRect().top + container.scrollTop;
    left = left - container.getBoundingClientRect().left + container.scrollLeft;

    // apply
    menu.style.position = "absolute";
    menu.style.top = (top + 20) + "px";   
    menu.style.left = (left - 10) + "px"; 
    menu.classList.remove("hidden");

  } else {
    menu.classList.add("hidden");
  }
}

// Insert Heading
function insertHeading(event, tag) {
  event.preventDefault();
  event.stopPropagation();

  if (!savedRange) return;

  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);

  let range = sel.getRangeAt(0);
  let node = range.startContainer;

  // Current parent node
  let parent = node.nodeType === 3 ? node.parentNode : node;

  let text = (parent.innerText || node.textContent || "")
    .replace(/\/$/, "")
    .trim();

  if (parent.tagName && parent.tagName.toLowerCase().startsWith("h")) {
    // Already heading
    if (parent.tagName.toLowerCase() !== tag) {
      let newHeading = document.createElement(tag);
      newHeading.innerText = text || "\u00A0";
      parent.replaceWith(newHeading);
      parent = newHeading;
    } else {
      parent.innerText = text || "\u00A0";
    }
  } else {
    // Not heading → new heading create 
    let h = document.createElement(tag);
    h.innerText = text || "\u00A0";
    parent.replaceWith(h);
    parent = h;
  }
   
  // --- cleanup placeholder ---
  parent.classList.remove("empty");
  parent.removeAttribute("data-placeholder");

  // --- UI cleanup 
  menu.classList.add("hidden");
  plusIcon.style.display = "none";
  currentLine = null;
  savedRange = null;

  // --- Cursor move ---
  let newRange = document.createRange();
  newRange.selectNodeContents(parent);
  newRange.collapse(false);
  sel.removeAllRanges();
  sel.addRange(newRange);
  editor.focus();
}

function isLineTrulyEmpty(line) {
  if (!line.hasChildNodes()) return true;

  if (line.childNodes.length === 1 && line.childNodes[0].nodeName === "BR") {
    return true;
  }

  if (line.childNodes.length === 1 && line.childNodes[0].nodeType === Node.TEXT_NODE) {
    let txt = line.childNodes[0].textContent;
    if (txt === "" || txt === "\u200B") {
      return true; 
    } else {
      return false;
    }
  }

  return false;
}

// Placeholder toggle
function togglePlaceholder() {
  let sel = window.getSelection();
  let currentLine = sel.rangeCount ? getLineNode(sel.focusNode) : null;

  [...editor.childNodes].forEach((line, idx) => {
    if (line.nodeType !== 1) return; 

    if (isLineTrulyEmpty(line)) {
      line.classList.add("empty");
      
      if (line === currentLine || (!currentLine && idx === 0)) {
        line.setAttribute("data-placeholder", "Type '/' to insert, or start writing");
      } else {
        line.removeAttribute("data-placeholder");
      }

    } else {
      line.classList.remove("empty");
      line.removeAttribute("data-placeholder");
    }
  });
}

// Run whenever selection changes (mouse click or arrow keys)
document.addEventListener("selectionchange", () => {
  if (editor.contains(document.activeElement)) {
    togglePlaceholder();
    checkPlusIcon();
  }
});

// ensure editor always has one line
function ensureFirstLine() {
  if (!editor.firstChild) {
    let div = document.createElement("div");
    div.innerHTML = "<br>"; // dummy break
    editor.appendChild(div);
  }
}

// run once on load
ensureFirstLine();
togglePlaceholder();

// Plus icon logic
let plusIcon = document.createElement("span");
plusIcon.innerText = "+";
plusIcon.className = "plus-icon";
document.body.appendChild(plusIcon);

function checkPlusIcon() {
  let sel = window.getSelection();
  if (!sel.rangeCount || !editor.matches(":focus")) {  
    plusIcon.style.display = "none";
    return;
  }

  let line = getLineNode(sel.focusNode);
  if (!line || line === editor) {
    plusIcon.style.display = "none";
    return;
  }
  if (line.nodeType !== 1) {
    line = line.parentElement;
  }

  let range = sel.getRangeAt(0);
  let atLineStart = (range.startOffset === 0);

  if (line.tagName !== "DIV") {
    plusIcon.style.display = "none";
    return;
  }

  if ((line.innerText || "").trim() === "" && atLineStart) {
    let rect = line.getBoundingClientRect();
    plusIcon.style.top = rect.top + window.scrollY + "px";
    plusIcon.style.left = rect.left + window.scrollX - 20 + "px";
    plusIcon.style.display = "block";
    currentLine = line;

    plusIcon.onclick = function (e) {
      e.stopPropagation();
      showSlashMenuAtLine(currentLine);
      editor.classList.remove("empty");
    };
  } else {
    plusIcon.style.display = "none";
  }
}

// Show menu at line
function showSlashMenuAtLine(line) {
  if (!line) return;

  // ensure line is attached to DOM
  if (!line.parentNode) return;

  let rect = line.getBoundingClientRect();
  menu.style.top = rect.bottom + window.scrollY - 50 + "px" ;
  menu.style.left = rect.left + window.scrollX - 250 + "px";
  menu.classList.remove("hidden");

  // update savedRange at start of line
  let range = document.createRange();
  range.setStart(line, 0);
  range.collapse(true);
  savedRange = range;
}

// Hide menu outside click
document.addEventListener("mousedown", (e) => {
  if (e.target !== plusIcon && !menu.contains(e.target)) {
    plusIcon.style.display = "none";
    menu.classList.add("hidden");
  }
});

// Get line node helper
function getLineNode(node) {
  while (node && node !== editor && node.parentNode !== editor) {
    node = node.parentNode;
  }
  if (node === editor) {
    if (!editor.firstChild) {
      let div = document.createElement("div");
      div.innerHTML = "<br>";
      editor.appendChild(div);
      return div;
    }
    return editor.firstChild;
  }
  return node;
}

// Insert Quote
function insertQuote(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!savedRange) return;

  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);

  let range = sel.getRangeAt(0);
  let node = range.startContainer;

  // Current parent node
  let parent = node.nodeType === 3 ? node.parentNode : node;
  
  let text = (parent.innerText || node.textContent || "")
    .replace(/\/$/, "")
    .trim();

  // Replace with blockquote
  let quote = document.createElement("blockquote");
  quote.className = "quote-block"; 
  quote.innerText = text || "\u00A0";
  parent.replaceWith(quote);
  parent = quote;

  // Cleanup UI
  menu.classList.add("hidden");
  plusIcon.style.display = "none";
  currentLine = null;
  savedRange = null;

  // Move cursor to end of blockquote
  let newRange = document.createRange();
  newRange.selectNodeContents(parent);
  newRange.collapse(false);
  sel.removeAllRanges();
  sel.addRange(newRange);
  editor.focus();
}

// Quote Enter Exit Fn
function handleQuoteEnter(e) {
  
  if (e.key === "Enter") {
    let sel = window.getSelection();
    if (!sel.rangeCount) return;

    let node = sel.focusNode;
    let parent = node.nodeType === 3 ? node.parentNode : node;

    // find blockquote parent if inside
    while (parent && parent !== editor && parent.tagName !== "BLOCKQUOTE") {
      parent = parent.parentNode;
    }

    // if inside a blockquote
    if (parent && parent.tagName === "BLOCKQUOTE") {
     
      if ((parent.innerText || "").trim() === "") {
       
        e.preventDefault();
     
        let newLine = document.createElement("div");
        newLine.innerHTML = "<br>";

        // insert after blockquote
        parent.insertAdjacentElement("afterend", newLine);
        
        let range = document.createRange();
        range.setStart(newLine, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        parent.remove();
      }
    }
  }
}


