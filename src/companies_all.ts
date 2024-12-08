import PQueue from 'p-queue';
import { parse } from 'node-html-parser';
import { cache } from './conf';
import type { CompanyBrief } from './types';

async function getAllCompaniesAPI(page: number) {
  const cacheKey = `all_v1_${page}`;

  if (cache.doesExist(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await fetch('https://www.marketscreener.com/async/stock-screener/more', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: `configuration=WjlzZEtYNDdrU0JZMFVTOG81ZUxpL3Z1Y1RCOEhNSkhvSVl0VHZXelBSekRTcm4xL1BQdmEwVmdJOWx4MVFHdDd5TEo0YnF1NTkyQzMrSFMvVExyS0taVDBZSVF2QWNsY0xwUWdNUEhlYmJpbjZLODFFSHlqbUpUQktmblRLVlk&parameters=bm1xcDU3ODIzTnd2c3JBOWcvbXFjdHlKWnBNdURpZU9NQ0pOZGJXQXRYYkF2WWNLNlVKNXRhalJNUXArblhRR0ZQa2FVRGhUUkhnSDVrN0hqZ2JiZHZLRk0rSHNsenBpVmp0OEJTSkQyc3F6bldhSElEcEJWdndycnVkVzB5czBUNVJ3dHlUYzVwRXhlMEk2dTN6YmpjMDB4NDhvL3VqMUc1dE81QzRTVVBxT2ZTRWxtSi9PZ1h1N0JrZkp4K0RxYkZPWGJockJVNVJ3cmR1RGRNb0I2MFJBZFZJaENkbkxrOVVJNFJqdE0rTzJLa1VsbUJkOTgyLzlLUVhBQmVyM3VOay9iMkdLckxHa2FuUUs4di95VHc9PQ&page=${page}`
  });

  const json = await result.json();
  await cache.put(cacheKey, json);

  if (json['error'] !== false) {
    throw new Error(`err in ${page}`, json);
  }

  return json;
}

async function processPage(data: string) {
  const parsed = parse(data);

  const trs = parsed.querySelectorAll('tr');

  const result: CompanyBrief[] = [];
  for (const tr of trs) {
    const name = tr.childNodes[1].textContent.trim();
    const url = tr.querySelectorAll('a')[1].attributes['href'];
    const country = tr
      .querySelector('i')!
      .classNames.split(' ')
      .find((el) => el.includes('__'))!
      .replace('flag__', '');

    const sector = tr.childNodes.pop()!.textContent.trim();

    result.push({ name, url, country, sector });
  }

  return result;
}

export async function getAllCompanies(pages: number = 2347) {
  const queue = new PQueue({ concurrency: 1 });

  let result: CompanyBrief[] = [];
  for (let i = 1; i <= pages; i++) {
    queue.add(async () => {
      const raw = await getAllCompaniesAPI(i);
      const processed = await processPage(raw['data']);
      result = [...result, ...processed];
    });
  }

  await queue.onIdle();

  return result;
}
