// 子弹类
import { Helpers } from '../utils/helpers.js';

export class Projectile {
    constructor(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.targetId = data.targetId;
        this.target = data.target;
        this.damage = data.damage;
        this.speed = data.speed;
    }

    // 更新位置（向目标移动）
    // deltaTime: 距离上一帧的时间差（毫秒），用于支持游戏速度调整
    update(deltaTime) {
        if (!this.target || !this.target.isAlive()) {
            return false; // 目标不存在，返回 false 表示应该移除
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // 将速度从"每帧"转换为"每毫秒"，再乘以 deltaTime
        // 假设 60fps，每帧约 16.67ms
        const timeScale = deltaTime / 16.67;
        const moveDistance = this.speed * timeScale;

        if (dist < moveDistance) {
            // 命中目标
            this.x = this.target.x;
            this.y = this.target.y;
            return 'hit';
        }

        // 移动向目标
        this.x += (dx / dist) * moveDistance;
        this.y += (dy / dist) * moveDistance;
        return true;
    }

    // 检查是否命中目标
    checkHit() {
        if (!this.target || !this.target.isAlive()) return null;

        const dist = Helpers.distance(this.x, this.y, this.target.x, this.target.y);
        return dist < 10 ? this.target : null;
    }
}
