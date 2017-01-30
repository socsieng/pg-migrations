import * as fs from 'fs-promise';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import * as path from 'path';
import Changeset from './changeset';
import ChangesetParser from './changeset-parser';
import ChangelogRepository from './data/changelog-repository';
import alphaNumericSorter from './util/alpha-numeric-sorter';

function getChangesets (config: any, basePath: string): Changeset[] {
  const files: string[] = config.files
    .map((fileExpression) => glob.sync(path.join(basePath, fileExpression)).sort(alphaNumericSorter))
    .reduce((arr: string[], globFiles: string[]) => {
      globFiles.forEach((file) => {
        const items = arr.slice();
        if (items.indexOf(file) === -1) {
          arr.push(file);
        }
      });
      return arr;
    }, []);

  const changesets = files
    .map((file) => ChangesetParser.parseFile(file, basePath))
    .reduce((arr, cs) => arr.concat(cs), []);

  return changesets;
}

function listContainsAny (list1: any[], list2: any[]): boolean {
  for (const item of list1) {
    if (list2.indexOf(item) !== -1) {
      return true;
    }
  }
  return false;
}

export interface IOptions {
  context?: string[];
}

export default class Migration {
  public changesets: Changeset[];

  constructor () {
    this.changesets = [];
  }

  public async execute (repository: ChangelogRepository, options?: IOptions) {
    const hasLock = await repository.aquireLock();

    if (!hasLock) {
      throw new Error('Could not aquire database lock');
    }

    try {
      const changesets = await this.filterChangesets(repository, options);

      for (const changeset of changesets) {
        await repository.executeChangeset(changeset);
      }

      return changesets;
    } finally {
      await repository.releaseLock();
    }
  }

  public async generateScript (repository: ChangelogRepository, options?: IOptions): Promise<string> {
    const changesets = await this.filterChangesets(repository, options);

    return changesets.map((c) => `-- ${c.formatName()}\n${c.script}`).join('\n\n');
  }

  public static async load (filename: string) {
    const migration = new Migration();
    const stat = await fs.stat(filename);
    let basePath: string = null;
    const config: any = {
      files: ['**/*.sql'],
      sort: 'alpha-numeric',
    };

    if (stat.isFile()) {
      const contents = await fs.readFile(filename, 'utf8');
      if (/\.ya?ml$/.test(filename)) {
        Object.assign(config, yaml.safeLoad(contents));
      } else {
        Object.assign(config, JSON.parse(contents));
      }
      basePath = path.dirname(filename);
    } else {
      basePath = filename;
    }

    migration.changesets = getChangesets(config, basePath);

    return migration;
  }

  private async filterChangesets (repository: ChangelogRepository, options: IOptions) {
    const validation = await Promise.all(
      this.changesets.map(async (changeset) => ({
        changeset,
        validation: await repository.validateChangeset(changeset),
      })),
    );
    const { context = null } = options || {};

    const messages = validation
      .filter((v) => v.validation.messages.length)
      .map((v) => `${v.changeset.formatName()}\n${v.validation.messages.map((m) => `  ${m}`).join('\n')}`);

    const statements: string[] = [];

    if (messages.length) {
      throw new Error(messages.join('\n'));
    }

    return validation.filter((v) => v.validation.shouldExecute)
      .filter((v) => !context
        || !v.changeset.context
        || listContainsAny(v.changeset.context.split(/\s*,\s*/), context))
      .map((v) => v.changeset);
  }
}
