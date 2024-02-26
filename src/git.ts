import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';

const gmManualRepo = 'git@github.com:YoYoGames/GameMaker-Manual.git gm_manual';

export async function git(workingDirectory: string) {
  const manualDirectory = path.join(workingDirectory, 'gm_manual');
  const success = await (fs.existsSync(manualDirectory) ? pullRepo(manualDirectory) : cloneRepo(workingDirectory));

  return { success, manualDirectory };
}

async function cloneRepo(workingDirectory: string): Promise<boolean> {
  return new Promise(resolve => {
    const child = child_process.spawn(
      'git',
      ['clone', gmManualRepo],
      { cwd: workingDirectory, shell: true, stdio: 'inherit' }
    );

    child.on('close', (code) => resolve(code === 0));
  });
}

async function pullRepo(manualDirectory: string): Promise<boolean> {
  return new Promise(resolve => {
    const child = child_process.spawn(
      'git',
      ['pull'],
      { cwd: manualDirectory, shell: true, stdio: 'inherit' }
    );

    child.on('close', (code) => resolve(code === 0));
  });
}