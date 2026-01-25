// 渲染器 - 负责所有 Canvas 绘制
import { CONFIG } from '../utils/config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    }

    // 调整画布尺寸
    resize() {
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    }

    // 清空画布（黑色背景）
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 绘制地图/防线
    drawMap() {
        // 绘制敌军出发区域（上方）
        this.ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, 100);

        // 绘制玩家防线（下方）
        this.ctx.fillStyle = 'rgba(74, 158, 255, 0.3)';
        this.ctx.fillRect(0, CONFIG.MAP.endY - 20, this.canvas.width, 20);

        // 绘制防线文字
        this.ctx.fillStyle = '#4a9eff';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('=== 防线 ===', this.canvas.width / 2, CONFIG.MAP.endY - 30);

        // 绘制放置网格（可选，调试用）
        // this.drawGrid();
    }

    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += CONFIG.MAP.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += CONFIG.MAP.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // 绘制防御塔
    drawTowers(towers) {
        towers.forEach(tower => {
            // 绘制射程圈
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(74, 158, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 绘制塔基座
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = '#333';
            this.ctx.fill();
            this.ctx.strokeStyle = tower.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 绘制塔主体
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
            this.ctx.fillStyle = tower.color;
            this.ctx.fill();

            // 绘制等级标识
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(tower.level, tower.x, tower.y);
        });
    }

    // 绘制敌人
    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            // 绘制敌人主体
            this.ctx.beginPath();
            if (enemy.type === 'soldier') {
                // 士兵：圆形
                this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            } else {
                // 登陆艇：矩形
                this.ctx.rect(enemy.x - enemy.size, enemy.y - enemy.size / 2, enemy.size * 2, enemy.size);
            }
            this.ctx.fillStyle = enemy.color;
            this.ctx.fill();

            // 绘制血条背景
            const barWidth = enemy.size * 2;
            const barHeight = 4;
            const barX = enemy.x - barWidth / 2;
            const barY = enemy.y - enemy.size - 10;

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // 绘制当前血量
            const healthPercent = enemy.hp / enemy.maxHp;
            this.ctx.fillStyle = healthPercent > 0.3 ? '#4aff4a' : '#ff4444';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        });
    }

    // 绘制子弹
    drawProjectiles(projectiles) {
        projectiles.forEach(proj => {
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fill();
        });
    }

    // 绘制特效（爆炸等）
    drawEffects(effects) {
        effects.forEach(effect => {
            const progress = effect.age / effect.maxAge;
            const alpha = 1 - progress;
            const size = effect.size * (1 + progress);

            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
            this.ctx.fill();
        });
    }

    // 绘制放置预览
    drawPlacementPreview(x, y, towerType, canPlace) {
        const config = CONFIG.TOWERS[towerType];

        // 绘制射程预览
        this.ctx.beginPath();
        this.ctx.arc(x, y, config.range, 0, Math.PI * 2);
        this.ctx.fillStyle = canPlace ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255, 68, 68, 0.2)';
        this.ctx.fill();
        this.ctx.strokeStyle = canPlace ? 'rgba(74, 158, 255, 0.5)' : 'rgba(255, 68, 68, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 绘制塔预览
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = canPlace ? 'rgba(74, 158, 255, 0.5)' : 'rgba(255, 68, 68, 0.5)';
        this.ctx.fill();
    }
}
