const boardElement = document.getElementById('game-board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const playerForm = document.getElementById('player-form');
const playerXInput = document.getElementById('player-x');
const playerOInput = document.getElementById('player-o');
const startBtn = document.getElementById('start-btn');
const gameModeSelect = document.getElementById('game-mode');
const replayBtn = document.getElementById('replay-btn');
const boardSizeSelect = document.getElementById('board-size');
let boardSize = 3;

// Sound elements
const moveSound = new Audio('move.mp3');
const winSound = new Audio('win.mp3');
const drawSound = new Audio('draw.mp3');
const startSound = new Audio('start.mp3');

let board;
let currentPlayer;
let gameActive;
let playerNames = { X: 'Player X', O: 'Player O' };
let vsAI = false;

const confettiCanvas = document.getElementById('confetti-canvas');
let confettiActive = false;

function showConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const ctx = confettiCanvas.getContext('2d');
    const confettiCount = 120;
    const confetti = [];
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`,
            tilt: Math.random() * 10 - 10
        });
    }
    confettiActive = true;
    function draw() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        for (let i = 0; i < confettiCount; i++) {
            const c = confetti[i];
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, c.r, c.r / 2, c.tilt, 0, 2 * Math.PI);
            ctx.fillStyle = c.color;
            ctx.fill();
        }
        update();
    }
    let angle = 0;
    function update() {
        angle += 0.01;
        for (let i = 0; i < confettiCount; i++) {
            const c = confetti[i];
            c.y += (Math.cos(angle + c.d) + 3 + c.r / 2) * 0.7;
            c.x += Math.sin(angle) * 2;
            c.tilt = Math.sin(angle + c.d) * 15;
            if (c.y > confettiCanvas.height) {
                c.x = Math.random() * confettiCanvas.width;
                c.y = Math.random() * -20;
            }
        }
    }
    function animate() {
        if (!confettiActive) return;
        draw();
        requestAnimationFrame(animate);
    }
    animate();
    setTimeout(hideConfetti, 2500);
}

function hideConfetti() {
    confettiActive = false;
    if (confettiCanvas) {
        const ctx = confettiCanvas.getContext('2d');
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

// Show/hide Player O input based on mode
function updateFormForMode() {
    if (gameModeSelect.value === 'ai') {
        playerOInput.classList.add('hidden');
        playerOInput.required = false;
    } else {
        playerOInput.classList.remove('hidden');
        playerOInput.required = true;
    }
}
gameModeSelect.addEventListener('change', updateFormForMode);
document.addEventListener('DOMContentLoaded', updateFormForMode);

function initializeGame() {
    board = Array(boardSize * boardSize).fill('');
    currentPlayer = 'X';
    gameActive = true;
    renderBoard();
    setStatus(`${playerNames[currentPlayer]}'s turn`);
    if (vsAI && currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
    // Show replay button when game is active
    replayBtn.style.display = '';
}

function renderBoard(winPattern = null) {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    board.forEach((cell, idx) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        if (cell === 'X') cellDiv.classList.add('cell-x');
        if (cell === 'O') cellDiv.classList.add('cell-o');
        cellDiv.textContent = cell;
        // Animate cell fill
        if (cell) {
            cellDiv.classList.add('cell-animate');
            cellDiv.addEventListener('animationend', () => {
                cellDiv.classList.remove('cell-animate');
            }, { once: true });
        }
        // Highlight win
        if (winPattern && winPattern.includes(idx)) {
            cellDiv.classList.add('cell-win');
        }
        cellDiv.addEventListener('click', () => handleCellClick(idx));
        boardElement.appendChild(cellDiv);
    });
}

function handleCellClick(idx) {
    if (!gameActive || board[idx]) return;
    if (vsAI && currentPlayer === 'O') return; // Prevent human from playing as O in AI mode
    board[idx] = currentPlayer;
    moveSound.currentTime = 0;
    moveSound.play();
    const winPattern = getWinPattern();
    renderBoard(winPattern);
    if (winPattern) {
        winSound.currentTime = 0;
        winSound.play();
        setStatus(`${playerNames[currentPlayer]} wins!`);
        gameActive = false;
        showConfetti();
    } else if (board.every(cell => cell)) {
        drawSound.currentTime = 0;
        drawSound.play();
        setStatus("It's a draw!");
        gameActive = false;
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        setStatus(`${playerNames[currentPlayer]}'s turn`);
        if (vsAI && currentPlayer === 'O' && gameActive) {
            setTimeout(aiMove, 500);
        }
    }
}

function setStatus(message) {
    statusElement.textContent = message;
}

function checkWin() {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8], // rows
        [0,3,6], [1,4,7], [2,5,8], // cols
        [0,4,8], [2,4,6]           // diags
    ];
    return winPatterns.some(pattern =>
        pattern.every(idx => board[idx] === currentPlayer)
    );
}

function getWinPattern() {
    // Generate win patterns for current board size
    const patterns = [];
    // Rows
    for (let r = 0; r < boardSize; r++) {
        const row = [];
        for (let c = 0; c < boardSize; c++) {
            row.push(r * boardSize + c);
        }
        patterns.push(row);
    }
    // Columns
    for (let c = 0; c < boardSize; c++) {
        const col = [];
        for (let r = 0; r < boardSize; r++) {
            col.push(r * boardSize + c);
        }
        patterns.push(col);
    }
    // Diagonal TL-BR
    const diag1 = [];
    for (let i = 0; i < boardSize; i++) {
        diag1.push(i * boardSize + i);
    }
    patterns.push(diag1);
    // Diagonal TR-BL
    const diag2 = [];
    for (let i = 0; i < boardSize; i++) {
        diag2.push(i * boardSize + (boardSize - 1 - i));
    }
    patterns.push(diag2);
    for (let pattern of patterns) {
        if (pattern.every(idx => board[idx] === currentPlayer)) {
            return pattern;
        }
    }
    return null;
}

// Medium AI: win if possible, block if needed, else random
function aiMove() {
    if (!gameActive) return;
    // 1. Try to win
    let move = findBestMove('O');
    // 2. Block X from winning
    if (move === -1) move = findBestMove('X');
    // 3. Otherwise, random
    if (move === -1) {
        const empty = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
        move = empty[Math.floor(Math.random() * empty.length)];
    }
    board[move] = 'O';
    moveSound.currentTime = 0;
    moveSound.play();
    const winPattern = getWinPattern();
    renderBoard(winPattern);
    if (winPattern) {
        winSound.currentTime = 0;
        winSound.play();
        setStatus(`${playerNames['O']} wins!`);
        gameActive = false;
        showConfetti();
    } else if (board.every(cell => cell)) {
        drawSound.currentTime = 0;
        drawSound.play();
        setStatus("It's a draw!");
        gameActive = false;
    } else {
        currentPlayer = 'X';
        setStatus(`${playerNames[currentPlayer]}'s turn`);
    }
}

function findBestMove(player) {
    // Generate win patterns for current board size
    const patterns = [];
    // Rows
    for (let r = 0; r < boardSize; r++) {
        const row = [];
        for (let c = 0; c < boardSize; c++) {
            row.push(r * boardSize + c);
        }
        patterns.push(row);
    }
    // Columns
    for (let c = 0; c < boardSize; c++) {
        const col = [];
        for (let r = 0; r < boardSize; r++) {
            col.push(r * boardSize + c);
        }
        patterns.push(col);
    }
    // Diagonal TL-BR
    const diag1 = [];
    for (let i = 0; i < boardSize; i++) {
        diag1.push(i * boardSize + i);
    }
    patterns.push(diag1);
    // Diagonal TR-BL
    const diag2 = [];
    for (let i = 0; i < boardSize; i++) {
        diag2.push(i * boardSize + (boardSize - 1 - i));
    }
    patterns.push(diag2);
    for (let pattern of patterns) {
        const line = pattern.map(idx => board[idx]);
        if (line.filter(x => x === player).length === boardSize - 1 && line.includes('')) {
            return pattern[line.indexOf('')];
        }
    }
    return -1;
}

// Handle player name form
playerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    vsAI = gameModeSelect.value === 'ai';
    playerNames.X = playerXInput.value.trim() || 'Player X';
    if (vsAI) {
        playerNames.O = 'AI';
    } else {
        playerNames.O = playerOInput.value.trim() || 'Player O';
    }
    boardSize = parseInt(boardSizeSelect.value, 10);
    playerForm.style.display = 'none';
    boardElement.style.display = '';
    resetBtn.style.display = '';
    replayBtn.style.display = '';
    startSound.currentTime = 0;
    startSound.play();
    initializeGame();
});

resetBtn.addEventListener('click', function() {
    playerForm.style.display = '';
    boardElement.style.display = 'none';
    resetBtn.style.display = 'none';
    replayBtn.style.display = 'none';
    statusElement.textContent = '';
    playerXInput.value = '';
    playerOInput.value = '';
    gameModeSelect.value = '2p';
    updateFormForMode();
    hideConfetti();
});

replayBtn.addEventListener('click', function() {
    // Just re-initialize the game, keep names and mode
    initializeGame();
    hideConfetti();
});

document.addEventListener('DOMContentLoaded', function() {
    boardElement.style.display = 'none';
    resetBtn.style.display = 'none';
    replayBtn.style.display = 'none';
    statusElement.textContent = '';
    updateFormForMode();
}); 