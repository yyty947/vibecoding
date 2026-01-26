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
            // DOM 已经加载完成
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

        // 升级面板按钮
        const btnUpgrade = document.getElementById('btn-upgrade');
        const btnCloseUpgrade = document.getElementById('btn-close-upgrade');
        if (btnUpgrade) {
            btnUpgrade.addEventListener('click', () => this.handleUpgrade());
        }
        if (btnCloseUpgrade) {
            btnCloseUpgrade.addEventListener('click', () => this.closeUpgradePanel());
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

        // 检查是否点击了已有的塔
        const clickedTower = this.findTowerAt(x, y);
        if (clickedTower) {
            this.showUpgradePanel(clickedTower);
            return;
        }

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
        this.selectedTowerType = type;

        // 更新 UI 选中状态
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));
        if (element) {
            element.classList.add('selected');
        }

        this.closeUpgradePanel();
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

    showUpgradePanel(tower) {
        this.selectedTower = tower;
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-type').forEach(el => el.classList.remove('selected'));

        const panel = document.getElementById('upgrade-panel');
        if (panel) panel.classList.remove('hidden');

        // 更新塔信息
        const levelEl = document.getElementById('tower-level');
        const damageEl = document.getElementById('tower-damage');
        const rangeEl = document.getElementById('tower-range');
        if (levelEl) levelEl.textContent = tower.level;
        if (damageEl) damageEl.textContent = tower.damage;
        if (rangeEl) rangeEl.textContent = tower.range;

        // 更新升级按钮
        const btn = document.getElementById('btn-upgrade');
        if (btn) {
            const cost = tower.getUpgradeCost();
            const canUpgrade = cost !== Infinity && this.game.state.gold >= cost;
            btn.textContent = cost === Infinity ? '已满级' : `升级 (${cost})`;
            btn.disabled = !canUpgrade;
        }
    }

    handleUpgrade() {
        if (!this.selectedTower) return;

        const result = this.game.upgradeTower(this.selectedTower);
        if (result) {
            this.showUpgradePanel(this.selectedTower); // 刷新显示
        }
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
