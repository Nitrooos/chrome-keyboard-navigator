const domHighlightModule = (function () {
  function createHighlightsOnPage(domDocument) {
    return queryClickableAll(domDocument).map(createHighlightFromClickable.bind(null, domDocument));
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
    createHighlightsOnPage
  }
})();

const highlightsModule = (function () {
  const self = {
    highlights: [],
    highlightsVisible: false
  };

  function toggleHighlights(domWindow) {
    self.highlightsVisible ? hide() : show(domWindow);
    self.highlightsVisible = !self.highlightsVisible;
  }

  function show(domWindow) {
    const domDocument = domWindow.document;
    self.highlights = domHighlightModule.createHighlightsOnPage(domDocument);
    self.highlights.forEach(highlight => domDocument.body.appendChild(highlight));
  }

  function hide() {
    self.highlights.forEach(highlight => highlight.remove());
    self.highlights = [];
  }

  return {
    toggleHighlights
  };
})();

window.document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "f": highlightsModule.toggleHighlights(window);
  }
});
