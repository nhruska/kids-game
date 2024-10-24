const ctx = new (window.AudioContext || window.webkitAudioContext)();

let isGameActive = false;
let score = 0;
let timeLeft = 30;
let gameInterval;
let combo = 0;
let highScore = parseInt(localStorage.getItem('mathRushHighScore')) || 0;
let currentInput = "";
const elements = {
    equation: document.getElementById('equation'),
    timer: document.getElementById('time'),
    score: document.getElementById('scoreValue'),
    startBtn: document.getElementById('startBtn'),
    progress: document.getElementById('progress'),
    container: document.getElementById('container'),
    highScore: document.getElementById('highScore'),
    game: document.getElementById('game'),
    keypad: document.getElementById('keypad')
};

elements.highScore.textContent = 'High Score: ' + highScore;

elements.startBtn.addEventListener('click', () => {
    elements.startBtn.style.display = 'none';
    elements.game.style.display = 'block';
    startGame();
});

elements.keypad.addEventListener('click', (e) => {
    if (e.target.classList.contains('key')) {
        const value = e.target.textContent;
        currentInput += value;
        const answer = parseInt(currentInput);
        
        if (answer === eval(currentEquation)) {
            score += 10 * (combo + 1);
            combo++;
            createSound('correct');
            elements.score.textContent = score;
            currentInput = "";
            generateEquation();
        } else if (currentInput.length >= 2 || answer > eval(currentEquation)) {
            combo = 0;
            createSound('wrong');
            currentInput = "";
        }
    }
});

function startGame() {
    isGameActive = true;
    score = 0;
    combo = 0;
    timeLeft = 30;
    elements.timer.textContent = timeLeft;
    elements.score.textContent = score;
    generateEquation();
    gameInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        elements.progress.style.width = `${(timeLeft / 30) * 100}%`;

        if (timeLeft < 10) {
            elements.progress.style.backgroundColor = 'red';
            elements.progress.style.animation = 'blinker 1s infinite';
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function generateEquation() {
    let num1 = Math.floor(Math.random() * 10);
    let num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '*']; // Only addition and multiplication to ensure positive results
    let operator = operators[Math.floor(Math.random() * operators.length)];
    
    // Ensure division yields an integer
    if (operator === '/' && num2 === 0) {
        operator = '+';
    }
    
    if (operator === '/') {
        while (num1 % num2 !== 0) {
            num1 = Math.floor(Math.random() * 10);
            num2 = Math.floor(Math.random() * 9) + 1;
        }
    }
    
    // Ensure no negative results for subtraction
    if (operator === '-') {
        while (num1 < num2) {
            num1 = Math.floor(Math.random() * 10);
            num2 = Math.floor(Math.random() * 10);
        }
    }

    // Handle only single or double-digit results
    let result = eval(`${num1} ${operator} ${num2}`);
    while (result > 99) {
        num1 = Math.floor(Math.random() * 10);
        num2 = Math.floor(Math.random() * 10);
        operator = operators[Math.floor(Math.random() * operators.length)];
        result = eval(`${num1} ${operator} ${num2}`);
    }

    currentEquation = `${num1} ${operator} ${num2}`;
    elements.equation.textContent = currentEquation;
}

function endGame() {
    clearInterval(gameInterval);
    isGameActive = false;
    createSound('gameOver');
    elements.startBtn.style.display = 'block';
    elements.game.style.display = 'none';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('mathRushHighScore', highScore);
        createSound('highScore');
    }
    elements.highScore.textContent = 'High Score: ' + highScore;
}

function createSound(type) {
    const sounds = {
        correct: { freq: [440, 660, 880], type: 'sine', duration: 0.2, gain: 0.3 },
        wrong: { freq: [220, 165], type: 'triangle', duration: 0.3, gain: 0.2 },
        gameOver: { freq: [440, 220, 110], type: 'sawtooth', duration: 0.4, gain: 0.3 },
        highScore: { freq: [880, 1100, 1320], type: 'sine', duration: 0.5, gain: 0.4 }
    }[type];

    sounds.freq.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = sounds.type;
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(sounds.gain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sounds.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + sounds.duration + i * 0.08);
    });
}

let currentEquation = '';
