// 游戏配置常量
export const CONFIG = {
    // 画布尺寸 - 动态获取
    get CANVAS_WIDTH() { return window.innerWidth || 1200; },
    get CANVAS_HEIGHT() { return window.innerHeight || 800; },

    // 游戏平衡参数
    INITIAL_LIVES: 10,
    INITIAL_GOLD: 350, // 初始金币（可放置7个机枪塔，降低经济容错，增加策略压力）
    INITIAL_LEVEL: 1,

    // 游戏节奏配置
    PREPARATION_TIME: 10000, // 首波发育时间（毫秒）- 从8秒改为10秒

    // 防御塔配置 - 方案A：分工明确化，每种塔有不可替代的场景
    TOWERS: {
        // 机枪塔：清杂专用，打不动重甲
        machinegun: {
            name: '机枪塔',
            damage: 8,          // 10→8，稍微削弱
            range: 120,
            fireRate: 200,
            cost: 50,
            color: '#4a9eff',
            unlockWave: 0,
            armorPenetration: 0,    // 无破甲，打重甲刮痧
            description: '高射速清杂，对无甲单位高效，对重甲无效',
            upgradeMultiplier: { damage: 1.5, range: 1.2, fireRate: 1.1 }
        },
        // 加农炮：破甲专家，重甲克星
        cannon: {
            name: '加农炮',
            damage: 35,         // 40→35，微调基础伤害
            range: 85,          // 80→85，小幅增加
            fireRate: 750,      // 800→750，更快节奏
            cost: 100,
            color: '#ff6b4a',
            unlockWave: 0,
            armorPenetration: 0.8,  // 50%→80%，专业破甲
            splashRadius: 40,       // 30→40，更大溅射范围
            // 对高甲额外伤害：护甲>0.5的敌人受到1.5倍伤害
            highArmorBonus: 1.5,
            highArmorThreshold: 0.5,
            description: '重甲克星，对高护甲敌人伤害+50%',
            upgradeMultiplier: { damage: 1.6, range: 1.1, fireRate: 1.2 }
        },
        // 狙击塔：点杀高威胁
        rifle: {
            name: '狙击塔',
            damage: 150,        // 50→150，3倍伤害能秒士兵
            range: 200,
            fireRate: 2000,     // 1500→2000，更慢，必须精准
            cost: 75,
            color: '#4aff6b',
            unlockWave: 2,
            armorPenetration: 1.0,  // 100%破甲，专杀坦克
            description: '超远程点杀，专门处理坦克等高威胁单位',
            upgradeMultiplier: { damage: 1.7, range: 1.3, fireRate: 1.15 }
        },
        // 激光塔：高射速拦截 + 减速
        laser: {
            name: '激光塔',
            damage: 5,          // 8→5，单次伤害低
            range: 150,
            fireRate: 100,      // 150→100，更快
            cost: 125,
            color: '#ff44ff',
            unlockWave: 5,
            armorPenetration: 0.3,  // 30%破甲
            slowEffect: 0.3,        // 新增：减速30%
            description: '极速射击+减速，专门拦截自杀兵和集群',
            upgradeMultiplier: { damage: 1.4, range: 1.15, fireRate: 1.05 }
        },
        // 电磁塔：节奏控制核心
        em: {
            name: '电磁塔',
            damage: 18,         // 20→18，小幅下调
            range: 120,         // 100→120，更好覆盖
            fireRate: 600,      // 800→600，更快攻击节奏
            cost: 150,
            color: '#44ffff',
            unlockWave: 7,
            armorPenetration: 0.4,
            // 计数眩晕机制：每第4发必定眩晕
            stunInterval: 4,        // 每4发眩晕一次（可预期）
            stunDuration: 1500,     // 1秒→1.5秒，更长控制
            stunDamageBonus: 1.5,   // 对眩晕目标伤害+50%
            description: '每4发眩晕1.5秒，控场核心',
            upgradeMultiplier: { damage: 1.5, range: 1.2, fireRate: 1.1 }
        },
        // 火箭塔：终极清场
        rocket: {
            name: '火箭塔',
            damage: 100,        // 120→100
            range: 180,
            fireRate: 2000,     // 1500→2000，更慢但威力大
            cost: 200,
            color: '#ff8800',
            unlockWave: 10,
            armorPenetration: 0.5,
            splashRadius: 80,       // 大范围溅射
            description: '大范围溅射，后期必备一炮清场',
            upgradeMultiplier: { damage: 1.8, range: 1.15, fireRate: 1.2 }
        }
    },

    // 敌人配置 - 方案A：威胁重构，让敌人能真正打出伤害
    // unlockWave: 解锁波次，WaveSystem 自动根据此字段决定何时出现
    ENEMIES: {
        soldier: {
            name: '士兵',
            hp: 80,
            speed: 1,
            damage: 1,
            reward: 18,
            color: '#ff4444',
            size: 15,
            armor: 0,
            unlockWave: 1,      // 第1波即出现
            attackDamage: 15,
            attackRange: 40,
            attackCooldown: 500
        },
        landing_craft: {
            name: '登陆艇',
            hp: 300,
            speed: 0.5,
            damage: 5,
            reward: 30,
            color: '#ff8800',
            size: 25,
            armor: 0.3,
            unlockWave: 3,      // 第3波解锁
            attackDamage: 40,
            attackRange: 50,
            attackCooldown: 1000
        },
        tank: {
            name: '坦克',
            hp: 600,
            speed: 0.3,
            damage: 10,
            reward: 40,
            color: '#884400',
            size: 30,
            shape: 'tank',
            armor: 0.6,
            unlockWave: 5,      // 第5波解锁
            attackDamage: 80,
            attackRange: 100,
            attackCooldown: 2000
        },
        suicide: {
            name: '自杀兵',
            hp: 50,
            speed: 2.5,
            damage: 1,
            reward: 22,
            color: '#ff00ff',
            size: 12,
            shape: 'suicide',
            armor: 0,
            unlockWave: 7,      // 第7波解锁
            attackDamage: 200,
            attackRange: 20,
            attackCooldown: 500
        },
        shield_soldier: {
            name: '护盾兵',
            hp: 150,
            speed: 0.8,
            damage: 3,
            reward: 25,
            color: '#4488ff',
            size: 18,
            armor: 0.8,
            unlockWave: 4,      // 第4波解锁
            rapidFireResistance: 0.5,
            attackDamage: 25,
            attackRange: 45,
            attackCooldown: 800
        },
        kamikaze_drone: {
            name: '自爆无人机',
            hp: 30,
            speed: 4.0,
            damage: 2,
            reward: 40,
            color: '#ff0088',
            size: 10,
            armor: 0,
            unlockWave: 6,      // 第6波解锁
            priorityTargetType: 'highFireRate',
            attackDamage: 300,
            attackRange: 30,
            attackCooldown: 100
        },
        assault_tank: {
            name: '重装突击兵',
            hp: 1000,
            speed: 0.4,
            damage: 5,
            reward: 80,
            color: '#664422',
            size: 35,
            shape: 'tank',
            armor: 0.5,
            unlockWave: 8,      // 第8波解锁
            chargeOnHit: true,
            speedBonusOnHit: 0.8,
            attackDamage: 100,
            attackRange: 80,
            attackCooldown: 1500
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
            waveIncrement: 0.12  // 从0.08提升到0.12，增加无尽模式难度压力
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
        // 清除比例随波次递增（前期容错，后期高压但不过度）
        // 前期(1-3波): 35% - 新手保护，少点几次
        // 中期(4-6波): 38% - 逐步收紧（微调：从40%降至38%）
        // 后期(7-9波): 45% - 保持压力（微调：从50%降至45%）
        // 大后期(10波+): 50% - 最终压力
        getClearRatio: function(wave) {
            if (wave <= 3) return 0.35;
            if (wave <= 6) return 0.38;
            if (wave <= 9) return 0.45;
            return 0.50;
        },
        // 返还比例随波次衰减（方案A）：前期容错，后期紧张
        // 前期(1-3波): 40% - 新手保护期，允许试错
        // 中期(4-7波): 25% - 常规期，需要谨慎决策
        // 后期(8波+): 10% - 紧张期，清除是重大战略决策
        getRefundRatio: function(wave) {
            if (wave <= 3) return 0.40;
            if (wave <= 7) return 0.25;
            return 0.10;
        }
    },

    // 连击（Combo）系统配置
    // 极限紧缩：降低倍率上限和时间窗口，控制经济失控
    COMBO: {
        windowMs: 1500,             // Combo 有效时间窗口：2s -> 1.5s（缩短25%）
        maxMultiplier: 2,           // 最高倍率：3x -> 2x（降低33%）
        multiplierSteps: [         // 倍率阶梯（击杀数 -> 倍率）
            { kills: 3, mult: 1.3 },  // 3杀：1.5x -> 1.3x
            { kills: 5, mult: 1.6 },  // 5杀：2.0x -> 1.6x
            { kills: 8, mult: 2.0 }   // 8杀：3.0x -> 2.0x
        ]
    },

    // 经济系统重构 - 方案A：等级税收 + 维护成本 + 升级通胀
    ECONOMY: {
        // 等级税收：每升1级，放置成本+50%
        // 公式：放置成本 = 基础成本 × (1 + (等级-1) × 0.5)
        levelTaxRate: 0.5,  // 每级+50%
        
        // 维护成本：每座塔每波扣除的金币
        // 公式：维护费 = 等级 × 10金/波
        maintenanceCostPerLevel: 10,
        
        // 升级通胀：每次升级后，下次升级成本+20%
        // 公式：升级成本 = 基础升级费 × (1 + (已升级次数) × 0.2)
        upgradeInflationRate: 0.2,  // 每次+20%
        
        // 机枪塔后期效率衰减（第7波后）
        machinegunLateGamePenalty: 0.7,  // 伤害×0.7
        machinegunPenaltyStartWave: 7
    },

    // 升级配置
    MAX_TOWER_LEVEL: 5,  // 从3级改为5级
    UPGRADE_COST_MULTIPLIER: 1.5,
    
    // 升级费用表（从 Tower.js 移入，统一配置）
    // 每种类型每个等级的费用 - 最高5级
    // 极限紧缩：整体再上调50%（相对于已上调20-30%的基数）
    UPGRADE_COSTS: {
        machinegun: [0, 150, 240, 420, 675],   // 1->2: 100→150 (+50%)
        cannon: [0, 270, 450, 750, 1200],      // 1->2: 180→270 (+50%)
        rifle: [0, 225, 360, 600, 975],        // 1->2: 150→225 (+50%)
        laser: [0, 360, 600, 1050, 1650],      // 1->2: 240→360 (+50%)
        em: [0, 450, 750, 1275, 1950],         // 1->2: 300→450 (+50%)
        rocket: [0, 540, 900, 1500, 2250]      // 1->2: 360→540 (+50%)
    },
    
    // 升级倍率表 - 最高5级
    UPGRADE_MULTIPLIERS: {
        damage: [1, 1.4, 1.9, 2.5, 3.2],     // 1级: 1x, 2级: 1.4x, 3级: 1.9x, 4级: 2.5x, 5级: 3.2x
        range: [1, 1.15, 1.3, 1.45, 1.6],
        fireRate: [1, 1.08, 1.15, 1.22, 1.3]  // 射速提升
    },

    // 防御塔基础生命值（交战系统）
    TOWER_BASE_HP: 200,

    // 子弹配置
    PROJECTILE_SPEED: 5,

    // 地图配置
    MAP: {
        spawnY: 50, // 敌人生成位置（从上方）
        // 防线位置自适应窗口高度（距底部 50px）
        get endY() { return window.innerHeight - 50; },
        gridSize: 40 // 放置网格大小
    },

    // 经济系统辅助方法
    // 获取敌人实际奖励（极限紧缩：更陡峭的衰减曲线）
    // 与波次结算返还机制配合，形成前期紧张、中期紧缩、后期极限的经济曲线
    getEnemyReward: function(enemyType, wave) {
        const baseReward = this.ENEMIES[enemyType].reward;
        
        // 前期(1-2波): 100% - 短暂的启动资金窗口
        if (wave <= 2) return baseReward;
        
        // 前期末(3波): 70% - 开始收紧
        if (wave <= 3) return Math.floor(baseReward * 0.7);
        
        // 中期(4-6波): 40% - 明显紧缩
        if (wave <= 6) return Math.floor(baseReward * 0.4);
        
        // 后期(7-9波): 25% - 严重紧缩
        if (wave <= 9) return Math.floor(baseReward * 0.25);
        
        // 大后期(10波+): 22% - 极限紧缩（微调：从20%提升至22%，保留后期希望）
        return Math.floor(baseReward * 0.22);
    }
};
