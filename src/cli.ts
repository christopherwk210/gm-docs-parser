#! /usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import { parseDocs } from './index.js';

const args = util.parseArgs({
  options: {
    clean: {
      type: 'boolean',
      alias: 'c',
      default: false
    },
    ugly: {
      type: 'boolean',
      alias: 'u',
      default: false
    }
  },
  strict: false
});

if (fs.existsSync('docs.json')) {
  console.log('Error: docs.json already exists in current directory.');
  process.exit(1);
}

const workingDirectory = path.join(os.tmpdir(), 'gm-docs-parser');
if (!fs.existsSync(workingDirectory)) fs.mkdirSync(workingDirectory);

(async () => {
  const result = await parseDocs(workingDirectory);
  if (result.success) {
    fs.writeFileSync('docs.json', args.values.ugly ? JSON.stringify(result.docs) : JSON.stringify(result.docs, null, 2));
    console.log('Success, docs.json written to current directory.');
  } else {
    console.error('Failed to parse docs.');
    console.error(result.reason ?? 'Unknown reason.');
  }
  
  if (args.values.clean) {
    fs.rmSync(workingDirectory, { recursive: true, force: true });
  }
})();