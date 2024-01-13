import * as fs from 'fs';
import * as child_process from 'child_process';

import { gmManualRepo, workingDirectory, manualDirectory } from './shared.js';

export async function git() {
  if (fs.existsSync(manualDirectory)) {
    return await pullRepo();
  } else {
    return await cloneRepo();
  }
}

async function cloneRepo(): Promise<boolean> {
  return new Promise(resolve => {
    const child = child_process.spawn(
      'git',
      ['clone', gmManualRepo],
      { cwd: workingDirectory, shell: true, stdio: 'inherit' }
    );

    child.on('close', (code) => resolve(code === 0));
  });
}

async function pullRepo(): Promise<boolean> {
  return new Promise(resolve => {
    const child = child_process.spawn(
      'git',
      ['pull'],
      { cwd: manualDirectory, shell: true, stdio: 'inherit' }
    );

    child.on('close', (code) => resolve(code === 0));
  });
}

export function deleteManualDirectory() {
  if (fs.existsSync(manualDirectory)) {
    fs.rmdirSync(manualDirectory, { recursive: true });
  }
}