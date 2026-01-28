// 游戏配置常量
export const CONFIG = {
    // 画布尺寸 - 动态获取
    get CANVAS_WIDTH() { return window.innerWidth || 1200; },
    get CANVAS_HEIGHT() { return window.innerHeight || 800; },

    // 游戏平衡参数
    INITIAL_LIVES: 10,
    INITIAL_GOLD: 500, // 初始金币（可放置10个机枪塔，新手容错）
    INITIAL_LEVEL: 1,

    // 游戏节奏配置
    PREPARATION_TIME: 10000, // 首波发育时间（毫秒）- 从8秒改为10秒

    // 防御塔配置
    TOWERS: {
        // 初始解锁
        machinegun: {
            name: '机枪塔',
            damage: 10,
            range: 120,
            fireRate: 200,
            cost: 50,
            color: '#4a9eff',
            unlockWave: 0,  // 初始解锁
            upgradeMultiplier: { damage: 1.5, range: 1.2, fireRate: 1.1 }
        },
        cannon: {
            name: '加农炮',
            damage: 30,
            range: 80,
            fireRate: 1000,
            cost: 100,
            color: '#ff6b4a',
            unlockWave: 0,  // 初始解锁
            upgradeMultiplier: { damage: 1.6, range: 1.1, fireRate: 1.2 }
        },
        // 波次2解锁
        rifle: {
            name: '狙击塔',
            damage: 50,
            range: 200,
            fireRate: 1500,
            cost: 75,
            color: '#4aff6b',
            unlockWave: 2,  // 从波次3提前到波次2
            upgradeMultiplier: { damage: 1.7, range: 1.3, fireRate: 1.15 }
        },
        // 波次5解锁
        laser: {
            name: '激光塔',
            damage: 8,  // 从15降低到8，平衡性价比
            range: 150,
            fireRate: 150,  // 从100ms调整到150ms
            cost: 125,
            color: '#ff44ff',
            unlockWave: 5,
            upgradeMultiplier: { damage: 1.4, range: 1.15, fireRate: 1.05 }
        },
        // 波次7解锁
        em: {
            name: '电磁塔',
            damage: 25,
            range: 100,
            fireRate: 800,
            cost: 150,
            color: '#44ffff',
            unlockWave: 7,
            upgradeMultiplier: { damage: 1.5, range: 1.2, fireRate: 1.1 }
        },
        // 波次10解锁
        rocket: {
            name: '火箭塔',
            damage: 120,  // 从80提升到120
            range: 180,
            fireRate: 1500,  // 从2000ms提升到1500ms
            cost: 200,
            color: '#ff8800',
            unlockWave: 10,
            upgradeMultiplier: { damage: 1.8, range: 1.15, fireRate: 1.2 }
        }
    },

    // ��人配置
    ENEMIES: {
        soldier: {
            name: '士兵',
            hp: 30,
            speed: 1,
            damage: 1,          // 突破防线的伤害
            reward: 25,  // 从20提升到25，提升基础经济
            color: '#ff4444',
            size: 15,
            // 攻击防御塔相关（交战系统）
            attackDamage: 8,    // 对防御塔的伤害
            attackRange: 40,    // 攻击范围
            attackCooldown: 1000 // 攻击冷却（毫秒）
        },
        landing_craft: {
            name: '登陆艇',
            hp: 100,
            speed: 0.5,
            damage: 5,
            reward: 70,  // 从60提升到70，提升中期经济
            color: '#ff8800',
            size: 25,
            // 攻击防御塔相关（交战系统）
            attackDamage: 20,   // 对防御塔的伤害
            attackRange: 50,    // 攻击范围
            attackCooldown: 1500 // 攻击冷却（毫秒）
        },
        // 新敌人类型：坦克（高血量，慢速）
        tank: {
            name: '坦克',
            hp: 200,
            speed: 0.3,
            damage: 10,
            reward: 80,
            color: '#884400',
            size: 30,
            shape: 'tank',
            // 攻击防御塔相关
            attackDamage: 35,   // 高伤害
            attackRange: 60,    // 远射程
            attackCooldown: 2000 // 慢攻速
        },
        // 新敌人类型：自杀式袭击者（低血量，快速，自爆伤害）
        suicide: {
            name: '自杀兵',
            hp: 20,
            speed: 2,           // 快速
            damage: 1,
            reward: 30,
            color: '#ff00ff',
            size: 12,
            shape: 'suicide',
            // 攻击防御塔相关
            attackDamage: 50,   // 自爆高伤害
            attackRange: 20,    // 需要靠近
            attackCooldown: 500 // 快速攻击
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
            waveIncrement: 0.08  // 从0.1降到0.08，放缓难度增长
        }
    },

    // 波次机制配置（集中管理）
    WAVE_MECHANICS: {
        firstWavePreparationTime: 10000,  // 首波准备时间（毫秒）
        wavePreparationTime: 3000,        // 后续波次准备时间（毫秒）
        waveCompleteDelay: 2000,          // 波次完成后等待时间（毫秒）
        baseSpawnInterval: 1200,          // 波次开始时的生成间隔（毫秒）
        minSpawnInterval: 300,            // 最小生成间隔（毫秒）
        intervalDecay: 0.7,               // 间隔衰减系数（70%的间隔会在波次内逐渐消失）
        enemyCountPerWave: 5,             // 每波增加的敌��数量
        intervalDecreasePerWave: 60       // 每波基础间隔减少量（毫秒）
    },

    // 波次结算配置
    WAVE_SETTLEMENT: {
        clearRatio: 0.5,     // 清除比例（50%）
        refundRatio: 0.5     // 返还比例（50%）
    },

    // 连击（Combo）系统配置
    COMBO: {
        windowMs: 2000,             // Combo 有效时间窗口（毫秒）
        maxMultiplier: 3,           // 最高倍率
        multiplierSteps: [         // 倍率阶梯（击杀数 -> 倍率）
            { kills: 3, mult: 1.5 },
            { kills: 5, mult: 2 },
            { kills: 8, mult: 3 }
        ]
    },

    // 升级配置
    MAX_TOWER_LEVEL: 5,  // 从3级改为5级
    UPGRADE_COST_MULTIPLIER: 1.5,

    // 防御塔基础生命值（交战系统）
    TOWER_BASE_HP: 200,

    // 子弹配置
    PROJECTILE_SPEED: 5,

    // 地图配置
    MAP: {
        spawnY: 50, // 敌人生成位置（从上方）
        endY: 900,  // 敌人终点（下方防线）
        gridSize: 40 // 放置网格大小
    }
};
