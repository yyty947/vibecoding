# Technical Specification
## 项目：诺曼底登陆 (D-Day Defense)

---

## 1. 概述

本项目是一个单页面的塔防游戏，使用 HTML5 Canvas 进行渲染，JavaScript 处理游戏逻辑。游戏运行在浏览器中，无需服务器支持。玩家通过点击画布放置防御塔，抵御沿固定路径移动的敌军士兵。游戏包含两种模式：经典模式（固定波次）和无尽模式（无限波次）。游戏结束时显示统计数据。

---

## 2. 页面与模块

| 模块 | 文件 | 用途 |
|------|------|------|
| **主页** | `index.html` | 游戏唯一入口，包含所有UI和画布 |
| **游戏引擎** | `src/Game.js` | 游戏循环、状态管理、主控制器 |
| **渲染器** | `src/Renderer.js` | Canvas 绘制所有游戏元素 |
| **实体管理** | `src/entities/` | 敌人、防御塔、子弹类定义 |
| **输入处理** | `src/Input.js` | 鼠标点击、UI 按钮交互 |
| **波次系统** | `src/WaveManager.js` | 敌人生成、波次控制 |
| **碰撞检测** | `src/Collision.js` | 子弹与敌人、范围检测 |

---

## 3. 主流程

```
用户打开 index.html
    │
    ▼
显示主菜单（标题 + "开始游戏"按钮）
    │
    ▼ 点击"开始游戏"
显示模式选择面板（经典模式 / 无尽模式）
    │
    ▼ 选择模式
进入游���界面
    │
    ├─ 画布显示：黑色背景 + 防御塔位网格
    ├─ UI显示：当前波次、金币、生命值
    └─ 防御塔选择面板
    │
    ▼ 玩家点击防御塔类型
    ▼ 玩家点击画布位置
    ▼ 扣除金币，放置防御塔
    │
    ▼ 敌人从左侧进入，沿路径移动
    ▼ 防御塔自动攻击范围内敌人
    ▼ 敌人死亡获得金币
    ▼ 敌人到达终点扣除生命值
    │
    ▼ 生命值为0 或 完成所有波次
显示结算界面（等级、击杀数、波次）
    │
    ▼ 点击"重新开始"
返回主菜单
```

---

## 4. 关键交互与状态

### 4.1 鼠标交互

| 交互 | 行为 | 状态变化 |
|------|------|----------|
| 点击防御塔按钮 | 选中该防御塔类型 | `selectedTowerType = type` |
| 点击画布网格 | 尝试放置防御塔 | 创建Tower实例，扣除金币 |
| 悬停防御塔 | 显示攻击范围 | 绘制半透明圆形 |

### 4.2 按钮交互

| 按钮 | 位置 | 行为 |
|------|------|------|
| 开始游戏 | 主菜单 | 显示模式选择面板 |
| 经典模式 | 模式选择 | 初始化游戏，`gameMode = 'classic'` |
| 无尽模式 | 模式选择 | 初始化游戏，`gameMode = 'endless'` |
| 重新开始 | 结算界面 | 重置状态，返回主菜单 |

### 4.3 游戏状态

```javascript
const GameState = {
    phase: 'menu' | 'playing' | 'gameover',
    mode: 'classic' | 'endless',
    wave: 0,
    gold: 100,
    lives: 10,
    kills: 0,
    level: 1,
    towers: [],
    enemies: [],
    bullets: []
}
```

### 4.4 错误提示

| 场景 | 提示方式 | 提示内容 |
|------|----------|----------|
| 金币不足 | 防御塔按钮闪烁红色 | "金币不足" |
| 位置已有防御塔 | 画布显示红色X | "此处已有防御塔" |
| 位置在路径上 | 画布显示红色X | "不能放置在路径上" |

---

## 5. 数据约定

### 5.1 本地存储

**不需要持久化存储**。刷新页面重新开始游戏。

### 5.2 游戏配置 (CONFIG)

```javascript
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
            color: '#FF5722'
        },
        BOAT: {
            name: '登陆艇',
            health: 200,
            speed: 0.5,
            reward: 50,
            color: '#795548'
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
}
```

### 5.3 实体数据结构

```javascript
// 防御塔
{
    id: string,
    type: 'BASIC' | 'SNIPER',
    x: number,      // 网格坐标
    y: number,
    pixelX: number, // 像素坐标
    pixelY: number,
    lastFire: number
}

// 敌人
{
    id: string,
    type: 'SOLDIER' | 'BOAT',
    health: number,
    maxHealth: number,
    pathIndex: number,
    x: number,
    y: number
}

// 子弹
{
    id: string,
    x: number,
    y: number,
    targetId: string,
    damage: number,
    speed: 5
}
```

---

## 6. 验收标准

### 6.1 功能验收

| 功能 | 验收条件 |
|------|----------|
| **画布渲染** | 打开页面显示黑色画布，网格线可见 |
| **防御塔放置** | 点击防御塔按钮后，点击画布，防御塔出现，金币减少 |
| **敌人移动** | 游戏开始后，敌人从左侧出现，沿路径向右移动 |
| **攻击系统** | 敌人进入防御塔范围，防御塔发射子弹 |
| **碰撞检测** | 子弹击中敌人，敌人血量减少，血量为0时消失 |
| **波次系统** | 每波敌人数量正确，波次间隔正确 |
| **游戏结束** | 生命值为0时显示结算界面 |
| **统计数据** | 结算界面正确显示：等级、击杀数、波次 |
| **经典模式** | 完成第5波后游戏结束，显示胜利 |
| **无尽模式** | 敌人无限生成，直到生命值为0 |

### 6.2 性能验收

| 指标 | 要求 |
|------|------|
| 帧率 | 稳定 60 FPS |
| 加载时间 | 页面打开 2 秒内可开始游戏 |
| 内存 | 无明显内存泄漏（运行30分钟正常） |

### 6.3 兼容性验收

| 浏览器 | 版本 |
|--------|------|
| Chrome | 最新版 |
| Firefox | 最新版 |
| Edge | 最新版 |

---

## 7. 里程碑

### Milestone 1: 渲染基础（Day 1）

- [ ] 创建 `index.html`，包含 Canvas 元素
- [ ] 创建 `src/Game.js`，建立游戏循环
- [ ] 画布渲染黑色背景 + 网格线
- [ ] 敌人以红色方块显示，从左向右移动

**验收点**: 打开页面看到黑色画布，红色方块移动

---

### Milestone 2: 防御塔系统（Day 2）

- [ ] 创建 `Tower` 类
- [ ] 实现防御塔选择UI
- [ ] 点击画布放置防御塔
- [ ] 防御塔显示为绿色方块
- [ ] 金币系统：放置防御塔扣除金币

**验收点**: 可以放置防御塔，金币正确扣除

---

### Milestone 3: 战斗系统（Day 3）

- [ ] 创建 `Bullet` 类
- [ ] 防御塔发射子弹
- [ ] 子弹追踪敌人
- [ ] 碰撞检测：子弹击中敌人
- [ ] 敌人死亡，增加金币

**验收点**: 防御塔发射子弹，敌人被消灭

---

### Milestone 4: 波次与游戏逻辑（Day 4）

- [ ] 创建 `WaveManager` 类
- [ ] 实现5个波次配置
- [ ] 经典模式：完成5波结束
- [ ] 无尽模式：无限波次
- [ ] 生命值系统：敌人到达终点扣血

**验收点**: 完整流程可玩，有输赢条件

---

### Milestone 5: UI 与打磨（Day 5）

- [ ] 主菜单UI
- [ ] 模式选择UI
- [ ] 结算界面
- [ ] 防御塔升级（简单版）
- [ ] 音效（可选）

**验收点**: 完整游戏流程，UI美观

---

## 附录：文件结构

```
project/
├── index.html
├── src/
│   ├── main.js           # 入口文件
│   ├── Game.js           # 游戏主控制器
│   ├── Renderer.js       # 渲染器
│   ├── Input.js          # 输入处理
│   ├── Collision.js      # 碰撞检测
│   ├── WaveManager.js    # 波次管理
│   ├── config.js         # 配置文件
│   └── entities/
│       ├── Tower.js      # 防御塔类
│       ├── Enemy.js      # 敌人类
│       └── Bullet.js     # 子弹类
├── docs/
│   ├── PRD.md
│   └── spec.md
└── README.md
```

---

**版本**: v1.0
**更新日期**: 2025-01-25
