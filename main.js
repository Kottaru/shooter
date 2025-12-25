/**
 * BLOCK FPS ENGINE - V3 (PURE JS)
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuração do Mundo ---
const MAP_SIZE = 20;
const FOV = Math.PI / 3;
const player = {
    x: 10, y: 10, dir: 0,
    hp: 100, kills: 0,
    weapon: 'RIFLE'
};

// Mapa: 1 = Parede/Caixa, 0 = Caminho
const worldMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,1],
    [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// --- Armas ---
const weapons = {
    'RIFLE': { dmg: 34, range: 20, color: '#444', size: [60, 220] },
    'PISTOLA': { dmg: 20, range: 10, color: '#222', size: [40, 150] },
    'FACA': { dmg: 100, range: 1.5, color: '#888', size: [20, 180] }
};

// --- Inputs ---
const keys = {};
document.onkeydown = e => {
    keys[e.code] = true;
    if(e.code === 'Digit1') setWeapon('RIFLE');
    if(e.code === 'Digit2') setWeapon('PISTOLA');
    if(e.code === 'Digit3') setWeapon('FACA');
};
document.onkeyup = e => keys[e.code] = false;

canvas.onclick = () => {
    canvas.requestPointerLock();
    shoot();
};

document.onmousemove = e => {
    if (document.pointerLockElement === canvas) {
        player.dir += e.movementX * 0.003;
    }
};

function setWeapon(type) {
    player.weapon = type;
    const model = document.getElementById('weapon-model');
    const w = weapons[type];
    document.getElementById('weapon-display').innerText = type;
    model.style.width = w.size[0] + 'px';
    model.style.height = w.size[1] + 'px';
    model.style.background = w.color;
}

// --- Combate ---
function shoot() {
    // Efeito visual de recuo
    const model = document.getElementById('viewmodel');
    model.style.transform = 'translateY(40px) rotate(5deg)';
    setTimeout(() => model.style.transform = 'translateY(0) rotate(0)', 100);

    // Lógica simples de hitscan (apenas checa se há parede na frente)
    let rayX = player.x;
    let rayY = player.y;
    let step = 0.1;
    const w = weapons[player.weapon];

    for(let i=0; i < w.range / step; i++) {
        rayX += Math.cos(player.dir) * step;
        rayY += Math.sin(player.dir) * step;
        if(worldMap[Math.floor(rayY)][Math.floor(rayX)] === 1) {
            // Se atingiu uma parede, simula morte de bot (opcional)
            if(Math.random() > 0.8) {
                player.kills++;
                document.getElementById('kills').innerText = player.kills;
            }
            break;
        }
    }
}

// --- Loop de Renderização (Raycasting Pseudo-3D) ---
function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Chão e Teto
    ctx.fillStyle = "#333"; // Teto
    ctx.fillRect(0, 0, canvas.width, canvas.height/2);
    ctx.fillStyle = "#555"; // Chão
    ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height/2);

    const numRays = canvas.width / 2;
    const step = FOV / numRays;

    for (let i = 0; i < numRays; i++) {
        const rayDir = player.dir - FOV / 2 + i * step;
        let distance = 0;
        let hitWall = false;

        const eyeX = Math.cos(rayDir);
        const eyeY = Math.sin(rayDir);

        while (!hitWall && distance < 20) {
            distance += 0.05;
            let testX = Math.floor(player.x + eyeX * distance);
            let testY = Math.floor(player.y + eyeY * distance);

            if (testX < 0 || testX >= MAP_SIZE || testY < 0 || testY >= worldMap.length) {
                hitWall = true; distance = 20;
            } else if (worldMap[testY][testX] === 1) {
                hitWall = true;
            }
        }

        const ceiling = canvas.height / 2 - canvas.height / distance;
        const floor = canvas.height - ceiling;
        const wallHeight = floor - ceiling;

        // Sombreamento por distância
        const shade = 255 / (1 + distance * distance * 0.1);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(i * 2, ceiling, 2, wallHeight);
    }

    // Movimentação
    const moveSpeed = 0.05;
    let nextX = player.x;
    let nextY = player.y;

    if (keys['KeyW']) { nextX += Math.cos(player.dir) * moveSpeed; nextY += Math.sin(player.dir) * moveSpeed; }
    if (keys['KeyS']) { nextX -= Math.cos(player.dir) * moveSpeed; nextY -= Math.sin(player.dir) * moveSpeed; }
    if (keys['KeyA']) { nextX += Math.sin(player.dir) * moveSpeed; nextY -= Math.cos(player.dir) * moveSpeed; }
    if (keys['KeyD']) { nextX -= Math.sin(player.dir) * moveSpeed; nextY += Math.cos(player.dir) * moveSpeed; }

    // Colisão simples
    if (worldMap[Math.floor(nextY)][Math.floor(nextX)] === 0) {
        player.x = nextX;
        player.y = nextY;
    }

    requestAnimationFrame(render);
}

document.getElementById('overlay').onclick = () => {
    document.getElementById('overlay').style.display = 'none';
    render();
};
