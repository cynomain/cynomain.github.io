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

  importPackage() {
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

var LyricsUI = {
  mostRecentLyric: null,
  lastMostRecentLyric: null,
  intervalId: 0,

  ProcessLyrics() {
    let time = audio_player.currentTime;

    const setProgress = (element, progress) => {
      element.style = `--progress: ${progress * 100}%;`;
    };
    const setProgressT = (element, timedObject) => {
      let value =
        (time - timedObject.StartTime) /
        (timedObject.EndTime - timedObject.StartTime);
      setProgress(element, value);
    };

    const set100 = (element) => {
      setProgress(element, 1);
    };
    const setChildren100 = (element) => {
      element.childNodes.forEach((x) => set100(x));
    };

    const set0 = (element) => {
      setProgress(element, 1);
    };
    const setChildren0 = (element) => {
      element.childNodes.forEach((x) => set0(x));
    };

    const isInterlude = (element) => element.classList.contains("interlude");
    const isLyrics = (element) => element.classList.contains("lyrics");
    const isVertical = (element) => element.classList.contains("vertical");

    const setReached = (element) => {
      element.classList.add("reached");
      element.classList.remove("notreached");
    };

    const setNotReached = (element) => {
      element.classList.remove("reached");
      element.classList.add("notreached");
    };

    const removeReachTags = (element) => {
      element.classList.remove("reached");
      element.classList.remove("notreached");
    };

    const setMostRecentIfNot = (element) => {
      if (this.mostRecentLyric != element) {
        this.mostRecentLyric = element;
      }
    };

    if (currentLyrics != null) {
      currentLyrics.forEach((d) => {
        const firstElement = d.elements[0];

        //In Progress
        if (d.data.StartTime <= time && d.data.EndTime >= time) {
          //Yes
          if (d.data.Type === "Vocal") {
            const leads = d.data.Lead;

            //Has Leads -> Word Synced
            if (!isObjectUndefined(leads)) {
              if (!isObjectUndefined(leads.Syllables)) {
                leads = leads.Syllables;
              }
              //Words
              for (let i = 0; i < leads.length; i++) {
                setProgressT(firstElement.childNodes[i], leads[i]);
              }
            }
            // Doesnt have Leads -> Line Synced
            else {
              //console.log("NonLead");
              setProgressT(firstElement, d.data);
            }

            removeReachTags(firstElement);
            setMostRecentIfNot(firstElement);
          }
          // Is Interlude
          else if (d.data.Type === "Interlude") {
            const interlude = d.elements[0];

            setProgressT(interlude, d.data);

            removeReachTags(interlude);
            setMostRecentIfNot(interlude);
            interlude.classList.add("open");
          }
        }

        //Reached
        else if (d.data.EndTime < time) {
          if (isLyrics(firstElement)) {
            setChildren100(firstElement);
            setReached(firstElement);

            if (isVertical(firstElement)) {
              setProgress(firstElement, 1);
            }
          }

          if (isInterlude(firstElement)) {
            set100(firstElement);
            firstElement.classList.remove("open");
          }
        }

        //Not reached
        else {
          if (isLyrics(firstElement)) {
            setNotReached(firstElement);
          }

          if (d.data.Type === "Vocal") {
            setChildren0(firstElement);
            setNotReached(firstElement);

            if (isVertical(firstElement)) {
              set0(firstElement);
            }
          } else if (d.data.Type === "Interlude") {
            set0(firstElement);
            setNotReached(firstElement);

            firstElement.classList.remove("open");
          }
        }

        if (d.elements.length > 1) {
          const vg = d.data.Background[0];
          const bg = d.data.Background[0].Syllables;
          const secondElement = d.elements[1];

          if (vg.StartTime <= time && vg.EndTime >= time) {
            for (let i = 0; i < bg.length; i++) {
              const l = bg[i];
              const wordElement = d.elements[1].childNodes[i];
              setProgressT(wordElement, l);
            }
            removeReachTags(d.elements[1]);
          }
          //Recahed
          else if (vg.EndTime < time) {
            setChildren100(secondElement);
            setReached(secondElement);
          } else {
            setChildren0(secondElement);
            setNotReached(secondElement);
          }
        }

        //NEW LOGIC
        if (this.mostRecentLyric !== this.lastMostRecentLyric) {
          smoothScroll(lyrics_area, this.mostRecentLyric);
          this.lastMostRecentLyric = this.mostRecentLyric;
        }
      });
    }

    if (!audio_player.paused) {
      LyricsUI.start();
    }

    FPSCounter.fpsCounter();
  },

  start() {
    LyricsUI.intervalId = requestAnimationFrame(LyricsUI.ProcessLyrics);
  },

  stop() {
    cancelAnimationFrame(LyricsUI.intervalId);
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

var FPSCounter = {
  prevTime: 0,
  frames: 0,
  fps_counter: $I("fps"),

  fpsCounter() {
    const time2 = Date.now();
    this.frames++;
    if (time2 > this.prevTime + 1000) {
      let fps = Math.round((this.frames * 1000) / (time2 - this.prevTime));
      this.prevTime = time2;
      this.frames = 0;

      //console.info('FPS: ', fps);

      this.fps_counter.innerText = "" + fps;
    }
  },
};
