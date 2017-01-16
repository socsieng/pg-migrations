// tslint:disable-next-line:no-reference
/// <reference path="./chai-as-promised.d.ts" />

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as path from 'path';
import ChangesetParser from './changeset-parser';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('ChangesetParser', async() => {
  describe('Content', async() => {
    it('should throw when content does not start with --migration', async() => {
      expect(ChangesetParser.parseFileContent('file', '')).to.be.rejected;
    });

    it('should return empty list of changesets when content only contains --migration', async() => {
      const result = await ChangesetParser.parseFileContent('file', '--migration');
      expect(result).to.be.empty;
    });

    it('should return single changeset', async() => {
      const result = await ChangesetParser.parseFileContent('file', `--migration
--changeset name
create table my_table(val text);
      `);

      expect(result).to.be.have.lengthOf(1);
      expect(result[0].file).to.equal('file');
      expect(result[0].name).to.equal('name');
      expect(result[0].context).to.equal(null);
      expect(result[0].executionType).to.equal(null);
      expect(result[0].script).to.equal('create table my_table(val text);');
      expect(result[0].hash).to.equal('5c2371b09ea6c42f8fd00e9f298ad4daa5e0e24f');
    });

    it('should return single changeset with space in the name', async() => {
      const result = await ChangesetParser.parseFileContent('file', `--migration
--changeset changeset name
create table my_table(val text);
      `);

      expect(result).to.be.have.lengthOf(1);
      expect(result[0].file).to.equal('file');
      expect(result[0].name).to.equal('changeset name');
      expect(result[0].context).to.equal(null);
      expect(result[0].executionType).to.equal(null);
      expect(result[0].script).to.equal('create table my_table(val text);');
      expect(result[0].hash).to.equal('5c2371b09ea6c42f8fd00e9f298ad4daa5e0e24f');
    });

    it('should return single changeset with type and context', async() => {
      const result = await ChangesetParser.parseFileContent('file', `--migration
--changeset changeset name type:once context:test
create table my_table(val text);
      `);

      expect(result).to.be.have.lengthOf(1);
      expect(result[0].file).to.equal('file');
      expect(result[0].name).to.equal('changeset name');
      expect(result[0].context).to.equal('test');
      expect(result[0].executionType).to.equal('once');
      expect(result[0].script).to.equal('create table my_table(val text);');
      expect(result[0].hash).to.equal('5c2371b09ea6c42f8fd00e9f298ad4daa5e0e24f');
    });

    it('should return multiple changesets', async() => {
      const result = await ChangesetParser.parseFileContent('file', `--migration
--changeset changeset:one type:once context:test
create table my_table(val text);

--changeset changeset:two context:dev type:always
create table my_other_table1(val text);
create table my_other_table2(val text);
      `);

      expect(result).to.be.have.lengthOf(2);

      expect(result[0].file).to.equal('file');
      expect(result[0].name).to.equal('changeset:one');
      expect(result[0].context).to.equal('test');
      expect(result[0].executionType).to.equal('once');
      expect(result[0].script).to.equal('create table my_table(val text);');
      expect(result[0].hash).to.equal('5c2371b09ea6c42f8fd00e9f298ad4daa5e0e24f');

      expect(result[1].file).to.equal('file');
      expect(result[1].name).to.equal('changeset:two');
      expect(result[1].context).to.equal('dev');
      expect(result[1].executionType).to.equal('always');
      expect(result[1].script).to.equal('create table my_other_table1(val text);\n' +
        'create table my_other_table2(val text);');
      expect(result[1].hash).to.equal('c41ca1d5a59f1226a062aeabdbd24559746cb974');
    });

    it('should throw with empty changeset', async() => {
      expect(ChangesetParser.parseFileContent('file', `--migration
--changeset empty
      `)).to.be.rejected;
    });

    it('should throw with duplicate changeset name', async() => {
      const promise = ChangesetParser.parseFileContent('file', `--migration
--changeset name
create table my_table(val text);
--changeset name
create table my_table(val text);
      `);

      expect(promise).to.be.rejected;
    });
  });

  describe('File', async() => {
    const basePath = path.resolve(__dirname, '../example/database');

    it('should should return absolute file path when no base path is provided', async() => {
      const result = await ChangesetParser.parseFile(
        `${path.resolve(basePath, 'migrations/v1.0/tables/20170115T210000-my_table.sql')}`,
      );

      expect(result).to.be.have.lengthOf(1);
      expect(result[0].file).to.match(/^\//);
    });

    it('should should return relative file path', async() => {
      const result = await ChangesetParser.parseFile(
        `${path.resolve(basePath, 'migrations/v1.0/tables/20170115T210000-my_table.sql')}`,
        basePath,
      );

      expect(result).to.be.have.lengthOf(1);
      expect(result[0].file).to.equal('migrations/v1.0/tables/20170115T210000-my_table.sql');
    });
  });
});
