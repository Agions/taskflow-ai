import { getLogger } from '../../utils/logger';
/**
 * 数据库工具 - SQLite 支持 (使用 sql.js)
 */

import { ToolDefinition } from './types';
const logger = getLogger('mcp/tools/database');

// SQL.js 数据库缓存
const dbCache: Map<string, any> = new Map();

async function getDb(dbPath: string) {
  const path = await import('path');
  const fs = await import('fs/promises');
  const fullPath = path.resolve(dbPath);

  let db = dbCache.get(fullPath);
  if (db) return { db, fullPath };

  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();

  try {
    const buffer = await fs.readFile(fullPath);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }

  dbCache.set(fullPath, db);
  return { db, fullPath };
}

export const databaseTools: ToolDefinition[] = [
  {
    name: 'db_query',
    description: '执行 SQLite 查询',
    inputSchema: {
      type: 'object',
      properties: {
        dbPath: { type: 'string', description: '数据库文件路径' },
        sql: { type: 'string', description: 'SQL 查询语句' },
        params: {
          type: 'array',
          description: '查询参数',
          items: { type: 'string' },
        },
      },
      required: ['dbPath', 'sql'],
    },
    handler: async input => {
      const { db, fullPath } = await getDb(input.dbPath as string);
      const pathModule = await import('path');
      const fs = await import('fs/promises');

      try {
        const sql = input.sql as string;
        const params = (input.params as unknown[]) || [];

        // 判断是 SELECT 还是 INSERT/UPDATE/DELETE
        const isSelect = sql.trim().toLowerCase().startsWith('select');

        if (isSelect) {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);

          const rows: unknown[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();

          return {
            success: true,
            type: 'select',
            rows,
            count: rows.length,
          };
        } else {
          db.run(sql, params);

          // 保存到文件
          const data = db.export();
          const buffer = Buffer.from(data);
          await fs.writeFile(fullPath, buffer);

          return {
            success: true,
            type: 'write',
            changes: db.getRowsModified(),
          };
        }
      } catch (error: unknown) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error instanceof Error
                ? error.message
                : String(error)
              : String(error),
        };
      }
    },
    category: 'database',
    tags: ['db', 'sqlite', 'query'],
  },
  {
    name: 'db_init',
    description: '初始化 SQLite 数据库',
    inputSchema: {
      type: 'object',
      properties: {
        dbPath: { type: 'string', description: '数据库文件路径' },
        tables: {
          type: 'array',
          description: '表定义数组',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              columns: { type: 'array' },
            },
          },
        },
      },
      required: ['dbPath', 'tables'],
    },
    handler: async input => {
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs();
      const path = await import('path');
      const fs = await import('fs/promises');
      const dbPath = path.resolve(input.dbPath as string);

      // 确保目录存在
      const dir = path.dirname(dbPath);
      await fs.mkdir(dir, { recursive: true });

      const db = new SQL.Database();

      try {
        const tables = input.tables as Array<{ name: string; columns: string[] }>;

        for (const table of tables) {
          const columnsDef = table.columns.join(', ');
          const sql = `CREATE TABLE IF NOT EXISTS ${table.name} (${columnsDef})`;
          db.run(sql);
        }

        // 保存数据库
        const data = db.export();
        const buffer = Buffer.from(data);
        await fs.writeFile(dbPath, buffer);

        return {
          success: true,
          dbPath,
          tablesCreated: tables.map(t => t.name),
        };
      } finally {
        db.close();
      }
    },
    category: 'database',
    tags: ['db', 'sqlite', 'init'],
  },
  {
    name: 'db_list',
    description: '列出数据库中的表',
    inputSchema: {
      type: 'object',
      properties: {
        dbPath: { type: 'string', description: '数据库文件路径' },
      },
      required: ['dbPath'],
    },
    handler: async input => {
      const { db } = await getDb(input.dbPath as string);

      try {
        const stmt = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        const tables: string[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject() as { name: string };
          tables.push(row.name);
        }
        stmt.free();

        return {
          success: true,
          tables,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error instanceof Error
                ? error.message
                : String(error)
              : String(error),
        };
      }
    },
    category: 'database',
    tags: ['db', 'sqlite', 'list'],
  },
  {
    name: 'db_schema',
    description: '获取表结构',
    inputSchema: {
      type: 'object',
      properties: {
        dbPath: { type: 'string', description: '数据库文件路径' },
        table: { type: 'string', description: '表名' },
      },
      required: ['dbPath', 'table'],
    },
    handler: async input => {
      const { db } = await getDb(input.dbPath as string);

      try {
        const table = input.table as string;
        const stmt = db.prepare(`PRAGMA table_info(${table})`);

        const columns: unknown[] = [];
        while (stmt.step()) {
          columns.push(stmt.getAsObject());
        }
        stmt.free();

        return {
          success: true,
          table,
          columns,
        };
      } catch (error: unknown) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error instanceof Error
                ? error.message
                : String(error)
              : String(error),
        };
      }
    },
    category: 'database',
    tags: ['db', 'sqlite', 'schema'],
  },
];
