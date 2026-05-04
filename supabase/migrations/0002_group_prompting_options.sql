alter table groups
  add column raunchy_level int,
  add column num_questions int not null default 1,
  add column custom_instructions text,
  add column allow_free_response boolean not null default false;

alter table responses
  add column free_response text;
