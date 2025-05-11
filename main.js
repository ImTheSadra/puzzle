let solving = false;

document.addEventListener('DOMContentLoaded', function () {
    const puzzleContainer = document.getElementById('puzzle-container');
    const solutionStepsContainer = document.getElementById('solution-steps');
    const tiles = [];
    let moveSequence = [];
    let currentStep = 0;
    let initialState = [];
    let solving = false;

    function createTiles() {
        puzzleContainer.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const tile = document.createElement('div');
            tile.className = `tile flex items-center justify-center rounded-lg text-2xl font-bold cursor-pointer ${
                i === 8 ? 'empty' : 'bg-white border border-gray-200 text-indigo-700'
            }`;
            
            tile.textContent = i === 8 ? '' : i + 1;
            tile.dataset.value = i === 8 ? 0 : i + 1;
            tile.dataset.index = i;
            puzzleContainer.appendChild(tile);
            tiles.push(tile);
            tile.addEventListener('click', () => handleTileClick(i));
        }
        updateState();
    }

    function updateState() {
        initialState = tiles.map(t => parseInt(t.dataset.value));
    }

    function resetPuzzle() {
        const solved = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        tiles.forEach((tile, i) => {
            tile.dataset.value = solved[i];
            tile.textContent = solved[i] === 0 ? '' : solved[i];
            tile.classList.toggle('empty', solved[i] === 0);
        });
        moveSequence = [];
        currentStep = 0;
        solving = false;
        updateState();
        updateStats('-', '-', '-', '-');
        clearSolutionSteps();
        enableNavButtons(false);
    }

    function shufflePuzzle() {
        if (solving) return;
        
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let emptyIndex = 8;
        
        for (let i = 0; i < 100; i++) {
            const validMoves = getValidMoves(emptyIndex);
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            [values[emptyIndex], values[randomMove]] = [values[randomMove], values[emptyIndex]];
            emptyIndex = randomMove;
        }
        
        values.forEach((val, i) => {
            tiles[i].dataset.value = val;
            tiles[i].textContent = val === 0 ? '' : val;
            tiles[i].classList.toggle('empty', val === 0);
        });
        updateState();
    }

    function getEmptyIndex() {
        return tiles.findIndex(t => parseInt(t.dataset.value) === 0);
    }

    function getValidMoves(emptyIndex) {
        const row = Math.floor(emptyIndex / 3);
        const col = emptyIndex % 3;
        const moves = [];
        if (row > 0) moves.push(emptyIndex - 3); // Up
        if (row < 2) moves.push(emptyIndex + 3); // Down
        if (col > 0) moves.push(emptyIndex - 1); // Left
        if (col < 2) moves.push(emptyIndex + 1); // Right
        return moves;
    }

    function handleTileClick(index) {
        if (solving) return;
        
        const emptyIndex = getEmptyIndex();
        const valid = getValidMoves(emptyIndex);
        if (valid.includes(index)) {
            swapTiles(index, emptyIndex);
            updateState();
        }
    }

    function swapTiles(i, j) {
        const tempVal = tiles[i].dataset.value;
        tiles[i].dataset.value = tiles[j].dataset.value;
        tiles[j].dataset.value = tempVal;

        tiles[i].textContent = tiles[i].dataset.value == 0 ? '' : tiles[i].dataset.value;
        tiles[j].textContent = tiles[j].dataset.value == 0 ? '' : tiles[j].dataset.value;

        tiles[i].classList.toggle('empty', tiles[i].dataset.value == 0);
        tiles[j].classList.toggle('empty', tiles[j].dataset.value == 0);
    }

    async function solvePuzzle(algorithm = 'BFS') {
        let btn = document.getElementById("solve-btn");
        btn.innerText = "Solving...";
        btn.setAttribute("disabled", "");
        if (solving) return;
        solving = true;
        
        const currentState = tiles.map(t => parseInt(t.dataset.value));
        
        const startTime = performance.now();
        const solution = await bfsSolve(currentState);
        const endTime = performance.now();

        btn = document.getElementById("solve-btn");
        btn.innerText = "Solve";
        btn.removeAttribute("disabled");
        
        if (solution) {
            moveSequence = solution.moves;
            currentStep = 0;
            updateStats(
                `${((endTime - startTime)/1000).toFixed(2)}s`, 
                moveSequence.length, 
                solution.nodesExplored, 
                algorithm
            );
            fillSolutionSteps(moveSequence);
            enableNavButtons(true);
        } else {
            alert("No solution found!");
        }
        solving = false;
    }

    async function bfsSolve(initialState) {
        const targetState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        const queue = [{ state: initialState, moves: [], emptyPos: initialState.indexOf(0) }];
        const visited = new Set();
        let nodesExplored = 0;
        
        while (queue.length > 0) {
            const current = queue.shift();
            nodesExplored++;
            
            if (arraysEqual(current.state, targetState)) {
                return { moves: current.moves, nodesExplored };
            }
            
            const stateKey = current.state.join(',');
            if (visited.has(stateKey)) continue;
            visited.add(stateKey);
            
            const validMoves = getValidMoves(current.emptyPos);
            for (const move of validMoves) {
                const newState = [...current.state];
                [newState[current.emptyPos], newState[move]] = [newState[move], newState[current.emptyPos]];
                
                queue.push({
                    state: newState,
                    moves: [...current.moves, move],
                    emptyPos: move
                });
            }
            
            if (nodesExplored % 1000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        return null;
    }

    function arraysEqual(a, b) {
        return a.every((val, i) => val === b[i]);
    }

    function updateStats(time, moves, nodes, algo) {
        document.getElementById('time-taken').textContent = time;
        document.getElementById('move-count').textContent = moves;
        document.getElementById('nodes-explored').textContent = nodes;
        document.getElementById('algorithm-used').textContent = algo;
    }

    function clearSolutionSteps() {
        solutionStepsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Solution will appear here...</p>';
    }

    function fillSolutionSteps(moves) {
        solutionStepsContainer.innerHTML = '';
        moves.forEach((move, i) => {
            const step = document.createElement('div');
            step.className = 'py-2 px-3 border-b border-gray-100 hover:bg-gray-50';
            step.textContent = `Move ${i + 1}: Move tile to empty space (from index ${move})`;
            solutionStepsContainer.appendChild(step);
        });
    }

    function prevMove() {
        if (currentStep > 0) {
            currentStep--;
            const emptyIndex = getEmptyIndex();
            const move = moveSequence[currentStep];
            swapTiles(move, emptyIndex);
        }
    }

    function nextMove() {
        if (currentStep < moveSequence.length) {
            const emptyIndex = getEmptyIndex();
            const move = moveSequence[currentStep];
            swapTiles(move, emptyIndex);
            currentStep++;
        }
    }

    async function autoPlay() {
        if (solving) return;
        solving = true;
        
        while (currentStep < moveSequence.length) {
            nextMove();
            await sleep(500);
        }
        
        solving = false;
    }

    // Sleep helper
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function enableNavButtons(enabled) {
        document.getElementById('prev-move').disabled = !enabled;
        document.getElementById('next-move').disabled = !enabled;
        document.getElementById('auto-play').disabled = !enabled;
    }

    document.getElementById('shuffle-btn').addEventListener('click', shufflePuzzle);
    document.getElementById('reset-btn').addEventListener('click', resetPuzzle);
    document.getElementById('solve-btn').addEventListener('click', () => solvePuzzle('BFS'));
    document.getElementById('prev-move').addEventListener('click', prevMove);
    document.getElementById('next-move').addEventListener('click', nextMove);
    document.getElementById('auto-play').addEventListener('click', autoPlay);

    createTiles();
});