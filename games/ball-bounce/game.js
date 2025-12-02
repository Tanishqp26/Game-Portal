// Simple Ball Bounce game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to match CSS size (responsive)
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(rect.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// Controls
const gravInput = document.getElementById('grav');
const bounceInput = document.getElementById('bounce');
const clearBtn = document.getElementById('clearBtn');

let gravity = parseFloat(gravInput.value); // pixels per frame^2
let bounceFactor = parseFloat(bounceInput.value);
gravInput.addEventListener('input', ()=> gravity = parseFloat(gravInput.value));
bounceInput.addEventListener('input', ()=> bounceFactor = parseFloat(bounceInput.value));
clearBtn.addEventListener('click', ()=> { balls.length = 0; });

// Ball array
const balls = [];
let paused = false;

// Ball factory
function addBall(x, y) {
  const r = 12 + Math.random() * 18;
  const speed = 2 + Math.random() * 3;
  const angle = Math.random() * Math.PI * 2;
  const color = `hsl(${Math.floor(Math.random()*360)} 80% 60%)`;
  balls.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    color,
    mass: r * 0.1
  });
}

// Add ball on click (use CSS coords)
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left);
  const cy = (e.clientY - rect.top);
  addBall(cx, cy);
});

// Space to pause/resume
window.addEventListener('keydown', (e)=> {
  if (e.code === 'Space') { paused = !paused; e.preventDefault(); }
});

// Basic physics update (walls + ball-ball simple resolution)
function update(dt) {
  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;
  // integrate
  for (let i=0;i<balls.length;i++){
    const b = balls[i];
    b.vy += gravity * dt;
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;

    // walls
    if (b.x - b.r < 0) { b.x = b.r; b.vx = -b.vx * bounceFactor; }
    if (b.x + b.r > w) { b.x = w - b.r; b.vx = -b.vx * bounceFactor; }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = -b.vy * bounceFactor; }
    if (b.y + b.r > h) { b.y = h - b.r; b.vy = -b.vy * bounceFactor; }

    // slight damping to avoid infinite bouncing
    b.vx *= 0.999;
    b.vy *= 0.999;
  }

  // simple collision resolution (O(n^2) but fine for small counts)
  for (let i=0;i<balls.length;i++){
    for (let j=i+1;j<balls.length;j++){
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minD = a.r + b.r;
      if (dist > 0 && dist < minD) {
        // push them apart
        const overlap = 0.5 * (minD - dist);
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // exchange velocity (elastic-ish)
        const kx = (a.vx - b.vx);
        const ky = (a.vy - b.vy);
        const p = 2 * (nx * kx + ny * ky) / (a.mass + b.mass);
        a.vx = a.vx - p * b.mass * nx * bounceFactor;
        a.vy = a.vy - p * b.mass * ny * bounceFactor;
        b.vx = b.vx + p * a.mass * nx * bounceFactor;
        b.vy = b.vy + p * a.mass * ny * bounceFactor;
      }
    }
  }
}

function draw() {
  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;
  ctx.clearRect(0,0,w,h);

  // background grid
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#ffffff';
  for (let x=0;x<w;x+=40) ctx.fillRect(x, h-1, 1, 1);
  ctx.restore();

  for (const b of balls) {
    ctx.beginPath();
    ctx.fillStyle = b.color;
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();

    // simple highlight
    ctx.beginPath();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.arc(b.x - b.r*0.35, b.y - b.r*0.45, b.r*0.45, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// add one ball to start
addBall(120, 80);
addBall(220, 40);
addBall(320, 120);

// game loop
let last = performance.now();
function loop(now){
  const dt = Math.min(0.04, (now - last)/1000);
  last = now;
  if (!paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
