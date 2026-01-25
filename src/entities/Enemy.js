// 敌军类
import { CONFIG } from '../utils/config.js';
import { Helpers } from '../utils/helpers.js';

export class Enemy {
    constructor(type, x, y, waveMultiplier = 1) {
        this.id = Helpers.generateId();
        this.type = type;
        this.x = x;
        this.y = y;

        // 从配置复制属性，并根据波次调整
        const config = CONFIG.ENEMIES[type];
        this.maxHp = Math.floor(config.hp * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.reward = config.reward;
        this.color = config.color;
        this.size = config.size;

        // 移动方向：向下移动
        this.vx = 0;
        this.vy = this.speed;
    }

    // 更新位置
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    // 受到伤害
    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0; // 返回是否死亡
    }

    // 检查是否到达终点
    reachedEnd() {
        return this.y >= CONFIG.MAP.endY;
    }

    // 检查是否存活
    isAlive() {
        return this.hp > 0;
    }
}
