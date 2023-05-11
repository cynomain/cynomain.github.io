var curNumberText = document.getElementById("text_curNumber");
var curAnswer = document.getElementById("text_curAnswer");

addEventListener("load", (e) => {
  curNumberText = document.getElementById("text_curNumber");
  curAnswer = document.getElementById("text_curAnswer");
  updateDisplay();
});

function nextNumber() {
  currentNumber = clamp(currentNumber + 1, 0, 10000);
}

function prevNumber() {
  currentNumber = clamp(currentNumber - 1, 0, 10000);
}

function updateDisplay() {
  curNumberText.innerHTML = currentNumber + 1;
  let str;
  if (currentOpen.answers.length < currentNumber) {
    str = "_";
  } else {
    try {
      str = currentOpen.answers[currentNumber][0];
    } catch (error) {
      str = "_";
    }
  }
  curAnswer.innerHTML = str;
}

function button_Next() {
  nextNumber();
  updateDisplay();
}

function button_Prev() {
  prevNumber();
  updateDisplay();
}

function pickAnswer(ans) {
  const answers = ["A", "B", "C", "D"];
  setAnswer(currentNumber, answers[ans]);
  button_Next();
}

function pickCorrect(correct) {
  setCorrect(currentNumber, correct);
  button_Next();
}
