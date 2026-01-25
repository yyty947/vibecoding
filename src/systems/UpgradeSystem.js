// 升级系统
import { CONFIG } from '../utils/config.js';

export class UpgradeSystem {
    // 检查是否可以购买
    static canAfford(cost, gold) {
        return gold >= cost;
    }

    // 检查是否可以升级
    static canUpgrade(tower, gold) {
        if (tower.level >= CONFIG.MAX_TOWER_LEVEL) return false;
        const cost = tower.getUpgradeCost();
        return this.canAfford(cost, gold);
    }

    // 升级防御塔
    static upgrade(tower, gold) {
        if (!this.canUpgrade(tower, gold)) return null;

        const cost = tower.getUpgradeCost();
        tower.upgrade();

        return {
            success: true,
            cost,
            newLevel: tower.level,
            newDamage: tower.damage,
            newRange: tower.range
        };
    }

    // 计算玩家等级
    static calculateLevel(kills, waves) {
        // 简单的等级公式：每10击杀 + 每2波 = 1级
        return Math.floor(kills / 10) + Math.floor(waves / 2) + 1;
    }
}
