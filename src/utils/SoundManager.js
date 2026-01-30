// 音效管理器 - 基础音效系统
// 使用 HTML5 Audio，预加载所有音效

// 音效文件映射表
const SOUND_MAP = {
    'tower_machinegun': 'sounds/machinegun_tower.ogg',
    'tower_cannon': 'sounds/cannon.ogg',
    'tower_sniper': 'sounds/sniper_tower.ogg',
    'tower_laser': 'sounds/lazer_tower.ogg',
    'tower_em': 'sounds/electromagnetic_tower.ogg',
    'tower_rocket': 'sounds/rocket_tower.ogg',
    'build_placing': 'sounds/build_placing.ogg',
    'button_click': 'sounds/button_click.mp3',
    'game_victory': 'sounds/victory.mp3',
    'game_fail': 'sounds/fail.mp3'
};

// localStorage key
const STORAGE_KEY_SOUND_ENABLED = 'dday_sound_enabled';

export class SoundManager {
    constructor() {
        // 是否启用音效（默认开启）
        this.enabled = this._loadEnabledState();
        
        // 预加载的音频对象缓存
        this.cache = {};
        
        // 预加载所有音效
        this._preloadAll();
    }

    // 从 localStorage 读取开关状态
    _loadEnabledState() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_SOUND_ENABLED);
            return stored !== 'false'; // 默认 true
        } catch (e) {
            console.warn('localStorage not available, sound enabled by default');
            return true;
        }
    }

    // 保存开关状态到 localStorage
    _saveEnabledState() {
        try {
            localStorage.setItem(STORAGE_KEY_SOUND_ENABLED, this.enabled.toString());
        } catch (e) {
            console.warn('Failed to save sound enabled state');
        }
    }

    // 预加载所有音效
    _preloadAll() {
        for (const [name, path] of Object.entries(SOUND_MAP)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.cache[name] = audio;
        }
        console.log(`SoundManager: Preloaded ${Object.keys(SOUND_MAP).length} sounds`);
    }

    // 播放指定音效
    play(name) {
        if (!this.enabled) return;
        
        const audio = this.cache[name];
        if (!audio) {
            console.warn(`Sound not found: ${name}`);
            return;
        }

        try {
            // 重置到开头（支持快速连续播放）
            audio.currentTime = 0;
            audio.play().catch(e => {
                // 浏览器自动播放策略可能阻止，静默处理
                console.warn(`Sound play failed: ${name}`, e.message);
            });
        } catch (e) {
            console.warn(`Sound play error: ${name}`, e);
        }
    }

    // 切换音效开关
    toggle() {
        this.enabled = !this.enabled;
        this._saveEnabledState();
        console.log(`Sound ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    }

    // 获取当前开关状态
    isEnabled() {
        return this.enabled;
    }

    // 设置开关状态
    setEnabled(enabled) {
        this.enabled = enabled;
        this._saveEnabledState();
    }
}

// 创建单例实例
let instance = null;

export function initSoundManager() {
    if (!instance) {
        instance = new SoundManager();
    }
    return instance;
}

export function getSoundManager() {
    return instance;
}
