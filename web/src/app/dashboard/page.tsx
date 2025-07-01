'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';

// 模拟数据
const stats = [
  {
    name: '活跃项目',
    value: '12',
    change: '+2',
    changeType: 'increase' as const,
    icon: DocumentTextIcon,
    color: 'blue',
  },
  {
    name: '完成任务',
    value: '89',
    change: '+12',
    changeType: 'increase' as const,
    icon: CheckCircleIcon,
    color: 'green',
  },
  {
    name: '团队成员',
    value: '24',
    change: '+3',
    changeType: 'increase' as const,
    icon: UsersIcon,
    color: 'purple',
  },
  {
    name: '平均效率',
    value: '94%',
    change: '+5%',
    changeType: 'increase' as const,
    icon: ChartBarIcon,
    color: 'orange',
  },
];

const recentProjects = [
  {
    id: '1',
    name: '电商平台重构',
    description: '基于微服务架构的电商平台重构项目',
    status: 'active',
    progress: 75,
    dueDate: '2024-02-15',
    team: ['张三', '李四', '王五'],
    priority: 'high',
    tasksCount: 24,
    completedTasks: 18,
  },
  {
    id: '2',
    name: '移动端APP开发',
    description: '跨平台移动应用开发项目',
    status: 'active',
    progress: 45,
    dueDate: '2024-03-01',
    team: ['赵六', '钱七'],
    priority: 'medium',
    tasksCount: 16,
    completedTasks: 7,
  },
  {
    id: '3',
    name: 'AI推荐系统',
    description: '基于机器学习的个性化推荐系统',
    status: 'planning',
    progress: 15,
    dueDate: '2024-04-10',
    team: ['孙八', '周九', '吴十'],
    priority: 'high',
    tasksCount: 32,
    completedTasks: 5,
  },
];

const upcomingTasks = [
  {
    id: '1',
    title: '完成用户认证模块',
    project: '电商平台重构',
    priority: 'high',
    dueDate: '2024-01-20',
    assignee: '张三',
    status: 'in_progress',
  },
  {
    id: '2',
    title: '设计商品详情页面',
    project: '移动端APP开发',
    priority: 'medium',
    dueDate: '2024-01-22',
    assignee: '李四',
    status: 'not_started',
  },
  {
    id: '3',
    title: '数据模型设计',
    project: 'AI推荐系统',
    priority: 'high',
    dueDate: '2024-01-25',
    assignee: '王五',
    status: 'not_started',
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'task_completed',
    user: '张三',
    action: '完成了任务',
    target: '用户登录接口开发',
    time: '2小时前',
    project: '电商平台重构',
  },
  {
    id: '2',
    type: 'project_created',
    user: '李四',
    action: '创建了项目',
    target: 'AI推荐系统',
    time: '4小时前',
    project: null,
  },
  {
    id: '3',
    type: 'task_assigned',
    user: '王五',
    action: '被分配了任务',
    target: '数据库设计',
    time: '6小时前',
    project: '移动端APP开发',
  },
  {
    id: '4',
    type: 'milestone_reached',
    user: '系统',
    action: '达成了里程碑',
    target: '第一阶段开发完成',
    time: '1天前',
    project: '电商平台重构',
  },
];

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 页面标题和快速操作 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
            <p className="mt-2 text-sm text-gray-600">
              欢迎回来！这里是您的项目概览和最新动态。
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <QuickActions />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 左侧：项目和任务 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 最近项目 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">最近项目</h2>
                <button className="btn-outline btn-sm">
                  查看全部
                </button>
              </div>
              <div className="grid gap-6">
                {recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 即将到期的任务 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">即将到期</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="text-sm border-gray-300 rounded-md"
                  >
                    <option value="3d">3天内</option>
                    <option value="7d">7天内</option>
                    <option value="14d">14天内</option>
                  </select>
                </div>
              </div>
              <TaskList tasks={upcomingTasks} />
            </motion.div>
          </div>

          {/* 右侧：活动动态 */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">最新动态</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  查看全部
                </button>
              </div>
              <ActivityFeed activities={recentActivity} />
            </motion.div>

            {/* 快速统计 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="card-title text-lg">本周概览</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">完成任务</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">23</span>
                    <ArrowUpIcon className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">新增任务</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">18</span>
                    <ArrowUpIcon className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">逾期任务</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">2</span>
                    <ArrowDownIcon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">团队效率</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">94%</span>
                    <ArrowUpIcon className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 提醒和通知 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="card-title text-lg">提醒</h3>
              </div>
              <div className="card-content space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      项目截止日期临近
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      电商平台重构项目将在3天后截止
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      里程碑达成
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      移动端APP开发第一阶段已完成
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
