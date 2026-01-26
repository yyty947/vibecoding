# 诺曼底登陆 (D-Day Defense)

一个基于 HTML5 Canvas 的塔防游戏。

## 项目简介

"诺曼底登陆"是一款二战题材的塔防游戏。玩家需要通过在战场上放置不同类型的防御塔，抵御不断来袭的敌军士兵和登陆艇。

## 功能特性

- **两种游戏模式**: 经典模式（10波固定敌人）和无尽模式（无限挑战）
- **三种防御塔**: 机枪塔、加农炮、狙击塔，各有特色
- **防御塔升级**: 击杀敌人获得金币，升级防御塔提升战斗力
- **两种敌人**: 快速移动的士兵和耐打的登陆艇
- **完整游戏流程**: 主菜单 → 模式选择 → 游戏 → 结算

## 如何运行

### 环境要求
- Python 3.x（或其他 HTTP 服务器）
- 现代浏览器（Chrome、Firefox、Edge）

### 启动项目

**重要**: 由于使用了 ES6 模块，必须通过 HTTP 服务器运行，不能直接双击 HTML 文件。

```bash
# 在项目目录启动 HTTP 服务器
cd C:\Users\y\Desktop\vibecoding\project
python -m http.server 8000
```

然后在浏览器访问: **http://localhost:8000**

### 停止服务器

在终端按 `Ctrl + C` 停止服务器。

## 游戏操作

1. **选择模式**: 点击"经典模式"或"无尽模式"开始游戏
2. **放置防御塔**:
   - 点击底部的防御塔图标选择类型
   - 点击战场上的位置放置
3. **升级防御塔**: 点击已放置的防御塔，在升级面板中升级
4. **游戏目标**: 防止敌人突破防线，尽可能存活更多波次

## 文档

- [PRD](./docs/PRD.md) - 产品需求文档
- [技术规范](./docs/spec.md) - 技术设计文档
- [构建日志](./docs/BUILD_LOG.md) - 开发过程记录
- [Skills 使用记录](./docs/SKILLS_USED.md) - webapp-testing 技能应用

## 项目结构

```
project/
├── index.html              # 主页面
├── src/
│   ├── main.js             # 入口文件
│   ├── styles.css          # 样式文件
│   ├── core/
│   │   ├── Game.js         # 游戏主控制器
│   │   ├── Renderer.js     # 渲染器
│   │   └── Input.js        # 输入处理
│   ├── entities/
│   │   ├── Enemy.js        # 敌人类
│   │   ├── Tower.js        # 防御塔类
│   │   └── Projectile.js   # 子弹类
│   ├── systems/
│   │   ├── WaveSystem.js       # 波次系统
│   │   ├── CollisionSystem.js  # 碰撞检测
│   │   └── UpgradeSystem.js    # 升级系统
│   └── utils/
│       ├── config.js       # 配置文件
│       └── helpers.js      # 工具函数
└── docs/
    ├── PRD.md
    ├── spec.md
    └── BUILD_LOG.md
```

## License

GPL 3.0
