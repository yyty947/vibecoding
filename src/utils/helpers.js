// 工具函数
export class Helpers {
    // 生成唯一ID
    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 计算两点距离（欧几里得距离）
    static distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    // 限制数值在范围内
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // 线性插值
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // 深拷贝对象
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // 格式化数字
    static formatNumber(num) {
        return num.toLocaleString('zh-CN');
    }
}
