import { Client } from 'pg-parameters';
import Changeset from '../changeset';

export interface IChangesetValidation {
  shouldExecute: boolean;
  messages: string[];
}

export default class ChangelogRepository {
  private client: Client;
  private lockId: number;
  private tablesPromise: Promise<void>;

  constructor (client: Client) {
    this.client = client;
    this.lockId = 0;
  }

  public async aquireLock (): Promise<boolean> {
    await this.ensureMigrationTables();

    return await this.client.withTransaction(async () => {
      const { locks } = await this.client.querySingle(`
        select
          count(*)::integer as locks
        from migration_lock
        where is_locked = true;
      `);

      if (locks === 0) {
        const { id: lockId } = await this.client.insert('migration_lock', {
          is_locked: true,
          migration_tool_version: '0.0.0',
        }, 'id');

        this.lockId = lockId;

        return true;
      }
      return false;
    });
  }

  public async releaseLock (): Promise<void> {
    await this.ensureMigrationTables();

    await this.client.execute(`
      update migration_lock
      set
        is_locked = false
      where id = :id;
    `, { id: this.lockId });
  }

  public async validateChangeset (changeset: Changeset): Promise<IChangesetValidation> {
    const dbChangest = await this.getChangeset(changeset.file, changeset.name);
    const validation: IChangesetValidation = {
      shouldExecute: false,
      messages: [],
    };

    if (dbChangest) {
      if (dbChangest.executionType !== changeset.executionType) {
        validation.shouldExecute = false;
        validation.messages
          // tslint:disable-next-line:max-line-length
          .push(`Script execution type has changed, execution type was ${dbChangest.executionType}, is now ${changeset.executionType}`);
      } else if (changeset.executionType === 'once') {
        validation.shouldExecute = false;
        if (dbChangest.hash !== changeset.hash) {
          validation.messages
            .push(`Script content has changed, content hash was ${dbChangest.hash}, is now ${changeset.hash}`);
        }
      } else if (changeset.executionType === 'always') {
        validation.shouldExecute = true;
      } else if (changeset.executionType === 'change') {
        if (dbChangest.hash !== changeset.hash) {
          validation.shouldExecute = true;
        }
      }
    } else {
      validation.shouldExecute = true;
    }

    return validation;
  }

  public async getChangeset (file: string, name: string): Promise<Changeset> {
    await this.ensureMigrationTables();

    return await this.client.querySingle(`
      select
        cs.id,
        cs.file,
        cs.name,
        cs.execution_type "executionType",
        cs.context,
        cl.content_hash hash
      from migration_changesets cs
      left join migration_changelog cl on cs.id = cl.changeset_id
      where cs.file = :file
      and cs.name = :name
      order by cl.executed_at desc
      limit 1;
    `, { file, name });
  }

  public async executeChangeset (changeset: Changeset) {
    await this.ensureMigrationTables();

    try {
      const response = await this.client.execute(changeset.script);
      await this.insertChangeset(changeset);
    } catch (err) {
      const message = `Error executing ${changeset.formatName()}\n` +
        `${err.toString().split(/\n/g).map((e) => `  ${e}`).join('\n')}`;
      throw new Error(message);
    }
  }

  public async insertChangeset (changeset) {
    await this.ensureMigrationTables();

    const result = await this.client.insert('migration_changesets', {
      file: changeset.file,
      name: changeset.name,
      execution_type: changeset.executionType,
      context: changeset.context,
    }, 'id');
    await this.client.insert('migration_changelog', {
      lock_id: this.lockId,
      changeset_id: result.id,
      content_hash: changeset.hash,
    }, 'id');
  }

  private async ensureMigrationTables () {
    if (!this.tablesPromise) {
      this.tablesPromise = (async () => {
        await this.createLockTable();
        await this.createChangesetTable();
        await this.createChangelogTable();
      })();
    }

    await this.tablesPromise;
  }

  private async createLockTable () {
    await this.client.execute(`
      create table if not exists migration_lock (
        id serial primary key,
        is_locked boolean not null,
        migration_tool_version text not null,
        created_at timestamp not null default current_timestamp
      );
    `);
  }

  private async createChangesetTable () {
    await this.client.execute(`
      create table if not exists migration_changesets (
        id serial primary key,
        file text not null,
        name text,
        execution_type text not null default 'once' check (execution_type in ('once', 'always', 'change')),
        context text,
        created_at timestamp not null default current_timestamp,
        unique (file, name)
      );
    `);
  }

  private async createChangelogTable () {
    await this.client.execute(`
      create table if not exists migration_changelog (
        id serial primary key,
        lock_id integer not null references migration_lock,
        changeset_id integer not null references migration_changesets,
        content_hash text not null,
        executed_at timestamp not null default current_timestamp
      );
    `);
  }
}
