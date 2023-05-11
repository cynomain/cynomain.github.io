//Debug
window.onload = () => {
    var entryElement = document.createElement("div");
    entryElement.className = "showEntry";
    var p1 = document.createElement("p");
    p1.innerText = "1.";
    p1.className = "number"
    var p2 = document.createElement("p");
    p2.innerText = "ANS";
    p2.className = "answer";
    var p3 = document.createElement("p");
    p3.innerText = "✔";
    p3.className = "correct";
    var image = document.createElement("button");
    var icon = document.createElement("img");
    icon.src = "assets/icon_edit.svg" ;
    icon.style = "height:100%; width: auto;";
    image.className = "imageButton edit";
    image.id = "button_edit";
    image.style = "color:white;";
    image.appendChild(icon);
    entryElement.appendChild(p1);
    entryElement.appendChild(p2);
    entryElement.appendChild(p3);
    entryElement.appendChild(image);
  
    var parent = document.getElementById("entries");
  
    for (let i = 0; i < 40; i++) {
      parent.appendChild(entryElement.cloneNode(true));
    }
  
  
  };