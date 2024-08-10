const gameBoard = document.getElementById('gameBoard');
const ctx = gameBoard.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPiece');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const startButton = document.getElementById('startButton');
const statsButton = document.getElementById('statsButton');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const gamePausedElement = document.getElementById('gamePaused');
const statsModal = document.getElementById('statsModal');
const statsContent = document.getElementById('statsContent');
const closeStatsButton = document.querySelector('.close');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const BEVEL_SIZE = 3;
const COLORS = [
  '#00FFFF',  // Cyan
  '#FF00FF',  // Magenta
  '#FFFF00',  // Yellow
  '#FF4500',  // OrangeRed
  '#32CD32',  // LimeGreen
  '#1E90FF',  // DodgerBlue
  '#FF1493',  // DeepPink
  '#00FA9A',  // MediumSpringGreen
  '#FF69B4',  // HotPink
  '#4169E1',  // RoyalBlue
  '#00CED1',  // DarkTurquoise
  '#FF8C00',  // DarkOrange
  '#7B68EE',  // MediumSlateBlue
  '#20B2AA'   // LightSeaGreen
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let score = 0;
let level = 1;
let gameLoop;
let currentPiece;
let nextPiece;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;
let isPaused = false;
let isGameStarted = false;
let lastGamepadActionTime = 0;
const gamepadCooldown = 100; // Cooldown in milliseconds

let stats = {
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
    totalLinesCleared: 0,
    totalPiecesPlaced: 0,
    totalRotations: 0,
    totalHardDrops: 0,
    longestGame: 0
};

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]]
];

function loadStats() {
    const savedStats = localStorage.getItem('tetrisStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
}

function saveStats() {
    localStorage.setItem('tetrisStats', JSON.stringify(stats));
}

function updateStats() {
    stats.gamesPlayed++;
    stats.totalScore += score;
    if (score > stats.highScore) {
        stats.highScore = score;
    }
    saveStats();
}

function displayStats() {
    statsContent.innerHTML = `
        <p>Games Played: ${stats.gamesPlayed}</p>
        <p>High Score: ${stats.highScore}</p>
        <p>Total Score: ${stats.totalScore}</p>
        <p>Total Lines Cleared: ${stats.totalLinesCleared}</p>
        <p>Total Pieces Placed: ${stats.totalPiecesPlaced}</p>
        <p>Total Rotations: ${stats.totalRotations}</p>
        <p>Total Hard Drops: ${stats.totalHardDrops}</p>
        <p>Longest Game: ${stats.longestGame} seconds</p>
    `;
    statsModal.style.display = 'block';
}

statsButton.onclick = displayStats;
closeStatsButton.onclick = () => {
    statsModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == statsModal) {
        statsModal.style.display = 'none';
    }
};

function drawBeveledBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    const bevelSize = size === BLOCK_SIZE ? BEVEL_SIZE : Math.max(1, Math.floor(size / 10));

    // Main block
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Top bevel
    ctx.fillStyle = lightenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size - bevelSize, y + bevelSize);
    ctx.lineTo(x + bevelSize, y + bevelSize);
    ctx.closePath();
    ctx.fill();

    // Left bevel
    ctx.fillStyle = lightenColor(color, 15);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x + bevelSize, y + size - bevelSize);
    ctx.lineTo(x + bevelSize, y + bevelSize);
    ctx.closePath();
    ctx.fill();

    // Bottom shadow
    ctx.fillStyle = darkenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size - bevelSize, y + size - bevelSize);
    ctx.lineTo(x + bevelSize, y + size - bevelSize);
    ctx.closePath();
    ctx.fill();

    // Right shadow
    ctx.fillStyle = darkenColor(color, 15);
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size - bevelSize, y + size - bevelSize);
    ctx.lineTo(x + size - bevelSize, y + bevelSize);
    ctx.closePath();
    ctx.fill();
}

function lightenColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function darkenColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.max(0, Math.min(255, parseInt(color, 16) - amount)).toString(16)).substr(-2));
}

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.y = 0;
        this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBeveledBlock(ctx, (this.x + x + offsetX) * BLOCK_SIZE, (this.y + y + offsetY) * BLOCK_SIZE, this.color);
                }
            });
        });
    }

    drawGhost(ctx) {
        const ghostPiece = new Piece(this.shape, this.color);
        ghostPiece.x = this.x;
        ghostPiece.y = this.y;

        while (!ghostPiece.collision()) {
            ghostPiece.y++;
        }
        ghostPiece.y--;

        ctx.globalAlpha = 0.3;
        ghostPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBeveledBlock(ctx, (ghostPiece.x + x) * BLOCK_SIZE, (ghostPiece.y + y) * BLOCK_SIZE, this.color);
                }
            });
        });
        ctx.globalAlpha = 1;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        if (this.collision()) {
            this.x -= dx;
            this.y -= dy;
            return false;
        }
        return true;
    }

    rotate() {
        const rotated = this.shape[0].map((_, i) => this.shape.map(row => row[i]).reverse());
        const prevShape = this.shape;
        this.shape = rotated;
        if (this.collision()) {
            this.shape = prevShape;
            return false;
        }
        stats.totalRotations++;
        saveStats();
        return true;
    }

    collision() {
        return this.shape.some((row, dy) => {
            return row.some((value, dx) => {
                let x = this.x + dx;
                let y = this.y + dy;
                return (
                    value &&
                    (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x]))
                );
            });
        });
    }
}

function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return new Piece(SHAPES[shapeIndex], COLORS[colorIndex]);
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBeveledBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, COLORS[value - 1]);
            }
        });
    });
}

function drawGrid() {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let j = 0; j <= COLS; j++) {
        ctx.beginPath();
        ctx.moveTo(j * BLOCK_SIZE, 0);
        ctx.lineTo(j * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + currentPiece.y][x + currentPiece.x] = COLORS.indexOf(currentPiece.color) + 1;
            }
        });
    });
    stats.totalPiecesPlaced++;
    saveStats();
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            console.log(`Line ${y} is full and will be cleared.`);
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // Check the same row again as it's now a new line
        }
    }
    if (linesCleared > 0) {
        console.log(`Cleared ${linesCleared} lines in total.`);
        stats.totalLinesCleared += linesCleared;
        
        // Updated scoring system
        let points;
        switch(linesCleared) {
            case 1:
                points = 100;
                break;
            case 2:
                points = 300;
                break;
            case 3:
                points = 500;
                break;
            case 4:
                points = 800;
                break;
            default:
                points = 0;
        }
        
        score += points * level;
        console.log(`Added ${points * level} points to the score.`);
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            console.log(`Level increased to ${level}.`);
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
        saveStats();
    }
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);
    gameOverElement.classList.remove('hidden');
    startButton.textContent = 'Start Game';
    isGameStarted = false;
    updateStats();
    console.log('Game Over!');
}

let gameStartTime;

function update(time = 0) {
    if (isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    handleGamepadInput();

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        if (!currentPiece.move(0, 1)) {
            merge();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            drawNextPiece();
            if (currentPiece.collision()) {
                gameOver();
                return;
            }
        }
        dropCounter = 0;
    }

    ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
    drawGrid();
    drawBoard();
    currentPiece.drawGhost(ctx);
    currentPiece.draw(ctx);

    const currentGameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    if (currentGameTime > stats.longestGame) {
        stats.longestGame = currentGameTime;
        saveStats();
    }

    gameLoop = requestAnimationFrame(update);
}

function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    const blockSize = 20; // Smaller block size for the next piece preview
    const offsetX = (nextPieceCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
    const offsetY = (nextPieceCanvas.height - nextPiece.shape.length * blockSize) / 2;

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBeveledBlock(nextPieceCtx, offsetX + x * blockSize, offsetY + y * blockSize, nextPiece.color, blockSize);
            }
        });
    });
}

function startGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverElement.classList.add('hidden');
    gamePausedElement.classList.add('hidden');
    dropCounter = 0;
    dropInterval = 1000;
    lastTime = 0;
    isGameOver = false;
    isPaused = false;
    isGameStarted = true;
    currentPiece = createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    cancelAnimationFrame(gameLoop);
    startButton.textContent = 'Pause';
    gameStartTime = Date.now();
    update();
    console.log('Game started!');
}

function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(gameLoop);
        gamePausedElement.classList.remove('hidden');
        startButton.textContent = 'Resume';
        console.log('Game paused');
    } else {
        gamePausedElement.classList.add('hidden');
        startButton.textContent = 'Pause';
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(update);
        console.log('Game resumed');
    }
}

document.addEventListener('keydown', event => {
    if (isGameOver || isPaused) return;
    switch (event.keyCode) {
        case 37: // Left arrow
            currentPiece.move(-1, 0);
            break;
        case 39: // Right arrow
            currentPiece.move(1, 0);
            break;
        case 40: // Down arrow
            if (!currentPiece.move(0, 1)) {
                merge();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createPiece();
                drawNextPiece();
                if (currentPiece.collision()) {
                    gameOver();
                }
            }
            dropCounter = 0;
            break;
        case 38: // Up arrow
            currentPiece.rotate();
            break;
        case 32: // Spacebar (hard drop)
            while (currentPiece.move(0, 1)) {}
            merge();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            drawNextPiece();
            if (currentPiece.collision()) {
                gameOver();
            }
            dropCounter = 0;
            stats.totalHardDrops++;
            saveStats();
            break;
    }
});

startButton.addEventListener('click', () => {
    if (!isGameStarted) {
        startGame();
    } else {
        togglePause();
    }
});

// Touch controls using Hammer.js
const hammer = new Hammer(gameBoard);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

hammer.on('swipeleft', () => { if (!isGameOver && !isPaused) currentPiece.move(-1, 0); });
hammer.on('swiperight', () => { if (!isGameOver && !isPaused) currentPiece.move(1, 0); });
hammer.on('swipedown', () => {
    if (isGameOver || isPaused) return;
    while (currentPiece.move(0, 1)) {}
    merge();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
    if (currentPiece.collision()) {
        gameOver();
    }
    dropCounter = 0;
    stats.totalHardDrops++;
    saveStats();
});
hammer.on('tap', () => { if (!isGameOver && !isPaused) currentPiece.rotate(); });

// Game controller support
window.addEventListener("gamepadconnected", function(e) {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
});

window.addEventListener("gamepaddisconnected", function(e) {
    console.log("Gamepad disconnected from index %d: %s",
    e.gamepad.index, e.gamepad.id);
});

const gamepadButtonCooldowns = {
    12: 0, // Up
    13: 0, // Down
    14: 0, // Left
    15: 0, // Right
    0: 0,  // A button
    9: 0   // Start button
};

const GAMEPAD_COOLDOWN = 150; // Increased cooldown time in milliseconds

function handleGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    if (!gamepads) {
        return;
    }

    const gamepad = gamepads[0]; // We'll just use the first gamepad
    if (gamepad) {
        const currentTime = performance.now();

        if (gamepad.buttons[14].pressed && currentTime - gamepadButtonCooldowns[14] > GAMEPAD_COOLDOWN) { // Left D-pad
            currentPiece.move(-1, 0);
            gamepadButtonCooldowns[14] = currentTime;
        }
        if (gamepad.buttons[15].pressed && currentTime - gamepadButtonCooldowns[15] > GAMEPAD_COOLDOWN) { // Right D-pad
            currentPiece.move(1, 0);
            gamepadButtonCooldowns[15] = currentTime;
        }
        if (gamepad.buttons[13].pressed && currentTime - gamepadButtonCooldowns[13] > GAMEPAD_COOLDOWN) { // Down D-pad
            if (!currentPiece.move(0, 1)) {
                merge();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createPiece();
                drawNextPiece();
                if (currentPiece.collision()) {
                    gameOver();
                }
            }
            dropCounter = 0;
            gamepadButtonCooldowns[13] = currentTime;
        }
        if (gamepad.buttons[12].pressed && currentTime - gamepadButtonCooldowns[12] > GAMEPAD_COOLDOWN) { // Up D-pad
            currentPiece.rotate();
            gamepadButtonCooldowns[12] = currentTime;
        }
        if (gamepad.buttons[0].pressed && currentTime - gamepadButtonCooldowns[0] > GAMEPAD_COOLDOWN) { // A button (Xbox) / X button (PlayStation)
            while (currentPiece.move(0, 1)) {}
            merge();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            drawNextPiece();
            if (currentPiece.collision()) {
                gameOver();
            }
            dropCounter = 0;
            stats.totalHardDrops++;
            saveStats();
            gamepadButtonCooldowns[0] = currentTime;
        }
        if (gamepad.buttons[9].pressed && currentTime - gamepadButtonCooldowns[9] > GAMEPAD_COOLDOWN) { // Start button
            if (!isGameStarted) {
                startGame();
            } else {
                togglePause();
            }
            gamepadButtonCooldowns[9] = currentTime;
        }
    }
}

// Initial setup
loadStats();
drawGrid();
console.log('Tetris game initialized and ready to start!');