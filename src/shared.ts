import * as path from 'path';
import * as os from 'os';

export const gmManualRepo = 'git@github.com:YoYoGames/GameMaker-Manual.git manual';
export const workingDirectory = path.join(os.tmpdir(), 'gm-docs-parser');
export const manualDirectory = path.join(workingDirectory, 'manual');