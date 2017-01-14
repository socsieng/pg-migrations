import { Client } from 'pg-parameters';

export default class ChangelogRepository {
  private client: Client;
  private lockId: number;

  constructor(client: Client) {
    this.client = client;
    this.lockId = 0;
  }

  public async aquireLock(): Promise<boolean> {
    await this.createMigrationTables();

    return await this.client.withTransaction(async() => {
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

  public async releaseLock(): Promise<void> {
    await this.client.execute(`
      update migration_lock
      set
        is_locked = false
      where id = :id;
    `, { id: this.lockId });
  }

  private async createMigrationTables() {
    await this.createLockTable();
    await this.createChangesetTable();
    await this.createChangelogTable();
  }

  private async createLockTable() {
    await this.client.execute(`
      create table if not exists migration_lock (
        id serial primary key,
        is_locked boolean not null,
        migration_tool_version text not null,
        created_at timestamp not null default current_timestamp
      );
    `);
  }

  private async createChangesetTable() {
    await this.client.execute(`
      create table if not exists migration_changesets (
        id serial primary key,
        file text not null,
        name text not null,
        execution_type text not null check (execution_type in ('once', 'always', 'change')),
        created_at timestamp not null default current_timestamp,
        unique (file, name)
      );
    `);
  }

  private async createChangelogTable() {
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
