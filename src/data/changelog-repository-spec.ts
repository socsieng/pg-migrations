import * as chai from 'chai';
import { Client as DbClient } from 'pg-parameters';
import Repo from './changelog-repository';

const expect = chai.expect;
let dbClient: DbClient;
let repo: Repo;

describe('ChangelogRepository', async() => {
  beforeEach(async() => {
    dbClient = new DbClient({
      host: 'localhost',
      user: 'postgres',
      password: 'Password01',
      database: 'postgres',
      port: 5434,
    });
    repo = new Repo(dbClient);
  });

  afterEach(async() => {
    dbClient = null;
    repo = null;
  });

  it('should acquire and release lock', async() => {
    const result = await repo.aquireLock();
    expect(result).to.equal(true);

    await repo.releaseLock();
  });

  it('should not acquire lock that hasn\'t been released', async() => {
    let result = await repo.aquireLock();
    expect(result).to.equal(true);

    result = await repo.aquireLock();
    expect(result).to.equal(false);

    await repo.releaseLock();
  });
});
