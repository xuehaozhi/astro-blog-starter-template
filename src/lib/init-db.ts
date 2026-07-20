import { setDB } from "./db";

const DB_CACHE_KEY = Symbol.for("forum_db_cache");

declare global {
  var [DB_CACHE_KEY]: D1Database | undefined;
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    gold INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS forums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_thread_id INTEGER,
    last_post_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (last_thread_id) REFERENCES threads(id)
  )`,
  `CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forum_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_post_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_post_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (last_post_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_first_post INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_threads_forum_id ON threads(forum_id)`,
  `CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_threads_last_post_at ON threads(last_post_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_forums_category_id ON forums(category_id)`,
];

const SEED_DATA = {
  users: [
    { id: 1, username: 'admin', email: 'admin@forum.com', password_hash: 'demo_password', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin', bio: '论坛管理员，负责社区维护和运营。', gold: 9999, is_admin: 1 },
    { id: 2, username: 'Steve', email: 'steve@forum.com', password_hash: 'demo_password', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=steve', bio: '热爱Minecraft的老玩家。', gold: 1500, is_admin: 0 },
    { id: 3, username: 'Alex', email: 'alex@forum.com', password_hash: 'demo_password', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex', bio: '建筑大师，喜欢建造各种城堡。', gold: 2300, is_admin: 0 },
    { id: 4, username: 'RedstoneMaster', email: 'redstone@forum.com', password_hash: 'demo_password', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=redstone', bio: '红石工程师，专攻复杂电路。', gold: 3200, is_admin: 0 },
    { id: 5, username: 'ModCreator', email: 'modder@forum.com', password_hash: 'demo_password', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=modder', bio: '模组开发者，发布了多个热门模组。', gold: 5600, is_admin: 0 },
  ],
  categories: [
    { id: 1, name: '社区交流', description: '论坛综合讨论区', icon: '💬', sort_order: 1 },
    { id: 2, name: '游戏资源', description: 'Minecraft 资源分享', icon: '📦', sort_order: 2 },
    { id: 3, name: '创作展示', description: '玩家作品展示', icon: '🎨', sort_order: 3 },
    { id: 4, name: '技术交流', description: '编程与技术讨论', icon: '💻', sort_order: 4 },
    { id: 5, name: '站务管理', description: '论坛事务与公告', icon: '🛠️', sort_order: 5 },
  ],
  forums: [
    { id: 1, category_id: 1, name: '新人报道', description: '新朋友们来这里介绍一下自己吧！', icon: '👋', sort_order: 1, thread_count: 128, post_count: 456 },
    { id: 2, category_id: 1, name: '闲聊灌水', description: '天南海北，畅所欲言。', icon: '💧', sort_order: 2, thread_count: 356, post_count: 2341 },
    { id: 3, category_id: 1, name: '问答求助', description: '有问题？来这里寻找答案。', icon: '❓', sort_order: 3, thread_count: 234, post_count: 890 },
    { id: 4, category_id: 2, name: '模组分享', description: '分享和讨论 Minecraft 模组。', icon: '🧩', sort_order: 1, thread_count: 445, post_count: 2100 },
    { id: 5, category_id: 2, name: '材质包', description: '材质包与资源包分享区。', icon: '🎨', sort_order: 2, thread_count: 189, post_count: 678 },
    { id: 6, category_id: 2, name: '地图存档', description: '分享你的冒险地图和建筑存档。', icon: '🗺️', sort_order: 3, thread_count: 156, post_count: 567 },
    { id: 7, category_id: 2, name: '整合包', description: '整合包发布与讨论。', icon: '📦', sort_order: 4, thread_count: 98, post_count: 345 },
    { id: 8, category_id: 3, name: '建筑展示', description: '展示你的建筑作品。', icon: '🏰', sort_order: 1, thread_count: 267, post_count: 1234 },
    { id: 9, category_id: 3, name: '红石作品', description: '分享你的红石发明。', icon: '⚡', sort_order: 2, thread_count: 145, post_count: 567 },
    { id: 10, category_id: 3, name: '视频直播', description: '分享游戏视频和直播。', icon: '📺', sort_order: 3, thread_count: 89, post_count: 234 },
    { id: 11, category_id: 4, name: 'Mod开发', description: '模组开发技术讨论。', icon: '🔧', sort_order: 1, thread_count: 178, post_count: 678 },
    { id: 12, category_id: 4, name: '插件开发', description: '服务端插件开发交流。', icon: '🔌', sort_order: 2, thread_count: 134, post_count: 456 },
    { id: 13, category_id: 4, name: '建站交流', description: '网站建设与运维讨论。', icon: '🌐', sort_order: 3, thread_count: 89, post_count: 234 },
    { id: 14, category_id: 5, name: '论坛公告', description: '论坛重要公告发布区。', icon: '📢', sort_order: 1, thread_count: 45, post_count: 123 },
    { id: 15, category_id: 5, name: '意见反馈', description: '对论坛的建议和意见。', icon: '💡', sort_order: 2, thread_count: 67, post_count: 234 },
  ],
  threads: [
    { id: 1, forum_id: 14, user_id: 1, title: '【公告】论坛社区规范与发帖指南', content: '欢迎来到我们的论坛！为了营造良好的社区环境，请大家遵守以下规范：\n\n1. 尊重他人，文明发言\n2. 禁止发布违规内容\n3. 请勿恶意刷屏或灌水\n4. 分享资源请注明来源\n\n祝大家在论坛玩得愉快！', is_pinned: 1, view_count: 5678, reply_count: 123, last_post_at: '2026-07-15 10:00:00', last_post_user_id: 1 },
    { id: 2, forum_id: 14, user_id: 1, title: '【公告】积分系统说明', content: '我们的论坛采用积分系统，积分可用于：\n\n- 购买VIP会员\n- 下载付费资源\n- 参与论坛活动\n\n获取积分的方式：\n- 每日签到 +50积分\n- 发布优质主题\n- 回复他人帖子\n- 参与论坛活动', is_pinned: 1, view_count: 3456, reply_count: 89, last_post_at: '2026-07-10 14:30:00', last_post_user_id: 1 },
    { id: 3, forum_id: 1, user_id: 2, title: '大家好，我是新来的Steve！', content: '大家好呀！我是刚加入论坛的新人Steve，喜欢玩Minecraft生存模式，希望能在这里认识更多朋友，一起交流游戏心得！', is_pinned: 0, view_count: 234, reply_count: 45, last_post_at: '2026-07-18 09:15:00', last_post_user_id: 5 },
    { id: 4, forum_id: 1, user_id: 3, title: '新人报道，建筑党一枚~', content: '哈喽大家好！我是Alex，特别喜欢在Minecraft里建房子，从小小的木屋到宏伟的城堡都建过。以后会在这里分享一些我的建筑作品，请大家多多关照！', is_pinned: 0, view_count: 189, reply_count: 32, last_post_at: '2026-07-17 16:45:00', last_post_user_id: 4 },
    { id: 5, forum_id: 2, user_id: 4, title: '你见过最神奇的种子是什么？', content: '大家来聊聊自己遇到过的最神奇的地图种子吧！我之前遇到过一个出生点就在村庄旁边，还有要塞在地下的种子，简直是欧皇附体！', is_pinned: 0, view_count: 567, reply_count: 89, last_post_at: '2026-07-19 11:20:00', last_post_user_id: 3 },
    { id: 6, forum_id: 4, user_id: 5, title: '【1.21】工业时代模组 - 全新机器系统', content: '给大家带来我的最新模组作品 - 工业时代！\n\n主要内容：\n- 全新的能源系统\n- 多种自动化机器\n- 全新的矿石和材料\n- 配套的工具和装备\n\n欢迎大家下载试玩，有问题可以在帖子里反馈~', is_pinned: 0, view_count: 1234, reply_count: 234, last_post_at: '2026-07-16 20:00:00', last_post_user_id: 2 },
    { id: 7, forum_id: 5, user_id: 3, title: '分享一个超棒的写实风格材质包', content: '最近发现了一个超级棒的写实风格材质包，画质细腻，光影效果也特别好，用了之后游戏体验直接上了一个档次！\n\n推荐配置：\n- 显卡：RTX 3060以上\n- 内存：8GB以上\n- 搭配光影：SEUS PTGI', is_pinned: 0, view_count: 876, reply_count: 156, last_post_at: '2026-07-18 14:00:00', last_post_user_id: 4 },
    { id: 8, forum_id: 6, user_id: 2, title: '【生存地图】空岛生存挑战 - 升级版', content: '历时三个月打造的空岛生存地图，比普通空岛更有挑战性！\n\n特色：\n- 多个浮空岛屿\n- 隐藏宝箱和秘密\n- 渐进式难度设计\n- 通关成就系统\n\n你能在这片空岛上生存下去吗？', is_pinned: 0, view_count: 654, reply_count: 98, last_post_at: '2026-07-15 08:30:00', last_post_user_id: 3 },
    { id: 9, forum_id: 8, user_id: 3, title: '【建筑展示】中世纪风格城堡', content: '花了一个月时间建造的中世纪城堡，终于完工了！\n\n建筑包含：\n- 主城堡主体\n- 外围城墙和塔楼\n- 骑士大厅\n- 王座室\n- 地牢\n\n截图在下方，欢迎大家点评~', is_pinned: 0, view_count: 2345, reply_count: 167, last_post_at: '2026-07-17 19:00:00', last_post_user_id: 5 },
    { id: 10, forum_id: 9, user_id: 4, title: '【红石教程】全自动农场制作教程', content: '今天给大家带来一个全自动小麦农场的制作教程，效率超高！\n\n所需材料：\n- 红石粉 x 32\n- 活塞 x 16\n- 观察者 x 8\n- 水桶 x 1\n- 收集装置\n\n详细步骤见正文...', is_pinned: 0, view_count: 1876, reply_count: 234, last_post_at: '2026-07-14 12:00:00', last_post_user_id: 2 },
    { id: 11, forum_id: 11, user_id: 5, title: '请教一下Fabric模组开发的问题', content: '最近刚开始学Fabric模组开发，遇到了一个问题：如何给物品添加自定义附魔效果？\n\n我尝试了查找官方文档，但还是不太理解具体的实现方式。有没有大佬可以指点一下？最好能给个简单的示例代码，感谢！', is_pinned: 0, view_count: 456, reply_count: 78, last_post_at: '2026-07-19 15:30:00', last_post_user_id: 4 },
    { id: 12, forum_id: 3, user_id: 2, title: '求问，下界合金怎么挖效率最高？', content: '各位大佬好！我是生存模式新手，最近想去挖下界合金，但是不知道怎么找远古残骸效率最高。\n\n有没有什么好的方法推荐？是用床炸还是用TNT？或者有其他更高效的方式？', is_pinned: 0, view_count: 345, reply_count: 67, last_post_at: '2026-07-18 22:10:00', last_post_user_id: 5 },
  ],
  posts: [
    { id: 1, thread_id: 1, user_id: 1, content: '欢迎来到我们的论坛！为了营造良好的社区环境，请大家遵守以下规范：\n\n1. 尊重他人，文明发言\n2. 禁止发布违规内容\n3. 请勿恶意刷屏或灌水\n4. 分享资源请注明来源\n\n祝大家在论坛玩得愉快！', is_first_post: 1, created_at: '2026-07-01 10:00:00' },
    { id: 2, thread_id: 1, user_id: 2, content: '支持！规范的社区环境需要大家共同维护~', is_first_post: 0, created_at: '2026-07-02 09:00:00' },
    { id: 3, thread_id: 1, user_id: 3, content: '新人来学习一下论坛规则，避免以后踩坑。', is_first_post: 0, created_at: '2026-07-03 14:30:00' },
    { id: 4, thread_id: 2, user_id: 1, content: '我们的论坛采用积分系统，积分可用于：\n\n- 购买VIP会员\n- 下载付费资源\n- 参与论坛活动\n\n获取积分的方式：\n- 每日签到 +50积分\n- 发布优质主题\n- 回复他人帖子\n- 参与论坛活动', is_first_post: 1, created_at: '2026-07-05 14:30:00' },
    { id: 5, thread_id: 3, user_id: 2, content: '大家好呀！我是刚加入论坛的新人Steve，喜欢玩Minecraft生存模式，希望能在这里认识更多朋友，一起交流游戏心得！', is_first_post: 1, created_at: '2026-07-18 09:15:00' },
    { id: 6, thread_id: 3, user_id: 3, content: '欢迎欢迎！我也是新人，一起加油~', is_first_post: 0, created_at: '2026-07-18 09:30:00' },
    { id: 7, thread_id: 3, user_id: 4, content: '新人你好！有什么红石方面的问题可以问我~', is_first_post: 0, created_at: '2026-07-18 10:00:00' },
    { id: 8, thread_id: 3, user_id: 5, content: '欢迎加入论坛大家庭！', is_first_post: 0, created_at: '2026-07-18 11:20:00' },
    { id: 9, thread_id: 5, user_id: 4, content: '大家来聊聊自己遇到过的最神奇的地图种子吧！我之前遇到过一个出生点就在村庄旁边，还有要塞在地下的种子，简直是欧皇附体！', is_first_post: 1, created_at: '2026-07-19 11:20:00' },
    { id: 10, thread_id: 5, user_id: 2, content: '我之前遇到过一个种子，出生点四面都是海，中间一个小岛，岛下面就是海底神殿，太刺激了！', is_first_post: 0, created_at: '2026-07-19 11:45:00' },
    { id: 11, thread_id: 5, user_id: 3, content: '我遇过最神奇的是蘑菇岛旁边就是冰刺平原，两种稀有生物群系连在一起，太罕见了！', is_first_post: 0, created_at: '2026-07-19 12:10:00' },
    { id: 12, thread_id: 6, user_id: 5, content: '给大家带来我的最新模组作品 - 工业时代！\n\n主要内容：\n- 全新的能源系统\n- 多种自动化机器\n- 全新的矿石和材料\n- 配套的工具和装备\n\n欢迎大家下载试玩，有问题可以在帖子里反馈~', is_first_post: 1, created_at: '2026-07-16 20:00:00' },
    { id: 13, thread_id: 6, user_id: 4, content: '这个模组看起来好棒！终于有新的工业类模组了，支持一下！', is_first_post: 0, created_at: '2026-07-16 20:30:00' },
    { id: 14, thread_id: 6, user_id: 2, content: '大佬太强了，期待后续更新更多内容！', is_first_post: 0, created_at: '2026-07-17 08:00:00' },
    { id: 15, thread_id: 9, user_id: 3, content: '花了一个月时间建造的中世纪城堡，终于完工了！\n\n建筑包含：\n- 主城堡主体\n- 外围城墙和塔楼\n- 骑士大厅\n- 王座室\n- 地牢\n\n截图在下方，欢迎大家点评~', is_first_post: 1, created_at: '2026-07-17 19:00:00' },
    { id: 16, thread_id: 9, user_id: 2, content: '太壮观了！这建筑水平我这辈子都达不到，大佬收下我的膝盖！', is_first_post: 0, created_at: '2026-07-17 19:30:00' },
    { id: 17, thread_id: 9, user_id: 5, content: '建筑细节处理得很棒，尤其是屋顶的设计很有特色。', is_first_post: 0, created_at: '2026-07-17 20:00:00' },
    { id: 18, thread_id: 10, user_id: 4, content: '今天给大家带来一个全自动小麦农场的制作教程，效率超高！\n\n所需材料：\n- 红石粉 x 32\n- 活塞 x 16\n- 观察者 x 8\n- 水桶 x 1\n- 收集装置\n\n详细步骤见正文...', is_first_post: 1, created_at: '2026-07-14 12:00:00' },
    { id: 19, thread_id: 10, user_id: 2, content: '红石大佬又出新教程了，先收藏再学！', is_first_post: 0, created_at: '2026-07-14 13:00:00' },
    { id: 20, thread_id: 12, user_id: 2, content: '各位大佬好！我是生存模式新手，最近想去挖下界合金，但是不知道怎么找远古残骸效率最高。\n\n有没有什么好的方法推荐？是用床炸还是用TNT？或者有其他更高效的方式？', is_first_post: 1, created_at: '2026-07-18 22:10:00' },
    { id: 21, thread_id: 12, user_id: 4, content: '推荐用床炸，效率比TNT高多了！而且材料也好获取，记得带好抗火药水和装备。', is_first_post: 0, created_at: '2026-07-18 22:30:00' },
    { id: 22, thread_id: 12, user_id: 5, content: '补充一下，最佳挖掘层数是y=15左右，这个高度远古残骸最多。', is_first_post: 0, created_at: '2026-07-18 23:00:00' },
  ],
};

export async function initDB(runtime: { env: { DB?: D1Database } }) {
  const cached = globalThis[DB_CACHE_KEY];
  if (cached) {
    setDB(cached);
    return cached;
  }

  let db: D1Database;

  if (runtime.env.DB) {
    db = runtime.env.DB;
  } else {
    db = createInMemoryDB();
  }

  globalThis[DB_CACHE_KEY] = db;
  setDB(db);

  await ensureSchema(db);

  return db;
}

function createInMemoryDB(): D1Database {
  const data: Record<string, any[]> = {
    users: [...SEED_DATA.users],
    categories: [...SEED_DATA.categories],
    forums: [...SEED_DATA.forums],
    threads: [...SEED_DATA.threads],
    posts: [...SEED_DATA.posts],
  };

  let nextIds: Record<string, number> = {
    users: 6,
    categories: 6,
    forums: 16,
    threads: 13,
    posts: 23,
  };

  const dbProxy = {
    prepare(query: string) {
      return {
        bind(...args: any[]) {
          return {
            async all<T = any>(): Promise<{ results: T[] }> {
              try {
                const results = executeQuery(query, args, data, nextIds);
                return { results: (results || []) as T[] };
              } catch (e) {
                console.error("Query error:", query, e);
                return { results: [] as T[] };
              }
            },
            async first<T = any>(): Promise<T | null> {
              try {
                const results = executeQuery(query, args, data, nextIds);
                return (results && results[0] ? results[0] : null) as T | null;
              } catch (e) {
                console.error("Query error:", query, e);
                return null;
              }
            },
            async run() {
              try {
                const result = executeQuery(query, args, data, nextIds);
                const tableMatch = query.match(/INSERT INTO (\w+)/i);
                const lastId = tableMatch ? nextIds[tableMatch[1].toLowerCase()] - 1 : 0;
                return {
                  meta: {
                    last_row_id: lastId,
                    changes: result?.length || 0,
                  },
                };
              } catch (e) {
                console.error("Query error:", query, e);
                return { meta: { last_row_id: 0, changes: 0 } };
              }
            },
          };
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          try {
            const results = executeQuery(query, [], data, nextIds);
            return { results: (results || []) as T[] };
          } catch (e) {
            console.error("Query error:", query, e);
            return { results: [] as T[] };
          }
        },
        async first<T = any>(): Promise<T | null> {
          try {
            const results = executeQuery(query, [], data, nextIds);
            return (results && results[0] ? results[0] : null) as T | null;
          } catch (e) {
            console.error("Query error:", query, e);
            return null;
          }
        },
        async run() {
          try {
            const result = executeQuery(query, [], data, nextIds);
            const tableMatch = query.match(/INSERT INTO (\w+)/i);
            const lastId = tableMatch ? nextIds[tableMatch[1].toLowerCase()] - 1 : 0;
            return {
              meta: {
                last_row_id: lastId,
                changes: result?.length || 0,
              },
            };
          } catch (e) {
            console.error("Query error:", query, e);
            return { meta: { last_row_id: 0, changes: 0 } };
          }
        },
      };
    },
  } as unknown as D1Database;

  return dbProxy;
}

function executeQuery(
  query: string,
  args: any[],
  data: Record<string, any[]>,
  nextIds: Record<string, number>
): any[] | null {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.startsWith("select")) {
    return handleSelect(query, args, data);
  } else if (normalizedQuery.startsWith("insert")) {
    return handleInsert(query, args, data, nextIds);
  } else if (normalizedQuery.startsWith("update")) {
    return handleUpdate(query, args, data);
  } else if (normalizedQuery.startsWith("create")) {
    return [];
  } else if (normalizedQuery.startsWith("create index")) {
    return [];
  }

  return [];
}

function handleSelect(query: string, args: any[], data: Record<string, any[]>): any[] {
  const lowerQuery = query.toLowerCase();

  const fromMatch = query.match(/FROM\s+(\w+)/i);
  if (!fromMatch) return [];

  const tableName = fromMatch[1].toLowerCase();
  let rows = data[tableName] || [];

  const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER BY|LIMIT|OFFSET|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    const paramIndex = { value: 0 };
    rows = rows.filter((row) => evaluateWhere(whereClause, row, args, paramIndex));
  }

  const orderMatch = query.match(/ORDER BY\s+(.+?)(?:LIMIT|OFFSET|$)/i);
  if (orderMatch) {
    const orderClause = orderMatch[1].trim();
    const orderParts = orderClause.split(",").map((p) => p.trim());
    rows = [...rows].sort((a, b) => {
      for (const part of orderParts) {
        const [col, dir] = part.split(/\s+/);
        const colName = col.toLowerCase();
        const direction = dir?.toLowerCase() === "desc" ? -1 : 1;
        const aVal = a[colName];
        const bVal = b[colName];
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return direction;
        if (bVal == null) return -direction;
        if (aVal < bVal) return -direction;
        if (aVal > bVal) return direction;
      }
      return 0;
    });
  }

  let offset = 0;
  const offsetMatch = query.match(/OFFSET\s+(\d+)/i);
  if (offsetMatch) {
    offset = parseInt(offsetMatch[1]);
  }

  let limit = rows.length;
  const limitMatch = query.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    limit = parseInt(limitMatch[1]);
  }

  rows = rows.slice(offset, offset + limit);

  const isCount = /count\(\*\)/i.test(query);
  if (isCount) {
    return [{ count: rows.length }];
  }

  const isJoin = /LEFT JOIN/i.test(query);
  if (isJoin) {
    rows = rows.map((row) => {
      const result = { ...row };

      if (tableName === "threads") {
        if (lowerQuery.includes("left join users u on t.user_id = u.id")) {
          const user = data.users.find((u) => u.id === row.user_id);
          if (user) {
            result.username = user.username;
            result.avatar = user.avatar;
          }
        }
        if (lowerQuery.includes("left join users u2 on t.last_post_user_id = u2.id")) {
          const user = data.users.find((u) => u.id === row.last_post_user_id);
          if (user) {
            result.last_post_username = user.username;
          }
        }
        if (lowerQuery.includes("left join forums f on t.forum_id = f.id")) {
          const forum = data.forums.find((f) => f.id === row.forum_id);
          if (forum) {
            result.forum_name = forum.name;
          }
        }
      }

      if (tableName === "posts") {
        if (lowerQuery.includes("left join users u on p.user_id = u.id")) {
          const user = data.users.find((u) => u.id === row.user_id);
          if (user) {
            result.username = user.username;
            result.avatar = user.avatar;
            result.user_gold = user.gold;
            result.user_bio = user.bio;
            result.user_is_admin = user.is_admin;
          }
        }
      }

      return result;
    });
  }

  return rows;
}

function evaluateWhere(
  clause: string,
  row: any,
  args: any[],
  paramIndex: { value: number }
): boolean {
  const conditions = clause.split(/\s+AND\s+/i);

  return conditions.every((cond) => {
    cond = cond.trim();

    const eqMatch = cond.match(/^(\w+)\s*=\s*\?$/i);
    if (eqMatch) {
      const col = eqMatch[1].toLowerCase();
      const val = args[paramIndex.value++];
      return row[col] == val;
    }

    const gtMatch = cond.match(/^(\w+)\s*>\s*\?$/i);
    if (gtMatch) {
      const col = gtMatch[1].toLowerCase();
      const val = args[paramIndex.value++];
      return row[col] > val;
    }

    const ltMatch = cond.match(/^(\w+)\s*<\s*\?$/i);
    if (ltMatch) {
      const col = ltMatch[1].toLowerCase();
      const val = args[paramIndex.value++];
      return row[col] < val;
    }

    if (cond.includes("IS NOT NULL") || cond.includes("is not null")) {
      const colMatch = cond.match(/^(\w+)\s+IS NOT NULL$/i);
      if (colMatch) {
        const col = colMatch[1].toLowerCase();
        return row[col] != null;
      }
    }

    if (cond.includes("IS NULL") || cond.includes("is null")) {
      const colMatch = cond.match(/^(\w+)\s+IS NULL$/i);
      if (colMatch) {
        const col = colMatch[1].toLowerCase();
        return row[col] == null;
      }
    }

    return true;
  });
}

function handleInsert(
  query: string,
  args: any[],
  data: Record<string, any[]>,
  nextIds: Record<string, number>
): any[] {
  const tableMatch = query.match(/INTO\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1].toLowerCase();
  const columnsMatch = query.match(/\(([^)]+)\)/);
  if (!columnsMatch) return [];

  const columns = columnsMatch[1].split(",").map((c) => c.trim().toLowerCase());
  const valuesMatch = query.match(/VALUES\s*\(([^)]+)\)/i);

  const newRow: any = {};
  if (valuesMatch) {
    const placeholders = valuesMatch[1].split(",").map((v) => v.trim());
    let argIdx = 0;
    columns.forEach((col, i) => {
      if (placeholders[i] === "?") {
        newRow[col] = args[argIdx++];
      } else if (placeholders[i].toUpperCase() === "CURRENT_TIMESTAMP") {
        newRow[col] = new Date().toISOString().replace("T", " ").substring(0, 19);
      } else if (placeholders[i] === "0" || placeholders[i] === "1") {
        newRow[col] = parseInt(placeholders[i]);
      } else {
        newRow[col] = placeholders[i].replace(/['"]/g, "");
      }
    });
  }

  if (!newRow.id) {
    newRow.id = nextIds[tableName] || 1;
    nextIds[tableName] = (nextIds[tableName] || 1) + 1;
  }

  if (!data[tableName]) {
    data[tableName] = [];
  }

  data[tableName].push(newRow);
  return [newRow];
}

function handleUpdate(query: string, args: any[], data: Record<string, any[]>): any[] {
  const tableMatch = query.match(/UPDATE\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1].toLowerCase();
  const setMatch = query.match(/SET\s+(.+?)(?:WHERE|$)/i);
  if (!setMatch) return [];

  const setClause = setMatch[1].trim();
  const assignments = setClause.split(",").map((a) => a.trim());

  const whereMatch = query.match(/WHERE\s+(.+?)$/i);
  let rows = data[tableName] || [];
  let updated: any[] = [];

  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    const paramIndex = { value: 0 };
    rows = rows.filter((row) => evaluateWhere(whereClause, row, args, paramIndex));
  }

  for (const row of rows) {
    let argIdx = 0;
    for (const assignment of assignments) {
      const [col, valStr] = assignment.split("=").map((s) => s.trim());
      const colName = col.toLowerCase();

      if (valStr === "?") {
        row[colName] = args[argIdx++];
      } else if (valStr.toUpperCase() === "CURRENT_TIMESTAMP") {
        row[colName] = new Date().toISOString().replace("T", " ").substring(0, 19);
      } else if (valStr.includes("+")) {
        const parts = valStr.split("+").map((p) => p.trim());
        let sum = 0;
        for (const part of parts) {
          if (part === "?") {
            sum += args[argIdx++];
          } else if (!isNaN(parseInt(part))) {
            sum += parseInt(part);
          } else {
            sum += row[part.toLowerCase()] || 0;
          }
        }
        row[colName] = sum;
      } else if (!isNaN(parseInt(valStr))) {
        row[colName] = parseInt(valStr);
      } else {
        row[colName] = valStr.replace(/['"]/g, "");
      }
    }
    updated.push(row);
  }

  return updated;
}

async function ensureSchema(db: D1Database) {
  try {
    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .first();

    if (!result) {
      for (const migration of MIGRATIONS) {
        try {
          await db.prepare(migration).run();
        } catch (e) {
          console.warn("Migration failed (may be expected):", e);
        }
      }

      await seedData(db);
    }
  } catch (e) {
    console.error("Failed to ensure schema:", e);
  }
}

async function seedData(db: D1Database) {
  try {
    for (const user of SEED_DATA.users) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO users (id, username, email, password_hash, avatar, bio, gold, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(user.id, user.username, user.email, user.password_hash, user.avatar, user.bio, user.gold, user.is_admin)
        .run();
    }

    for (const cat of SEED_DATA.categories) {
      await db
        .prepare(`INSERT OR IGNORE INTO categories (id, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)`)
        .bind(cat.id, cat.name, cat.description, cat.icon, cat.sort_order)
        .run();
    }

    for (const forum of SEED_DATA.forums) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO forums (id, category_id, name, description, icon, sort_order, thread_count, post_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          forum.id,
          forum.category_id,
          forum.name,
          forum.description,
          forum.icon,
          forum.sort_order,
          forum.thread_count,
          forum.post_count
        )
        .run();
    }

    for (const thread of SEED_DATA.threads) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO threads (id, forum_id, user_id, title, content, is_pinned, view_count, reply_count, last_post_at, last_post_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          thread.id,
          thread.forum_id,
          thread.user_id,
          thread.title,
          thread.content,
          thread.is_pinned,
          thread.view_count,
          thread.reply_count,
          thread.last_post_at,
          thread.last_post_user_id
        )
        .run();
    }

    for (const post of SEED_DATA.posts) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO posts (id, thread_id, user_id, content, is_first_post, created_at) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(post.id, post.thread_id, post.user_id, post.content, post.is_first_post, post.created_at)
        .run();
    }
  } catch (e) {
    console.error("Failed to seed data:", e);
  }
}
