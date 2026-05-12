import { Point } from './pdollar'

export const rawTemplates = {
  circle: [
    new Point(100.0, 50.0, 1), new Point(99.2, 58.7, 1), new Point(97.0, 67.1, 1), new Point(93.3, 75.0, 1), new Point(88.3, 82.1, 1), new Point(82.1, 88.3, 1), new Point(75.0, 93.3, 1), new Point(67.1, 97.0, 1), new Point(58.7, 99.2, 1), new Point(50.0, 100.0, 1), new Point(41.3, 99.2, 1), new Point(32.9, 97.0, 1), new Point(25.0, 93.3, 1), new Point(17.9, 88.3, 1), new Point(11.7, 82.1, 1), new Point(6.7, 75.0, 1), new Point(3.0, 67.1, 1), new Point(0.8, 58.7, 1), new Point(0.0, 50.0, 1), new Point(0.8, 41.3, 1), new Point(3.0, 32.9, 1), new Point(6.7, 25.0, 1), new Point(11.7, 17.9, 1), new Point(17.9, 11.7, 1), new Point(25.0, 6.7, 1), new Point(32.9, 3.0, 1), new Point(41.3, 0.8, 1), new Point(50.0, 0.0, 1), new Point(58.7, 0.8, 1), new Point(67.1, 3.0, 1), new Point(75.0, 6.7, 1), new Point(82.1, 11.7, 1), new Point(88.3, 17.9, 1), new Point(93.3, 25.0, 1), new Point(97.0, 32.9, 1), new Point(99.2, 41.3, 1), new Point(100.0, 50.0, 1)
  ],
  hline: [
    new Point(0, 50, 1), new Point(25, 50, 1), new Point(50, 50, 1), new Point(75, 50, 1), new Point(100, 50, 1)
  ],
  vline: [
    new Point(50, 0, 1), new Point(50, 25, 1), new Point(50, 50, 1), new Point(50, 75, 1), new Point(50, 100, 1)
  ],
  dline1: [ // diagonal /
    new Point(0, 100, 1), new Point(25, 75, 1), new Point(50, 50, 1), new Point(75, 25, 1), new Point(100, 0, 1)
  ],
  dline2: [ // diagonal \
    new Point(0, 0, 1), new Point(25, 25, 1), new Point(50, 50, 1), new Point(75, 75, 1), new Point(100, 100, 1)
  ],
  square: [
    new Point(0, 0, 1), new Point(100, 0, 1), new Point(100, 100, 1), new Point(0, 100, 1), new Point(0, 0, 1)
  ],
  rect_h: [
    new Point(0, 25, 1), new Point(100, 25, 1), new Point(100, 75, 1), new Point(0, 75, 1), new Point(0, 25, 1)
  ],
  rect_v: [
    new Point(25, 0, 1), new Point(75, 0, 1), new Point(75, 100, 1), new Point(25, 100, 1), new Point(25, 0, 1)
  ],
  triangle: [
    new Point(50, 0, 1), new Point(100, 100, 1), new Point(0, 100, 1), new Point(50, 0, 1)
  ],
  gt: [ // >
    new Point(25, 0, 1), new Point(75, 50, 1), new Point(25, 100, 1)
  ],
  lt: [ // <
    new Point(75, 0, 1), new Point(25, 50, 1), new Point(75, 100, 1)
  ]
};

export const templates = [];
for (let name in rawTemplates) {
  templates.push({ Name: name, Points: rawTemplates[name] });
}
