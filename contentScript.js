const utilsModule = (function () {
  return {
    first: array => array[0],
    last: array => array[array.length - 1]
  };
})();

const navigatorModule = (function () {
  function getCentralHighlight(highlights, pageCentralPoint) {
    const highlightsSortedByDistanceFromCenter = mapHighlightsWithDistanceFromPoint(highlights, pageCentralPoint)
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance)
      .map(({ highlight }) => highlight);

    return highlightsSortedByDistanceFromCenter[0];
  }

  function getNearestHighlights(highlights, selectedHighlight) {
    const selectedHighlightRect = selectedHighlight.getBoundingClientRect();
    const selectedHighlightCentralPoint = getCentralPoint(selectedHighlightRect);
    const highlightsWithPositionData = mapHighlightsWithPositionData(highlights);

    const verticalDistances = highlightsWithPositionData
      .filter(({ rect }) => rectsVerticallyAligned(selectedHighlightRect, rect))
      .map(data => ({ ...data, distance: data.centralPoint.y - selectedHighlightCentralPoint.y }))
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);
    const horizontalDistances = highlightsWithPositionData
      .filter(({ rect }) => rectsHorizontallyAligned(selectedHighlightRect, rect))
      .map(data => ({ ...data, distance: data.centralPoint.x - selectedHighlightCentralPoint.x }))
      .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);

    const [downNearest, leftNearest, rightNearest, upNearest] = [
      verticalDistances.filter(({ distance }) => distance > 0),
      horizontalDistances.filter(({ distance }) => distance < 0),
      horizontalDistances.filter(({ distance }) => distance > 0),
      verticalDistances.filter(({ distance }) => distance < 0)
    ].map(nearestHighlights => nearestHighlights.map(({ highlight }) => highlight));

    const { first, last } = utilsModule;
    return {
      down: first(downNearest),
      left: last(leftNearest),
      right: first(rightNearest),
      up: last(upNearest)
    };
  }

  function mapHighlightsWithDistanceFromPoint(highlights, point) {
    return mapHighlightsWithPositionData(highlights)
      .map(data => ({
        ...data,
        distance: getCartesianDistance(data.centralPoint, point)
      }));
  }

  function mapHighlightsWithPositionData(highlights) {
    return highlights
      .map(highlight => ({
        highlight, 
        rect: highlight.getBoundingClientRect()
      }))
      .map(data => ({
        ...data,
        centralPoint: getCentralPoint(data.rect)
      }));
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
    return queryClickableAll(domDocument).map(createHighlightFromClickable.bind(null, domDocument));
  }

  function selectHighlight(highlight) {
    Object.assign(highlight.style, {
      background: "yellow",
      opacity: .5
    });
  }

  function unselectHighlight(highlight) {
    Object.assign(highlight.style, {
      background: "transparent",
      opacity: null
    });
  }

  function queryClickableAll(domDocument) {
    const clickableSelector = "a, button, input[type=\"button\"], input[type=\"submit\"], input[type=\"reset\"]";
    return Array.from(domDocument.querySelectorAll(clickableSelector));
  }

  function createHighlightFromClickable(domDocument, clickableElement) {
    const elementPosition = clickableElement.getBoundingClientRect();
    const highlight = domDocument.createElement("div");
    Object.assign(highlight.style, {
      background: "transparent",
      border: "2px solid black",
      height: elementPosition.height + "px",
      left: (elementPosition.left + domDocument.documentElement.scrollLeft) + "px",
      position: "absolute",
      top: (elementPosition.top + domDocument.documentElement.scrollTop) + "px",
      width: elementPosition.width + "px",
      zIndex: 999999999
    });
    return highlight;
  }

  return {
    createHighlightsOnPage,
    selectHighlight,
    unselectHighlight
  }
})();

const highlightsModule = (function () {
  function show(highlights, domWindow) {
    const domDocument = domWindow.document;
    highlights.forEach(highlight => domDocument.body.appendChild(highlight));
  }

  function hide(highlights) {
    highlights.forEach(highlight => highlight.remove());
  }

  return {
    hide,
    show
  };
})();

const appModule = (function () {
  const self = {
    highlights: [],
    highlightsVisible: false,
    focusedInputs: new Set(),
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
      }
    });
  }

  function toggleHighlights(domWindow) {
    if (self.focusedInputs.size === 0) {
      self.highlightsVisible = !self.highlightsVisible;
      if (self.highlightsVisible) {
        self.highlights = domHighlightModule.createHighlightsOnPage(domWindow.document);
        highlightsModule.show(self.highlights, domWindow);

        const centralPoint = { x: domWindow.innerWidth/2, y: domWindow.innerHeight/2 };
        self.selectedHighlight = navigatorModule.getCentralHighlight(self.highlights, centralPoint);
        domHighlightModule.selectHighlight(self.selectedHighlight);
      } else {
        highlightsModule.hide(self.highlights);
        self.highlights = [];
        self.selectedHighlight = null;
      }
    }
  }

  function navigateHighlights(event, direction) {
    const nearestHighlights = navigatorModule.getNearestHighlights(self.highlights, self.selectedHighlight);
    navigateHighlightTo(nearestHighlights[direction]);
    event.preventDefault();
  }

  function navigateHighlightTo(nearestHighlight) {
    if (nearestHighlight) {
      domHighlightModule.unselectHighlight(self.selectedHighlight)
      self.selectedHighlight = nearestHighlight;
      domHighlightModule.selectHighlight(self.selectedHighlight);
    }
  }

  return {
    start
  };
})();

appModule.start(window);

// filter very small highlights