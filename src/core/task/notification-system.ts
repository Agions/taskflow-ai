/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 通知系统 - 处理各种通知和提醒
 * 支持多种通知渠道和智能提醒
 */

import { EventEmitter } from 'events';
import { Logger } from '../../infra/logger';
import { User, Notification, NotificationType } from './collaboration-manager';

/**
 * 通知渠道枚举
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

/**
 * 通知模板接口
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

/**
 * 通知规则接口
 */
export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  isActive: boolean;
  priority: number;
}

/**
 * 通知条件接口
 */
export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

/**
 * 通知动作接口
 */
export interface NotificationAction {
  type: 'send_notification' | 'send_email' | 'create_reminder' | 'escalate';
  channel: NotificationChannel;
  template: string;
  recipients: string[];
  delay?: number; // 延迟发送（秒）
}

/**
 * 提醒接口
 */
export interface Reminder {
  id: string;
  userId: string;
  taskId: string;
  type: 'deadline' | 'follow_up' | 'status_check' | 'custom';
  title: string;
  message: string;
  scheduledAt: Date;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  isSent: boolean;
  sentAt?: Date;
  isActive: boolean;
}

/**
 * 重复模式接口
 */
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // 间隔
  daysOfWeek?: number[]; // 周几（0-6，0为周日）
  dayOfMonth?: number; // 月份中的第几天
  endDate?: Date; // 结束日期
}

/**
 * 通知统计接口
 */
export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  byChannel: Record<NotificationChannel, number>;
  byType: Record<NotificationType, number>;
}

/**
 * 通知系统类
 */
export class NotificationSystem extends EventEmitter {
  private logger: Logger;
  private templates: Map<string, NotificationTemplate> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private reminderInterval: NodeJS.Timeout | null = null;
  private stats: NotificationStats;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.stats = this.initializeStats();
    this.initializeDefaultTemplates();
    this.startReminderScheduler();
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): NotificationStats {
    return {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      byChannel: {} as Record<NotificationChannel, number>,
      byType: {} as Record<NotificationType, number>
    };
  }

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'task_assigned',
        type: NotificationType.TASK_ASSIGNED,
        channel: NotificationChannel.IN_APP,
        subject: '新任务分配',
        body: '您被分配了新任务：{{taskTitle}}',
        variables: ['taskTitle', 'assignerName', 'dueDate'],
        isActive: true
      },
      {
        id: 'task_completed',
        type: NotificationType.TASK_COMPLETED,
        channel: NotificationChannel.IN_APP,
        subject: '任务完成',
        body: '任务"{{taskTitle}}"已完成',
        variables: ['taskTitle', 'completedBy', 'completedAt'],
        isActive: true
      },
      {
        id: 'task_overdue',
        type: NotificationType.TASK_OVERDUE,
        channel: NotificationChannel.EMAIL,
        subject: '任务逾期提醒',
        body: '任务"{{taskTitle}}"已逾期，请尽快处理',
        variables: ['taskTitle', 'dueDate', 'assignee'],
        isActive: true
      },
      {
        id: 'task_blocked',
        type: NotificationType.TASK_BLOCKED,
        channel: NotificationChannel.IN_APP,
        subject: '任务被阻塞',
        body: '任务"{{taskTitle}}"被阻塞，需要您的关注',
        variables: ['taskTitle', 'blockReason', 'blockedBy'],
        isActive: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * 发送通知
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  public async sendNotification(
    notification: Notification, 
    user: User, 
    context: any = {}
  ): Promise<boolean> {
    try {
      this.logger.info(`发送通知: ${notification.title} -> ${user.name}`);

      // 检查用户偏好
      if (!this.shouldSendToUser(notification, user)) {
        this.logger.info(`用户偏好设置跳过通知: ${user.id}`);
        return false;
      }

      // 应用通知规则
      const applicableRules = this.getApplicableRules(notification, context);
      
      for (const rule of applicableRules) {
        await this.executeRule(rule, notification, user, context);
      }

      // 发送到默认渠道
      await this.sendToChannel(NotificationChannel.IN_APP, notification, user, context);

      // 更新统计
      this.updateStats(notification, NotificationChannel.IN_APP, 'sent');

      this.emit('notification_sent', { notification, user, context });
      return true;

    } catch (error) {
      this.logger.error(`发送通知失败: ${(error as Error).message}`);
      this.updateStats(notification, NotificationChannel.IN_APP, 'failed');
      return false;
    }
  }

  /**
   * 发送到指定渠道
   * @param channel 通知渠道
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  private async sendToChannel(
    channel: NotificationChannel,
    notification: Notification,
    user: User,
    context: any
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(notification, user, context);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification, user, context);
        break;
      case NotificationChannel.PUSH:
        await this.sendPushNotification(notification, user, context);
        break;
      case NotificationChannel.SLACK:
        await this.sendSlackNotification(notification, user, context);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(notification, user, context);
        break;
    }
  }

  /**
   * 发送应用内通知
   */
  private async sendInAppNotification(notification: Notification, user: User, context: any): Promise<void> {
    // 应用内通知已经在创建时处理
    this.logger.info(`应用内通知已发送: ${notification.id}`);
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(notification: Notification, user: User, context: any): Promise<void> {
    // TODO: 实现邮件发送逻辑
    this.logger.info(`邮件通知发送到: ${user.email}`);
  }

  /**
   * 发送推送通知
   */
  private async sendPushNotification(notification: Notification, user: User, context: any): Promise<void> {
    // TODO: 实现推送通知逻辑
    this.logger.info(`推送通知发送到: ${user.id}`);
  }

  /**
   * 发送Slack通知
   */
  private async sendSlackNotification(notification: Notification, user: User, context: any): Promise<void> {
    // TODO: 实现Slack通知逻辑
    this.logger.info(`Slack通知发送到: ${user.id}`);
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotification(notification: Notification, user: User, context: any): Promise<void> {
    // TODO: 实现Webhook通知逻辑
    this.logger.info(`Webhook通知发送: ${notification.id}`);
  }

  /**
   * 检查是否应该发送给用户
   * @param notification 通知信息
   * @param user 用户信息
   */
  private shouldSendToUser(notification: Notification, user: User): boolean {
    const prefs = user.preferences.notifications;

    // 检查全局开关
    if (!prefs.email && !prefs.push) {
      return false;
    }

    // 检查具体类型开关
    switch (notification.type) {
      case NotificationType.TASK_ASSIGNED:
        return prefs.taskAssigned;
      case NotificationType.TASK_COMPLETED:
        return prefs.taskCompleted;
      case NotificationType.TASK_OVERDUE:
        return prefs.taskOverdue;
      case NotificationType.MENTION:
        return prefs.mentions;
      default:
        return true;
    }
  }

  /**
   * 获取适用的规则
   * @param notification 通知信息
   * @param context 上下文数据
   */
  private getApplicableRules(notification: Notification, context: any): NotificationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive)
      .filter(rule => this.evaluateConditions(rule.conditions, notification, context))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 评估条件
   * @param conditions 条件列表
   * @param notification 通知信息
   * @param context 上下文数据
   */
  private evaluateConditions(
    conditions: NotificationCondition[],
    notification: Notification,
    context: any
  ): boolean {
    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, notification, context);
      return this.evaluateCondition(condition, value);
    });
  }

  /**
   * 获取字段值
   * @param field 字段名
   * @param notification 通知信息
   * @param context 上下文数据
   */
  private getFieldValue(field: string, notification: Notification, context: any): any {
    if (field.startsWith('notification.')) {
      const key = field.substring('notification.'.length);
      return (notification as any)[key];
    }
    
    if (field.startsWith('context.')) {
      const key = field.substring('context.'.length);
      return context[key];
    }
    
    return undefined;
  }

  /**
   * 评估单个条件
   * @param condition 条件
   * @param value 实际值
   */
  private evaluateCondition(condition: NotificationCondition, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * 执行规则
   * @param rule 规则
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  private async executeRule(
    rule: NotificationRule,
    notification: Notification,
    user: User,
    context: any
  ): Promise<void> {
    for (const action of rule.actions) {
      if (action.delay && action.delay > 0) {
        // 延迟执行
        setTimeout(() => {
          this.executeAction(action, notification, user, context);
        }, action.delay * 1000);
      } else {
        await this.executeAction(action, notification, user, context);
      }
    }
  }

  /**
   * 执行动作
   * @param action 动作
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  private async executeAction(
    action: NotificationAction,
    notification: Notification,
    user: User,
    context: any
  ): Promise<void> {
    switch (action.type) {
      case 'send_notification':
        await this.sendToChannel(action.channel, notification, user, context);
        break;
      case 'send_email':
        await this.sendToChannel(NotificationChannel.EMAIL, notification, user, context);
        break;
      case 'create_reminder':
        this.createReminder(notification, user, context);
        break;
      case 'escalate':
        await this.escalateNotification(notification, user, context);
        break;
    }
  }

  /**
   * 创建提醒
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  private createReminder(notification: Notification, user: User, context: any): void {
    const reminder: Reminder = {
      id: this.generateId(),
      userId: user.id,
      taskId: (notification.data?.id as string) || '',
      type: 'follow_up',
      title: `提醒: ${notification.title}`,
      message: notification.message,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
      isRecurring: false,
      isSent: false,
      isActive: true
    };

    this.reminders.set(reminder.id, reminder);
    this.logger.info(`创建提醒: ${reminder.id}`);
  }

  /**
   * 升级通知
   * @param notification 通知信息
   * @param user 用户信息
   * @param context 上下文数据
   */
  private async escalateNotification(notification: Notification, user: User, context: any): Promise<void> {
    // TODO: 实现通知升级逻辑
    this.logger.info(`通知升级: ${notification.id}`);
  }

  /**
   * 启动提醒调度器
   */
  private startReminderScheduler(): void {
    this.reminderInterval = setInterval(() => {
      this.processReminders();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 处理提醒
   */
  private async processReminders(): Promise<void> {
    const now = new Date();
    
    for (const reminder of this.reminders.values()) {
      if (reminder.isActive && !reminder.isSent && reminder.scheduledAt <= now) {
        await this.sendReminder(reminder);
      }
    }
  }

  /**
   * 发送提醒
   * @param reminder 提醒信息
   */
  private async sendReminder(reminder: Reminder): Promise<void> {
    try {
      const notification: Notification = {
        id: this.generateId(),
        type: NotificationType.PROJECT_UPDATE,
        userId: reminder.userId,
        title: reminder.title,
        message: reminder.message,
        data: { reminderId: reminder.id, taskId: reminder.taskId },
        isRead: false,
        createdAt: new Date()
      };

      // 这里应该获取用户信息并发送通知
      // const user = await this.getUserById(reminder.userId);
      // await this.sendNotification(notification, user);

      reminder.isSent = true;
      reminder.sentAt = new Date();

      // 处理重复提醒
      if (reminder.isRecurring && reminder.recurringPattern) {
        this.scheduleNextReminder(reminder);
      }

      this.logger.info(`提醒已发送: ${reminder.id}`);

    } catch (error) {
      this.logger.error(`发送提醒失败: ${(error as Error).message}`);
    }
  }

  /**
   * 安排下次提醒
   * @param reminder 提醒信息
   */
  private scheduleNextReminder(reminder: Reminder): void {
    if (!reminder.recurringPattern) return;

    const pattern = reminder.recurringPattern;
    const nextDate = new Date(reminder.scheduledAt);

    switch (pattern.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + pattern.interval * 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
    }

    // 检查是否超过结束日期
    if (pattern.endDate && nextDate > pattern.endDate) {
      reminder.isActive = false;
      return;
    }

    // 创建新的提醒实例
    const newReminder: Reminder = {
      ...reminder,
      id: this.generateId(),
      scheduledAt: nextDate,
      isSent: false
    };

    this.reminders.set(newReminder.id, newReminder);
  }

  /**
   * 更新统计信息
   * @param notification 通知信息
   * @param channel 通知渠道
   * @param action 动作类型
   */
  private updateStats(notification: Notification, channel: NotificationChannel, action: string): void {
    this.stats.total++;
    
    if (action === 'sent') {
      this.stats.sent++;
    } else if (action === 'failed') {
      this.stats.failed++;
    }

    // 按渠道统计
    if (!this.stats.byChannel[channel]) {
      this.stats.byChannel[channel] = 0;
    }
    this.stats.byChannel[channel]++;

    // 按类型统计
    if (!this.stats.byType[notification.type]) {
      this.stats.byType[notification.type] = 0;
    }
    this.stats.byType[notification.type]++;
  }

  /**
   * 获取统计信息
   */
  public getStats(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * 添加通知模板
   * @param template 通知模板
   */
  public addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
    this.logger.info(`通知模板已添加: ${template.id}`);
  }

  /**
   * 添加通知规则
   * @param rule 通知规则
   */
  public addRule(rule: NotificationRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info(`通知规则已添加: ${rule.id}`);
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁通知系统
   */
  public destroy(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    
    this.removeAllListeners();
    this.logger.info('通知系统已销毁');
  }
}
