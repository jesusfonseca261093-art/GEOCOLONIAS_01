-- ========================================
-- CREAR TABLA: seguros_unidades
-- ========================================

-- Crear tabla
create table public.seguros_unidades (
  id text primary key,
  content jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Crear índice para búsquedas más rápidas
create index idx_seguros_unidades_created_at on public.seguros_unidades(created_at desc);

-- ========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ========================================

-- Habilitar RLS en la tabla
alter table public.seguros_unidades enable row level security;

-- Permitir leer a todos
create policy "Allow all to read seguros_unidades" 
on public.seguros_unidades
for select 
to public 
using (true);

-- Permitir insertar a todos
create policy "Allow all to insert seguros_unidades" 
on public.seguros_unidades
for insert 
to public 
with check (true);

-- Permitir actualizar a todos
create policy "Allow all to update seguros_unidades" 
on public.seguros_unidades
for update 
to public 
using (true);

-- Permitir eliminar a todos
create policy "Allow all to delete seguros_unidades" 
on public.seguros_unidades
for delete 
to public 
using (true);

-- ========================================
-- POLÍTICAS PARA STORAGE (bucket evidencias)
-- ========================================

-- Permitir subir archivos al bucket evidencias (público)
create policy "Allow upload to evidencias"
on storage.objects
for insert
to public
with check (
  bucket_id = 'evidencias'
);

-- Permitir leer archivos del bucket evidencias (público)
create policy "Allow read from evidencias"
on storage.objects
for select
to public
using (
  bucket_id = 'evidencias'
);

-- Permitir actualizar archivos en el bucket evidencias (público)
create policy "Allow update evidencias"
on storage.objects
for update
to public
using (
  bucket_id = 'evidencias'
);

-- Permitir eliminar archivos en el bucket evidencias (público)
create policy "Allow delete evidencias"
on storage.objects
for delete
to public
using (
  bucket_id = 'evidencias'
);
