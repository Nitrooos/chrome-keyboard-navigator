const highlightsModuleFactory = function (domDocument) {
  const self = {
    highlights: queryClickableAll().map(createHighlightFromClickable),
    highlightsVisible: false
  };

  function queryClickableAll() {
    const clickableSelector = "a, button, input[type=\"button\"], input[type=\"submit\"], input[type=\"reset\"]";
    return Array.from(domDocument.querySelectorAll(clickableSelector));
  }

  function createHighlightFromClickable(clickableElement) {
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

  function toggleHighlights() {
    self.highlightsVisible ? hide(self.highlights) : show(self.highlights);
    self.highlightsVisible = !self.highlightsVisible;
  }

  function show(highlights) {
    highlights.forEach(highlight => domDocument.body.appendChild(highlight));
  }

  function hide(highlights) {
    highlights.forEach(highlight => highlight.remove());
  }

  return {
    toggleHighlights
  };
};

const highlightsModule = highlightsModuleFactory(window.document);

window.document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "f": highlightsModule.toggleHighlights();
  }
});
