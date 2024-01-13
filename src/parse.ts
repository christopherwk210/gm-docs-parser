import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as cheerio from 'cheerio';

interface DocumentationEntry {
  name: string;
  pages: {
    filePath: string;
    url: string;
    blurb: string;
    syntax: string;
    args: {
      argument: string;
      description: string;
    }[];
  }[];
}

export type DocumentationDatabase = Record<string, DocumentationEntry>;

const documentationDatabase: DocumentationDatabase = {};

export function parseLocalDocs(manualDirectory: string) {
  const gmlTokens = readGmlTokens(manualDirectory);
  scanHtml(manualDirectory, (htmlContents, filePath) => handleHtmlPage(htmlContents, filePath, gmlTokens));
  return documentationDatabase;
}

function handleHtmlPage(htmlContents: string, filePath: string, gmlTokens: ReturnType<typeof readGmlTokens>) {
  const $ = cheerio.load(htmlContents);

  $('body').contents().map((_, el) => {
    if (el.type === 'comment') {
      let keywords: string[] = [];

      try {
        keywords = el.data.split('KEYWORDS')[1].split('TAGS')[0].split('\n').map(line => line.trim());
      } catch (e) {}

      for (const keyword of keywords) {
        if (gmlTokens.keywords.built_in.includes(keyword)) {
          // Functions
          const { args, blurb, syntax } = scrapePage($, keyword);
          const url = `https://manual.gamemaker.io/monthly/en/${filePath.split('contents')[1].replace(/\\/g, '/')}`;

          if (!documentationDatabase[keyword]) documentationDatabase[keyword] = { name: keyword, pages: [] };
          documentationDatabase[keyword].pages.push({ filePath, url, blurb, syntax, args });
        } else if (gmlTokens.keywords.keyword.includes(keyword)) {
          // Language keywords (if, else, etc.)
        } else if (gmlTokens.keywords.literal.includes(keyword)) {
          // Constants (true, false, etc.)
        } else if (gmlTokens.keywords.symbol.includes(keyword)) {
          // Symbols (x, y, argument0, id, etc.)
        }
      }
    }
  });
}

function scrapePage($: cheerio.CheerioAPI, functionName: string) {
  let blurb = '';
  let syntax = '';
  let args: DocumentationEntry['pages'][number]['args'] = [];

  const p = $('p').first();
  blurb = p.text().replace('\n', ' ');

  const h4 = $('h4').toArray().find(element => $(element).text().toLowerCase().includes('syntax:'));
  if (h4 && h4.next && h4.next.next) {
    const foundSyntax = $(h4.next.next).text().replace(';', '').trim();
    if (foundSyntax.includes(functionName)) {
      syntax = foundSyntax;
    }
  }

  const argumentTable = $('table').toArray().find(element => {
    const table = $(element).html();
    if (table) return table.includes('<th>Argument</th>');
    return false;
  });

  if (argumentTable) {
    const tbody = $(argumentTable).children('tbody').first();
    tbody.children().each((_, trow) => {
      let argument = '';
      let description = '';
      let validRow = false;
      $(trow).children().each((cellIndex, cell) => {
        const cellText = $(cell).text();
        if (cellIndex === 0 && cellText !== 'Argument') {
          validRow = true;
          argument = cellText;
        } else if (cellIndex === 2 && validRow) {
          description = cellText.replace('OPTIONAL', '`OPTIONAL`');
        }
      });

      if (argument) args.push({ argument, description });
    });
  }

  return { blurb, syntax, args };
}

function readGmlTokens(manualDirectory: string): {
  keywords: {
    keyword: string[];
    built_in: string[];
    literal: string[];
    symbol: string[];
  };
} {
  const gmlJsPath = path.join(manualDirectory, 'Manual/contents/assets/scripts/gml.js');

  const sandbox = { gml: {} as any };
  vm.runInNewContext(fs.readFileSync(gmlJsPath, 'utf8').replace('export default', 'gml ='), sandbox);

  return sandbox.gml({});
}

function scanHtml(manualDirectory: string, execute: (htmlContents: string, filePath: string) => void) {
  const gmlReferenceDirectory = path.join(manualDirectory, 'Manual/contents/GameMaker_Language/GML_Reference');

  const scanDirectory = (directory: string) => {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (stat.isFile() && filePath.endsWith('.htm')) {
        const htmlContents = fs.readFileSync(filePath, 'utf8');
        execute(htmlContents, filePath);
      }
    }
  };

  scanDirectory(gmlReferenceDirectory);
}