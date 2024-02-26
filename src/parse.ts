import fs from 'node:fs';
import path from 'node:path';
// import vm from 'node:vm';
import * as cheerio from 'cheerio';
import type { GMFunction } from './idata.js';

interface DocumentationEntry {
  name: string;
  pages: {
    filePath?: string;
    url: string;
    blurb: string;
    syntax: string;
    title: string;
    args: {
      argument: string;
      description: string;
    }[];
  }[];
}

export type DocumentationDatabase = Record<string, DocumentationEntry>;

const documentationDatabase: DocumentationDatabase = {};

export function parseLocalDocs(manualDirectory: string, functionNames: GMFunction[]) {
  scanHtml(manualDirectory, (htmlContents, filePath) => handleHtmlPage(htmlContents, functionNames, filePath));
  return documentationDatabase;
}

function handleHtmlPage(htmlContents: string, functionNames: GMFunction[], filePath: string) {
  let foundFunc: GMFunction | null = null;
  for (const func of functionNames) {
    const lastFilePathSegment = filePath.split(path.sep).pop()!;
    const lastSegment = func.url.split('/').pop()!;

    if (lastFilePathSegment === lastSegment) {
      foundFunc = func;
    }
  }

  if (!foundFunc) return;

  const keyword = foundFunc.name;
  const $ = cheerio.load(htmlContents);
  const { args, blurb, syntax, title } = scrapePage($, keyword);

  if (!documentationDatabase[keyword]) {
    documentationDatabase[keyword] = { name: keyword, pages: [] };
  }

  const url = `https://manual.gamemaker.io/monthly/en${filePath.split('contents')[1].replace(/\\/g, '/')}`;
  documentationDatabase[keyword].pages.push({ url, blurb, syntax, args, title });
  functionNames = functionNames.filter(func => func.name !== keyword);
}

function scrapePage($: cheerio.CheerioAPI, functionName: string) {
  let blurb = '';
  let syntax = '';
  let args: DocumentationEntry['pages'][number]['args'] = [];
  let title = $('title').text();

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

  return { blurb, syntax, args, title };
}

function scanHtml(manualDirectory: string, execute: (htmlContents: string, filePath: string) => void) {
  const gmlReferenceDirectory = path.join(manualDirectory, 'Manual/contents/GameMaker_Language');

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