export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  bio: string | null;
  gold: number;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Forum {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  thread_count: number;
  post_count: number;
  last_thread_id: number | null;
  last_post_at: string | null;
}

export interface Thread {
  id: number;
  forum_id: number;
  user_id: number;
  title: string;
  content: string;
  is_pinned: number;
  is_locked: number;
  view_count: number;
  reply_count: number;
  last_post_at: string;
  last_post_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ThreadWithUser extends Thread {
  username: string;
  avatar: string | null;
  last_post_username: string | null;
  forum_name: string;
}

export interface Post {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  is_first_post: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithUser extends Post {
  username: string;
  avatar: string | null;
  user_gold: number;
  user_bio: string | null;
  user_is_admin: number;
}

export interface ForumWithCategory extends Forum {
  category_name: string;
}

let dbInstance: D1Database | null = null;

export function getDB(): D1Database {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }
  return dbInstance;
}

export function setDB(db: D1Database) {
  dbInstance = db;
}

export async function getCategoriesWithForums(): Promise<(Category & { forums: Forum[] })[]> {
  const db = getDB();
  const categories = await db
    .prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC")
    .all<Category>();

  const result: (Category & { forums: Forum[] })[] = [];

  for (const cat of categories.results) {
    const forums = await db
      .prepare("SELECT * FROM forums WHERE category_id = ? ORDER BY sort_order ASC, id ASC")
      .bind(cat.id)
      .all<Forum>();

    result.push({
      ...cat,
      forums: forums.results,
    });
  }

  return result;
}

export async function getForumById(id: number): Promise<Forum | null> {
  const db = getDB();
  const result = await db
    .prepare("SELECT * FROM forums WHERE id = ?")
    .bind(id)
    .first<Forum>();
  return result;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = getDB();
  const result = await db
    .prepare("SELECT * FROM categories WHERE id = ?")
    .bind(id)
    .first<Category>();
  return result;
}

export async function getThreadsByForum(
  forumId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{ threads: ThreadWithUser[]; total: number }> {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare("SELECT COUNT(*) as count FROM threads WHERE forum_id = ?")
    .bind(forumId)
    .first<{ count: number }>();

  const threads = await db
    .prepare(
      `SELECT t.*, u.username, u.avatar, u2.username as last_post_username, f.name as forum_name
       FROM threads t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.last_post_user_id = u2.id
       LEFT JOIN forums f ON t.forum_id = f.id
       WHERE t.forum_id = ?
       ORDER BY t.is_pinned DESC, t.last_post_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(forumId, pageSize, offset)
    .all<ThreadWithUser>();

  return {
    threads: threads.results,
    total: countResult?.count || 0,
  };
}

export async function getThreadById(id: number): Promise<ThreadWithUser | null> {
  const db = getDB();
  const result = await db
    .prepare(
      `SELECT t.*, u.username, u.avatar, u2.username as last_post_username, f.name as forum_name
       FROM threads t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.last_post_user_id = u2.id
       LEFT JOIN forums f ON t.forum_id = f.id
       WHERE t.id = ?`
    )
    .bind(id)
    .first<ThreadWithUser>();
  return result;
}

export async function incrementThreadViewCount(threadId: number): Promise<void> {
  const db = getDB();
  await db
    .prepare("UPDATE threads SET view_count = view_count + 1 WHERE id = ?")
    .bind(threadId)
    .run();
}

export async function getPostsByThread(
  threadId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: PostWithUser[]; total: number }> {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare("SELECT COUNT(*) as count FROM posts WHERE thread_id = ?")
    .bind(threadId)
    .first<{ count: number }>();

  const posts = await db
    .prepare(
      `SELECT p.*, u.username, u.avatar, u.gold as user_gold, u.bio as user_bio, u.is_admin as user_is_admin
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.thread_id = ?
       ORDER BY p.created_at ASC, p.id ASC
       LIMIT ? OFFSET ?`
    )
    .bind(threadId, pageSize, offset)
    .all<PostWithUser>();

  return {
    posts: posts.results,
    total: countResult?.count || 0,
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const db = getDB();
  const result = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<User>();
  return result;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getDB();
  const result = await db
    .prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<User>();
  return result;
}

export async function getLatestThreads(limit: number = 10): Promise<ThreadWithUser[]> {
  const db = getDB();
  const result = await db
    .prepare(
      `SELECT t.*, u.username, u.avatar, u2.username as last_post_username, f.name as forum_name
       FROM threads t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.last_post_user_id = u2.id
       LEFT JOIN forums f ON t.forum_id = f.id
       ORDER BY t.last_post_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<ThreadWithUser>();
  return result.results;
}

export async function getHotThreads(limit: number = 10): Promise<ThreadWithUser[]> {
  const db = getDB();
  const result = await db
    .prepare(
      `SELECT t.*, u.username, u.avatar, u2.username as last_post_username, f.name as forum_name
       FROM threads t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.last_post_user_id = u2.id
       LEFT JOIN forums f ON t.forum_id = f.id
       ORDER BY t.view_count DESC, t.reply_count DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<ThreadWithUser>();
  return result.results;
}

export async function createThread(
  forumId: number,
  userId: number,
  title: string,
  content: string
): Promise<number | null> {
  const db = getDB();

  const result = await db
    .prepare(
      "INSERT INTO threads (forum_id, user_id, title, content, last_post_user_id) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(forumId, userId, title, content, userId)
    .run();

  const threadId = result.meta.last_row_id;

  if (threadId) {
    await db
      .prepare(
        "INSERT INTO posts (thread_id, user_id, content, is_first_post) VALUES (?, ?, ?, 1)"
      )
      .bind(threadId, userId, content)
      .run();

    await db
      .prepare("UPDATE forums SET thread_count = thread_count + 1, post_count = post_count + 1 WHERE id = ?")
      .bind(forumId)
      .run();
  }

  return threadId;
}

export async function createPost(
  threadId: number,
  userId: number,
  content: string
): Promise<number | null> {
  const db = getDB();

  const result = await db
    .prepare("INSERT INTO posts (thread_id, user_id, content) VALUES (?, ?, ?)")
    .bind(threadId, userId, content)
    .run();

  const postId = result.meta.last_row_id;

  if (postId) {
    await db
      .prepare(
        "UPDATE threads SET reply_count = reply_count + 1, last_post_at = CURRENT_TIMESTAMP, last_post_user_id = ? WHERE id = ?"
      )
      .bind(userId, threadId)
      .run();

    const thread = await getThreadById(threadId);
    if (thread) {
      await db
        .prepare("UPDATE forums SET post_count = post_count + 1 WHERE id = ?")
        .bind(thread.forum_id)
        .run();
    }
  }

  return postId;
}

export async function getStats(): Promise<{
  totalThreads: number;
  totalPosts: number;
  totalUsers: number;
  totalForums: number;
}> {
  const db = getDB();

  const [threads, posts, users, forums] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM threads").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM posts").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM forums").first<{ count: number }>(),
  ]);

  return {
    totalThreads: threads?.count || 0,
    totalPosts: posts?.count || 0,
    totalUsers: users?.count || 0,
    totalForums: forums?.count || 0,
  };
}
