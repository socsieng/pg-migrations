import * as chai from 'chai';
import { Client as DbClient } from 'pg-parameters';
import ChangesetParser from '../changeset-parser';
import Repo from './changelog-repository';

const expect = chai.expect;
let dbClient: DbClient;
let repo: Repo;

describe('ChangelogRepository', async () => {
  beforeEach(async () => {
    dbClient = new DbClient({
      host: 'localhost',
      user: 'postgres',
      password: 'Password01',
      database: 'postgres',
      port: 5434,
    });
    repo = new Repo(dbClient);
  });

  afterEach(async () => {
    dbClient = null;
    repo = null;
  });

  describe('lock', async () => {
    it('should acquire and release lock', async () => {
      const result = await repo.aquireLock();
      expect(result).to.equal(true);

      await repo.releaseLock();
    });

    it('should not acquire lock that hasn\'t been released', async () => {
      let result = await repo.aquireLock();
      expect(result).to.equal(true);

      result = await repo.aquireLock();
      expect(result).to.equal(false);

      await repo.releaseLock();
    });
  });

  describe('changeset', async () => {
    beforeEach(async () => {
      await repo.aquireLock();
    });

    afterEach(async () => {
      await repo.releaseLock();
    });

    it('should create changeset', async () => {
      const [ changeset ] = await ChangesetParser.parseFileContent(`file_${new Date().valueOf()}`, `--migration
--changeset name
create table my_table(val text);
      `);

      await repo.insertChangeset(changeset);
      const dbChangeset = await repo.getChangeset(changeset.file, changeset.name);

      expect(dbChangeset).to.be.ok;
      expect(dbChangeset.hash).to.equal('5c2371b09ea6c42f8fd00e9f298ad4daa5e0e24f');
    });
  });
});
