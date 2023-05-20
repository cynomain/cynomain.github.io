var resetDialog = document.getElementById("messagebox_reset");
var overlay = document.getElementById("overlay");

addEventListener("load", () => {
  resetDialog = document.getElementById("messagebox_reset");
  overlay = document.getElementById("overlay");
});

var resetQ = 0;

function setResetCorrect() {
  resetQ = 1;
}

function reset_msgbox_yes() {
  if (resetQ == 0) {
    ResetProgress();
  } else {
    ResetCorrectness();
  }
  resetQ = 0;
  gotoHome();
  reset_closeMsgBox();
}

function reset_msgbox_no() {
  reset_closeMsgBox();
}

function reset_displayMsgBox() {
  overlay.style = "";
  resetDialog.style = "";
  sound_msgbox.play();
}

function reset_closeMsgBox() {
  overlay.style = "display:none;";
  resetDialog.style = "display: none;";
}
