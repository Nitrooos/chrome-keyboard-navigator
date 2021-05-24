export const DomHighlight = {
  createHighlightsOnPage,
  selectHighlight,
  unselectHighlight,
  showHighlights,
  hideHighlights
};

export type Highlight = {
  clickable: HTMLElement;
  element: HTMLElement;
  rect: DOMRect;
};

function createHighlightsOnPage(domDocument: Document): Highlight[] {
  return queryClickableAll(domDocument)
    .map(assignBoundingClientRect)
    .filter(isClickableBigEnough)
    .filter(isClickableVisibleOnThePage)
    .map(createHighlightFromClickable.bind(null, domDocument))
}

function selectHighlight(highlight: Highlight) {
  Object.assign(highlight.element.style, {
    background: "yellow",
    opacity: .5
  });
}

function unselectHighlight(highlight: Highlight) {
  Object.assign(highlight.element.style, {
    background: "transparent",
    opacity: null
  });
}

function showHighlights(highlights: Highlight[], domDocument: Document) {
  highlights
    .map(highlight => highlight.element)
    .forEach(highlight => domDocument.body.appendChild(highlight));
}

function hideHighlights(highlights: Highlight[]) {
  highlights
    .map(highlight => highlight.element)
    .forEach(highlight => highlight.remove());
}

function queryClickableAll(domDocument: Document): HTMLElement[] {
  const clickableSelector = "a, button, input, select, textarea";
  return Array.from(domDocument.querySelectorAll(clickableSelector));
}

function createHighlightFromClickable(domDocument: Document, { clickable, rect }): Highlight {
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

function assignBoundingClientRect(clickableElement: HTMLElement): Omit<Highlight, "element"> {
  return {
    clickable: clickableElement,
    rect: clickableElement.getBoundingClientRect()
  };
}

function isClickableBigEnough({ rect }: Highlight): boolean {
  return rect.width > 10 && rect.height > 10;
}

function isClickableVisibleOnThePage({ rect }: Highlight): boolean {
  return rect.top >= 0 && rect.left >= 0;
}
