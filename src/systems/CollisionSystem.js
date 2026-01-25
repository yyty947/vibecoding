// 碰撞检测系统
import { Helpers } from '../utils/helpers.js';
import { CONFIG } from '../utils/config.js';

export class CollisionSystem {
    // 检查是否可以放置防御塔
    static canPlaceTower(x, y, towers) {
        // 检查是否在地图边界内
        if (x < 30 || x > CONFIG.CANVAS_WIDTH - 30 ||
            y < 150 || y > CONFIG.MAP.endY - 50) {
            return false;
        }

        // 检查是否与其他塔重叠
        for (const tower of towers) {
            const dist = Helpers.distance(x, y, tower.x, tower.y);
            if (dist < 50) { // 塔之间的最小距离
                return false;
            }
        }

        return true;
    }

    // 检查子弹命中
    static checkProjectileHits(projectiles, enemies) {
        const hits = [];

        projectiles.forEach(proj => {
            const target = enemies.find(e => e.id === proj.targetId);
            if (!target || !target.isAlive()) {
                hits.push({ projectile: proj, hit: false });
                return;
            }

            const dist = Helpers.distance(proj.x, proj.y, target.x, target.y);
            if (dist < target.size + 5) {
                hits.push({ projectile: proj, target, hit: true });
            }
        });

        return hits;
    }

    // 检查敌人是否到达终点
    static checkEnemiesReachedEnd(enemies) {
        return enemies.filter(enemy => enemy.reachedEnd());
    }

    // 获取塔的射程内最近的敌人
    static getTargetInRange(tower, enemies) {
        let closest = null;
        let minDist = tower.range;

        enemies.forEach(enemy => {
            const dist = Helpers.distance(tower.x, tower.y, enemy.x, enemy.y);
            if (dist <= tower.range && dist < minDist) {
                closest = enemy;
                minDist = dist;
            }
        });

        return closest;
    }
}
