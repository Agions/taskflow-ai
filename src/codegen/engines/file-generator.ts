/**
 * 文件生成器
 */

import * as path from 'path';
import { ComponentSpec, GeneratedFile } from '../types';

export class FileGenerator {
  generateMainFile(spec: ComponentSpec, content: string): GeneratedFile {
    const extension = spec.language === 'typescript' ? 'tsx' : 'jsx';
    return {
      path: path.join('components', spec.name, `${spec.name}.${extension}`),
      content,
      type: 'component'
    };
  }

  generateStyleFile(spec: ComponentSpec): GeneratedFile {
    const extension = spec.cssFramework === 'styled-components' ? 'ts' : 'css';
    const content = spec.cssFramework === 'styled-components'
      ? this.generateStyledComponents(spec)
      : this.generateCSS(spec);

    return {
      path: path.join('components', spec.name, `${spec.name}.styles.${extension}`),
      content,
      type: 'style'
    };
  }

  generateTestFile(spec: ComponentSpec): GeneratedFile {
    const extension = spec.language === 'typescript' ? 'test.tsx' : 'test.jsx';
    return {
      path: path.join('components', spec.name, `${spec.name}.${extension}`),
      content: this.generateTestContent(spec),
      type: 'test'
    };
  }

  generateIndexFile(spec: ComponentSpec): GeneratedFile {
    const extension = spec.language === 'typescript' ? 'ts' : 'js';
    return {
      path: path.join('components', spec.name, `index.${extension}`),
      content: `export { ${spec.name} } from './${spec.name}';\nexport type { ${spec.name}Props } from './${spec.name}';\n`,
      type: 'index'
    };
  }

  private generateStyledComponents(spec: ComponentSpec): string {
    return `import styled from 'styled-components';\n\nexport const Container = styled.div\`\n  /* ${spec.name} styles */\n\`;\n`;
  }

  private generateCSS(spec: ComponentSpec): string {
    return `.${spec.name.toLowerCase()} {\n  /* ${spec.name} styles */\n}\n`;
  }

  private generateTestContent(spec: ComponentSpec): string {
    return `import { render, screen } from '@testing-library/react';\nimport { ${spec.name} } from './${spec.name}';\n\ndescribe('${spec.name}', () => {\n  it('renders correctly', () => {\n    render(<${spec.name} />);\n    expect(screen.getByTestId('${spec.name.toLowerCase()}')).toBeInTheDocument();\n  });\n});\n`;
  }
}
