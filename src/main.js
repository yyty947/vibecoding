// 游戏入口
import { Game } from './core/Game.js';
import { initSoundManager, getSoundManager } from './utils/SoundManager.js';

// 版本号（用于缓存感知）
const GAME_VERSION = '1.1.3';

// localStorage key
const STORAGE_KEY_SKIP_TUTORIAL = 'dday_skip_tutorial';

// 多窗口检测
function setupMultiWindowDetection() {
    // 检查浏览器是否支持 BroadcastChannel
    if (typeof BroadcastChannel === 'undefined') {
        console.log('BroadcastChannel not supported, skipping multi-window detection');
        return;
    }

    const channel = new BroadcastChannel('dday_game_channel');
    const pingTimeout = 500; // 等待响应的时间（毫秒）
    let hasOtherWindow = false;

    // 监听其他窗口的消息
    channel.onmessage = (event) => {
        if (event.data.type === 'ping') {
            // 收到其他窗口的探测，回复确认
            channel.postMessage({ type: 'pong', time: event.data.time });
        } else if (event.data.type === 'pong') {
            // 确认存在其他窗口
            hasOtherWindow = true;
        }
    };

    // 发送探测消息
    channel.postMessage({ type: 'ping', time: Date.now() });

    // 延迟检查后显示提示
    setTimeout(() => {
        if (hasOtherWindow) {
            showMultiWindowWarning();
        }
        // 保持 channel 开启，持续监听（可选：后续可以实时警告）
    }, pingTimeout);

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        channel.close();
    });
}

// 显示多窗口警告（非侵入式）
function showMultiWindowWarning() {
    // 在菜单界面添加提示
    const menu = document.getElementById('menu');
    if (!menu) return;

    // 检查是否已存在提示
    if (menu.querySelector('.multi-window-warning')) return;

    const warning = document.createElement('div');
    warning.className = 'multi-window-warning';
    warning.innerHTML = '⚠️ 检测到多个游戏窗口，建议只开一个以避免数据异常';
    
    // 添加到菜单底部
    const menuButtons = menu.querySelector('.menu-buttons');
    if (menuButtons && menuButtons.parentNode) {
        menuButtons.parentNode.insertBefore(warning, menuButtons.nextSibling);
    } else {
        menu.appendChild(warning);
    }

    console.warn('Multi-window detected: showing warning');
}

// 显示版本号（帮助用户感知缓存更新）
function showVersionInfo() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    const versionInfo = document.createElement('div');
    versionInfo.className = 'version-info';
    versionInfo.textContent = `v${GAME_VERSION}`;
    menu.appendChild(versionInfo);

    console.log(`Game version: ${GAME_VERSION}`);
}

// ==================== 教学页逻辑 ====================

// 检查是否应该跳过教学页
function shouldSkipTutorial() {
    try {
        return localStorage.getItem(STORAGE_KEY_SKIP_TUTORIAL) === 'true';
    } catch (e) {
        console.warn('localStorage not available');
        return false;
    }
}

// 设置跳过教学页标志
function setSkipTutorial(skip) {
    try {
        if (skip) {
            localStorage.setItem(STORAGE_KEY_SKIP_TUTORIAL, 'true');
        } else {
            localStorage.removeItem(STORAGE_KEY_SKIP_TUTORIAL);
        }
    } catch (e) {
        console.warn('localStorage not available');
    }
}

// 显示教学页
function showTutorial() {
    const tutorial = document.getElementById('tutorial');
    const menu = document.getElementById('menu');
    if (tutorial) {
        tutorial.classList.remove('hidden');
        // 确保菜单隐藏
        if (menu) menu.classList.add('hidden');
    }
}

// 隐藏教学页
function hideTutorial() {
    const tutorial = document.getElementById('tutorial');
    if (tutorial) {
        tutorial.classList.add('hidden');
    }
}

// 显示主菜单
function showMenu() {
    const menu = document.getElementById('menu');
    if (menu) menu.classList.remove('hidden');
}

// 获取音效管理器实例（辅助函数）
function getSound() {
    return getSoundManager();
}

// 绑定音效开关事件
function bindSoundToggleEvent() {
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
            const soundManager = getSoundManager();
            if (soundManager) {
                const enabled = soundManager.toggle();
                updateSoundToggleButton(enabled);
            }
        });
    }
}

// 更新音效开关按钮显示
function updateSoundToggleButton(enabled) {
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    if (btnSoundToggle) {
        btnSoundToggle.textContent = enabled ? '🔊 音效: 开' : '🔇 音效: 关';
    }
}

// 绑定教学页事件
function bindTutorialEvents() {
    // "开始游戏"按钮 - 隐藏教学页，显示主菜单
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            // 播放按钮点击音效
            const soundManager = getSoundManager();
            if (soundManager) soundManager.play('button_click');
            
            const checkbox = document.getElementById('skip-tutorial-checkbox');
            if (checkbox && checkbox.checked) {
                setSkipTutorial(true);
            }
            hideTutorial();
            showMenu();
        });
    }

    // "游戏指南"按钮 - 从主菜单重新打开教学页
    const btnTutorial = document.getElementById('btn-tutorial');
    if (btnTutorial) {
        btnTutorial.addEventListener('click', () => {
            // 播放按钮点击音效
            const soundManager = getSoundManager();
            if (soundManager) soundManager.play('button_click');
            
            // 重置复选框状态
            const checkbox = document.getElementById('skip-tutorial-checkbox');
            if (checkbox) checkbox.checked = false;
            showTutorial();
        });
    }
}

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    // 初始化音效系统（预加载）
    initSoundManager();
    console.log('Sound system initialized');

    // 初始化多窗口检测
    setupMultiWindowDetection();

    // 显示版本信息
    showVersionInfo();

    // 绑定教学页事件
    bindTutorialEvents();

    // 绑定音效开关事件
    bindSoundToggleEvent();

    // 创建游戏实例
    window.game = new Game(canvas);

    // 初始化游戏
    window.game.init();

    // 判断是否显示教学页
    if (!shouldSkipTutorial()) {
        // 首次进入，显示教学页
        showTutorial();
    }

    console.log('诺曼底登陆 - 塔防游戏');
    console.log('游戏已初始化');
});
