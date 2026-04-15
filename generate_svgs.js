const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'public', 'assets', 'shapes');
fs.mkdirSync(dir, { recursive: true });

const shapes = {
  // BÁSICAS
  circle: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="0" cy="0" r="40" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  square: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="-35" y="-35" width="70" height="70" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  triangle: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-40 40,30 -40,30" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  rectangle: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="-40" y="-25" width="80" height="50" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,

  // INTERMEDIAS
  star: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-45 11,-14 43,-14 17,5 27,36 0,17 -27,36 -17,5 -43,-14 -11,-14" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  heart: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0,15 A15,15 0 0,0 -30,-10 A15,15 0 0,1 0,-10 A15,15 0 0,1 30,-10 A15,15 0 0,0 0,15 Z" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  diamond: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-40 30,0 0,40 -30,0" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  arrow: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-40 20,-10 10,-10 10,40 -10,40 -10,-10 -20,-10" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,

  // AVANZADAS
  lightning: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="-10,-40 -20,0 10,0 0,40 20,5 -10,5" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  moon: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 10,-35 A 40,40 0 1,0 10,35 A 30,30 0 1,1 10,-35 Z" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  spiral: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0,0 C20,0 20,20 0,20 C-30,20 -30,-20 0,-20 C40,-20 40,40 0,40" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  cross: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="-10,-40 10,-40 10,-10 40,-10 40,10 10,10 10,40 -10,40 -10,10 -40,10 -40,-10 -10,-10" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
  hexagon: `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" stroke="currentColor" stroke-width="8" fill="none"/></svg>`,
};

for (const [name, content] of Object.entries(shapes)) {
  fs.writeFileSync(path.join(dir, name + '.svg'), content);
}
console.log('SVGs generated inside client/public/assets/shapes/');
