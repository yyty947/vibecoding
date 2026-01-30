// 伤害计算系统 - 集中处理所有伤害计算逻辑
// 从 Game.js 提取，避免 Game.update() 过于臃肿
import { CONFIG } from '../utils/config.js';

export class DamageSystem {
    /**
     * 计算子弹对目标的伤害
     * @param {Object} projectile - 子弹对象
     * @param {Object} target - 目标敌人
     * @param {Object} sourceTower - 来源防御塔
     * @param {number} currentWave - 当前波次
     * @returns {Object} 计算结果 { damage: number, isStun: boolean, stunDuration: number }
     */
    static calculateDamage(projectile, target, sourceTower, currentWave) {
        // 基础伤害
        let baseDamage = projectile.damage;
        
        // 1. 机枪塔后期效率衰减（第7波后伤害×0.7）
        if (sourceTower && sourceTower.type === 'machinegun') {
            const penaltyStartWave = CONFIG.ECONOMY?.machinegunPenaltyStartWave || 7;
            const penalty = CONFIG.ECONOMY?.machinegunLateGamePenalty || 0.7;
            if (currentWave >= penaltyStartWave) {
                baseDamage = Math.floor(baseDamage * penalty);
            }
        }
        
        // 2. 护甲计算：实际伤害 = 伤害 × (1 - 敌人护甲 + 塔破甲)
        let actualDamage = baseDamage;
        if (target.armor && target.armor > 0) {
            const armorPenetration = sourceTower ? (CONFIG.TOWERS[sourceTower.type].armorPenetration || 0) : 0;
            const effectiveArmor = Math.max(0, target.armor - armorPenetration);
            actualDamage = Math.floor(baseDamage * (1 - effectiveArmor));
        }
        
        // 3. 对眩晕目标伤害加成（所有塔共享）
        const towerConfig = sourceTower ? CONFIG.TOWERS[sourceTower.type] : null;
        if (target.stunned && towerConfig && towerConfig.stunDamageBonus) {
            actualDamage = Math.floor(actualDamage * towerConfig.stunDamageBonus);
        }
        
        return {
            damage: actualDamage,
            isStun: projectile.isStunShot || false,
            stunDuration: projectile.stunDuration || 0
        };
    }
    
    /**
     * 计算溅射伤害
     * @param {number} baseDamage - 基础伤害
     * @param {Object} sourceTower - 来源防御塔
     * @param {Object} enemy - 溅射目标
     * @returns {number} 溅射伤害值
     */
    static calculateSplashDamage(baseDamage, sourceTower, enemy) {
        // 溅射伤害减半
        let splashDamage = Math.floor(baseDamage * 0.5);
        
        // 护甲计算
        if (enemy.armor && enemy.armor > 0) {
            const armorPenetration = sourceTower ? (CONFIG.TOWERS[sourceTower.type].armorPenetration || 0) : 0;
            const effectiveArmor = Math.max(0, enemy.armor - armorPenetration);
            splashDamage = Math.floor(splashDamage * (1 - effectiveArmor));
        }
        
        return splashDamage;
    }
    
    /**
     * 获取减速效果信息（由调用方使用 EffectManager 应用）
     * @param {Object} towerConfig - 防御塔配置
     * @returns {Object|null} 效果信息 { type: 'slow', duration: number, data: {} }
     */
    static getSlowEffectInfo(towerConfig) {
        if (towerConfig && towerConfig.slowEffect && towerConfig.slowEffect > 0) {
            return {
                type: 'slow',
                duration: 3000, // 3秒
                data: { slowFactor: towerConfig.slowEffect }
            };
        }
        return null;
    }
    
    /**
     * 获取眩晕效果信息（由调用方使用 EffectManager 应用）
     * @param {boolean} isStun - 是否触发眩晕
     * @param {number} duration - 眩晕持续时间（毫秒）
     * @returns {Object|null} 效果信息 { type: 'stun', duration: number }
     */
    static getStunEffectInfo(isStun, duration) {
        if (isStun && duration > 0) {
            return {
                type: 'stun',
                duration: duration
            };
        }
        return null;
    }
}
