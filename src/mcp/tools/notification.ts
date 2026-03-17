/**
 * 通知工具 - Slack, Discord, Email
 */

import { ToolDefinition, PermissionLevel } from './types';

// Slack Webhook
async function sendSlackWebhook(
  webhookUrl: string,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Slack error: ${response.status} - ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface SlackMessage {
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

// Discord Webhook
async function sendDiscordWebhook(
  webhookUrl: string,
  message: DiscordMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Discord error: ${response.status} - ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface DiscordMessage {
  content?: string;
  embeds?: unknown[];
  username?: string;
  avatar_url?: string;
}

export const notificationTools: ToolDefinition[] = [
  {
    name: 'notify_slack',
    description: '发送 Slack 消息',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Slack Webhook URL' },
        message: { type: 'string', description: '消息内容' },
        blocks: {
          type: 'array',
          description: 'Slack Block Kit 消息块',
        },
      },
      required: ['webhookUrl', 'message'],
    },
    handler: async input => {
      const webhookUrl = input.webhookUrl as string;
      const message = input.message as string;
      const blocks = input.blocks as unknown[] | undefined;

      const payload: SlackMessage = { text: message };
      if (blocks) {
        payload.blocks = blocks;
      }

      return sendSlackWebhook(webhookUrl, payload);
    },
    category: 'notification',
    tags: ['notification', 'slack', 'webhook', 'message'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'notify_discord',
    description: '发送 Discord 消息',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Discord Webhook URL' },
        message: { type: 'string', description: '消息内容' },
        embeds: {
          type: 'array',
          description: 'Discord Embed 消息',
        },
        username: { type: 'string', description: '自定义用户名' },
        avatarUrl: { type: 'string', description: '自定义头像 URL' },
      },
      required: ['webhookUrl', 'message'],
    },
    handler: async input => {
      const webhookUrl = input.webhookUrl as string;
      const message = input.message as string;
      const embeds = input.embeds as unknown[] | undefined;
      const username = input.username as string | undefined;
      const avatarUrl = input.avatarUrl as string | undefined;

      const payload: DiscordMessage = { content: message };
      if (embeds) payload.embeds = embeds;
      if (username) payload.username = username;
      if (avatarUrl) payload.avatar_url = avatarUrl;

      return sendDiscordWebhook(webhookUrl, payload);
    },
    category: 'notification',
    tags: ['notification', 'discord', 'webhook', 'message'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'notify_email',
    description: '发送电子邮件 (需要 SMTP 配置)',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '发件人邮箱' },
        to: { type: 'string', description: '收件人邮箱' },
        subject: { type: 'string', description: '邮件主题' },
        body: { type: 'string', description: '邮件正文' },
        html: { type: 'boolean', description: '是否发送 HTML', default: false },
        smtpHost: { type: 'string', description: 'SMTP 服务器' },
        smtpPort: { type: 'number', description: 'SMTP 端口', default: 587 },
        smtpUser: { type: 'string', description: 'SMTP 用户名' },
        smtpPass: { type: 'string', description: 'SMTP 密码' },
      },
      required: ['from', 'to', 'subject', 'body'],
    },
    handler: async input => {
      // 简单的 nodemailer 封装
      // 实际使用时需要 nodemailer 包
      const { from, to, subject, body } = input;

      // 返回配置信息，实际发送需要环境变量配置
      return {
        success: false,
        error:
          'Email notification requires SMTP configuration. Set environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS',
        configRequired: {
          from,
          to,
          subject,
        },
      };
    },
    category: 'notification',
    tags: ['notification', 'email', 'smtp', 'mail'],
    permissions: [PermissionLevel.EXECUTE],
  },
  {
    name: 'notify_webhook',
    description: '发送通用 Webhook 请求',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Webhook URL' },
        method: {
          type: 'string',
          description: 'HTTP 方法',
          enum: ['POST', 'PUT', 'GET'],
          default: 'POST',
        },
        headers: {
          type: 'object',
          description: '请求头',
          additionalProperties: { type: 'string' },
        },
        body: { type: 'string', description: '请求体' },
      },
      required: ['url', 'method'],
    },
    handler: async input => {
      const url = input.url as string;
      const method = (input.method as string) || 'POST';
      const headers = (input.headers as Record<string, string>) || {};
      const body = input.body as string | undefined;

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const responseText = await response.text();

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          response: responseText,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    category: 'notification',
    tags: ['notification', 'webhook', 'http', 'request'],
    permissions: [PermissionLevel.EXECUTE],
  },
];
