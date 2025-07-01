/**
 * 协作管理器 - 处理团队协作功能
 * 支持多人协作、实时同步、冲突解决等功能
 */

import { EventEmitter } from 'events';
import { Logger } from '../../infra/logger';
import { Task, TaskStatus } from '../../types/task';
import { TaskEvent, TaskEventType } from './enhanced-task-manager';

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  preferences: UserPreferences;
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  TESTER = 'tester',
  VIEWER = 'viewer'
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    taskAssigned: boolean;
    taskCompleted: boolean;
    taskOverdue: boolean;
    mentions: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  workflow: {
    autoAssignTasks: boolean;
    defaultPriority: string;
    workingHours: {
      start: string;
      end: string;
      days: number[];
    };
  };
}

/**
 * 协作会话接口
 */
export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: string[];
  startedAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

/**
 * 冲突类型枚举
 */
export enum ConflictType {
  CONCURRENT_EDIT = 'concurrent_edit',
  STATUS_CONFLICT = 'status_conflict',
  ASSIGNMENT_CONFLICT = 'assignment_conflict',
  DEPENDENCY_CONFLICT = 'dependency_conflict'
}

/**
 * 冲突信息接口
 */
export interface Conflict {
  id: string;
  type: ConflictType;
  taskId: string;
  users: string[];
  description: string;
  data: any;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: any;
}

/**
 * 通知类型枚举
 */
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  TASK_BLOCKED = 'task_blocked',
  MENTION = 'mention',
  CONFLICT = 'conflict',
  PROJECT_UPDATE = 'project_update'
}

/**
 * 通知接口
 */
export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

/**
 * 活动日志接口
 */
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  targetType: 'task' | 'project' | 'user';
  targetId: string;
  description: string;
  metadata: any;
  timestamp: Date;
}

/**
 * 协作管理器类
 */
export class CollaborationManager extends EventEmitter {
  private logger: Logger;
  private users: Map<string, User> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private conflicts: Map<string, Conflict> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private activityLogs: ActivityLog[] = [];
  private onlineUsers: Set<string> = new Set();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * 添加用户
   * @param user 用户信息
   */
  public addUser(user: User): void {
    this.users.set(user.id, user);
    this.logger.info(`用户已添加: ${user.name} (${user.id})`);
  }

  /**
   * 获取用户
   * @param userId 用户ID
   */
  public getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * 获取所有用户
   */
  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 用户上线
   * @param userId 用户ID
   */
  public userOnline(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = true;
      user.lastSeen = new Date();
      this.onlineUsers.add(userId);

      this.emit('user_online', { userId, user });
      this.logger.info(`用户上线: ${user.name}`);
    }
  }

  /**
   * 用户下线
   * @param userId 用户ID
   */
  public userOffline(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      this.onlineUsers.delete(userId);

      this.emit('user_offline', { userId, user });
      this.logger.info(`用户下线: ${user.name}`);
    }
  }

  /**
   * 获取在线用户
   */
  public getOnlineUsers(): User[] {
    return Array.from(this.onlineUsers)
      .map(userId => this.users.get(userId))
      .filter(user => user !== undefined) as User[];
  }

  /**
   * 创建协作会话
   * @param projectId 项目ID
   * @param participants 参与者ID列表
   */
  public createSession(projectId: string, participants: string[]): CollaborationSession {
    const session: CollaborationSession = {
      id: this.generateId(),
      projectId,
      participants,
      startedAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    this.sessions.set(session.id, session);

    this.emit('session_created', session);
    this.logger.info(`协作会话已创建: ${session.id}`);

    return session;
  }

  /**
   * 加入协作会话
   * @param sessionId 会话ID
   * @param userId 用户ID
   */
  public joinSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      session.lastActivity = new Date();

      this.emit('user_joined_session', { sessionId, userId });
      this.logger.info(`用户 ${userId} 加入会话 ${sessionId}`);
    }

    return true;
  }

  /**
   * 离开协作会话
   * @param sessionId 会话ID
   * @param userId 用户ID
   */
  public leaveSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const index = session.participants.indexOf(userId);
    if (index > -1) {
      session.participants.splice(index, 1);
      session.lastActivity = new Date();

      this.emit('user_left_session', { sessionId, userId });
      this.logger.info(`用户 ${userId} 离开会话 ${sessionId}`);

      // 如果没有参与者了，关闭会话
      if (session.participants.length === 0) {
        this.closeSession(sessionId);
      }
    }

    return true;
  }

  /**
   * 关闭协作会话
   * @param sessionId 会话ID
   */
  public closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.isActive = false;

    this.emit('session_closed', session);
    this.logger.info(`协作会话已关闭: ${sessionId}`);

    return true;
  }

  /**
   * 处理任务事件
   * @param event 任务事件
   */
  public handleTaskEvent(event: TaskEvent): void {
    // 检测冲突
    this.detectConflicts(event);

    // 发送通知
    this.sendNotifications(event);

    // 记录活动
    this.logActivity(event);

    // 更新会话活动
    this.updateSessionActivity(event);
  }

  /**
   * 检测冲突
   * @param event 任务事件
   */
  private detectConflicts(event: TaskEvent): void {
    // 检测并发编辑冲突
    if (event.type === TaskEventType.TASK_UPDATED) {
      const recentEvents = this.getRecentTaskEvents(event.taskId, 60000); // 1分钟内
      const concurrentEdits = recentEvents.filter(e =>
        e.type === TaskEventType.TASK_UPDATED &&
        e.userId !== event.userId
      );

      if (concurrentEdits.length > 0) {
        this.createConflict({
          type: ConflictType.CONCURRENT_EDIT,
          taskId: event.taskId,
          users: [event.userId!, ...concurrentEdits.map(e => e.userId!)].filter(Boolean),
          description: '检测到并发编辑冲突',
          data: { event, concurrentEdits }
        });
      }
    }

    // 检测状态冲突
    if (event.type === TaskEventType.TASK_STATUS_CHANGED) {
      const { oldStatus, newStatus } = event.data;

      // 检查状态转换是否合法
      if (!this.isValidStatusTransition(oldStatus, newStatus)) {
        this.createConflict({
          type: ConflictType.STATUS_CONFLICT,
          taskId: event.taskId,
          users: [event.userId!].filter(Boolean),
          description: `无效的状态转换: ${oldStatus} -> ${newStatus}`,
          data: { oldStatus, newStatus }
        });
      }
    }
  }

  /**
   * 创建冲突
   * @param conflictData 冲突数据
   */
  private createConflict(conflictData: Omit<Conflict, 'id' | 'createdAt'>): Conflict {
    const conflict: Conflict = {
      id: this.generateId(),
      ...conflictData,
      createdAt: new Date()
    };

    this.conflicts.set(conflict.id, conflict);

    // 通知相关用户
    conflict.users.forEach(userId => {
      this.createNotification({
        type: NotificationType.CONFLICT,
        userId,
        title: '检测到冲突',
        message: conflict.description,
        data: conflict
      });
    });

    this.emit('conflict_detected', conflict);
    this.logger.warn(`检测到冲突: ${conflict.description}`);

    return conflict;
  }

  /**
   * 解决冲突
   * @param conflictId 冲突ID
   * @param resolution 解决方案
   * @param resolvedBy 解决者ID
   */
  public resolveConflict(conflictId: string, resolution: any, resolvedBy: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.resolvedAt) {
      return false;
    }

    conflict.resolvedAt = new Date();
    conflict.resolvedBy = resolvedBy;
    conflict.resolution = resolution;

    this.emit('conflict_resolved', conflict);
    this.logger.info(`冲突已解决: ${conflictId}`);

    return true;
  }

  /**
   * 发送通知
   * @param event 任务事件
   */
  private sendNotifications(event: TaskEvent): void {
    switch (event.type) {
      case TaskEventType.TASK_ASSIGNED:
        const { newAssignee } = event.data;
        if (newAssignee) {
          this.createNotification({
            type: NotificationType.TASK_ASSIGNED,
            userId: newAssignee,
            title: '任务已分配',
            message: `您被分配了新任务: ${event.data.task.title}`,
            data: event.data.task
          });
        }
        break;

      case TaskEventType.TASK_COMPLETED:
        // 通知项目相关人员
        this.notifyProjectMembers(event.data.task, {
          type: NotificationType.TASK_COMPLETED,
          title: '任务已完成',
          message: `任务 "${event.data.task.title}" 已完成`,
          data: event.data.task
        });
        break;

      case TaskEventType.TASK_BLOCKED:
        // 通知任务负责人和项目管理员
        if (event.data.task.assignee) {
          this.createNotification({
            type: NotificationType.TASK_BLOCKED,
            userId: event.data.task.assignee,
            title: '任务被阻塞',
            message: `任务 "${event.data.task.title}" 被阻塞`,
            data: event.data.task
          });
        }
        break;
    }
  }

  /**
   * 创建通知
   * @param notificationData 通知数据
   */
  private createNotification(notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    const notification: Notification = {
      id: this.generateId(),
      ...notificationData,
      isRead: false,
      createdAt: new Date()
    };

    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }

    this.notifications.get(notification.userId)!.push(notification);

    // 检查用户通知偏好
    const user = this.users.get(notification.userId);
    if (user && this.shouldSendNotification(user, notification.type)) {
      this.emit('notification_created', notification);
    }

    return notification;
  }

  /**
   * 通知项目成员
   * @param task 任务
   * @param notificationData 通知数据
   */
  private notifyProjectMembers(task: Task, notificationData: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>): void {
    // 获取项目相关用户（简化实现）
    const projectMembers = Array.from(this.users.values()).filter(user =>
      user.role === UserRole.PROJECT_MANAGER || user.role === UserRole.ADMIN
    );

    projectMembers.forEach(user => {
      this.createNotification({
        ...notificationData,
        userId: user.id
      });
    });
  }

  /**
   * 检查是否应该发送通知
   * @param user 用户
   * @param notificationType 通知类型
   */
  private shouldSendNotification(user: User, notificationType: NotificationType): boolean {
    const prefs = user.preferences.notifications;

    switch (notificationType) {
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
   * 记录活动
   * @param event 任务事件
   */
  private logActivity(event: TaskEvent): void {
    if (!event.userId) return;

    const activity: ActivityLog = {
      id: this.generateId(),
      userId: event.userId,
      action: event.type,
      targetType: 'task',
      targetId: event.taskId,
      description: this.generateActivityDescription(event),
      metadata: event.data,
      timestamp: event.timestamp
    };

    this.activityLogs.push(activity);

    // 限制活动日志大小
    if (this.activityLogs.length > 10000) {
      this.activityLogs = this.activityLogs.slice(-5000);
    }

    this.emit('activity_logged', activity);
  }

  /**
   * 生成活动描述
   * @param event 任务事件
   */
  private generateActivityDescription(event: TaskEvent): string {
    const user = this.users.get(event.userId!);
    const userName = user?.name || '未知用户';

    switch (event.type) {
      case TaskEventType.TASK_CREATED:
        return `${userName} 创建了任务`;
      case TaskEventType.TASK_UPDATED:
        return `${userName} 更新了任务`;
      case TaskEventType.TASK_STATUS_CHANGED:
        return `${userName} 将任务状态从 ${event.data.oldStatus} 改为 ${event.data.newStatus}`;
      case TaskEventType.TASK_ASSIGNED:
        return `${userName} 将任务分配给了 ${event.data.newAssignee}`;
      case TaskEventType.TASK_COMPLETED:
        return `${userName} 完成了任务`;
      default:
        return `${userName} 执行了 ${event.type} 操作`;
    }
  }

  /**
   * 更新会话活动
   * @param event 任务事件
   */
  private updateSessionActivity(event: TaskEvent): void {
    // 更新相关会话的最后活动时间
    this.sessions.forEach(session => {
      if (session.isActive && event.userId && session.participants.includes(event.userId)) {
        session.lastActivity = new Date();
      }
    });
  }

  /**
   * 获取最近的任务事件
   * @param taskId 任务ID
   * @param timeWindow 时间窗口（毫秒）
   */
  private getRecentTaskEvents(taskId: string, timeWindow: number): TaskEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);

    return this.activityLogs
      .filter(log => log.targetId === taskId && log.timestamp > cutoff)
      .map(log => ({
        type: log.action as TaskEventType,
        taskId: log.targetId,
        userId: log.userId,
        timestamp: log.timestamp,
        data: log.metadata
      }));
  }

  /**
   * 检查状态转换是否有效
   * @param oldStatus 旧状态
   * @param newStatus 新状态
   */
  private isValidStatusTransition(oldStatus: TaskStatus, newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.NOT_STARTED]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING, TaskStatus.CANCELLED],
      [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.RUNNING, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.REVIEW],
      [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.FAILED, TaskStatus.CANCELLED],
      [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.RUNNING, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW], // 允许重新打开
      [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW], // 允许重新打开
      [TaskStatus.FAILED]: [TaskStatus.IN_PROGRESS, TaskStatus.RUNNING, TaskStatus.CANCELLED],
      [TaskStatus.CANCELLED]: [TaskStatus.NOT_STARTED, TaskStatus.PENDING],
      [TaskStatus.ON_HOLD]: [TaskStatus.IN_PROGRESS, TaskStatus.RUNNING, TaskStatus.CANCELLED],
      [TaskStatus.REVIEW]: [TaskStatus.COMPLETED, TaskStatus.DONE, TaskStatus.IN_PROGRESS],
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING, TaskStatus.CANCELLED]
    };

    return validTransitions[oldStatus]?.includes(newStatus) || false;
  }

  /**
   * 获取用户通知
   * @param userId 用户ID
   * @param unreadOnly 只获取未读通知
   */
  public getUserNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const notifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      return notifications.filter(n => !n.isRead);
    }

    return notifications;
  }

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @param userId 用户ID
   */
  public markNotificationAsRead(notificationId: string, userId: string): boolean {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);

    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * 获取活动日志
   * @param filters 过滤条件
   * @param limit 限制数量
   */
  public getActivityLogs(filters?: {
    userId?: string;
    targetType?: string;
    targetId?: string;
    after?: Date;
  }, limit: number = 100): ActivityLog[] {
    let logs = this.activityLogs;

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.targetType && log.targetType !== filters.targetType) return false;
        if (filters.targetId && log.targetId !== filters.targetId) return false;
        if (filters.after && log.timestamp < filters.after) return false;
        return true;
      });
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
