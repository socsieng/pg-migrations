// tslint:disable-next-line:no-reference
/// <reference path="./chai-as-promised.d.ts" />

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-promise';
import * as path from 'path';
import { Client as DbClient } from 'pg-parameters';
import ChangesetParser from './changeset-parser';
import Repo from './data/changelog-repository';
import Migration from './migration';

chai.use(chaiAsPromised);
const expect = chai.expect;

const basePath = path.resolve(__dirname, '../example/database');

describe('Migration', async () => {
  describe('load', async () => {
    it('should load migrations from directory', async () => {
      const migration = await Migration.load(basePath);

      expect(migration.changesets.length).to.be.greaterThan(0);

      const tableChangeset = migration.changesets
        .filter((cs) => cs.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')[0];

      expect(tableChangeset.name).to.be.equal('');
      expect(tableChangeset.executionType).to.be.equal('once');
    });

    it('should load migrations from yml file', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);

      expect(migration.changesets.length).to.be.greaterThan(0);

      const tableChangeset = migration.changesets
        .filter((cs) => cs.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')[0];

      expect(tableChangeset.name).to.be.equal('');
      expect(tableChangeset.executionType).to.be.equal('once');
    });

    it('should load migrations from yaml file', async () => {
      const migration = await Migration.load(`${basePath}/schema.yaml`);

      expect(migration.changesets.length).to.be.greaterThan(0);

      const tableChangeset = migration.changesets
        .filter((cs) => cs.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')[0];

      expect(tableChangeset.name).to.be.equal('');
      expect(tableChangeset.executionType).to.be.equal('once');
    });

    it('should load migrations from json file', async () => {
      const migration = await Migration.load(`${basePath}/schema.json`);

      expect(migration.changesets.length).to.be.greaterThan(0);

      const tableChangeset = migration.changesets
        .filter((cs) => cs.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')[0];

      expect(tableChangeset.name).to.be.equal('');
      expect(tableChangeset.executionType).to.be.equal('once');
    });

    it('should load migrations with sequence override', async () => {
      const migration = await Migration.load(`${basePath}/schema_source_first.yml`);

      expect(migration.changesets.length).to.be.greaterThan(0);
      expect(migration.changesets[0].file).to.be.match(/^source/);
    });
  });

  describe('execute and generateScript', async () => {
    const dbClient = new DbClient({
      host: 'localhost',
      user: 'postgres',
      password: 'Password01',
      database: 'postgres',
      port: 5434,
    });
    const repo = new Repo(dbClient);

    it('should generate sql migration script', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      const script = await migration.generateScript(repo);

      expect(script).to.not.be.empty;
    });

    it('should execute a migration', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      await migration.execute(repo);
    });

    it('should not generate sql migration script when no scripts executed', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      const script = await migration.generateScript(repo);

      expect(script).to.be.empty;
    });

    it('should execute same migration again', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      await migration.execute(repo);
    });

    it('should throw when type:once migration has changed', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      migration.changesets
        .filter((c) => c.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')
        .forEach((c) => { c.hash = '123'; });

      await expect(migration.execute(repo)).to.be.rejected;
    });

    it('should throw when type changes between migrations', async () => {
      const migration = await Migration.load(`${basePath}/schema.yml`);
      migration.changesets
        .filter((c) => c.file === 'migrations/v1.0/tables/20170115T210000-my_table.sql')
        .forEach((c) => { c.executionType = 'always'; });

      await expect(migration.execute(repo)).to.be.rejected;
    });
  });
});
