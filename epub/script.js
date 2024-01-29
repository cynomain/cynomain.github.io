const $Q = (q) => document.querySelector(q);
const $A = (q) => document.querySelectorAll(q);
const $I = (id) => document.getElementById(id);

/*
var button_import;
var button_search;
var button_clear_search;
*/

var input_file_folder;
var div_main_content;

var popup_import;
var popup_settings;
var popup_search;

var popup_loading;
var popup_confirm;
var confirm_description;

/*
var button_clear_library;
var button_add_to_library;
var button_rebuild_cache;
var button_refresh_app;
*/
var button_offlinemode;

var search_card;
var search_info;
var search_info_amount;
var search_info_offlinemode;

var db;
var query;
var searchUI;

var button_offlinemode;

var default_main_content;

window.addEventListener("load", OnLoad);

function OnLoad() {
  //Get elements
  input_file_folder = $I("input-folder");
  div_main_content = $I("main-content");
  default_main_content = div_main_content.innerHTML;

  search_card = $I("search-card");
  search_info = $I("search-info");
  search_info_amount = $I("search-info-amount");
  search_info_offlinemode = $I("search-info-offlinemode");

  popup_import = $I("popup-import");
  popup_confirm = $I("popup-confirm");
  popup_search = $I("popup-search");
  popup_loading = $I("popup-loading");
  popup_settings = $I("popup-settings");

  confirm_description = $I("popup-confirm-description");

  button_offlinemode = $I("button-offlinemode");

  //Input file
  input_file_folder.onchange = ProcessFolders;

  if (isMobile()) {
    input_file_folder.removeAttribute("directory");
    input_file_folder.removeAttribute("webkitdirectory");
  }

  //La buttons
  //Main Buttons
  $I("button-import").onclick = () => {
    popup_import.classList.remove("disabled");
  };

  $I("button-search").onclick = () => {
    popup_search.classList.remove("disabled");
  };

  //Import Buttons
  $I("button-clear-library").onclick = () => {
    ConfirmDialog((b) => {
      if (b) {
        popup_import.classList.add("disabled");
        db.Clear();
        db.ClearCache();
        localStorage.clear();
        //window.location.reload();
        Reload();
      }
    }, "This will clear your imported works!\n(Your bookmarks won't be affected)");
  };

  $I("button-clear-bookmarks").onclick = () => {
    ConfirmDialog((b) => {
      if (b) {
        popup_import.classList.add("disabled");
        db.ClearBookmarks();
        db.Save();
        //window.location.reload();
        Reload();
      }
    }, "This will clear your bookmarks!\n(Your library won't be affected)");
  };

  $I("button-add-to-library").onclick = () => {
    popup_import.classList.add("disabled");
    input_file_folder.click();
  };

  $I("button-close-library").onclick = () => {
    popup_import.classList.add("disabled");
  };

  $I("button-open-settings").onclick = () => {
    popup_settings.classList.remove("disabled");
    popup_import.classList.add("disabled");
  };

  //Settings Buttons
  $I("button-rebuild-cache").onclick = () => {
    ConfirmDialog((b) => {
      if (b) {
        popup_import.classList.add("disabled");
        popup_loading.classList.remove("disabled");
        db.ClearCache();
        db.BuildCache();
        popup_loading.classList.remove("disabled");
        //window.location.reload();
        Reload();
      }
    }, "This will rebuild the search cache.");
  };

  $I("button-refresh-app").onclick = () => {
    ConfirmDialog((b) => {
      if (b) {
        popup_import.classList.add("disabled");
        caches.delete("cynomain-epub-v1").then((c) => {
          window.location.reload(true);
          //Reload(true);
        });
      }
    }, "This will refresh the cached version of this app.\nDO NOT PROCEED IF OFFLINE!");
  };

  button_offlinemode.onclick = () => {
    toggleOfflineMode();
  };

  $I("button-close-settings").onclick = () => {
    popup_settings.classList.add("disabled");
  };

  //Search buttons
  $I("search-clear").onclick = () => {
    ConfirmDialog((b) => {
      if (b) {
        searchUI.Clear();
      }
    });
  };

  //Database
  db = new AppDB();
  db.Load();

  //Query
  query = GetQuery();
  if (typeof query !== "string") {
    let res = SearchService.QueryWorks(query);
    console.log(res);
    SearchService.DisplayResults(res);
  } else {
    SearchService.DisplayResults(db.Works);
  }

  //Offline mode
  let offlinemode = isOfflineMode();
  if (offlinemode) {
    search_info_offlinemode.classList.remove("disabled");
    button_offlinemode.innerText = "Disable Offline Mode";
    interceptOfflineEvents(offlinemode);
  }

  //Search UI
  searchUI = new SearchUI(
    $I("search-any"),
    $I("search-title"),
    $I("search-authors"),
    $I("search-fandoms"),
    $I("search-characters"),
    $I("search-relationships"),
    $I("search-tags"),
    $I("search-series"),
    $I("search-bookmarked"),
    $I("search-completion"),
    //$I("search-crossover"),
    $I("search-single-chapter"),
    $I("search-wordcount-comparator"),
    $I("search-wordcount"),
    $I("search-by"),
    $I("search-direction"),
    $I("search-cancel"),
    $I("search-go")
  );

  document.querySelectorAll("img").forEach((i) => {
    i.draggable = false;
  });
}

//Debug
window.addEventListener("keyup", (e) => {
  if (e.key == "\\") {
    document.body.classList.toggle("dotted");
  }
});

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function toggleOfflineMode() {
  let offlinemode = isOfflineMode();
  if (!offlinemode) {
    //If disabled
    //Enable
    localStorage.setItem("isOfflineMode", true);
    button_offlinemode.innerText = "Disable Offline Mode";
    search_info_offlinemode.classList.remove("disabled");
  } else {
    //If enabled
    //Disable
    localStorage.removeItem("isOfflineMode");
    button_offlinemode.innerText = "Enable Offline Mode";
    search_info_offlinemode.classList.add("disabled");
  }

  interceptOfflineEvents(!offlinemode);
}

function interceptOfflineEvents(isofflinemode) {
  window.onpopstate = (e) => {
    setTimeout(() => {
      e.preventDefault();
      console.log("POP");
      Reload();
    }, 0);
  };

  if (isofflinemode) {
    document.querySelectorAll("a").forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        GoTo(e.target.href);
      };
    });
  } else {
    document.querySelectorAll("a").forEach((a) => {
      a.onclick = () => {};
    });
  }
}

function isOfflineMode() {
  return localStorage.getItem("isOfflineMode") !== null;
}

function GoTo(url) {
  let b = !isOfflineMode();
  if (b) {
    window.location.href = url;
  } else {
    window.history.pushState({}, "Epub Library", url);
    Reload();
  }
}

function Reload(force) {
  let b = !isOfflineMode();
  if (b) {
    window.location.reload(force);
  } else {
    //Fake reload
    console.log("fake reload");
    popup_confirm.classList.add("disabled");
    popup_import.classList.add("disabled");
    popup_loading.classList.add("disabled");
    popup_settings.classList.add("disabled");
    popup_search.classList.add("disabled");

    div_main_content.innerHTML = default_main_content;
    OnLoad();
  }
}

async function CheckIfAccesible(url) {
  return await fetch(url, { mode: "no-cors" })
    .then((r) => {
      return true;
    })
    .catch((e) => {
      return false;
    });
}

function GetQuery() {
  let query = window.location.search.substring(1);
  let vars = query.split("&&");
  let qs = [];

  if (vars.length < 0) {
    qs = "NONE";
  }

  for (var i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    let key = decodeURIComponent(pair[0]);
    let value = decodeURIComponent(pair[1]);
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    qs[key] = value;
  }

  return qs;
}

var saveTimeoutId = 1938293;

function ProcessFolders(event) {
  let files = event.target.files;
  console.log(files);

  ConfirmDialog((b) => {
    if (b){
      ProcessFiles(files);
    }
  }, `Found ${files.length} file(s).\nAdd to library?`)
}

function ProcessFiles(files){
  popup_loading.classList.remove("disabled");
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.name.endsWith("epub")) {
      try {
        ProcessEpubFile(f).then((e) => /*epubs.push(e)*/ {
          console.log(e);
          db.Push(e);

          clearTimeout(saveTimeoutId);
          saveTimeoutId = setTimeout(() => {
            popup_loading.classList.add("disabled");
            db.Save();
            db.ClearCache();
            db.BuildCache();
            console.log("saved");
            //window.location.reload();
            Reload();
          }, 1000);
        });
      } catch (Ex) {
        console.log(Ex);
        popup_loading.classList.add("disabled");
      }
    }
  }
}

function ProcessEpubFile(file) {
  let id = "";
  let title = "";
  let authors = [];
  let fandoms = [];
  let date = "";
  let warnings = [];
  let relationships = [];
  let characters = [];
  let freeforms = [];
  let description = "";
  let series = null;
  let stats = null;

  let parser = new DOMParser();

  let zip;

  return JSZip.loadAsync(file)
    .then((z) => {
      //console.log(z);
      zip = z;

      return z
        .file("content.opf")
        .async("string")
        .then((text) => {
          let xdoc = parser.parseFromString(text, "text/xml");

          //console.log(xdoc);

          //ID
          id =
            xdoc.getElementsByTagName("dc:identifier")[0].childNodes[0]
              .nodeValue;

          //TITLE
          let temptitle = xdoc
            .getElementsByTagName("dc:title")[0]
            .childNodes[0].nodeValue.trim();
          if (temptitle.endsWith(".")) {
            title = temptitle.substring(0, temptitle.length - 1);
          } else {
            title = temptitle;
          }

          //AUTHORS
          let author_elements = xdoc.getElementsByTagName("dc:creator");
          for (let i = 0; i < author_elements.length; i++) {
            authors.push(author_elements[i].childNodes[0].nodeValue);
          }
          //console.log(author_elements[0].childNodes[0].nodeValue);

          //DESCRIPTION
          description = xdoc
            .getElementsByTagName("dc:description")[0]
            .childNodes[0].nodeValue.replace("<p>", "")
            .replace("</p>", "")
            .replace("\n", "");

          //SERIES
          let series_element = xdoc.querySelector(
            'meta[name="calibre:series"]'
          );

          if (series_element !== null) {
            //YES
            let seriesname = series_element.getAttribute("content");
            let seriespart = xdoc
              .querySelector("meta[name='calibre:series_index']")
              .getAttribute("content");

            series = new EpubSeries(Number(seriespart), seriesname);
          }

          //DATE
          let date_obj = new Date(
            xdoc.getElementsByTagName("dc:date")[0].childNodes[0].nodeValue
          );
          const months = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          date = `${date_obj.getDate()} ${
            months[date_obj.getMonth()]
          } ${date_obj.getFullYear()}`;

          return zip.file(/000.xhtml/)[0].async("string");
        })
        .then((firsthtml) => {
          const parseA = (element) => {
            let As = element.getElementsByTagName("a");
            let temparr = [];
            for (let i = 0; i < As.length; i++) {
              const a = As[i];
              temparr.push(a.innerText);
            }
            return temparr;
          };

          let xdoc = parser.parseFromString(firsthtml, "text/html");

          warnings = parseA(
            xdoc.querySelector("#preface > div > dl > dd:nth-child(4)")
          );
          fandoms = parseA(
            xdoc.querySelector("#preface > div > dl > dd:nth-child(8)")
          );
          relationships = parseA(
            xdoc.querySelector("#preface > div > dl > dd:nth-child(10)")
          );
          characters = parseA(
            xdoc.querySelector("#preface > div > dl > dd:nth-child(12)")
          );
          freeforms = parseA(
            xdoc.querySelector("#preface > div > dl > dd:nth-child(14)")
          );
          tags = xdoc.querySelector("#preface > div > dl > dd.calibre5")
            .childNodes[0].nodeValue;

          //Stats
          let statsstr = xdoc
            .querySelector("#preface > div > dl > dd.calibre5")
            .childNodes[0].nodeValue.trim();

          let statsarr = statsstr.split("\n");
          //console.log(statsarr);
          let published = null;
          let updated = null;
          let completed = null;
          let wordscount = null;
          let chapters = null;
          statsarr.forEach((s) => {
            let trimmed = s.trim();
            let split = trimmed.split(":");
            if (split.length != 2) {
              console.log("Stats malformed");
            } else {
              switch (split[0].trim()) {
                case "Published":
                  published = split[1].trim();
                  break;
                case "Completed":
                  completed = split[1].trim();
                  break;
                case "Updated":
                  updated = split[1].trim();
                  break;
                case "Words":
                  wordscount = Number(
                    split[1].replace(",", "").replace(".", "").trim()
                  );
                  break;
                case "Chapters":
                  let tempch = split[1].trim().split("/");
                  chapters = new EpubChapter(
                    Number(tempch[0]),
                    tempch[1] == "?" ? 0 : Number(tempch[1])
                  );
                  break;
                default:
                  break;
              }

              if (updated === null) {
                updated = completed;
              }

              stats = new EpubStats(
                published,
                completed,
                updated,
                wordscount,
                chapters
              );
            }
          });
          return true;
        });
    })
    .then((b) => {
      return new EpubData(
        id,
        title,
        authors,
        fandoms,
        date,
        warnings,
        relationships,
        characters,
        freeforms,
        description,
        series,
        stats
      );
    });
}

var confirmAction = () => {};
function ConfirmDialog(action, desc) {
  confirmAction = action;
  confirm_description.innerText = isEmpty(desc) ? "" : desc;

  popup_confirm.classList.remove("disabled");
}

function confirmDialog_button(bool) {
  popup_confirm.classList.add("disabled");
  confirmAction(bool);
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

class DOMHelper {
  static MakeWorks(works) {
    works.forEach((w) => {
      div_main_content.appendChild(DOMHelper.CreateCard(w));
    });
  }

  static dce(tagname) {
    return document.createElement(tagname);
  }
  static dcec(tagname, classes) {
    let d = document.createElement(tagname);
    d.className = classes;
    return d;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateCard(data) {
    const spacer = () => {
      let d = document.createElement("div");
      d.className = "spacer";
      return d;
    };

    let card = this.dce("div");
    card.className = "card";

    //Title
    card.appendChild(this.CreateTitle(data));

    //Authors
    //card.appendChild(this.CreateAuthors(data));

    //Fandoms
    //card.appendChild(this.CreateFandoms(data));

    card.appendChild(spacer());

    //Tags
    card.appendChild(this.CreateTags(data));

    card.appendChild(spacer());

    //Description
    card.appendChild(this.CreateDescription(data));

    card.appendChild(spacer());

    //Part
    if (data.series != null) {
      let series = this.dcec("div", "series");

      let partof = this.dce("p");
      partof.innerText = `Part ${data.series.part} of `;
      series.appendChild(partof);

      let name = this.dcec("a", "name");
      name.innerText = data.series.name;
      name.href = GetQueryString(
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        data.series.name,
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );

      series.appendChild(name);

      card.appendChild(series);
    }
    //Stats
    card.appendChild(this.CreateStats(data));

    return card;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateTitle(data) {
    let section_title = this.dcec("div", "section-title");

    let metadatas = this.dce("div");

    let title = this.dcec("h2", "title");
    title.innerText = data.title;

    metadatas.appendChild(title);
    metadatas.appendChild(this.CreateAuthors(data));
    metadatas.appendChild(this.CreateFandoms(data));

    section_title.appendChild(metadatas);

    let bookmark_btn = this.dcec("button", "bookmark-button");
    bookmark_btn.onclick = (e) => {
      let b = db.ToggleBookmark(data.id);
      let target = e.target;
      target = target.tagName === "IMG" ? target : target.querySelector("img");

      target.src = b
        ? "assets/icon_bookmark_filled.svg"
        : "assets/icon_bookmark_empty.svg";

      target.className = b ? "tint-light" : "tint-light off";
    };

    let bookmark_icon = this.dcec("img", "tint-light");
    let isbookmarked = db.IsBookmarked(data.id);
    bookmark_icon.src = isbookmarked
      ? "assets/icon_bookmark_filled.svg"
      : "assets/icon_bookmark_empty.svg";

    if (!isbookmarked) {
      bookmark_icon.classList.add("off");
    }

    bookmark_btn.appendChild(bookmark_icon);

    section_title.appendChild(bookmark_btn);

    /*
    let date = this.dcec("p", "date");
    date.innerText = data.date;
    section_title.appendChild(date);
*/
    return section_title;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateAuthors(data) {
    let authors = this.dcec("div", "authors");

    let by = this.dce("p");
    by.innerText = "by ";
    authors.appendChild(by);

    data.authors.forEach((element) => {
      let author = this.dcec("a", "author");
      author.innerText = element;
      //TODO: AUTHOR HREF
      author.href = GetQueryString(
        "",
        "",
        `"${element}"`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );
      authors.appendChild(author);
    });

    return authors;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateFandoms(data) {
    let fandoms = this.dcec("div", "fandoms");

    data.fandoms.forEach((element) => {
      let fandom = this.dcec("a", "fandom");
      fandom.innerText = element;
      //TODO: Author href
      fandom.href = GetQueryString(
        "",
        "",
        "",
        `"${element}"`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );
      fandoms.appendChild(fandom);
    });

    return fandoms;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateTags(data) {
    //let tags = this.dcec("ul", "tags");
    let tags = this.dcec("div", "tags");

    //Warnings

    //let warnings = this.dcec("li", "warnings");
    //let strong = this.dce("strong");
    let strong = this.dce("strong");

    data.warnings.forEach((element) => {
      let warning = this.dcec("a", "warnings tag static");
      warning.innerText = element;
      strong.appendChild(warning);
    });

    //warnings.appendChild(strong);
    //tags.appendChild(warnings);
    tags.appendChild(strong);

    //Relationships

    data.relationships.forEach((r) => {
      //let relationships = this.dcec("li", "relationships");
      //let reltag = this.dcec("a", "tag");
      let reltag = this.dcec("a", "relationships tag");
      //TODO: Relationship href
      reltag.href = GetQueryString(
        "",
        "",
        "",
        "",
        "",
        `"${r}"`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );

      reltag.innerText = r;
      //relationships.appendChild(reltag);
      //tags.appendChild(relationships);
      tags.appendChild(reltag);
    });

    //Characters

    data.characters.forEach((c) => {
      //let characters = this.dcec("li", "characters");
      //let chartag = this.dcec("a", "tag");
      let chartag = this.dcec("a", "characters tag");
      //TODO: Characters href
      chartag.href = GetQueryString(
        "",
        "",
        "",
        "",
        `"${c}"`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );

      chartag.innerText = c;
      //characters.appendChild(chartag);
      //tags.appendChild(characters);
      tags.appendChild(chartag);
    });

    //Freeforms

    data.freeforms.forEach((f) => {
      //let freeforms = this.dcec("li", "freeforms");
      //let ftag = this.dcec("a", "tag");
      let ftag = this.dcec("a", "freeforms tag");
      //TODO: Freeform href
      ftag.href = GetQueryString(
        "",
        "",
        "",
        "",
        "",
        "",
        `"${f}"`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      );
      ftag.innerText = f;
      //freeforms.appendChild(ftag);
      //tags.appendChild(freeforms);
      tags.appendChild(ftag);
    });

    return tags;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateDescription(data) {
    let description = this.dce("p", "synopsis");
    description.innerHTML = data.description;
    return description;
  }

  /**
   *
   * @param {EpubData} data
   */
  static CreateStats(data) {
    let stats = this.dcec("p", "stats");
    stats.innerText = EpubStats.toString(data.stats);
    return stats;
  }
}

class SearchUI {
  constructor(
    input_any,
    input_title,
    input_authors,
    //rec_authors,
    input_fandoms,
    //rec_fandoms,
    input_characters,
    //rec_characters,
    input_relationships,
    //rec_relationship,
    input_tags,
    //rec_tags,
    input_series,
    select_bookmarked,
    select_completion,
    //select_crossovers,
    select_singlechapter,
    select_wordcount_comparator,
    input_wordcount,
    select_sortby,
    select_sortdir,
    button_cancel,
    button_search
  ) {
    this.input_any = input_any;
    this.input_title = input_title;
    this.input_authors = input_authors;
    //this.rec_authors = rec_authors;
    this.input_fandoms = input_fandoms;
    //this.rec_fandoms = rec_fandoms
    this.input_characters = input_characters;
    //this.rec_characters = rec_characters;
    this.input_relationships = input_relationships;
    //this.rec_relationship = rec_relationship;
    this.input_tags = input_tags;
    //this.rec_tags = rec_tags;
    this.input_series = input_series;
    this.select_bookmarked = select_bookmarked;
    this.select_completion = select_completion;
    //this.select_crossovers = select_crossovers;
    this.select_singlechapter = select_singlechapter;
    this.select_wordcount_comparator = select_wordcount_comparator;
    this.input_wordcount = input_wordcount;
    this.select_sortby = select_sortby;
    this.select_sortdir = select_sortdir;
    this.button_cancel = button_cancel;
    this.button_search = button_search;

    button_cancel.onclick = () => {
      popup_search.classList.add("disabled");
    };

    button_search.onclick = () => {
      //&crossovers=${select_crossovers.value}
      //window.location.href = encodeURI(
      GoTo(
        encodeURI(
          GetQueryString(
            input_any.value,
            input_title.value,
            input_authors.value,
            input_fandoms.value,
            input_characters.value,
            input_relationships.value,
            input_tags.value,
            input_series.value,
            select_completion.value,
            select_singlechapter.value,
            select_wordcount_comparator.value,
            input_wordcount.value,
            select_sortby.value,
            select_sortdir.value,
            select_bookmarked.value
          )
        )
      );
    };

    if (typeof query !== "string") {
      input_any.value = query["any"] ?? "";
      input_title.value = query["title"] ?? "";
      input_authors.value = query["authors"] ?? "";
      input_fandoms.value = query["fandoms"] ?? "";
      input_characters.value = query["characters"] ?? "";
      input_relationships.value = query["relationships"] ?? "";
      input_tags.value = query["tags"] ?? "";
      input_series.value = query["series"] ?? "";
      select_completion.value = query["completion"] ?? "all";
      // select_crossovers.value = query["crossovers"];
      select_singlechapter.value = query["singlechapter"] ?? "no";
      select_wordcount_comparator.value = query["wordcount_compare"] ?? "equal";
      input_wordcount.value = Number(query["wordcount"] ?? "0");
      select_sortby.value = query["sortby"] ?? "title";
      select_sortdir.value = query["sortdir"] ?? "ascending";
    }
  }

  Clear() {
    this.input_any.value = "";
    this.input_title.value = "";
    this.input_authors.value = "";
    this.input_fandoms.value = "";
    this.input_characters.value = "";
    this.input_relationships.value = "";
    this.input_tags.value = "";
    this.input_series.value = "";
    this.select_completion.value = "all";
    // this.select_crossovers.value = query["crossovers"];
    this.select_singlechapter.value = "no";
    this.select_wordcount_comparator.value = "equal";
    this.input_wordcount.value = 0;
    this.select_sortby.value = "title";
    this.select_sortdir.value = "ascending";
  }
}

class Search {
  static ParseSearch(text) {
    //const MATCH_PARENTHESES = /\([^()]*\)/;

    const MATCH_QUOTES = /"[^"]*"/g;
    const MATCH_SPACES = / +/g;

    const SYMBOL_AND = "\uE016";
    const SYMBOL_OR = "\uE032";
    const SYMBOL_QUOTE = "\uE064";
    //const SYMBOL_NOT = "\uE999"; //No way that many quotes

    let registerQuotes = [];

    let tmptext = text;
    if (typeof text === "undefined") {
      return new SearchToken("$AND", []);
    }
    // console.log(text);

    let matches = [...text.matchAll(MATCH_QUOTES)];
    for (let i = 0; i < matches.length; i++) {
      registerQuotes.push(matches[i][0]);
      //tmptext = tmptext.replace(matches[i][0], SYMBOL_QUOTE + i);
      //E065 + i
      tmptext = tmptext.replace(
        matches[i][0],
        SYMBOL_QUOTE + String.fromCharCode(57445 + i)
      );
    }

    tmptext = tmptext
      .replace(MATCH_SPACES, SYMBOL_AND)
      .replace(/&&/g, SYMBOL_AND)
      .replace(/\|\|/g, SYMBOL_OR);

    //console.log(tmptext);

    for (let i = 0; i < registerQuotes.length; i++) {
      const quot = registerQuotes[i];
      let targetString = SYMBOL_QUOTE + String.fromCharCode(57445 + i);
      tmptext = tmptext.replace(
        targetString,
        quot.substring(1, quot.length - 1)
      );
    }

    // console.log(tmptext);

    let split = tmptext.split(SYMBOL_AND);

    //console.log(split);

    let tokens = [];
    for (let i = 0; i < split.length; i++) {
      const str = split[i];
      let tobepushed = str;
      let isNot = false;
      if (tobepushed.startsWith("-")) {
        //Is not
        isNot = true;
        tobepushed = tobepushed.substring(1, tobepushed.length);
      }

      if (tobepushed.includes(SYMBOL_OR)) {
        //Is or
        let splitor = tobepushed.split(SYMBOL_OR);
        tobepushed = new SearchToken("$OR", [...splitor]);
      }

      if (isNot) {
        tokens.push(new SearchToken("$NOT", [tobepushed]));
      } else {
        tokens.push(tobepushed);
      }
    }

    return new SearchToken("$AND", tokens);
    //Replace spaces
  }

  /**
   *
   * @param {SearchToken} tokens
   * @param {string[]} strarr
   * @returns {string[]} results
   */
  static SearchInStringArray(token, strarr) {
    //Is already and
    let results = [];
    strarr.forEach((str) => {
      if (token.Evaluate(str)) {
        results.push(str);
      }
    });
    return results;
  }

  static SearchAnything(token, works, getter, formatter) {
    let results = [];
    works.forEach((w) => {
      let got = getter(w);
      if (this.SearchInStringArray(token, got).length > 0) {
        results.push(formatter(w));
      }
    });

    return results;
  }

  static Filter(works, evaluator) {
    results = [];
    works.forEach((w) => {
      if (evaluator(w)) {
        results.push(w);
      }
    });
    return results;
  }
}

class SearchService {
  static QueryWorks(query) {
    popup_loading.classList.remove("disabled");
    try {
      let q_any = Search.ParseSearch(query["any"] ?? "");
      let q_title = Search.ParseSearch(query["title"] ?? "");
      let q_authors = Search.ParseSearch(query["authors"] ?? "");
      let q_fandoms = Search.ParseSearch(query["fandoms"] ?? "");
      let q_characters = Search.ParseSearch(query["characters"] ?? "");
      let q_relationships = Search.ParseSearch(query["relationships"] ?? "");
      let q_tags = Search.ParseSearch(query["tags"] ?? "");
      let q_series = Search.ParseSearch(query["series"] ?? "");
      let q_completion = query["completion"] ?? "all";
      //let q_crossovers = (query["crossovers"]);
      let q_singlechapter = query["singlechapter"] ?? "no";
      let q_wordcount_comparator = query["wordcount_compare"] ?? "equal";
      let q_wordcount = Number(query["wordcount"] ?? "0");
      let q_sortby = query["sortby"] ?? "title";
      let q_sortdir = query["sortdir"] ?? "ascending";
      let q_bookmarked = query["bookmarked"] ?? "all";

      /*
      let globalq = new SearchToken("$AND", [
        q_any,
        q_title,
        q_authors,
        q_fandoms,
        q_characters,
        q_relationships,
        q_tags,
      ]);
      */

      let cached = db.GetCache();

      let resultCached = cached.filter((w) => {
        if (q_singlechapter == "yes") {
          if (!w.issinglechapter) {
            return false;
          }
        }
        //console.log(w.id + " did not fail singlechapter");

        switch (q_completion) {
          case "all":
            break;
          case "completed":
            if (!w.iscomplete) return false;
            break;
          case "in-progress":
            if (w.iscomplete) return false;
            break;
          default:
            break;
        }
        //console.log(w.id + " didnot fail completion");

        if (q_wordcount > 0) {
          switch (q_wordcount_comparator) {
            case "equal":
              if (w.wordCount != q_wordcount) return false;
              break;
            case "greater":
              if (!(w.wordCount > q_wordcount)) return false;
              break;
            case "less":
              if (!(w.wordCount < q_wordcount)) return false;
              break;
            case "greater-equal":
              if (!(w.wordCount >= q_wordcount)) return false;
              break;
            case "less-equal":
              if (!(w.wordCount <= q_wordcount)) return false;
              break;
            default:
              if (w.wordCount != q_wordcount) return false;
              break;
          }
        }
        //console.log(w.id + " didnot fail wordcount" + w.wordCount + q_wordcount);

        switch (q_bookmarked) {
          case "only":
            if (!db.IsBookmarked(w.id)) {
              return false;
            }
            break;
          case "exclude":
            if (db.IsBookmarked(w.id)) {
              return false;
            }
            break;
        }

        if (q_title.values.length > 0) {
          if (!q_title.Evaluate(w.title)) {
            //console.log(w.id + " failed title");
            return false;
          }
        }
        if (q_authors.values.length > 0) {
          if (!q_authors.Evaluate(w.authors)) {
            //console.log(w.id + " failed authors");
            return false;
          }
        }
        if (q_fandoms.values.length > 0) {
          if (!q_fandoms.Evaluate(w.fandoms)) {
            //console.log(w.id + " failed fandoms");
            return false;
          }
        }
        if (q_characters.values.length > 0) {
          if (!q_characters.Evaluate(w.characters)) {
            // console.log(w.id + " failed chars");
            return false;
          }
        }
        if (q_relationships.values.length > 0) {
          if (!q_relationships.Evaluate(w.relationships)) {
            //console.log(w.id + " failed relationships");
            return false;
          }
        }
        if (q_tags.values.length > 0) {
          if (!q_tags.Evaluate(w.freeforms)) {
            //console.log(w.id + " failed tags");
            return false;
          }
        }
        if (q_series.values.length > 0) {
          if (!q_series.Evaluate(w.series)) {
            //console.log(w.id + " failed series");
            return false;
          }
        }
        if (q_any.values.length > 0) {
          if (!q_any.Evaluate(EpubCache.GetConcatted(w))) {
            // console.log(w.id + " failed any");
            return false;
          }
        }
        return true;
      });

      //Default asceding
      switch (q_sortby) {
        case "title":
          resultCached = resultCached.sort((a, b) =>
            //("" + a.title.attr).localeCompare(b.title)
            a.title.localeCompare(b.title)
          );
          break;
        case "author":
          resultCached = resultCached.sort((a, b) =>
            a.authors.localeCompare(b.authors)
          );
          break;
        case "wordcount":
          resultCached = resultCached.sort((a, b) => a.wordCount - b.wordCount);
          break;
        case "date-posted":
          resultCached = resultCached.sort(
            (a, b) => a.date_published - b.date_published
          );
          break;
        case "date-updated":
          resultCached = resultCached.sort(
            (a, b) => a.date_updated - b.date_updated
          );
          break;
        case "random":
          resultCached = shuffle(resultCached);
          break;
        default:
          resultCached = resultCached.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          break;
      }

      if (q_sortdir === "descending") {
        console.log("descend");
        resultCached = resultCached.reverse();
      }

      let results = [];
      resultCached.forEach((rc) => {
        let found = db.Works.find((x) => x.id === rc.id);
        if (found) {
          results.push(found);
        }
      });

      let infos = [];

      const pushIfNotEmpty = (index, prefix) => {
        if (!isEmpty(query[index])) {
          infos.push(prefix + ": " + query[index]);
        }
      };

      const pushIfNotEmptyCap = (index, prefix) => {
        if (!isEmpty(query[index])) {
          infos.push(prefix + ": " + capitalizeFirstLetter(query[index]));
        }
      };

      pushIfNotEmpty("any", "Any");
      pushIfNotEmpty("title", "Title");
      pushIfNotEmpty("authors", "Authors");
      pushIfNotEmpty("fandoms", "Fandoms");
      pushIfNotEmpty("series", "Series");
      pushIfNotEmpty("characters", "Characters");
      pushIfNotEmpty("relationships", "Relationships");
      pushIfNotEmpty("tags", "Tags");
      pushIfNotEmptyCap("completion", "Completion");
      pushIfNotEmptyCap("singlechapter", "Only Single Chapter");

      if (!isEmpty(query["wordcount"]) && query["wordcount"] !== "0") {
        let sign = "";

        switch (query["wordcount_compare"]) {
          case "equal":
            sign = "=";
            break;
          case "greater":
            sign = ">";
            break;
          case "less":
            sign = "<";
            break;
          case "greater-equal":
            sign = "≥";
            break;
          case "less-equal":
            sign = "≤";
            break;
          default:
            sign = "?";
        }

        infos.push(`Word count: ${sign}${Number(query["wordcount"] ?? "0")}`);
      }

      pushIfNotEmptyCap("sortby", "Sort By");
      pushIfNotEmptyCap("sortdir", "Sort Direction");
      pushIfNotEmptyCap("bookmarked", "Bookmarked");
      search_info.innerText = infos.join("\n");
      search_info_amount.innerText = `Found ${results.length} result(s).`;
      popup_loading.classList.add("disabled");

      return results;
    } catch (ex) {
      console.log(ex);
      popup_loading.classList.add("disabled");
      return [];
    }
  }

  static DisplayResults(results) {
    search_card.classList.remove("disabled");
    DOMHelper.MakeWorks(results);
  }
}

function GetQueryString(
  any,
  title,
  authors,
  fandoms,
  characters,
  relationships,
  tags,
  series,
  completion,
  singlechapter,
  wordcount_compare,
  wordcount,
  sortby,
  sortdir,
  bookmarked
) {
  //return `?any="${any}"&&title="${title}"&&authors="${authors}"&&fandoms="${fandoms}"&&characters="${characters}"&&relationships="${relationships}"&&tags="${tags}"&&series="${series}"&&completion="${completion}"&&singlechapter="${singlechapter}"&&wordcount_compare="${wordcount_compare}"&&wordcount="${wordcount}"&&sortby="${sortby}"&&sortdir="${sortdir}"`;
  let q = [];

  const appendINE = (str, key) => {
    if (!isEmpty(str)) {
      q.push(`${key}="${str}"`);
    }
  };

  appendINE(bookmarked, "bookmarked");
  appendINE(any, "any");
  appendINE(title, "title");
  appendINE(authors, "authors");
  appendINE(fandoms, "fandoms");
  appendINE(characters, "characters");
  appendINE(relationships, "relationships");
  appendINE(tags, "tags");
  appendINE(series, "series");
  appendINE(completion, "completion");
  appendINE(singlechapter, "singlechapter");
  appendINE(wordcount_compare, "wordcount_compare");
  appendINE(wordcount, "wordcount");
  appendINE(sortby, "sortby");
  appendINE(sortdir, "sortdir");

  return "?" + q.join("&&");
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function isEmpty(str) {
  return (
    typeof str === "undefined" || str === null || str === "" || str.length < 1
  );
}

class SearchToken {
  /**
   *
   * @param {string} type
   * @param {*[]} values
   */
  constructor(type, values) {
    this.type = type;
    this.values = values;
  }

  Evaluate(inputString) {
    let str = inputString.toLowerCase();
    switch (this.type) {
      case "$AND":
        //All
        for (let i = 0; i < this.values.length; i++) {
          const element = this.values[i];
          if (typeof element === "object") {
            if (!element.Evaluate(str)) {
              return false;
            }
          } else {
            if (str.match(MakeRegex(element)) === null) {
              return false;
            }
          }
        }
        return true;
      case "$OR":
        //Any
        for (let i = 0; i < this.values.length; i++) {
          const element = this.values[i];
          if (typeof element === "object") {
            if (element.Evaluate(str)) {
              return true;
            }
          } else {
            if (str.match(MakeRegex(element)) !== null) {
              return true;
            }
          }
        }
        return false;
      case "$NOT":
        //Not
        let value = this.values[0];
        if (typeof value === "object") {
          return !value.Evaluate(str);
        } else {
          return str.match(MakeRegex(value)) === null;
        }
      default:
        return false;
    }
  }
}

function MakeRegex(str) {
  return new RegExp(
    str
      .replace(".", "\\.")
      .replace("*", ".*")
      .replace("(", "\\(")
      .replace(")", "\\)")
      .replace("[", "\\[")
      .replace("]", "\\]")
      .replace("^", "\\^")
      .replace("+", "\\+")
      .replace("?", "\\?")
      .replace("|", "\\|")
      .toLowerCase()
  );
}

/*
DB{
  Relationships
  Series
  Characters
  Tags
  Fandoms
  Authors
  Works
}
*/

class AppDB {
  constructor() {
    this.Clear();
    this.ClearBookmarks();
  }

  Load() {
    if (localStorage.getItem("exists") === null) {
      console.log("storage not initialied");
      return;
    }

    popup_loading.classList.remove("disabled");

    this.Works = JSON.parse(localStorage.getItem("works") ?? "[]");

    this.BuildCache();

    this.Bookmarks = new Set(
      JSON.parse(localStorage.getItem("bookmarks") ?? "[]")
    );

    popup_loading.classList.add("disabled");
  }

  Save() {
    localStorage.setItem("exists", "true");
    localStorage.setItem("works", JSON.stringify(this.Works));
    localStorage.setItem(
      "bookmarks",
      JSON.stringify(Array.from(this.Bookmarks))
    );
  }

  SaveBookmarks() {
    localStorage.setItem(
      "bookmarks",
      JSON.stringify(Array.from(this.Bookmarks))
    );
  }

  SetBookmark(id, bookmarked) {
    if (!bookmarked && this.Bookmarks.has(id)) {
      this.Bookmarks.delete(id);
      //Save
      this.SaveBookmarks();
    }

    if (bookmarked && !this.Bookmarks.has(id)) {
      this.Bookmarks.add(id);
      //Save
      this.SaveBookmarks();
    }
  }

  IsBookmarked(id) {
    return this.Bookmarks.has(id);
  }

  ToggleBookmark(id) {
    if (this.IsBookmarked(id)) {
      this.SetBookmark(id, false);
      return false;
    } else {
      this.SetBookmark(id, true);
      return true;
    }
  }

  BuildCache() {
    for (let i = 0; i < this.Works.length; i++) {
      const w = this.Works[i];
      let cached = this.ProcessWork(w);
      sessionStorage.setItem("cached_" + i, JSON.stringify(cached));
    }
    sessionStorage.setItem("cached_length", this.Works.length);
    sessionStorage.setItem("cached", true);
  }

  PushCache(work) {
    let cached = this.ProcessWork(work);
    sessionStorage.setItem(
      "cached_" + this.Works.length,
      JSON.stringify(cached)
    );
    sessionStorage.setItem("cached_length", this.Works.length + 1);
  }

  ClearCache() {
    sessionStorage.clear();
  }

  GetCache() {
    let cache = [];
    if (sessionStorage.getItem("cached") !== null) {
      let length = new Number(sessionStorage.getItem("cached_length"));
      for (let i = 0; i < length; i++) {
        let cached = JSON.parse(sessionStorage.getItem("cached_" + i));
        cache.push(cached);
      }
    }
    return cache;
  }

  Push(epub) {
    if (!this.Works.find((e) => e.id === epub.id)) {
      this.PushCache(epub);
      this.Works.push(epub);
    }
  }
  PushMany(epubs) {
    epubs.forEach((w) => {
      this.Push(w);
    });
  }

  Clear() {
    this.Works = [];
    //No need if no suggestions
    //this.Authors = [];
    //this.Fandoms = [];
    //this.Characters = [];
    //this.Relationships = [];
    //this.Tags = [];
    //this.Series = [];
  }

  ClearBookmarks() {
    this.Bookmarks = new Set();
  }

  Sort() {
    //this.Authors.sort();
    //this.Fandoms.sort();
    //this.Characters.sort();
    //this.Relationships.sort();
    //this.Tags.sort();
    //this.Series.sort();
  }

  /**
   *
   * @param {EpubData} w
   * @returns
   */
  ProcessWork(w) {
    /*
    w.authors.forEach((a) => {
      if (!this.Authors.includes(a)) {
        this.Authors.push(a);
      }
    });

    w.fandoms.forEach((f) => {
      if (!this.Fandoms.includes(f)) {
        this.Fandoms.push(f);
      }
    });

    w.characters.forEach((c) => {
      if (!this.Characters.includes(c)) {
        this.Characters.push(c);
      }
    });

    w.relationships.forEach((r) => {
      if (!this.Relationships.includes(r)) {
        this.Relationships.push(r);
      }
    });

    w.freeforms.forEach((c) => {
      if (!this.Tags.includes(c)) {
        this.Tags.push(c);
      }
    });

    if (w.series !== null && typeof w.series !== "undefined") {
      if (!this.Series.includes(w.series.name)) {
        this.Series.push(w.series.name);
      }
    }
    */

    return new EpubCache(
      w.id,
      w.title,
      w.authors.join(""),
      Date.parse(w.stats.publishedDate),
      Date.parse(w.stats.updatedDate),
      w.fandoms.join(""),
      w.relationships.join(""),
      w.characters.join(""),
      w.freeforms.join(""),
      w.description,
      typeof w.series === "undefined" || w.series === null ? "" : w.series.name,
      w.stats.wordCount,
      w.stats.chapters.currentChapter === w.stats.chapters.maxChapter,
      w.stats.chapters.currentChapter === 1
    );
  }
}

class EpubSeries {
  /**
   *
   * @param {Number} part
   * @param {string} name
   */
  constructor(part, name) {
    this.part = part;
    this.name = name;
  }
}

class EpubChapter {
  /**
   *
   * @param {Number} currentChapter
   * @param {Number} maxChapter
   */
  constructor(currentChapter, maxChapter) {
    this.currentChapter = currentChapter;
    //0 = ?
    this.maxChapter = maxChapter;
  }

  static toString(c) {
    return `${c.currentChapter}/${c.maxChapter > 0 ? c.maxChapter : "?"}`;
  }
}

class EpubStats {
  /**
   *
   * @param {string} publishedDate
   * @param {string} completedDate
   * @param {Number} wordCount
   * @param {EpubChapter} chapters
   */
  constructor(publishedDate, completedDate, updatedDate, wordCount, chapters) {
    this.publishedDate = publishedDate;
    this.completedDate = completedDate;
    this.updatedDate = updatedDate;
    this.wordCount = wordCount;
    this.chapters = chapters;
  }

  static toString(s) {
    let stringbuilder = "";
    if (s.publishedDate != null) {
      stringbuilder += `Published: ${s.publishedDate} \xa0\xa0`;
    }

    if (s.completedDate != null) {
      stringbuilder += `Compeleted: ${s.completedDate} \xa0\xa0`;
    }

    if (s.updatedDate != null) {
      stringbuilder += `Updated: ${s.updatedDate} \xa0\xa0`;
    }

    if (s.wordCount != null) {
      stringbuilder += `Words: ${s.wordCount.toLocaleString()} \xa0\xa0`;
    }

    if (s.chapters != null) {
      stringbuilder += `Chapters: ${EpubChapter.toString(s.chapters)} \xa0\xa0`;
    }

    return stringbuilder;
  }
}

class EpubData {
  /**
   *
   * @param {string} id
   * @param {string} title
   * @param {string[]} authors
   * @param {string[]} fandoms
   * @param {string} date
   * @param {string[]} warnings
   * @param {string[]} relationships
   * @param {string[]} characters
   * @param {string[]} freeforms
   * @param {string} description
   * @param {EpubSeries} series
   * @param {EpubStats} stats
   */
  constructor(
    id,
    title,
    authors,
    fandoms,
    date,
    warnings,
    relationships,
    characters,
    freeforms,
    description,
    series,
    stats
  ) {
    this.id = id;
    this.title = title;
    this.authors = authors;
    this.fandoms = fandoms;
    this.date = date;
    this.warnings = warnings;
    this.relationships = relationships;
    this.characters = characters;
    this.freeforms = freeforms;
    this.description = description;
    this.series = series;
    this.stats = stats;
  }
}

class EpubCache {
  /**
   *
   * @param {string} id
   * @param {string} title
   * @param {string} authors
   * @param {Date} date_published
   * @param {Date} date_updated //Equals the date on the post
   * @param {string} fandoms
   * @param {string} relationships
   * @param {string} characters
   * @param {string} freeforms
   * @param {string} description
   * @param {string} series
   * @param {number} wordCount
   * @param {boolean} iscomplete
   * @param {boolean} issinglechapter
   */
  constructor(
    id,
    title,
    authors,
    date_published,
    date_updated,
    fandoms,
    relationships,
    characters,
    freeforms,
    description,
    series,
    wordCount,
    iscomplete,
    issinglechapter
  ) {
    this.id = id;
    this.title = title;
    this.authors = authors;
    this.date_published = date_published;
    this.date_updated = date_updated;
    this.fandoms = fandoms;
    this.relationships = relationships;
    this.characters = characters;
    this.freeforms = freeforms;
    this.description = description;
    this.series = series;
    this.wordCount = wordCount;
    this.iscomplete = iscomplete;
    this.issinglechapter = issinglechapter;
  }

  static GetConcatted(c) {
    return (
      c.title +
      c.authors +
      c.fandoms +
      c.relationships +
      c.characters +
      c.freeforms +
      c.description +
      c.series
    );
  }
}

function TestCard() {
  var epubtest1 = new EpubData(
    "id1",
    "Test Title",
    ["Author A", "Author B"],
    ["Fandom A", "Fandom B"],
    "01 JAN 2023",
    ["Warning 1", "Warning 2"],
    ["A/B", "A & B"],
    ["A", "B"],
    ["Angst", "Fluff", "Hurt", "Whump"],
    "Lorem ipsum dolor sit amet.",
    new EpubSeries(10, "ABCDEFG"),
    new EpubStats(
      "2022-10-04",
      "2023-08-02",
      "2323-23-23",
      120313,
      new EpubChapter(10, 100)
    )
  );
  var epubtest2 = new EpubData(
    "id2",
    "Test Title",
    ["Author A", "Author B"],
    ["Fandom A", "Fandom B"],
    "01 JAN 2023",
    ["Warning 1", "Warning 2"],
    ["A/B", "A & B"],
    ["A", "B"],
    ["Angst", "Fluff", "Hurt", "Whump"],
    "Lorem ipsum dolor sit amet.",
    null,
    new EpubStats(
      "2022-10-04",
      "2023-08-02",
      "2323-23-23",
      120313,
      new EpubChapter(99, 0)
    )
  );

  var elem1 = createCard(epubtest1);
  var elem2 = createCard(epubtest2);

  document.body.getElementsByClassName("main-content")[0].appendChild(elem1);
  document.body.getElementsByClassName("main-content")[0].appendChild(elem2);
}

function TestSearch() {
  window.search_query = `WordA WordB Word C "Word D" -"Word E" -WordF -G WordH||I||K -WordL||WordM`;
  console.log(search_query);
  window.token = Search.ParseSearch(search_query);
  console.log(token);
  window.search_dict = [
    "WordA WordB",
    `WordA WordB Word C "Word D" -"Word E" -WordF G WordH||I||K -WordL||WordM`,
    `WordA WordB Word C Word E Word D F WordH WordM`,
    `WordA WordB Word C Word D F K`,
  ];
  var search_results = Search.SearchInStringArray([token], search_dict);
  console.log(search_results);
}