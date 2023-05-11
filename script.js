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

const DEFAULT_ANSWER_VALUE = ["", -1]; //None and uncorrected
const LS_CURRENTLY_OPENED = "currentlyOpened";
const LS_CURRENT_NUMBER = "currentNumber";
const SYMBOL_CHECKMARK = "✔";
const EMOJI_CHECKMARK = "✅";
const SYMBOL_X = "🗙";
const EMOJI_X = "❌";

class AnswerSheet {
  //name = "placeholder";
  answers = ["", -1];
  getLength() {
    return this.answers.length;
  }
}

var currentOpen = new AnswerSheet();
var currentNumber = 1;

window.onload = () => {
  LoadProgress();
};

window.onbeforeunload = () => {
  SaveProgress();
};

function LoadProgress() {
  if (localStorage.getItem(LS_CURRENTLY_OPENED) != null) {
    currentOpen = JSON.parse(localStorage[LS_CURRENTLY_OPENED]);
    currentNumber = Number(localStorage[LS_CURRENT_NUMBER]);
    console.log("Loaded!");
    console.log(currentOpen);
    console.log(currentNumber);
  } else {
    console.log("no saves");
  }
}

function SaveProgress() {
  localStorage[LS_CURRENTLY_OPENED] = JSON.stringify(currentOpen);
  localStorage[LS_CURRENT_NUMBER] = currentNumber;
}

function ResetProgress() {
  currentOpen = new AnswerSheet();
  console.log(currentOpen);
  currentNumber = 0;
  SaveProgress();
  updateDisplay();
}

function DownloadSave_JSON() {
  let json = JSON.stringify(currentOpen);
  download("answer_sheet", json);
}

function DownloadSave_Readable(useEmojis) {
  let readable = GetReadable(useEmojis);
  download("answer_sheet", readable);
}

function GetReadable(useEmojis) {
  let text = "";
  let marks = useEmojis
    ? [EMOJI_X, EMOJI_CHECKMARK]
    : [SYMBOL_X, SYMBOL_CHECKMARK];
  for (let index = 0; index < currentOpen.answers.length; index++) {
    const element = currentOpen.answers[index];
    let mark = element[1] === -1 ? "" : marks[element[1]];
    text += `${number + 1}. ${element[0]} ${mark}\n`;
  }
  return text;
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
/*
function SaveOverwriteSheet(answerSheet){

  localStorage.setItem("save_" + answerSheet.name);
}

function AddFileName()

function getDefaultName(){
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("save_")) {
      const value = localStorage.getItem(key);
      
    }
  }
}

function getAllLocalStorage(){
  return { ...localStorage };
}
*/

function setAnswer(number, answer) {
  if (currentOpen.length <= number) {
    currentOpen.answers.fill(
      currentOpen.answers.length - 1,
      number - 1,
      DEFAULT_ANSWER_VALUE
    );
    currentOpen.answers.push([answer, -1]);
  } else {
    currentOpen.answers[number][0] = answer;
  }
  console.log("Set answer for number " + (number + 1) + " to " + answer);
}

function setCorrect(number, correct) {
  if (this.answers.length > number) {
    let a;
    if (typeof correct === "number") {
      a = correct;
    } else {
      a ? "1" : "0";
    }
    this.answers[number][1] = a;
    console.log("Set correctness for number " + (number + 1) + " to " + a);
  } else {
    console.log("ERROR: ans.len < num");
  }
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
