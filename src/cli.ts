#!/usr/bin/env node

import * as program from 'commander';
import * as ConnectionString from 'pg-connection-string';
import * as read from 'read';
import Repository from './data/changelog-repository';
import Migration from './migration';

// tslint:disable-next-line:no-var-requires
const info = require('../package.json');

function list (str: string): string[] {
  if (typeof str === 'string') {
    return str.split(/\s*,\s*/g);
  }
  return [];
}

program
  .version(info.version)
  .description('Database migration tool for postgres databases')
  .arguments('<schema>')
  .usage('<schema file|directory> [options]')
  .option('-c, --connection <connection string>', 'database connection string (required)', ConnectionString.parse)
  .option('-u, --user <user>', 'database user name')
  .option('-p, --password <password>', 'database password')
  .option('-P, --prompt-password', 'prompt for database password')
  .option('-s, --generate-script', 'output sql script instead of executing the migration')
  .option('--context [contexts]', 'changeset contexts to execute')
  ;

program.parse(process.argv);

const processCommand = async function processCommand (schema, ...args) {
  if (!schema) {
    console.error('Error: schema file or directory is required');
    this.help();
    process.exit(1);
  }

  if (!this.connection) {
    console.error('Error: connection string is required');
    this.help();
    process.exit(1);
  }

  if (this.user) {
    this.connection.user = this.user;
  }

  if (this.password) {
    this.connection.password = this.password;
  }

  if (this.context) {
    this.context = list(this.context);
  }

  if (this.promptPassword) {
    const prompt = new Promise((resolve, reject) => {
      read({ prompt: 'Password: ', silent: true }, (err, password) => {
        if (err) {
          reject(err);
        }
        resolve(password);
      });
    });
    this.connection.password = await prompt;
  }

  const repo = new Repository(this.connection);
  const migration = await Migration.load(schema);

  if (this.generateScript) {
    console.log(await migration.generateScript(repo, { context: this.context }));
  } else {
    const changes = await migration.execute(repo, { context: this.context });
    console.log(`${changes.length} ${changes.length === 1 ? 'change' : 'changes'} applied`);
  }
}.bind(program);

processCommand(...program.args).then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
