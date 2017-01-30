# Postgres Migrations

The purpose of this library is to provide `liquibase` *like* migration capabilities as a `node` module and command line interface.

## Installation

```
npm install --global pg-migrations
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
