const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'public', 'assets', 'shapes');
fs.mkdirSync(dir, { recursive: true });

const shapes = {
  circle: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="0" cy="0" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  hline: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="-40" y1="0" x2="40" y2="0" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  vline: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="-40" x2="0" y2="40" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dline1: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="-30" y1="30" x2="30" y2="-30" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dline2: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="-30" y1="-30" x2="30" y2="30" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  square: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="-35" y="-35" width="70" height="70" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  rect_h: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="-40" y="-20" width="80" height="40" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  rect_v: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="-20" y="-40" width="40" height="80" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  triangle: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-40 40,30 -40,30" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  gt: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polyline points="-20,-35 20,0 -20,35" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lt: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polyline points="20,-35 -20,0 20,35" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

for (const [name, content] of Object.entries(shapes)) {
  fs.writeFileSync(path.join(dir, name + '.svg'), content);
}
console.log('SVGs generated inside client/public/assets/shapes/');
