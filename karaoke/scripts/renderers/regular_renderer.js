var LyricsUI = {
  mostRecentLyric: null,
  lastMostRecentLyric: null,
  intervalId: 0,
  count: 0,
  lastDOM: [],
  currentDOM: [],

  ProcessLyrics() {
    if (FPSCounter.fps > 60) {
      LyricsUI.count++;

      if (LyricsUI.count < 2) {
        if (!audio_player.paused) {
          LyricsUI.start();
        }
        FPSCounter.fpsCounter();
        return;
      } else {
        LyricsUI.count = 0;
      }
    }

    let time = audio_player.currentTime + settings.offset;

    const clamp = (a, min, max) => {
      if (a < min) return min;
      if (a > max) return max;
      return a;
    };

    const setProgress = (element, progress, animationScale = 1) => {
      var clampedProgress = clamp(progress, 0, 1);
      if (progress < 1) {
        var quad = -(2 * clampedProgress - 1) * (2 * clampedProgress - 1) + 1;
        //var sine = Math.sin(clampedProgress * Math.PI);
        var height = quad * (0.2 * animationScale);
        var scale = quad * (0.05 * animationScale) + 1;
        element.style = `--progress: ${
          clampedProgress * 100
        }%; --height: -${height}em; --scale: ${scale};`;
      } else {
        element.style = `--progress: ${progress * 100}%;`;
      }
      //element.style = `--progress: ${progress * 100}%; --height: -${Math.sin(clamp(progress, 0, 1) * Math.PI) * .2}em;`;
    };
    const setProgressT = (element, timedObject, overrideScale = 1) => {
      let scale =
        overrideScale == 1
          ? timedObject.EndTime - timedObject.StartTime > 1
            ? 1
            : 0.5
          : overrideScale;
      let value =
        (time - timedObject.StartTime) /
        (timedObject.EndTime - timedObject.StartTime);
      setProgress(element, value, scale);
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
          d.firstLastState = 0;
          //if (d.data.Type === "Vocal") {
          let leads = d.data.Lead;
          let interlude = d.data.Type === "Interlude";
          //Has Leads -> Word Synced
          if (!isObjectUndefined(leads)) {
            if (!isObjectUndefined(leads.Syllables)) {
              leads = leads.Syllables;
            }
            //Words
            for (let i = 0; i < leads.length; i++) {
              setProgressT(
                firstElement.childNodes[i],
                leads[i],
                interlude ? 2 : 1
              );
            }
          }
          // Doesnt have Leads -> Line Synced
          else {
            //console.log("NonLead");
            setProgressT(firstElement, d.data);
          }

          removeReachTags(firstElement);
          setMostRecentIfNot(firstElement);
          //}
          //else
          // Is Interlude
          if (interlude) {
            const interlude = d.elements[0];
            /*
            for (let i = 0; i < 4; i++){
              setProgressT(interlude.childNodes[i], d.data);
            }
            */
            /*
            removeReachTags(interlude);
            setMostRecentIfNot(interlude);
            */
            interlude.classList.add("open");
          }
        }

        //Reached
        else if (d.data.EndTime < time) {
          if (d.firstLastState !== 1) {
            //if (isLyrics(firstElement)) {
            setChildren100(firstElement);
            setReached(firstElement);

            if (isVertical(firstElement)) {
              setProgress(firstElement, 1);
            }
            //}

            if (isInterlude(firstElement)) {
              /*
              set100(firstElement);
              setChildren100(firstElement);
              */
              firstElement.classList.remove("open");
            }
          }
          d.firstLastState = 1;
        }

        //Not reached
        else {
          if (d.firstLastState !== -1) {
            //if (isLyrics(firstElement)) {
            setNotReached(firstElement);
            //}

            //if (d.data.Type === "Vocal") {
            setChildren0(firstElement);
            setNotReached(firstElement);

            if (isVertical(firstElement)) {
              set0(firstElement);
            }
            //} else
            if (d.data.Type === "Interlude") {
              /*
              set0(firstElement);
              setNotReached(firstElement);
              */
              firstElement.classList.remove("open");
            }
          }
          d.firstLastState = -1;
        }

        if (d.elements.length > 1) {
          const vg = d.data.Background[0];
          const bg = d.data.Background[0].Syllables;
          const secondElement = d.elements[1];

          //In progress
          if (vg.StartTime <= time && vg.EndTime >= time) {
            d.secondLastState = 0;

            for (let i = 0; i < bg.length; i++) {
              const l = bg[i];
              const wordElement = d.elements[1].childNodes[i];
              setProgressT(wordElement, l);
            }

            removeReachTags(d.elements[1]);
          }
          //Reached
          else if (vg.EndTime < time) {
            if (d.secondLastState !== 1) {
              setChildren100(secondElement);
              setReached(secondElement);
            }
            d.secondLastState = 1;
          }
          //Not Reached
          else {
            if (d.secondLastState !== -1) {
              setChildren0(secondElement);
              setNotReached(secondElement);
            }
            d.secondLastState = -1;
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

  renderLrc(lrc) {
    let data = LRC.Parse(lrc);
    return LyricsUI.renderJson(data);
  },

  renderTTML(ttml) {
    console.log("rendering ttml");
    var parsed = TTML.ParseLyrics(ttml);
    var data = LyricsUI.turnDataToModel(parsed);
    return LyricsUI.applyModelToDoc(data);
  },

  turnDataToModel(data) {
    var data2 = [];
    var vocalgroups = data.VocalGroups ?? data.Content;
    vocalgroups.forEach((vg) => {
      if (isObjectUndefined(vg.StartTime)) {
        if (!isObjectUndefined(vg.Lead)) {
          vg.StartTime = vg.Lead.StartTime;
          vg.EndTime = vg.Lead.EndTime;
        }
      }
      var elementsCreated = ElementMaker.createLeadModel(vg);
      data2.push({ data: vg, elements: elementsCreated });
    });
    return data2;
  },

  applyModelToDoc(data) {
    console.log("apply");
    lyrics_area.innerHTML = "";
    data.forEach((d) => {
      d.elements.forEach((e) => {
        lyrics_area.appendChild(e);
      });
    });
    return data;
  },

  renderJson(json) {
    console.log("render json");
    let lrcJson = ElementMaker.normalize(JSON.parse(json));
    let data = LyricsUI.turnDataToModel(lrcJson);
    return LyricsUI.applyModelToDoc(data);
  },

  test() {
    console.log("HELP");
  },
};
