import { Highlight, Point, Rectangle } from "./models";
import { Utils } from "./utils";

export const Navigator = {
  getCentralPoint,
  getNearestHighlight,
  getNearestDirectionalHighlights
};

type Coverage = {
  xAxis: number;
  yAxis: number;
};

type CoverageDistance = {
  horizontal: number;
  vertical: number;
};

function getNearestHighlight(highlights: Highlight[], fromPosition: Point): Highlight {
  const nearestHighlights = highlights
    .map(highlight => ({ highlight, centralPoint: getCentralPoint(highlight.rect) }))
    .map(({ highlight, centralPoint }) => ({ highlight, distance: getCartesianDistance(fromPosition, centralPoint) }))
    .sort((highlight1, highlight2) => highlight1.distance - highlight2.distance)
    .map(({ highlight }) => highlight);

  const { first } = Utils.Array;
  return first(nearestHighlights);
}

function getNearestDirectionalHighlights(highlights: Highlight[], selectedHighlight: Highlight) {
  const highlightsDistances = highlights.map(highlight => [
    highlight,
    highlight.rect,
    getCoverageDistance(selectedHighlight.rect, highlight.rect)
  ]) as [Highlight, Rectangle, CoverageDistance][];

  const shRect = selectedHighlight.rect;
  const [below, left, right, above] = [
    ([, rect, _]) => rect.y > shRect.y + shRect.height/2,
    ([, rect, _]) => rect.x + rect.width/2 < shRect.x,
    ([, rect, _]) => rect.x > shRect.x + shRect.width/2,
    ([, rect, _]) => rect.y + rect.height/2 < shRect.y
  ];
  const horizontalDistanceAsc = ([, , c1], [, , c2]) => c1.horizontal - c2.horizontal;
  const verticalDistanceAsc = ([, , c1], [, , c2]) => c1.vertical - c2.vertical;
  const [downNearest, leftNearest, rightNearest, upNearest] = [
    highlightsDistances.filter(below).sort(verticalDistanceAsc),
    highlightsDistances.filter(left).sort(horizontalDistanceAsc),
    highlightsDistances.filter(right).sort(horizontalDistanceAsc),
    highlightsDistances.filter(above).sort(verticalDistanceAsc)
  ].map(nearest => nearest.map(([highlight]) => highlight));

  const { first } = Utils.Array;
  return {
    down: first(downNearest),
    left: first(leftNearest),
    right: first(rightNearest),
    up: first(upNearest)
  }
}

function getCoverageDistance(r1: Rectangle, r2: Rectangle): CoverageDistance {
  const centralPoint1 = getCentralPoint(r1);
  const centralPoint2 = getCentralPoint(r2);
  const cartesianDistance = getCartesianDistance(centralPoint1, centralPoint2);
  const coverage = getAxesCoverage(r1, r2);

  return {
    horizontal: cartesianDistance*(1 + coverage.yAxis**2),
    vertical: cartesianDistance*(1 + coverage.xAxis**2)
  };
}

function getAxesCoverage(r1: Rectangle, r2: Rectangle): Coverage {
  return {
    xAxis: getXAxisCoverage(r1, r2),
    yAxis: getYAxisCoverage(r1, r2)
  };
}

function getXAxisCoverage(r1: Rectangle, r2: Rectangle): number {
  const shorter = r1.width <= r2.width ? r1 : r2;
  const taller = r1.width > r2.width ? r1 : r2;
  const { max } = Math;
  const lacksCoverageLeft = max(0, taller.x - shorter.x);
  const lacksCoverageRight = max(0, shorter.x + shorter.width - taller.x - taller.width);
  return (lacksCoverageLeft + lacksCoverageRight)/shorter.width;
}

function getYAxisCoverage(r1: Rectangle, r2: Rectangle): number {
  const shorter = r1.height <= r2.height ? r1 : r2;
  const taller = r1.height > r2.height ? r1 : r2;
  const { max } = Math;
  const lacksCoverageUp = max(0, taller.y - shorter.y);
  const lacksCoverageDown = max(0, shorter.y + shorter.height - taller.y - taller.height);
  return (lacksCoverageUp + lacksCoverageDown)/shorter.height;
}

function getCentralPoint({ x, width, y, height }: Rectangle): Point {
  return { x: x + .5*width, y: y + .5*height };
}

function getCartesianDistance(point1: Point, point2: Point): number {
  return Math.sqrt((point1.x - point2.x)**2 + (point1.y - point2.y)**2);
}
