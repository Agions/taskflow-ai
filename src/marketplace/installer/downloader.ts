/**
 * 包下载器
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import tar from 'tar';
import { ToolPackage } from '../types';

export class PackageDownloader {
  async download(pkg: ToolPackage, targetDir: string): Promise<void> {
    const tempDir = path.join(targetDir, '.download');
    await fs.ensureDir(tempDir);

    try {
      const dist = (pkg as any).dist;
      if (dist?.tarball) {
        await this.downloadFromTarball(dist.tarball, tempDir);
      } else if (pkg.repository) {
        await this.downloadFromGit(pkg.repository, tempDir);
      } else {
        throw new Error('No download source available');
      }

      const extractedDir = await this.findExtractedDir(tempDir);
      if (extractedDir) {
        const files = await fs.readdir(extractedDir);
        for (const file of files) {
          await fs.move(path.join(extractedDir, file), path.join(targetDir, file), { overwrite: true });
        }
      }
    } finally {
      await fs.remove(tempDir);
    }
  }

  private async downloadFromTarball(url: string, targetDir: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'stream', timeout: 60000 });
    const tarballPath = path.join(targetDir, 'package.tgz');

    const writer = fs.createWriteStream(tarballPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    await tar.extract({ file: tarballPath, cwd: targetDir });
    await fs.remove(tarballPath);
  }

  private async downloadFromGit(repo: string, targetDir: string): Promise<void> {
    const { execSync } = await import('child_process');
    execSync(`git clone --depth 1 ${repo} ${targetDir}`, { stdio: 'ignore' });
  }

  private async findExtractedDir(tempDir: string): Promise<string | null> {
    const entries = await fs.readdir(tempDir);
    const dir = entries.find(e => e === 'package');
    return dir ? path.join(tempDir, dir) : tempDir;
  }
}
