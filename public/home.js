const sidebar = document.querySelector("#sidebar");

resizer.addEventListener("mousedown", (event) => {
  document.addEventListener("mousemove", resize, false);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", resize, false);
    },
    false
  );
});

function resize(e) {
  const size = `${e.x}px`;
  sidebar.style.flexBasis = size;
}

sidebar.style.flexBasis = "325px";

const consoleSidebar = document.querySelector(".rightSidebar");
const resizer2 = document.querySelector("#resizer2");

resizer2.addEventListener("mousedown", (event) => {
  document.addEventListener("mousemove", resize2, false);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", resize2, false);
    },
    false
  );
});

function resize2(e) {
  const size = `${screen.width - e.x}px`;
  consoleSidebar.style.flexBasis = size;
}

sidebar.style.flexBasis = "325px";
