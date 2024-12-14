import PQueue from 'p-queue';
import { getAllCompanies } from './companies_all';
import { getStockPrice, processCompanySingle } from './company_single';
import type { CompanyFull } from './types';
import { tableFromArrays, tableToIPC } from 'apache-arrow';
import { writeFileSync } from 'fs';

const companies = await getAllCompanies();
const data: CompanyFull[] = [];
console.log('got companies');
console.log(companies.length);

const euCountries = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE NO UA'
  .split(' ')
  .map((el) => el.toLowerCase());
console.log('filtered-out companies:', companies.filter((el) => euCountries.includes(el.country)).length);

const queue = new PQueue({ concurrency: 32 });
console.log('processing companies', companies.filter((el) => euCountries.includes(el.country)).length);
companies
  .filter((el) => euCountries.includes(el.country))
  .forEach((el, i) => {
    queue.add(async () => {
      const id = parseInt(el.url.replaceAll('/', '').split('-').pop()!);
      // console.log(el.country);

      const [dataFull, stockPrices] = await Promise.all([processCompanySingle(el.url), getStockPrice(id)]);

      data.push({ symbol: id, ...el, ...dataFull, prices: stockPrices });
      console.log(i);
    });
  });
await queue.onIdle();

console.log('saving');
const tableCompanies = tableFromArrays({
  symbol: data.map((row) => row.symbol),
  name: data.map((row) => row.name),
  ticker: data.map((row) => row.ticker),
  currency: data.map((row) => row.currency),
  exchange: data.map((row) => row.exchange),
  url: data.map((row) => row.url),
  sector: data.map((row) => row.sector),
  country: data.map((row) => row.country),
  gender_general: data.map((row) => row.genders.general),
  gender_executives: data.map((row) => row.genders.executives),
  gender_directors: data.map((row) => row.genders.directors),
  prices: data.map((row) => row.prices)
});
writeFileSync('companies_eu.arrow', tableToIPC(tableCompanies));
