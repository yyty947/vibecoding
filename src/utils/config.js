// 游戏配置常量
export const CONFIG = {
    // 画布尺寸 - 动态获取
    get CANVAS_WIDTH() { return window.innerWidth || 1200; },
    get CANVAS_HEIGHT() { return window.innerHeight || 800; },

    // 游戏平衡参数
    INITIAL_LIVES: 10,
    INITIAL_GOLD: 400, // 初始金币（可放置8个机枪塔或组合搭配）
    INITIAL_LEVEL: 1,

    // 游戏节奏配置
    PREPARATION_TIME: 8000, // 发育时间（毫秒）- 第一波敌人出现前的等待时间

    // 防御塔配置
    TOWERS: {
        machinegun: {
            name: '机枪塔',
            damage: 10,
            range: 120,
            fireRate: 200, // 毫秒
            cost: 50,
            color: '#4a9eff',
            upgradeMultiplier: { damage: 1.5, range: 1.2, fireRate: 1.1 }
        },
        cannon: {
            name: '加农炮',
            damage: 30,
            range: 80,
            fireRate: 1000,
            cost: 100,
            color: '#ff6b4a',
            upgradeMultiplier: { damage: 1.6, range: 1.1, fireRate: 1.2 }
        },
        rifle: {
            name: '狙击塔',
            damage: 50,
            range: 200,
            fireRate: 1500,
            cost: 75,
            color: '#4aff6b',
            upgradeMultiplier: { damage: 1.7, range: 1.3, fireRate: 1.15 }
        }
    },

    // 敌人配置
    ENEMIES: {
        soldier: {
            name: '士兵',
            hp: 30,
            speed: 1,
            damage: 1,
            reward: 20, // 增加金币奖励
            color: '#ff4444',
            size: 15
        },
        landing_craft: {
            name: '登陆艇',
            hp: 100,
            speed: 0.5,
            damage: 5,
            reward: 60, // 增加金币奖励
            color: '#ff8800',
            size: 25
        }
    },

    // 波次配置
    WAVES: {
        classic: {
            totalWaves: 10,
            baseEnemyCount: 40,
            baseHpMultiplier: 1.0
        },
        endless: {
            baseEnemyCount: 40,
            baseHpMultiplier: 1.0,
            waveIncrement: 0.1
        }
    },

    // 波次机制配置（集中管理）
    WAVE_MECHANICS: {
        preparationTime: 8000,      // 首波准备时间（毫秒）
        waveCompleteDelay: 2000,    // 波次完成后等待时间（毫秒）
        baseSpawnInterval: 1200,    // 波次开始时的生成间隔（毫秒）
        minSpawnInterval: 300,      // 最小生成间隔（毫秒）
        intervalDecay: 0.7,         // 间隔衰减系数（70%的间隔会在波次内逐渐消失）
        enemyCountPerWave: 5,       // 每波增加的敌人数量
        intervalDecreasePerWave: 60 // 每波基础间隔减少量（毫秒）
    },

    // 升级配置
    MAX_TOWER_LEVEL: 3,
    UPGRADE_COST_MULTIPLIER: 1.5,

    // 子弹配置
    PROJECTILE_SPEED: 5,

    // 地图配置
    MAP: {
        spawnY: 50, // 敌人生成位置（从上方）
        endY: 750,  // 敌人终点（下方防线）
        gridSize: 40 // 放置网格大小
    }
};
