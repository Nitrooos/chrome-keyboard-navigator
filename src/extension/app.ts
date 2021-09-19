import { DomHighlight } from "./domHighlight";
import { Action, getAction } from "./actions";
import { sendMessage } from "../shared/messages";
import { Highlight, Point } from "./models";
import { Navigator } from "./navigation";

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
    const { Reload, TurnOn, Up, Down, Left, Right, Click } = Action

    switch (getAction(event)) {
      case Reload: reload(event); break;
      case TurnOn: toggleHighlights(domWindow); break;
      case Up: navigateHighlights(event, "up"); break;
      case Down: navigateHighlights(event, "down"); break;
      case Left: navigateHighlights(event, "left"); break;
      case Right: navigateHighlights(event, "right"); break;
      case Click: simulateClick(event); break;
      default: {
        hideHighlights();
        blurFocusedElement();
        break;
      }
    }
  };

  domWindow.document.addEventListener("keydown", recognizeTurningOn(keydownHandler));
}

function reload(event: KeyboardEvent) {
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    sendMessage("reloadRequest", () => window.location.reload());
  }
}

function recognizeTurningOn(func: (e: KeyboardEvent) => void) {
  let firstKeydownTimeout: ReturnType<typeof setTimeout> = null;

  return (event: KeyboardEvent) => {
    if (getAction(event) === Action.TurnOn) {
      const secondKeydown = !!firstKeydownTimeout;
      if (secondKeydown || appState.highlightsVisible) {
        func(event);
      } else {
        firstKeydownTimeout = setTimeout(() => {
          clearTimeout(firstKeydownTimeout);
          firstKeydownTimeout = null
        }, 200);
      }
    } else {
      clearTimeout(firstKeydownTimeout);
      firstKeydownTimeout = null
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
    const nearestHighlights = Navigator.getNearestDirectionalHighlights(appState.highlights, appState.selectedHighlight);
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
