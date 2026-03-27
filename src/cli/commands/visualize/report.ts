/**
 * 报告生成器
 */

import path from 'path';
import fs from 'fs-extra';

export async function generateReport(charts: any[], options: any): Promise<string> {
  const outputDir = path.resolve(options.output);
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `taskflow-report-${timestamp}`;

  let reportPath: string;
  let content: string;

  switch (options.format) {
    case 'html':
      reportPath = path.join(outputDir, `${fileName}.html`);
      content = generateHTMLReport(charts, options);
      break;
    case 'svg':
      reportPath = path.join(outputDir, `${fileName}.svg`);
      content = generateSVGReport(charts, options);
      break;
    default:
      reportPath = path.join(outputDir, `${fileName}.html`);
      content = generateHTMLReport(charts, options);
  }

  await fs.writeFile(reportPath, content, 'utf-8');
  return reportPath;
}

function generateHTMLReport(charts: any[], options: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TaskFlow 可视化报告</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 20px; }
    .chart { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>TaskFlow 可视化报告</h1>
  ${charts
    .map(
      chart => `
    <div class="chart">
      <h2>${chart.title}</h2>
      <p>类型: ${chart.type}</p>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
}

function generateSVGReport(charts: any[], options: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <text x="400" y="30" text-anchor="middle" font-size="20">TaskFlow Report</text>
  ${charts
    .map(
      (chart, i) => `
    <text x="50" y="${80 + i * 50}" font-size="16">${chart.title}</text>
  `
    )
    .join('')}
</svg>`;
}
