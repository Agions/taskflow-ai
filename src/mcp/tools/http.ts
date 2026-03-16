/**
 * HTTP 请求工具
 */

import { ToolDefinition } from './types';

export const httpTools: ToolDefinition[] = [
  {
    name: 'http_request',
    description: '发送 HTTP 请求',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '请求 URL' },
        method: { 
          type: 'string', 
          description: 'HTTP 方法',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        },
        headers: { 
          type: 'object', 
          description: '请求头',
          additionalProperties: { type: 'string' },
        },
        body: { 
          type: 'object', 
          description: '请求体 (JSON)' 
        },
        query: {
          type: 'object',
          description: 'URL 查询参数',
          additionalProperties: { type: 'string' },
        },
        timeout: { 
          type: 'number', 
          description: '超时时间 (毫秒)' 
        },
        followRedirects: {
          type: 'boolean',
          description: '跟随重定向',
        },
      },
      required: ['url'],
    },
    handler: async (input) => {
      const urlObj = new URL(input.url as string);
      
      // 添加查询参数
      if (input.query) {
        Object.entries(input.query as Record<string, string>).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
      }

      const options: RequestInit = {
        method: (input.method as string) || 'GET',
        headers: (input.headers as Record<string, string>) || {},
      };

      // 添加请求体
      if (input.body && !['GET', 'HEAD'].includes((input.method as string)?.toUpperCase() || 'GET')) {
        options.body = JSON.stringify(input.body);
        const headers = options.headers as Record<string, string>;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const timeout = (input.timeout as number) || 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      options.signal = controller.signal;

      try {
        const response = await fetch(urlObj.toString(), options);
        clearTimeout(timeoutId);

        // 获取响应头
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // 解析响应体
        let data: unknown;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch {
            data = await response.text();
          }
        } else if (contentType.includes('text/')) {
          data = await response.text();
        } else {
          // 二进制数据转为 base64
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          data = buffer.toString('base64');
        }

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data,
          url: response.url,
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        throw new Error(`HTTP 请求失败: ${error.message}`);
      }
    },
    category: 'http',
    tags: ['http', 'request', 'fetch', 'api'],
  },
  {
    name: 'http_get',
    description: '发送 GET 请求',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '请求 URL' },
        query: {
          type: 'object',
          description: 'URL 查询参数',
          additionalProperties: { type: 'string' },
        },
        headers: { 
          type: 'object', 
          description: '请求头',
          additionalProperties: { type: 'string' },
        },
        timeout: { 
          type: 'number', 
          description: '超时时间 (毫秒)' 
        },
      },
      required: ['url'],
    },
    handler: async (input) => {
      // 复用 http_request 的逻辑
      const httpRequestTool = httpTools.find(t => t.name === 'http_request');
      return httpRequestTool?.handler({
        ...input,
        method: 'GET',
      });
    },
    category: 'http',
    tags: ['http', 'get', 'fetch'],
  },
  {
    name: 'http_post',
    description: '发送 POST 请求',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '请求 URL' },
        body: { 
          type: 'object', 
          description: '请求体 (JSON)' 
        },
        query: {
          type: 'object',
          description: 'URL 查询参数',
          additionalProperties: { type: 'string' },
        },
        headers: { 
          type: 'object', 
          description: '请求头',
          additionalProperties: { type: 'string' },
        },
        timeout: { 
          type: 'number', 
          description: '超时时间 (毫秒)' 
        },
      },
      required: ['url', 'body'],
    },
    handler: async (input) => {
      const httpRequestTool = httpTools.find(t => t.name === 'http_request');
      return httpRequestTool?.handler({
        ...input,
        method: 'POST',
      });
    },
    category: 'http',
    tags: ['http', 'post', 'fetch'],
  },
  {
    name: 'http_download',
    description: '下载文件到本地',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '文件 URL' },
        path: { type: 'string', description: '保存路径' },
        timeout: { 
          type: 'number', 
          description: '超时时间 (毫秒)' 
        },
      },
      required: ['url', 'path'],
    },
    handler: async (input) => {
      const path = await import('path');
      const fs = await import('fs/promises');
      
      const response = await fetch(input.url as string);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const fullPath = path.resolve(input.path as string);
      
      // 确保目录存在
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, buffer);
      
      return {
        success: true,
        path: fullPath,
        size: buffer.length,
        contentType: response.headers.get('content-type'),
      };
    },
    category: 'http',
    tags: ['http', 'download', 'file'],
  },
];
