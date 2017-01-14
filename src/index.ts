import { Client as DbClient } from 'pg-parameters';
import Repo from './data/changelog-repository';

const dbClient = new DbClient({
  host: 'localhost',
  user: 'postgres',
  password: 'Password01',
  database: 'postgres',
});

const repo = new Repo(dbClient);

(async() => {
  const hasLock = await repo.aquireLock();
  console.log(hasLock);
  await repo.releaseLock();
})().then(() => {
  process.exit();
});
