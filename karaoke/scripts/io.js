/// <reference path="common.js">
/// <reference path="ui_manager.js">
/// <reference path="audio_manager.js">
/// <reference path="element_maker.js">
/// <reference path="../lib/jszip.min.js">

var IO = {
  inputChangePackage(e) {
    const file = e.target.files[0];

    if (file.name.toLowerCase().endsWith("pkp")) {
      //It is a zip file
      IO.processZip(file);
    }
  },

  processZipOld(file) {
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
  },

  async processZip(file) {
    try {
      let zip = await JSZip.loadAsync(file);
      console.log("loaded zip");

      let meta = await zip.file("meta.json").async("string");

      let json = JSON.parse(meta);
      let files = json.files;
      let songPath = files.song;

      let ttmlPath = files.ttml;
      let jsonPath = files.json;
      let lrcPath = files.lrc;

      let imgPath = files.album_cover;

      let song = await zip.file(songPath).async("blob");
      let lyricsPath;
      if (!isObjectUndefined(jsonPath)) {
        lyricsPath = jsonPath;
      } else if (!isObjectUndefined(ttmlPath)) {
        lyricsPath = ttmlPath;
      } else {
        alert("Invalid pkp. No JSON nor TTML");
        return;
      }

      lyrics = await zip.file(lyricsPath).async("string");

      var imgF = zip.file(imgPath);
      var image = null;
      if (imgF != null) {
        console.log("there is img");
        image = await imgF.async("blob");
      }

      currentState.imageBlob = image;
      currentState.songBlob = song;
      currentState.lyricsString = lyrics;

      if (lyricsPath === jsonPath) {
        currentLyrics = ElementMaker.renderJson(lyrics);
      } else {
        currentLyrics = ElementMaker.renderTTML(lyrics);
      }
      AudioManager.loadAudio(song);
      AudioManager.playOnceReady();
      BackgroundUI.loadImage(image);
    } catch (e) {
      console.error(e);
      alert("an error occured: " + e);
    }
  },
};
