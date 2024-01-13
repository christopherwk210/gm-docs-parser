# gm-docs-parser

Parses the [GameMaker Manual](https://github.com/YoYoGames/GameMaker-Manual) and turns the data into a usable JSON file containing every GML function.

## Programmatic usage

Only ESM is supported.

```Typescript
import { parseDocs } from 'gh-docs-parser';

// Path to an existing folder where the GameMaker Manual will be cloned into
const workingDirectory = 'path/to/folder';

const result = await parseDocs(workingDirectory);

if (result.success) {
  // Record of GML functions
  console.log(result.docs);
} else {
  // Display failure reason
  console.error(result.reason);
}
```