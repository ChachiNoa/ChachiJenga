import { Point } from './pdollar'

export const rawTemplates = {
  square: [
    new Point(0.0, 0.0, 1), new Point(100.0, 0.0, 1), new Point(100.0, 100.0, 1), new Point(0.0, 100.0, 1), new Point(0.0, 0.0, 1)
  ],
  triangle: [
    new Point(50.0, 0.0, 1), new Point(100.0, 100.0, 1), new Point(0.0, 100.0, 1), new Point(50.0, 0.0, 1)
  ],
  circle: [
    new Point(100.0, 50.0, 1), new Point(99.2, 58.7, 1), new Point(97.0, 67.1, 1), new Point(93.3, 75.0, 1), new Point(88.3, 82.1, 1), new Point(82.1, 88.3, 1), new Point(75.0, 93.3, 1), new Point(67.1, 97.0, 1), new Point(58.7, 99.2, 1), new Point(50.0, 100.0, 1), new Point(41.3, 99.2, 1), new Point(32.9, 97.0, 1), new Point(25.0, 93.3, 1), new Point(17.9, 88.3, 1), new Point(11.7, 82.1, 1), new Point(6.7, 75.0, 1), new Point(3.0, 67.1, 1), new Point(0.8, 58.7, 1), new Point(0.0, 50.0, 1), new Point(0.8, 41.3, 1), new Point(3.0, 32.9, 1), new Point(6.7, 25.0, 1), new Point(11.7, 17.9, 1), new Point(17.9, 11.7, 1), new Point(25.0, 6.7, 1), new Point(32.9, 3.0, 1), new Point(41.3, 0.8, 1), new Point(50.0, 0.0, 1), new Point(58.7, 0.8, 1), new Point(67.1, 3.0, 1), new Point(75.0, 6.7, 1), new Point(82.1, 11.7, 1), new Point(88.3, 17.9, 1), new Point(93.3, 25.0, 1), new Point(97.0, 32.9, 1), new Point(99.2, 41.3, 1), new Point(100.0, 50.0, 1)
  ],
  rectangle: [
    new Point(0.0, 0.0, 1), new Point(150.0, 0.0, 1), new Point(150.0, 70.0, 1), new Point(0.0, 70.0, 1), new Point(0.0, 0.0, 1)
  ],
  star: [
    new Point(50.0, 0.0, 1), new Point(60.0, 35.0, 1), new Point(100.0, 35.0, 1), new Point(70.0, 55.0, 1), new Point(80.0, 95.0, 1), new Point(50.0, 75.0, 1), new Point(20.0, 95.0, 1), new Point(30.0, 55.0, 1), new Point(0.0, 35.0, 1), new Point(40.0, 35.0, 1), new Point(50.0, 0.0, 1)
  ],
  heart: [
    new Point(50.0, 35.0, 1), new Point(50.3, 33.2, 1), new Point(51.9, 28.4, 1), new Point(56.0, 22.2, 1), new Point(62.7, 16.9, 1), new Point(71.6, 14.3, 1), new Point(81.2, 15.5, 1), new Point(89.8, 20.5, 1), new Point(95.8, 28.4, 1), new Point(98.0, 38.0, 1), new Point(95.8, 48.0, 1), new Point(89.8, 57.6, 1), new Point(81.2, 66.5, 1), new Point(71.6, 74.8, 1), new Point(62.7, 82.7, 1), new Point(56.0, 89.8, 1), new Point(51.9, 95.7, 1), new Point(50.3, 99.6, 1), new Point(50.0, 101.0, 1), new Point(49.7, 99.6, 1), new Point(48.1, 95.7, 1), new Point(44.0, 89.8, 1), new Point(37.3, 82.7, 1), new Point(28.4, 74.8, 1), new Point(18.8, 66.5, 1), new Point(10.2, 57.6, 1), new Point(4.2, 48.0, 1), new Point(2.0, 38.0, 1), new Point(4.2, 28.4, 1), new Point(10.2, 20.5, 1), new Point(18.8, 15.5, 1), new Point(28.4, 14.3, 1), new Point(37.3, 16.9, 1), new Point(44.0, 22.2, 1), new Point(48.1, 28.4, 1), new Point(49.7, 33.2, 1), new Point(50.0, 35.0, 1)
  ],
  diamond: [
    new Point(50.0, 0.0, 1), new Point(100.0, 50.0, 1), new Point(50.0, 100.0, 1), new Point(0.0, 50.0, 1), new Point(50.0, 0.0, 1)
  ],
  arrow: [
    new Point(0,50,1), new Point(100,50,1),
    new Point(70,20,2), new Point(100,50,2), new Point(70,80,2)
  ],
  lightning: [
    new Point(50.0, 0.0, 1), new Point(0.0, 50.0, 1), new Point(40.0, 50.0, 1), new Point(20.0, 100.0, 1), new Point(80.0, 30.0, 1), new Point(40.0, 30.0, 1), new Point(50.0, 0.0, 1)
  ],
  moon: [
    new Point(50.0, 0.0, 1), new Point(58.7, 0.8, 1), new Point(67.1, 3.0, 1), new Point(75.0, 6.7, 1), new Point(82.1, 11.7, 1), new Point(88.3, 17.9, 1), new Point(93.3, 25.0, 1), new Point(97.0, 32.9, 1), new Point(99.2, 41.3, 1), new Point(100.0, 50.0, 1), new Point(99.2, 58.7, 1), new Point(97.0, 67.1, 1), new Point(93.3, 75.0, 1), new Point(88.3, 82.1, 1), new Point(82.1, 88.3, 1), new Point(75.0, 93.3, 1), new Point(67.1, 97.0, 1), new Point(58.7, 99.2, 1), new Point(50.0, 100.0, 1), new Point(20.0, 100.0, 1), new Point(32.2, 99.2, 1), new Point(43.9, 97.0, 1), new Point(55.0, 93.3, 1), new Point(65.0, 88.3, 1), new Point(73.6, 82.1, 1), new Point(80.6, 75.0, 1), new Point(85.8, 67.1, 1), new Point(88.9, 58.7, 1), new Point(90.0, 50.0, 1), new Point(88.9, 41.3, 1), new Point(85.8, 32.9, 1), new Point(80.6, 25.0, 1), new Point(73.6, 17.9, 1), new Point(65.0, 11.7, 1), new Point(55.0, 6.7, 1), new Point(43.9, 3.0, 1), new Point(32.2, 0.8, 1), new Point(20.0, 0.0, 1)
  ],
  spiral: [
    new Point(50.0, 50.0, 1), new Point(51.0, 50.2, 1), new Point(51.9, 50.7, 1), new Point(52.6, 51.5, 1), new Point(53.1, 52.6, 1), new Point(53.2, 53.8, 1), new Point(53.0, 55.2, 1), new Point(52.4, 56.6, 1), new Point(51.4, 57.9, 1), new Point(50.0, 59.0, 1), new Point(48.3, 59.8, 1), new Point(46.2, 60.3, 1), new Point(44.0, 60.4, 1), new Point(41.6, 60.0, 1), new Point(39.3, 59.0, 1), new Point(37.0, 57.5, 1), new Point(35.0, 55.5, 1), new Point(33.3, 53.0, 1), new Point(32.0, 50.0, 1), new Point(31.3, 46.7, 1), new Point(31.2, 43.2, 1), new Point(31.8, 39.5, 1), new Point(33.1, 35.9, 1), new Point(35.2, 32.4, 1), new Point(38.0, 29.2, 1), new Point(41.4, 26.5, 1), new Point(45.5, 24.4, 1), new Point(50.0, 23.0, 1), new Point(54.9, 22.4, 1), new Point(59.9, 22.7, 1), new Point(65.0, 24.0, 1), new Point(69.9, 26.3, 1), new Point(74.5, 29.4, 1), new Point(78.6, 33.5, 1), new Point(81.9, 38.4, 1), new Point(84.5, 43.9, 1), new Point(86.0, 50.0, 1), new Point(86.4, 56.4, 1), new Point(85.7, 63.0, 1), new Point(83.8, 69.5, 1), new Point(80.6, 75.7, 1), new Point(76.4, 81.4, 1), new Point(71.0, 86.4, 1), new Point(64.7, 90.4, 1), new Point(57.6, 93.3, 1), new Point(50.0, 95.0, 1), new Point(42.0, 95.3, 1), new Point(33.9, 94.2, 1), new Point(26.0, 91.6, 1), new Point(18.5, 87.5, 1), new Point(11.7, 82.1, 1), new Point(5.8, 75.5, 1), new Point(1.1, 67.8, 1), new Point(-2.2, 59.2, 1), new Point(-4.0, 50.0, 1), new Point(-4.2, 40.4, 1), new Point(-2.6, 30.8, 1), new Point(0.6, 21.5, 1), new Point(5.6, 12.7, 1), new Point(12.1, 4.8, 1), new Point(20.0, -2.0, 1), new Point(29.1, -7.3, 1), new Point(39.2, -11.1, 1), new Point(50.0, -13.0, 1), new Point(61.1, -13.0, 1), new Point(72.2, -11.1, 1), new Point(83.0, -7.2, 1), new Point(93.1, -1.3, 1), new Point(102.1, 6.3, 1), new Point(109.8, 15.5, 1), new Point(115.8, 26.1, 1), new Point(119.9, 37.7, 1), new Point(122.0, 50.0, 1)
  ],
  cross: [
    new Point(50,0,1), new Point(50,100,1),
    new Point(0,50,2), new Point(100,50,2)
  ],
  hexagon: [
    new Point(25.0, 0.0, 1), new Point(75.0, 0.0, 1), new Point(100.0, 50.0, 1), new Point(75.0, 100.0, 1), new Point(25.0, 100.0, 1), new Point(0.0, 50.0, 1), new Point(25.0, 0.0, 1)
  ],
};

export const templates = [];
for (let name in rawTemplates) {
  templates.push({ Name: name, Points: rawTemplates[name] });
}

