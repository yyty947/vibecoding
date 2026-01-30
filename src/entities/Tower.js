// 防御塔类
import { CONFIG } from '../utils/config.js';
import { Helpers } from '../utils/helpers.js';

// 注意：全局塔类型等级已移至 Game.state.towerLevels，解决多窗口干扰问题

// 注意：升级费用和倍率已移至 CONFIG.UPGRADE_COSTS 和 CONFIG.UPGRADE_MULTIPLIERS

export class Tower {
    constructor(x, y, type, towerLevels) {
        this.id = Helpers.generateId();
        this.x = x;
        this.y = y;
        this.type = type;
        // 使用传入的 towerLevels（从 Game.state 获取）
        this.level = towerLevels ? (towerLevels[type] || 1) : 1;
        this.lastFireTime = 0;

        // 从配置复制基础属性
        const config = CONFIG.TOWERS[type];
        const baseDamage = config.damage;
        const baseRange = config.range;
        const baseFireRate = config.fireRate;

        // 根据全局等级计算属性（从 CONFIG 读取倍率）
        const levelIndex = this.level - 1;
        const multipliers = CONFIG.UPGRADE_MULTIPLIERS;

        this.damage = Math.floor(baseDamage * multipliers.damage[levelIndex]);
        this.range = Math.floor(baseRange * multipliers.range[levelIndex]);
        this.fireRate = Math.floor(baseFireRate / multipliers.fireRate[levelIndex]);
        this.color = config.color;
        this.cost = config.cost;

        // 追踪累计投入成本（用于波次结算返还）
        this.totalInvested = config.cost;

        // 生命值（交战系统）
        const baseHp = CONFIG.TOWER_BASE_HP || 100;
        this.maxHp = baseHp;
        this.hp = this.maxHp;
        this.destroyed = false;

        // 电磁塔计数机制（用于可预期眩晕）
        if (type === 'em') {
            this.attackCounter = 0;  // 攻击计数器
            this.stunInterval = config.stunInterval || 4;
        }
    }

    // 获取该类型的全局等级（从 towerLevels 对象读取）
    static getGlobalLevel(type, towerLevels) {
        return towerLevels ? (towerLevels[type] || 1) : 1;
    }

    // 重置所有塔类型的全局等级（游戏重新开始时调用）
    static resetGlobalLevels(towerLevels) {
        if (towerLevels) {
            towerLevels.machinegun = 1;
            towerLevels.cannon = 1;
            towerLevels.rifle = 1;
            towerLevels.laser = 1;
            towerLevels.em = 1;
            towerLevels.rocket = 1;
        }
    }

    // 获取放置成本（支持等级税收）
    // 公式：放置成本 = 基础成本 × (1 + (等级-1) × 税收率)
    static getPlacementCost(type, towerLevels) {
        const baseCost = CONFIG.TOWERS[type].cost;
        const level = towerLevels ? (towerLevels[type] || 1) : 1;
        const taxRate = CONFIG.ECONOMY?.levelTaxRate || 0.5; // 默认每级+50%
        
        const costMultiplier = 1 + (level - 1) * taxRate;
        return Math.floor(baseCost * costMultiplier);
    }

    // 获取维护成本
    // 公式：维护费 = 等级 × 每级维护费
    static getMaintenanceCostPerTower(level) {
        const costPerLevel = CONFIG.ECONOMY?.maintenanceCostPerLevel || 10;
        return level * costPerLevel;
    }

    // 获取该类型的下一级费用（支持升级通胀）
    static getUpgradeCost(type, towerLevels) {
        const currentLevel = towerLevels ? (towerLevels[type] || 1) : 1;
        if (currentLevel >= 5) return Infinity; // 5级上限
        
        // 基础升级费用（从 CONFIG 读取）
        const upgradeCosts = CONFIG.UPGRADE_COSTS;
        const baseCost = upgradeCosts[type][currentLevel];
        // 通胀系数：已升级次数 × 通胀率（默认20%）
        const inflationRate = CONFIG.ECONOMY?.upgradeInflationRate || 0.2;
        const inflation = 1 + (currentLevel - 1) * inflationRate;
        
        return Math.floor(baseCost * inflation);
    }

    // 升级该类型的全局等级
    static upgradeType(type, towerLevels) {
        if (!towerLevels) return false;
        if (towerLevels[type] >= 5) return false;
        towerLevels[type]++;
        return true;
    }

    // 检查该类型是否已满级
    static isTypeMaxLevel(type, towerLevels) {
        return towerLevels ? (towerLevels[type] >= 5) : false;
    }

    // 更新场上所有该类型的塔（同步升级）
    static updateAllTowersOfType(towers, type, towerLevels) {
        const newLevel = towerLevels ? (towerLevels[type] || 1) : 1;
        const config = CONFIG.TOWERS[type];
        const levelIndex = newLevel - 1;
        const upgradeCosts = CONFIG.UPGRADE_COSTS;
        const upgradeCost = upgradeCosts[type][newLevel - 1]; // 刚刚花费的升级费用
        const multipliers = CONFIG.UPGRADE_MULTIPLIERS;

        towers.forEach(tower => {
            if (tower.type === type) {
                tower.level = newLevel;
                tower.damage = Math.floor(config.damage * multipliers.damage[levelIndex]);
                tower.range = Math.floor(config.range * multipliers.range[levelIndex]);
                tower.fireRate = Math.floor(config.fireRate / multipliers.fireRate[levelIndex]);
                // 更新累计投入成本
                tower.totalInvested += upgradeCost;
            }
        });
    }

    // 检查是否可以射击（基于真实时间，用于兼容性）
    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    // 检查是否可以射击（基于 deltaTime，支持游戏速度调整）
    // deltaTime: 距离上一帧的时间差（毫秒）
    canFireWithDeltaTime(deltaTime) {
        // 累积经过的时间
        if (!this._fireCooldownAccumulated) {
            this._fireCooldownAccumulated = 0;
        }
        this._fireCooldownAccumulated += deltaTime;
        
        return this._fireCooldownAccumulated >= this.fireRate;
    }

    // 射击（基于真实时间）
    fire(target, currentTime) {
        if (!this.canFire(currentTime)) return null;

        this.lastFireTime = currentTime;
        return this._createProjectile(target);
    }

    // 射击（基于 deltaTime）
    fireWithDeltaTime(target) {
        if (!this.canFireWithDeltaTime(0)) return null;

        // 重置累积的冷却时间
        this._fireCooldownAccumulated = 0;
        return this._createProjectile(target);
    }

    // 创建子弹数据
    _createProjectile(target) {
        const config = CONFIG.TOWERS[this.type];
        let isStunShot = false;
        let actualDamage = this.damage;

        // 电磁塔计数机制
        if (this.type === 'em') {
            this.attackCounter = (this.attackCounter || 0) + 1;
            // 每第N发必定眩晕
            if (this.attackCounter >= this.stunInterval) {
                this.attackCounter = 0;
                isStunShot = true;
            }
        }

        // 加农炮对高甲额外伤害
        if (this.type === 'cannon' && target.armor > config.highArmorThreshold) {
            actualDamage = Math.floor(actualDamage * config.highArmorBonus);
        }

        return {
            id: Helpers.generateId(),
            x: this.x,
            y: this.y,
            targetId: target.id,
            target: target, // 保存目标引用
            sourceTowerId: this.id, // 保存来源塔ID，用于护甲计算
            damage: actualDamage,
            speed: CONFIG.PROJECTILE_SPEED,
            isStunShot: isStunShot,  // 标记是否为眩晕弹
            stunDuration: isStunShot ? config.stunDuration : 0
        };
    }

    // 获取电磁塔当前计数（用于渲染显示）
    getAttackCounter() {
        return this.attackCounter || 0;
    }

    // 获取电磁塔计数上限
    getStunInterval() {
        return this.stunInterval || 4;
    }

    // 获取塔类型对应的音效名称
    getSoundName() {
        const soundMap = {
            'machinegun': 'tower_machinegun',
            'cannon': 'tower_cannon',
            'rifle': 'tower_sniper',
            'laser': 'tower_laser',
            'em': 'tower_em',
            'rocket': 'tower_rocket'
        };
        return soundMap[this.type] || null;
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
