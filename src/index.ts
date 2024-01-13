import fs from 'node:fs';
import { git } from './git.js';
import { parseLocalDocs, type DocumentationDatabase } from './parse.js';

/**
 * @param workingDirectory The directory to use when cloning the GameMaker Manual repository. Leave as undefined to use the default os temporary directory.
 */
export async function parseDocs(workingDirectory: string): Promise<
  { success: false; reason: string } |
  { success: true; docs: DocumentationDatabase }
> {
  if (!fs.existsSync(workingDirectory)) return { success: false, reason: 'Working directory does not exist.' };

  const { success, manualDirectory } = await git(workingDirectory);
  if (!success) return { success: false, reason: 'Failed to clone repository.' };

  const docs = parseLocalDocs(manualDirectory);

  return { success: true, docs };
}