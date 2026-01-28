// 输入处理
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CONFIG } from '../utils/config.js';
import { Tower } from '../entities/Tower.js';

export class Input {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;

        this.selectedTowerType = null;
        this.selectedTower = null;
        this.mouseX = 0;
        this.mouseY = 0;

        // 立即绑定画布事件
        this.bindCanvasEvents();

        // 延迟绑定 DOM 事件，确保元素存在
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindDOMEvents());
        } else {
            this.bindDOMEvents();
        }
    }

    bindCanvasEvents() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    bindDOMEvents() {
        // 主菜单按钮
        const btnClassic = document.getElementById('btn-classic');
        const btnEndless = document.getElementById('btn-endless');
        if (btnClassic) {
            btnClassic.addEventListener('click', () => {
                console.log('Classic mode clicked');
                this.game.start('classic');
            });
        }
        if (btnEndless) {
            btnEndless.addEventListener('click', () => {
                console.log('Endless mode clicked');
                this.game.start('endless');
            });
        }

        // 速度控制按钮 - 只控制倍速
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-speed') {
                this.game.toggleSpeed();
            }
        });

        // 暂停按钮
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-pause') {
                this.game.togglePause();
            }
        });

        // 暂停菜单按钮
        const btnResume = document.getElementById('btn-resume');
        const btnRestartPause = document.getElementById('btn-restart-pause');
        const btnMenuPause = document.getElementById('btn-menu-pause');
        if (btnResume) {
            btnResume.addEventListener('click', () => this.game.togglePause());
        }
        if (btnRestartPause) {
            btnRestartPause.addEventListener('click', () => {
                this.game.togglePause();
                this.game.restart();
            });
        }
        if (btnMenuPause) {
            btnMenuPause.addEventListener('click', () => {
                this.game.togglePause();
                this.game.returnToMenu();
            });
        }

        // 塔选择面板 - 使用事件委托
        const towerPanel = document.getElementById('tower-panel');
        if (towerPanel) {
            towerPanel.addEventListener('click', (e) => {
                const towerType = e.target.closest('.tower-type');
                if (towerType) {
                    const type = towerType.dataset.type;
                    this.selectTowerType(type, towerType);
                }
            });
        }

        // 塔类型升级按钮 - 使用事件委托
        const upgradePanel = document.getElementById('upgrade-panel');
        if (upgradePanel) {
            upgradePanel.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-upgrade-type');
                if (btn) {
                    const type = btn.id.replace('btn-upgrade-', '');
                    this.game.upgradeTowerType(type);
                }
            });
        }

        // 游戏结束面板按钮
        const btnRestart = document.getElementById('btn-restart');
        const btnMenu = document.getElementById('btn-menu');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => this.game.restart());
        }
        if (btnMenu) {
            btnMenu.addEventListener('click', () => this.game.returnToMenu());
        }

        console.log('Input events bound successfully');
    }

    handleCanvasClick(e) {
        if (this.game.state.phase !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 如果选择了塔类型，尝试放置
        if (this.selectedTowerType) {
            this.tryPlaceTower(x, y);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    selectTowerType(type, element) {
        // 检查防御塔是否解锁
        const towerConfig = CONFIG.TOWERS[type];
        if (!towerConfig) return;

        const unlockWave = towerConfig.unlockWave || 0;
        if (this.game.state.wave < unlockWave) {
            console.log('Tower locked, unlocks at wave', unlockWave);
            return;
        }

        this.selectedTowerType = type;

        // 更新 UI 选中状态
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));
        if (element) {
            element.classList.add('selected');
        }

        console.log('Tower type selected:', type);
    }

    tryPlaceTower(x, y) {
        if (!this.selectedTowerType) return;

        const canPlace = CollisionSystem.canPlaceTower(x, y, this.game.state.towers);
        if (!canPlace) {
            console.log('Cannot place tower at this position');
            return;
        }

        const cost = CONFIG.TOWERS[this.selectedTowerType].cost;
        if (this.game.state.gold < cost) {
            console.log('Not enough gold');
            return;
        }

        // 创建防御塔
        const tower = new Tower(x, y, this.selectedTowerType);
        this.game.state.towers.push(tower);
        this.game.state.gold -= cost;
        this.game.updateHUD();

        console.log('Tower placed:', this.selectedTowerType, 'at', x, y);

        // 清除选择
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));
    }

    findTowerAt(x, y) {
        return this.game.state.towers.find(tower => {
            const dx = tower.x - x;
            const dy = tower.y - y;
            return Math.hypot(dx, dy) < 25;
        });
    }

    closeUpgradePanel() {
        this.selectedTower = null;
        const panel = document.getElementById('upgrade-panel');
        if (panel) panel.classList.add('hidden');
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }
}
