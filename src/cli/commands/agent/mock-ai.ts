/**
 * Mock AI 服务
 */

export class MockAIService {
  async complete(prompt: string, options?: any): Promise<string> {
    if (prompt.includes('task plan')) {
      return JSON.stringify({
        tasks: [
          {
            title: 'Setup Project',
            description: 'Initialize project structure',
            type: 'shell',
            priority: 'high',
            estimate: 2,
            dependencies: [],
            tags: ['setup'],
          },
          {
            title: 'Implement Feature',
            description: 'Implement the main feature',
            type: 'code',
            priority: 'high',
            estimate: 8,
            dependencies: [],
            outputPath: 'src/feature/index.ts',
            tags: ['core', 'feature'],
          },
          {
            title: 'Add Tests',
            description: 'Write unit tests',
            type: 'test',
            priority: 'medium',
            estimate: 4,
            dependencies: ['T002'],
            tags: ['test'],
          },
        ],
      });
    }

    if (prompt.includes('analyze')) {
      return JSON.stringify({
        features: [
          {
            name: 'Core Feature',
            description: 'Main feature implementation',
            complexity: 'medium',
            dependencies: [],
          },
        ],
        technicalConstraints: ['TypeScript', 'React'],
        risks: [],
      });
    }

    return '{}';
  }
}
