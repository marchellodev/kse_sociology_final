import { BunSqliteKeyValue } from 'bun-sqlite-key-value';
import { open } from 'lmdb';

export const cache = new BunSqliteKeyValue('cache/cachedb.sqlite');

export const cacheLmdb = open({
  path: 'cache_lmdb',
  compression: true,
  cache: true,
  useVersions: false
});
