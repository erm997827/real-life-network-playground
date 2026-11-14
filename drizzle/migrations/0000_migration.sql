create type public.app_role as enum ('admin','developer','member');
create type public.mc_edition as enum ('bedrock','java');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by signed in" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "read own roles or admin" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'username')
  on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text default '',
  edition mc_edition not null default 'bedrock',
  category text not null default 'geral',
  status text not null default 'em_desenvolvimento',
  progress int not null default 0,
  is_public boolean not null default false,
  docs jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  github_repo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "view own or public projects" on public.projects for select to authenticated using (owner_id = auth.uid() or is_public);
create policy "insert own projects" on public.projects for insert to authenticated with check (owner_id = auth.uid());
create policy "update own projects" on public.projects for update to authenticated using (owner_id = auth.uid());
create policy "delete own projects" on public.projects for delete to authenticated using (owner_id = auth.uid());

create or replace function public.owns_project(_project uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.projects where id = _project and owner_id = auth.uid()) $$;
create or replace function public.can_view_project(_project uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.projects where id = _project and (owner_id = auth.uid() or is_public)) $$;

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null,
  content text,
  storage_path text,
  size int not null default 0,
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);
grant select, insert, update, delete on public.project_files to authenticated;
grant all on public.project_files to service_role;
alter table public.project_files enable row level security;
create policy "view files" on public.project_files for select to authenticated using (public.can_view_project(project_id));
create policy "manage files" on public.project_files for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version text not null,
  notes text default '',
  snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.project_versions to authenticated;
grant all on public.project_versions to service_role;
alter table public.project_versions enable row level security;
create policy "view versions" on public.project_versions for select to authenticated using (public.can_view_project(project_id));
create policy "manage versions" on public.project_versions for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  action text not null,
  detail text default '',
  created_at timestamptz not null default now()
);
grant select, insert on public.activity to authenticated;
grant all on public.activity to service_role;
alter table public.activity enable row level security;
create policy "view own activity" on public.activity for select to authenticated using (user_id = auth.uid());
create policy "insert own activity" on public.activity for insert to authenticated with check (user_id = auth.uid());

create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  ok boolean not null,
  report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.test_runs to authenticated;
grant all on public.test_runs to service_role;
alter table public.test_runs enable row level security;
create policy "view tests" on public.test_runs for select to authenticated using (public.can_view_project(project_id));
create policy "manage tests" on public.test_runs for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid,
  category text not null,
  name text not null,
  description text default '',
  edition text not null default 'ambas',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.library_items to authenticated;
grant all on public.library_items to service_role;
alter table public.library_items enable row level security;
create policy "read library" on public.library_items for select to authenticated using (true);
create policy "add library" on public.library_items for insert to authenticated with check (author_id = auth.uid());
create policy "edit own library" on public.library_items for update to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "delete own library" on public.library_items for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

insert into public.library_items (category, name, description) values
('energia','Usina hidrelétrica','Gera energia a partir de água corrente'),
('energia','Usina solar','Painéis que geram energia durante o dia'),
('energia','Usina eólica','Turbinas movidas pelo vento'),
('energia','Gerador','Fonte de energia compacta'),
('energia','Torre de transmissão','Leva energia por longas distâncias'),
('energia','Transformador','Ajusta a tensão da rede'),
('energia','Subestação','Distribui energia para bairros'),
('energia','Bateria','Armazena energia'),
('telecom','Torre de telefonia móvel','Cobertura de sinal celular'),
('telecom','Antena parabólica','Recepção de satélite'),
('telecom','Estação de retransmissão','Amplia o alcance do sinal'),
('telecom','Equipamento de fibra óptica','Transmissão de dados de alta velocidade'),
('servidores','Servidor','Hospeda serviços da rede'),
('servidores','Rack','Organiza servidores'),
('servidores','Switch','Conecta equipamentos na rede local'),
('servidores','Roteador','Distribui Wi-Fi e internet'),
('servidores','Cabo Ethernet','Conexão com fio'),
('estruturas','Data center','Prédio com servidores'),
('estruturas','Hospital','Estrutura de saúde'),
('estruturas','Escola','Estrutura educacional'),
('estruturas','Aeroporto','Transporte aéreo'),
('estruturas','Supermercado','Comércio'),
('banco','Caixa eletrônico','Saques e depósitos com moeda virtual'),
('banco','Máquina de pagamento','Pagamento por aproximação simulado'),
('banco','Sistema tipo Pix','Transferência instantânea entre jogadores'),
('banco','Cartão de débito','Cartão com saldo virtual');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  kind text not null default 'post',
  title text not null,
  body text default '',
  media_url text,
  category text default 'geral',
  edition text default 'ambas',
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "read posts" on public.posts for select to authenticated using (true);
create policy "create posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "edit own posts" on public.posts for update to authenticated using (author_id = auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  primary key (post_id, user_id)
);
grant select, insert, delete on public.post_likes to authenticated;
grant all on public.post_likes to service_role;
alter table public.post_likes enable row level security;
create policy "read likes" on public.post_likes for select to authenticated using (true);
create policy "like" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "read comments" on public.comments for select to authenticated using (true);
create policy "comment" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "delete own comment" on public.comments for delete to authenticated using (author_id = auth.uid());

create table public.follows (
  follower_id uuid not null,
  following_id uuid not null,
  primary key (follower_id, following_id)
);
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "read follows" on public.follows for select to authenticated using (true);
create policy "follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

create table public.app_user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connector_id text not null,
  connection_key_ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, connector_id)
);
grant select, insert, update, delete on public.app_user_connections to service_role;
alter table public.app_user_connections enable row level security;