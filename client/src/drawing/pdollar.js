export function Point(x, y, id) {
  this.X = x;
  this.Y = y;
  this.ID = id;
}

const NumPoints = 16;

export class PDollarRecognizer {
  constructor() {
    this.PointClouds = [];
  }

  Recognize(points, templates) {
    let t0 = Date.now();
    points = Resample(points, NumPoints);
    points = Scale(points);
    points = TranslateTo(points, Centroid(points));

    let b = +Infinity;
    let u = -1;
    for (let i = 0; i < templates.length; i++) {
      let d = GreedyCloudMatch(points, templates[i]);
      if (d < b) {
        b = d;
        u = i;
      }
    }
    let score = (b === +Infinity) ? 0.0 : Math.max((2.0 - b) / 2.0, 0.0);
    return u === -1 ? null : { Name: templates[u].Name, Score: score, Time: Date.now() - t0 };
  }

  AddGesture(name, points) {
    points = Resample(points, NumPoints);
    points = Scale(points);
    points = TranslateTo(points, Centroid(points));
    this.PointClouds.push({ Name: name, Points: points });
  }
}

// ----------------- Helper functions -----------------

function Resample(points, n) {
  if (points.length === 0) return [];
  let I = PathLength(points) / (n - 1);
  let D = 0.0;
  let newpoints = [new Point(points[0].X, points[0].Y, points[0].ID)];
  for (let i = 1; i < points.length; i++) {
    if (points[i].ID === points[i - 1].ID) {
      let d = Distance(points[i - 1], points[i]);
      if ((D + d) >= I) {
        let qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
        let qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
        let q = new Point(qx, qy, points[i].ID);
        newpoints.push(q);
        points.splice(i, 0, q); // insert q so it is the next point evaluated
        D = 0.0;
      } else {
        D += d;
      }
    }
  }
  // sometimes we fall a rounding-error short of adding the last point
  if (newpoints.length === n - 1) {
    newpoints.push(new Point(points[points.length - 1].X, points[points.length - 1].Y, points[points.length - 1].ID));
  }
  return newpoints;
}

function Scale(points) {
  let minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    minX = Math.min(minX, points[i].X);
    minY = Math.min(minY, points[i].Y);
    maxX = Math.max(maxX, points[i].X);
    maxY = Math.max(maxY, points[i].Y);
  }
  let size = Math.max(maxX - minX, maxY - minY);
  if (size === 0) return points; // avoid div by 0
  let newpoints = [];
  for (let i = 0; i < points.length; i++) {
    let qx = (points[i].X - minX) / size;
    let qy = (points[i].Y - minY) / size;
    newpoints.push(new Point(qx, qy, points[i].ID));
  }
  return newpoints;
}

function TranslateTo(points, pt) {
  let c = Centroid(points);
  let newpoints = [];
  for (let i = 0; i < points.length; i++) {
    let qx = points[i].X + pt.X - c.X;
    let qy = points[i].Y + pt.Y - c.Y;
    newpoints.push(new Point(qx, qy, points[i].ID));
  }
  return newpoints;
}

function Centroid(points) {
  let x = 0.0, y = 0.0;
  for (let i = 0; i < points.length; i++) {
    x += points[i].X;
    y += points[i].Y;
  }
  x /= points.length;
  y /= points.length;
  return new Point(x, y, 0);
}

function PathLength(points) {
  let d = 0.0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].ID === points[i - 1].ID) {
      d += Distance(points[i - 1], points[i]);
    }
  }
  return d;
}

function Distance(p1, p2) {
  let dx = p2.X - p1.X;
  let dy = p2.Y - p1.Y;
  return Math.sqrt(dx * dx + dy * dy);
}

function GreedyCloudMatch(pts1, template) {
  let pts2 = template.Points;
  let e = 0.50;
  let step = Math.max(1, Math.floor(Math.pow(pts1.length, 1.0 - e)));
  let min = +Infinity;
  for (let i = 0; i < pts1.length; i += step) {
    let d1 = CloudDistance(pts1, pts2, i, min);
    if (d1 < min) min = d1;
    let d2 = CloudDistance(pts2, pts1, i, min);
    if (d2 < min) min = d2;
  }
  return min;
}

function CloudDistance(pts1, pts2, start, bestSoFar) {
  let matched = new Array(pts1.length).fill(false);
  let sum = 0;
  let i = start;
  do {
    let index = -1;
    let min = +Infinity;
    for (let j = 0; j < matched.length; j++) {
      if (!matched[j]) {
        let d = Distance(pts1[i], pts2[j]);
        if (d < min) {
          min = d;
          index = j;
        }
      }
    }
    matched[index] = true;
    let weight = 1 - ((i - start + pts1.length) % pts1.length) / pts1.length;
    sum += weight * min;
    if (sum >= bestSoFar) return sum; // Early exit
    i = (i + 1) % pts1.length;
  } while (i !== start);
  return sum;
}

