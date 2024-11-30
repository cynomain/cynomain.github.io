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
    const featureAgent = element.getAttribute(TTML.FeatureAgentAttribute);
    const featureAgentVersion =
      featureAgent === null
        ? undefined
        : (_a = TTML.AgentVersion.exec(featureAgent)) === null || _a === void 0
        ? void 0
        : _a[1];
    return featureAgentVersion === undefined
      ? undefined
      : parseInt(featureAgentVersion, 10);
  }

  static GetTimeInSeconds(time) {
    // Grab our matches
    const matches = TTML.TimeFormat.exec(time);
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
    const parsedDocument = TTML.parser.parseFromString(text, "text/xml");
    const body = parsedDocument.querySelector("body");
    // Determine if we're syllable synced, line synced, or statically synced
    const syncType = TTML.SyllableSyncCheck.test(text)
      ? "Syllable"
      : TTML.LineSyncCheck.test(text)
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
              const featureAgentVersion = TTML.GetFeatureAgentVersion(line);
              const oppositeAligned =
                featureAgentVersion === undefined
                  ? false
                  : featureAgentVersion === 2;
              // Grab our times
              const start = TTML.GetTimeInSeconds(line.getAttribute("begin"));
              const end = TTML.GetTimeInSeconds(line.getAttribute("end"));
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
              const featureAgentVersion = TTML.GetFeatureAgentVersion(line);
              const oppositeAligned =
                featureAgentVersion === undefined
                  ? false
                  : featureAgentVersion === 2;
              // Store our lyrics now
              const leadLyrics = [];
              const backgroundLyrics = [];
              const lineNodes = line.childNodes;
              for (const [index, syllable] of lineNodes.entries()) {
                if (TTML.IsNodeASpan(syllable)) {
                  // We have to first determine if we're a background lyric - since we have inner spans if we are
                  const isBackground =
                    syllable.getAttribute(TTML.FeatureRoleAttribute) === "x-bg";
                  if (isBackground) {
                    // Gather our background-lyrics
                    const backgroundNodes = syllable.childNodes;
                    for (const [
                      backgroundIndex,
                      backgroundSyllable,
                    ] of backgroundNodes.entries()) {
                      if (TTML.IsNodeASpan(backgroundSyllable)) {
                        const start = TTML.GetTimeInSeconds(
                          backgroundSyllable.getAttribute("begin")
                        );
                        const end = TTML.GetTimeInSeconds(
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
                    const start = TTML.GetTimeInSeconds(
                      syllable.getAttribute("begin")
                    );
                    const end = TTML.GetTimeInSeconds(
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
    var parsedLyrics = TTML.ParseAppleMusicLyrics(content);
    // Now add in interludes anywhere we can
    if (parsedLyrics.Type !== "Static") {
      // First check if our first vocal-group needs an interlude before it
      let addedStartInterlude = false;
      {
        const firstVocalGroup = parsedLyrics.VocalGroups[0];
        if (firstVocalGroup.StartTime >= TTML.MinimumInterludeDuration) {
          parsedLyrics.VocalGroups.unshift({
            Type: "Interlude",
            StartTime: 0,
            EndTime: firstVocalGroup.StartTime - TTML.EndInterludeEarlyBy,
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
          TTML.MinimumInterludeDuration
        ) {
          parsedLyrics.VocalGroups.splice(index, 0, {
            Type: "Interlude",
            StartTime: startingVocalGroup.EndTime,
            EndTime: endingVocalGroup.StartTime - TTML.EndInterludeEarlyBy,
          });
        }
      }
    }
    // Now return our parsed-lyrics
    return parsedLyrics;
  }
}
