const gameBoard = document.getElementById('gameBoard');
const ctx = gameBoard.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPiece');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

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

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]]
];

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.y = 0;
        this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillRect((this.x + x + offsetX) * BLOCK_SIZE, (this.y + y + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect((this.x + x + offsetX) * BLOCK_SIZE, (this.y + y + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ghostPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillRect((ghostPiece.x + x) * BLOCK_SIZE, (ghostPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect((ghostPiece.x + x) * BLOCK_SIZE, (ghostPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
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
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'white';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);
    gameOverElement.classList.remove('hidden');
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

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
                nextPieceCtx.fillStyle = nextPiece.color;
                nextPieceCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
                nextPieceCtx.strokeStyle = 'white';
                nextPieceCtx.strokeRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
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
    dropCounter = 0;
    dropInterval = 1000;
    lastTime = 0;
    isGameOver = false;
    currentPiece = createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    cancelAnimationFrame(gameLoop);
    update();
}

document.addEventListener('keydown', event => {
    if (isGameOver) return;
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
            break;
    }
});

startButton.addEventListener('click', startGame);

// Touch controls using Hammer.js
const hammer = new Hammer(gameBoard);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

hammer.on('swipeleft', () => { if (!isGameOver) currentPiece.move(-1, 0); });
hammer.on('swiperight', () => { if (!isGameOver) currentPiece.move(1, 0); });
hammer.on('swipedown', () => {
    if (isGameOver) return;
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
});
hammer.on('tap', () => { if (!isGameOver) currentPiece.rotate(); });

// Initial setup
drawGrid();