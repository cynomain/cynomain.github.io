class TTMLRenderer {
  static createLead(vocalGroup) {
    if (vocalGroup.Type == "Interlude") {
      return [this.createInterlude()];
    }

    var line = this.createLine(vocalGroup);
    if (vocalGroup.Background === undefined) {
      return [line];
    } else {
      return [line, this.createBackground(vocalGroup)];
    }
  }

  static createLine(vocalGroup) {
    var el = document.createElement("p");
    el.className =
      "lyrics notreached " + (vocalGroup.OppositeAligned ? "right" : "left");
    if (vocalGroup.Lead) {
      let theLead = vocalGroup.Lead;
      if (vocalGroup.Lead.Syllables) {
        theLead = vocalGroup.Lead.Syllables;
      }

      for (let i = 0; i < theLead.length; i++) {
        const word = theLead[i];
        let wordElement = this.createWord(
          word.Text + (word.IsPartOfWord ? "" : " ")
        );
        el.appendChild(wordElement);
      }
    } else {
      let wordElement = this.createWord(vocalGroup.Text);
      el.appendChild(wordElement);
      el.classList.add("vertical");
    }

    el.addEventListener("click", () => {
      MediaControls.Seek(vocalGroup.StartTime);
    });

    return el;
  }

  static createBackground(vocalGroup) {
    var el = document.createElement("p");
    el.className =
      "lyrics notreached small " +
      (vocalGroup.OppositeAligned ? "right" : "left");
    el.style = "--progress: 0%";

    for (let i = 0; i < vocalGroup.Background.length; i++) {
      const word = vocalGroup.Background[i];
      let wordElement = this.createWord(
        word.Text + (word.IsPartOfWord ? "" : " ")
      );
      el.appendChild(wordElement);
    }

    return el;
  }

  static createWord(value) {
    var el = document.createElement("span");
    el.className = "lyrics-word";
    el.style = "--progress: 0%;";
    el.innerText = value;
    return el;
  }

  static createInterlude() {
    var el = document.createElement("p");
    el.className = "interlude close";
    el.style = "--progress: 0%";

    //for (let i = 0; i < 4; i++) {
    var sp = document.createElement("span");
    sp.className = "lyrics-word interlude-circles";
    sp.innerText = "⬤ ⬤ ⬤ ⬤";
    //sp.innerText = "⬤";
    //sp.style = "--progress: 0%";
    el.appendChild(sp);
    //}

    return el;
  }
}

var lyrics_area;
var import_dialog;
var import_status_song;
var import_status_lyric;
var import_selected_song;
var import_selected_lyric;
var import_selected_lyric_text;
var audio_player;
var button_playpause;
//var button_playpause_span;
var progress_bar;
var bottom_bar;
//var fs_text;
var fs_img;
var playpause_img;
var eye_img;

var import_dialog_separate;
var import_dialog_package;
var import_dialog_main;

var playback_time;
var playback_time_left;

var currentLyrics;

var background_container;
var backgrounds;

var settings_doImageBackground = false;
var sttings_fontSizeLyrics = 1;

var FPS_COUNTER;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const $Q = (q) => document.querySelector(q);
const $A = (q) => document.querySelectorAll(q);
const $I = (id) => document.getElementById(id);

var noSleep = new NoSleep();
var isWakeLock = false;

window.addEventListener("load", () => {
  lyrics_area = $I("lyrics-area");
  import_dialog = $I("import-dialog");
  import_status_lyric = $I("import-status-lyric");
  import_status_song = $I("import-status-song");
  audio_player = $I("audio-player");
  button_playpause = $I("playback-playpause-button");
  //button_playpause_span = button_playpause.children[0];
  progress_bar = $I("playback-progress");
  playback_time = $I("playback-time-current");
  playback_time_left = $I("playback-time-remaining");
  bottom_bar = $I("bottom-bar");
  //fs_text = $I("fullscreen-text");
  fs_img = $I("fullscreen-icon");
  playpause_img = $I("playpause-icon");
  eye_img = $I("eye-icon");

  import_dialog_main = $I("import-dialog-main");
  import_dialog_separate = $I("import-dialog-separate");
  import_dialog_package = $I("import-dialog-package");

  progress_bar.disabled = true;
  button_playpause.disabled = true;

  audio_player.addEventListener("timeupdate", MediaControls.onTimeUpdate);
  audio_player.addEventListener("ended", MediaControls.onEnd);

  background_container = $Q(".background");
  backgrounds = $A(".background>*");

  FPS_COUNTER = $I("fps");

  document.body.addEventListener("keyup", function (e) {
    if (e.target.tagName == "button") return;

    if (e.key == " " || e.code == "Space") {
      MediaControls.TogglePausePlay();
    }
    if (e.key == "Enter" || e.code == "Enter") {
      MediaControls.TogglePausePlay();
    }
    if (e.key == "ArrowRight" || e.code == "ArrowRight") {
      MediaControls.Seek(
        clamp(audio_player.currentTime + 5, 0, audio_player.duration)
      );
    }

    if (e.key == "ArrowLeft" || e.code == "ArrowLeft") {
      MediaControls.Seek(
        clamp(audio_player.currentTime - 5, 0, audio_player.duration)
      );
    }
  });
});

function ToggleSleep() {
  if (isWakeLock) {
    noSleep.disable();
    eye_img.src = "./assets/icon_eye_off.svg";
    isWakeLock = false;
  } else {
    noSleep.enable();
    eye_img.src = "./assets/icon_eye_on.svg";
    isWakeLock = true;
  }
}

isSeeking = false;
intervalId = 0;
prevTime = Date.now();

//OLD LOGIC
hasScrolledThisFrame = false;
lastStartTime = 0;

//NEW LOGIC
mostRecentLyric = null;
lastMostRecentLyric = null;

class MediaControls {
  static ToggleFullscreen() {
    if (document.fullscreenElement == null) {
      document.body.requestFullscreen();
      //fs_text.innerText = "fullscreen_exit";
      fs_img.src = "./assets/icon_fullscreen_exit.svg";
    } else {
      document.exitFullscreen();
      //fs_text.innerText = "fullscreen";
      fs_img.src = "./assets/icon_fullscreen_enter.svg";
    }
  }

  static LoadAudio(fileObject) {
    //button_playpause_span.innerText = "play_arrow";
    playpause_img.src = "./assets/icon_play.svg";
    audio_player.pause();

    audio_player.src = URL.createObjectURL(fileObject);
    audio_player.load();
    progress_bar.disabled = false;
    button_playpause.disabled = false;
    this.Seek(0);
    isSeeking = false;
    progress_bar.value = 0;
  }

  static LoadCurrentAudio() {
    this.LoadAudio(import_selected_song);
  }

  static TogglePausePlay() {
    if (audio_player.readyState < 2) {
      return;
    }

    if (audio_player.paused) {
      intervalId = requestAnimationFrame(MediaControls.ProcessLyrics);
      /*
      intervalId = setInterval(() => {
        this.ProcessLyrics();
      }, 20);
*/

      audio_player.play();
      //button_playpause_span.innerText = "pause";
      playpause_img.src = "./assets/icon_pause.svg";
    } else {
      cancelAnimationFrame(intervalId);
      //clearInterval(intervalId);
      audio_player.pause();
      //button_playpause_span.innerText = "play_arrow";
      playpause_img.src = "./assets/icon_play.svg";
    }
  }

  static Seek(toTimeMS) {
    audio_player.currentTime = toTimeMS;
  }

  static onTimeUpdate(ev) {
    if (!isSeeking) {
      progress_bar.value = Number.isNaN(audio_player.duration)
        ? 0
        : audio_player.currentTime / audio_player.duration;
    }
    playback_time.innerText = Utils.SecondsToTime(audio_player.currentTime);
    playback_time_left.innerText =
      "-" + Utils.SecondsToTime(audio_player.duration - audio_player.currentTime);
  }

  static ProcessLyrics() {
    let time = audio_player.currentTime;
    if (currentLyrics != null) {
      let focusedLyric;

      currentLyrics.forEach((d) => {
        if (d.data.StartTime <= time && d.data.EndTime >= time) {
          //Yes
          if (d.data.Type === "Vocal") {
            const leads = d.data.Lead;
            if (leads !== undefined && leads !== null) {
              //Words
              for (let i = 0; i < leads.length; i++) {
                const l = leads[i];
                const wordElement = d.elements[0].childNodes[i];
                wordElement.style = `--progress: ${((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
                  }%;`;
              }
            } else {
              //Lines
              let l = d.data;
              //const wordElement = d.elements[0].childNodes[0];
              const wordElement = d.elements[0];
              wordElement.style = `--progress: ${((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
                }%;`;
            }

            d.elements[0].classList.remove("reached");
            d.elements[0].classList.remove("notreached");

            if (mostRecentLyric != d.elements[0]) {
              mostRecentLyric = d.elements[0];
            }

            /*
          } else if (d.data.Type === "Line") {
            //Single
            //const wordElement = d.elements[0].childNodes[0];
            const wordElement = d.elements[0].parentNode;
            wordElement.style = `--progress: ${
              ((time - d.data.StartTime) /
                (d.data.EndTime - d.data.StartTime)) *
              100
            }%;`;

            d.elements[0].classList.remove("reached");
            d.elements[0].classList.remove("notreached");

            if (!hasScrolledThisFrame && lastStartTime != d.data.StartTime) {
              lastStartTime = d.data.StartTime;
              MediaControls.smoothScroll(lyrics_area, d.elements[0]);
            }
            */
          } else if (d.data.Type === "Interlude") {
            d.elements[0].style = `--progress: ${((time - d.data.StartTime) /
              (d.data.EndTime - d.data.StartTime)) *
              100
              }%;`;

            /*
            for (let i = 0; i < 4; i++) {
              let percent =
                ((time - d.data.StartTime) /
                  (d.data.EndTime - d.data.StartTime)) *
                100;

              let displayPercent = clamp(((percent - 25 * i) / 25*(i+1)) * 100, 0, 100);

              d.elements[0].childNodes[i].style = `--progress: ${displayPercent}%;`;
            }
            */

            d.elements[0].classList.remove("reached");
            d.elements[0].classList.add("open");
            d.elements[0].classList.remove("notreached");

            /*
            if (!hasScrolledThisFrame && lastStartTime != d.data.StartTime) {
              lastStartTime = d.data.StartTime;
              this.smoothScroll(lyrics_area, d.elements[0]);
            }
            */
            if (mostRecentLyric != d.elements[0]) {
              mostRecentLyric = d.elements[0];
            }
          }

          if (d.elements.length > 1) {
            //there is background
            const bg = d.data.Background;
            for (let i = 0; i < bg.length; i++) {
              const l = bg[i];
              const wordElement = d.elements[1].childNodes[i];
              wordElement.style = `--progress: ${((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
                }%;`;
            }
            d.elements[1].classList.remove("reached");
            d.elements[1].classList.remove("notreached");
          }
        }
        //Reached
        else if (d.data.EndTime < time) {
          if (d.elements[0].classList.contains("lyrics")) {
            d.elements[0].childNodes.forEach(
              (n) => (n.style = "--progress: 100%")
            );
            d.elements[0].classList.add("reached");

            if (d.elements[0].classList.contains("vertical")) {
              d.elements[0].style = "--progress: 100%";
            }
          }

          if (d.elements.length > 1) {
            d.elements[1].childNodes.forEach(
              (n) => (n.style = "--progress: 100%")
            );
            d.elements[1].classList.add("reached");
          }

          if (d.elements[0].classList.contains("interlude")) {
            d.elements[0].style = "--progress: 100%";
            d.elements[0].classList.remove("open");
          }
        }
        //Not reached
        else {
          if (d.elements[0].classList.contains("lyrics")) {
            d.elements[0].classList.add("notreached");
          }

          if (d.data.Type === "Vocal") {
            d.elements[0].childNodes.forEach((n) => {
              n.style = "--progress: 0%;";
            });

            d.elements[0].classList.remove("reached");

            if (d.elements[0].classList.contains("vertical")) {
              d.elements[0].style = "--progress: 0%";
            }
          } else if (d.data.Type === "Interlude") {
            /*else if (d.data.Type === "Line") {
            //Single
            const wordElement = d.elements[0].childNodes[0];
            wordElement.style = "--progress: 0%;";

            d.elements[0].classList.remove("reached");
          } 
          */
            d.elements[0].style = "--progress: 0%;";

            d.elements[0].classList.remove("reached");
            d.elements[0].classList.remove("open");
          }

          if (d.elements.length > 1) {
            //there is background
            const bg = d.data.Background;
            for (let i = 0; i < bg.length; i++) {
              const wordElement = d.elements[1].childNodes[i];
              wordElement.style = "--progress: 0%;";
            }

            d.elements[1].classList.remove("reached");
          }
        }
        hasScrolledThisFrame = false;

        //NEW LOGIC
        if (mostRecentLyric !== lastMostRecentLyric) {
          MediaControls.smoothScroll(lyrics_area, mostRecentLyric);
          lastMostRecentLyric = mostRecentLyric;
        }
      });
    }

    const time2 = Date.now();
    frames++;
    if (time2 > prevTime + 1000) {
      let fps = Math.round((frames * 1000) / (time2 - prevTime));
      prevTime = time2;
      frames = 0;

      //console.info('FPS: ', fps);

      FPS_COUNTER.innerText = "" + fps;
    }

    if (!audio_player.paused) {
      intervalId = requestAnimationFrame(MediaControls.ProcessLyrics);
    }
  }

  static smoothScroll(parent, target) {
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top + parent.scrollTop;
    const targetHeight = targetRect.height;

    // Calculate desired scroll position for centering
    const parentHeight = parent.offsetHeight;
    const scrollTo =
      targetTop - (parentHeight - targetHeight) / 2 - targetHeight;

    // Use requestAnimationFrame for smooth animation
    parent.scrollTo({
      top: scrollTo,
      behavior: "smooth", // Ensure smooth scrolling behavior
      block: "center",
    });
  }

  static onEnd(ev) {
    audio_player.pause();
    //button_playpause_span.innerText = "play_arrow";
    playpause_img.src = "./assets/icon_play.svg";
  }

  static onProgressBarChange(value) {
    MediaControls.Seek(value * audio_player.duration);
    isSeeking = false;
  }

  static onProgressBarClick() {
    isSeeking = true;
  }

  static onTouchBarEnter() {
    if (typeof this.lastTimeout !== "undefined") {
      clearTimeout(this.lastTimeout);
    }
    bottom_bar.classList.remove("hidden");
  }

  static onTouchBarExit() {
    if (typeof this.lastTimeout !== "undefined") {
      clearTimeout(this.lastTimeout);
    }
    this.lastTimeout = setTimeout(() => {
      bottom_bar.classList.add("hidden");
    }, 2000);
  }

  static loadImage(blob) {
    if (blob == null) {
      background_container.classList.add("disabled");
      return;
    }

    background_container.classList.remove("disabled");

    var url = URL.createObjectURL(blob);
    backgrounds.forEach((b) => {
      b.src = url;
    });
  }

  static PlayOnceReady() {
    audio_player.addEventListener(
      "canplay",
      () => {
        MediaControls.TogglePausePlay();
      },
      { once: true }
    );
  }
}

class LyricsControls {
  static LoadAsTTML(text) {
    currentLyrics = MakeTTML(text);
  }

  static LoadAsObject(text) {
    currentLyrics = MakeObject(text);
  }

  static LoadAsLRC(text) {
    currentLyrics = Make
  }

  static LoadCurrentAsObject() {
    this.LoadAsObject(import_selected_lyric_text);
  }

  static LoadCurrentAsTTML() {
    this.LoadAsTTML(import_selected_lyric_text);
  }

  static LoadCurrentAsLRC() {
    this.LoadAsLRC(import_selected_lyric_text);
  }
}

function MakeLRC(lrc){
  let data = LRC.Parse(lrc);
  return MakeObject(data);
}

function MakeTTML(ttml) {
  let data = RenderTTML(ttml);
  return ApplyToDoc(data);
}

function MakeObject(obj) {
  let lrcJson = ProcessJson(JSON.parse(obj));

  console.log(lrcJson);

  let data = RenderObject(lrcJson);
  return ApplyToDoc(data);
}

function ApplyToDoc(data) {
  lyrics_area.innerHTML = "";
  data.forEach((d) => {
    d.elements.forEach((e) => {
      lyrics_area.appendChild(e);
    });
  });
  return data;
}

function RenderTTML(ttml) {
  var parsed = TTML.ParseLyrics(ttml);
  return RenderObject(parsed);
}

function RenderObject(data) {
  var data2 = [];
  var vocalgroup = data.VocalGroups ?? data.Content;
  vocalgroup.forEach((vg) => {
    var elementsCreated = TTMLRenderer.createLead(vg);
    data2.push({ data: vg, elements: elementsCreated });
  });
  return data2;
}

function ProcessJson(lrcJson) {
  let js = lrcJson;
  if (js.Content && js.Type === "Syllable") {
    //Is new
    //let newContent = [];
    js.Content.forEach(x => {
      x.StartTime = x.Lead.StartTime;
      x.EndTime = x.Lead.EndTime;
      x.Lead = x.Lead.Syllables;

      //delete x.Lead.Syllables;
      //newContent.push(x);
    });

    //js.Content = newContent;
  }

  // ADD INTERLUDES
  if (js.Content) {
    let vgs = js.Content;

    const MinimumInterludeDuration = 2;
    const EndInterludeEarlyBy = 0.25; // Seconds before our analytical end. This is used as a prep for the next vocal

    // First check if our first vocal-group needs an interlude before it
    let addedStartInterlude = false;
    {
      const firstVocalGroup = vgs[0];
      if (firstVocalGroup.StartTime >= MinimumInterludeDuration) {
        vgs.unshift({
          Type: "Interlude",
          StartTime: 0,
          EndTime: firstVocalGroup.StartTime - EndInterludeEarlyBy,
        });
        addedStartInterlude = true;
      }
    }
    // Now go through our vocals and determine if we need to add an interlude anywhere
    for (
      let index = vgs.length - 1;
      index > (addedStartInterlude ? 1 : 0);
      index -= 1
    ) {
      const endingVocalGroup = vgs[index];
      const startingVocalGroup = vgs[index - 1];
      if (
        endingVocalGroup.StartTime - startingVocalGroup.EndTime >=
        MinimumInterludeDuration
      ) {
        vgs.splice(index, 0, {
          Type: "Interlude",
          StartTime: startingVocalGroup.EndTime,
          EndTime: endingVocalGroup.StartTime - EndInterludeEarlyBy,
        });
      }
    }
  }
  return js;
}

hasSelectedSong = false;
hasSelectedLyric = false;
///DEPRECATED
class ImportMenu {
  static readLyric() {
    var reader = new FileReader();

    reader.onload = function (e) {
      import_selected_lyric_text = reader.result;
    };

    reader.readAsText(import_selected_lyric);
  }

  static buttonSong() {
    $I("input-file-song").click();
  }

  static buttonLyric() {
    $I("input-file-lyric").click();
  }

  static inputChangeSong(e) {
    console.log(e.target.files);
    var file = e.target.files[0];

    import_status_song.innerText = "Song: " + file.name;
    import_selected_song = file;
    hasSelectedSong = true;
    this.checkEnableOkButton();
  }

  static inputChangeLyric(e) {
    console.log(e.target.files);
    import_status_lyric.innerText = "Lyric: " + e.target.files[0].name;
    import_selected_lyric = e.target.files[0];

    hasSelectedLyric = true;
    this.checkEnableOkButton();
  }

  static checkEnableOkButton() {
    $I("import-button-ok").disabled = !(
      hasSelectedSong && hasSelectedLyric
    );
  }

  static openImportMenu() {
    import_dialog.classList.remove("closed");
    import_status_song.innerText = "Song: -";
    import_status_lyric.innerText = "Lyric: -";
    hasSelectedLyric = false;
    hasSelectedSong = false;
    this.checkEnableOkButton();
  }

  static closeImportMenu() {
    import_dialog.classList.add("closed");
  }

  static LoadFiles() {
    MediaControls.LoadCurrentAudio();
    this.readLyric();
    LyricsControls.LoadCurrentAsObject();
    audio_player.addEventListener(
      "canplay",
      () => {
        MediaControls.TogglePausePlay();
      },
      { once: true }
    );
  }
}

class ImportMenuEx {
  static buttonSong() {
    $I("input-file-song").click();

    var ismBtn = $I("import-separate-music");
    ismBtn.disabled = true;
    setTimeout(() => {
      ismBtn.disabled = false;
    }, 1000);

    /*
    document.body.onfocus = function () {
 
      document.body.onfocus = null;
    };
    */
  }

  static buttonLyric() {
    $I("input-file-lyric").click();

    var istBtn = $I("import-separate-ttml");
    istBtn.disabled = true;

    setTimeout(() => {
      istBtn.disabled = false;
    }, 1000);
  }

  static buttonPackage() {
    $I("input-file-package").click();

    //VIA KARAOKE PACKAGE
    var vkpButton = $I("import-package");
    vkpButton.disabled = true;
    setTimeout(() => {
      vkpButton.disabled = false;
    }, 1000);
  }

  static inputChangeSong(e) {
    console.log(e.target.files);
    var file = e.target.files[0];
    import_status_song.innerText = "Song: " + file.name;
    import_selected_song = file;
    hasSelectedSong = true;
    this.checkEnableOkButton();
    //}
  }

  static inputChangeLyric(e) {
    console.log(e.target.files);
    import_status_lyric.innerText = "Lyric: " + e.target.files[0].name;
    import_selected_lyric = e.target.files[0];
    this.readLyric();
    hasSelectedLyric = true;
    this.checkEnableOkButton();
  }

  static inputChangePackage(e) {
    const file = e.target.files[0];

    if (file.name.toLowerCase().endsWith("pkp")) {
      //It is a zip file

      try {
        JSZip.loadAsync(file).then(
          function (zip) {
            console.log("loaded zip");

            zip
              .file("meta.json")
              .async("string")
              .then((m) => {
                let json = JSON.parse(m);
                let files = json.files;
                let songPath = files.song;

                let ttmlPath = files.ttml;
                let jsonPath = files.json;
                let lrcPath = files.lrc;

                let imgPath = files.album_cover;

                zip
                  .file(songPath)
                  .async("blob")
                  .then((blob) => {
                    //console.log(blob);
                    import_selected_song = blob;

                    let lyricsToBeRead = ttmlPath ?? jsonPath;
                    if (isObjectUndefined(lyricsToBeRead)) {
                      throw new Error("No lyrics in meta file.");
                    }

                    let type = isObjectUndefined(ttmlPath)
                      ? isObjectUndefined(jsonPath)
                        ? isObjectUndefined(lrcPath)
                          ? "null"
                          : "lrc"
                        : "json"
                      : "ttml";


                    zip
                      .file(lyricsToBeRead)
                      .async("string")
                      .then((s) => {
                        import_selected_lyric_text = s;

                        /*
                        var imgF = zip.file(imgPath);
                        if (imgF != null) {
                          console.log("there is img");
                          imgF.async("blob").then((b) => {
                            MediaControls.loadImage(b);
                            ImportMenuEx.LoadFiles();
                          });
                        } else {
                          MediaControls.loadImage(null);
                          ImportMenuEx.LoadFiles();
                        }
                        */

                        ImportMenuEx.closeAll();
                        MediaControls.LoadCurrentAudio();
                        switch (type) {
                          case "ttml":
                            LyricsControls.LoadCurrentAsTTML();
                            break;

                          case "json":
                            LyricsControls.LoadCurrentAsObject();
                            break;
                          case "lrc":
                            LyricsControls.LoadCurrentAsLRC();
                            break;
                          default:
                            break;
                        }
                        MediaControls.PlayOnceReady();
                      });
                  });
              });
          },
          function (e) {
            alert("Error reading zip! " + e.message);
          }
        );
      } catch (e) {
        alert("an error occured: " + e);
      }
    }
  }

  static readLyric() {
    var reader = new FileReader();

    reader.onload = function (e) {
      import_selected_lyric_text = reader.result;
    };

    reader.readAsText(import_selected_lyric);
  }

  static checkEnableOkButton() {
    $I("import-button-ok").disabled = !(
      hasSelectedSong && hasSelectedLyric
    );
  }

  static openImportMenu() {
    import_dialog_main.classList.remove("closed");
  }

  static openImportMenuSeparate() {
    import_dialog_separate.classList.remove("closed");
    import_status_song.innerText = "Song: -";
    import_status_lyric.innerText = "Lyric: -";
    hasSelectedLyric = false;
    hasSelectedSong = false;
    this.checkEnableOkButton();
  }

  static openImportMenuPackage() {
    import_dialog_package.classList.remove("closed");
  }

  static closeImportMenu() {
    import_dialog_main.classList.add("closed");
  }

  static closeImportMenuSeparate() {
    import_dialog_separate.classList.add("closed");
  }

  static closeImportMenuPackage() {
    import_dialog_package.classList.add("closed");
  }

  static closeAll() {
    this.closeImportMenu();
    this.closeImportMenuSeparate();
    this.closeImportMenuPackage();
  }

  static LoadFiles() {
    this.closeAll();
    MediaControls.LoadCurrentAudio();
    LyricsControls.LoadCurrentAsObject();
    MediaControls.PlayOnceReady();
  }
}

class Utils {
  static ms2time(ms) {
    //1029301.232 ms
    //1029.301232 secs
    //1029.301232 % 60 = 9.301232
    //1029.301232-9.301232 = 1020 secs
    //1020/60 = 19 mins
    let rawsecs = ms / 1000.0;
    let secs = rawsecs % 60;
    //let millis = (secs % 1) * 1000;
    let mins = (rawsecs - secs) / 60;
    let flooredsecs = Math.floor(secs);

    return (
      mins.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ":" +
      flooredsecs.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })
    );
  }

  static SecondsToTime(secs) {
    //1029301.232 ms
    //1029.301232 secs
    //1029.301232 % 60 = 9.301232
    //1029.301232-9.301232 = 1020 secs
    //1020/60 = 19 mins
    let decimalsecs = secs % 60;
    let mins = (secs - decimalsecs) / 60.0;
    //let millis = (decimalsecs % 1) * 1000;
    let realsecs = Math.floor(decimalsecs);

    return (
      mins.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ":" +
      realsecs.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })
    );
  }
}

function isObjectUndefined(obj) {
  return typeof obj === "undefined" || obj === null || obj === undefined;
}
