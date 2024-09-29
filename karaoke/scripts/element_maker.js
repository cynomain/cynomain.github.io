/// <reference path="common.js">
/// <reference path="audio_manager.js">
/// <reference path="ui_manager.js">
/// <reference path="lrc.js">
/// <reference path="ttml.js">

var ElementMaker = {
  createLeadModel(vocalGroup) {
    if (vocalGroup.Type == "Interlude") {
      return [this.createInterludeElement()];
    }

    var line = this.createLineElement(vocalGroup);
    if (vocalGroup.Background === undefined) {
      return [line];
    } else {
      return [line, this.createBackgroundElement(vocalGroup)];
    }
  },

  createLineElement(vocalGroup) {
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
        let wordElement = this.createWordElement(
          word.Text + (word.IsPartOfWord ? "" : " ")
        );
        el.appendChild(wordElement);
      }
    } else {
      let wordElement = this.createWordElement(vocalGroup.Text);
      el.appendChild(wordElement);
      el.classList.add("vertical");
    }

    el.addEventListener("click", () => {
      //console.log(vocalGroup);
      AudioManager.seek(vocalGroup.StartTime ?? vocalGroup.Lead.StartTime);
    });

    return el;
  },

  createBackgroundElement(vocalGroup) {
    var el = document.createElement("p");
    el.className =
      "lyrics notreached small " +
      (vocalGroup.OppositeAligned ? "right" : "left");
    el.style = "--progress: 0%";

    //console.log(vocalGroup.Background);
    let sylls = isObjectUndefined(vocalGroup.Background[0].Syllables)
      ? vocalGroup.Background
      : vocalGroup.Background[0].Syllables;

    for (let i = 0; i < sylls.length; i++) {
      const word = sylls[i];
      let wordElement = this.createWordElement(
        word.Text + (word.IsPartOfWord ? "" : " ")
      );
      el.appendChild(wordElement);
    }

    el.addEventListener("click", () => {
      //console.log(vocalGroup);
      AudioManager.seek(vocalGroup.StartTime ?? vocalGroup.Lead.StartTime);
    });
    return el;
  },

  createWordElement(value) {
    var el = document.createElement("span");
    el.className = "lyrics-word";
    el.style = "--progress: 0%;";
    el.innerText = value;
    return el;
  },

  createInterludeElement() {
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
  },

  normalize(lrcJson) {
    let js = lrcJson;
    // ADD INTERLUDES
    if (js.Content && js.Type === "Syllable") {
      //Is new
      //let newContent = [];
      js.Content.forEach((x) => {
        x.StartTime = x.Lead.StartTime;
        x.EndTime = x.Lead.EndTime;
        x.Lead = x.Lead.Syllables;

          
        //delete x.Lead.Syllables;
        //newContent.push(x);
      });
  
      //js.Content = newContent;
    }

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
  },

  renderLrc(lrc) {
    let data = LRC.Parse(lrc);
    return this.renderJson(data);
  },

  renderTTML(ttml) {
    var parsed = TTML.ParseLyrics(ttml);
    return this.turnDataToModel(parsed);
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
      var elementsCreated = this.createLeadModel(vg);
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
    let lrcJson = this.normalize(JSON.parse(json));
    let data = this.turnDataToModel(lrcJson);
    return this.applyModelToDoc(data);
  },
};
