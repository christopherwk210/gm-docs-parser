import { ensureWorkingDirectory } from './working-directory.js';
import { git } from './git.js';

ensureWorkingDirectory();
await git();