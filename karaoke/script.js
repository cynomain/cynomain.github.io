class TTML {
  static MinimumInterludeDuration = 2;
  static EndInterludeEarlyBy = 0.25; // Seconds before our analytical end. This is used as a prep for the next vocal
  // Recognition Constants
  static SyllableSyncCheck = /<span\s+begin="[\d:.]+"/g;
  static LineSyncCheck = /<p\s+begin="[\d:.]+"/g;
  static FeatureAgentAttribute = "ttm:agent";
  static FeatureRoleAttribute = "ttm:role";
  static AgentVersion = /^v(\d+)$/;
  static TimeFormat = /(?:(\d+):)?(\d+)(?:\.(\d+))?$/;

  static GetFeatureAgentVersion(element) {
    var _a;
    const featureAgent = element.getAttribute(this.FeatureAgentAttribute);
    const featureAgentVersion =
      featureAgent === null
        ? undefined
        : (_a = this.AgentVersion.exec(featureAgent)) === null || _a === void 0
        ? void 0
        : _a[1];
    return featureAgentVersion === undefined
      ? undefined
      : parseInt(featureAgentVersion, 10);
  }

  static GetTimeInSeconds(time) {
    // Grab our matches
    const matches = this.TimeFormat.exec(time);
    if (matches === null) {
      return -1;
    }
    // Grab all our matches
    const minutes = matches[1] ? parseInt(matches[1], 10) : 0;
    const seconds = parseInt(matches[2], 10);
    const milliseconds = matches[3] ? parseInt(matches[3], 10) : 0;
    return minutes * 60 + seconds + milliseconds / 1000;
  }

  static IsNodeASpan(node) {
    return node.nodeName === "span";
  }

  // Parse Methods
  static parser = new DOMParser();

  static ParseAppleMusicLyrics(text) {
    // Our text is XML so we'll just parse it first
    const parsedDocument = this.parser.parseFromString(text, "text/xml");
    const body = parsedDocument.querySelector("body");
    // Determine if we're syllable synced, line synced, or statically synced
    const syncType = this.SyllableSyncCheck.test(text)
      ? "Syllable"
      : this.LineSyncCheck.test(text)
      ? "Line"
      : "Static";
    // For static-sync we just have to extract each line of text
    if (syncType === "Static") {
      const result = {
        NaturalAlignment: "Left",
        Language: "en",
        Type: "Static",
        Lyrics: [],
      };
      for (const element of body.children) {
        if (element.tagName === "div") {
          for (const line of element.children) {
            if (line.tagName === "p") {
              // Create our lyric-metadata
              const lyricMetadata = {
                Text: line.textContent,
              };
              result.Lyrics.push(lyricMetadata);
            }
          }
        }
      }
      // Determine our language AND natural-alignment
      {
        // Put all our text together for processing
        let textToProcess = result.Lyrics[0].Text;
        for (let index = 1; index < result.Lyrics.length; index += 1) {
          textToProcess += `\n${result.Lyrics[index].Text}`;
        }
        result.NaturalAlignment = "Left";
      }

      // Wait for all our stored-promises to finish
      return result;
    } else if (syncType == "Line") {
      const result = {
        NaturalAlignment: "Left",
        Language: "en",
        StartTime: 0,
        EndTime: 0,
        Type: "Line",
        VocalGroups: [],
      };
      for (const element of body.children) {
        if (element.tagName === "div") {
          for (const line of element.children) {
            if (line.tagName === "p") {
              // Determine whether or not we are opposite-aligned
              const featureAgentVersion = this.GetFeatureAgentVersion(line);
              const oppositeAligned =
                featureAgentVersion === undefined
                  ? false
                  : featureAgentVersion === 2;
              // Grab our times
              const start = this.GetTimeInSeconds(line.getAttribute("begin"));
              const end = this.GetTimeInSeconds(line.getAttribute("end"));
              // Store our lyrics now
              const vocalGroup = {
                Type: "Vocal",
                OppositeAligned: oppositeAligned,
                Text: line.textContent,
                StartTime: start,
                EndTime: end,
              };
              result.VocalGroups.push(vocalGroup);
            }
          }
        }
      }
      // Now set our StartTime/EndTime
      {
        const firstLine = result.VocalGroups[0];
        const lastLine = result.VocalGroups[result.VocalGroups.length - 1];
        result.StartTime = firstLine.StartTime;
        result.EndTime = lastLine.EndTime;
      }
      // Determine our language AND natural-alignment
      {
        // Put all our text together for processing
        const lines = [];
        for (const vocalGroup of result.VocalGroups) {
          if (vocalGroup.Type === "Vocal") {
            lines.push(vocalGroup.Text);
          }
        }
        const textToProcess = lines.join("\n");
        // Determine our language
        result.NaturalAlignment = "Left";
      }
      // Wait for all our stored-promises to finish
      return result;
    } else {
      const result = {
        NaturalAlignment: "Left",
        Language: "en",
        StartTime: 0,
        EndTime: 0,
        Type: "Syllable",
        VocalGroups: [],
      };
      for (const element of body.children) {
        if (element.tagName === "div") {
          for (const line of element.children) {
            if (line.tagName === "p") {
              // Determine whether or not we are opposite-aligned
              const featureAgentVersion = this.GetFeatureAgentVersion(line);
              const oppositeAligned =
                featureAgentVersion === undefined
                  ? false
                  : featureAgentVersion === 2;
              // Store our lyrics now
              const leadLyrics = [];
              const backgroundLyrics = [];
              const lineNodes = line.childNodes;
              for (const [index, syllable] of lineNodes.entries()) {
                if (this.IsNodeASpan(syllable)) {
                  // We have to first determine if we're a background lyric - since we have inner spans if we are
                  const isBackground =
                    syllable.getAttribute(this.FeatureRoleAttribute) === "x-bg";
                  if (isBackground) {
                    // Gather our background-lyrics
                    const backgroundNodes = syllable.childNodes;
                    for (const [
                      backgroundIndex,
                      backgroundSyllable,
                    ] of backgroundNodes.entries()) {
                      if (this.IsNodeASpan(backgroundSyllable)) {
                        const start = this.GetTimeInSeconds(
                          backgroundSyllable.getAttribute("begin")
                        );
                        const end = this.GetTimeInSeconds(
                          backgroundSyllable.getAttribute("end")
                        );
                        const nextNode = backgroundNodes[backgroundIndex + 1];
                        const backgroundLyric = {
                          Text: backgroundSyllable.textContent,
                          IsPartOfWord:
                            nextNode === undefined
                              ? false
                              : nextNode.nodeType !== Node.TEXT_NODE,
                          StartTime: start,
                          EndTime: end,
                        };
                        backgroundLyrics.push(backgroundLyric);
                      }
                    }
                    // Now determine whether or not we are surrounded by parentheses
                    {
                      const firstBackgroundSyllable = backgroundLyrics[0];
                      const lastBackgroundSyllable =
                        backgroundLyrics[backgroundLyrics.length - 1];
                      if (
                        firstBackgroundSyllable.Text.startsWith("(") &&
                        lastBackgroundSyllable.Text.endsWith(")")
                      ) {
                        // We are surrounded by parentheses, so we'll remove them
                        firstBackgroundSyllable.Text =
                          firstBackgroundSyllable.Text.slice(1);
                        lastBackgroundSyllable.Text =
                          lastBackgroundSyllable.Text.slice(0, -1);
                      }
                    }
                  } else {
                    const start = this.GetTimeInSeconds(
                      syllable.getAttribute("begin")
                    );
                    const end = this.GetTimeInSeconds(
                      syllable.getAttribute("end")
                    );
                    const nextNode = lineNodes[index + 1];
                    const leadLyric = {
                      Text: syllable.textContent,
                      IsPartOfWord:
                        nextNode === undefined
                          ? false
                          : nextNode.nodeType !== Node.TEXT_NODE,
                      StartTime: start,
                      EndTime: end,
                    };
                    leadLyrics.push(leadLyric);
                  }
                }
              }
              // Now store our line
              result.VocalGroups.push({
                Type: "Vocal",
                OppositeAligned: oppositeAligned,
                StartTime:
                  backgroundLyrics.length === 0
                    ? leadLyrics[0].StartTime
                    : Math.min(
                        leadLyrics[0].StartTime,
                        backgroundLyrics[0].StartTime
                      ),
                EndTime:
                  backgroundLyrics.length === 0
                    ? leadLyrics[leadLyrics.length - 1].EndTime
                    : Math.max(
                        leadLyrics[leadLyrics.length - 1].EndTime,
                        backgroundLyrics[backgroundLyrics.length - 1].EndTime
                      ),
                Lead: leadLyrics,
                Background:
                  backgroundLyrics.length === 0 ? undefined : backgroundLyrics,
              });
            }
          }
        }
      }
      // Now set our StartTime/EndTime
      {
        const firstLine = result.VocalGroups[0];
        const lastLine = result.VocalGroups[result.VocalGroups.length - 1];
        result.StartTime = firstLine.StartTime;
        result.EndTime = lastLine.EndTime;
      }
      // Determine our language AND natural-alignment
      {
        // Put all our text together for processing
        const lines = [];
        for (const vocalGroup of result.VocalGroups) {
          if (vocalGroup.Type === "Vocal") {
            let text = vocalGroup.Lead[0].Text;
            for (let index = 1; index < vocalGroup.Lead.length; index += 1) {
              const syllable = vocalGroup.Lead[index];
              text += `${syllable.IsPartOfWord ? "" : " "}${syllable.Text}`;
            }
            lines.push(text);
          }
        }
        const textToProcess = lines.join("\n");

        result.NaturalAlignment = "Left";
      }

      // Wait for all our stored-promises to finish
      return result;
    }
  }

  static ParseLyrics(content) {
    // Grab our parsed-lyrics
    var parsedLyrics = this.ParseAppleMusicLyrics(content);
    // Now add in interludes anywhere we can
    if (parsedLyrics.Type !== "Static") {
      // First check if our first vocal-group needs an interlude before it
      let addedStartInterlude = false;
      {
        const firstVocalGroup = parsedLyrics.VocalGroups[0];
        if (firstVocalGroup.StartTime >= this.MinimumInterludeDuration) {
          parsedLyrics.VocalGroups.unshift({
            Type: "Interlude",
            StartTime: 0,
            EndTime: firstVocalGroup.StartTime - this.EndInterludeEarlyBy,
          });
          addedStartInterlude = true;
        }
      }
      // Now go through our vocals and determine if we need to add an interlude anywhere
      for (
        let index = parsedLyrics.VocalGroups.length - 1;
        index > (addedStartInterlude ? 1 : 0);
        index -= 1
      ) {
        const endingVocalGroup = parsedLyrics.VocalGroups[index];
        const startingVocalGroup = parsedLyrics.VocalGroups[index - 1];
        if (
          endingVocalGroup.StartTime - startingVocalGroup.EndTime >=
          this.MinimumInterludeDuration
        ) {
          parsedLyrics.VocalGroups.splice(index, 0, {
            Type: "Interlude",
            StartTime: startingVocalGroup.EndTime,
            EndTime: endingVocalGroup.StartTime - this.EndInterludeEarlyBy,
          });
        }
      }
    }
    // Now return our parsed-lyrics
    return parsedLyrics;
  }
}

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
      for (let i = 0; i < vocalGroup.Lead.length; i++) {
        const word = vocalGroup.Lead[i];
        let wordElement = this.createWord(
          word.Text + (word.IsPartOfWord ? "" : " ")
        );
        el.appendChild(wordElement);
      }
    } else {
      let wordElement = this.createWord(vocalGroup.Text);
      el.appendChild(wordElement);
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
    var sp = document.createElement("span");
    sp.className = "lyrics-word interlude-circles";
    sp.innerText = "⬤ ⬤ ⬤ ⬤";
    el.appendChild(sp);

    return el;
  }
}

var lyrics_area;
var import_dialog;
var import_status_song;
var import_status_lyric;
var import_selected_song;
var import_selected_lyric;
var audio_player;
var button_playpause;
var button_playpause_span;
var progress_bar;
var bottom_bar;
var fs_text;

var playback_time;
var playback_time_left;

var currentLyrics;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const $Q = document.querySelector;
const $QA = document.querySelectorAll;
const $ID = document.getElementById;

window.addEventListener("load", () => {
  lyrics_area = document.getElementById("lyrics-area");
  import_dialog = document.getElementById("import-dialog");
  import_status_lyric = document.getElementById("import-status-lyric");
  import_status_song = document.getElementById("import-status-song");
  audio_player = document.getElementById("audio-player");
  button_playpause = document.getElementById("playback-playpause-button");
  button_playpause_span = button_playpause.children[0];
  progress_bar = document.getElementById("playback-progress");
  playback_time = document.getElementById("playback-time-current");
  playback_time_left = document.getElementById("playback-time-remaining");
  bottom_bar = document.getElementById("bottom-bar");
  fs_text = document.getElementById("fullscreen-text");

  progress_bar.disabled = true;
  button_playpause.disabled = true;

  audio_player.addEventListener("timeupdate", MediaControls.onTimeUpdate);
  audio_player.addEventListener("ended", MediaControls.onEnd);

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

isSeeking = false;
intervalId = 0;

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
      fs_text.innerText = "fullscreen_exit";
    } else {
      document.exitFullscreen();
      fs_text.innerText = "fullscreen";
    }
  }

  static LoadCurrentAudio() {
    button_playpause_span.innerText = "play_arrow";
    audio_player.pause();
    audio_player.src = URL.createObjectURL(import_selected_song);
    audio_player.load();
    progress_bar.disabled = false;
    button_playpause.disabled = false;
    this.Seek(0);
    isSeeking = false;
    progress_bar.value = 0;
  }

  static TogglePausePlay() {
    if (audio_player.readyState < 2) {
      return;
    }

    if (audio_player.paused) {
      intervalId = setInterval(() => {
        this.ProcessLyrics();
      }, 10);
      audio_player.play();
      button_playpause_span.innerText = "pause";
    } else {
      clearInterval(intervalId);
      audio_player.pause();
      button_playpause_span.innerText = "play_arrow";
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
    playback_time.innerText = Utils.secs2time(audio_player.currentTime);
    playback_time_left.innerText =
      "-" + Utils.secs2time(audio_player.duration - audio_player.currentTime);
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
              for (let i = 0; i < leads.length; i++) {
                const l = leads[i];
                const wordElement = d.elements[0].childNodes[i];
                wordElement.style = `--progress: ${
                  ((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
                }%;`;
              }
            } else {
              let l = d.data;
              const wordElement = d.elements[0].childNodes[0];
              wordElement.style = `--progress: ${
                ((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
              }%;`;
            }

            d.elements[0].classList.remove("reached");
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
          } else if (d.data.Type === "Line") {
            //Single
            const wordElement = d.elements[0].childNodes[0];
            wordElement.style = `--progress: ${
              ((time - d.data.StartTime) /
                (d.data.EndTime - d.data.StartTime)) *
              100
            }%;`;

            d.elements[0].classList.remove("reached");
            d.elements[0].classList.remove("notreached");

            if (!hasScrolledThisFrame && lastStartTime != d.data.StartTime) {
              lastStartTime = d.data.StartTime;
              this.smoothScroll(lyrics_area, d.elements[0]);
            }
          } else if (d.data.Type === "Interlude") {
            d.elements[0].style = `--progress: ${
              ((time - d.data.StartTime) /
                (d.data.EndTime - d.data.StartTime)) *
              100
            }%;`;

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
              wordElement.style = `--progress: ${
                ((time - l.StartTime) / (l.EndTime - l.StartTime)) * 100
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
          } else if (d.data.Type === "Line") {
            //Single
            const wordElement = d.elements[0].childNodes[0];
            wordElement.style = "--progress: 0%;";

            d.elements[0].classList.remove("reached");
          } else if (d.data.Type === "Interlude") {
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
          this.smoothScroll(lyrics_area, mostRecentLyric);
          lastMostRecentLyric = mostRecentLyric;
        }
      });
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
    button_playpause_span.innerText = "play_arrow";
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
    }, 1000);
  }
}

class LyricsControls {
  static LoadTTML() {
    var reader = new FileReader();

    reader.onload = function (e) {
      var content = reader.result;
      currentLyrics = undefined;
      currentLyrics = MAKE(content);
    };

    reader.readAsText(import_selected_lyric);
  }
}

function MAKE(ttml) {
  lyrics_area.innerHTML = "";
  let data = RenderTTML(ttml);
  data.forEach((d) => {
    d.elements.forEach((e) => {
      lyrics_area.appendChild(e);
    });
  });
  return data;
}

function RenderTTML(ttml) {
  var parsed = TTML.ParseLyrics(ttml);
  var data = [];
  parsed.VocalGroups.forEach((vg) => {
    var elementsCreated = TTMLRenderer.createLead(vg);
    data.push({ data: vg, elements: elementsCreated });
  });
  return data;
}

hasSelectedSong = false;
hasSelectedLyric = false;
class ImportMenu {
  static buttonSong() {
    document.getElementById("input-file-song").click();
  }

  static buttonLyric() {
    document.getElementById("input-file-lyric").click();
  }

  static inputChangeSong(e) {
    console.log(e.target.files);
    var file = e.target.files[0];

    /*
    if (file.type == "application/zip" || file.name.endsWith("zip")) {
      //It is a zip file
      JSZip.loadAsync(file).then(
        function (zip) {
          console.log("loaded zip");

          let song;
          let lyric;

          zip.forEach(function (relativePath, zipEntry) {
            console.log(relativePath);
            console.log(zipEntry);
            if (
              relativePath.toLowerCase() === "lyric.ttml" ||
              relativePath.toLowerCase() === "lyrics.ttml"
            ) {
              lyric = zipEntry;
            }

            if (relativePath.toLowerCase().startsWith("song.")) {
              song = zipEntry;
            }
          });

          if (typeof song !== "undefined" && typeof lyric !== "undefined") {
            //YES
            song.async("uint8array").then((arr) => {
              import_selected_song = new Blob(arr);
              hasSelectedSong = true;
              import_status_song.innerText = "Song: " + song.name;
              ImportMenu.checkEnableOkButton();
              song = undefined;
            });

            lyric.async("uint8array").then((arr) => {
              import_selected_lyric = new Blob(arr);
              hasSelectedLyric = true;
              import_status_lyric.innerText = "Lyric: " + lyric.name;
              ImportMenu.checkEnableOkButton();
              lyric = undefined;
            });
          } else {
            //cleanup
            lyric = undefined;
            song = undefined;
            zip = undefined;
          }
        },
        function (e) {
          alert("Error reading zip! " + e.message);
        }
      );
    } else {
      */
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
    hasSelectedLyric = true;
    this.checkEnableOkButton();
  }

  static checkEnableOkButton() {
    document.getElementById("import-button-ok").disabled = !(
      hasSelectedSong && hasSelectedLyric
      //(hasSelectedSong || hasSelectedLyric)
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
   // if (hasSelectedSong && hasSelectedLyric) {
      MediaControls.LoadCurrentAudio();
      LyricsControls.LoadTTML();
   // } 
    audio_player.addEventListener(
      "canplay",
      () => {
        MediaControls.TogglePausePlay();
      },
      { once: true }
    );
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

  static secs2time(secs) {
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
