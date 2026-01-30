// 效果管理器 - 统一管理所有延时效果（替代散落的 setTimeout）
// 解决暂停时 setTimeout 仍运行、难以追踪等问题

export class EffectManager {
    constructor() {
        // 活跃的效果列表
        this.effects = [];
    }

    /**
     * 添加一个延时效果
     * @param {string} type - 效果类型（如 'stun', 'slow', 'message'）
     * @param {Object} target - 效果作用目标
     * @param {number} duration - 持续时间（毫秒）
     * @param {Function} onExpire - 效果到期时的回调
     * @param {Object} data - 额外数据
     */
    addEffect(type, target, duration, onExpire = null, data = {}) {
        const effect = {
            type,
            target,
            duration,
            remaining: duration,
            onExpire,
            data,
            id: Math.random().toString(36).substr(2, 9)
        };
        
        // 立即应用效果
        if (type === 'stun' && target) {
            target.stunned = true;
            target.stunEndTime = Date.now() + duration;
        } else if (type === 'slow' && target) {
            target.speedMultiplier = 1 - (data.slowFactor || 0.3);
        }
        
        this.effects.push(effect);
        return effect.id;
    }

    /**
     * 更新所有效果（在游戏循环中调用）
     * @param {number} deltaTime - 帧间隔时间（毫秒）
     * @param {boolean} isPaused - 游戏是否暂停
     */
    update(deltaTime, isPaused = false) {
        // 暂停时不更新效果剩余时间
        if (isPaused) return;

        const now = Date.now();
        
        // 倒序遍历以便安全删除
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.remaining -= deltaTime;
            
            // 检查效果是否到期
            if (effect.remaining <= 0) {
                this._expireEffect(effect);
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * 处理效果到期
     * @param {Object} effect - 效果对象
     */
    _expireEffect(effect) {
        const { type, target, onExpire } = effect;
        
        if (type === 'stun' && target) {
            // 检查是否是该效果的眩晕（防止覆盖其他眩晕）
            if (target.stunEndTime && Date.now() >= target.stunEndTime) {
                target.stunned = false;
            }
        } else if (type === 'slow' && target) {
            target.speedMultiplier = 1;
        }
        
        // 执行回调
        if (onExpire && typeof onExpire === 'function') {
            onExpire(target, effect);
        }
    }

    /**
     * 移除特定目标的所有效果
     * @param {Object} target - 目标对象
     */
    removeEffectsByTarget(target) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            if (this.effects[i].target === target) {
                this._expireEffect(this.effects[i]);
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * 移除特定类型的所有效果
     * @param {string} type - 效果类型
     */
    removeEffectsByType(type) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            if (this.effects[i].type === type) {
                this._expireEffect(this.effects[i]);
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * 清除所有效果
     */
    clear() {
        // 先让所有效果到期
        this.effects.forEach(effect => this._expireEffect(effect));
        this.effects = [];
    }

    /**
     * 获取效果数量（用于调试）
     */
    getEffectCount() {
        return this.effects.length;
    }
}
