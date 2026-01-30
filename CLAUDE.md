<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# 诺曼底登陆 - 项目宪法

> 本文件定义了本项目开发的最高行为准则，所有代码修改和功能演进必须遵守。

---

## 项目定位

**本项目是一个**：基于 HTML5 Canvas 的小型单页面塔防游戏

**本项目不是一个**：
- 大型商业游戏项目
- 需要用户系统、存档、社交功能的产品
- 需要复杂架构或抽象层的工程
- 需要后端服务的应用

**复杂度边界**：
- 代码总行数控制在 30000 行以内（当前约 2000 行核心逻辑）
- 文件结构保持扁平（不超过 3-4 层目录）
- 不引入外部框架或构建工具
- 专注桌面浏览器体验，不做移动端适配

**项目当前特征**：
- 6种防御塔，7种敌人，经典/无尽双模式
- 全局升级系统（最高5级），波次结算机制
- 护甲/破甲系统，减速/眩晕效果
- 经济系统：等级税收 + 维护费用 + 升级通胀
- Combo连击系统，交战系统（敌人可攻击塔）
- 状态管理：Game.state 集中管理（含 towerLevels）
- 延时效果：EffectManager 统一管理（替代 setTimeout）
- 伤害计算：DamageSystem 集中处理

---

## 最高优先级

```
可玩性 > 稳定性 > 代码整洁 > 新功能
```

1. **可玩性**：游戏必须能玩、好玩，如果改动影响核心玩法，优先修复
2. **稳定性**：不引入崩溃、卡死、无法开始/结束的 bug
3. **代码整洁**：在不破坏前两条的前提下，保持代码可读
4. **新功能**：只有在核心玩法完善后才考虑扩展

---

## 必须遵守的规则 (DO)

### 架构层面

- **DO**: 保持简单的类层次 (Game → System → Entity)
- **DO**: 每个类职责单一，文件不超过 200 行
- **DO**: 使用 ES6 原生模块，不引入打包工具
- **DO**: 所有游戏参数集中在 `CONFIG` 对象中

### 代码修改层面

- **DO**: 改代码前先阅读相关文件，理解现有逻辑
- **DO**: 优先修复问题，而不是重写模块
- **DO**: 每次改动后手动验证游戏可玩（至少跑一遍主流程）
- **DO**: 复杂改动使用 `webapp-testing` skill 自动化验证

### 功能演进层面

- **DO**: 功能增量小，每次改动专注一个问题
- **DO**: 保持向后兼容，避免删除已有功能
- **DO**: 波次、敌人、防御塔等游戏数值的调整通过 `CONFIG` 修改

### 文档层面

- **DO**: 重要改动必须更新 `docs/BUILD_LOG.md`
- **DO**: 使用 skill 完成工作后，必须更新 `docs/SKILLS_USED.md`
- **DO**: 影响到用户体验的改动（如控制方式、UI布局）需要更新 `README.md`

### 测试层面

- **DO**: 简单问题自己手动验证即可
- **DO**: 涉及波次流程、状态管理等复杂逻辑时，使用 `webapp-testing` skill
- **DO**: 发现 bug 时优先复现，再修复，最后验证

---

## 禁止的行为 (DON'T)

### 架构层面

- **DON'T**: 不引入 React/Vue 等框架
- **DON'T**: 不使用 TypeScript/Flow 等类型系统
- **DON'T**: 不引入构建工具 (webpack/vite/rollup)
- **DON'T**: 不创建抽象层、工厂模式、依赖注入等过度设计
- **DON'T**: 不把类拆分到多个文件

### 功能层面

- **DON'T**: 不添加用户注册/登录系统
- **DON'T**: 不添加存档系统（本地存储即可）
- **DON'T**: 不添加排行榜/社交功能
- **DON'T**: 不添加多语言支持
- **DON'T**: 不做移动端适配

### 开发行为层面

- **DON'T**: 不一次性修改超过 3 个文件
- **DON'T**: 不在未理解代码结  前进行大改
- **DON'T**: 不跳过验证直接提交代码
- **DON'T**: 不引入项目已有类似功能的第三方库

---

## 对 AI 的行为约束

### 改代码前

1. **必须先说计划**：用简短文字说明要改什么、为什么改、怎么改
2. **必须先读代码**：使用 Read 工具阅读相关文件，确认理解正确
3. **复杂改动先讨论**：可能影响架构的改动，先用 AskUserQuestion 确认

### 改代码时

1. **优先 Edit**：能改现有文件的，不创建新文件
2. **一次改一个问题**：不要在同一个改动中解决多个无关问题
3. **保持可读性**：不写 clever code，简单直接

### 改代码后

1. **必须自测**：运行游戏，至少验证主流程可玩
2. **复杂改动用 skill**：涉及波次、状态管理等复杂逻辑时，调用 `webapp-testing` skill
3. **必须更新文档**：重要改动更新 `docs/BUILD_LOG.md`，使用 skill 后更新 `docs/SKILLS_USED.md`

### 特定场景的处理方式

| 场景 | 处理方式 |
|------|----------|
| 修复 UI bug | 自己手动验证即可 |
| 修复波次流程 | 必须用 `webapp-testing` skill 验证 |
| 调整游戏参数 | 直接改 `CONFIG`，手动验证 |
| 添加新防御塔 | 先用 AskUserQuestion 确认设计 |
| 重构某个模块 | 禁止，除非用户明确要求 |

---

## 参数调整原则

所有游戏数值相关参数必须集中在 `src/utils/config.js` 的 `CONFIG` 对象中：

```javascript
WAVE_MECHANICS: {
    baseSpawnInterval: 1200,    // 有意义的注释
    minSpawnInterval: 300,      // 说明参数的作用
    intervalDecay: 0.7,         // 说明取值范围和影响
    // ...
}
```

调整参数时：
- 在注释中说明参数的作用和合理范围
- 小幅调整，观察效果
- 不一次修改多个相关参数

---

## 自检清单

在提交改动前，问自己：

1. **可玩性**：游戏能正常开始、游玩、结束吗？
2. **稳定性**：有控制台错误吗？会崩溃吗？
3. **复杂度**：改动增加了多少行代码？是否过度设计？
4. **文档**：更新了相关文档吗？
5. **验证**：自己验证过吗？需要用 skill 吗？

---

## 如何自检和纠偏

当发现自己可能偏离规则时：

1. **停下**：停止当前改动
2. **回顾宪法**：重新阅读本文件的相关条款
3. **简化**：想一个更简单的实现方式
4. **询问**：如果不确定，用 AskUserQuestion 询问用户

典型偏离信号：
- 改动涉及 5+ 个文件
- 创建了新的抽象层
- 引入了新的外部依赖
- 改动后没有验证就认为"应该没问题"

---

## 设计哲学总结

```
简单 > 复杂
直接 > 优雅
可玩 > 完美
小步 > 大跃进
```

本项目的设计哲学是：**做一个好玩的小游戏，而不是一个完美的工程**。

---

## 宪法主要防止的失控行为

1. **过度工程化**：防止项目变成一个"练习架构"的工程，而不是游戏
2. **功能蔓延**：防止不断添加"看起来很酷"但不必要的功能
3. **破坏性重构**：防止为了"代码质量"重写核心模块
4. **不验证就提交**：防止引入难以发现的 bug
5. **文档脱节**：防止代码和文档不一致

---

**最后**：这是一份活的宪法。当发现无法遵守某条规则时，应该讨论是否需要修改宪法，而不是默默违反。
