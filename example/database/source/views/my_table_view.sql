--migration
--changeset type:change
create or replace view my_table_view as
  select * from my_table;
end;
