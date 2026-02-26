const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-val');
const livesEl = document.getElementById('lives-val');
const levelEl = document.getElementById('level-val');
const startScreen = document.getElementById('start-screen');
const uiLayer = document.getElementById('ui-layer');
const gameOverScreen = document.getElementById('game-over-screen');
const levelScreen = document.getElementById('level-screen');
const finalScoreEl = document.getElementById('final-score');
const dialogueContainer = document.getElementById('dialogue-container');
const dialogueName = document.getElementById('dialogue-name');
const dialogueText = document.getElementById('dialogue-text');
const portraitCanvas = document.getElementById('portrait-canvas');
const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const portraitCtx = portraitCanvas.getContext('2d');
portraitCtx.imageSmoothingEnabled = false;

const cdUI = {
    1: { el: document.getElementById('cd-1'), parent: document.getElementById('ability-1') },
    2: { el: document.getElementById('cd-2'), parent: document.getElementById('ability-2') },
    3: { el: document.getElementById('cd-3'), parent: document.getElementById('ability-3') },
    4: { el: document.getElementById('cd-4'), parent: document.getElementById('ability-4') },
    5: { el: document.getElementById('cd-5'), parent: document.getElementById('ability-5') },
};

// Initial setup to avoid blurry canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    try {
        if (typeof player !== 'undefined' && player) {
            // Keep player in bounds on resize and anchored to bottom
            player.y = canvas.height - player.height - 40;
            player.x = Math.min(player.x, canvas.width - player.width);
        }
    } catch (e) { }
}


// Audio Context Generation (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Helper to create a simple osc+gain pair
    function makeOsc(waveform, startFreq) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = waveform;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        return { osc, gain };
    }

    if (type === 'shoot') {
        let { osc, gain } = makeOsc('square', 440);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hit') {
        let { osc, gain } = makeOsc('sawtooth', 150);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'powerup') {
        let { osc, gain } = makeOsc('square', 400);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'die') {
        let { osc, gain } = makeOsc('sawtooth', 200);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
    // --- ABILITY SOUNDS ---
    else if (type === 'railgun') {
        // Harsh descending laser zap
        let { osc, gain } = makeOsc('sawtooth', 2000);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        // layered noise burst
        let { osc: o2, gain: g2 } = makeOsc('square', 1200);
        o2.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        g2.gain.setValueAtTime(0.08, now);
        g2.gain.linearRampToValueAtTime(0.001, now + 0.35);
        o2.start(now); o2.stop(now + 0.35);
    }
    else if (type === 'time_freeze') {
        // Eerie warbling descend
        let { osc, gain } = makeOsc('sine', 800);
        osc.frequency.setValueAtTime(600, now + 0.15);
        osc.frequency.setValueAtTime(900, now + 0.3);
        osc.frequency.setValueAtTime(400, now + 0.5);
        osc.frequency.setValueAtTime(200, now + 0.7);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
    }
    else if (type === 'emp') {
        // Deep electric crackle
        let { osc, gain } = makeOsc('sawtooth', 100);
        osc.frequency.setValueAtTime(800, now + 0.05);
        osc.frequency.setValueAtTime(50, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
    }
    else if (type === 'invincible') {
        // Ascending triumphant chime
        let { osc, gain } = makeOsc('square', 300);
        osc.frequency.setValueAtTime(450, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);
        osc.frequency.setValueAtTime(900, now + 0.3);
        osc.frequency.setValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
    else if (type === 'nuke') {
        // Deep rumbling explosion
        let { osc, gain } = makeOsc('sawtooth', 60);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.0);
        osc.start(now); osc.stop(now + 1.0);
        // high crackle layer
        let { osc: o2, gain: g2 } = makeOsc('square', 800);
        o2.frequency.exponentialRampToValueAtTime(40, now + 0.6);
        g2.gain.setValueAtTime(0.1, now);
        g2.gain.linearRampToValueAtTime(0.001, now + 0.7);
        o2.start(now); o2.stop(now + 0.7);
    }
    else if (type === 'boss_hit') {
        // Chunky impact
        let { osc, gain } = makeOsc('square', 300);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }
    else if (type === 'boss_enrage') {
        // Dramatic low roar with rising pitch
        let { osc, gain } = makeOsc('sawtooth', 50);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.2);
        osc.start(now); osc.stop(now + 1.2);
        let { osc: o2, gain: g2 } = makeOsc('square', 80);
        o2.frequency.exponentialRampToValueAtTime(600, now + 1.0);
        g2.gain.setValueAtTime(0.1, now);
        g2.gain.linearRampToValueAtTime(0.001, now + 1.1);
        o2.start(now); o2.stop(now + 1.1);
    }
    else if (type === 'dialogue_blip') {
        // Soft retro text blip
        let { osc, gain } = makeOsc('square', 600);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    }
}

const STATE = { START: 0, PLAYING: 1, GAME_OVER: 2, NEXT_LEVEL: 3, BOSS_INTRO: 4, BOSS_FIGHT: 5, WIN: 6, PAUSE: 7 };
let currentState = STATE.START;
let savedState = null; // To remember if we were PLAYING or BOSS_FIGHT when paused

function togglePause() {
    if (currentState === STATE.PLAYING || currentState === STATE.BOSS_FIGHT) {
        savedState = currentState;
        currentState = STATE.PAUSE;
        pauseScreen.classList.remove('hidden');
        if (audioCtx.state === 'running') audioCtx.suspend();
    } else if (currentState === STATE.PAUSE) {
        currentState = savedState;
        savedState = null;
        pauseScreen.classList.add('hidden');
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
}

pauseBtn.addEventListener('click', togglePause);

const keys = { Left: false, Right: false, Up: false, Down: false, Space: false, 1: false, 2: false, 3: false, 4: false, 5: false, Enter: false };
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.Left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.Right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.Up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.Down = true;
    if (e.code === 'KeyQ') keys[1] = true;
    if (e.code === 'KeyE') keys[2] = true;
    if (e.code === 'KeyC') keys[3] = true;
    if (e.code === 'KeyX') keys[4] = true;
    if (e.code === 'KeyZ') keys[5] = true;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (e.code === 'Space') keys.Space = true;
        if (e.code === 'Enter' || e.code === 'NumpadEnter') keys.Enter = true;
        if (currentState === STATE.START || currentState === STATE.GAME_OVER || currentState === STATE.WIN) {
            document.getElementById('win-screen').classList.add('hidden');
            startGame();
        }
    }
    if (e.code === 'Escape') {
        togglePause();
    }
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.Left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.Right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.Up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.Down = false;
    if (e.code === 'KeyQ') keys[1] = false;
    if (e.code === 'KeyE') keys[2] = false;
    if (e.code === 'KeyC') keys[3] = false;
    if (e.code === 'KeyX') keys[4] = false;
    if (e.code === 'KeyZ') keys[5] = false;
    if (e.code === 'Space') keys.Space = false;
    if (e.code === 'Enter' || e.code === 'NumpadEnter') keys.Enter = false;
});

// --- PIXEL ART ENGINE ---
const PIXEL_SCALE = 4; // Scaled up slightly for modern resolutions

const PALETTE = {
    '.': 'transparent',
    '0': '#ffffff', // White
    '1': '#00ff00', // Green
    '2': '#00ffff', // Cyan
    '3': '#ff00ff', // Magenta
    '4': '#ff0000', // Red
    '5': '#ffff00', // Yellow
    '6': '#000000', // Black (eyes)
};

const SPRITE_DATA = {
    player: [
        "......1......",
        ".....111.....",
        "....11111....",
        "...1111111...",
        "..111111111..",
        ".11111111111.",
        "1111111111111",
        "111.......111"
    ],
    powerup_spread: [
        ".5.5.5.",
        "5555555",
        "5.555.5",
        "..555..",
        "...5..."
    ],
    powerup_rapid: [
        "...5...",
        "..55...",
        ".5555..",
        "...55..",
        "..55..."
    ],
    powerup_speed: [
        "...2...",
        "..222..",
        ".22222.",
        "22...22"
    ],
    powerup_life: [
        ".44.44.",
        "4444444",
        "4444444",
        ".44444.",
        "..444..",
        "...4..."
    ],
    powerup_shield: [
        ".22222.",
        "2.....2",
        "2.....2",
        ".2...2.",
        "..222.."
    ],
    squid_f1: [
        "...33...",
        "..3333..",
        ".333333.",
        "33633633",
        "33333333",
        "..3..3..",
        ".3.33.3.",
        "3......3"
    ],
    squid_f2: [
        "...33...",
        "..3333..",
        ".333333.",
        "33633633",
        "33333333",
        "...33...",
        "..3..3..",
        ".3....3."
    ],
    crab_f1: [
        "..2.....2..",
        "...2...2...",
        "..2222222..",
        ".226222622.",
        "22222222222",
        "2.2222222.2",
        "2.2.....2.2",
        "...22.22..."
    ],
    crab_f2: [
        "..2.....2..",
        "...2...2...",
        "..2222222..",
        ".226222622.",
        "22222222222",
        ".222222222.",
        "..2.....2..",
        ".2.......2."
    ],
    octopus_f1: [
        "....1111....",
        "...111111...",
        "..11111111..",
        ".1161111611.",
        "111111111111",
        "..111..111..",
        ".1..1..1..1.",
        "..11....11.."
    ],
    octopus_f2: [
        "....1111....",
        "...111111...",
        "..11111111..",
        ".1161111611.",
        "111111111111",
        "...1....1...",
        "..1.1..1.1..",
        "11........11"
    ],
    bullet_player: ["5", "5", "5", "5", "5"],
    bullet_alien_f1: ["4.", "4.", "44", ".4", ".4"],
    bullet_alien_f2: [".4", ".4", "44", "4.", "4."]
};

const SPRITES = {};
for (const [name, rows] of Object.entries(SPRITE_DATA)) {
    const w = rows[0].length;
    const h = rows.length;

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = w * PIXEL_SCALE;
    spriteCanvas.height = h * PIXEL_SCALE;
    const sCtx = spriteCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const char = rows[y][x];
            if (char !== '.') {
                sCtx.fillStyle = PALETTE[char];
                sCtx.fillRect(x * PIXEL_SCALE, y * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
            }
        }
    }
    SPRITES[name] = { canvas: spriteCanvas, width: spriteCanvas.width, height: spriteCanvas.height };
}


// --- ENTITIES ---

class Player {
    constructor() {
        this.sprite = SPRITES.player;
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 40;
        this.speed = 8; // Faster for widescreen
        this.powerups = { rapid: 0, spread: 0, speed: 0, shield: 0 };
        this.is2D = false;
        this.arenaBounds = null;
    }
    update(df) {
        let currentSpeed = this.speed + (this.powerups.speed * 3);
        if (keys.Left) this.x -= currentSpeed * df;
        if (keys.Right) this.x += currentSpeed * df;

        if (this.is2D) {
            if (keys.Up) this.y -= currentSpeed * df;
            if (keys.Down) this.y += currentSpeed * df;

            if (this.arenaBounds) {
                this.x = Math.max(this.arenaBounds.x, Math.min(this.arenaBounds.x + this.arenaBounds.w - this.width, this.x));
                this.y = Math.max(this.arenaBounds.y, Math.min(this.arenaBounds.y + this.arenaBounds.h - this.height, this.y));
            }
        } else {
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        }
    }
    draw(ctx) {
        if (invincibleDuration > 0) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.drawImage(this.sprite.canvas, this.x, this.y);
                ctx.globalAlpha = 1.0;
            } else {
                ctx.drawImage(this.sprite.canvas, this.x, this.y);
            }
        } else {
            ctx.drawImage(this.sprite.canvas, this.x, this.y);
        }

        if (this.powerups.shield > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.sprite = SPRITES[`powerup_${type}`];
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.speedY = 3 + Math.random() * 2;
        this.markedForDeletion = false;
        this.sinOffset = Math.random() * Math.PI * 2;
    }
    update(df) {
        this.y += this.speedY * df;
        this.x += Math.sin((Date.now() / 300) + this.sinOffset) * 1.5 * df;

        if (this.y > canvas.height) {
            this.markedForDeletion = true;
        }
    }
    draw(ctx) {
        ctx.drawImage(this.sprite.canvas, this.x, this.y);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
    }
}

class Bullet {
    constructor(x, y, isEnemy, angle = 0) {
        this.x = x;
        this.y = y;
        this.isEnemy = isEnemy;
        this.speedY = isEnemy ? 8 : -12;
        this.speedX = Math.sin(angle) * Math.abs(this.speedY);
        this.speedY = Math.cos(angle) * this.speedY;
        this.markedForDeletion = false;
        this.frame = 0;

        if (isEnemy) {
            this.sprites = [SPRITES.bullet_alien_f1, SPRITES.bullet_alien_f2];
            this.width = this.sprites[0].width;
            this.height = this.sprites[0].height;
        } else {
            this.sprites = [SPRITES.bullet_player];
            this.x -= SPRITES.bullet_player.width / 2;
            this.width = this.sprites[0].width;
            this.height = this.sprites[0].height;
        }
    }
    update(df) {
        this.x += this.speedX * df;
        this.y += this.speedY * df;
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.markedForDeletion = true;
        }

        if (this.isEnemy && Math.random() < 0.2 * df) {
            this.frame = (this.frame + 1) % 2;
        }
    }
    draw(ctx) {
        const sprite = this.isEnemy ? this.sprites[this.frame] : this.sprites[0];
        ctx.drawImage(sprite.canvas, this.x, this.y);
    }
}

class Alien {
    constructor(x, y, type, points) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.points = points;
        this.frame = 0;
        this.markedForDeletion = false;

        this.sprites = [SPRITES[`${this.type}_f1`], SPRITES[`${this.type}_f2`]];
        this.width = this.sprites[0].width;
        this.height = this.sprites[0].height;
    }
    toggleFrame() {
        this.frame = (this.frame + 1) % 2;
    }
    draw(ctx) {
        ctx.drawImage(this.sprites[this.frame].canvas, this.x, this.y);
    }
}

class Particle {
    constructor(x, y, colorCode) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 * PIXEL_SCALE * 0.5 + 2;
        this.speedX = Math.random() * 8 - 4;
        this.speedY = Math.random() * 8 - 4;
        this.color = PALETTE[colorCode] || '#fff';
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update(df) {
        this.x += this.speedX * df;
        this.y += this.speedY * df;
        this.life -= this.decay * df;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

// JUICE FX
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.speedY = -1.5;
    }
    update(df) {
        this.y += this.speedY * df;
        this.life -= 0.02 * df;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

class Star {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 2 + 1;
        this.speed = this.size * 0.5; // Parallax effect
        this.alpha = Math.random() * 0.5 + 0.2;
    }
    update(df) {
        this.y += this.speed * df;
        if (this.y > canvas.height) {
            this.y = -5;
            this.x = Math.random() * canvas.width;
        }
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color || '#fff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Use crab sprite scaled up as the boss base
        let bossScale = 6;
        this.width = SPRITES.crab_f1.width * bossScale;
        this.height = SPRITES.crab_f1.height * bossScale;
        this.hp = 16000;
        this.maxHp = 16000;
        this.frame = 0;
        this.markedForDeletion = false;
        this.attackPhase = 0;
        this.attackTimer = 0;
        this.sinOffset = 0;
        this.enraged = false;
        this.enrageTriggered = false;
        this.enragePauseTimer = 0;
        this.burstCooldown = 0;
        this.wallShotCount = 0;
        this.bossScale = bossScale;

        // Draw boss graphics to an offscreen canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.renderBoss();
    }

    renderBoss(enraged = false) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Draw the crab sprite scaled up
        this.ctx.drawImage(SPRITES.crab_f1.canvas, 0, 0, this.width, this.height);
        // Tint it red using source-atop compositing
        this.ctx.globalCompositeOperation = 'source-atop';
        if (enraged) {
            this.ctx.fillStyle = 'rgba(255, 30, 0, 0.7)';
        } else {
            this.ctx.fillStyle = 'rgba(200, 0, 0, 0.6)';
        }
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    update(df) {
        // Check for enrage trigger at half HP
        if (!this.enrageTriggered && this.hp <= this.maxHp / 2) {
            this.enrageTriggered = true;
            this.enraged = true;
            this.enragePauseTimer = 2000; // 2 second dramatic pause
            this.attackTimer = 0;
            this.attackPhase = 0;
            this.renderBoss(true);
            triggerShake(60, 25);
            playSound('boss_enrage');
            // Clear existing boss bullets for fairness
            bullets = bullets.filter(b => !b.isEnemy);
        }

        // Dramatic pause when enrage triggers
        if (this.enragePauseTimer > 0) {
            this.enragePauseTimer -= df * 16.66;
            // Boss pulses during enrage pause
            this.sinOffset += 0.2 * df;
            this.y = 80 + Math.sin(this.sinOffset * 3) * 8;
            return;
        }

        let moveSpeed = this.enraged ? 0.08 : 0.05;
        let moveRange = this.enraged ? 150 : 100;
        this.sinOffset += moveSpeed * df;
        this.y = 80 + Math.sin(this.sinOffset) * (this.enraged ? 40 : 20);
        this.x = canvas.width / 2 - this.width / 2 + Math.cos(this.sinOffset * 0.5) * moveRange;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            return;
        }

        this.attackTimer += df * 16.66; // approx ms
        if (this.burstCooldown > 0) this.burstCooldown -= df * 16.66;

        let totalPhases = this.enraged ? 6 : 3;

        // --- PHASE 0: Spiral ---
        if (this.attackPhase === 0 && this.attackTimer > 1500) {
            let spiralSpeed = this.enraged ? 150 : 200;
            if (this.attackTimer % (this.enraged ? 80 : 100) < 20) {
                let angle = (this.attackTimer / spiralSpeed);
                let cx = this.x + this.width / 2;
                let cy = this.y + this.height;
                bullets.push(new Bullet(cx, cy, true, angle));
                bullets.push(new Bullet(cx, cy, true, angle + Math.PI));
                if (this.enraged) {
                    // Quad spiral in enrage
                    bullets.push(new Bullet(cx, cy, true, angle + Math.PI / 2));
                    bullets.push(new Bullet(cx, cy, true, angle + Math.PI * 1.5));
                }
                playSound('shoot');
            }
            if (this.attackTimer > 5000) { this.attackPhase = 1; this.attackTimer = 0; }
        }

        // --- PHASE 1: Burst (REBALANCED) ---
        else if (this.attackPhase === 1 && this.attackTimer > 1500) {
            // Fire aimed bursts on a cooldown instead of random chance
            let burstInterval = this.enraged ? 400 : 600;
            if (this.burstCooldown <= 0) {
                let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                let dy = (player.y + player.height / 2) - (this.y + this.height);
                let angle = Math.atan2(dx, dy);
                // Wider spread so player can dodge between bullets
                let spread = this.enraged ? 0.25 : 0.35;
                bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height, true, angle - spread));
                bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height, true, angle));
                bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height, true, angle + spread));
                playSound('shoot');
                this.burstCooldown = burstInterval;
            }
            if (this.attackTimer > 4500) { this.attackPhase = 2; this.attackTimer = 0; }
        }

        // --- PHASE 2: Wall ---
        else if (this.attackPhase === 2 && this.attackTimer > 2000) {
            let wallInterval = this.enraged ? 800 : 1200;
            let wallTarget = this.attackTimer - 2000;
            let expectedShots = Math.floor(wallTarget / wallInterval);
            if (expectedShots > this.wallShotCount) {
                this.wallShotCount++;
                // Ensure gap is WITHIN the arena bounds so player can actually dodge
                let arenaLeft = player.arenaBounds ? player.arenaBounds.x : 0;
                let arenaRight = player.arenaBounds ? (player.arenaBounds.x + player.arenaBounds.w) : canvas.width;
                // Convert arena bounds to column indices
                let gapColMin = Math.ceil(arenaLeft / 40) + 1;
                let gapColMax = Math.floor(arenaRight / 40) - 2;
                if (gapColMax <= gapColMin) gapColMax = gapColMin + 1;
                let gapIndex = gapColMin + Math.floor(Math.random() * (gapColMax - gapColMin + 1));
                let gapSize = 3;
                for (let i = 0; i < canvas.width / 40; i++) {
                    if (Math.abs(i - gapIndex) > gapSize) {
                        let b = new Bullet(i * 40, this.y + this.height, true, 0);
                        b.speedY = this.enraged ? 5 : 4;
                        bullets.push(b);
                    }
                }
                playSound('shoot');
            }
            let nextPhase = this.enraged ? 3 : 0;
            if (this.attackTimer > 7000) { this.attackPhase = nextPhase; this.attackTimer = 0; this.wallShotCount = 0; }
        }

        // === ENRAGE-ONLY PHASES ===

        // --- PHASE 3: Cross Burst (Enrage) ---
        else if (this.enraged && this.attackPhase === 3 && this.attackTimer > 1000) {
            // Fire in a + pattern that rotates
            if (this.attackTimer % 120 < 20) {
                let baseAngle = (this.attackTimer / 300);
                let cx = this.x + this.width / 2;
                let cy = this.y + this.height;
                for (let i = 0; i < 4; i++) {
                    let a = baseAngle + (Math.PI / 2) * i;
                    let b = new Bullet(cx, cy, true, a);
                    b.speedY = 6;
                    bullets.push(b);
                }
                playSound('shoot');
            }
            if (this.attackTimer > 4000) { this.attackPhase = 4; this.attackTimer = 0; }
        }

        // --- PHASE 4: Homing Missiles (Enrage) ---
        else if (this.enraged && this.attackPhase === 4 && this.attackTimer > 1500) {
            if (this.burstCooldown <= 0) {
                let cx = this.x + this.width / 2;
                let cy = this.y + this.height;
                let dx = (player.x + player.width / 2) - cx;
                let dy = (player.y + player.height / 2) - cy;
                let angle = Math.atan2(dx, dy);
                // Single well-aimed slow bullet
                let b = new Bullet(cx, cy, true, angle);
                b.speedY = 5;
                b.speedX = Math.sin(angle) * 5;
                bullets.push(b);
                playSound('shoot');
                this.burstCooldown = 350;
            }
            if (this.attackTimer > 4000) { this.attackPhase = 5; this.attackTimer = 0; }
        }

        // --- PHASE 5: Chaos Rain (Enrage) ---
        else if (this.enraged && this.attackPhase === 5 && this.attackTimer > 1000) {
            // Random rain of bullets from the boss position
            if (this.attackTimer % 80 < 20) {
                let cx = this.x + Math.random() * this.width;
                let cy = this.y + this.height;
                let angle = (Math.random() - 0.5) * 1.2;
                let b = new Bullet(cx, cy, true, angle);
                b.speedY = 4 + Math.random() * 4;
                bullets.push(b);
                playSound('shoot');
            }
            if (this.attackTimer > 5000) { this.attackPhase = 0; this.attackTimer = 0; }
        }
    }

    draw(ctx) {
        // Enrage glow effect
        if (this.enraged) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20 + Math.sin(Date.now() / 200) * 10;
        }
        ctx.drawImage(this.canvas, this.x, this.y);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // HP Bar - wider, positioned above boss
        let barWidth = this.width + 40;
        let barX = this.x - 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, this.y - 25, barWidth, 14);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX + 2, this.y - 23, barWidth - 4, 10);
        let pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = this.enraged ? '#ff4400' : '#00ff00';
        ctx.fillRect(barX + 2, this.y - 23, (barWidth - 4) * pct, 10);
        // HP bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, this.y - 25, barWidth, 14);
    }
}

// --- GAME STATE ---
let player = new Player();
let bullets = [];
let aliens = [];
let particles = [];
let boss = null;
let monologueIndex = 0;
let monologueText = "";
let typeWriterTimer = 0;
let activeMonologue = [
    "SO...",
    "YOU'RE THE ONE.",
    "THE ONE WHO MASSACRED MY PEOPLE.",
    "THEY WERE JUST DEFENDING THEMSELVES.",
    "JUST LOOKING FOR A HOME.",
    "AND YOU SLAUGHTERED THEM.",
    "WAVE.",
    "AFTER.",
    "WAVE.",
    "WELL...",
    "NOW IT'S MY TURN.",
    "PREPARE TO BE DELETED."
];

let floatingTexts = [];
let stars = [];
let powerups = [];
let laserbeams = [];
let powerupsDropped = false;
let score = 0;
let lives = 3;
let alienDir = 1;
let level = 1;
let alienLastMoveTime = 0;
let ALIEN_MOVE_INTERVAL = 800;
let shakeDuration = 0;
let shakeIntensity = 0;
let timeFreezeDuration = 0;
let invincibleDuration = 0;

let abilities = {
    1: { cd: 0, maxCd: 15000, unlocked: true },
    2: { cd: 0, maxCd: 20000, unlocked: false },
    3: { cd: 0, maxCd: 12000, unlocked: false },
    4: { cd: 0, maxCd: 18000, unlocked: false },
    5: { cd: 0, maxCd: 30000, unlocked: false }
};

function triggerShake(duration, intensity) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

function initStars() {
    stars = Array.from({ length: 100 }, () => new Star(canvas.width, canvas.height));
}
initStars();

function initLevel() {
    aliens = [];
    bullets = [];
    particles = [];
    floatingTexts = [];
    powerups = [];
    laserbeams = [];
    powerupsDropped = false;
    alienDir = 1;
    alienLastMoveTime = 0;
    boss = null;
    player.is2D = false;
    player.arenaBounds = null;

    if (level === 11) {
        // Start Boss Fight sequence
        currentState = STATE.BOSS_INTRO;
        monologueIndex = 0;
        monologueText = "";

        // Render Boss Portrait
        portraitCtx.clearRect(0, 0, 60, 60);
        portraitCtx.drawImage(SPRITES.crab_f1.canvas, 0, 0, 60, 60);

        dialogueName.innerText = "COMMANDER KRAZOK";
        dialogueContainer.classList.remove('hidden');
        uiLayer.classList.add('hidden');

        // Reset player to center bottom
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 40;
        return; // Don't spawn normal aliens
    }

    // Check unlocks
    let newlyUnlocked = [];
    if (level === 2 && !abilities[2].unlocked) { abilities[2].unlocked = true; newlyUnlocked.push("Time Freeze!"); }
    if (level === 4 && !abilities[3].unlocked) { abilities[3].unlocked = true; newlyUnlocked.push("EMP!"); }
    if (level === 6 && !abilities[4].unlocked) { abilities[4].unlocked = true; newlyUnlocked.push("Invincibility!"); }
    if (level === 8 && !abilities[5].unlocked) { abilities[5].unlocked = true; newlyUnlocked.push("Nuke!"); }

    if (newlyUnlocked.length > 0) {
        playSound('powerup');
        newlyUnlocked.forEach((name, i) => {
            floatingTexts.push(new FloatingText(canvas.width / 2 - 100, canvas.height / 2 - (i * 30), `UNLOCKED: ${name}`, '#00ff00'));
        });
    }

    // Update UI visibility
    for (let i = 1; i <= 5; i++) {
        if (abilities[i].unlocked) {
            cdUI[i].parent.classList.remove('hidden');
            cdUI[i].parent.classList.add('active'); // active uses flex, ready manages border color
        } else {
            cdUI[i].parent.classList.add('hidden');
            cdUI[i].parent.classList.remove('active');
        }
    }

    if (level < 11) {
        // Scale speed — easy levels (6-10) are slower
        let isEasyLevel = (level >= 6 && level <= 10);
        ALIEN_MOVE_INTERVAL = isEasyLevel ? Math.max(400, 900 - (level * 30)) : Math.max(80, 800 - (level * 60));

        const paddingX = 60;
        const paddingY = 50;

        // Adapt to fullscreen dynamically
        let maxCols = Math.max(5, Math.floor((canvas.width - 200) / paddingX));
        // Limit columns slightly on very wide screens to keep game balanced
        if (maxCols > 16) maxCols = 16;

        const startY = Math.max(60, canvas.height * 0.1);

        // LEVEL FORMATIONS
        // Level 1: Classic Block (Squat and wide)
        if (level === 1) {
            const cols = Math.min(11, maxCols);
            const rows = 4;
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                let type = (r === 0) ? 'squid' : (r === 1) ? 'crab' : 'octopus';
                let pts = (type === 'squid') ? 30 : (type === 'crab') ? 20 : 10;
                for (let c = 0; c < cols; c++) {
                    aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                }
            }
        }
        // Level 2: V-Formation (Arrowhead)
        else if (level === 2) {
            const cols = Math.min(13, maxCols);
            const rows = 6;
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Form a V shape
                    let distFromCenter = Math.abs(c - Math.floor(cols / 2));
                    if (r >= distFromCenter) {
                        let type = (r < 2) ? 'squid' : (r < 4) ? 'crab' : 'octopus';
                        let pts = (type === 'squid') ? 30 : (type === 'crab') ? 20 : 10;
                        aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                    }
                }
            }
        }
        // Level 3: Checkerboard
        else if (level === 3) {
            const cols = Math.min(12, maxCols);
            const rows = 5;
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if ((r + c) % 2 === 0) {
                        let type = ['squid', 'crab', 'octopus'][Math.floor(Math.random() * 3)];
                        let pts = (type === 'squid') ? 30 : (type === 'crab') ? 20 : 10;
                        aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                    }
                }
            }
        }
        // Level 4: The Wall (Dense Block)
        else if (level === 4) {
            const cols = maxCols;
            const rows = 6;
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                let type = (r % 2 === 0) ? 'squid' : 'crab';
                let pts = (type === 'squid') ? 30 : 20;
                for (let c = 0; c < cols; c++) {
                    aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                }
            }
        }
        // Level 5+: Procedural Chaos (hard levels)
        else if (level >= 5 && level <= 5) {
            const cols = maxCols;
            const rows = Math.min(8, 4 + Math.floor(level / 2));
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.3) {
                        let type = ['squid', 'crab', 'octopus'][Math.floor(Math.random() * 3)];
                        let pts = (type === 'squid') ? 30 : (type === 'crab') ? 20 : 10;
                        aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                    }
                }
            }
        }
        // Levels 6-10: Easy farming levels (fewer aliens, slower, guaranteed powerups)
        else {
            const cols = Math.min(8, maxCols);
            const rows = Math.max(2, 4 - Math.floor((level - 5) / 2));
            const startX = (canvas.width / 2) - ((cols * paddingX) / 2) + (paddingX / 2);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.4) {
                        let type = ['octopus', 'crab'][Math.floor(Math.random() * 2)];
                        let pts = (type === 'crab') ? 20 : 10;
                        aliens.push(new Alien(startX + c * paddingX, startY + r * paddingY, type, pts));
                    }
                }
            }
        }
    }
}

function startGame() {
    // Requires audio context initialization on user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();

    score = 0;
    lives = 3;
    level = 1;
    player = new Player();

    // Reset abilities
    for (let i = 1; i <= 5; i++) {
        abilities[i].cd = 0;
        abilities[i].unlocked = (i === 1); // Only ability 1 starts unlocked
    }
    timeFreezeDuration = 0;
    invincibleDuration = 0;
    laserbeams = [];

    initLevel();

    updateScoreUI();
    updateLivesUI();
    updateLevelUI();

    currentState = STATE.PLAYING;
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    levelScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    uiLayer.classList.remove('hidden');
}

function nextLevel() {
    level++;
    initLevel();
    updateLevelUI();
    // Don't override BOSS_INTRO — initLevel sets that when level === 11
    if (currentState !== STATE.BOSS_INTRO) {
        currentState = STATE.PLAYING;
    }
    levelScreen.classList.add('hidden');
}

function getAlienColorCode(type) {
    if (type === 'squid') return '3'; // Magenta
    if (type === 'crab') return '2';  // Cyan
    if (type === 'octopus') return '1'; // Green
    return '0';
}

function spawnParticles(x, y, type) {
    const code = getAlienColorCode(type);
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, code));
    }
}

function spawnPlayerParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, '1')); // Green
    }
}

function updateScoreUI() {
    scoreEl.innerText = score.toString().padStart(4, '0');
}

function updateLivesUI() {
    livesEl.innerText = lives;
}

function updateLevelUI() {
    levelEl.innerText = level;
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function startBossFight() {
    dialogueContainer.classList.add('hidden');
    uiLayer.classList.remove('hidden');
    currentState = STATE.BOSS_FIGHT;

    boss = new Boss(canvas.width / 2 - 100, 50);
    player.is2D = true;
    let aw = 400; let ah = 300;
    player.arenaBounds = {
        x: canvas.width / 2 - aw / 2,
        y: canvas.height - ah - 20,
        w: aw,
        h: ah
    };

    // Play a sick boss entry sound
    triggerShake(50, 10);
    playSound('die');
}

let dialogueLastTime = 0;
function updateDialogue(deltaTime) {
    if (keys.Enter && Date.now() - dialogueLastTime > 200) {
        if (monologueText.length < activeMonologue[monologueIndex].length) {
            // Skip to end of current line
            monologueText = activeMonologue[monologueIndex];
        } else {
            // Next line
            monologueIndex++;
            monologueText = "";
            if (monologueIndex >= activeMonologue.length) {
                // Done with dialogue
                startBossFight();
            }
        }
        dialogueLastTime = Date.now();
        keys.Enter = false;
    }

    if (currentState !== STATE.BOSS_INTRO) return;

    if (monologueText.length < activeMonologue[monologueIndex].length) {
        typeWriterTimer += deltaTime;
        if (typeWriterTimer > 50) { // Add char every 50ms
            monologueText += activeMonologue[monologueIndex][monologueText.length];
            typeWriterTimer = 0;
            // tiny sound blip
            if (monologueText.length % 2 === 0) playSound('dialogue_blip');
        }
    }
    dialogueText.innerText = monologueText;
}

let lastShootTime = 0;
function update(deltaTime) {
    let df = deltaTime / 16.66;
    if (df > 3) df = 3;

    // Always update stars
    stars.forEach(s => s.update(df));

    if (currentState === STATE.BOSS_INTRO) {
        updateDialogue(deltaTime);
        return;
    }

    // During WIN state, only update particles and shake for the victory animation
    if (currentState === STATE.WIN) {
        if (shakeDuration > 0) shakeDuration -= df;
        particles.forEach(p => p.update(df));
        floatingTexts.forEach(t => t.update(df));
        particles = particles.filter(p => p.life > 0);
        floatingTexts = floatingTexts.filter(t => t.life > 0);
        return;
    }

    if (currentState !== STATE.PLAYING && currentState !== STATE.BOSS_FIGHT) return;

    if (shakeDuration > 0) shakeDuration -= df;

    player.update(df);

    timeFreezeDuration -= deltaTime;
    invincibleDuration -= deltaTime;

    for (let i = 1; i <= 5; i++) {
        if (!abilities[i].unlocked) continue;

        abilities[i].cd -= deltaTime;
        if (abilities[i].cd < 0) abilities[i].cd = 0;

        let percentage = (abilities[i].cd / abilities[i].maxCd) * 100;
        cdUI[i].el.style.height = `${percentage}%`;
        if (abilities[i].cd === 0) {
            cdUI[i].parent.classList.add('ready');
        } else {
            cdUI[i].parent.classList.remove('ready');
        }
    }

    if (keys[1] && abilities[1].unlocked && abilities[1].cd === 0) {
        abilities[1].cd = abilities[1].maxCd;
        playSound('railgun');
        laserbeams.push({ x: player.x + player.width / 2 - 10, width: 20, y: 0, height: player.y, duration: 250 });
        keys[1] = false;
    }
    if (keys[2] && abilities[2].unlocked && abilities[2].cd === 0) {
        abilities[2].cd = abilities[2].maxCd;
        timeFreezeDuration = 4000;
        playSound('time_freeze');
        keys[2] = false;
    }
    if (keys[3] && abilities[3].unlocked && abilities[3].cd === 0) {
        abilities[3].cd = abilities[3].maxCd;
        playSound('emp');
        bullets = bullets.filter(b => !b.isEnemy);
        triggerShake(10, 10);
        keys[3] = false;
    }
    if (keys[4] && abilities[4].unlocked && abilities[4].cd === 0) {
        abilities[4].cd = abilities[4].maxCd;
        invincibleDuration = 5000;
        playSound('invincible');
        keys[4] = false;
    }
    if (keys[5] && abilities[5].unlocked && abilities[5].cd === 0) {
        abilities[5].cd = abilities[5].maxCd;
        playSound('nuke');
        triggerShake(30, 20);

        let toKill = [];
        let numToKill = Math.min(8, aliens.length);
        while (toKill.length < numToKill) {
            let idx = Math.floor(Math.random() * aliens.length);
            if (!toKill.includes(idx)) toKill.push(idx);
        }
        toKill.forEach(idx => {
            let a = aliens[idx];
            a.markedForDeletion = true;
            score += a.points;
            spawnParticles(a.x + a.width / 2, a.y + a.height / 2, a.type);
            floatingTexts.push(new FloatingText(a.x, a.y, `+${a.points}`, PALETTE[getAlienColorCode(a.type)]));
        });
        updateScoreUI();
        keys[5] = false;
    }

    let fireCooldown = player.powerups.rapid ? Math.max(60, 300 - player.powerups.rapid * 80) : 300;
    if (keys.Space && Date.now() - lastShootTime > fireCooldown) {
        playSound('shoot');
        if (player.powerups.spread) {
            let baseAngle = 0.15 * Math.min(player.powerups.spread, 3);
            bullets.push(new Bullet(player.x + player.width / 2, player.y, false, 0));
            bullets.push(new Bullet(player.x + player.width / 2, player.y, false, -baseAngle));
            bullets.push(new Bullet(player.x + player.width / 2, player.y, false, baseAngle));
            if (player.powerups.spread >= 2) {
                bullets.push(new Bullet(player.x + player.width / 2, player.y, false, -baseAngle * 2));
                bullets.push(new Bullet(player.x + player.width / 2, player.y, false, baseAngle * 2));
            }
        } else {
            bullets.push(new Bullet(player.x + player.width / 2, player.y, false, 0));
        }
        lastShootTime = Date.now();
    }

    if (timeFreezeDuration <= 0 && Date.now() - alienLastMoveTime > ALIEN_MOVE_INTERVAL && aliens.length > 0) {
        let hitEdge = false;

        for (let a of aliens) {
            if (a.x + a.width + 15 > canvas.width && alienDir === 1) hitEdge = true;
            if (a.x - 15 < 0 && alienDir === -1) hitEdge = true;
        }

        if (hitEdge) {
            alienDir *= -1;
            aliens.forEach(a => {
                a.y += 20;
                a.toggleFrame();
            });
            ALIEN_MOVE_INTERVAL = Math.max(50, ALIEN_MOVE_INTERVAL * 0.9);
        } else {
            aliens.forEach(a => {
                a.x += alienDir * (canvas.width > 800 ? 15 : 10);
                a.toggleFrame();
            });
        }
        alienLastMoveTime = Date.now();
    }

    if (timeFreezeDuration <= 0 && aliens.length > 0 && Math.random() < 0.02 + (level * 0.005)) {
        const shooter = aliens[Math.floor(Math.random() * aliens.length)];
        bullets.push(new Bullet(shooter.x + shooter.width / 2 - SPRITES.bullet_alien_f1.width / 2, shooter.y + shooter.height, true));
    }

    if (currentState === STATE.BOSS_FIGHT && boss) {
        boss.update(df);
    }

    bullets.forEach(b => {
        if (timeFreezeDuration > 0 && b.isEnemy) return; // Time Freeze effect
        b.update(df)
    });
    particles.forEach(p => p.update(df));
    floatingTexts.forEach(t => t.update(df));
    powerups.forEach(p => p.update(df));

    // Process laserbeams
    laserbeams.forEach(lb => {
        lb.duration -= deltaTime;
        lb.x = player.x + player.width / 2 - 10;

        if (boss && currentState === STATE.BOSS_FIGHT) {
            // Railgun hitting boss
            if (boss.x < lb.x + lb.width && boss.x + boss.width > lb.x) {
                boss.hp -= 5;
                spawnParticles(boss.x + boss.width / 2, boss.y + boss.height, '4');
            }
        }

        aliens.forEach(a => {
            if (a.x < lb.x + lb.width && a.x + a.width > lb.x) {
                if (!a.markedForDeletion) {
                    a.markedForDeletion = true;
                    score += a.points;
                    spawnParticles(a.x + a.width / 2, a.y + a.height / 2, a.type);
                    floatingTexts.push(new FloatingText(a.x, a.y, `+${a.points}`, PALETTE[getAlienColorCode(a.type)]));
                    updateScoreUI();
                }
            }
        });
    });

    powerups.forEach(p => {
        if (!p.markedForDeletion && checkCollision(p, player)) {
            p.markedForDeletion = true;
            playSound('powerup');
            let color = '#fff';
            let text = "";
            if (p.type === 'spread') { player.powerups.spread++; text = player.powerups.spread > 1 ? `Spread x${player.powerups.spread}!` : "Spread Shot!"; color = '#ffff00'; }
            else if (p.type === 'rapid') { player.powerups.rapid++; text = player.powerups.rapid > 1 ? `Rapid x${player.powerups.rapid}!` : "Rapid Fire!"; color = '#ffff00'; }
            else if (p.type === 'speed') { player.powerups.speed++; text = player.powerups.speed > 1 ? `Speed x${player.powerups.speed}!` : "Speed Up!"; color = '#00ff00'; }
            else if (p.type === 'life') { lives++; updateLivesUI(); text = "+1 Life!"; color = '#ff0000'; }
            else if (p.type === 'shield') { player.powerups.shield++; text = player.powerups.shield > 1 ? `Shield x${player.powerups.shield}!` : "Shield!"; color = '#00ffff'; }

            floatingTexts.push(new FloatingText(player.x, player.y - 10, text, color));
            spawnParticles(player.x + player.width / 2, player.y, '5');
        }
    });

    bullets.forEach(b => {
        if (b.isEnemy) {
            if (checkCollision(b, player)) {
                if (invincibleDuration > 0) {
                    b.markedForDeletion = true;
                    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '2');
                } else {
                    b.markedForDeletion = true;
                    if (player.powerups.shield > 0) {
                        player.powerups.shield--;
                        playSound('hit');
                        triggerShake(10, 5);
                        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '2');
                        floatingTexts.push(new FloatingText(player.x, player.y, "Shield Broken!", "#00ffff"));
                    } else {
                        lives--;
                        playSound('die');
                        // Only remove one random active powerup instead of all
                        let activeKeys = Object.keys(player.powerups).filter(k => player.powerups[k] > 0);
                        if (activeKeys.length > 0) {
                            let lostKey = activeKeys[Math.floor(Math.random() * activeKeys.length)];
                            player.powerups[lostKey]--;
                            let names = { rapid: 'Rapid', spread: 'Spread', speed: 'Speed', shield: 'Shield' };
                            floatingTexts.push(new FloatingText(player.x, player.y - 30, `-${names[lostKey]}!`, '#ff4444'));
                        }
                        triggerShake(20, 15);
                        spawnPlayerParticles(player.x + player.width / 2, player.y + player.height / 2);
                        updateLivesUI();
                        if (lives <= 0) {
                            currentState = STATE.GAME_OVER;
                            finalScoreEl.innerText = score.toString().padStart(4, '0');
                            uiLayer.classList.add('hidden');
                            gameOverScreen.classList.remove('hidden');
                        } else {
                            player.x = canvas.width / 2 - player.width / 2;
                            invincibleDuration = 2000; // 2 second i-frames after taking a hit
                        }
                    }
                }
            }
        } else {
            if (boss && currentState === STATE.BOSS_FIGHT) {
                if (!b.markedForDeletion && checkCollision(b, boss)) {
                    b.markedForDeletion = true;
                    boss.hp -= 50; // Bullet damage
                    playSound('boss_hit');
                    spawnParticles(boss.x + Math.random() * boss.width, boss.y + boss.height, '4');
                }
            }

            aliens.forEach(a => {
                if (!b.markedForDeletion && !a.markedForDeletion && checkCollision(b, a)) {
                    b.markedForDeletion = true;
                    a.markedForDeletion = true;
                    score += a.points;
                    playSound('hit');
                    triggerShake(5, 5);
                    floatingTexts.push(new FloatingText(a.x, a.y, `+${a.points}`, PALETTE[getAlienColorCode(a.type)]));
                    updateScoreUI();
                    spawnParticles(a.x + a.width / 2, a.y + a.height / 2, a.type);
                }
            });
        }
    });

    bullets = bullets.filter(b => !b.markedForDeletion);
    aliens = aliens.filter(a => !a.markedForDeletion);
    particles = particles.filter(p => p.life > 0);
    floatingTexts = floatingTexts.filter(t => t.life > 0);
    powerups = powerups.filter(p => !p.markedForDeletion);
    laserbeams = laserbeams.filter(lb => lb.duration > 0);

    if (boss && boss.markedForDeletion && currentState === STATE.BOSS_FIGHT) {
        score += 10000;
        updateScoreUI();
        currentState = STATE.WIN;
        triggerShake(120, 30);
        playSound('nuke');

        // Massive victory explosion — burst of particles from boss position
        let bx = boss.x + boss.width / 2;
        let by = boss.y + boss.height / 2;
        for (let i = 0; i < 200; i++) {
            let colors = ['1', '2', '3', '4', '5'];
            let p = new Particle(bx, by);
            p.speedX = (Math.random() - 0.5) * 20;
            p.speedY = (Math.random() - 0.5) * 20;
            p.life = 1.5 + Math.random();
            p.size = 3 + Math.random() * 5;
            p.color = PALETTE[colors[Math.floor(Math.random() * colors.length)]];
            particles.push(p);
        }
        bullets = [];
        boss = null;
        uiLayer.classList.add('hidden');

        // Show win screen after a delay for the particles
        setTimeout(() => {
            let winScreen = document.getElementById('win-screen');
            document.getElementById('win-score').innerText = score.toString().padStart(4, '0');
            winScreen.classList.remove('hidden');
        }, 2500);
    }

    if (aliens.length === 0 && currentState === STATE.PLAYING) {
        if (!powerupsDropped) {
            powerupsDropped = true;
            let numPowerups = Math.floor(Math.random() * 3) + 1;
            const types = ['spread', 'rapid', 'speed', 'life', 'shield'];
            for (let i = 0; i < numPowerups; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const px = Math.random() * (canvas.width - 100) + 50;
                powerups.push(new Powerup(px, -50 - (i * 60), type));
            }
        } else if (powerups.length === 0 && currentState === STATE.PLAYING) {
            currentState = STATE.NEXT_LEVEL;
            levelScreen.classList.remove('hidden');
            setTimeout(() => nextLevel(), 2000);
        }
    }

    aliens.forEach(a => {
        if (a.y + a.height >= player.y) {
            playSound('die');
            player.powerups = { rapid: 0, spread: 0, speed: 0, shield: 0 };
            currentState = STATE.GAME_OVER;
            finalScoreEl.innerText = score.toString().padStart(4, '0');
            uiLayer.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Always draw stars in background
    stars.forEach(s => s.draw(ctx));

    if (currentState !== STATE.PLAYING && currentState !== STATE.BOSS_FIGHT && currentState !== STATE.WIN && currentState !== STATE.PAUSE) return;

    ctx.save();

    // Apply Screenshake Juice
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }

    if (currentState === STATE.BOSS_FIGHT && player.arenaBounds) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(player.arenaBounds.x, player.arenaBounds.y, player.arenaBounds.w, player.arenaBounds.h);
    }

    if (player) player.draw(ctx);
    if (boss && currentState === STATE.BOSS_FIGHT) boss.draw(ctx);
    aliens.forEach(a => a.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    bullets.forEach(b => b.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    floatingTexts.forEach(t => t.draw(ctx));
    laserbeams.forEach(lb => {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(lb.x, lb.y, lb.width, lb.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lb.x + 4, lb.y, lb.width - 8, lb.height);
    });

    ctx.restore();
}

let lastTime = 0;
function loop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(loop);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initialize
requestAnimationFrame(loop);
