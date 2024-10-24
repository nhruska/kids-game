window.addEventListener('load', () => {
  let score = 0;
  let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
  let timeLeft = 30;
  let gameActive = true;
  let streakCount = 0;
  let shapeCreationInterval;
  let timerInterval;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const gameCanvas = document.getElementById('gameCanvas');
  const scoreboard = document.getElementById('scoreboard');
  const timerElement = document.getElementById('timer');
  const progressBar = document.getElementById('progress');
  const startOverButton = document.getElementById('startOverButton');
  const highScoreValue = document.getElementById('highScoreValue');
  const highScoreAnnouncement = document.getElementById('highScoreAnnouncement');

  function createShape() {
    if (!gameActive) return;
    const shapeElement = document.createElement('div');
    shapeElement.classList.add('shape');
    shapeElement.dataset.swiped = "false";

    const shapeType = Math.floor(Math.random() * 2);
    if (shapeType === 0) {
      shapeElement.classList.add('circle');
    } else if (shapeType === 1) {
      shapeElement.classList.add('square');
    }

    const size = Math.floor(Math.random() * 60) + 20;
    shapeElement.style.width = `${size}px`;
    shapeElement.style.height = `${size}px`;
    shapeElement.style.background = getRandomGradient();
    shapeElement.style.left = `${Math.max(10, Math.random() * (window.innerWidth - size - 10))}px`;
    shapeElement.style.top = `-${size}px`;

    gameCanvas.appendChild(shapeElement);
    animateShape(shapeElement);
  }

  function getRandomGradient() {
    const colors = [
      ['#FF5733', '#FFC300'],
      ['#33FF57', '#33FFC3'],
      ['#5733FF', '#C300FF'],
      ['#FF33B5', '#FF5733']
    ];
    const randomColors = colors[Math.floor(Math.random() * colors.length)];
    return `linear-gradient(45deg, ${randomColors[0]}, ${randomColors[1]})`;
  }

  function animateShape(shape) {
    let fallSpeed = Math.random() * 2 + 1;
    const directionX = Math.random() < 0.5 ? -1 : 1;
    const shapeInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(shapeInterval);
        return;
      }
      const currentTop = parseInt(shape.style.top);
      const newLeft = parseInt(shape.style.left) + directionX * 2;

      shape.style.top = `${currentTop + fallSpeed}px`;
      shape.style.left = `${Math.min(window.innerWidth - parseInt(shape.style.width), Math.max(0, newLeft))}px`;

      if (currentTop > window.innerHeight) {
        clearInterval(shapeInterval);
        if (shape.dataset.swiped === "false") {
          shapeFallsToGround();
          resetStreak();
        }
        gameCanvas.removeChild(shape);
      }
    }, 16);

    if (score >= 50) {
      fallSpeed += 1;
    }
    if (score >= 100) {
      fallSpeed += 1;
    }
  }

  function createSwipeTrail(x, y) {
    const trail = document.createElement('div');
    trail.classList.add('trail');
    trail.style.left = `${x - 10}px`;
    trail.style.top = `${y - 10}px`;
    gameCanvas.appendChild(trail);
  }

  function showScorePopup(x, y, points) {
    const scorePopup = document.createElement('div');
    scorePopup.classList.add('score-popup');
    scorePopup.innerText = `+${points}`;
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    gameCanvas.appendChild(scorePopup);
    setTimeout(() => {
      gameCanvas.removeChild(scorePopup);
    }, 1000);
  }

  gameCanvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    createSwipeTrail(touch.pageX, touch.pageY);
    const elements = document.elementsFromPoint(touch.pageX, touch.pageY);
    elements.forEach(el => {
      if (el.classList.contains('shape') && el.dataset.swiped === "false") {
        el.dataset.swiped = "true";
        const size = parseInt(el.style.width) || 60;
        let points = Math.max(10, 100 - size);

        streakCount++;
        points += streakCount * 5;
        score += points;
        scoreboard.innerText = `Score: ${score}`;
        showScorePopup(touch.pageX, touch.pageY, points);
        playStreakSound(streakCount);
        flingShape(el, touch);
      }
    });
  });

  function flingShape(shape, touch) {
    const directionX = (touch.pageX < window.innerWidth / 2 ? -1 : 1) * (Math.random() * 300 + 200);
    const directionY = Math.random() * 300 + 200;
    shape.style.transition = 'transform 0.8s ease-out';
    shape.style.transform = `translate(${directionX}px, ${directionY}px) rotate(${Math.random() * 360}deg)`;
    setTimeout(() => {
      if (shape.parentNode) {
        gameCanvas.removeChild(shape);
      }
    }, 800);
  }

  function playStreakSound(streak) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200 + streak * 20, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function shapeFallsToGround() {
    navigator.vibrate(200);
    playNegativeFeedbackSound();
    document.body.style.backgroundColor = '#FF6347';
    setTimeout(() => {
      document.body.style.backgroundColor = '#282c34';
    }, 200);
  }

  function playNegativeFeedbackSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  function resetStreak() {
    streakCount = 0;
  }

  function updateTimer() {
    if (!gameActive) return;
    timeLeft -= 1;
    timerElement.innerText = `Time: ${timeLeft}`;
    progressBar.style.width = `${(timeLeft / 30) * 100}%`;

    if (timeLeft <= 5) {
      document.body.style.backgroundColor = timeLeft % 2 === 0 ? '#FF4500' : '#282c34';
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(shapeCreationInterval);
      gameActive = false;
      removeAllShapes();
      startOverButton.style.display = 'block';
      if (score > highScore) {
        highScore = score;
        highScoreValue.innerText = highScore;
        localStorage.setItem('highScore', highScore);
        highScoreAnnouncement.style.animation = 'none';
        highScoreAnnouncement.offsetHeight;
        highScoreAnnouncement.style.animation = '';
      }
    }
  }

  function removeAllShapes() {
    while (gameCanvas.firstChild) {
      gameCanvas.removeChild(gameCanvas.firstChild);
    }
  }

  window.startGame = function startGame() {
    highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
    highScoreValue.innerText = highScore;
    score = 0;
    timeLeft = 30;
    streakCount = 0;
    gameActive = true;
    scoreboard.innerText = `Score: ${score}`;
    timerElement.innerText = `Time: ${timeLeft}`;
    progressBar.style.width = '100%';
    startOverButton.style.display = 'none';
    document.body.style.backgroundColor = '#282c34';
    clearInterval(shapeCreationInterval);
    clearInterval(timerInterval);
    shapeCreationInterval = setInterval(createShape, 1500);
    timerInterval = setInterval(updateTimer, 1000);
  }

  shapeCreationInterval = setInterval(createShape, 1500);
  timerInterval = setInterval(updateTimer, 1000);
});
