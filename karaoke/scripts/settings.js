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

  addLabeledElement(labelGetter, element) {
    this.elements.push({
      labelGetter: labelGetter,
      build() {
        return createLabeledElement(this.labelGetter(), element);
      },
    });
  }

  addToggle(labelGetter, valueGetter, valueSetter) {
    this.elements.push({
        labelGetter: labelGetter,
        valueGetter: valueGetter,
        valueSetter: valueSetter,
        build() {
          return createToggle(this.labelGetter(), this.valueGetter, this.valueSetter);
        },
      });
  }

  addButton(labelGetter, onClick){

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

var SettingsUI = {
  settingsOverlay: $I("settings-dialog"),
  toggle_bg: $Q("#setting-bg > .switch > input"),
  toggle_anim: $Q("#setting-anim > .switch > input"),
  toggle_fps: $Q("#setting-fps > .switch > input"),
  toggle_power: $Q("#setting-power > .switch > input"),

  updateToggles() {
    SettingsUI.toggle_bg.checked = settings.enableBackground;
    SettingsUI.toggle_anim.checked = settings.enableTextAnimation;
    SettingsUI.toggle_fps.checked = settings.enableFps;
    SettingsUI.toggle_power.checked = settings.powerSaving;
  },

  openSettings() {
    SettingsUI.settingsOverlay.classList.toggle("closed", false);
  },

  closeSettings() {
    SettingsUI.settingsOverlay.classList.toggle("closed", true);
  }
}

SettingsUI.toggle_bg.onclick = () => {
  settings.enableBackground = SettingsUI.toggle_bg.checked;
  //SettingsUI.updateToggles();
  BackgroundUI.updateVisibility();
}

SettingsUI.toggle_anim.onclick = () => {
  settings.enableTextAnimation = SettingsUI.toggle_anim.checked;
  //SettingsUI.updateToggles();
  LyricsUI.updateFancy();
}

SettingsUI.toggle_fps.onclick = () => {
  settings.enableFps = SettingsUI.toggle_fps.checked;
  //SettingsUI.updateToggles();
  FPSCounter.updateVisibility();
}

SettingsUI.toggle_power.onclick = () => {
  settings.powerSaving = SettingsUI.toggle_power.checked;
  //SettingsUI.updateToggles();
}
$I("settings-ok").onclick = () => {
  SettingsUI.closeSettings();
}

$I("button-settings").onclick = () => {
  SettingsUI.openSettings();
}