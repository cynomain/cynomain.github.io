/// <reference path="commmon.js">
/// <reference path="audio_manager.js">
/// <reference path="ui_manager.js">

BottomBarUI.progress_bar.disabled = true;
BottomBarUI.button_playpause.disabled = true;

document.body.addEventListener("keyup", function (e) {
  if (e.target.tagName == "button") return;

  if (
    e.key == " " ||
    e.code == "Space" ||
    e.key == "Enter" ||
    e.code == "Enter"
  ) {
    AudioManager.togglePlayback();
  }

  if (e.key == "ArrowRight" || e.code == "ArrowRight") {
    AudioManager.seek(
      clamp(audio_player.currentTime + 5, 0, audio_player.duration)
    );
  }

  if (e.key == "ArrowLeft" || e.code == "ArrowLeft") {
    AudioManager.seek(
      clamp(audio_player.currentTime - 5, 0, audio_player.duration)
    );
  }
});


function saveSettings() {
  for (prop in settings) {
    localStorage.setItem("karaoke_settings." + prop, settings[prop]);
  }
  console.log("saved!");
}

function getSettings() {
  for (prop in settings) {
    settings[prop] = eval(localStorage.getItem("karaoke_settings." + prop, settings[prop]));
  }
  console.log("loaded!");
}

function ensureSettings() {
  for (prop in settings) {
    let s = settings[prop];
    let d = defaultSettings[prop];
    if (isObjectUndefined(s) && !isObjectUndefined(d)) {
      settings[prop] = d;
    }
  }
}

var defaultSettings = structuredClone(settings);
getSettings();
ensureSettings();
BackgroundUI.updateVisibility();
FPSCounter.updateVisibility();



window.addEventListener("beforeunload", () => {
  saveSettings();
})
