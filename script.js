/*
var overlay = document.getElementById("overlay");
var msgbox = document.getElementById("messagebox");
var msgbox_title = document.getElementById("messagebox_title");
var msgbox_items = document.getElementById("messagebox_items");
var msgbox_buttons = document.getElementById("messagebox_buttons");
*/
/*
<div class="msgbox">
<div class="msgbox background">
  <div class="msgboxTitleBg">
    <h1 class="msgboxTitle">Reset KSKSKS</h1>
  </div>
  <p>
    Confirm reset?
  </p>
  <button style="width:100%"">Reset</button>
</div>
</div>*/

var answers = []; //[{0, 1}]
var currentNumber = null;

window.onload = () => {
  //load answers
  if (sessionStorage.getItem("hasLoaded") === "true") {
    answers = JSON.parse(sessionStorage["answers"]);
    currentNumber = Number(sessionStorage["currentNumber"]);
  }
};

window.onbeforeunload = () => {
  SaveProgress();
};

function SaveProgress() {
  if (answers != null && currentNumber != null) {
    sessionStorage["hasLoaded"] = "true";
    sessionStorage["answers"] = JSON.stringify(answers);
    sessionStorage["currentNumber"] = currentNumber;
  }
}


function setAnswer(num, ans) {
  if (answers.length < num) {
    answers.fill(["", -1], answers.length - 1, num);
  }
  answers[num] = [ans, -1];
}

function setCorrect(num, isCorrect) {
  answers[num][1] = isCorrect ? 0 : 1;
}

function clamp(value, min, max) {
  if (value > max) return max;
  if (value < min) return min;
  return value;
}

function back() {
  history.back();
}

function gotoHome() {
  document.location.href = "/index.html";
}

function gotoView() {
  document.location.href = "/view/view.html";
}

function gotoSettings() {
  document.location.href = "/settings/settings.html";
}

function gotoSave() {
  document.location.href = "/save/save.html";
}

//MessageBox
/*
function msgbox_show(title, text) {
  //ok
  setOverlay(true);
  setMsgbox(true);
  msgbox_title.innerHTML = title;

}

function msgbox_show(title, text, buttons) {}

function setOverlay(on) {
  let style = on ? "" : "display:none;";
  overlay.style = style;
}

function setMsgbox(on) {
  let style = on ? "" : "display:none;";
  msgbox.style = style;
}

function resetContents(){

}
*/

/*
  let msgboxbg = document.createElement("div");
  msgboxbg.className = "msgbox background";
  let msgboxtitlebg = document.createElement("div");
  msgboxtitlebg.className = "msgboxTitleBg";
  let msgboxtitle = document.createElement("div");
  msgboxtitle.className = "msgboxTitle";
  let msgboxtitletext = document.createElement("h1");
  msgboxtitletext.className = "msgboxTitle";
  let msgboxparagraph = document.createElement("p");
  msgboxparagraph.className
*/
