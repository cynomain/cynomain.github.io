/// <reference path="common.js">
/// <reference path="audio_manager.js">
/// <reference path="ui_manager.js">
/// <reference path="parsers/lrc.js">
/// <reference path="parsers/ttml.js">

var ElementMaker = {
  createLeadModel(vocalGroup) {
    if (vocalGroup.Type == "Interlude") {
      return [this.createInterludeElement(vocalGroup)];
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

  createInterludeElement(vocalGroup) {
    let el = this.createLineElement(vocalGroup);
    el.className = "interlude close";
    el.style = "--progress: 0%";
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

      const makeInterlude = (starttime, endtime) => {
        let delta = endtime - starttime;
        return {
          Type: "Interlude",
          StartTime: starttime,
          EndTime: endtime,
          OppositeAligned: false,
          Lead: {
            Syllables: [
              {
                Text: "⬤",
                IsPartOfWord: false,
                StartTime: starttime,
                EndTime: endtime - (delta * 3) / 4,
              },
              {
                Text: "⬤",
                IsPartOfWord: false,
                StartTime: endtime - (delta * 3) / 4,
                EndTime: endtime - (delta * 2) / 4,
              },
              {
                Text: "⬤",
                IsPartOfWord: false,
                StartTime: endtime - (delta * 2) / 4,
                EndTime: endtime - (delta * 1) / 4,
              },
              {
                Text: "⬤",
                IsPartOfWord: false,
                StartTime: endtime - (delta * 1) / 4,
                EndTime: endtime,
              },
            ],
          },
        };
      };

      // First check if our first vocal-group needs an interlude before it
      let addedStartInterlude = false;
      {
        const firstVocalGroup = vgs[0];
        if (firstVocalGroup.StartTime >= MinimumInterludeDuration) {
          vgs.unshift(
            makeInterlude(0, firstVocalGroup.StartTime - EndInterludeEarlyBy)
          );
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
          vgs.splice(
            index,
            0,
            makeInterlude(
              startingVocalGroup.EndTime,
              endingVocalGroup.StartTime - EndInterludeEarlyBy
            )
          );
        }
      }
    }
    return js;
  },
};
