import { DomHighlight } from "./domHighlight";
import { Highlight, Point } from "./models";
import { Navigator } from "./navigation";
import { Utils } from "./utils";

export function start(domWindow: Window) {
  listenKeydownEvents(domWindow);
}

type AppState = {
  focusedElement: HTMLElement,
  highlights: Highlight[],
  highlightsVisible: boolean,
  isUserTypingText: boolean,
  lastSelectedHighlightPosition: Point,
  selectedHighlight: Highlight
}

type Direction = "up" | "down" | "left" | "right";

type ClickSimulatingMethod = "click" | "focus";

const appState: AppState = {
  focusedElement: null,
  highlights: [],
  highlightsVisible: false,
  isUserTypingText: false,
  lastSelectedHighlightPosition: null,
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
      default: {
        hideHighlights();
        blurFocusedElement();
        break;
      }
    }
  };

  const { composeRight } = Utils.Function;
  const keydownModifiers = composeRight(filterModifierKeys, recognizeTypingText, filterWhenTypingText);
  domWindow.document.addEventListener("keydown", keydownModifiers(keydownHandler));
}

function filterModifierKeys(func: (e: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    const modifierKeysPressed = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    if (!modifierKeysPressed) {
      func(event);
    }
  };
}

function recognizeTypingText(func: (e: KeyboardEvent) => void) {
  let userTypingTimeout = null;

  return (event: KeyboardEvent) => {
    const userAlreadyTyped = !!userTypingTimeout;
    userTypingTimeout = clearTimeout(userTypingTimeout);
    if (appState.highlightsVisible) {
      appState.isUserTypingText = false;
    } else {
      if (userAlreadyTyped) {
        appState.isUserTypingText = true;
      }
      userTypingTimeout = setTimeout(() => {
        userTypingTimeout = clearTimeout(userTypingTimeout);
        appState.isUserTypingText = false;
      }, 1000);
    }

    func(event);
  };
}

function filterWhenTypingText(func: (e: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    if (!appState.isUserTypingText) {
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
  const highlightPosition = appState.lastSelectedHighlightPosition || centralPoint;
  appState.selectedHighlight = Navigator.getNearestHighlight(appState.highlights, highlightPosition);

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
    appState.lastSelectedHighlightPosition = Navigator.getCentralPoint(nearestHighlight.rect);
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
