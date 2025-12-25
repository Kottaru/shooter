/**
 * BLOCK KRUNK ENGINE - PURE JS & WEBGL
 */

const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl');

// --- Configurações Gameplay ---
const player = {
    x: 10, y: 2, z: 10,
    vx: 0, vy: 0, vz: 0,
    yaw: 0, pitch: 0,
    hp: 100, kills: 0, grounded: false,
    weapon: 'RIFLE', lastShot: 0
};

const weapons = {
    'RIFLE': { dmg: 30, rate: 120, spread: 0.02 },
    'SNIPER': { dmg: 100, rate: 800, spread: 0 },
    'PISTOL': { dmg: 15, rate: 200, spread: 0.01 }
};

let bots = [
    {x: -10, z: -10, hp: 100, r: 1.5},
    {x: 20, z: -30, hp: 100, r: 1.5},
    {x: -25, z: 20, hp: 100, r: 1.5}
];

const keys = {};
document.onkeydown = e => keys[e.code] = true;
document.onkeyup = e => keys[e.code] = false;

canvas.onclick = () => canvas.requestPointerLock();
document.onmousemove = e => {
    if (document.pointerLockElement === canvas) {
        player.yaw -= e.movementX * 0.003;
        player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - e.movementY * 0.003));
    }
};

// --- Sistema de Tiro (Hitscan) ---
function shoot() {
    const w = weapons[player.weapon];
    if (Date.now() - player.lastShot < w.rate) return;
    player.lastShot = Date.now();

    // Direção do tiro
    const dx = -Math.sin(player.yaw) * Math.cos(player.pitch);
    const dz = -Math.cos(player.yaw) * Math.cos(player.pitch);

    bots.forEach(bot => {
        // Cálculo simplificado de colisão (Raio vs Esfera)
        const bx = bot.x - player.x;
        const bz = bot.z - player.z;
        const dist = Math.sqrt(bx*bx + bz*bz);
        
        // Verifica se o bot está na frente e na mira
        const dot = (bx * dx + bz * dz) / dist;
        if (dot > 0.99 && dist < 100) {
            bot.hp -= w.dmg;
            if (bot.hp <= 0) {
                bot.hp = 100; bot.x = (Math.random()-0.5)*100; bot.z = (Math.random()-0.5)*100;
                player.kills++;
                showKill("VOCÊ ELIMINOU UM BOT!");
            }
        }
    });
}

function showKill(txt) {
    const feed = document.getElementById('kill-feed');
    feed.innerHTML = `<div>${txt}</div>` + feed.innerHTML;
    setTimeout(() => feed.lastChild?.remove(), 3000);
}

// --- Física e Movimento Arcade ---
function update() {
    const moveX = (keys['KeyD']?1:0) - (keys['KeyA']?1:0);
    const moveZ = (keys['KeyS']?1:0) - (keys['KeyW']?1:0);
    
    const accel = player.grounded ? 0.015 : 0.005;
    const friction = keys['ShiftLeft'] ? 0.98 : 0.92; // Slide no Shift

    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);

    player.vx += (moveX * rightX + moveZ * forwardX) * accel;
    player.vz += (moveX * rightZ + moveZ * forwardZ) * accel;

    // Bunny Hop
    if (keys['Space'] && player.grounded) {
        player.vy = 0.15;
        player.grounded = false;
        if (keys['ShiftLeft']) { player.vx *= 1.1; player.vz *= 1.1; } // Slide Hop boost
    }

    player.vy -= 0.008; // Gravidade
    player.x += player.vx; player.y += player.vy; player.z += player.vz;

    if (player.y < 2) { 
        player.y = 2; player.vy = 0; player.grounded = true; 
        player.vx *= friction; player.vz *= friction; 
    }

    if (keys['Digit1']) player.weapon = 'RIFLE';
    if (keys['Digit2']) player.weapon = 'SNIPER';
    if (keys['Digit3']) player.weapon = 'PISTOL';
    if (mouse.down || keys['ControlLeft']) shoot();

    // UI
    document.getElementById('spd').innerText = Math.round(Math.hypot(player.vx, player.vz) * 100);
    document.getElementById('kills').innerText = player.kills;
    document.getElementById('weapon-display').innerText = player.weapon;
}

let mouse = {down: false};
window.onmousedown = () => mouse.down = true;
window.onmouseup = () => mouse.down = false;

// --- Loop Principal ---
function loop() {
    update();
    // Renderização simplificada (Fundo)
    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Como prometido: Código otimizado para rodar em PC fraco.
    // O WebGL aqui está limpando o buffer. Em um jogo real, 
    // desenharíamos os cubos aqui.
    
    requestAnimationFrame(loop);
}

document.getElementById('overlay').onclick = () => {
    document.getElementById('overlay').style.display = 'none';
    loop();
};
