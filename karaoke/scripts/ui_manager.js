/// <reference path="common.js">
/// <reference path="audio_manager.js">
/// <reference path="io.js">

var BottomBarUI = {
  bottom_bar: $I("bottom-bar"),
  button_playpause: $I("playback-playpause-button"),
  progress_bar: $I("playback-progress"),
  playback_time: $I("playback-time-current"),
  playback_time_left: $I("playback-time-remaining"),
  fs_img: $I("fullscreen-icon"),
  playpause_img: $I("playpause-icon"),

  isSeeking: false,
  lastTimeout: -32767,

  updateTime() {
    if (!this.isSeeking) {
      this.progress_bar.value = Number.isNaN(audio_player.duration)
        ? 0
        : audio_player.currentTime / audio_player.duration;

      this.playback_time.innerText = Utils.SecondsToTime(
        audio_player.currentTime
      );
      this.playback_time_left.innerText =
        "-" +
        Utils.SecondsToTime(audio_player.duration - audio_player.currentTime);
    }
  },

  updateIcons() {
    this.playpause_img.src = audio_player.paused
      ? "./assets/icon_play.svg"
      : "./assets/icon_pause.svg";

    this.fs_img.src =
      document.fullscreenElement != null
        ? "./assets/icon_fullscreen_exit.svg"
        : "./assets/icon_fullscreen_enter.svg";
  },

  updateAll() {
    BottomBarUI.updateTime();
    BottomBarUI.updateIcons();
  },
  wasFullScreen: false,

  importPackage() {
    BottomBarUI.wasFullScreen = document.fullscreenElement !== null;
    $I("input-file-package").click();
  },

  toggleFullscreen() {
    if (document.fullscreenElement == null) {
      document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    this.updateIcons;
  },

  onProgressBarChange(value) {
    console.log("endseek");
    AudioManager.seek(value * audio_player.duration);
    BottomBarUI.isSeeking = false;
  },

  onProgressBarClick() {
    console.log("beginseek");
    BottomBarUI.isSeeking = true;
  },

  onTouchBarEnter() {
    clearTimeout(BottomBarUI.lastTimeout);
    BottomBarUI.bottom_bar.classList.remove("hidden");
  },

  onTouchBarExit() {
    clearTimeout(BottomBarUI.lastTimeout);
    BottomBarUI.lastTimeout = setTimeout(() => {
      BottomBarUI.bottom_bar.classList.add("hidden");
    }, 2000);
  },
};

var BackgroundUI = {
  background_container: $Q(".background"),
  backgrounds: $A(".background>*>*"),
  background_blurcover: $Q(".background>*"),

  updateVisibility() {
    if (settings.enableBackground) {
      this.enableImages();
    } else {
      this.disableImages();
    }
  },

  loadImage(blob) {
    if (blob == null) {
      this.disableImages();
    } else if (settings.enableBackground) {
      this.enableImages();
    }

    var url = URL.createObjectURL(blob);
    this.background_blurcover.classList.add("black");
    setTimeout(() => {
      BackgroundUI.backgrounds.forEach((b) => {
        b.src = url;
      });
      this.background_blurcover.classList.remove("black");
    }, 500);
  },

  disableImages() {
    this.background_container.classList.add("disabled");
  },

  enableImages() {
    this.background_container.classList.remove("disabled");
  },
};

$I("input-file-package").onchange = IO.inputChangePackage;
$Q("span.special-import").onclick = BottomBarUI.importPackage;
$I("touch-bar").onpointerleave = BottomBarUI.onTouchBarExit;
$I("touch-bar").onpointerenter = BottomBarUI.onTouchBarEnter;
$I("playback-playpause-button").onclick = AudioManager.togglePlayback;
$I("button-import").onclick = BottomBarUI.importPackage;
$I("button-fullscreen").onclick = BottomBarUI.toggleFullscreen;

let pbar = $I("playback-progress");
pbar.onpointerup = () => BottomBarUI.onProgressBarChange(pbar.value);
pbar.onpointerdown = BottomBarUI.onProgressBarClick;

let bgToggleCounter = 0;
$I("fps").onclick = () => {
  bgToggleCounter++;
  if (bgToggleCounter >= 10) {
    bgToggleCounter = 0;
    settings.enableBackground = !settings.enableBackground;
    BackgroundUI.updateVisibility();
  }
};

let holdTimer = NaN;

$I("fps").onpointerdown = () => {
  if (!isNaN(holdTimer)) {
    clearTimeout(holdTimer);
  }
  holdTimer = setTimeout(() => {
    settings.enableFps = !settings.enableFps;
    FPSCounter.updateVisibility();
  }, 3000);
};

$I("fps").onpointerup = () => {
  if (!isNaN(holdTimer)) {
    clearTimeout(holdTimer);
  }
  holdTimer = NaN;
};

var FPSCounter = {
  prevTime: 0,
  frames: 0,
  fps_counter: $I("fps"),
  fps: 0,

  fpsCounter() {
    if (!settings.enableFps) {
      return;
    }

    const time2 = Date.now();
    this.frames++;
    if (time2 > this.prevTime + 1000) {
      let fps = Math.round((this.frames * 1000) / (time2 - this.prevTime));
      this.prevTime = time2;
      this.frames = 0;

      //console.info('FPS: ', fps);

      this.fps_counter.innerText = "" + fps;
      this.fps = fps;
    }
  },

  updateVisibility() {
    this.fps_counter.classList.toggle("hidden", !settings.enableFps);
  },
};

settings.offset = 0;
