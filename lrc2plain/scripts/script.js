var inputButton;

window.addEventListener("load", () => {
  inputButton = document.getElementById("inputZone");
});

function dropHandler(event) {
  console.log("DROP!");
  event.preventDefault();

  if (event.dataTransfer.items) {
    [...event.dataTransfer.items].forEach((item, i) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        processFile(file);
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      console.log(item.kind);

      console.log(`… file[${i}].name = ${file.name}`);
    });
  }
}

function handleFileSelect(event) {
  console.log(event.target.files);
  for (let i = 0; i < event.target.files.length; i++) {
    const element = event.target.files[i];
    processFile(element);
  }
}

function dragOverHandler(event) {
  event.preventDefault();
}

function processFile(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const contents = event.target.result;
    console.log("processing");

    //Replaces [00:00.00] and [00:00]
    let replaced = contents
      .replaceAll(/\[.*\:.*\..*\]/g, "")
      .replaceAll(/\[.*\:.*\]/g, "");
    let split = replaced.split("\n");
    let trimmed = split.map((x) => x.trim());
    let joined = trimmed.join("\n");

    download(file.name.replace(".lrc", ".txt").replace(".LRC", ".txt"), joined);
  };

  reader.readAsText(file);
}

function isDigit(char) {
  return char >= "0" && char <= "9";
}

function removeAt(str, index) {
  return str.slice(0, index) + str.slice(index + 1);
}

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
