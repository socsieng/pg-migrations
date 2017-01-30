# Postgres Migrations

The purpose of this library is to provide `liquibase` *like* migration capabilities as a `node` module and command line interface.

## Installation

```
npm install --global pg-migrations
```

## Why?

`liquibase` provides many ways of managing migrations including `xml`, `json`, `yaml`, and `sql` formats for multiple database engines. However, these options can add to complexity, and unfortunately requires `java` to run.

The purpose of `pg-migrations` is to provide a simpler way (with fewer options) for managing `postgresql` database migrations without requiring `java`.

## How it works

`pg-migrations` works with either a *schema* configuration file (either `yaml`, or `json`), or a directory.

### Schema configuration file

The schema configuration file lists all the files to execute as part of the migration. Files can be defined as `glob` expressions and files matching the `glob` expression are executed in *alpha numeric* order (i.e. `1` < `2` < `10`).

Example schema configuration file (`example/database/schema.yml`):

```yaml
files:
  - '**/*.sql'
```

### Directory

When a directory is used as an input to the migration, it effectively uses the same configuration as provided above (i.e. executes all `sql` files in the directory in *alpha numeric* order).

### Migration file format

A migration file must start with `--migration` on the first line and contains one or many `changeset`s (`sql` statements) preceded by a `--changeset` comment.

### Changeset comment format

A `changeset` comment takes the following format:

```sql
--changeset [changeset name] [type:<once|always|change>] [context:<comma,separated,list>]
```

Where:

* `changeset name` - (optional) name of the changeset, must be unique within the file
* `type` - (optional) execution type of the changeset, must be either execute `once`, `always`, or on `change`
  * defaults to `once`
  * note that a `once` migration script cannot be modified after it has already been executed (will result in an error on subsequent migrations)
* `context` - (optional) list of contexts that the changeset should be executed under
  * default behaviour is to execute under *all* contexts
  * context is specified using the `--context` command line argument, the omission of the `--context` argument implies all contexts will be executed

Example:

```sql
--migration
--changeset create table
create table my_table (
  val text
);

--changeset test data context:test
insert into my_table (val)
values ('test data');
```

## Usage

```
  Usage: pg-migration <schema file|directory> [options]

  Database migration tool for postgres databases

  Options:

    -h, --help                            output usage information
    -V, --version                         output the version number
    -c, --connection <connection string>  database connection string (required)
    -u, --user <user>                     database user name
    -p, --password <password>             database password
    -P, --prompt-password                 prompt for database password
    -s, --generate-script                 output sql script instead of executing the migration
    --context [contexts]                  changeset contexts to execute
```

## Example

```
pg-migration database/schema.yml -c postgres://postgres@localhost/postgres -p password
```
