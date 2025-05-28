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
        this.symbolsOnReel = 3; // Новое свойство: всего символов на барабане для анимации
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
            for (let j = 0; j < this.symbolsOnReel; j++) {
                const symbolData = this.symbolsData[Math.floor(Math.random() * this.symbolsData.length)];
                const symbol = new PIXI.Sprite(symbolData.texture);
                symbol.anchor.set(0.5, 0.5);
                symbol.width = this.symbolSize;
                symbol.height = this.symbolSize;
                symbol.x = this.symbolSize / 2;
                symbol.y = j * this.symbolSize + this.symbolSize / 2;
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
        // Новый массив скоростей для каждого барабана
        this.reelSpeeds = Array(this.reelsCount).fill(25);
        this.stopping = Array(this.reelsCount).fill(false);
        this.spinAnimation();
        const serverData = await this.fetchServerResponse();
        await this.stopReels(serverData);
    }

    spinAnimation() {
        if (!this.isSpinning) return;
        let stillSpinning = false;
        this.reels.forEach((reel, reelIndex) => {
            if (this.stopping && this.stopping[reelIndex]) return;
            stillSpinning = true;
            let speed = this.reelSpeeds[reelIndex];
            this.symbols[reelIndex].forEach((symbol, j) => {
                symbol.y += speed;
                // Если символ полностью вышел за нижнюю границу, переносим его строго над верхним
                while (symbol.y - this.symbolSize / 2 >= this.symbolSize * this.symbolsOnReel) {
                    let minY = Math.min(...this.symbols[reelIndex].map(s => s.y));
                    symbol.y = minY - this.symbolSize;
                    const symbolData = this.symbolsData[Math.floor(Math.random() * this.symbolsData.length)];
                    symbol.texture = symbolData.texture;
                }
            });
        });
        if (stillSpinning) {
            requestAnimationFrame(() => this.spinAnimation());
        }
    }

    async stopReels(serverData) {
        if (serverData) {
            document.getElementById('serverResponse').textContent = `Получено значение: ${serverData.value}`;
        }
        for (let i = 0; i < this.reels.length; i++) {
            await new Promise(resolve => {
                let interval = setInterval(() => {
                    if (this.reelSpeeds[i] > 2) {
                        this.reelSpeeds[i] *= 0.85;
                    } else {
                        clearInterval(interval);
                        this.stopping[i] = true;
                        // Сортируем по y
                        this.symbols[i].sort((a, b) => a.y - b.y);
                        // Выставляем ровно по линиям только центральные 3 символа
                        const offset = Math.floor((this.symbolsOnReel - this.symbolsPerReel) / 2);
                        for (let j = 0; j < this.symbolsOnReel; j++) {
                            let targetY;
                            if (j >= offset && j < offset + this.symbolsPerReel) {
                                targetY = (j - offset) * this.symbolSize + this.symbolSize / 2;
                            } else {
                                // Прячем запасные символы за пределами видимой области
                                targetY = -1000;
                            }
                            gsap.to(this.symbols[i][j], {
                                y: targetY,
                                duration: 0.3,
                                ease: "power2.out",
                                onComplete: () => {
                                    if (j === this.symbolsOnReel - 1) resolve();
                                }
                            });
                        }
                    }
                }, 40);
            }, i * 350);
        }
        // После остановки всех барабанов выравниваем центральную линию
        for (let j = 0; j < this.symbolsPerReel; j++) {
            const rowY = j * this.symbolSize + this.symbolSize / 2;
            for (let i = 0; i < this.reelsCount; i++) {
                const offset = Math.floor((this.symbolsOnReel - this.symbolsPerReel) / 2);
                this.symbols[i][j + offset].y = rowY;
            }
        }
        this.isSpinning = false;
        document.getElementById('spinButton').disabled = false;
    }
}

window.addEventListener('load', () => {
    new SlotMachine();
}); 