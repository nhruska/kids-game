const BONUS_INTERVAL = 5;

const gameState = {
  score: 0,
  mergeCount: 0,
  spawnCount: 0,
  selectedGem: null,
  grid: [],
  size: { rows: 4, cols: 4 }
};

function determineSpawnLevel() {
  gameState.spawnCount++;
  
  // Check for high level presence (6 or 7)
  const hasHighLevel = gameState.grid.flat().some(cell => cell >= 6);
  
  // Super aggressive level 1 spawning with high levels
  if (hasHighLevel) {
    if (gameState.spawnCount % 3 === 0) {
      return { level: 1, guaranteed: true };
    }
    
    const roll = Math.random() * 100;
    if (roll < 60) return { level: 1, guaranteed: false };
  }

  // Special rule for very late game (50+ merges)
  if (gameState.mergeCount >= 50) {
    const roll = Math.random() * 100;
    if (roll < 70) return { level: 1, guaranteed: false };
  }

  if (gameState.mergeCount > 0 && gameState.mergeCount % BONUS_INTERVAL === 0) {
    if (gameState.mergeCount >= 40) {
      const roll = Math.random() * 100;
      if (roll < 50) return { level: 1, guaranteed: true };
      if (roll < 80) return { level: 2, guaranteed: true };
      return { level: 3, guaranteed: true };
    }
  }

  const random = Math.random() * 100;
  if (gameState.mergeCount >= 30) {
    if (random < 40) return { level: 1, guaranteed: false };
    if (random < 60) return { level: 2, guaranteed: false };
    if (random < 75) return { level: 3, guaranteed: false };
  }

  return { level: 1, guaranteed: false };
}

function spawnBonusGem(level) {
  const emptyCells = [];
  gameState.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        emptyCells.push([rowIndex, colIndex]);
      }
    });
  });

  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const gem = createGem(level, true);
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.appendChild(gem);
    gameState.grid[row][col] = level;
  }
}

function handleMerge(newLevel, cell2) {
  // Spawn bonus gem for high-level merges
  if (newLevel >= 5) {
    setTimeout(() => spawnBonusGem(newLevel - 1), 300);
  }
  
  const newGem = createGem(newLevel);
  newGem.classList.add('merging');
  cell2.appendChild(newGem);
}

function createGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  gameState.grid = [];

  for (let row = 0; row < gameState.size.rows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < gameState.size.cols; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      grid.appendChild(cell);
      gameState.grid[row][col] = null;
    }
  }

  for (let i = 0; i < 6; i++) {
    addRandomGem();
  }
}

function createGem(level = 1, guaranteed = false) {
  const gem = document.createElement('div');
  gem.className = `gem level${level}`;
  if (guaranteed) gem.classList.add('guaranteed');
  gem.dataset.level = level;
  gem.textContent = level;
  gem.addEventListener('click', handleGemClick);
  return gem;
}

function addRandomGem() {
  const emptyCells = [];
  gameState.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        emptyCells.push([rowIndex, colIndex]);
      }
    });
  });

  if (emptyCells.length === 0) {
    checkGameOver();
    return;
  }

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const spawn = determineSpawnLevel();
  const gem = createGem(spawn.level, spawn.guaranteed);
  
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.appendChild(gem);
  gameState.grid[row][col] = spawn.level;
}

function handleGemClick(event) {
  const clickedGem = event.target;
  const currentLevel = parseInt(clickedGem.dataset.level);
  
  if (gameState.selectedGem === clickedGem) {
    clickedGem.classList.remove('selected');
    gameState.selectedGem = null;
  } else if (!gameState.selectedGem) {
    clickedGem.classList.add('selected');
    gameState.selectedGem = clickedGem;
  } else if (gameState.selectedGem.dataset.level === clickedGem.dataset.level) {
    const newLevel = currentLevel + 1;
    const points = Math.pow(2, newLevel) * 10;
    
    const rect1 = gameState.selectedGem.getBoundingClientRect();
    const rect2 = clickedGem.getBoundingClientRect();
    
    const cell1 = gameState.selectedGem.parentNode;
    const cell2 = clickedGem.parentNode;
    gameState.grid[cell1.dataset.row][cell1.dataset.col] = null;
    gameState.grid[cell2.dataset.row][cell2.dataset.col] = newLevel;
    
    gameState.selectedGem.remove();
    clickedGem.remove();
    
    handleMerge(newLevel, cell2);
    
    const pointsElem = document.createElement('div');
    pointsElem.className = 'points';
    pointsElem.textContent = `+${points}`;
    pointsElem.style.left = `${(rect1.left + rect2.left) / 2}px`;
    pointsElem.style.top = `${(rect1.top + rect2.top) / 2}px`;
    document.body.appendChild(pointsElem);
    setTimeout(() => pointsElem.remove(), 800);
    
    gameState.score += points;
    gameState.mergeCount++;
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('mergeCount').textContent = gameState.mergeCount;
    updateBonusDisplay();
    
    gameState.selectedGem = null;
    
    setTimeout(addRandomGem, 300);
  } else {
    gameState.selectedGem.classList.remove('selected');
    clickedGem.classList.add('selected');
    gameState.selectedGem = clickedGem;
  }
}

function updateBonusDisplay() {
  const remainingMerges = BONUS_INTERVAL - (gameState.mergeCount % BONUS_INTERVAL);
  document.getElementById('nextBonus').textContent = remainingMerges;
}

function checkGameOver() {
  let hasMoves = false;
  
  for (let row = 0; row < gameState.size.rows; row++) {
    for (let col = 0; col < gameState.size.cols; col++) {
      const currentLevel = gameState.grid[row][col];
      if (!currentLevel) continue;
      
      const neighbors = [
        [row, col + 1],
        [row + 1, col],
        [row, col - 1],
        [row - 1, col]
      ];
      
      for (const [nRow, nCol] of neighbors) {
        if (nRow >= 0 && nRow < gameState.size.rows && 
            nCol >= 0 && nCol < gameState.size.cols && 
            gameState.grid[nRow][nCol] === currentLevel) {
          hasMoves = true;
          break;
        }
      }
      
      if (hasMoves) break;
    }
    if (hasMoves) break;
  }
  
  if (!hasMoves) {
    endGame();
  }
}

function endGame() {
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('message').style.display = 'block';
}

function startGame() {
  gameState.score = 0;
  gameState.mergeCount = 0;
  gameState.spawnCount = 0;
  gameState.selectedGem = null;
  document.getElementById('scoreDisplay').textContent = '0';
  document.getElementById('mergeCount').textContent = '0';
  document.getElementById('message').style.display = 'none';
  updateBonusDisplay();
  createGrid();
}

startGame();