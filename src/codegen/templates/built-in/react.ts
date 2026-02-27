/**
 * React 内置模板
 */

import { CodeTemplate } from '../../types';

export const reactFunctionalTemplate: CodeTemplate = {
  id: 'react-functional',
  name: 'React Functional Component',
  description: 'React functional component with TypeScript',
  framework: 'react',
  language: 'typescript',
  version: '1.0.0',
  template: `import React{{#if hasState}}, { useState, useEffect }{{/if}} from 'react';
{{#if hasStyles}}
import './{{componentName}}.{{styleType}}';
{{/if}}

{{#if description}}
/**
 * {{description}}
 */
{{/if}}
export interface {{componentName}}Props {
{{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
{{/each}}
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
{{#each props}}
  {{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},
{{/each}}
}) => {
{{#if hasState}}
  const [state, setState] = useState<any>(null);
{{/if}}
{{#if hasEffects}}

  useEffect(() => {
  }, []);
{{/if}}

  return (
    <div className="{{kebabCase componentName}}">
{{#if description}}
      {/* {{description}} */}
{{/if}}
{{#each props}}
      <div>{{name}}: { {{name}} }</div>
{{/each}}
    </div>
  );
};

export default {{componentName}};`,
  variables: [
    { name: 'componentName', type: 'string', required: true, description: 'Component name' },
    { name: 'description', type: 'string', required: false, description: 'Component description' },
    { name: 'props', type: 'array', required: false, default: [], description: 'Component props' },
    { name: 'hasState', type: 'boolean', required: false, default: false, description: 'Include state hooks' },
    { name: 'hasEffects', type: 'boolean', required: false, default: false, description: 'Include effect hooks' },
    { name: 'hasStyles', type: 'boolean', required: false, default: true, description: 'Include style file' },
    { name: 'styleType', type: 'string', required: false, default: 'css', description: 'Style file extension' }
  ],
  validation: [
    { rule: 'pascalCase', pattern: '^[A-Z][a-zA-Z0-9]*$', message: 'Component name must be PascalCase' }
  ],
  metadata: {
    author: 'TaskFlow AI',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['react', 'typescript', 'functional'],
    category: 'component',
    complexity: 'simple'
  }
};

export const reactHookTemplate: CodeTemplate = {
  id: 'react-hook',
  name: 'React Custom Hook',
  description: 'React custom hook with TypeScript',
  framework: 'react',
  language: 'typescript',
  version: '1.0.0',
  template: `import { useState, useEffect, useCallback } from 'react';

{{#if description}}
/**
 * {{description}}
 * 
 * @example
 * const { {{#each returns}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} } = {{hookName}}();
 */
{{/if}}
export function {{hookName}}() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      setState(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    state,
    loading,
    error,
    execute,
  };
}

export default {{hookName}};`,
  variables: [
    { name: 'hookName', type: 'string', required: true, description: 'Hook name (must start with "use")' },
    { name: 'description', type: 'string', required: false, description: 'Hook description' },
    { name: 'returns', type: 'array', required: false, default: [], description: 'Return values' }
  ],
  validation: [
    { rule: 'camelCase', pattern: '^use[A-Z][a-zA-Z0-9]*$', message: 'Hook name must start with "use" and be camelCase' }
  ],
  metadata: {
    author: 'TaskFlow AI',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['react', 'typescript', 'hook'],
    category: 'component',
    complexity: 'medium'
  }
};
