/**
 * Knowledge 命令引擎
 */

import path = require('path');
import fs = require('fs-extra');
import { KnowledgeBaseConfig } from '../../../knowledge/types';
import { EmbeddingManager } from '../../../knowledge/embedding';
import { VectorStoreManager } from '../../../knowledge/storage';
import { KnowledgeRetrievalEngine } from '../../../knowledge/retrieval';

const CONFIG_PATH = path.join(process.cwd(), '.taskflow', 'knowledge-config.json');

/**
 * 检查知识库是否已初始化
 */
export async function isInitialized(): Promise<boolean> {
  return await fs.pathExists(CONFIG_PATH);
}

/**
 * 获取配置路径
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}

/**
 * 加载知识库配置
 */
export async function loadConfig(): Promise<KnowledgeBaseConfig | null> {
  if (!(await isInitialized())) {
    return null;
  }
  return await fs.readJson(CONFIG_PATH);
}

/**
 * 保存知识库配置
 */
export async function saveConfig(config: KnowledgeBaseConfig): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

/**
 * 创建知识库引擎
 */
export async function createEngine(): Promise<{
  engine: KnowledgeRetrievalEngine;
  config: KnowledgeBaseConfig;
} | null> {
  const config = await loadConfig();
  if (!config) {
    return null;
  }

  const embeddingManager = new EmbeddingManager(config.embeddingModel);
  const vectorStore = new VectorStoreManager(config.vectorStore, embeddingManager);
  const engine = new KnowledgeRetrievalEngine(
    embeddingManager,
    vectorStore,
    config.chunkSize,
    config.chunkOverlap
  );

  await engine.initialize();
  return { engine, config };
}

/**
 * 创建向量存储
 */
export async function createVectorStore(): Promise<{
  vectorStore: VectorStoreManager;
  config: KnowledgeBaseConfig;
} | null> {
  const config = await loadConfig();
  if (!config) {
    return null;
  }

  const embeddingManager = new EmbeddingManager(config.embeddingModel);
  const vectorStore = new VectorStoreManager(config.vectorStore, embeddingManager);

  await vectorStore.initialize();
  return { vectorStore, config };
}
