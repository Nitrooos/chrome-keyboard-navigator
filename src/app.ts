import { DomHighlight } from "./domHighlight";
import { Navigator } from "./navigation";

export function start(domWindow) {
  listenKeydownEvents(domWindow);
}

const self = {
  focusedElement: null,
  highlights: [],
  highlightsVisible: false,
  selectedHighlight: null
};

function listenKeydownEvents(domWindow) {
  domWindow.document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "f": toggleHighlights(domWindow); break;
      case "ArrowUp": navigateHighlights(event, "up"); break;
      case "ArrowDown": navigateHighlights(event, "down"); break;
      case "ArrowLeft": navigateHighlights(event, "left"); break;
      case "ArrowRight": navigateHighlights(event, "right"); break;
      case "Enter": simulateClick(event); break;
      case "Escape": {
        hideHighlights();
        blurFocusedElement();
        break;
      }
    }
  });
}

function toggleHighlights(domWindow) {
  self.highlightsVisible ? hideHighlights() : showHighlights(domWindow);
}

function showHighlights(domWindow) {
  self.highlights = DomHighlight.createHighlightsOnPage(domWindow.document);
  DomHighlight.showHighlights(self.highlights, domWindow);

  const centralPoint = { x: domWindow.innerWidth/2, y: domWindow.innerHeight/2 };
  self.selectedHighlight = Navigator.getCentralHighlight(self.highlights, centralPoint);
  DomHighlight.selectHighlight(self.selectedHighlight);

  self.highlightsVisible = true;
}

function hideHighlights() {
  DomHighlight.hideHighlights(self.highlights);
  self.highlights = [];
  self.selectedHighlight = null;
  self.highlightsVisible = false;
}

function navigateHighlights(event, direction) {
  if (self.highlightsVisible) {
    const nearestHighlights = Navigator.getNearestHighlights(self.highlights, self.selectedHighlight);
    navigateHighlightTo(nearestHighlights[direction]);
    event.preventDefault();
  }
}

function navigateHighlightTo(nearestHighlight) {
  if (nearestHighlight) {
    DomHighlight.unselectHighlight(self.selectedHighlight)
    self.selectedHighlight = nearestHighlight;
    DomHighlight.selectHighlight(self.selectedHighlight);
  }
}

function simulateClick(event) {
  const element = self.selectedHighlight?.clickable;
  if (element) {
    event.preventDefault();
    const clickSimulatingMethod = getClickSimulatingMethodForElement(element);
    element[clickSimulatingMethod]();
    if (clickSimulatingMethod === "focus") {
      self.focusedElement = element;
    }

    hideHighlights();
  }
}

function getClickSimulatingMethodForElement(element) {
  const tagsNeedingFocus = ["input", "select", "textarea"];
  const tagsNeedingFocusSelector = tagsNeedingFocus.join(",");

  const inputTypesNeedingClick = ["button", "checkbox", "file", "image", "radio", "reset", "submit"];
  const inputNeedingClickSelector = inputTypesNeedingClick.map(type => `input[type="${type}"]`).join(",");

  const shouldBeFocused = element.matches(tagsNeedingFocusSelector) && !element.matches(inputNeedingClickSelector);
  return shouldBeFocused ? "focus" : "click";
}

function blurFocusedElement() {
  if (self.focusedElement) {
    self.focusedElement.blur();
    self.focusedElement = null;
  }
}
