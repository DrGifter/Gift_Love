// Optimized settings for smooth performance
const settings = {
  particles: {
    length: 300, // Reduced from 800 for better performance
    duration: 2.5, // Slightly reduced duration
    velocity: 100, // Reduced velocity for smoother motion
    effect: -0.6, // Less aggressive effect
    size: 28, // Smaller size for better performance
  },
  modes: {
    rainbow: { colors: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d9de0', '#9b59b6', '#ff8a65'] },
    romantic: { colors: ['#ff1744', '#e91e63', '#ff4081', '#f8bbd9', '#ffcdd2'] },
    sunset: { colors: ['#ff7043', '#ff5722', '#ffab40', '#ffc107', '#ff8f00'] },
    ocean: { colors: ['#00bcd4', '#0097a7', '#26c6da', '#4fc3f7', '#29b6f6'] },
    galaxy: { colors: ['#673ab7', '#9c27b0', '#e91e63', '#3f51b5', '#8bc34a'] }
  }
};

let currentSettings = { ...settings };
let currentColorMode = 'rainbow';
let currentSpeedMode = 1;
let currentSizeMode = 1;
let isPaused = false;
let animationId;

// Utility functions
function getRandomColor(mode = currentColorMode) {
  const colors = settings.modes[mode].colors;
  return colors[Math.floor(Math.random() * colors.length)];
}

// Enhanced Point class
class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Point(this.x, this.y);
  }

  length(length) {
    if (typeof length === 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  }

  normalize() {
    const length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  }
}

// Enhanced Particle class with multiple effects
class Particle {
  constructor() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
    this.color = getRandomColor();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.scale = 0.5 + Math.random() * 0.5;
    this.glowIntensity = Math.random();
  }

  initialize(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * currentSettings.particles.effect;
    this.acceleration.y = dy * currentSettings.particles.effect;
    this.age = 0;
    this.color = getRandomColor();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.scale = 0.5 + Math.random() * 0.5;
  }

  update(deltaTime) {
    this.position.x += this.velocity.x * deltaTime * currentSpeedMode;
    this.position.y += this.velocity.y * deltaTime * currentSpeedMode;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
    this.rotation += this.rotationSpeed;
  }

  draw(context, image) {
    const ease = t => (--t) * t * t + 1;
    const progress = this.age / currentSettings.particles.duration;
    const size = image.width * ease(progress) * this.scale * currentSizeMode;
    const alpha = 1 - progress;

    context.save();
    context.globalAlpha = alpha;
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);

    // Add glow effect
    context.shadowBlur = 20 * this.glowIntensity;
    context.shadowColor = this.color;

    // Draw heart with color
    context.fillStyle = this.color;
    context.beginPath();
    this.drawHeart(context, size);
    context.fill();

    context.restore();
  }

  drawHeart(context, size) {
    const scale = size / 100;
    context.beginPath();
    context.moveTo(0, -30 * scale);
    context.bezierCurveTo(-50 * scale, -80 * scale, -90 * scale, -10 * scale, 0, 30 * scale);
    context.bezierCurveTo(90 * scale, -10 * scale, 50 * scale, -80 * scale, 0, -30 * scale);
    context.closePath();
  }
}

// Enhanced ParticlePool
class ParticlePool {
  constructor(length) {
    this.particles = [];
    for (let i = 0; i < length; i++) {
      this.particles[i] = new Particle();
    }
    this.firstActive = 0;
    this.firstFree = 0;
    this.duration = currentSettings.particles.duration;
  }

  add(x, y, dx, dy) {
    this.particles[this.firstFree].initialize(x, y, dx, dy);
    this.firstFree++;
    if (this.firstFree === this.particles.length) this.firstFree = 0;
    if (this.firstActive === this.firstFree) this.firstActive++;
    if (this.firstActive === this.particles.length) this.firstActive = 0;
  }

  update(deltaTime) {
    let i;
    // Update active particles
    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
        this.particles[i].update(deltaTime);
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
        this.particles[i].update(deltaTime);
      for (i = 0; i < this.firstFree; i++)
        this.particles[i].update(deltaTime);
    }

    // Remove inactive particles
    while (this.particles[this.firstActive].age >= this.duration && this.firstActive !== this.firstFree) {
      this.firstActive++;
      if (this.firstActive === this.particles.length) this.firstActive = 0;
    }
  }

  draw(context, image) {
    let i;
    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
        this.particles[i].draw(context, image);
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
        this.particles[i].draw(context, image);
      for (i = 0; i < this.firstFree; i++)
        this.particles[i].draw(context, image);
    }
  }

  getActiveCount() {
    if (this.firstActive <= this.firstFree) {
      return this.firstFree - this.firstActive;
    }
    return this.particles.length - this.firstActive + this.firstFree;
  }
}

// Main animation setup
const canvas = document.getElementById('heartCanvas');
const context = canvas.getContext('2d');
let particles;
let particleRate;
let time;
let frameCount = 0;
let lastFpsUpdate = 0;

function pointOnHeart(t) {
  return new Point(
    160 * Math.pow(Math.sin(t), 3),
    130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
  );
}

// Create heart image
function createHeartImage() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = currentSettings.particles.size;
  canvas.height = currentSettings.particles.size;

  function to(t) {
    const point = pointOnHeart(t);
    point.x = currentSettings.particles.size / 2 + point.x * currentSettings.particles.size / 350;
    point.y = currentSettings.particles.size / 2 - point.y * currentSettings.particles.size / 350;
    return point;
  }

  context.beginPath();
  let t = -Math.PI;
  let point = to(t);
  context.moveTo(point.x, point.y);
  while (t < Math.PI) {
    t += 0.01;
    point = to(t);
    context.lineTo(point.x, point.y);
  }
  context.closePath();
  context.fillStyle = '#ff30c5';
  context.fill();

  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

let heartImage = createHeartImage();

function init() {
  particles = new ParticlePool(currentSettings.particles.length);
  particleRate = currentSettings.particles.length / currentSettings.particles.duration;
  time = new Date().getTime() / 1000;
}

function render() {
  if (!isPaused) {
    animationId = requestAnimationFrame(render);
  }

  const newTime = new Date().getTime() / 1000;
  const deltaTime = newTime - (time || newTime);
  time = newTime;

  // Clear canvas with trail effect
  context.fillStyle = 'rgba(0, 0, 0, 0.05)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Create new particles
  const amount = particleRate * deltaTime;
  for (let i = 0; i < amount; i++) {
    const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
    const dir = pos.clone().length(currentSettings.particles.velocity);
    particles.add(
      canvas.width / 2 + pos.x,
      canvas.height / 2 - pos.y,
      dir.x,
      -dir.y
    );
  }

  particles.update(deltaTime);
  particles.draw(context, heartImage);

  // Update stats
  frameCount++;
  if (newTime - lastFpsUpdate > 1) {
    document.getElementById('fps').textContent = frameCount;
    document.getElementById('particleCount').textContent = particles.getActiveCount();
    frameCount = 0;
    lastFpsUpdate = newTime;
  }
}

function onResize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Control handlers
document.getElementById('colorBtn').addEventListener('click', function () {
  const modes = Object.keys(settings.modes);
  const currentIndex = modes.indexOf(currentColorMode);
  currentColorMode = modes[(currentIndex + 1) % modes.length];
  document.getElementById('currentMode').textContent = currentColorMode.charAt(0).toUpperCase() + currentColorMode.slice(1);
  updateActiveButton(this);
});

document.getElementById('speedBtn').addEventListener('click', function () {
  currentSpeedMode = currentSpeedMode === 1 ? 2 : currentSpeedMode === 2 ? 0.5 : 1;
  this.textContent = currentSpeedMode === 2 ? '⚡ Fast' : currentSpeedMode === 0.5 ? '🐌 Slow' : '⚡ Speed';
  updateActiveButton(this);
});

document.getElementById('sizeBtn').addEventListener('click', function () {
  currentSizeMode = currentSizeMode === 1 ? 1.5 : currentSizeMode === 1.5 ? 0.7 : 1;
  this.textContent = currentSizeMode === 1.5 ? '📏 Large' : currentSizeMode === 0.7 ? '📏 Small' : '📏 Size';
  updateActiveButton(this);
});

document.getElementById('pauseBtn').addEventListener('click', function () {
  isPaused = !isPaused;
  this.textContent = isPaused ? '▶️ Play' : '⏸️ Pause';
  if (!isPaused) {
    time = new Date().getTime() / 1000;
    render();
  }
  updateActiveButton(this);
});

document.getElementById('resetBtn').addEventListener('click', function () {
  currentColorMode = 'rainbow';
  currentSpeedMode = 1;
  currentSizeMode = 1;
  isPaused = false;

  // Reset button texts
  document.getElementById('colorBtn').textContent = '🌈 Color Mode';
  document.getElementById('speedBtn').textContent = '⚡ Speed';
  document.getElementById('sizeBtn').textContent = '📏 Size';
  document.getElementById('pauseBtn').textContent = '⏸️ Pause';
  document.getElementById('currentMode').textContent = 'Rainbow';

  // Reset active states
  document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('colorBtn').classList.add('active');

  init();
  if (!isPaused) render();
});

function updateActiveButton(clickedBtn) {
  document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
  clickedBtn.classList.add('active');
}

// Initialize
window.addEventListener('resize', onResize);
onResize();
init();

setTimeout(() => {
  render();
}, 100);

document.getElementById('musicBtn').addEventListener('click', function () {
  const music = document.getElementById('bgMusic');
  if (music.paused) {
    music.play();
    this.textContent = '🔇 Mute';
  } else {
    music.pause();
    this.textContent = '🎵 Music';
  }
  updateActiveButton(this);
});