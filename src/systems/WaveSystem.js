// 波次管理系统
import { CONFIG } from '../utils/config.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveSystem {
    constructor(game) {
        this.game = game;
        this.currentWave = 0;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;
    }

    // 开始新波次
    startWave(waveNumber) {
        this.currentWave = waveNumber;
        const config = this.getWaveConfig(waveNumber);

        // 生成敌人列表
        this.enemiesToSpawn = [];
        for (let i = 0; i < config.enemyCount; i++) {
            // 随机选择敌人类型
            const types = config.enemyTypes;
            const type = types[Math.floor(Math.random() * types.length)];

            // 随机生成位置
            const x = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);

            this.enemiesToSpawn.push({
                type,
                x,
                y: CONFIG.MAP.spawnY,
                hpMultiplier: config.hpMultiplier
            });
        }

        this.spawnTimer = 0;
        this.waveInProgress = true;
    }

    // 获取波次配置
    getWaveConfig(waveNumber) {
        const mode = this.game.state.mode;

        if (mode === 'classic') {
            // 经典模式：固定波次配置
            const baseCount = CONFIG.WAVES.classic.baseEnemyCount;
            const count = baseCount + Math.floor(waveNumber * 1.5);
            const hpMult = CONFIG.WAVES.classic.baseHpMultiplier + (waveNumber - 1) * 0.15;

            // 随着波次增加，可能出现登陆艇
            let types = ['soldier'];
            if (waveNumber >= 3) types.push('landing_craft');

            return {
                waveNumber,
                enemyCount: count,
                enemyTypes: types,
                spawnInterval: Math.max(500, 1500 - waveNumber * 50),
                hpMultiplier: hpMult
            };
        } else {
            // 无尽模式：持续递增
            const baseCount = CONFIG.WAVES.endless.baseEnemyCount;
            const increment = CONFIG.WAVES.endless.waveIncrement;
            const count = Math.floor(baseCount + waveNumber * 2);
            const hpMult = CONFIG.WAVES.endless.baseHpMultiplier + waveNumber * increment;

            let types = ['soldier'];
            if (waveNumber >= 3) types.push('landing_craft');

            return {
                waveNumber,
                enemyCount: count,
                enemyTypes: types,
                spawnInterval: Math.max(400, 1200 - waveNumber * 30),
                hpMultiplier: hpMult
            };
        }
    }

    // 更新生成逻辑
    update(deltaTime) {
        // 如果没有敌人需要生成，检查是否波次完成
        if (this.enemiesToSpawn.length === 0) {
            // 所有敌人都已生成，等待当前敌人被消灭
            if (this.waveInProgress && this.game.state.enemies.length === 0) {
                this.waveInProgress = false;
                return 'waveComplete';
            }
            return null;
        }

        if (!this.waveInProgress) {
            return null;
        }

        this.spawnTimer += deltaTime;

        // 根据配置的间隔生成敌人
        const config = this.getWaveConfig(this.currentWave);
        const interval = Math.max(config.spawnInterval, 800); // 最小800ms间隔

        if (this.spawnTimer >= interval) {
            const enemyData = this.enemiesToSpawn.shift();
            const enemy = new Enemy(
                enemyData.type,
                enemyData.x,
                enemyData.y,
                enemyData.hpMultiplier
            );
            this.spawnTimer = 0;
            return enemy;
        }

        return null;
    }

    // 检查波次是否完成
    isWaveComplete() {
        return !this.waveInProgress && this.enemiesToSpawn.length === 0 && this.game.state.enemies.length === 0;
    }

    // 检查经典模式是否通关
    isClassicComplete() {
        return this.game.state.mode === 'classic' && this.currentWave >= CONFIG.WAVES.classic.totalWaves;
    }
}
