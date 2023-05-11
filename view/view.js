const parent = document.getElementById("entries");

addEventListener("load", (e) => {Load();});

function Load() {
  for (let index = 0; index < currentOpen.answers.length; index++) {
    const element = currentOpen.answers[index];
    createEntry(index, element[0], element[1]);
  }
  console.log("View loaded");
}

function createEntry(number, answer, correctness) {
  const correctsymbols = ["", SYMBOL_X, SYMBOL_CHECKMARK];
  let entryElement = document.createElement("div");
  entryElement.className = "showEntry";
  let p1 = document.createElement("p");
  p1.innerText = number + 1 + ". ";
  p1.className = "number";
  let p2 = document.createElement("p");
  p2.innerText = answer;
  p2.className = "answer";
  let p3 = document.createElement("p");
  p3.innerText = correctsymbols[correctness + 1];
  p3.className = "correct";
  let image = document.createElement("button");
  let icon = document.createElement("img");
  icon.src = "/assets/icon_edit.svg";
  icon.style = "height:100%; width: auto;";
  image.className = "imageButton edit";
  image.id = "button_edit";
  image.style = "color:white;border-radius: 0px; padding:0;";
  image.appendChild(icon);
  entryElement.appendChild(p1);
  entryElement.appendChild(p2);
  entryElement.appendChild(p3);
  entryElement.appendChild(image);
  parent.appendChild(entryElement);
  return entryElement;
}

function createTest() {
  for (let i = 0; i < 40; i++) {
    createEntry(0, "A", 0);
  }
}
