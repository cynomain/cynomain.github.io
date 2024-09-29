/// <reference path="common.js">
/// <reference path="ui_manager.js">

var AudioManager = {
  seek(ms) {
    //console.log(ms);
    audio_player.currentTime = ms;
  },

  loadAudio(blob) {
    audio_player.pause();
    audio_player.src = URL.createObjectURL(blob);
    audio_player.load();
    BottomBarUI.progress_bar.disabled = false;
    BottomBarUI.button_playpause.disabled = false;
    AudioManager.seek(0);
  },
  
  play() {
    audio_player.play();
    noSleep.enable();
    LyricsUI.start();
    BottomBarUI.updateAll();
  },

  pause() {
    LyricsUI.stop();
    audio_player.pause();
    noSleep.disable();
    BottomBarUI.updateAll();
  },

  togglePlayback() {
    if (audio_player.readyState < 2) {
      return;
    }

    if (audio_player.paused) {
      AudioManager.play();
      
    } else {
      AudioManager.pause();
    }

    BottomBarUI.updateIcons();
  },

  onTimeUpdate(ev) {
    BottomBarUI.updateTime();
  },

  onEnd(ev) {
    audio_player.pause();
    BottomBarUI.updateIcons();
  },

  playOnceReady() {
    audio_player.addEventListener(
      "canplay",
      () => {
        this.play();
      },
      { once: true }
    );
  },
};

audio_player.addEventListener("timeupdate", AudioManager.onTimeUpdate);
audio_player.addEventListener("ended", AudioManager.onEnd);
