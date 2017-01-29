--migration
--changeset context:test
insert into my_table (val)
values ('default name');

--changeset second insert context:test
insert into my_table (val)
values ('second insert');

--changeset third insert context:test
insert into my_table (val)
values ('third insert');
insert into my_table (val)
values ('fourth insert');
