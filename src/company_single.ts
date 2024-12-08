import { cache, cacheLmdb } from './conf';
import { parse } from 'node-html-parser';

async function getCompanySingle(slug: string) {
  const cacheKey = `single_v1_${slug}`;
  if (cache.has(cacheKey)) {
    await cacheLmdb.put(cacheKey, cache.get(cacheKey));
    return cache.get(cacheKey);
  }

  const result = await fetch(`https://www.marketscreener.com${slug}company-governance`);

  const text = await result.text();
  cache.put(cacheKey, text);
  await cacheLmdb.put(cacheKey, text);

  return text;
}

// todo get other things as well
export async function processCompanySingle(slug: string) {
  const html = parse(await getCompanySingle(slug));

  const ticker = html.querySelectorAll('.badge-container')[0].childNodes[2].textContent.trim();
  const exchange = html.querySelectorAll('.js_modal_button')[3].textContent.trim();

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

