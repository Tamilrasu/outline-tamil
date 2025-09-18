// Elements
const homeBody = document.getElementById('document_home_body');
const writteBody = document.getElementById('document_writte_body');
let editor = document.getElementById("editor");
let menu = document.getElementById("slash-menu");
let savedRange = null;
let currentLine = null;
let skipRestoreOnce = false;

const body = document.body;
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const icons = document.querySelectorAll('.outline-icon');
const themeIcon = document.querySelector(".document_sidebar_header_img");
const modeBody = document.querySelector(".document_mode_body");


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

// ------------------ Helper Functions logic ------------------ 

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

// ------------------ Placeholder logic ------------------ 

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

// Placeholder helper function
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

// ------------------ Plus icon logic ------------------  

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

// ------------------  Slash menu logic ------------------  

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

// Insert List
function insertList(event, type) {
  event.preventDefault();
  event.stopPropagation();

  if (!savedRange) return;
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);

  let range = sel.getRangeAt(0);
  let node = range.startContainer;

  if (node.nodeType !== 3) {
    node = document.createTextNode("");
    range.insertNode(node);
  }

  let fullText = node.textContent;
  let cursorPos = range.startOffset;

  let beforeCursor = fullText.slice(0, cursorPos).replace(/\/$/, "").trim();
  let afterCursor = fullText.slice(cursorPos);

  let list = (type === "ul") ? document.createElement("ul") : document.createElement("ol");

  let li = document.createElement("li");
  li.innerText = beforeCursor || "\u00A0";
  list.appendChild(li);

  let parent = node.parentNode;
  parent.replaceWith(list);

  // --- cleanup placeholder ---
  list.classList.remove("empty");
  list.removeAttribute("data-placeholder");

  if (afterCursor.length > 0) {
    parent.insertBefore(document.createTextNode(afterCursor), list.nextSibling);
  }

  // hide menu
  menu.classList.add("hidden");
  plusIcon.style.display = "none";
  savedRange = null;

  currentLine = li;

  // move cursor into li
  let newRange = document.createRange();
  newRange.selectNodeContents(li);
  newRange.collapse(false);
  sel.removeAllRanges();
  sel.addRange(newRange);

  editor.focus();
}

// Insert Table
function insertTable(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!savedRange) return;

  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);

  // Table element create
  let table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "10px 0";

  // --- Column buttons row (top row) ---
  let colBtnRow = document.createElement("tr");

  // Top-left corner cell (empty corner-btn)
  let corner = document.createElement("td");
  corner.className = "corner-btn";
  corner.setAttribute("contenteditable", "false");
  colBtnRow.appendChild(corner);

  // default 3 col-btn cells
  for (let j = 0; j < 3; j++) {
    let colBtn = document.createElement("td");
    colBtn.className = "col-btn";
    colBtn.setAttribute("contenteditable", "false");
    colBtnRow.appendChild(colBtn);
  }

  // --- Header row (thead) ---
  let thead = document.createElement("thead");
  thead.appendChild(colBtnRow);

  let headRow = document.createElement("tr");

  // left side row-btn (for header row)
  let thBtn = document.createElement("td");
  thBtn.className = "row-btn";
  thBtn.setAttribute("contenteditable", "false");
  headRow.appendChild(thBtn);

  // default 3 header cols
  for (let j = 0; j < 3; j++) {
    let th = document.createElement("th");
    th.innerHTML = "<br>";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // --- Body rows (tbody) ---
  let tbody = document.createElement("tbody");
  for (let i = 0; i < 3; i++) {   // default 3 rows
    let tr = document.createElement("tr");

    // left side row-btn
    let tdBtn = document.createElement("td");
    tdBtn.className = "row-btn";
    tdBtn.setAttribute("contenteditable", "false");
    tr.appendChild(tdBtn);

    // default 3 data cols
    for (let j = 0; j < 3; j++) {
      let td = document.createElement("td");
      td.innerHTML = "<br>";
      // td.style.border = "1px solid var(--gray-dark)";
      td.style.padding = "5px 10px";
      td.style.minWidth = "200px";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Replace node with table
  let range = sel.getRangeAt(0);
  let node = range.startContainer;
  let parent = node.nodeType === 3 ? node.parentNode : node;
  parent.replaceWith(table);

  // cleanup
  menu.classList.add("hidden");
  plusIcon.style.display = "none";
  savedRange = null;

  // Move cursor to first HEADER cell (instead of tbody td)
  let firstHeaderCell = headRow.querySelector("th");
  if (firstHeaderCell) {
    let newRange = document.createRange();
    newRange.selectNodeContents(firstHeaderCell);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  editor.focus();
}

// Table Tab navigation inside tables 
function navigateTableCell(e) {
  if (e.key === "Tab") {
    let sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.anchorNode;

    // find parent td/th
    while (
      node &&
      node.nodeName !== "TD" &&
      node.nodeName !== "TH" &&
      node !== editor
    ) {
      node = node.parentNode;
    }

    if (node && (node.nodeName === "TD" || node.nodeName === "TH")) {
      e.preventDefault();

      let currentCell = node;
      let row = currentCell.parentNode;       // <tr>
      let section = row.parentNode;           // THEAD or TBODY
      let table = section.parentNode;         // <table>
      let targetCell = null;

      if (e.shiftKey) {
        // ---- Shift + Tab = previous cell ----
        targetCell = currentCell.previousElementSibling;

        // skip special cells
        while (
          targetCell &&
          (targetCell.classList.contains("row-btn") ||
            targetCell.classList.contains("col-btn") ||
            targetCell.classList.contains("corner-btn"))
        ) {
          targetCell = targetCell.previousElementSibling;
        }

        let prevRow = row.previousElementSibling;

        // if no prev row inside tbody, maybe need to go to thead last row
        if (!prevRow && section.tagName === "TBODY") {
          let thead = section.previousElementSibling;
          if (thead && thead.tagName === "THEAD") {
            prevRow = thead.querySelector("tr:last-child");
          }
        }

        if (!targetCell && prevRow) {
          targetCell = prevRow.lastElementChild;
          while (
            targetCell &&
            (targetCell.classList.contains("row-btn") ||
              targetCell.classList.contains("col-btn") ||
              targetCell.classList.contains("corner-btn"))
          ) {
            targetCell = targetCell.previousElementSibling;
          }
        }
      } else {
        // ---- Tab = next cell ----
        targetCell = currentCell.nextElementSibling;

        while (
          targetCell &&
          (targetCell.classList.contains("row-btn") ||
            targetCell.classList.contains("col-btn") ||
            targetCell.classList.contains("corner-btn"))
        ) {
          targetCell = targetCell.nextElementSibling;
        }

        let nextRow = row.nextElementSibling;

        // if current row is in THEAD and no next sibling → jump to tbody first row
        if (!nextRow && section.tagName === "THEAD") {
          let tbody = section.nextElementSibling;
          if (tbody && tbody.tagName === "TBODY") {
            nextRow = tbody.querySelector("tr");
          }
        }

        if (!targetCell && nextRow) {
          if (currentCell.nodeName === "TH") {
            // from last TH → jump to first normal TD
            targetCell = nextRow.querySelector(
              "td:not(.row-btn):not(.col-btn):not(.corner-btn)"
            );
          } else {
            targetCell = nextRow.querySelector(
              "td:not(.row-btn):not(.col-btn):not(.corner-btn), th"
            );
          }
        }

        // If no next cell → create new row (only for td rows, not header)
        if (!targetCell && currentCell.nodeName === "TD") {
          let newRow = document.createElement("tr");

          // row-btn
          let tdBtn = document.createElement("td");
          tdBtn.className = "row-btn";
          tdBtn.setAttribute("contenteditable", "false");
          newRow.appendChild(tdBtn);

          for (let i = 1; i < row.children.length; i++) {
            let td = document.createElement("td");
            td.innerHTML = "<br>";
            // td.style.border = "1px solid var(--gray-dark)";
            td.style.padding = "5px 10px";
            let sameColCell = row.children[i];
            if (sameColCell && sameColCell.style.textAlign) {
                td.style.textAlign = sameColCell.style.textAlign;
            }
            newRow.appendChild(td);
          }
          table.querySelector("tbody").appendChild(newRow);

          targetCell = newRow.querySelector(
            "td:not(.row-btn):not(.col-btn):not(.corner-btn)"
          );
        }
      }

      // Move caret
      if (targetCell) {
        let range = document.createRange();
        range.selectNodeContents(targetCell);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }
}

// Table Rows/Colomns Control
function handleTableActions (e) {

  let target = e.target;

  // --- Corner button click ---
  if (target.closest(".corner-btn")) {
    let corner = target.closest(".corner-btn");
    let table = corner.closest("table");

    // already delete-btn iruka check
    if (!corner.querySelector(".delete-btn")) {
      let delBtn = document.createElement("button");
      delBtn.className = "table-delete-btn";

      // create img
      let img = document.createElement("img");
      img.className = "table-delete-btn-icon";   
      img.src = "icons/white-delete.png";         
      img.dataset.dark  = "icons/white-delete.png";
      img.dataset.light = "icons/black-delete.png";

      delBtn.appendChild(img);

      // update icons according to currentTheme
      const iconsInMenu = delBtn.querySelectorAll(".table-delete-btn-icon");      
      iconsInMenu.forEach(icon => {        
        if (currentTheme === "dark") {          
          icon.src = icon.dataset.dark;
        } else if (currentTheme === "light") {
          icon.src = icon.dataset.light;
        } else {
          icon.src = mq.matches ? icon.dataset.dark : icon.dataset.light;
        }
      });

      // append inside corner-btn cell
      corner.appendChild(delBtn);

      // delete logic
      delBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (table) {
          table.remove();
        }
      });
    }
  }

  // --- Row button click ---
  if (target.closest(".row-btn")) {
    e.stopPropagation();
    let rowBtn = target.closest(".row-btn");
    let table = rowBtn.closest("table");
    let tr = rowBtn.closest("tr");

    // cleanup col menus first
    document.querySelectorAll(".table-col-menu").forEach(m => m.remove());
    document.querySelectorAll(".table-row-menu").forEach(m => m.remove());
    document.querySelectorAll(".table-delete-btn").forEach(btn => btn.remove());


    // create menu directly
    let menu = document.createElement("div");
    menu.className = "table-row-menu";
    menu.contentEditable = "false";
    menu.innerHTML = `
      <ul>
        <li class="row-text-wrap">
          <img 
            class="row-add-li-img" 
            src="icons/white-text-wrap.png" 
            data-dark ="icons/white-text-wrap.png" 
            data-light="icons/black-text-wrap.png" 
          />
          Wrap
        </li>
        <li class="row-text-overflow">
          <img 
            class="row-add-li-img" 
            src="icons/white-text-overflow.png"
            data-dark ="icons/white-text-overflow.png" 
            data-light="icons/black-text-overflow.png"  
          />
          Overflow
        </li>
        <li class="row-add-before">
          <img 
            class="row-add-li-img" 
            src="icons/white-up-arrow.png"
            data-dark ="icons/white-up-arrow.png" 
            data-light="icons/black-up-arrow.png"  
          />
          Add row before
        </li>
        <li class="row-add-after">
          <img 
            class="row-add-li-img" 
            src="icons/white-down.png"
            data-dark ="icons/white-down.png" 
            data-light="icons/black-down.png"  
          />
          Add row after
        </li>
        <li class="row-delete"> 
          <img 
            class="row-add-li-img" 
            src="icons/white-delete.png" 
            data-dark ="icons/white-delete.png" 
            data-light="icons/black-delete.png"
          />
          Delete row
        </li>
      </ul>
    `;
    rowBtn.appendChild(menu);

    // update icons according to currentTheme
    const iconsInMenu = menu.querySelectorAll('.row-add-li-img');
    iconsInMenu.forEach(icon => {
      if (currentTheme === 'dark') {
        icon.src = icon.dataset.dark;
      } else if (currentTheme === 'light') {
        icon.src = icon.dataset.light;
      } else {
        icon.src = mq.matches ? icon.dataset.dark : icon.dataset.light;
      }
    });
    
    rowBtn.style.position = "relative";

    if (tr.closest("thead")) {
      menu.querySelectorAll(".row-text-wrap, .row-text-overflow").forEach(el => {
        el.style.display = "none";
      });
    }

    let tbody = table.querySelector("tbody");

    // insert before
    menu.querySelector(".row-add-before").onclick = () => {
      let newRow = document.createElement("tr");
      let newBtn = document.createElement("td");
      newBtn.className = "row-btn";
      newBtn.contentEditable = "false";
      newRow.appendChild(newBtn);

      let colCount = tr.children.length - 1;
      for (let i = 0; i < colCount; i++) {
        let td = document.createElement("td");
        td.innerHTML = "<br>";
        // td.style.border = "1px solid var(--gray-dark)";
        td.style.padding = "5px 10px";
        td.style.minWidth = "200px";
        newRow.appendChild(td);
      }

      if (tr.closest("thead")) {
        tbody.insertBefore(newRow, tbody.firstChild);
      } else {
        tr.parentNode.insertBefore(newRow, tr);
      }
      menu.remove();
    };

    // insert after
    menu.querySelector(".row-add-after").onclick = () => {
      let newRow = document.createElement("tr");
      let newBtn = document.createElement("td");
      newBtn.className = "row-btn";
      newBtn.contentEditable = "false";
      newRow.appendChild(newBtn);

      let colCount = tr.children.length - 1;
      for (let i = 0; i < colCount; i++) {
        let td = document.createElement("td");
        td.innerHTML = "<br>";
        // td.style.border = "1px solid var(--gray-dark)";
        td.style.padding = "5px 10px";
        td.style.minWidth = "200px";
        newRow.appendChild(td);
      }

      if (tr.closest("thead")) {
        tbody.insertBefore(newRow, tbody.firstChild);
      } else {
        tr.parentNode.insertBefore(newRow, tr.nextSibling);
      }
      menu.remove();
    };

    // Delete row
    menu.querySelector(".row-delete").onclick = () => {
      if (tr.parentNode.children.length > 1) {
        tr.remove();
      } else {
        table.remove();
      }
      menu.remove();
    };

    // Text wrap
    menu.querySelector(".row-text-wrap").onclick = () => {
      let cells = tr.querySelectorAll("td:not(.row-btn):not(.corner-btn)");

      cells.forEach(inner => {
          inner.style.whiteSpace = "normal";
          inner.style.wordBreak = "break-word";
          inner.style.overflowX = "visible";
          inner.style.maxWidth = "100%";
      });

      menu.remove();
    };

    // Text Overflow
    menu.querySelector(".row-text-overflow").onclick = () => {
      let cells = tr.querySelectorAll("td:not(.row-btn):not(.corner-btn)");
      cells.forEach(inner => {
        inner.style.whiteSpace = "nowrap";
        inner.style.wordBreak = "normal";
        inner.style.overflowX = "auto";
        inner.style.maxWidth = "300px";
      });

      menu.remove();
    };
  }

  // --- Column button click ---
  if (target.closest(".col-btn")) {
    e.stopPropagation();
    let colBtn = target.closest(".col-btn");
    let table = colBtn.closest("table");

    // cleanup old menus
    document.querySelectorAll(".table-col-menu").forEach(m => m.remove());
    document.querySelectorAll(".table-col-more-btn").forEach(btn => btn.remove());
    document.querySelectorAll(".table-row-more-btn").forEach(btn => btn.remove());
    document.querySelectorAll(".table-row-menu").forEach(menu => menu.remove());
    document.querySelectorAll(".table-delete-btn").forEach(btn => btn.remove());


    // create menu directly
    let menu = document.createElement("div");
    menu.className = "table-col-menu";
    menu.contentEditable = "false";
    menu.innerHTML = `
        <ul>
          <li class="col-align-left"> 
                <img 
                  class="row-add-li-img" 
                  src="icons/white-align-left.png"
                  data-dark ="icons/white-align-left.png" 
                  data-light="icons/black-align-left.png" 
                />
                Align Left 
            </li>
            <li class="col-align-center"> 
                <img 
                  class="row-add-li-img" 
                  src="icons/white-center-align.png" 
                  data-dark ="icons/white-center-align.png" 
                  data-light="icons/black-center-align.png" 
                />
                Align Center 
            </li>
            <li class="col-align-right"> 
                <img 
                  class="row-add-li-img" 
                  src="icons/white-align-right.png"
                  data-dark ="icons/white-align-right.png" 
                  data-light="icons/black-align-right.png" 
                />
                Align Right 
            </li>
            <li class="col-insert-before">
                <img 
                  class="row-add-li-img" 
                  src="icons/white-left-arrow.png"
                  data-dark ="icons/white-left-arrow.png" 
                  data-light="icons/black-left-arrow.png" 
                />
                Insert Column Before
            </li>
            <li class="col-insert-after">
                <img 
                  class="row-add-li-img" 
                  src="icons/white-right-arrow.png" 
                  data-dark ="icons/white-right-arrow.png" 
                  data-light="icons/black-right-arrow.png" 
                />
                Insert Column After
            </li>
            <li class="col-delete">
                <img 
                  class="row-add-li-img" 
                  src="icons/white-delete.png"
                  data-dark ="icons/white-delete.png" 
                  data-light="icons/black-delete.png" 
                />
                Delete Column
            </li>
        </ul>
    `;
    colBtn.appendChild(menu);

    // update icons according to currentTheme
    const iconsInMenu = menu.querySelectorAll('.row-add-li-img');
    iconsInMenu.forEach(icon => {
      if (currentTheme === 'dark') {
        icon.src = icon.dataset.dark;
      } else if (currentTheme === 'light') {
        icon.src = icon.dataset.light;
      } else {
        icon.src = mq.matches ? icon.dataset.dark : icon.dataset.light;
      }
    });

    let cellIndex = colBtn.cellIndex;

    // insert before
    menu.querySelector(".col-insert-before").onclick = () => {
      table.querySelectorAll("tr").forEach((row, rowIndex) => {
        let newCell;
        if (row.parentNode.tagName === "THEAD") {
          newCell = document.createElement("th");
          if (rowIndex === 0) { // first header row
            newCell.className = "col-btn";
            newCell.contentEditable = "false";
          }
        } else {
          newCell = document.createElement("td");
          newCell.innerHTML = "<br>";
          // newCell.style.border = "1px solid var(--gray-dark)";
          newCell.style.padding = "5px 10px";
          newCell.style.minWidth = "200px";
        }
        row.insertBefore(newCell, row.cells[cellIndex]);
      });
      menu.remove();
    };

    // insert after
    menu.querySelector(".col-insert-after").onclick = () => {
      table.querySelectorAll("tr").forEach((row, rowIndex) => {
        let newCell;
        if (row.parentNode.tagName === "THEAD") {
          newCell = document.createElement("th");
          if (rowIndex === 0) {
            newCell.className = "col-btn";
            newCell.contentEditable = "false";
          }
        } else {
          newCell = document.createElement("td");
          newCell.innerHTML = "<br>";
          // newCell.style.border = "1px solid var(--gray-dark)";
          newCell.style.padding = "5px 10px";
          newCell.style.minWidth = "200px";
        }
        row.insertBefore(newCell, row.cells[cellIndex].nextSibling);
      });
      menu.remove();
    };

    // delete column
    menu.querySelector(".col-delete").onclick = () => {
      let rows = table.querySelectorAll("tr");
      let colCount = table.rows[0].cells.length;

      if (colCount > 2) {
        rows.forEach(row => {
          row.deleteCell(cellIndex);
        });
      } else {
        table.remove();
      }
      menu.remove();
    };

    // Align Left
    menu.querySelector(".col-align-left").onclick = () => {
      table.querySelectorAll("tr").forEach(row => {
          let cell = row.cells[cellIndex];
          if (cell && !cell.classList.contains("row-btn") && !cell.classList.contains("col-btn") && !cell.classList.contains("corner-btn")) {
          cell.style.textAlign = "left";
          }
      });
      menu.remove();
    };

    // Align Center
    menu.querySelector(".col-align-center").onclick = () => {
      table.querySelectorAll("tr").forEach(row => {
          let cell = row.cells[cellIndex];
          if (cell && !cell.classList.contains("row-btn") && !cell.classList.contains("col-btn") && !cell.classList.contains("corner-btn")) {
          cell.style.textAlign = "center";
          }
      });
      menu.remove();
    };

    // Align Right
    menu.querySelector(".col-align-right").onclick = () => {
      table.querySelectorAll("tr").forEach(row => {
          let cell = row.cells[cellIndex];
          if (cell && !cell.classList.contains("row-btn") && !cell.classList.contains("col-btn") && !cell.classList.contains("corner-btn")) {
          cell.style.textAlign = "right";
          }
      });
      menu.remove();
    };

  }
  
};

// Image src change based on theme change 
let currentTheme = "system";

mq.addEventListener("change", () => {
  if (currentTheme === "system") {
    updateIconsForSystem();
  }
});

function updateIconsForSystem() {
  const isDark = mq.matches;
  document.querySelectorAll("img[data-dark][data-light]").forEach(icon => {
    icon.src = isDark ? icon.dataset.dark : icon.dataset.light;
  });
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

// Insert Divider
function insertDivider(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!savedRange) return;

  // Restore saved caret
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);

  // Get the current line (where `/` was typed)
  let node = savedRange.startContainer;
  let line = getLineNode(node);
  if (!line) return;

  // --- Remove "/" at the end of line text ---
  if (line.innerText && line.innerText.trim().endsWith("/")) {
    line.innerText = line.innerText.replace(/\/$/, "").trim();
  }

  // Create <hr> with class
  const hr = document.createElement("hr");
  hr.className = "editor-hr";

  // Insert hr after line
  if (line.nextSibling) {
    line.parentNode.insertBefore(hr, line.nextSibling);
  } else {
    line.parentNode.appendChild(hr);
  }

  // Add empty line after hr for typing
  const newLine = document.createElement("div");
  newLine.innerHTML = "<br>";
  hr.parentNode.insertBefore(newLine, hr.nextSibling);

  // Move caret into new line
  const range = document.createRange();
  range.selectNodeContents(newLine);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  editor.focus();

  // UI cleanup
  menu.classList.add("hidden");
  plusIcon.style.display = "none";
  savedRange = null;

  togglePlaceholder();
}

// Insert Date Time
// function insertDateTime(event, type) {
//   event.preventDefault();
//   event.stopPropagation();  

//   if (!savedRange) return;

//   const sel = window.getSelection();
//   sel.removeAllRanges();
//   sel.addRange(savedRange);

//   const range = sel.getRangeAt(0);
//   let node = range.startContainer;
//   let parent = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

//   const now = new Date();

//   // Prepare value based on type
//   let value = "";
//   if (type === "date") {
//     value = now.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   } else if (type === "time") {
//     value = now.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } else if (type === "datetime") {
//     const d = now.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//     const t = now.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//     value = `${d} at ${t}`;
//   }


//   // Replace only the "/" near cursor
//   if (node.nodeType === Node.TEXT_NODE) {    
//     const fullText = node.textContent;
//     const before = fullText.slice(0, range.startOffset);
//     const after = fullText.slice(range.startOffset);

//     const slashIndex = before.lastIndexOf("/");
//     if (slashIndex !== -1) {
//       const newText = before.slice(0, slashIndex) + value + after;
//       node.textContent = newText;

//       // Caret after inserted value
//       const pos = slashIndex + value.length;
//       const newRange = document.createRange();
//       newRange.setStart(node, pos);
//       newRange.collapse(true);
//       sel.removeAllRanges();
//       sel.addRange(newRange);
//     }
//   } 
//   else {
//     parent.innerText = parent.innerText.replace("/", value);
//   }

//   // UI cleanup
//   menu.classList.add("hidden");
//   plusIcon.style.display = "none";
//   savedRange = null;
//   editor.focus();
// }

// ------------------  Text formatting toolbar logic ------------------ 

const toolbar = document.getElementById("text-toolbar");
const boldBtn = toolbar.querySelector(".bold-btn");
const italicBtn = toolbar.querySelector(".italic-btn");
const underlineBtn = toolbar.querySelector(".underline-btn");
const strikeBtn = toolbar.querySelector(".strike-btn");
const supBtn  = toolbar.querySelector(".sup-btn");
const subBtn = toolbar.querySelector(".sub-btn");
const highlightBtn = document.querySelector(".highlight-btn");
const colorList = highlightBtn.querySelector(".color-list-body");
const colorItems = colorList.querySelectorAll(".color-list-item");

// Link Variables
const linkBody = document.getElementById("text-link-body");
const linkNavigateBtn = document.getElementById("link-navigate-btn");
const urlInputField = linkBody.querySelector(".text-link-url-input");


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

// ------------- Link Text logic ------------------ 

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

// ------------- DOM change Function logic ------------------ 

// keyboard changes 
document.addEventListener("selectionchange", () => {

  if (document.activeElement === editor) callShowToolbar();

  if (document.activeElement === editor && linkBody.style.display === "flex") {
    callShowLinkBody();
  }

});

// Window resize 
window.addEventListener("resize", () => {

  callShowToolbar()
  checkPlusIcon()

  if (linkBody.style.display === "flex") {
    callShowLinkBody();
  }
});

// Scroll changes
window.addEventListener("scroll", () => {
  if (linkBody.style.display === "flex") {
    callShowLinkBody();
  }
}, true);

// --- Outside click (anywhere in DOM) ---
document.addEventListener("click", function (e) {

  // ---- corner delete-btn hide ----
  if (!e.target.closest(".corner-btn") &&!e.target.closest(".table-delete-btn") &&!e.target.closest(".row-btn") &&!e.target.closest(".col-btn") &&!e.target.closest(".table-row-menu") &&!e.target.closest(".table-col-menu")) {
    document.querySelectorAll(".table-delete-btn").forEach(btn => btn.remove());
  }

  // ---- row menus hide ----
  if (!e.target.closest(".row-btn") &&!e.target.closest(".table-row-menu")) {
    document.querySelectorAll(".table-row-menu").forEach(menu => menu.remove());
  }

  // ---- col menus hide ----
  if (!e.target.closest(".col-btn") &&!e.target.closest(".table-col-menu")) {
    document.querySelectorAll(".table-col-menu").forEach(m => m.remove());
  }

  // ---- text toolbar hide ----
  if (!editor.contains(e.target) && !toolbar.contains(e.target)) {
    toolbar.style.display = "none";
  }

  //  ---- linkBody hide ---- 
  if (linkBody.style.display === "flex" && !linkBody.contains(e.target) && !editor.contains(e.target) && !toolbar.contains(e.target)) {
    linkBody.style.display = "none";
  }

  // ---- highlight color list hide ----
  colorList.style.display = "none";
});

// Hide menu outside click
document.addEventListener("mousedown", (e) => {
  if (e.target !== plusIcon && !menu.contains(e.target)) {
    plusIcon.style.display = "none";
    menu.classList.add("hidden");
  }
});

// Run whenever selection changes (mouse click or arrow keys)
document.addEventListener("selectionchange", () => {
  if (editor.contains(document.activeElement)) {
    togglePlaceholder();
    checkPlusIcon();
  }
});


// --- Theme change handling ---

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
  modeBody.classList.remove("show")
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