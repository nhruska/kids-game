// Word list with hints grouped by difficulty
const words = [
    // Easy words
    {word: 'MOON', hint: 'Earth\'s natural satellite'},
    {word: 'STAR', hint: 'Twinkles in the night sky'},
    {word: 'SUN', hint: 'Center of our solar system'},
    {word: 'MARS', hint: 'The red planet'},
    {word: 'ATOM', hint: 'Smallest unit of matter'},
    // Medium words
    {word: 'COMET', hint: 'Ice and rock in space'},
    {word: 'PLANET', hint: 'Orbits around the sun'},
    {word: 'ROCKET', hint: 'Space vehicle'},
    {word: 'METEOR', hint: 'Shooting star'},
    {word: 'SATURN', hint: 'Planet with rings'},
    // Hard words
    {word: 'ASTEROID', hint: 'Small rocky body in space'},
    {word: 'TELESCOPE', hint: 'Tool to view distant objects'},
    {word: 'ASTRONAUT', hint: 'Space explorer'},
    {word: 'GALAXY', hint: 'Collection of stars and planets'},
    {word: 'NEBULA', hint: 'Cloud of gas and dust in space'},
    // Expert words
    {word: 'SATELLITE', hint: 'Object orbiting a planet'},
    {word: 'SPACESHIP', hint: 'Vehicle for space travel'},
    {word: 'SUPERNOVA', hint: 'Exploding star'},
    {word: 'ASTRONOMY', hint: 'Study of space'},
    {word: 'UNIVERSE', hint: 'All of space and time'}
];

// Game state variables
let currentWord = '';
let guessedLetters = new Set();
let remainingGuesses = 8;
let score = 0;

// Create particle effects for celebrations
function createParticles(x, y, count = 20) {
    const particles = document.createElement('div');
    particles.className = 'particles';
    document.body.appendChild(particles);

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 8 + 4 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
        particle.style.setProperty('--ty', (Math.random() * -200 - 50) + 'px');
        particles.appendChild(particle);
    }

    setTimeout(() => particles.remove(), 1000);
}

// Sound effects using Web Audio API
function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'click':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'success':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'error':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Update the rocket visualization
function updateRocket() {
    const partsToShow = 8 - remainingGuesses;
    for (let i = 1; i <= 8; i++) {
        const part = document.getElementById(`part${i}`);
        if (i <= partsToShow) {
            part.classList.add('visible');
        } else {
            part.classList.remove('visible');
        }
    }
}

// Create the keyboard interface
function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        const button = document.createElement('button');
        button.className = 'key';
        button.textContent = letter;
        button.addEventListener('click', () => guessLetter(letter));
        keyboard.appendChild(button);
    });
}

// Update the word display with guessed letters
function updateWordDisplay() {
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.innerHTML = '';
    currentWord.split('').forEach(letter => {
        const slot = document.createElement('div');
        slot.className = 'letter-slot';
        if (guessedLetters.has(letter)) {
            slot.textContent = letter;
            slot.classList.add('pop');
        }
        wordDisplay.appendChild(slot);
    });
}

// Check if the player has won
function checkWin() {
    return currentWord.split('').every(letter => guessedLetters.has(letter));
}

// Process a letter guess
function guessLetter(letter) {
    if (guessedLetters.has(letter)) return;
    
    playSound('click');
    guessedLetters.add(letter);
    
    const button = document.querySelector(`.key:nth-child(${letter.charCodeAt(0) - 64})`);
    
    if (currentWord.includes(letter)) {
        button.classList.add('correct');
        updateWordDisplay();
        
        if (checkWin()) {
            playSound('success');
            const wordDisplay = document.getElementById('wordDisplay');
            wordDisplay.classList.add('win-animation');
            document.getElementById('status').textContent = 'Congratulations! You won! 🚀';
            score += remainingGuesses * 10;
            document.getElementById('score').textContent = score;
            
            // Create celebration particles
            const rect = wordDisplay.getBoundingClientRect();
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    createParticles(
                        rect.left + Math.random() * rect.width,
                        rect.top + Math.random() * rect.height
                    );
                }, i * 200);
            }
            
            disableKeyboard();
        }
    } else {
        button.classList.add('wrong');
        remainingGuesses--;
        updateRocket();
        playSound('error');
        
        if (remainingGuesses === 0) {
            document.getElementById('status').textContent = `Game Over! The word was ${currentWord}`;
            disableKeyboard();
        }
    }
}

// Disable keyboard after game end
function disableKeyboard() {
    document.querySelectorAll('.key').forEach(button => button.disabled = true);
}

// Start a new game
function startNewGame() {
    const wordObj = words[Math.floor(Math.random() * words.length)];
    currentWord = wordObj.word;
    guessedLetters.clear();
    remainingGuesses = 8;
    
    document.getElementById('hint').textContent = `Hint: ${wordObj.hint}`;
    document.getElementById('status').textContent = '';
    document.getElementById('wordDisplay').classList.remove('win-animation');
    
    updateRocket();
    createKeyboard();
    updateWordDisplay();
}

// Add keyboard support
document.addEventListener('keydown', (event) => {
    const letter = event.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
        const button = document.querySelector(`.key:nth-child(${letter.charCodeAt(0) - 64})`);
        if (button && !button.disabled) {
            guessLetter(letter);
        }
    }
});

// Initialize game
document.getElementById('newGameButton').addEventListener('click', () => {
    playSound('click');
    startNewGame();
});

startNewGame();