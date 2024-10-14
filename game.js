document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splash-screen");
    const miniGames = document.querySelectorAll(".mini-game");
    const successScreen = document.getElementById("success-screen");
    const startGameButton = document.getElementById("start-game-button");
    const nextGameButton = document.getElementById("next-game-button");

    let currentGameIndex = 0;

    // Start Game Button Click Event
    startGameButton.addEventListener("click", () => {
        splashScreen.style.display = "none";
        startMiniGame(currentGameIndex);
    });

    // Next Game Button Click Event
    nextGameButton.addEventListener("click", () => {
        successScreen.style.display = "none";
        currentGameIndex++;
        if (currentGameIndex < miniGames.length) {
            startMiniGame(currentGameIndex);
        } else {
            alert("Congratulations! You've completed all the challenges!");
            splashScreen.style.display = "block";
            currentGameIndex = 0;
        }
    });

    // Start a Mini-Game
    function startMiniGame(index) {
        const miniGame = miniGames[index];
        miniGame.style.display = "block";

        if (index === 0) {
            initSwipeAwayPollution();
        } else if (index === 1) {
            initForestRestoration();
        } else if (index === 2) {
            initTrashSorting();
        }
    }

    // Complete Mini-Game
    function completeMiniGame(index) {
        miniGames[index].style.display = "none";
        successScreen.style.display = "block";
    }

    // Mini-Game 1: Swipe Away Pollution
    function initSwipeAwayPollution() {
        let pollutionLevel = 100;
        const pollutionLevelElement = document.getElementById("pollution-level");
        const swipeArea = document.getElementById("swipe-area");

        swipeArea.addEventListener("swipe", () => {
            if (pollutionLevel > 0) {
                pollutionLevel -= 10;
                pollutionLevelElement.textContent = `${pollutionLevel}%`;
            }
            if (pollutionLevel <= 0) {
                completeMiniGame(0);
            }
        });
    }

    // Mini-Game 2: Forest Restoration
    function initForestRestoration() {
        let forestHealth = 80;
        const forestHealthElement = document.getElementById("forest-health");
        const plantTreeButton = document.getElementById("plant-tree-button");
        const placeShelterButton = document.getElementById("place-shelter-button");

        function improveForestHealth(amount) {
            if (forestHealth < 100) {
                forestHealth += amount;
                forestHealthElement.textContent = `${forestHealth}%`;
            }
            if (forestHealth >= 100) {
                completeMiniGame(1);
            }
        }

        plantTreeButton.addEventListener("click", () => improveForestHealth(10));
        placeShelterButton.addEventListener("click", () => improveForestHealth(10));
    }

    // Mini-Game 3: Trash Sorting
    function initTrashSorting() {
        const trashItems = document.querySelectorAll(".trash-item");
        const bins = document.querySelectorAll(".bin");

        trashItems.forEach(item => {
            item.addEventListener("dragstart", dragStart);
        });

        bins.forEach(bin => {
            bin.addEventListener("dragover", dragOver);
            bin.addEventListener("drop", drop);
        });

        function dragStart(event) {
            event.dataTransfer.setData("text", event.target.dataset.type);
            event.dataTransfer.setData("itemId", event.target.id);
        }

        function dragOver(event) {
            event.preventDefault();
        }

        function drop(event) {
            event.preventDefault();
            const itemType = event.dataTransfer.getData("text");
            const itemId = event.dataTransfer.getData("itemId");
            const binType = event.target.dataset.type;

            if (itemType === binType) {
                const item = document.getElementById(itemId);
                event.target.appendChild(item);
                item.setAttribute("draggable", "false");
                checkAllSorted();
            } else {
                alert("Incorrect bin! Try again.");
            }
        }

        function checkAllSorted() {
            const remainingItems = document.querySelectorAll(".trash-item[draggable='true']");
            if (remainingItems.length === 0) {
                completeMiniGame(2);
            }
        }
    }
});