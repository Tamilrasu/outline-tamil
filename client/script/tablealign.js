// Elements
const homeBody = document.getElementById('document_home_body');
const writteBody = document.getElementById('document_writte_body');
let editor = document.getElementById("editor");
let menu = document.getElementById("slash-menu");
let savedRange = null;
let currentLine = null;




// Open Home
function openhome() {
    writteBody.style.display = 'none';
    homeBody.style.display = 'block';
}

// Show slash menu 
// function slashOpen(e) {
//   let sel = window.getSelection();
//   if (sel.rangeCount === 0) return;
//   let range = sel.getRangeAt(0);

//   let node = range.startContainer;  
 
//   let textBefore = range.startContainer.textContent.slice(0, range.startOffset);
    
//   // Skip if current line is just a <br>
//   let line = getLineNode(node);
  
  // if (line && (line.nodeName === "TABLE" || line.nodeName === "#text" || line.nodeName === "BR")) {
  //   menu.classList.add("hidden");
  //   return;
  // }

//   if (textBefore === "/" || (/\s\/$/.test(textBefore))) {
//     savedRange = range.cloneRange();
//     let rect = range.getBoundingClientRect();
//     menu.style.top = rect.bottom + window.scrollY - 50 + "px" ;
//     menu.style.left = rect.left + window.scrollX - 250 + "px";
//     menu.classList.remove("hidden");
//   } else {
//     menu.classList.add("hidden");
//   }
// }

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
      td.style.border = "1px solid rgb(38, 42, 55)";
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

// Tab navigation inside tables 
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
            td.style.border = "1px solid rgb(38, 42, 55)";
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

      // img create
      let img = document.createElement("img");
      img.src = "icons/delete.png"; 
      img.className = "table-delete-btn-icon"

      delBtn.appendChild(img);

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
          <img src="icons/text-wrap.png" class = "row-add-li-img" />
          Wrap
        </li>
        <li class="row-text-overflow">
          <img src="icons/text-overflow.png" class = "row-add-li-img" />
          Overflow
        </li>
        <li class="row-add-before">
          <img src="icons/up-arrow.png" class = "row-add-li-img" />
          Add row before
        </li>
        <li class="row-add-after">
          <img src="icons/down.png" class = "row-add-li-img" />
          Add row after
        </li>
        <li class="row-delete"> 
          <img src="icons/delete.png" class = "row-add-li-img" />
          Delete row
        </li>
      </ul>
    `;
    rowBtn.appendChild(menu);
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
        td.style.border = "1px solid rgb(38, 42, 55)";
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
        td.style.border = "1px solid rgb(38, 42, 55)";
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

    console.log("handleTableActions");
    

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
                <img src="icons/align-left.png" class = "row-add-li-img" />
                Align Left 
            </li>
            <li class="col-align-center"> 
                <img src="icons/center-align.png" class = "row-add-li-img" />
                Align Center 
            </li>
            <li class="col-align-right"> 
                <img src="icons/align-right.png" class = "row-add-li-img" />
                Align Right 
            </li>
            <li class="col-insert-before">
                <img src="icons/left-arrow.png" class = "row-add-li-img" />
                Insert Column Before
            </li>
            <li class="col-insert-after">
                <img src="icons/right-arrow.png" class = "row-add-li-img" />
                Insert Column After
            </li>
            <li class="col-delete">
                <img src="icons/delete.png" class = "row-add-li-img" />
                Delete Column
            </li>
        </ul>
    `;
    colBtn.appendChild(menu);

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
          newCell.style.border = "1px solid rgb(38, 42, 55)";
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
          newCell.style.border = "1px solid rgb(38, 42, 55)";
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

});


