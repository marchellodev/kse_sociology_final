import { cache } from './conf';
import { parse } from 'node-html-parser';

async function getCompanySingle(slug: string) {
  const cacheKey = `single_v1_${slug}`;
  if (cache.doesExist(cacheKey)) {
    return cache.get(cacheKey) as string;
  }

  const result = await fetch(`https://www.marketscreener.com${slug}company-governance`);

  const text = await result.text();
  await cache.put(cacheKey, text);

  return text;
}

// todo get other things as well
export async function processCompanySingle(slug: string) {
  const html = parse(await getCompanySingle(slug));

  const ticker = html.querySelectorAll('.badge-container')[0].childNodes[2].textContent.trim();
  const exchange = html.querySelectorAll('.js_modal_button')[3].textContent.trim();
  const currency = html.querySelectorAll('.table--small')[0].querySelector('.txt-s1')?.textContent.trim();

  const general = html
    .getElementById('drawPeopleGenderDistributionChart')
    ?.parentNode.parentNode.querySelector('table')
    ?.querySelectorAll('tr')
    .map((el) => ({
      gender: el.querySelector('th')?.textContent.trim(),
      count: el.querySelector('td')?.textContent.trim()
    }));

  const executives = html
    .getElementById('drawPeopleGenderDistributionChartExecutives')
    ?.parentNode.parentNode.querySelector('table')
    ?.querySelectorAll('tr')
    .map((el) => ({
      gender: el.querySelector('th')?.textContent.trim(),
      count: el.querySelector('td')?.textContent.trim()
    }));

  const directors = html
    .getElementById('drawPeopleGenderDistributionChartAdmins')
    ?.parentNode.parentNode.querySelector('table')
    ?.querySelectorAll('tr')
    .map((el) => ({
      gender: el.querySelector('th')?.textContent.trim(),
      count: el.querySelector('td')?.textContent.trim()
    }));

  return {
    ticker,
    exchange,
    currency,

    genders: {
      general: {
        //@ts-ignore
        male: parseInt(general?.find((el) => el.gender == 'Male')?.count),
        //@ts-ignore
        female: parseInt(general?.find((el) => el.gender == 'Female')?.count)
      },
      executives: {
        //@ts-ignore
        male: parseInt(executives?.find((el) => el.gender == 'Male')?.count),
        //@ts-ignore
        female: parseInt(executives?.find((el) => el.gender == 'Female')?.count)
      },
      directors: {
        //@ts-ignore
        male: parseInt(directors?.find((el) => el.gender == 'Male')?.count),
        //@ts-ignore
        female: parseInt(directors?.find((el) => el.gender == 'Female')?.count)
      }
    }
  };
}

export async function getStockPrice(symbol: number) {
  const from = Math.floor(new Date(1990, 0, 1).getTime() / 1000); // jan 1st
  const to = Math.floor(new Date(2024, 11, 1).getTime() / 1000); // nov 1st

  const params = new URLSearchParams({
    from: from.toString(),
    to: to.toString(),
    symbol: symbol.toString(),
    resolution: 'D',
    requestType: 'GET',
    src: 'itfp'
  });

  const cacheKey = 'stock_v1_' + params.toString();

  let json: any;
  const cached = cache.get(cacheKey);
  if (cached && 'c' in cached) {
    json = cache.get(cacheKey);
  } else {
    const raw = await fetch(`https://www.zonebourse.com/mods_a/charts/TV/function/history?${params.toString()}`);
    json = await raw.json();
    // console.log('got raw');
    await cache.put(cacheKey, json);
  }

  if (!('c' in json)) {
    console.log('no data', symbol);
    return [{ close: 0, time: 0 }]; // for lmdb not to break
  }

  const res = (json['c'] as number[]).map((el, i) => ({
    close: el,
    time: json['t'][i] as number
  }));

  return res;
}
