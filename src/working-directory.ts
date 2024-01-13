import * as fs from 'fs';
import { workingDirectory } from './shared.js';

export function ensureWorkingDirectory() {
  if (!fs.existsSync(workingDirectory)) {
    fs.mkdirSync(workingDirectory);
  }
}