const { exec } = require("child_process");
const portfinder = require("portfinder");
const express = require("express");
const fs = require("fs-extra");
const dree = require("dree");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.set("view engine", "ejs");
app.use(express.static("public"));

let currPort;

io.on("connection", (socket) => {
  socket.on("runScript", (data) => {
    if (
      fs.existsSync(`./data/${data.editorFilePath}`) &&
      fs.statSync(`./data/${data.editorFilePath}`).isFile()
    ) {
      saveFile(data.editorFilePath, data.editorValue);
      runScript({
        path: data.editorFilePath,
        service:
          path.extname(data.editorFilePath) == ".js" ? "node" : "python3",
      });
    } else return;
  });

  socket.on("getFile", (filePath) => {
    fs.readFile(`./data/${filePath}`, (err, data) => {
      if (err) throw err;

      socket.emit("setValue", {
        value: data.toString(),
        type: path.extname(filePath),
        filePath: filePath,
      });
    });
  });

  socket.on("saveFile", ({ filePath, newEditorValue }) => {
    saveFile(filePath, newEditorValue);
  });

  const saveFile = (filePath, newEditorValue) => {
    fs.writeFile(`./data/${filePath}`, newEditorValue, (err) => {
      if (err) throw err;
    });
  };

  socket.on("createNewFolder", ({ newDirName, currPath }) => {
    if (!fs.existsSync(`./data/${currPath}/${newDirName}`)) {
      fs.mkdir(`./data/${currPath}/${newDirName}`, (err) => {
        if (err) throw err;
        socket.emit("updateData", {
          fileTree: getFileTree("./data"),
        });
      });
    } else return socket.emit("err", "already exists");
  });

  socket.on("rename", ({ newFileName, editorFilePath, currPath }) => {
    let newName = newFileName;
    if (path.extname(editorFilePath))
      newName = newFileName + path.extname(editorFilePath);

    if (fs.existsSync(`./data${currPath}/${newName}`))
      return socket.emit("err", "already exists");

    fs.rename(`./data/${editorFilePath}`, `./data${currPath}/${newName}`);
    socket.emit("updateData", {
      fileTree: getFileTree("./data"),
      updateEditor: newName,
    });
  });

  socket.on("deleteFile", (path) => {
    if (fs.existsSync(`./data/${path}`)) {
      fs.unlink(`./data/${path}`, (err) => {
        if (err) throw err;
      });
      socket.emit("updateData", {
        fileTree: getFileTree("./data"),
        closeEditor: true,
      });
    } else return;
  });

  socket.on("renameFolder", ({ currPath, newFolderName }) => {
    if (currPath && newFolderName) {
      if (!fs.existsSync(`./data${currPath}`)) return;

      const newPath =
        currPath
          .split("/")
          .slice(0, currPath.split("/").length - 1)
          .join("/") + `/${newFolderName}`;

      if (fs.existsSync(`./data${newPath}`))
        return socket.emit("err", "already exists");

      fs.renameSync(`./data${currPath}`, `./data${newPath}`, (err) => {
        if (err) throw err;
      });
      socket.emit("updateData", {
        fileTree: getFileTree("./data"),
        newCurrPath: newPath,
      });
    } else return;
  });

  socket.on("createFile", ({ currPath, newFileName, newFileExt }) => {
    if (currPath) currPath += "/";
    const newFilePath = `./data/${currPath}${newFileName + newFileExt}`;

    if (!fs.existsSync(newFilePath)) {
      fs.writeFile(newFilePath, "", function (err) {
        if (err) throw err;
        socket.emit("updateData", {
          fileTree: getFileTree("./data"),
        });
      });
    } else return socket.emit("err", "already exists");
  });

  socket.on("deleteFolder", (path) => {
    if (!fs.existsSync(`./data/${path}`)) return;

    fs.remove(`./data/${path}`, (err) => {
      if (err) throw err;
      socket.emit("updateData", {
        fileTree: getFileTree("./data"),
        newCurrPath: path
          .split("/")
          .slice(0, path.split("/").length - 1)
          .join("/"),
      });
    });
  });

  const runScript = (details) => {
    const child = exec(`${details.service} ./data/${details.path}`, {
      detached: true,
    });

    child.stdout.on("data", (data) => {
      socket.emit("consoleOut", { content: data, path: details.path });
    });

    child.stderr.on("data", (data) => {
      socket.emit("consoleErr", { content: data, path: details.path });
    });

    child.on("close", () => {
      socket.emit("execDone", details.path);
    });
  };
});

app.get("/", (req, res) => {
  const tree = getFileTree("./data");

  res.render("home", {
    data: { dataTree: tree, port: currPort },
  });
});

const getFileTree = (path) => {
  return dree.scan(path, {
    stat: false,
    normalize: true,
    followLinks: true,
    size: true,
    hash: true,
    depth: 100,
    exclude: /dir_to_exclude/,
  });
};

portfinder.getPort(
  {
    port: 3000,
    stopPort: 3200,
  },
  (err, port) => {
    if (err) console.log(err);
    currPort = port;
    server.listen(port, () => console.log(`server listening on port ${port}`));
  }
);
