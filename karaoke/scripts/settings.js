class Dialog {
  title = "Dialog";
  elements = [];
  buttons = [];

  addElement(element) {
    this.elements.push({
        build() {
            return element;
        }
    });
  }

  addLabeledElement(labelGetter) {
    this.elements.push({
      labelGetter: labelGetter,
      build() {
        return createLabeledElement(this.labelGetter());
      },
    });
  }

  addToggle(labelGetter, valueGetter, valueSetter) {

  }

  createLabeledElement(label, element) {
    let el = document.createElement("div");
    el.className = "children-fill row first col";

    let p = document.createElement("p");
    p.innerText = label;

    el.appendChild(p);
    el.appendChild(element);
    return el;
  }

  createToggle(label, getter, setter) {
    let toggle = document.createElement("label");
    let input = document.createElement("input");
    let span = document.createElement("span");
    toggle.className = "md3 switch children-fill";
    input.type = "checkbox";
    span.className = "slider";
    input.checked = getter();
    input.onchange = () => setter(input.checked);

    toggle.appendChild(input);
    toggle.appendChild(span);
    return this.createLabeledElement(label, toggle);
  }

  createButton(label, onClick) {
    let button = document.createElement("button");
    button.className = "normal";
    button.innerText = label;
    button.onclick = () => onClick(button);
    return button;
  }

  createIconButton(label, iconPath, onClick) {
    let button = document.createElement("button");
    button.className = "normal";

    let icon = document.createElement("img");
    icon.src = iconPath;
    icon.className = "tint-light";
    icon.style.marginRight = "0.5em";
    icon.style.fontSize = "1.25em";

    let span = document.createElement("span");
    span.style.marginRight = "0.5em";
    span.innerText = label;

    button.appendChild(icon);
    button.appendChild(span);

    button.onclick = () => onClick(button);
    return button;
  }
}
