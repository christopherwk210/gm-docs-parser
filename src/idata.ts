import https from 'node:https';
import vm from 'node:vm';

const idataLocation = 'https://manual.gamemaker.io/monthly/en/whxdata/idata1.new.js';

export type GMFunction = { name: string; url: string; };

export async function getFunctionNames(): Promise<{
  success: false;
  reason: string;
} | {
  success: true;
  functions: GMFunction[];
}> {
  const { idata, success } = await getidata();
  if (!success) return { success: false, reason: 'Failed to fetch idata.' };

  const functions: { name: string; url: string; }[] = [];
  idata.keys.forEach((key: any) => {
    if (
      key.topics.length === 1 &&
      key.name === key.topics[0].name &&
      !(key.name as string).includes(' ') &&
      key.name === key.name.toLowerCase()
    ) {
      functions.push({ name: key.name, url: key.topics[0].url });
    }
  });

  return { success: true, functions };

}

async function getidata() {
  const contents = await new Promise<string | null>(resolve => {
    https.get(idataLocation, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });

  if (contents === null || contents.length === 0) return { success: false };

  const sandbox = { index: {} as any };

  // vm.runInNewContext(jsline, sandbox);
  vm.runInNewContext(contents, {
    window: {
      rh: {
        model: {
          publish: (_key: string, value: any) => {
            sandbox.index = value;
          }
        }
      }
    },
    rh: {
      consts: (key: string) => key
    }
  });

  return { idata: sandbox.index, success: true };
}