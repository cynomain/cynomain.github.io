var curNumberText = document.getElementById("text_curNumber");
var curAnswer = document.getElementById("text_curAnswer");
var choices = document.getElementById("choices");
var correcting = document.getElementById("correcting");
var prev_button = document.getElementById("button_prev");
var next_button = document.getElementById("button_next");
var resetDialog = document.getElementById("messagebox_reset");
var overlay = document.getElementById("overlay");
var msgbox_confirm = document.getElementById("messagebox_confirm");
var msgbox_score = document.getElementById("messagebox_score");
var text_score = document.getElementById("text_score");

const BUTTON_STYLE_VISIBLE = "width:100%;";
const BUTTON_STYLE_INVISIBLE = "width:100%; display:none;";

var onConfirm = () => {};

addEventListener("load", (e) => {
  curNumberText = document.getElementById("text_curNumber");
  curAnswer = document.getElementById("text_curAnswer");
  choices = document.getElementById("choices");
  correcting = document.getElementById("correcting");
  prev_button = document.getElementById("button_prev");
  next_button = document.getElementById("button_next");
  resetDialog = document.getElementById("messagebox_reset");
  overlay = document.getElementById("overlay");
  msgbox_confirm = document.getElementById("messagebox_confirm");
  msgbox_score = document.getElementById("messagebox_score");
  text_score = document.getElementById("text_score");
  updateDisplay();
  //sound_next.play();
});

function nextNumber() {
  currentNumber = clamp(currentNumber + 1, 0, 10000);
}

function prevNumber() {
  currentNumber = clamp(currentNumber - 1, 0, 10000);
}
const colors = ["#FFFFFF", "#FF0000", "#00FF00"];
function updateDisplay() {
  curNumberText.innerHTML = currentNumber + 1;

  if (answers[currentNumber] == undefined || !answers[currentNumber][0]) {
    curAnswer.innerHTML = "_";
    curAnswer.style = "";
  } else {
    curAnswer.innerHTML = answers[currentNumber][0];
    curAnswer.style = "color:" + colors[answers[currentNumber][1] + 1];
  }

  if (isEditMode) {
    choices.style = BUTTON_STYLE_INVISIBLE;
    correcting.style = BUTTON_STYLE_VISIBLE;
  } else {
    choices.style = BUTTON_STYLE_VISIBLE;
    correcting.style = BUTTON_STYLE_INVISIBLE;
  }

  if (currentNumber <= 0) {
    prev_button.setAttribute("disabled", "");
  } else {
    prev_button.removeAttribute("disabled");
  }

  if (isEditMode && currentNumber >= answers.length - 1) {
    next_button.setAttribute("disabled", "");
  } else {
    next_button.removeAttribute("disabled");
  }
}


function button_Next() {
  if (answers[currentNumber] === undefined) {
    setAnswer(currentNumber, "");
  }
  nextNumber();
  updateDisplay();

}

function button_Prev() {
  prevNumber();
  updateDisplay();

}

function button_CloseEdit() {
  displayMsgBox_Confirm();
  onConfirm = () => {
    isEditMode = false;
    gotoHome();
  };
}

function button_GetGrade() {
  displayMsgBox_Confirm();
  onConfirm = () => {
    setTimeout(() => {
      let score = getScore();
      displayMsgBox_Score(score);
    }, 100);
  };
}

function button_Correct() {
  setCorrect(currentNumber, 1);
  if (currentNumber + 1 < answers.length){
    nextNumber();
    updateDisplay();
  }
  sound_choose.pause();
  sound_choose.currentTime = 0;
  sound_choose.play();
}

function button_Wrong() {
  setCorrect(currentNumber, 0);
  if (currentNumber + 1 < answers.length){
    nextNumber();
    updateDisplay();
  }
  sound_choose.pause();
  sound_choose.currentTime = 0;
  sound_choose.play();
}

function pickAnswer(ans) {
  const answers = ["A", "B", "C", "D", "E"];
  setAnswer(currentNumber, answers[ans]);
  button_Next();
  sound_choose.pause();
  sound_choose.currentTime = 0;
  sound_choose.play();
}

function pickCorrect(correct) {
  setCorrect(currentNumber, correct);
  button_Next();
}

function msgbox_yes() {
  onConfirm();
  closeOverlay();
  closeMsgBoxAll();
}

function msgbox_no() {
  closeOverlay();
  closeMsgBoxAll();
}

function closeMsgBoxAll() {
  msgbox_confirm.style = "display:none;";
  msgbox_score.style = "display:none;";
}

function displayMsgBox_Confirm() {
  displayOverlay();
  closeMsgBoxAll();
  msgbox_confirm.style = "";
  sound_msgbox.play();
}

function displayMsgBox_Score(score) {
  displayOverlay();
  closeMsgBoxAll();
  msgbox_score.style = "";
  text_score.innerHTML = score;
  sound_score.play();
}

function displayOverlay() {
  overlay.style = "";
}

function closeOverlay() {
  overlay.style = "display:none;";
}
