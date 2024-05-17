const $Q = document.querySelector;
const $A = document.querySelectorAll;
const $I = document.getElementById;

lyrics_area = $I("lyrics-area");
import_dialog = $I("import-dialog");
import_status_lyric = $I("import-status-lyric");
import_status_song = $I("import-status-song");

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
        //MediaControls.TogglePausePlay();
    }
    if (e.key == "Enter" || e.code == "Enter") {
        //MediaControls.TogglePausePlay();
    }
    if (e.key == "ArrowRight" || e.code == "ArrowRight") {
        /*
        MediaControls.Seek(
        clamp(audio_player.currentTime + 5, 0, audio_player.duration)
      );
      */
    }

    if (e.key == "ArrowLeft" || e.code == "ArrowLeft") {
        /*
      MediaControls.Seek(
        clamp(audio_player.currentTime - 5, 0, audio_player.duration)
      );
      */
    }
});

/**
 * Creates elements of lyrics
 */
const ElementGenerator = {
    createLead(vocalGroup) {
        if (vocalGroup.Type == "Interlude") {
            return [this.createInterlude()];
        }

        var line = this.createLine(vocalGroup);
        if (vocalGroup.Background === undefined) {
            return [line];
        } else {
            return [line, this.createBackground(vocalGroup)];
        }
    },

    createLine(vocalGroup) {
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
            el.classList.add("vertical");
        }

        el.addEventListener("click", () => {
            MediaControls.Seek(vocalGroup.StartTime);
        });

        return el;
    },

    createBackground(vocalGroup) {
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
    },

    createWord(value) {
        var el = document.createElement("span");
        el.className = "lyrics-word";
        el.style = "--progress: 0%;";
        el.innerText = value;
        return el;
    },

    createInterlude() {
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

/**
 * Controls the UI and interaction
 */
const UIManager = {

}

const FileLoader = {
    /**
     * 
     * @param {File} file 
     * @returns {string} Text contents
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result)
            };
            fr.onerror = reject;
            fr.readAsText(file);
        });
    },

    /**
     * 
     * @param {File} file 
     * @returns {PKPFile} PKP File
     */
    loadPkp(file) {
        return new Promise((resolve, reject) => {
            let pkp = new PKPFile();

            let filename = file.name.toLowerCase();
            if (filename.endsWith("pkp") || filename.endsWith("zip")) {
                try {
                    //ZIP
                    JSZip.loadAsync(file)
                        .then(
                            function (zip) {
                                console.log("loaded zip");

                                //META JSON
                                zip
                                    .file("meta.json")
                                    .async("string")
                                    .then((m) => {
                                        let json = JSON.parse(m);
                                        let files = json.files;
                                        let meta = json.meta;

                                        let songPath = files.song;

                                        let ttmlPath = files.ttml;
                                        let jsonPath = files.json;
                                        let lrcPath = files.lrc;

                                        let imgPath = files.album_cover;
                                        let mvPath = files.background_video;

                                        pkp.title = meta.title;
                                        pkp.artist = meta.artist;
                                        pkp.album = meta.album;
                                        pkp.length = meta.length;
                                        pkp.offset = meta.offset;
                                        pkp.video_offset = meta.video_offset;
                                        pkp.release = meta.release;
                                        pkp.isrc = meta.isrc;

                                        //SONG
                                        let songPromise = new Promise((resolve, reject) => {
                                            zip
                                                .file(songPath)
                                                .async("blob")
                                                .then((blob) => {
                                                    //console.log(blob);
                                                    pkp.songBlob = blob;
                                                    resolve();
                                                })
                                                .catch((r) => {
                                                    reject(r);
                                                });
                                        });

                                        let lyricPromise = new Promise((resolve, reject) => {
                                            let lyricsToBeRead = ttmlPath ?? jsonPath ?? lrcPath;
                                            if (isObjectUndefined(lyricsToBeRead)) {
                                                throw new Error("No lyrics in meta file.");
                                            }

                                            let type = "null";
                                            if (!isObjectUndefined(ttmlPath)) {
                                                type = "ttml";
                                            }
                                            if (!isObjectUndefined(jsonPath)) {
                                                type = "json"
                                            }
                                            if (!isObjectUndefined(lrcPath)) {
                                                type = "lrc"
                                            }

                                            if (type === "null") {
                                                throw new Error("No lyrics in meta file.");
                                            }

                                            //LYRIC
                                            zip
                                                .file(lyricsToBeRead)
                                                .async("string")
                                                .then((s) => {
                                                    pkp.lyricText = s;
                                                    pkp.lyricType = type;

                                                    resolve();
                                                })
                                                .catch(r => reject(r));
                                        });

                                        let coverPromise = new Promise((resolve, reject) => {
                                            if (isObjectUndefined(imgPath)) {
                                                resolve();
                                            }

                                            zip
                                                .file(imgPath)
                                                .async("blob")
                                                .then(b => {
                                                    pkp.coverBlob = b;
                                                    resolve();
                                                })
                                                .catch(r => {
                                                    reject(r);
                                                });
                                        });

                                        let mvPromise = new Promise((resolve, reject) => {
                                            if (isObjectUndefined(mvPath)) {
                                                resolve();
                                            }
                                            zip
                                                .file(imgPath)
                                                .async("blob")
                                                .then(b => {
                                                    pkp.mvBlob = b;
                                                    resolve();
                                                })
                                                .catch(r => {
                                                    reject(r);
                                                });
                                        });

                                        Promise.all([songPromise, lyricPromise, coverPromise, mvPromise]).then(() => {
                                            resolve(pkp);
                                        });
                                    });
                            },
                            function (e) {
                                alert("Error reading zip! " + e.message);
                                reject(e);
                            }
                        );
                } catch (e) {
                    alert("an error occured: " + e);
                    reject(e);
                }
            }
        });
    }
}



class PKPFile {
    songBlob;
    lyricText;
    lyricType;
    coverBlob;
    mvBlob;

    title;
    artist;
    album;
    length;
    offset;
    video_offset;
    release;
    isrc;


    /**
     * 
     * @param {Blob} songblob 
     * @param {string} lyrictext 
     * @param {string} lyrictype 
     * @param {Blob} coverblob 
     * @param {Blob} mvblob 
     * @param {string} title 
     * @param {string} artist 
     * @param {string} album 
     * @param {number} length 
     * @param {number} offset 
     * @param {number} video_offset 
     * @param {string} release 
     * @param {string} isrc 
     */
    constructor(songblob, lyrictext, lyrictype, coverblob, mvblob, title, artist, album, length, offset, video_offset, release, isrc) {
        this.songBlob = songblob;
        this.lyricText = lyrictext;
        this.lyricType = lyrictype;
        this.coverBlob = coverblob;
        this.mvBlob = mvblob;
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.length = length;
        this.offset = offset;
        this.video_offset = video_offset;
        this.release = release;
        this.isrc = isrc;
    }

    constructor() {

    }
}

const LyricParser = {
    /**
     * Parses TTML text to lyric object
     * @param {string} text 
     */
    parseTTML(text) {
        return TTML.ParseLyrics(text);
    },

    /**
     * Parses JSON text to lyric object
     * @param {string} text 
     * @returns 
     */
    parseJSON(text) {
        return JSON.parse(text);
    }
}

const Renderer = {

}

const AudioManager = {
    /**
     * @type {HTMLAudioElement}
     */
    audioPlayer: $I("audio-player"),

    /**
     * @type {SimpleEvent}
     */
    onPlay: new SimpleEvent(),
    /**
 * @type {SimpleEvent}
 */
    onPause: new SimpleEvent(),
    /**
 * @type {SimpleEvent}
 */
    onProgress: new SimpleEvent(),
    

    init(){
        this.audioPlayer.addEventListener("timeupdate", )
    }

    play() {
        this.audioPlayer.play();
        this.onPlay.trigger();
    },

    pause() {
        this.audioPlayer.pause();
        this.onPause.trigger();
    },

    toggle() {
        if (this.audioPlayer.readyState < 2) {
            return;
        }

        if (this.audioPlayer.paused) {
            this.play()
        } else {
            this.pause();
        }
    }
}

class Utils {
    static MSToTime(ms) {
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

    static Clamp(num, min, max) { return Math.min(Math.max(num, min), max); }
}

function isObjectUndefined(obj) {
    return typeof obj === "undefined" || obj === null || obj === undefined;
}


/**
 * 
 * @param {Function} context 
 * @returns 
 */
const SimpleEvent = (context = null) => {
    let cbs = [];
    return {
        addListener: (cb) => { cbs.push(cb); },
        removeListener: (cb) => { let i = cbs.indexOf(cb); cbs.splice(i, Math.max(i, 0)); },
        trigger: ((((...args) => cbs.forEach(cb => cb.apply(context, args)))))
    };
};