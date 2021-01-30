const socket = io(`http://localhost:${data.port}`);

const runBtn = document.querySelector(".runBtn");

const runScript = () => {
  if (editorFilePath) {
    indentEditor();
    runBtn.classList.add("invinsible");
    socket.emit("runScript", {
      editorFilePath,
      editorValue: editor.getValue(),
    });
  }
};

const consoleInner = document.querySelector(".consoleInner");

const clearConsole = () => (consoleInner.innerHTML = null);

socket.on("err", (data) => alert(data));

socket.on(
  "updateData",
  ({ fileTree, newCurrPath, closeEditor, updateEditor }) => {
    data.dataTree = fileTree;

    if (closeEditor) clearEditor();

    if (updateEditor) {
      codeEditorHeaderName.innerText = updateEditor;
      if (currPath) editorFilePath = currPath + "/" + updateEditor;
      else editorFilePath = updateEditor;
    }

    if (newCurrPath !== undefined) {
      if (!newCurrPath) currPath = "";
      else currPath = newCurrPath;
    }

    if (currPath.charAt(0) == "/") currPath = currPath.substring(1);

    if (!currPath) renderSidebarTree(fileTree.children, "/");
    else {
      let currChildren = fileTree.children;
      currPath.split("/").forEach((x, i) => {
        const tmpChildren = currChildren.filter((el) => el.name == x);
        currChildren = tmpChildren[0].children;
      });
      renderSidebarTree(currChildren, currPath);
    }
  }
);

const clearEditor = () => {
  editorFilePath = "";
  editor.setValue("");
  codeEditorHeaderName.innerText = "";
  editorValue = "";
};

socket.on("consoleOut", (data) => {
  const msgTmp = document.querySelector(".consoleMsgTmp");
  const el = msgTmp.content.cloneNode(true);
  el.querySelector(".consoleMsgContent").innerText = data.content;
  el.querySelector(".consoleMsgPath").innerText = `~/${data.path}>`;
  consoleInner.append(el);
  scrollDown();
});

socket.on("execDone", (data) => {
  runBtn.classList.remove("invinsible");

  const msgTmp = document.querySelector(".consoleMsgTmp");
  const el = msgTmp.content.cloneNode(true);
  el.children[0].classList.add("lineBreak");
  el.querySelector(".consoleMsgContent").innerText = "Exited out of file...";
  el.querySelector(".consoleMsgPath").innerText = `~/${data}>`;
  consoleInner.append(el);
  scrollDown();
});

socket.on("consoleErr", (err) => {
  const msgTmp = document.querySelector(".consoleMsgTmp");
  const el = msgTmp.content.cloneNode(true);
  el.children[0].classList.add("error");
  el.querySelector(".consoleMsgContent").innerText = err.content;
  el.querySelector(".consoleMsgPath").innerText = `~/${err.path}>`;
  consoleInner.append(el);
  scrollDown();
});

const scrollDown = () => (consoleInner.scrollTop = consoleInner.scrollHeight);

const codeEditorHeaderName = document.querySelector(".codeEditorHeaderName");

socket.on("setValue", (data) => {
  editorFilePath = data.filePath;
  codeEditorHeaderName.innerText = data.filePath.replace(/^.*[\\\/]/, "");
  data.type == ".js"
    ? editor.setOption("mode", "javascript")
    : editor.setOption("mode", "python");
  editorValue = data.value;
  updateEditorValue();
  editor.clearHistory();
});

const saveFile = () => {
  indentEditor();
  socket.emit("saveFile", {
    filePath: editorFilePath,
    newEditorValue: editor.getValue(),
  });
};

let editorValue = "";
let editorFilePath = "";

let editor = CodeMirror.fromTextArea(document.querySelector(".editor"), {
  lineNumbers: true,
  theme: "one-dark",
  tabSize: 5,
  lineWrapping: true,
  matchBrackets: true,
  indentUnit: 5,
  indentWithTabs: false,
});

const updateEditorValue = () => {
  editor.getDoc().setValue(editorValue);
  indentEditor();
};

const indentEditor = () => {
  editor.operation(function () {
    for (var i = 0; i < editor.lineCount(); ++i) editor.indentLine(i, "smart");
  });
};

const sideBarDataContainer = document.querySelector(".sideBarDataList");

const order = ["directory", "file"];

const renderSidebarTree = (children, path) => {
  if (!children) activeItemIdentificator.classList.add("hidden");

  sideBarDataContainer.innerHTML = null;
  renderSideBarPath(path);
  if (path != "/") sideBarTreePath = path + "/";
  else sideBarTreePath = path;
  if (children) {
    children
      .sort(function (a, b) {
        return order.indexOf(a.type) - order.indexOf(b.type);
      })
      .forEach((x, i) => {
        let element;
        if (x.type == "directory") {
          const folderTemp = document.querySelector(".sideBarFolderTemp");
          element = folderTemp.content
            .cloneNode(true)
            .querySelector(".sideBarItem");
          element.addEventListener("click", () => {
            if (x) renderSidebarTree(x.children, x.relativePath);
          });
        } else {
          const folderTemp = document.querySelector(".sideBarFileTemp");
          element = folderTemp.content
            .cloneNode(true)
            .querySelector(".sideBarItem");

          element.addEventListener("click", () => {
            const sideBarItems = document.querySelectorAll(".sideBarItem");
            sideBarItems.forEach((x) => {
              x.classList.remove("active");
            });

            element.classList.add("active");
            socket.emit("getFile", x.relativePath);
          });
        }
        const nameEl = element.querySelector(".sideBarFolderName");
        element.setAttribute("id", i);

        element.addEventListener("mouseenter", (e) => {
          setActiveIndicator(e.target.id);
        });

        nameEl.innerText = x.name;

        sideBarDataContainer.append(element);
      });
  }
};

const activeItemIdentificator = document.querySelector(
  ".activeItemIdencticator"
);

const setActiveIndicator = (itemId) => {
  activeItemIdentificator.style.marginTop = `${Number(itemId) * 40}px`;
  activeItemIdentificator.classList.remove("hidden");
};

sideBarDataContainer.addEventListener("mouseleave", (e) => {
  activeItemIdentificator.classList.add("hidden");
  const sideBarItems = document.querySelectorAll(".sideBarItem");
  sideBarItems.forEach((x) => {
    x.classList.remove("hidden");
  });
});

sideBarDataContainer.addEventListener("mouseenter", (e) => {
  const sideBarItems = document.querySelectorAll(".sideBarItem");
  sideBarItems.forEach((x) => {
    x.classList.add("hidden");
  });
});

const sideBarPath = document.querySelector(".sidebarPath");

let currPath = "";

const renderSideBarPath = (path) => {
  sideBarPath.innerHTML = null;
  if (path == "/") {
    currPath = "";
    const el = document.createElement("p");
    el.classList.add("currTreePath");
    el.innerText = "Files";

    sideBarPath.append(el);
  } else {
    currPath = path;
    const arrowTemp = document.querySelector(".arrowTemp");
    const arrowEl = arrowTemp.content
      .cloneNode(true)
      .querySelector(".pathArrow");

    const rootBtnTemp = document.querySelector(".sideBarRootBtn");

    const rootBtnEl = rootBtnTemp.content
      .cloneNode(true)
      .querySelector(".sideBarRootIcon");

    rootBtnEl.addEventListener("click", () => {
      renderSidebarTree(data.dataTree.children, "/");
    });
    if (path.split("/").length == 1) {
      const el = document.createElement("p");
      el.classList.add("sideBarPathBtn");

      const currPathEl = document.createElement("p");

      currPathEl.classList.add("currTreePath");
      currPathEl.innerText = path.split("/")[0];
      el.innerText = "Files";

      el.addEventListener("click", () => {
        renderSidebarTree(data.dataTree.children, "/");
      });
      if (path.split("/").length >= 2) sideBarPath.append(rootBtnEl);
      sideBarPath.append(el, arrowEl, currPathEl);
    } else {
      const parentPath = document.createElement("p");
      parentPath.classList.add("sideBarPathBtn");

      const currPathEl = document.createElement("p");
      currPathEl.classList.add("currTreePath");

      parentPath.innerText = path.split("/")[path.split("/").length - 2];
      currPathEl.innerText = path.split("/")[path.split("/").length - 1];

      if (path.split("/").length >= 2) sideBarPath.append(rootBtnEl);
      sideBarPath.append(parentPath, arrowEl, currPathEl);

      const parentsChildren = getParentsChildren(path);

      let prevPath = "";
      path.split("/").forEach((el, i) => {
        if (i < path.split("/").length - 1)
          prevPath = `${prevPath}${
            i == path.split("/").length - 2 && i != 0 ? "/" : ""
          }${el}`;
      });
      parentPath.addEventListener("click", () => {
        renderSidebarTree(parentsChildren.children, prevPath);
      });
    }
  }
};

const getParentsChildren = (path) => {
  let currObj = data.dataTree;
  path.split("/").forEach((x, i) => {
    if (i < path.split("/").length - 1) {
      const newObj = currObj.children.find((child) => child.name == x);
      if (newObj) currObj = newObj;
    }
  });
  return currObj;
};

if (data.dataTree && data.dataTree.children) {
  renderSidebarTree(data.dataTree.children, "/");
}

const createNewDir = () => {
  const newDirName = prompt("enter the name of the folder");

  if (newDirName && newDirName.replace(/\s/g, "").length) {
    socket.emit("createNewFolder", { newDirName, currPath });
  } else alert("name must contain characters");
};

const renameFile = () => {
  if (!editorFilePath) return;

  const newFileName = prompt("enter the new name of the file");

  if (newFileName && newFileName.replace(/\s/g, "").length) {
    socket.emit("rename", {
      newFileName,
      editorFilePath,
      currPath: !currPath ? "" : `/${currPath}`,
    });
  } else alert("name must contain characters");
};

const deleteFile = () => {
  if (!editorFilePath) return;

  if (confirm(`Press "OK" if you are sure you want to delete this file`)) {
    socket.emit("deleteFile", editorFilePath);
  } else return;
};

const renameFolder = () => {
  if (!currPath) return alert("go into folder");
  const newFolderName = prompt("enter the new name of this folder");

  if (newFolderName && newFolderName.replace(/\s/g, "").length) {
    socket.emit("renameFolder", {
      currPath: !currPath ? "" : `/${currPath}`,
      newFolderName,
    });
  } else alert("name must contain characters");
};

let newFileName = "Name";
let newFileExt = ".py";

const newFileInput = document.querySelector(".newFileName");
const newFileContainer = document.querySelector(".newFileContainer");
const newFileNameLabel = document.querySelector(".newFileNameLabel");
const newFileExtLabel = document.querySelector(".newFileExt");
const newFileForm = document.querySelector(".newFileForm");

newFileInput.addEventListener("input", () => {
  newFileNameLabel.innerText = newFileInput.value;
  newFileName = newFileInput.value;
});

newFileForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (newFileName && newFileName.replace(/\s/g, "").length) {
    socket.emit("createFile", { currPath, newFileName, newFileExt });
    newFileContainer.classList.add("hidden");
  } else alert("you need to enter a name");
});

const createNewFile = () => {
  newFileContainer.classList.toggle("hidden");
};

const selectOnlyThis = (id, thisEl) => {
  for (var i = 1; i <= 2; i++) {
    document.getElementById("Check" + i).checked = false;
  }
  newFileExt = `.${thisEl.value}`;
  newFileExtLabel.innerText = `.${thisEl.value}`;
  document.getElementById(id).checked = true;
};

const deleteFolder = () => {
  if (!currPath) return alert("Go inside a folder.");

  if (confirm(`Press "OK" if you are sure you want to delete this folder`))
    socket.emit("deleteFolder", currPath);
  else return;
};
