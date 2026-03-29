import { getLogger } from '../../utils/logger';
const logger = getLogger('module');
/**
 * 需求分析器
 */

import { PRDDocument, RequirementAnalysis, Feature, Risk } from '../types';

interface AIService {
  complete(prompt: string, options?: any): Promise<string>;
}

export class RequirementAnalyzer {
  constructor(private ai: AIService) {}

  async analyze(prd: PRDDocument): Promise<RequirementAnalysis> {
    const prompt = this.buildAnalysisPrompt(prd);

    try {
      const response = await this.ai.complete(prompt, {
        temperature: 0.3,
        maxTokens: 2000,
      });
      return this.parseAnalysisResponse(response);
    } catch (error) {
      logger.error('AI analysis failed:', error);
      return this.getDefaultAnalysis(prd);
    }
  }

  private buildAnalysisPrompt(prd: PRDDocument): string {
    return `Analyze the following PRD and extract key requirements:

Title: ${prd.title}
Description: ${prd.description}

Content:
${prd.content}

Provide analysis in JSON format:
{
  "features": [{"name": "", "description": "", "priority": "high|medium|low"}],
  "risks": [{"description": "", "severity": "high|medium|low", "mitigation": ""}],
  "complexity": "high|medium|low"
}`;
  }

  private parseAnalysisResponse(response: string): RequirementAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    return this.getDefaultAnalysis({ title: '', description: '', content: response });
  }

  private getDefaultAnalysis(prd: Partial<PRDDocument>): RequirementAnalysis {
    return {
      features: [
        {
          name: prd.title || 'Main Feature',
          description: prd.description || 'Main feature implementation',
          complexity: 'medium',
          priority: 'high',
          dependencies: [],
        },
      ],
      risks: [],
      technicalConstraints: [],
      complexity: 'medium',
    };
  }
}
