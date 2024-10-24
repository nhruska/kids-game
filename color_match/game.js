// Audio Context
const ctx = new (window.AudioContext || window.webkitAudioContext)();

// Game state
let isGameActive = false;
let score = 0;
let timeLeft = 30;
let gameInterval;
let targetColor;
let combo = 0;
let highScore = parseInt(localStorage.getItem('colorMatchHighScore')) || 0;
const colors = ['#f87171', '#4ade80', '#60a5fa', '#fbbf24', '#8b5cf6', '#ec4899'];

// DOM elements
const elements = {
    grid: document.getElementById('grid'),
    target: document.getElementById('target'),
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    startBtn: document.getElementById('startBtn'),
    progress: document.getElementById('progress'),
    container: document.getElementById('container'),
    highScore: document.getElementById('highScore')
};

// Initialize high score display
elements.highScore.textContent = highScore;

// Sound effects
function createSound(type) {
    const sounds = {
        tap: { freq: [440], type: 'sine', duration: 0.1, gain: 0.2 },
        correct: { freq: [440, 660, 880], type: 'sine', duration: 0.2, gain: 0.3 },
        wrong: { freq: [220, 165], type: 'triangle', duration: 0.3, gain: 0.2 },
        combo: { freq: [440, 550, 660, 880], type: 'sine', duration: 0.3, gain: 0.3 },
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

// Visual effects
function createParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--color', color);
        particle.style.width = `${Math.random() * 8 + 4}px`;
        particle.style.height = particle.style.width;
        
        const angle = (i / count) * Math.PI * 2;
        particle.style.setProperty('--x', Math.cos(angle));
        particle.style.setProperty('--y', Math.sin(angle));
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

function showComboText(text, color = '#fff') {
    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = text;
    comboText.style.color = color;
    document.body.appendChild(comboText);
    setTimeout(() => comboText.remove(), 600);
}

function createScorePopup(x, y, points, isCorrect) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.color = isCorrect ? '#4ade80' : '#ef4444';
    popup.textContent = isCorrect ? `+${points}` : `-${points}`;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 600);
}

function shakeScreen() {
    elements.container.classList.add('shake');
    setTimeout(() => elements.container.classList.remove('shake'), 500);
}

function updateTimerState() {
    const progress = elements.progress;
    progress.classList.remove('normal', 'warning', 'danger');
    elements.timer.classList.remove('warning', 'danger');
    document.body.classList.remove('warning', 'danger');

    if (timeLeft <= 5) {
        progress.classList.add('danger');
        elements.timer.classList.add('danger');
        document.body.classList.add('danger');
        createSound('wrong');
    } else if (timeLeft <= 10) {
        progress.classList.add('warning');
        elements.timer.classList.add('warning');
        document.body.classList.add('warning');
        if (timeLeft === 10) createSound('wrong');
    } else {
        progress.classList.add('normal');
    }
}

function updateTimer() {
    elements.timer.textContent = timeLeft;
    elements.progress.style.transform = `scaleX(${timeLeft / 30})`;
    
    updateTimerState();
    
    if (timeLeft === 0) {
        endGame();
    }
    timeLeft--;
}

function setNewTarget() {
    targetColor = colors[Math.floor(Math.random() * colors.length)];
    elements.target.style.backgroundColor = targetColor;
    elements.target.classList.add('pulse');
    setTimeout(() => elements.target.classList.remove('pulse'), 500);
}

function checkHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('colorMatchHighScore', highScore);
        elements.highScore.textContent = highScore;
        
        showComboText('NEW HIGH SCORE! 🏆', '#ffd700');
        createSound('highScore');
        
        // Celebrate with particles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                createParticles(x, y, '#ffd700', 20);
            }, i * 200);
        }
    }
}

function updateGrid() {
    elements.grid.innerHTML = '';
    [...colors]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .forEach(color => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundColor = color;
            
            tile.addEventListener('click', (e) => {
                if (!isGameActive) return;
                
                const rect = tile.getBoundingClientRect();
                tile.style.setProperty('--x', `${(e.clientX - rect.left) / rect.width * 100}%`);
                tile.style.setProperty('--y', `${(e.clientY - rect.top) / rect.height * 100}%`);
                
                createSound('tap');
                
                if (color === targetColor) {
                    tile.classList.add('correct');
                    combo++;
                    
                    // Calculate points with combo multiplier
                    const multiplier = 1 + Math.floor(combo / 3);
                    const points = 10 * multiplier;
                    score += points;
                    elements.score.textContent = score;
                    
                    // Visual feedback
                    createParticles(e.clientX, e.clientY, color, 12 + Math.min(combo * 2, 30));
                    createScorePopup(e.clientX, e.clientY, points, true);
                    
                    if (combo >= 10) {
                        showComboText('UNSTOPPABLE!!! 🔥');
                        createSound('combo');
                        shakeScreen();
                    } else if (combo >= 7) {
                        showComboText('AMAZING!! ⭐');
                        createSound('combo');
                    } else if (combo >= 4) {
                        showComboText('PERFECT! ✨');
                        createSound('correct');
                    } else {
                        createSound('correct');
                    }
                    
                    checkHighScore();
                    
                    setTimeout(() => {
                        if (isGameActive) {
                            tile.classList.remove('correct');
                            setNewTarget();
                            updateGrid();
                        }
                    }, 300);
                } else {
                    tile.classList.add('wrong');
                    combo = 0;
                    score = Math.max(0, score - 5);
                    elements.score.textContent = score;
                    
                    createParticles(e.clientX, e.clientY, '#ef4444', 6);
                    createScorePopup(e.clientX, e.clientY, 5, false);
                    createSound('wrong');
                    shakeScreen();
                    
                    setTimeout(() => tile.classList.remove('wrong'), 400);
                }
            });
            
            elements.grid.appendChild(tile);
        });
}

function endGame() {
    isGameActive = false;
    elements.grid.classList.add('disabled');
    createSound('gameOver');
    shakeScreen();
    
    clearInterval(gameInterval);
    elements.startBtn.disabled = false;
    elements.startBtn.textContent = 'Play Again';
    
    checkHighScore();
    showComboText('GAME OVER!', '#ef4444');
}

function startGame() {
    ctx.resume();
    score = 0;
    timeLeft = 30;
    combo = 0;
    isGameActive = true;
    
    elements.score.textContent = score;
    elements.timer.textContent = timeLeft;
    elements.startBtn.disabled = true;
    elements.grid.classList.remove('disabled');
    elements.progress.style.transform = 'scaleX(1)';
    elements.progress.classList.add('normal');
    document.body.classList.remove('warning', 'danger');
    
    setNewTarget();
    updateGrid();
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateTimer, 1000);
}

// Initialize game
elements.startBtn.addEventListener('click', startGame);