// 输入处理
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CONFIG } from '../utils/config.js';

export class Input {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;

        this.selectedTowerType = null;
        this.selectedTower = null;
        this.mouseX = 0;
        this.mouseY = 0;

        this.bindEvents();
    }

    bindEvents() {
        // 画布点击事件
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // 塔选择面板
        document.querySelectorAll('.tower-type').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.type;
                this.selectTowerType(type, el);
            });
        });

        // 升级面板
        document.getElementById('btn-upgrade').addEventListener('click', () => this.handleUpgrade());
        document.getElementById('btn-close-upgrade').addEventListener('click', () => this.closeUpgradePanel());

        // 游戏结束面板
        document.getElementById('btn-restart').addEventListener('click', () => this.game.restart());
        document.getElementById('btn-menu').addEventListener('click', () => this.game.returnToMenu());

        // 主菜单
        document.getElementById('btn-classic').addEventListener('click', () => this.game.start('classic'));
        document.getElementById('btn-endless').addEventListener('click', () => this.game.start('endless'));
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
        element.classList.add('selected');

        this.closeUpgradePanel();
    }

    tryPlaceTower(x, y) {
        if (!this.selectedTowerType) return;

        const canPlace = CollisionSystem.canPlaceTower(x, y, this.game.state.towers);
        if (!canPlace) {
            // 显示无法放置的提示（可以添加视觉效果）
            return;
        }

        const cost = CONFIG.TOWERS[this.selectedTowerType].cost;
        if (this.game.state.gold < cost) {
            // 显示金币不足的提示
            return;
        }

        // 创建防御塔
        const { Tower } = await import('../entities/Tower.js');
        const tower = new Tower(x, y, this.selectedTowerType);
        this.game.state.towers.push(tower);
        this.game.state.gold -= cost;
        this.game.updateHUD();

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
        panel.classList.remove('hidden');

        // 更新塔信息
        document.getElementById('tower-level').textContent = tower.level;
        document.getElementById('tower-damage').textContent = tower.damage;
        document.getElementById('tower-range').textContent = tower.range;

        // 更新升级按钮
        const btn = document.getElementById('btn-upgrade');
        const cost = tower.getUpgradeCost();
        const canUpgrade = cost !== Infinity && this.game.state.gold >= cost;

        btn.textContent = cost === Infinity ? '已满级' : `升级 (${cost})`;
        btn.disabled = !canUpgrade;
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
        document.getElementById('upgrade-panel').classList.add('hidden');
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }
}
