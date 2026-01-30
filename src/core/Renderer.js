// 渲染器 - 负责所有 Canvas 绘制
import { CONFIG } from '../utils/config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }

    // 调整画布尺寸为窗口大小
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
            // 计算血量透明度（交战系统）
            const hpRatio = tower.hp / tower.maxHp;

            // 绘制射程圈
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(74, 158, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 绘制塔基座 - 等级越高，基座越大
            const baseSize = 18 + tower.level * 3; // 1级:21, 5级:33
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, baseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = '#333';
            this.ctx.fill();

            // 等级边框效果
            const isMaxLevel = tower.level >= 5;
            if (isMaxLevel) {
                // 满级特殊效果 - 渐变边框
                const gradient = this.ctx.createRadialGradient(
                    tower.x, tower.y, baseSize - 5,
                    tower.x, tower.y, baseSize + 5
                );
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0.4)');
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 4;
            } else {
                // 普通等级 - 边框颜色随等级变化
                const borderColors = ['#666', '#888', '#4a9eff', '#9b59b6', '#ffffff'];
                this.ctx.strokeStyle = borderColors[tower.level - 1] || '#666';
                this.ctx.lineWidth = 2 + Math.floor(tower.level / 2);
            }
            this.ctx.stroke();

            // 绘制塔主体 - 根据血量调整透明度，等级越高塔越大
            const towerSize = 10 + tower.level * 2;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, towerSize, 0, Math.PI * 2);

            // 将颜色转换为 RGBA 并应用透明度
            const alpha = 0.3 + (hpRatio * 0.7);
            this.ctx.fillStyle = this.hexToRgba(tower.color, alpha);
            this.ctx.fill();

            // 绘制等级标识
            this.ctx.fillStyle = isMaxLevel ? '#ffd700' : '#fff';
            this.ctx.font = `bold ${12 + tower.level}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText(tower.level, tower.x, tower.y);
            this.ctx.shadowBlur = 0;

            // 电磁塔计数显示（可预期眩晕的视觉反馈）
            if (tower.type === 'em') {
                const counter = tower.getAttackCounter();
                const interval = tower.getStunInterval();
                const isReady = counter >= interval - 1; // 下一发就是眩晕

                // 在塔下方绘制计数圆点
                const dotRadius = 3;
                const dotSpacing = 8;
                const startX = tower.x - (interval - 1) * dotSpacing / 2;
                const dotY = tower.y + baseSize + 8;

                for (let i = 0; i < interval; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(startX + i * dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
                    if (i < counter) {
                        // 已填充的点（蓝色）
                        this.ctx.fillStyle = '#44ffff';
                    } else if (i === counter && isReady) {
                        // 下一发眩晕（闪烁金色）
                        this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
                    } else {
                        // 未填充的点（灰色）
                        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                    }
                    this.ctx.fill();
                }
            }
        });
    }

    // 辅助方法：将十六进制颜色转换为 RGBA
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 绘制敌人
    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            // 绘制敌人主体
            this.ctx.beginPath();
            if (enemy.type === 'soldier' || enemy.type === 'suicide') {
                // 士兵/自杀兵：圆形
                this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            } else if (enemy.type === 'landing_craft') {
                // 登陆艇：矩形
                this.ctx.rect(enemy.x - enemy.size, enemy.y - enemy.size / 2, enemy.size * 2, enemy.size);
            } else if (enemy.type === 'tank') {
                // 坦克：正方形
                this.ctx.rect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
            } else {
                // 默认：圆形
                this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
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
