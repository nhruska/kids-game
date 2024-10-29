// Audio Context and global state
let audioContext = null;
let isPlaying = false;
let currentStep = 0;
let stepInterval = null;

// Initialize everything when the play button is clicked
document.getElementById('playButton').addEventListener('click', () => {
    // Initialize audio context on first click
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        setupPatterns();
    }
    togglePlay();
});

// Patterns for each instrument
const patterns = {
    drums: Array(8).fill(false),
    bass: Array(8).fill(false),
    guitar: Array(8).fill(false),
    lead: Array(8).fill(false)
};

// Musical constants for different keys
const NOTES = {
    'C': {
        bass: 65.41,  // C2
        guitar: [261.63, 329.63, 392.00], // C4, E4, G4
        lead: 523.25  // C5
    },
    'G': {
        bass: 98.00,  // G2
        guitar: [392.00, 493.88, 587.33], // G4, B4, D5
        lead: 783.99  // G5
    },
    'D': {
        bass: 73.42,  // D2
        guitar: [293.66, 369.99, 440.00], // D4, F#4, A4
        lead: 587.33  // D5
    }
};

// Setup initial patterns
function setupPatterns() {
    // Create grids
    Object.keys(patterns).forEach(instrument => {
        const grid = document.getElementById(`${instrument}Grid`);
        if (grid) {
            grid.innerHTML = ''; // Clear existing
            patterns[instrument].forEach((_, i) => {
                const step = document.createElement('button');
                step.className = 'step';
                step.onclick = () => toggleStep(instrument, i);
                grid.appendChild(step);
            });
        }
    });

    // Set default pattern
    patterns.drums[0] = patterns.drums[4] = true; // Kick on 1 and 3
    patterns.bass[0] = patterns.bass[4] = true;   // Bass follows kick
    patterns.guitar[0] = patterns.guitar[4] = true; // Guitar on main beats
    updateGrids();

    // Setup volume controls
    ['drum', 'bass', 'guitar', 'lead'].forEach(instrument => {
        const volumeSlider = document.getElementById(`${instrument}Volume`);
        if (volumeSlider) {
            volumeSlider.oninput = (e) => {
                const valueDisplay = document.getElementById(`${instrument}VolumeValue`);
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
            };
        }
    });

    // Setup tempo control
    const tempoSlider = document.getElementById('tempo');
    if (tempoSlider) {
        tempoSlider.oninput = (e) => {
            const tempoDisplay = document.getElementById('tempoValue');
            if (tempoDisplay) {
                tempoDisplay.textContent = e.target.value;
            }
            if (isPlaying) {
                stopSequencer();
                startSequencer();
            }
        };
    }
}

function toggleStep(instrument, step) {
    patterns[instrument][step] = !patterns[instrument][step];
    updateGrids();
}

function updateGrids() {
    Object.keys(patterns).forEach(instrument => {
        const grid = document.getElementById(`${instrument}Grid`);
        if (grid) {
            Array.from(grid.children).forEach((step, i) => {
                step.className = `step${patterns[instrument][i] ? ' active' : ''}${i === currentStep ? ' playing' : ''}`;
            });
        }
    });
}

function playDrum(type) {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const volume = document.getElementById('drumVolume')?.value / 100 || 0.8;

    switch(type) {
        case 'kick':
            osc.frequency.setValueAtTime(150, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            gain.gain.setValueAtTime(volume, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            break;
        case 'snare':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, audioContext.currentTime);
            gain.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            break;
        case 'hihat':
            osc.type = 'square';
            osc.frequency.setValueAtTime(1000, audioContext.currentTime);
            gain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            break;
    }

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
}

function playNote(frequency, instrument) {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const volume = document.getElementById(`${instrument}Volume`)?.value / 100 || 0.5;

    osc.type = instrument === 'bass' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
}

function playStep() {
    const key = document.getElementById('key')?.value || 'C';
    const currentNotes = NOTES[key];

    // Play drums
    if (patterns.drums[currentStep]) {
        if (currentStep % 4 === 0) playDrum('kick');
        if (currentStep % 2 === 0) playDrum('snare');
        playDrum('hihat');
    }

    // Play bass
    if (patterns.bass[currentStep]) {
        playNote(currentNotes.bass, 'bass');
    }

    // Play guitar chord
    if (patterns.guitar[currentStep]) {
        currentNotes.guitar.forEach(note => playNote(note, 'guitar'));
    }

    // Play lead
    if (patterns.lead[currentStep]) {
        playNote(currentNotes.lead, 'lead');
    }

    // Update step
    currentStep = (currentStep + 1) % 8;
    updateGrids();
}

function startSequencer() {
    const tempo = document.getElementById('tempo')?.value || 120;
    const stepTime = (60 / tempo) / 2; // eighth notes
    stepInterval = setInterval(playStep, stepTime * 1000);
}

function stopSequencer() {
    clearInterval(stepInterval);
    currentStep = 0;
    updateGrids();
}

function togglePlay() {
    isPlaying = !isPlaying;
    const playButton = document.getElementById('playButton');
    
    if (isPlaying) {
        playButton.textContent = '⏸️ Stop';
        startSequencer();
    } else {
        playButton.textContent = '▶️ Play';
        stopSequencer();
    }
}