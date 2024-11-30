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

    renderLrc(lrc) {
      let data = LRC.Parse(lrc);
      return LyricsUI.renderJson(data);
    },
  
    renderTTML(ttml) {
      var parsed = TTML.ParseLyrics(ttml);
      return LyricsUI.turnDataToModel(parsed);
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
      lyrics_area.innerHTML = "";
      data.forEach((d) => {
        d.elements.forEach((e) => {
          lyrics_area.appendChild(e);
        });
      });
      return data;
    },
  
    renderJson(json) {
      let lrcJson = ElementMaker.normalize(JSON.parse(json));
      let data = LyricsUI.turnDataToModel(lrcJson);
      return LyricsUI.applyModelToDoc(data);
    },

    test(){
      console.log("HELP");
    }
  };
  
  