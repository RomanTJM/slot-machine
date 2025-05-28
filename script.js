class SlotMachine {
    constructor() {
        this.symbolsData = [
            { name: 'cherry', image: './images/cherry.png' },
            { name: 'lemon', image: './images/lemon.png' },
            { name: 'orange', image: './images/orange.png' },
            { name: 'plum', image: './images/plum.png' },
            { name: 'bell', image: './images/bell.png' },
            { name: 'bar', image: './images/bar.png' },
            { name: 'seven', image: './images/seven.png' },
            { name: 'diamond', image: './images/diamond.png' }
        ];
        this.isSpinning = false;
        this.reelsCount = 5;
        this.symbolsPerReel = 3;
        this.symbolSize = 200;
        this.reelGap = 10; // расстояние между барабанами
        this.reels = [];
        this.symbols = [];

        this.initPixi();
        this.loadAssets();
        this.setupEventListeners();
        this.setupResizeHandler();
    }

    initPixi() {
        // Получаем размеры контейнера
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = window.innerHeight * 0.8; // 80% высоты окна

        this.app = new PIXI.Application({
            width: containerWidth,
            height: containerHeight,
            backgroundColor: 0x2a2a2a,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            resizeTo: container // Автоматическое изменение размера под контейнер
        });

        container.appendChild(this.app.view);
        this.reelsContainer = new PIXI.Container();
        this.app.stage.addChild(this.reelsContainer);
        
        // Устанавливаем начальное положение
        this.updateLayout();
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.updateLayout();
        });
    }

    updateLayout() {
        // Обновляем размер символов в зависимости от размера экрана
        const containerWidth = document.getElementById('gameContainer').clientWidth;
        const containerHeight = window.innerHeight * 0.8;
        
        // Вычисляем оптимальный размер символа
        const maxSymbolWidth = (containerWidth - (this.reelsCount - 1) * this.reelGap) / this.reelsCount;
        const maxSymbolHeight = containerHeight / this.symbolsPerReel;
        this.symbolSize = Math.min(maxSymbolWidth, maxSymbolHeight);

        // Обновляем размеры и позиции всех символов
        if (this.symbols.length > 0) {
            this.symbols.forEach((reelSymbols, reelIndex) => {
                reelSymbols.forEach((symbol, symbolIndex) => {
                    symbol.width = this.symbolSize;
                    symbol.height = this.symbolSize;
                    symbol.x = this.symbolSize / 2;
                    symbol.y = symbolIndex * this.symbolSize + this.symbolSize / 2;
                });
                this.reels[reelIndex].x = reelIndex * (this.symbolSize + this.reelGap);
            });
        }

        // Центрируем контейнер барабанов
        this.centerReelsContainer();
    }

    centerReelsContainer() {
        this.reelsContainer.x = (this.app.screen.width - (this.symbolSize * this.reelsCount + this.reelGap * (this.reelsCount - 1))) / 2;
        this.reelsContainer.y = (this.app.screen.height - (this.symbolSize * this.symbolsPerReel)) / 2;
    }

    loadAssets() {
        const loader = PIXI.Loader.shared;
        this.symbolsData.forEach(symbol => loader.add(symbol.name, symbol.image));
        loader.load((loader, resources) => {
            this.symbolsData.forEach(symbol => {
                if (resources[symbol.name] && resources[symbol.name].texture) {
                    symbol.texture = resources[symbol.name].texture;
                } else {
                    const text = new PIXI.Text(symbol.name, {
                        fontFamily: 'Arial',
                        fontSize: 24,
                        fill: 0xFFFFFF
                    });
                    symbol.texture = this.app.renderer.generateTexture(text);
                }
            });
            this.initializeReels();
        });
    }

    initializeReels() {
        this.reels = [];
        this.symbols = [];
        for (let i = 0; i < this.reelsCount; i++) {
            const reel = new PIXI.Container();
            reel.x = i * (this.symbolSize + this.reelGap);
            this.reelsContainer.addChild(reel);
            this.reels.push(reel);

            const reelSymbols = [];
            for (let j = 0; j < this.symbolsPerReel; j++) {
                const symbolData = this.symbolsData[Math.floor(Math.random() * this.symbolsData.length)];
                const symbol = new PIXI.Sprite(symbolData.texture);
                symbol.anchor.set(0.5, 0.5); // ВЫРАВНИВАНИЕ ПО ЦЕНТРУ
                symbol.x = this.symbolSize / 2;
                symbol.y = j * this.symbolSize + this.symbolSize / 2;
                symbol.width = this.symbolSize;
                symbol.height = this.symbolSize;
                reel.addChild(symbol);
                reelSymbols.push(symbol);
            }
            this.symbols.push(reelSymbols);
        }
    }

    setupEventListeners() {
        document.getElementById('spinButton').addEventListener('click', () => this.startSpin());
    }

    async fetchServerResponse() {
        try {
            const response = await fetch('random_response.php');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Ошибка при получении ответа сервера:', error);
            return null;
        }
    }

    async startSpin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        document.getElementById('serverResponse').textContent = '';
        this.spinAnimation();
        const serverData = await this.fetchServerResponse();
        await this.stopReels(serverData);
    }

    spinAnimation() {
        if (!this.isSpinning) return;
        this.reels.forEach((reel, reelIndex) => {
            this.symbols[reelIndex].forEach((symbol, j) => {
                symbol.y += 10;
                if (symbol.y >= this.symbolSize * this.symbolsPerReel + this.symbolSize / 2) {
                    symbol.y = symbol.y - this.symbolSize * this.symbolsPerReel;
                    const symbolData = this.symbolsData[Math.floor(Math.random() * this.symbolsData.length)];
                    symbol.texture = symbolData.texture;
                }
            });
        });
        requestAnimationFrame(() => this.spinAnimation());
    }

    async stopReels(serverData) {
        if (serverData) {
            document.getElementById('serverResponse').textContent = `Получено значение: ${serverData.value}`;
        }
        for (let i = 0; i < this.reels.length; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.symbols[i].forEach(symbol => {
                        gsap.to(symbol, {
                            y: symbol.y + 20,
                            duration: 0.25,
                            yoyo: true,
                            repeat: 1,
                            ease: "power2.out"
                        });
                    });
                    resolve();
                }, i * 200);
            });
        }
        // После остановки сортируем символы по y и пересобираем контейнеры
        for (let i = 0; i < this.reels.length; i++) {
            // Сортируем массив символов по y
            this.symbols[i].sort((a, b) => a.y - b.y);
            // Удаляем все символы из контейнера
            while (this.reels[i].children.length > 0) {
                this.reels[i].removeChildAt(0);
            }
            // Добавляем обратно в правильном порядке и выставляем координаты по X
            for (let j = 0; j < this.symbolsPerReel; j++) {
                const symbol = this.symbols[i][j];
                symbol.anchor.set(0.5, 0.5);
                symbol.x = this.symbolSize / 2;
                // Y будет выставлен ниже для всех символов с одинаковым индексом
                this.reels[i].addChild(symbol);
            }
        }
        // ГАРАНТИРОВАННОЕ ВЫРАВНИВАНИЕ ПО ГОРИЗОНТАЛИ ДЛЯ КАЖДОГО РЯДА
        for (let j = 0; j < this.symbolsPerReel; j++) {
            const rowY = j * this.symbolSize + this.symbolSize / 2;
            for (let i = 0; i < this.reelsCount; i++) {
                this.symbols[i][j].y = rowY;
            }
        }
        // После остановки выравниваем барабаны по горизонтали
        for (let i = 0; i < this.reels.length; i++) {
            this.reels[i].x = i * (this.symbolSize + this.reelGap);
        }
        // Центрируем контейнер барабанов по ширине
        this.centerReelsContainer();
        // Сортируем барабаны по x и пересобираем массивы
        const reelsWithSymbols = this.reels.map((reel, i) => ({ reel, symbols: this.symbols[i] }));
        reelsWithSymbols.sort((a, b) => a.reel.x - b.reel.x);
        this.reels = reelsWithSymbols.map(obj => obj.reel);
        this.symbols = reelsWithSymbols.map(obj => obj.symbols);
        this.isSpinning = false;
        document.getElementById('spinButton').disabled = false;
    }
}

window.addEventListener('load', () => {
    new SlotMachine();
}); 