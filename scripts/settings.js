var resetDialog = document.getElementById("messagebox_reset");
var overlay = document.getElementById("overlay");

addEventListener("load", () => {
  resetDialog = document.getElementById("messagebox_reset");
  overlay = document.getElementById("overlay");
  sound_next.play();
});

function msgbox_yes() {
  ResetProgress();
  gotoHome();
}

function msgbox_no() {
  closeMsgBox();
}

function displayMsgBox() {
  overlay.style = "";
  sound_msgbox.play();
}

function closeMsgBox() {
  overlay.style = "display:none;";
}
