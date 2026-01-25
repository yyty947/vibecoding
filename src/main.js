// 游戏入口
import { Game } from './core/Game.js';

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    // 创建游戏实例
    const game = new Game(canvas);

    // 初始化游戏
    game.init();

    console.log('诺曼底登陆 - 塔防游戏');
    console.log('游戏已初始化');
});
