const parent = document.getElementById("entries");
const scoreButton = document.getElementById("button_score");

function ViewLoad() {
parent.innerHTML = '';

  for (let index = 0; index < answers.length; index++) {
    const element = answers[index];
    createEntry(index, element[0], element[1]);
  }
  if (answers.length <= 0) {
    scoreButton.setAttribute("disabled", "");
  } else {
    scoreButton.removeAttribute("disabled");
  }


  console.log("View loaded");
  //sound_next.play();
}

function button_grade() {
  if (answers.length < 1) {
    return;
  }
  currentNumber = 0;
  isEditMode = true;
  gotoHome();
}

function Edit(number) {
  currentNumber = number;
  gotoHome();
}

function createEntry(number, answer, correctness) {
  const correctsymbols = ["", SYMBOL_X, SYMBOL_CHECKMARK];
  const correctColors = ["#FFFFFF", "#FF0000", "#00FF00"];
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
  p3.style = "color:" + correctColors[correctness + 1];
  let image = document.createElement("button");
  let icon = document.createElement("img");
  icon.src = "assets/icon_edit.svg";
  icon.style = "height:100%; width: auto;";
  image.className = "imageButton edit";
  image.id = "button_edit";
  image.style = "color:white;border-radius: 0px; padding:0;";
  image.onclick = () => {
    Edit(number);
    sound_next.play();
  };
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
