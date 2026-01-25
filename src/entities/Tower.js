// 防御塔类
import { CONFIG } from '../utils/config.js';
import { Helpers } from '../utils/helpers.js';

export class Tower {
    constructor(x, y, type) {
        this.id = Helpers.generateId();
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        this.lastFireTime = 0;

        // 从配置复制属性
        const config = CONFIG.TOWERS[type];
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.cost = config.cost;
    }

    // 升级防御塔
    upgrade() {
        if (this.level >= CONFIG.MAX_TOWER_LEVEL) return false;

        const config = CONFIG.TOWERS[this.type];
        const mult = config.upgradeMultiplier;

        this.level++;
        this.damage = Math.floor(this.damage * mult.damage);
        this.range = Math.floor(this.range * mult.range);
        this.fireRate = Math.floor(this.fireRate / mult.fireRate);

        return true;
    }

    // 获取升级费用
    getUpgradeCost() {
        if (this.level >= CONFIG.MAX_TOWER_LEVEL) return Infinity;
        return Math.floor(this.cost * CONFIG.UPGRADE_COST_MULTIPLIER * this.level);
    }

    // 检查是否可以射击
    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    // 射击
    fire(target, currentTime) {
        if (!this.canFire(currentTime)) return null;

        this.lastFireTime = currentTime;
        return {
            id: Helpers.generateId(),
            x: this.x,
            y: this.y,
            targetId: target.id,
            target: target, // 保存目标引用
            damage: this.damage,
            speed: CONFIG.PROJECTILE_SPEED
        };
    }

    // 获取范围内最近的敌人
    getTarget(enemies) {
        let closest = null;
        let minDist = this.range;

        enemies.forEach(enemy => {
            const dist = Helpers.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.range && dist < minDist) {
                closest = enemy;
                minDist = dist;
            }
        });

        return closest;
    }
}
