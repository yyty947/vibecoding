// 游戏配置
export const CONFIG = {
    // 画布尺寸
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // 网格配置
    GRID_SIZE: 40,

    // 防御塔类型
    TOWERS: {
        BASIC: {
            name: '机枪塔',
            cost: 50,
            range: 120,
            damage: 10,
            fireRate: 500,  // 毫秒
            color: '#4CAF50'
        },
        SNIPER: {
            name: '狙击塔',
            cost: 100,
            range: 250,
            damage: 50,
            fireRate: 2000,
            color: '#2196F3'
        }
    },

    // 敌人类型
    ENEMIES: {
        SOLDIER: {
            name: '士兵',
            health: 50,
            speed: 1,
            reward: 10,
            color: '#FF5722',
            size: 20
        },
        BOAT: {
            name: '登陆艇',
            health: 200,
            speed: 0.5,
            reward: 50,
            color: '#795548',
            size: 30
        }
    },

    // 波次配置
    WAVES: [
        { count: 5, type: 'SOLDIER', interval: 2000 },
        { count: 10, type: 'SOLDIER', interval: 1800 },
        { count: 5, type: 'SOLDIER', then: 3, type: 'BOAT', interval: 2500 },
        { count: 15, type: 'SOLDIER', interval: 1500 },
        { count: 10, type: 'SOLDIER', then: 5, type: 'BOAT', interval: 2000 }
    ]
};

// 游戏状态
export const GameState = {
    phase: 'menu',           // menu, playing, gameover
    mode: null,              // classic, endless
    wave: 0,
    gold: 100,
    lives: 10,
    kills: 0,
    level: 1,
    towers: [],
    enemies: [],
    bullets: [],
    selectedTowerType: null
};
