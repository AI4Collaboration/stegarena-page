import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const files = [
  'index.html', 'style.css', 'app.js', 'theme.js', '.nojekyll',
  'stegarena-report.md', 'results.json', 'assets/favicon.svg',
  'assets/barlow-400.woff2', 'assets/barlow-500.woff2',
  'assets/barlow-600.woff2', 'assets/barlow-700.woff2',
  'assets/ibm-plex-mono-400.woff2', 'assets/ibm-plex-mono-500.woff2',
  'assets/Barlow-OFL.txt', 'assets/IBM-Plex-Mono-OFL.txt'
];

await mkdir(join(output, 'assets'), { recursive: true });
for (const file of files) await cp(join(root, file), join(output, file));
console.log(`已生成静态页面，共 ${files.length} 个文件：${output}`);
