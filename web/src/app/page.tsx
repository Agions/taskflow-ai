'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  CpuChipIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const features = [
  {
    icon: DocumentTextIcon,
    title: 'PRD智能解析',
    description: '自动解析产品需求文档，提取功能需求、技术要求和业务逻辑',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: CpuChipIcon,
    title: 'AI任务编排',
    description: '基于AI算法优化任务顺序，识别依赖关系，提供最佳开发路径',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: ChartBarIcon,
    title: '可视化管理',
    description: '提供甘特图、看板、依赖图等多种可视化方式，直观展示项目进度',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: UsersIcon,
    title: '团队协作',
    description: '支持多人协作，实时同步，智能分配任务，提升团队效率',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

const stats = [
  { label: '解析准确率', value: '95%', icon: CheckCircleIcon },
  { label: '效率提升', value: '60%', icon: ClockIcon },
  { label: '团队满意度', value: '4.8/5', icon: UsersIcon },
  { label: '项目成功率', value: '90%', icon: ChartBarIcon },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <SparklesIcon className="w-4 h-4" />
                AI驱动的智能任务管理
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow AI
              </span>
              <br />
              智能PRD解析与任务管理
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              使用先进的AI技术自动解析产品需求文档，智能生成任务计划，
              优化开发流程，让团队专注于创造价值
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/dashboard"
                className="btn-primary btn-lg group"
              >
                开始使用
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="btn-outline btn-lg"
              >
                查看演示
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              核心功能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              集成AI技术的全流程任务管理解决方案
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="card hover:shadow-medium transition-all duration-300 group-hover:-translate-y-1">
                  <div className="card-content">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              数据说话
            </h2>
            <p className="text-xl text-gray-600">
              已帮助数千个团队提升开发效率
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              准备好提升您的开发效率了吗？
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              立即开始使用TaskFlow AI，体验AI驱动的智能任务管理
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="btn bg-white text-blue-600 hover:bg-gray-50 btn-lg"
              >
                免费开始
              </Link>
              <Link
                href="/contact"
                className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 btn-lg"
              >
                联系我们
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
