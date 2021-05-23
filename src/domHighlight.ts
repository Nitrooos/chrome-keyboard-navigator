export const DomHighlight = {
  createHighlightsOnPage,
  selectHighlight,
  unselectHighlight,
  showHighlights,
  hideHighlights
};

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
