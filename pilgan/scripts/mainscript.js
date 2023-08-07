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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("sw.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}else{
  console.log("no sw");
}

var ui_main = document.getElementById("mainUI");
var ui_settings = document.getElementById("settingsUI");
var ui_view = document.getElementById("showUI");

var transitionBlack = document.getElementById("transitionBlack");

const DEFAULT_ANSWER_VALUE = ["", -1]; //None and uncorrected
const LS_CURRENTLY_OPENED = "currentlyOpened";
const LS_CURRENT_NUMBER = "currentNumber";
const LS_ANSWERS = "answers";
const SS_EDITMODE = "editmode";
const SYMBOL_CHECKMARK = "✔";
const EMOJI_CHECKMARK = "✅";
const SYMBOL_X = "X";
const EMOJI_X = "❌";

var sound_prev = new Audio("assets/aud_prev.ogg");
var sound_next = new Audio("assets/aud_next.ogg");
var sound_reset = new Audio("assets/aud_reset.ogg");
var sound_msgbox = new Audio("assets/aud_msgbox.ogg");
var sound_choose = new Audio("assets/aud_choose.ogg");
var sound_score = new Audio("assets/aud_score.ogg");

class AnswerSheet {
  //name = "placeholder";
  answers = ["", -1];
  getLength() {
    return this.answers.length;
  }
}

//var currentOpen = new AnswerSheet();
var answers = [];
var currentNumber = 1;
var isEditMode = false;

window.onload = () => {
  ui_main = document.getElementById("mainUI");
  ui_settings = document.getElementById("settingsUI");
  ui_view = document.getElementById("showUI");
  transitionBlack = document.getElementById("transitionBlack");
  LoadProgress();
};

window.onbeforeunload = () => {
  SaveProgress();
};

var isFullScreen = false;

function gotoHome(){
  window.location.href.replace("../index.html");
}

function ToggleFullscreen() {
  const elem = document.documentElement;

  if (isFullScreen) {
    //IS FULLSCREEN
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
    isFullScreen = false;
  } else {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.msRequestFullscreen();
    }
    isFullScreen = true;
  }
}

function LoadProgress() {
  if (localStorage.getItem(LS_ANSWERS) != null) {
    //currentOpen = JSON.parse(localStorage[LS_CURRENTLY_OPENED]);
    answers = JSON.parse(localStorage[LS_ANSWERS]);
    currentNumber = Number(localStorage[LS_CURRENT_NUMBER]);
    /*
    if (sessionStorage[SS_EDITMODE] != null) {
      isEditMode = sessionStorage[SS_EDITMODE] == "true";
    }*/
    console.log("Loaded!");
    console.log(answers);
    console.log(currentNumber);
    console.log(isEditMode);
  } else {
    console.log("no saves");
  }
}

function SaveProgress() {
  //localStorage[LS_CURRENTLY_OPENED] = JSON.stringify(currentOpen);
  localStorage[LS_ANSWERS] = JSON.stringify(answers);
  localStorage[LS_CURRENT_NUMBER] = currentNumber;
  //sessionStorage[SS_EDITMODE] = isEditMode;
}

function ResetProgress() {
  //currentOpen = new AnswerSheet();
  answers = [];
  isEditMode = false;
  console.log(answers);
  currentNumber = 0;
  SaveProgress();
  //updateDisplay();
  window.onload();
  console.log("Reset!");
}

function ResetCorrectness() {
  for (let index = 0; index < answers.length; index++) {
    answers[index][1] = -1;
  }
  isEditMode = false;
  updateDisplay();
  console.log("Reset correct");
}

function LoadSave_JSON() {
  var input = document.createElement("input");
  input.type = "file";

  input.onchange = (e) => {
    // getting a hold of the file reference
    var file = e.target.files[0];

    // setting up the reader
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    // here we tell the reader what to do when it's done reading...
    reader.onload = (readerEvent) => {
      var content = readerEvent.target.result; // this is the content!
      console.log(content);
      var parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        ResetProgress();
        answers = parsed;
        console.log("Loaded!");
        gotoHome();
      }
    };
  };

  input.click();
}

function DownloadSave_JSON() {
  let json = JSON.stringify(answers);
  download("answer_sheet.json", json);
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
  for (let index = 0; index < answers.length; index++) {
    const element = answers[index];
    let mark = element[1] === -1 ? "" : marks[element[1]];
    text += `${index + 1}. ${element[0]} ${mark}\n`;
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

  //sound
  sound_score.play();
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

function setEditMode(yes) {
  isEditMode = yes;
  //updateDisplay();
  window.onload();
}

function setAnswer(number, answer) {
  if (answers.length <= number) {
    for (let index = answers.length - 1; index < number; index++) {
      answers.push(["", -1]);
    }
  }
  answers[number][0] = answer;
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
  updateDisplay();
}

function getScore() {
  let correctCount = 0;
  answers.forEach((element) => {
    if (element[1] === 1) {
      correctCount++;
    }
  });
  let score = Math.trunc((correctCount / answers.length) * 10000) / 100;
  return score;
}

function clamp(value, min, max) {
  if (value > max) return max;
  if (value < min) return min;
  return value;
}

function back() {
  //history.back();
  gotoHome();
}

function gotoHome() {
  //document.location.href = "/index.html";
  //doTransition(() => {
  setEnabled(ui_main);
  setDisabled(ui_settings);
  setDisabled(ui_view);
  updateDisplay();
  //});
}

function gotoView() {
  //document.location.href = "/pages/view.html";
  //doTransition(() => {
  setDisabled(ui_main);
  setDisabled(ui_settings);
  setEnabled(ui_view);
  ViewLoad();
  //});
}

function gotoSettings() {
  //document.location.href = "/pages/settings.html";
  //doTransition(() => {
  setDisabled(ui_main);
  setEnabled(ui_settings);
  setDisabled(ui_view);
  //});
}

function gotoSave() {
  //document.location.href = "/pages/save.html";
}

function doTransition(func) {
  transition2Black();
  transition2ClearWait(func);
}

function transition2ClearWait(func) {
  setTimeout(() => {
    func();
    transition2Clear();
  }, 200);
}

function transition2Black() {
  transitionBlack.className = "transitionBlack dark";
}

function transition2Clear() {
  transitionBlack.className = "transitionBlack clear";
}

function setDisabled(element) {
  element.style.display = "none";
}

function setEnabled(element) {
  element.style.display = "flex";
}

function button_navsoundPrev() {
  sound_prev.pause();
  sound_prev.currentTime = 0;
  sound_prev.play();
}

function button_navsoundNext() {
  sound_next.pause();
  sound_next.currentTime = 0;
  sound_next.play();
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
