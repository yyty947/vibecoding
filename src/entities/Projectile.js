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
    update() {
        if (!this.target || !this.target.isAlive()) {
            return false; // 目标不存在，返回 false 表示应该移除
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            // 命中目标
            this.x = this.target.x;
            this.y = this.target.y;
            return 'hit';
        }

        // 移动向目标
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        return true;
    }

    // 检查是否命中目标
    checkHit() {
        if (!this.target || !this.target.isAlive()) return null;

        const dist = Helpers.distance(this.x, this.y, this.target.x, this.target.y);
        return dist < 10 ? this.target : null;
    }
}
