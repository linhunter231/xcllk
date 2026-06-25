// 字库由 chars.js 提供

// ===================== 字体加载管理 =====================
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.getElementById('loading-progress');
const loadingText = document.getElementById('loading-text');
const gameContainer = document.getElementById('game-container');

function setProgress(percent, text) {
    loadingProgress.style.width = percent + '%';
    if (text) loadingText.textContent = text;
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
    gameContainer.classList.remove('hidden');
}

async function waitForFonts() {
    setProgress(10, '正在加载字体...');
    
    // 等待草书字体加载
    try {
        await document.fonts.load('48px Caoshu');
        setProgress(60, '字体加载中...');
        
        // 检查字体是否真的加载成功
        const fontsLoaded = document.fonts.check('48px Caoshu');
        if (fontsLoaded) {
            setProgress(100, '加载完成!');
        } else {
            // 如果字体文件不存在或加载失败，等待一段时间后继续
            setProgress(100, '使用备用字体...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) {
        console.warn('字体加载异常:', e);
        setProgress(100, '使用备用字体...');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 等待 opencc-js 初始化
    setProgress(100, '初始化完成!');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    hideLoading();
}

class Game {
    constructor() {
        this.grid = [];
        this.selectedTile = null;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        this.isPlaying = false;
        this.hintTiles = [];
        this.gridSize = 6;
        this.charLevel = 1;
        this.caojueSection = 0;
        
        this.gridContainer = document.getElementById('grid-container');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.restartBtn = document.getElementById('restart-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.difficultySelect = document.getElementById('difficulty');
        this.caojueSectionSelect = document.getElementById('caojue-section');
        this.caojueSectionRow = document.getElementById('caojue-section-row');
        this.modal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalRestartBtn = document.getElementById('modal-restart-btn');
        this.selectedCharsElement = document.getElementById('selected-chars');
        
        this.init();
    }
    
    init() {
        this.generateSectionOptions();
        
        try {
            const saved = localStorage.getItem('caoshuLinkupGame');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.gridSize) {
                    this.gridSize = state.gridSize;
                    this.gridSizeSelect.value = state.gridSize;
                }
                if (state.charLevel) {
                    this.charLevel = state.charLevel;
                    this.difficultySelect.value = state.charLevel;
                }
                if (state.caojueSection !== undefined) {
                    this.caojueSection = state.caojueSection;
                    this.caojueSectionSelect.value = state.caojueSection;
                }
            }
        } catch (e) {}
        this.charLevel = parseInt(this.difficultySelect.value);
        this.caojueSection = parseInt(this.caojueSectionSelect.value);
        this.caojueSectionRow.style.display = this.charLevel === 4 ? 'flex' : 'none';
        
        this.restartBtn.addEventListener('click', () => this.restart());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.shuffleBtn.addEventListener('click', () => this.shuffle());
        this.gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.stopTimer();
            this.clearSavedGame();
            this.startGame();
        });
        this.difficultySelect.addEventListener('change', (e) => {
            this.charLevel = parseInt(e.target.value);
            this.caojueSectionRow.style.display = this.charLevel === 4 ? 'flex' : 'none';
            this.stopTimer();
            this.clearSavedGame();
            this.startGame();
        });
        this.caojueSectionSelect.addEventListener('change', (e) => {
            this.caojueSection = parseInt(e.target.value);
            this.stopTimer();
            this.clearSavedGame();
            this.startGame();
        });
        // 响应式：窗口尺寸变化时重新计算方块大小
        window.addEventListener('resize', () => {
            if (!this.isPlaying && this.grid.length === 0) return;
            this.adjustTileSize();
        });
        this.modalRestartBtn.addEventListener('click', () => {
            this.modal.classList.add('hidden');
            this.restart();
        });
        
        // 等待字体加载完成后再开始游戏
        waitForFonts().then(() => {
            this.startGame();
        });
    }
    
    get GRID_ROWS() {
        return this.gridSize;
    }
    
    get GRID_COLS() {
        return this.gridSize;
    }
    
    generateSectionOptions() {
        const totalChars = CAOJUE_CHARS.length;
        const charsPerSection = 10;
        const totalSections = Math.ceil(totalChars / charsPerSection);
        
        this.caojueSectionSelect.innerHTML = '';
        
        const allOption = document.createElement('option');
        allOption.value = '0';
        allOption.textContent = '全部';
        this.caojueSectionSelect.appendChild(allOption);
        
        for (let i = 1; i <= totalSections; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            const start = (i - 1) * charsPerSection + 1;
            const end = Math.min(i * charsPerSection, totalChars);
            option.textContent = `第${i}段 (${start}-${end})`;
            this.caojueSectionSelect.appendChild(option);
        }
    }
    
    calcTileSize() {
        const isMobile = window.innerWidth <= 768;
        const isLargeGrid = this.gridSize >= 10;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const cols = this.GRID_COLS;
        const rows = this.GRID_ROWS;
        
        const gap = isMobile ? 2 : 4;
        const totalGapX = gap * (cols - 1);
        const totalGapY = gap * (rows - 1);
        
        const containerPadding = 10 * 2;
        const gridPadding = 8 * 2;
        
        const estimatedHeaderHeight = isMobile ? 80 : 90;
        const estimatedFooterHeight = isMobile ? 50 : 60;
        const totalNonGridHeight = estimatedHeaderHeight + estimatedFooterHeight;
        
        const availableWidth = viewportWidth - containerPadding - gridPadding;
        const availableHeight = viewportHeight - containerPadding - gridPadding - totalNonGridHeight;
        
        const tileSizeByWidth = Math.floor((availableWidth - totalGapX) / cols);
        const tileSizeByHeight = Math.floor((availableHeight - totalGapY) / rows);
        
        const maxSize = isMobile ? 55 : (isLargeGrid ? 40 : 70);
        const minSize = isMobile ? 20 : 28;
        
        return Math.max(minSize, Math.min(maxSize, Math.min(tileSizeByWidth, tileSizeByHeight)));
    }

    startGame() {
        this.score = 0;
        this.time = 0;
        this.selectedTile = null;
        this.isPlaying = true;
        this.updateScore();
        this.updateTime();
        
        this.createGrid();
        this.startTimer();
        
        // 尝试加载之前的游戏进度
        if (this.loadGame()) {
            this.showMessage('已恢复上次的游戏');
        }
        
        setTimeout(() => this.adjustTileSize(), 100);
    }
    
    adjustTileSize() {
        const board = document.querySelector('.game-board');
        const container = document.querySelector('.game-container');
        if (!board || !container) return;
        
        const boardRect = board.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const isLargeGrid = this.gridSize >= 10;
        const cols = this.GRID_COLS;
        const rows = this.GRID_ROWS;
        const gap = 4;
        
        const totalGapX = gap * (cols - 1);
        const totalGapY = gap * (rows - 1);
        const padding = 16;
        
        const availableWidth = boardRect.width - padding * 2;
        const availableHeight = boardRect.height - padding * 2;
        
        const tileSizeByWidth = Math.floor((availableWidth - totalGapX) / cols);
        const tileSizeByHeight = Math.floor((availableHeight - totalGapY) / rows);
        
        const maxSize = isLargeGrid ? 45 : 70;
        const minSize = 25;
        
        const newSize = Math.max(minSize, Math.min(maxSize, Math.min(tileSizeByWidth, tileSizeByHeight)));
        
        if (newSize > 0 && newSize !== parseInt(this.gridContainer.style.getPropertyValue('--tile-size'))) {
            this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${newSize}px)`;
            this.gridContainer.style.setProperty('--tile-size', newSize + 'px');
        }
    }
    
    restart() {
        this.stopTimer();
        this.clearSavedGame();
        this.clearHints();
        this.startGame();
    }
    
    createGrid() {
        const pairsCount = (this.GRID_ROWS * this.GRID_COLS) / 2;
        const tiles = [];
        
        // 获取字库
        const allCharPairs = getCharsByLevel(this.charLevel, this.caojueSection);
        
        // 去重，得到所有不同的字
        const seen = new Set();
        const uniquePairs = [];
        for (const pair of allCharPairs) {
            if (!seen.has(pair.simplified)) {
                seen.add(pair.simplified);
                uniquePairs.push(pair);
            }
        }
        
        // 计算每个字出现的对数
        const charRepeats = {};
        
        const isCaojueSection = this.charLevel === 4 && this.caojueSection > 0;
        
        // 计算正常模式下的基准重复次数
        let baseRepeats;
        if (this.gridSize <= 4) {
            baseRepeats = 1;
        } else if (this.gridSize <= 6) {
            baseRepeats = 2;
        } else if (this.gridSize <= 8) {
            baseRepeats = 3;
        } else {
            baseRepeats = 4;
        }
        
        // 工具函数：给定一组字和总对数，按"尽量平均"的方式分配
        // 每个字至少 minRepeats 对，余数随机分配
        const assignRepeats = (pairs, totalPairs, minRepeats) => {
            const result = {};
            const n = pairs.length;
            
            // 每个字至少 minRepeats 对
            for (const pair of pairs) {
                result[pair.simplified] = minRepeats;
            }
            
            let remaining = totalPairs - n * minRepeats;
            
            if (remaining > 0) {
                // 完整循环
                const fullCycles = Math.floor(remaining / n);
                const remainder = remaining % n;
                
                for (const pair of pairs) {
                    result[pair.simplified] += fullCycles;
                }
                
                // 余数随机分配
                if (remainder > 0) {
                    const shuffled = [...pairs];
                    this.shuffleArray(shuffled);
                    for (let i = 0; i < remainder; i++) {
                        result[shuffled[i].simplified]++;
                    }
                }
            }
            
            return result;
        };
        
        if (isCaojueSection) {
            // 草诀谱分段
            // 正常模式下需要的不同字数
            const normalUniqueChars = Math.floor(pairsCount / baseRepeats);
            const threshold = normalUniqueChars * 2;
            
            if (uniquePairs.length <= threshold) {
                // 段内字少
                if (uniquePairs.length > pairsCount) {
                    // 段内字比总对数还多：只能随机选 pairsCount 个字，每个1对
                    const shuffled = [...uniquePairs];
                    this.shuffleArray(shuffled);
                    const selected = shuffled.slice(0, pairsCount);
                    for (const pair of selected) {
                        charRepeats[pair.simplified] = 1;
                    }
                } else {
                    // 保证所有字都至少出现1对，剩下的循环分配
                    Object.assign(charRepeats, assignRepeats(uniquePairs, pairsCount, 1));
                }
            } else {
                // 段内字多：用正常模式，随机选字，每个字重复 baseRepeats 对左右
                const shuffled = [...uniquePairs];
                this.shuffleArray(shuffled);
                const selected = shuffled.slice(0, normalUniqueChars);
                Object.assign(charRepeats, assignRepeats(selected, pairsCount, baseRepeats));
            }
        } else {
            // 非分段模式
            const normalUniqueChars = Math.floor(pairsCount / baseRepeats);
            const shuffled = [...uniquePairs];
            this.shuffleArray(shuffled);
            const selected = shuffled.slice(0, normalUniqueChars);
            Object.assign(charRepeats, assignRepeats(selected, pairsCount, baseRepeats));
        }
        
        // 生成 tiles
        const charPairMap = {};
        for (const pair of uniquePairs) {
            charPairMap[pair.simplified] = pair;
        }
        
        const charCount = {};
        for (const char in charRepeats) {
            const repeats = charRepeats[char];
            const pair = charPairMap[char];
            charCount[char] = repeats;
            for (let r = 0; r < repeats; r++) {
                tiles.push({ char: pair.simplified, traditional: pair.traditional, isCaoshu: true });
                tiles.push({ char: pair.simplified, traditional: pair.traditional, isCaoshu: false });
            }
        }
        
        // 显示选中段的文字（草诀谱分段时）
        if (this.charLevel === 4 && this.caojueSection > 0) {
            // 显示选中段的原始文字
            const charsPerSection = 10;
            const start = (this.caojueSection - 1) * charsPerSection;
            const end = Math.min(this.caojueSection * charsPerSection, CAOJUE_CHARS.length);
            const sectionText = CAOJUE_CHARS.substring(start, end);
            this.selectedCharsElement.innerHTML = `<strong>第${this.caojueSection}段：</strong>${sectionText}`;
            this.selectedCharsElement.style.display = 'block';
        } else {
            this.selectedCharsElement.style.display = 'none';
        }
        
        this.shuffleArray(tiles);
        
        this.grid = [];
        this.gridContainer.innerHTML = '';
        const tileSize = this.calcTileSize();
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.GRID_COLS}, ${tileSize}px)`;
        this.gridContainer.style.setProperty('--tile-size', tileSize + 'px');
        
        for (let row = 0; row < this.GRID_ROWS; row++) {
            const rowArray = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const tileData = tiles[row * this.GRID_COLS + col];
                const tile = {
                    char: tileData.char,
                    traditional: tileData.traditional,
                    isCaoshu: tileData.isCaoshu,
                    row,
                    col,
                    matched: false,
                    element: null
                };
                
                const element = document.createElement('div');
                element.className = tileData.isCaoshu ? 'tile' : 'tile tile-regular';
                element.textContent = tileData.isCaoshu ? tileData.traditional : tileData.char;
                element.dataset.row = row;
                element.dataset.col = col;
                element.addEventListener('click', () => this.handleTileClick(row, col));
                
                tile.element = element;
                this.gridContainer.appendChild(element);
                rowArray.push(tile);
            }
            this.grid.push(rowArray);
        }
    }
    
    saveGame() {
        try {
            const tilesData = [];
            for (let row = 0; row < this.GRID_ROWS; row++) {
                for (let col = 0; col < this.GRID_COLS; col++) {
                    const tile = this.grid[row][col];
                    tilesData.push({
                        char: tile.char,
                        traditional: tile.traditional,
                        isCaoshu: tile.isCaoshu,
                        matched: tile.matched
                    });
                }
            }
            const state = {
                gridSize: this.gridSize,
                charLevel: this.charLevel,
                caojueSection: this.caojueSection,
                score: this.score,
                time: this.time,
                tiles: tilesData
            };
            localStorage.setItem('caoshuLinkupGame', JSON.stringify(state));
        } catch (e) {
            console.warn('保存游戏失败:', e);
        }
    }
    
    loadGame() {
        try {
            const saved = localStorage.getItem('caoshuLinkupGame');
            if (!saved) return false;
            const state = JSON.parse(saved);
            if (state.gridSize !== this.gridSize || state.charLevel !== this.charLevel) return false;
            if (state.charLevel === 4 && state.caojueSection !== undefined && state.caojueSection !== this.caojueSection) return false;
            
            this.score = state.score;
            this.time = state.time;
            this.updateScore();
            this.updateTime();
            
            for (let row = 0; row < this.GRID_ROWS; row++) {
                for (let col = 0; col < this.GRID_COLS; col++) {
                    const tileData = state.tiles[row * this.GRID_COLS + col];
                    const tile = this.grid[row][col];
                    if (tileData.matched) {
                        tile.matched = true;
                        if (tile.element) {
                            tile.element.classList.add('matched');
                        }
                    }
                }
            }
            return true;
        } catch (e) {
            console.warn('加载游戏失败:', e);
            return false;
        }
    }
    
    clearSavedGame() {
        localStorage.removeItem('caoshuLinkupGame');
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    handleTileClick(row, col) {
        if (!this.isPlaying) return;
        
        const tile = this.grid[row][col];
        if (tile.matched) return;
        
        this.clearHints();
        
        if (!this.selectedTile) {
            this.selectedTile = tile;
            tile.element.classList.add('selected');
        } else if (this.selectedTile === tile) {
            this.selectedTile.element.classList.remove('selected');
            this.selectedTile = null;
        } else {
            this.selectedTile.element.classList.remove('selected');
            
            if (this.selectedTile.char === tile.char && this.selectedTile.isCaoshu !== tile.isCaoshu) {
                const path = this.findPath(this.selectedTile, tile);
                
                if (path) {
                    this.drawPath(path);
                    const tile1 = this.selectedTile;
                    const tile2 = tile;
                    setTimeout(() => {
                        this.matchTiles(tile1, tile2);
                        this.removePath();
                    }, 300);
                }
            }
            
            this.selectedTile = null;
        }
    }
    
    findPath(tile1, tile2) {
        if (this.canConnectDirectly(tile1, tile2)) {
            return [tile1, tile2];
        }
        
        const path1 = this.tryOneTurnPath(tile1, tile2);
        if (path1) return path1;
        
        const path2 = this.tryTwoTurnsPath(tile1, tile2);
        if (path2) return path2;
        
        return null;
    }
    
    canConnectDirectly(tile1, tile2) {
        if (tile1.row === tile2.row) {
            const minCol = Math.min(tile1.col, tile2.col);
            const maxCol = Math.max(tile1.col, tile2.col);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (!this.grid[tile1.row][col].matched) return false;
            }
            return true;
        }
        
        if (tile1.col === tile2.col) {
            const minRow = Math.min(tile1.row, tile2.row);
            const maxRow = Math.max(tile1.row, tile2.row);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (!this.grid[row][tile1.col].matched) return false;
            }
            return true;
        }
        
        return false;
    }
    
    tryOneTurnPath(tile1, tile2) {
        const corner1 = { row: tile1.row, col: tile2.col };
        if (this.isValidCorner(corner1) && this.canPass(tile1, corner1) && this.canPass(corner1, tile2)) {
            return [tile1, corner1, tile2];
        }
        
        const corner2 = { row: tile2.row, col: tile1.col };
        if (this.isValidCorner(corner2) && this.canPass(tile1, corner2) && this.canPass(corner2, tile2)) {
            return [tile1, corner2, tile2];
        }
        
        return null;
    }
    
    tryTwoTurnsPath(tile1, tile2) {
        for (let col = -1; col <= this.GRID_COLS; col++) {
            const corner1 = { row: tile1.row, col };
            const corner2 = { row: tile2.row, col };
            
            if (this.isValidCorner(corner1) && this.isValidCorner(corner2) &&
                this.canPass(tile1, corner1) && 
                this.canPass(corner1, corner2) && 
                this.canPass(corner2, tile2)) {
                return [tile1, corner1, corner2, tile2];
            }
        }
        
        for (let row = -1; row <= this.GRID_ROWS; row++) {
            const corner1 = { row, col: tile1.col };
            const corner2 = { row, col: tile2.col };
            
            if (this.isValidCorner(corner1) && this.isValidCorner(corner2) &&
                this.canPass(tile1, corner1) && 
                this.canPass(corner1, corner2) && 
                this.canPass(corner2, tile2)) {
                return [tile1, corner1, corner2, tile2];
            }
        }
        
        return null;
    }
    
    canPass(tile1, tile2) {
        if (tile1.row === tile2.row) {
            const minCol = Math.min(tile1.col, tile2.col);
            const maxCol = Math.max(tile1.col, tile2.col);
            
            for (let col = minCol + 1; col < maxCol; col++) {
                if (col >= 0 && col < this.GRID_COLS && tile1.row >= 0 && tile1.row < this.GRID_ROWS) {
                    if (!this.grid[tile1.row][col].matched) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        if (tile1.col === tile2.col) {
            const minRow = Math.min(tile1.row, tile2.row);
            const maxRow = Math.max(tile1.row, tile2.row);
            
            for (let row = minRow + 1; row < maxRow; row++) {
                if (row >= 0 && row < this.GRID_ROWS && tile1.col >= 0 && tile1.col < this.GRID_COLS) {
                    if (!this.grid[row][tile1.col].matched) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        return false;
    }
    
    isValidCorner(corner) {
        if (corner.row < 0 || corner.row >= this.GRID_ROWS || corner.col < 0 || corner.col >= this.GRID_COLS) {
            return true;
        }
        return this.grid[corner.row][corner.col].matched;
    }
    
    drawPath(path) {
        const board = document.querySelector('.game-board');
        const boardRect = board.getBoundingClientRect();
        const grid = document.getElementById('grid-container');
        const gridRect = grid.getBoundingClientRect();
        
        // 从 CSS 变量获取方块大小，而不是从 DOM 元素
        const computedStyle = getComputedStyle(grid);
        const tileSize = parseFloat(computedStyle.getPropertyValue('--tile-size')) || 60;
        const gap = parseFloat(computedStyle.gap) || 4;
        const gridPadding = 8;
        
        // 动态计算实际 padding
        const padding = (gridRect.width - this.GRID_COLS * tileSize - (this.GRID_COLS - 1) * gap) / 2;
        
        const gridLeftInBoard = gridRect.left - boardRect.left;
        const gridTopInBoard = gridRect.top - boardRect.top;
        
        const getCellCenter = (row, col) => {
            const x = gridLeftInBoard + gridPadding + padding + col * (tileSize + gap) + tileSize / 2;
            const y = gridTopInBoard + gridPadding + padding + row * (tileSize + gap) + tileSize / 2;
            return { x, y };
        };
        
        const points = [];
        path.forEach(tile => {
            if (tile.row !== undefined && tile.col !== undefined) {
                points.push(getCellCenter(tile.row, tile.col));
            } else {
                points.push({ x: 0, y: 0 });
            }
        });
        
        let svg = board.querySelector('svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.top = '-200px';
            svg.style.left = '-200px';
            svg.style.width = 'calc(100% + 400px)';
            svg.style.height = 'calc(100% + 400px)';
            svg.style.zIndex = '100';
            svg.style.pointerEvents = 'none';
            board.appendChild(svg);
        }
        
        let d = `M ${points[0].x + 200} ${points[0].y + 200}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x + 200} ${points[i].y + 200}`;
        }
        
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', d);
        pathElement.setAttribute('stroke', '#e74c3c');
        pathElement.setAttribute('stroke-width', '3');
        pathElement.setAttribute('fill', 'none');
        pathElement.setAttribute('stroke-linecap', 'round');
        pathElement.setAttribute('stroke-linejoin', 'round');
        
        const length = pathElement.getTotalLength();
        pathElement.style.strokeDasharray = length;
        pathElement.style.strokeDashoffset = length;
        
        svg.appendChild(pathElement);
        
        pathElement.animate([
            { strokeDashoffset: length },
            { strokeDashoffset: 0 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    }
    
    removePath() {
        const svg = document.querySelector('.game-board svg');
        if (svg) {
            svg.remove();
        }
    }
    
    matchTiles(tile1, tile2) {
        tile1.matched = true;
        tile2.matched = true;
        
        tile1.element.classList.add('matched');
        tile2.element.classList.add('matched');
        
        this.score += 100;
        this.updateScore();
        
        // 保存游戏进度
        this.saveGame();
        
        // 检查是否还有未匹配的字
        let remainingTiles = 0;
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (!this.grid[row][col].matched) {
                    remainingTiles++;
                }
            }
        }
        
        // 只有还有剩余的字但没有可连接的配对时，才提示并打乱
        if (remainingTiles > 0 && !this.hasValidPair()) {
            this.showMessage('没有可连接的字了，正在打乱顺序...');
            setTimeout(() => {
                this.shuffle();
            }, 500);
        }
        
        this.checkWin();
    }
    
    // 检查是否还有可连接的配对
    hasValidPair() {
        const tiles = [];
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (!this.grid[row][col].matched) {
                    tiles.push(this.grid[row][col]);
                }
            }
        }
        
        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i].char === tiles[j].char && tiles[i].isCaoshu !== tiles[j].isCaoshu) {
                    const path = this.findPath(tiles[i], tiles[j]);
                    if (path) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    checkWin() {
        let allMatched = true;
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (!this.grid[row][col].matched) {
                    allMatched = false;
                    break;
                }
            }
            if (!allMatched) break;
        }
        
        if (allMatched) {
            this.isPlaying = false;
            this.stopTimer();
            this.showModal(true);
        }
    }
    
    showHint() {
        this.clearHints();
        
        const tiles = [];
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (!this.grid[row][col].matched) {
                    tiles.push(this.grid[row][col]);
                }
            }
        }
        
        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i].char === tiles[j].char && tiles[i].isCaoshu !== tiles[j].isCaoshu) {
                    const path = this.findPath(tiles[i], tiles[j]);
                    if (path) {
                        tiles[i].element.classList.add('hint');
                        tiles[j].element.classList.add('hint');
                        this.hintTiles = [tiles[i], tiles[j]];
                        
                        setTimeout(() => this.clearHints(), 2000);
                        return;
                    }
                }
            }
        }
    }
    
    clearHints() {
        this.hintTiles.forEach(tile => {
            if (tile.element) {
                tile.element.classList.remove('hint');
            }
        });
        this.hintTiles = [];
    }
    
    shuffle() {
        const tileData = [];
        const positions = [];
        
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (!this.grid[row][col].matched) {
                    tileData.push({
                        char: this.grid[row][col].char,
                        traditional: this.grid[row][col].traditional,
                        isCaoshu: this.grid[row][col].isCaoshu
                    });
                    positions.push({ row, col });
                }
            }
        }
        
        this.shuffleArray(tileData);
        
        positions.forEach((pos, index) => {
            const data = tileData[index];
            const gridTile = this.grid[pos.row][pos.col];
            gridTile.char = data.char;
            gridTile.traditional = data.traditional;
            gridTile.isCaoshu = data.isCaoshu;
            gridTile.element.textContent = data.isCaoshu ? data.traditional : data.char;
            
            if (data.isCaoshu) {
                gridTile.element.classList.remove('tile-regular');
            } else {
                gridTile.element.classList.add('tile-regular');
            }
        });
        
        this.clearHints();
        if (this.selectedTile) {
            this.selectedTile.element.classList.remove('selected');
            this.selectedTile = null;
        }
    }
    
    showMessage(text) {
        const existingMsg = document.getElementById('game-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const msg = document.createElement('div');
        msg.id = 'game-message';
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 20px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 3px solid white;
            text-align: center;
            pointer-events: none;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOutMsg {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                25% { transform: translate(-50%, -50%) scale(1); }
                75% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            #game-message {
                animation: fadeInOutMsg 2s ease forwards;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }
    
    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.time++;
            this.updateTime();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateTime() {
        const minutes = Math.floor(this.time / 60).toString().padStart(2, '0');
        const seconds = (this.time % 60).toString().padStart(2, '0');
        this.timeElement.textContent = `${minutes}:${seconds}`;
    }
    
    showModal(isWin) {
        this.modal.classList.remove('hidden');
        this.modalTitle.textContent = isWin ? '恭喜通关！' : '游戏结束';
        this.modalMessage.textContent = `最终得分: ${this.score}，用时: ${Math.floor(this.time / 60)}分${this.time % 60}秒`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});