// 防御塔类
import { CONFIG } from '../utils/config.js';
import { Helpers } from '../utils/helpers.js';

// 全局塔类型等级（每个类型一个全局等级）
const globalTowerLevels = {
    machinegun: 1,
    cannon: 1,
    rifle: 1,
    laser: 1,
    em: 1,
    rocket: 1
};

// 升级费用表（每种类型每个等级的费用）- 最高5级
const upgradeCosts = {
    machinegun: [0, 80, 160, 280, 450],   // 1->2: 80, 2->3: 160, 3->4: 280, 4->5: 450
    cannon: [0, 150, 300, 500, 800],
    rifle: [0, 120, 240, 400, 650],
    laser: [0, 200, 400, 700, 1100],
    em: [0, 250, 500, 850, 1300],
    rocket: [0, 300, 600, 1000, 1500]
};

// 升级倍率表 - 最高5级
const upgradeMultipliers = {
    damage: [1, 1.4, 1.9, 2.5, 3.2],     // 1级: 1x, 2级: 1.4x, 3级: 1.9x, 4级: 2.5x, 5级: 3.2x
    range: [1, 1.15, 1.3, 1.45, 1.6],
    fireRate: [1, 1.08, 1.15, 1.22, 1.3]  // 射速提升
};

export class Tower {
    constructor(x, y, type) {
        this.id = Helpers.generateId();
        this.x = x;
        this.y = y;
        this.type = type;
        // 使用全局等级
        this.level = globalTowerLevels[type];
        this.lastFireTime = 0;

        // 从配置复制基础属性
        const config = CONFIG.TOWERS[type];
        const baseDamage = config.damage;
        const baseRange = config.range;
        const baseFireRate = config.fireRate;

        // 根据全局等级计算属性
        const levelIndex = this.level - 1;

        this.damage = Math.floor(baseDamage * upgradeMultipliers.damage[levelIndex]);
        this.range = Math.floor(baseRange * upgradeMultipliers.range[levelIndex]);
        this.fireRate = Math.floor(baseFireRate / upgradeMultipliers.fireRate[levelIndex]);
        this.color = config.color;
        this.cost = config.cost;

        // 追踪累计投入成本（用于波次结算返还）
        this.totalInvested = config.cost;

        // 生命值（交战系统）
        const baseHp = CONFIG.TOWER_BASE_HP || 100;
        this.maxHp = baseHp;
        this.hp = this.maxHp;
        this.destroyed = false;
    }

    // 获取该类型的全局等级
    static getGlobalLevel(type) {
        return globalTowerLevels[type] || 1;
    }

    // 获取该类型的下一级费用
    static getUpgradeCost(type) {
        const currentLevel = globalTowerLevels[type];
        if (currentLevel >= 5) return Infinity; // 5级上限
        return upgradeCosts[type][currentLevel];
    }

    // 升级该类型的全局等级
    static upgradeType(type) {
        if (globalTowerLevels[type] >= 5) return false;
        globalTowerLevels[type]++;
        return true;
    }

    // 检查该类型是否已满级
    static isTypeMaxLevel(type) {
        return globalTowerLevels[type] >= 5;
    }

    // 更新场上所有该类型的塔（同步升级）
    static updateAllTowersOfType(towers, type) {
        const newLevel = globalTowerLevels[type];
        const config = CONFIG.TOWERS[type];
        const levelIndex = newLevel - 1;
        const upgradeCost = upgradeCosts[type][newLevel - 1]; // 刚刚花费的升级费用

        towers.forEach(tower => {
            if (tower.type === type) {
                tower.level = newLevel;
                tower.damage = Math.floor(config.damage * upgradeMultipliers.damage[levelIndex]);
                tower.range = Math.floor(config.range * upgradeMultipliers.range[levelIndex]);
                tower.fireRate = Math.floor(config.fireRate / upgradeMultipliers.fireRate[levelIndex]);
                // 更新累计投入成本
                tower.totalInvested += upgradeCost;
            }
        });
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

    // 受到伤害
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.destroyed = true;
        }
    }

    // 检查是否存活
    isAlive() {
        return !this.destroyed;
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
