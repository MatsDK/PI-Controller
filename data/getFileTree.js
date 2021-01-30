const dree = require("dree");

const getFileTree = (path) => {
     return dree.scan(path);
};

console.log(getFileTree("./data"))

console.log(Math.E, Math.PI)

const str= "test"

console.log(str)