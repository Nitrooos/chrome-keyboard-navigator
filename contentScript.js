const utilsModule = (function () {
  return {
    first: array => array[0],
    last: array => array[array.length - 1]
  };
})();

const navigatorModule = (function () {
  function getCentralHighlight(highlights, pageCentralPoint) {
    const highlightsSortedByDistanceFromCenter = highlights
      .map(assignDistanceFromPoint.bind(null, pageCentralPoint))
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);

    const { first } = utilsModule;
    return first(highlightsSortedByDistanceFromCenter);
  }

  function getNearestHighlights(highlights, selectedHighlight) {
    const selectedHighlightCentralPoint = getCentralPoint(selectedHighlight.rect);
    const highlightsWithCentralPoints = highlights.map(assignCentralPoint);

    const verticalDistances = highlightsWithCentralPoints
      .filter(({ rect }) => rectsVerticallyAligned(selectedHighlight.rect, rect))
      .map(data => ({ ...data, distance: data.centralPoint.y - selectedHighlightCentralPoint.y }))
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);
    const horizontalDistances = highlightsWithCentralPoints
      .filter(({ rect }) => rectsHorizontallyAligned(selectedHighlight.rect, rect))
      .map(data => ({ ...data, distance: data.centralPoint.x - selectedHighlightCentralPoint.x }))
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);

    const [downNearest, leftNearest, rightNearest, upNearest] = [
      verticalDistances.filter(({ distance }) => distance > 0),
      horizontalDistances.filter(({ distance }) => distance < 0),
      horizontalDistances.filter(({ distance }) => distance > 0),
      verticalDistances.filter(({ distance }) => distance < 0)
    ];

    const { first, last } = utilsModule;
    return {
      down: first(downNearest),
      left: last(leftNearest),
      right: first(rightNearest),
      up: last(upNearest)
    };
  }

  function assignDistanceFromPoint(point, highlight) {
    const highlightWithCentralPoint = assignCentralPoint(highlight);
    return {
      ...highlightWithCentralPoint,
      distance: getCartesianDistance(highlightWithCentralPoint.centralPoint, point)
    };
  }

  function assignCentralPoint(highlight) {
    return {
      ...highlight,
      centralPoint: getCentralPoint(highlight.rect)
    };
  }

  function rectsVerticallyAligned(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width
      && rect1.x + rect1.width > rect2.x
    );
  }

  function rectsHorizontallyAligned(rect1, rect2) {
    return (
      rect1.y < rect2.y + rect2.height
      && rect1.y + rect1.height > rect2.y
    );
  }

  function getCentralPoint(rect) {
    return { x: rect.x + .5*rect.width, y: rect.y + .5*rect.height };
  }

  function getCartesianDistance(point1, point2) {
    return Math.sqrt((point1.x - point2.x)**2 + (point1.y - point2.y)**2);
  }

  return {
    getCentralHighlight,
    getNearestHighlights
  };
})();

const domHighlightModule = (function () {
  function createHighlightsOnPage(domDocument) {
    return queryClickableAll(domDocument)
      .map(assignBoundingClientRect)
      .filter(isClickableBigEnough)
      .filter(isClickableVisibleOnThePage)
      .map(createHighlightFromClickable.bind(null, domDocument))
  }

  function selectHighlight(highlight) {
    Object.assign(highlight.element.style, {
      background: "yellow",
      opacity: .5
    });
  }

  function unselectHighlight(highlight) {
    Object.assign(highlight.element.style, {
      background: "transparent",
      opacity: null
    });
  }

  function showHighlights(highlights, domWindow) {
    const domDocument = domWindow.document;
    highlights
      .map(highlight => highlight.element)
      .forEach(highlight => domDocument.body.appendChild(highlight));
  }

  function hideHighlights(highlights) {
    highlights
      .map(highlight => highlight.element)
      .forEach(highlight => highlight.remove());
  }

  function queryClickableAll(domDocument) {
    const clickableSelector = "a, button, input, select, textarea";
    return Array.from(domDocument.querySelectorAll(clickableSelector));
  }

  function createHighlightFromClickable(domDocument, { clickable, rect }) {
    const element = domDocument.createElement("div");
    Object.assign(element.style, {
      background: "transparent",
      border: "2px solid black",
      height: rect.height + "px",
      left: (rect.left + domDocument.documentElement.scrollLeft) + "px",
      position: "absolute",
      top: (rect.top + domDocument.documentElement.scrollTop) + "px",
      width: rect.width + "px",
      zIndex: 999999999
    });
    return { clickable, element, rect };
  }

  function assignBoundingClientRect(clickableElement) {
    return {
      clickable: clickableElement,
      rect: clickableElement.getBoundingClientRect()
    };
  }

  function isClickableBigEnough({ rect }) {
    return rect.width > 10 && rect.height > 10;
  }

  function isClickableVisibleOnThePage({ rect }) {
    return rect.top >= 0 && rect.left >= 0;
  }

  return {
    createHighlightsOnPage,
    hideHighlights,
    selectHighlight,
    showHighlights,
    unselectHighlight
  }
})();

const appModule = (function () {
  const self = {
    focusedElement: null,
    highlights: [],
    highlightsVisible: false,
    selectedHighlight: null
  };

  function start(domWindow) {
    listenKeydownEvents(domWindow);
  }

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
    self.highlights = domHighlightModule.createHighlightsOnPage(domWindow.document);
    domHighlightModule.showHighlights(self.highlights, domWindow);

    const centralPoint = { x: domWindow.innerWidth/2, y: domWindow.innerHeight/2 };
    self.selectedHighlight = navigatorModule.getCentralHighlight(self.highlights, centralPoint);
    domHighlightModule.selectHighlight(self.selectedHighlight);

    self.highlightsVisible = true;
  }

  function hideHighlights() {
    domHighlightModule.hideHighlights(self.highlights);
    self.highlights = [];
    self.selectedHighlight = null;
    self.highlightsVisible = false;
  }

  function navigateHighlights(event, direction) {
    if (self.highlightsVisible) {
      const nearestHighlights = navigatorModule.getNearestHighlights(self.highlights, self.selectedHighlight);
      navigateHighlightTo(nearestHighlights[direction]);
      event.preventDefault();
    }
  }

  function navigateHighlightTo(nearestHighlight) {
    if (nearestHighlight) {
      domHighlightModule.unselectHighlight(self.selectedHighlight)
      self.selectedHighlight = nearestHighlight;
      domHighlightModule.selectHighlight(self.selectedHighlight);
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

  return {
    start
  };
})();

appModule.start(window);
