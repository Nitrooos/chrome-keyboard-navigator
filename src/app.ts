import { DomHighlight, Highlight } from "./domHighlight";
import { Navigator } from "./navigation";

export function start(domWindow: Window) {
  listenKeydownEvents(domWindow);
}

type AppState = {
  focusedElement: HTMLElement,
  highlights: Highlight[],
  highlightsVisible: boolean,
  selectedHighlight: Highlight
}

type Direction = "up" | "down" | "left" | "right";

type ClickSimulatingMethod = "click" | "focus";

const appState: AppState = {
  focusedElement: null,
  highlights: [],
  highlightsVisible: false,
  selectedHighlight: null
};

function listenKeydownEvents(domWindow: Window) {
  const keydownHandler = (event: KeyboardEvent) => {
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
  };

  domWindow.document.addEventListener("keydown", filterModifierKeys(keydownHandler));
}

function filterModifierKeys(func: (e: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    const modifierKeysPressed = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    if (!modifierKeysPressed) {
      func(event);
    }
  };
}

function toggleHighlights(domWindow: Window) {
  appState.highlightsVisible ? hideHighlights() : showHighlights(domWindow);
}

function showHighlights(domWindow: Window) {
  appState.highlights = DomHighlight.createHighlightsOnPage(domWindow.document);
  DomHighlight.showHighlights(appState.highlights, domWindow.document);

  const centralPoint = { x: domWindow.innerWidth/2, y: domWindow.innerHeight/2 };
  appState.selectedHighlight = Navigator.getCentralHighlight(appState.highlights, centralPoint);
  DomHighlight.selectHighlight(appState.selectedHighlight);

  appState.highlightsVisible = true;
}

function hideHighlights() {
  DomHighlight.hideHighlights(appState.highlights);
  appState.highlights = [];
  appState.selectedHighlight = null;
  appState.highlightsVisible = false;
}

function navigateHighlights(event: Event, direction: Direction) {
  if (appState.highlightsVisible) {
    const nearestHighlights = Navigator.getNearestHighlights(appState.highlights, appState.selectedHighlight);
    navigateHighlightTo(nearestHighlights[direction]);
    event.preventDefault();
  }
}

function navigateHighlightTo(nearestHighlight: Highlight) {
  if (nearestHighlight) {
    DomHighlight.unselectHighlight(appState.selectedHighlight)
    appState.selectedHighlight = nearestHighlight;
    DomHighlight.selectHighlight(appState.selectedHighlight);
  }
}

function simulateClick(event: Event) {
  const element = appState.selectedHighlight?.clickable;
  if (element) {
    event.preventDefault();
    const clickSimulatingMethod = getClickSimulatingMethodForElement(element);
    element[clickSimulatingMethod]();
    if (clickSimulatingMethod === "focus") {
      appState.focusedElement = element;
    }

    hideHighlights();
  }
}

function getClickSimulatingMethodForElement(element: HTMLElement): ClickSimulatingMethod {
  const tagsNeedingFocus = ["input", "select", "textarea"];
  const tagsNeedingFocusSelector = tagsNeedingFocus.join(",");

  const inputTypesNeedingClick = ["button", "checkbox", "file", "image", "radio", "reset", "submit"];
  const inputNeedingClickSelector = inputTypesNeedingClick.map(type => `input[type="${type}"]`).join(",");

  const shouldBeFocused = element.matches(tagsNeedingFocusSelector) && !element.matches(inputNeedingClickSelector);
  return shouldBeFocused ? "focus" : "click";
}

function blurFocusedElement() {
  if (appState.focusedElement) {
    appState.focusedElement.blur();
    appState.focusedElement = null;
  }
}
