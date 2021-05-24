import { Highlight } from "./domHighlight";
import { Utils } from "./utils";

export const Navigator = {
  getCentralHighlight,
  getNearestHighlights
};

type Point = {
  x: number;
  y: number;
};

function getCentralHighlight(highlights: Highlight[], pageCentralPoint: Point): Highlight {
  const highlightsSortedByDistanceFromCenter = highlights
    .map(highlight => assignDistanceFromPoint(pageCentralPoint, highlight))
    .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance);

  const { first } = Utils.Array;
  return first(highlightsSortedByDistanceFromCenter);
}

function getNearestHighlights(highlights: Highlight[], selectedHighlight: Highlight) {
  const selectedHighlightCentralPoint = getCentralPoint(selectedHighlight.rect);
  const highlightsWithCentralPoints = highlights.map(assignCentralPoint);

  const verticalDistances = highlightsWithCentralPoints
    .filter(({ rect }) => rectsVerticallyAligned(selectedHighlight.rect, rect))
    .filter(({ centralPoint }) => centralPoint.y )
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
  ] as Highlight[][];

  const { first, last } = Utils.Array;
  return {
    down: first(downNearest),
    left: last(leftNearest),
    right: first(rightNearest),
    up: last(upNearest)
  };
}

function assignDistanceFromPoint(point: Point, highlight: Highlight) {
  const highlightWithCentralPoint = assignCentralPoint(highlight);
  return {
    ...highlightWithCentralPoint,
    distance: getCartesianDistance(highlightWithCentralPoint.centralPoint, point)
  };
}

function assignCentralPoint(highlight: Highlight) {
  return {
    ...highlight,
    centralPoint: getCentralPoint(highlight.rect)
  };
}

function rectsVerticallyAligned(rect1: DOMRect, rect2: DOMRect): boolean {
  return (
    rect1.x < rect2.x + rect2.width
    && rect1.x + rect1.width > rect2.x
  );
}

function rectsHorizontallyAligned(rect1: DOMRect, rect2: DOMRect): boolean {
  return (
    rect1.y < rect2.y + rect2.height
    && rect1.y + rect1.height > rect2.y
  );
}

function getCentralPoint(rect: DOMRect): Point {
  return { x: rect.x + .5*rect.width, y: rect.y + .5*rect.height };
}

function getCartesianDistance(point1: Point, point2: Point): number {
  return Math.sqrt((point1.x - point2.x)**2 + (point1.y - point2.y)**2);
}
