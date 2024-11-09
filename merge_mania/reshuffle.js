const BONUS_INTERVAL = 5;
const MAX_RESHUFFLE_PENALTY = 100; // Points deducted for each reshuffle

const gameState = {
  score: 0,
  mergeCount: 0,
  spawnCount: 0,
  reshuffleCount: 0,
  selectedGem: null,
  grid: [],
  size: { rows: 4, cols: 4 }
};

function determineSpawnLevel() {
  gameState.spawnCount++;
  
  // Check for level distribution
  const gemCounts = countGemLevels();
  const highestLevel = Math.max(...Object.keys(gemCounts).map(Number));
  
  // Guaranteed spawns based on game state
  if (gameState.mergeCount > 0 && gameState.mergeCount % BONUS_INTERVAL === 0) {
    if (gameState.mergeCount >= 40) {
      const roll = Math.random() * 100;
      if (roll < 40) return { level: 1, guaranteed: true };
      if (roll < 70) return { level: 2, guaranteed: true };
      return { level: 3, guaranteed: true };
    }
  }

  // Dynamic spawn rates based on board state
  const totalGems = Object.values(gemCounts).reduce((a, b) => a + b, 0);
  let spawnTable = calculateSpawnTable(gemCounts, highestLevel, totalGems);
  
  // Roll for gem level
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [level, chance] of Object.entries(spawnTable)) {
    cumulative += chance;
    if (roll < cumulative) {
      return { level: parseInt(level), guaranteed: false };
    }
  }

  // Fallback to level 1
  return { level: 1, guaranteed: false };
}

function calculateSpawnTable(gemCounts, highestLevel, totalGems) {
  let spawnTable = {};
  
  // Base chances
  spawnTable[1] = 50;  // 50% for level 1
  spawnTable[2] = 30;  // 30% for level 2
  spawnTable[3] = 15;  // 15% for level 3
  spawnTable[4] = 5;   // 5% for level 4
  
  // Adjust based on board state
  for (let level = 1; level <= highestLevel; level++) {
    const count = gemCounts[level] || 0;
    
    // Increase chance of spawning levels that are underrepresented
    if (count === 0 && level <= Math.min(highestLevel, 4)) {
      spawnTable[level] += 20;
    }
    // Decrease chance of spawning overrepresented levels
    else if (count >= 3) {
      spawnTable[level] = Math.max(0, spawnTable[level] - 15);
    }
  }
  
  // Normalize probabilities
  const total = Object.values(spawnTable).reduce((a, b) => a + b, 0);
  for (const level in spawnTable) {
    spawnTable[level] = (spawnTable[level] / total) * 100;
  }
  
  return spawnTable;
}

function countGemLevels() {
  const counts = {};
  for (const row of gameState.grid) {
    for (const cell of row) {
      if (cell) {
        counts[cell] = (counts[cell] || 0) + 1;
      }
    }
  }
  return counts;
}

function updateBonusDisplay() {
  const remainingMerges = BONUS_INTERVAL - (gameState.mergeCount % BONUS_INTERVAL);
  document.getElementById('nextBonus').textContent = remainingMerges;
}

function countEmptyCells() {
  return gameState.grid.flat().filter(cell => cell === null).length;
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
    checkGameState();
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
    
    const newGem = createGem(newLevel);
    newGem.classList.add('merging');
    cell2.appendChild(newGem);
    
    const pointsElem = document.createElement('div');
    pointsElem.className = 'points';
    pointsElem.textContent = `+${points}`;
    pointsElem.style.left = `${(rect1.left + rect2.left) / 2}px`;
    pointsElem.style.top = `${(rect1.top + rect2.top) / 2}px`;
    document.body.appendChild(pointsElem);
    setTimeout(() => pointsElem.remove(), 800);
    
    gameState.score += points;
    gameState.mergeCount++;
    updateDisplays();
    
    gameState.selectedGem = null;
    
    setTimeout(() => {
      addRandomGem();
      checkGameState();
    }, 300);
  } else {
    gameState.selectedGem.classList.remove('selected');
    clickedGem.classList.add('selected');
    gameState.selectedGem = clickedGem;
  }
}

function updateDisplays() {
  document.getElementById('scoreDisplay').textContent = gameState.score;
  document.getElementById('mergeCount').textContent = gameState.mergeCount;
  document.getElementById('reshuffleCount').textContent = gameState.reshuffleCount;
  updateBonusDisplay();
}

function checkGameState() {
  if (hasValidMoves()) return;
  
  // No valid moves available
  const emptyCells = countEmptyCells();
  
  if (emptyCells > 0) {
    // Still has empty cells, just add a new gem
    addRandomGem();
  } else {
    // Board is full, need to reshuffle
    reshuffleBoard();
  }
}

function hasValidMoves() {
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
          return true;
        }
      }
    }
  }
  return false;
}

function reshuffleBoard() {
  gameState.reshuffleCount++;
  
  // Collect all gems and their levels
  const gems = [];
  gameState.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        gems.push({
          level: cell,
          row: rowIndex,
          col: colIndex
        });
      }
    });
  });

  // Clear the grid
  for (let row = 0; row < gameState.size.rows; row++) {
    for (let col = 0; col < gameState.size.cols; col++) {
      gameState.grid[row][col] = null;
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      cell.innerHTML = '';
    }
  }

  // Add some new gems to ensure matches are possible
  const newGemCount = Math.min(2, Math.floor(gems.length / 4));
  for (let i = 0; i < newGemCount; i++) {
    const spawn = determineSpawnLevel();
    gems.push({ level: spawn.level });
  }

  // Shuffle and redistribute gems
  for (const gem of shuffleArray(gems)) {
    let placed = false;
    while (!placed) {
      const row = Math.floor(Math.random() * gameState.size.rows);
      const col = Math.floor(Math.random() * gameState.size.cols);
      
      if (!gameState.grid[row][col]) {
        gameState.grid[row][col] = gem.level;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const newGem = createGem(gem.level);
        newGem.classList.add('reshuffling');
        cell.appendChild(newGem);
        placed = true;
      }
    }
  }

  // Apply score penalty
  const penalty = Math.min(gameState.score, MAX_RESHUFFLE_PENALTY);
  if (penalty > 0) {
    gameState.score -= penalty;
    const pointsElem = document.createElement('div');
    pointsElem.className = 'points';
    pointsElem.textContent = `-${penalty}`;
    pointsElem.style.color = '#FF4B2B';
    pointsElem.style.left = '50%';
    pointsElem.style.top = '50%';
    document.body.appendChild(pointsElem);
    setTimeout(() => pointsElem.remove(), 800);
  }
  
  updateDisplays();
  
  // Check if the reshuffle created valid moves
  setTimeout(() => {
    if (!hasValidMoves()) {
      addRandomGem();
    }
  }, 500);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startGame() {
  gameState.score = 0;
  gameState.mergeCount = 0;
  gameState.spawnCount = 0;
  gameState.reshuffleCount = 0;
  gameState.selectedGem = null;
  document.getElementById('message').style.display = 'none';
  updateDisplays();
  createGrid();
}

startGame();