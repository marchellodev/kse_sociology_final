import PQueue from 'p-queue';
import { getAllCompanies } from './companies_all';
import { processCompanySingle } from './company_single';
import type { CompanyFull } from './types';
import { tableFromArrays, tableToIPC } from 'apache-arrow';
import { writeFileSync } from 'fs';

const companies = await getAllCompanies();
const data: CompanyFull[] = [];
console.log('got companies')

const queue = new PQueue({ concurrency: 32 });
companies.forEach((el, i) => {
  queue.add(async () => {
    const dataFull = await processCompanySingle(el.url);
    data.push({ ...el, ...dataFull });
    console.log(i)
  });
});
await queue.onIdle();

const columns = {
  name: data.map((row) => row.name),
  ticker: data.map((row) => row.ticker),
  exchange: data.map((row) => row.exchange),
  url: data.map((row) => row.url),
  sector: data.map((row) => row.sector),
  country: data.map((row) => row.country),
  gender_general: data.map((row) => row.genders.general),
  gender_executives: data.map((row) => row.genders.executives),
  gender_directors: data.map((row) => row.genders.directors)
};

const table = tableFromArrays(columns);
writeFileSync('output.arrow', tableToIPC(table));
