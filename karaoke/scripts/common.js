/// <reference path="jqlite.js">
/// <reference path="events.js">
/// <reference path="../lib/nosleep.js">

/** @type {HTMLDivElement} */
var lyrics_area = $I("lyrics-area");

/** @type {HTMLAudioElement} */
var audio_player = $I("audio-player");

var noSleep = new NoSleep();

var currentState = {
  songBlob: null,
  lyricsString: null,
  imageBlob: null,
};

var settings = {
  enableBackground: true,
  mode: 0,
  size: 1.0,
};

var currentLyrics;

var Utils = {
  ms2time(ms) {
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
  },

  SecondsToTime(secs) {
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
  },
};

function isObjectUndefined(obj) {
  return typeof obj === "undefined" || obj === null || obj === undefined;
}

function smoothScroll(parent, target) {
  const targetRect = target.getBoundingClientRect();
  const targetTop = targetRect.top + parent.scrollTop;
  const targetHeight = targetRect.height;

  // Calculate desired scroll position for centering
  const parentHeight = parent.offsetHeight;
  const scrollTo = targetTop - (parentHeight - targetHeight) / 2 - targetHeight;

  // Use requestAnimationFrame for smooth animation
  parent.scrollTo({
    top: scrollTo,
    behavior: "smooth", // Ensure smooth scrolling behavior
    block: "center",
  });
}