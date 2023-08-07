const translator_ja = new Translator("ja");
const translator_ko = new Translator("ko");
//const translator_zh = new Translator("zh");

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

function dragOverHandler(event) {
  event.preventDefault();
}

async function processFile(file) {
  const reader = new FileReader();

  reader.onload = async function (event) {
    const contents = event.target.result;
    console.log("processing");

    const rom_ja = await translator_ja.romajifyText(contents);
    const rom_ko = await translator_ko.convertToRomaja(rom_ja);
    //const rom_zh = await translator_zh.convertChinese(rom_ko);
    const replaced = rom_ko
      .replace(/ \. /g, ". ")
      .replace(/ , /g, ", ")
      .replace(/ ! /g, "!")
      .replace(/ \? /g, "?")
      .replace(/ ' /g, "'")
      .replace(/ " /g, '"')
      .replace(/ \* /g, "*")
      .replace(/ - /g, "-")
      .replace(/ _ /g, "_")
      .replace(/ : /g, ": ")
      .replace(/ ; /g, "; ")
      .replace(/ < /g, " <")
      .replace(/ > /g, "> ")
      .replace(/ \( /g, " (")
      .replace(/ \) /g, ") ")
      .replace(/ \[ /g, " [")
      .replace(/ \] /g, "] ")
      .replace(/ \} /g, "}")
      .replace(/ \{ /g, "{")
      .replace(/ \/ /g, "/")
      .replace(/ \\ /g, "\\")
      .replace(/ \+ /g, "+")
      .replace(/ \& /g, "&")
      .replace(/ ` /g, "`")
      .replace(/\[ /g, "[")
      .replace(/ \]/g, "] ")
      .replace(/ \?/g, "?")
      .replace(/ \./g, ".")
      .replace(/   /g, " ")
      .replace(/  /g, " ");

    var final = "";
    var splitArr = replaced.match(/[^\r\n]+/g);

    for (let i = 0; i < splitArr.length; i++) {
      let str = splitArr[i].trim();
      for (let j = 0; j < str.length; j++) {
        if (str[j] === ":" || str[j] === ".") {
          if (j > 2 && isDigit(str[j - 1]) && str[j + 1] === " ") {
            str = removeAt(str, j + 1);
          }
        }
      }
      final += str + "\n";
    }

    download(file.name, final);
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

function handleFileSelect(event) {
  const selectedFiles = event.target.files;
  const validFiles = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const fileType = file.type;

    // Exclude video, picture, and song files based on their MIME types
    if (
      fileType !== "video/mp4" &&
      fileType !== "image/jpeg" &&
      fileType !== "image/png" &&
      fileType !== "audio/mpeg"
    ) {
      validFiles.push(file);
    }
  }

  validFiles.forEach((item, i) => {
    processFile(item);
  });
}
