--migration
--changeset type:change
create or replace function square(val integer) returns integer as $$
begin
  return val * val;
end;
$$
language plpgsql;
