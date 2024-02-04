window.addEventListener("keyup", (e) => {
  if (e.key == "o") {
    document.querySelectorAll(".autofill").forEach((x) => {
      x.disabled = !x.disabled;
    });
  }
});

window.addEventListener("load", () => {
  var availableTags = [
    "\"ActionScript\"",
    "AppleScript",
    "Asp",
    "BASIC",
    "C",
    "C++",
    "Clojure",
    "COBOL",
    "ColdFusion",
    "Erlang",
    "Fortran",
    "Groovy",
    "Haskell",
    "Java",
    "JavaScript",
    "Lisp",
    "Perl",
    "PHP",
    "Python",
    "Ruby",
    "Scala",
    "Scheme"
  ];
  $( "#tags" ).autocomplete({
    source: availableTags
  });
})