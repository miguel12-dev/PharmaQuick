# Migraciones de Base de Datos - PharmaQuick

Este archivo documenta los cambios realizados a la estructura de la base de datos.

---

## Migración: Registro de Clientes Global

**Fecha:** Mayo 2026
**Objetivo:** Permitir registro de clientes globales (sin farmacia asignada)

### Cambios en `pharma_master.usuarios`

#### Problema Inicial
Los clientes necesitan poder registrarse en el sistema sin estar asociados a una farmacia específica. La tabla `usuarios` tenía:
- `farmacia_id` como NOT NULL (requería una farmacia)
- Restricción FK que impedía valores nulos
- Rol solo tenía: `'USUARIO', 'ADMINISTRADOR'`

#### Error Común (#3780)
Al intentar:
```sql
ALTER TABLE usuarios MODIFY COLUMN farmacia_id INT NULL;
```
MySQL devuelve: `Referencing column 'farmacia_id' and referenced column 'id' in foreign key constraint are incompatible`

**Solución:** Primero eliminar la FK, luego modificar la columna.

#### Scripts de Migración

```sql
-- 1. Verificar nombre de la FK actual
-- Ejecutar en phpMyAdmin o MySQL:
SHOW CREATE TABLE usuarios;

-- 2. Eliminar la FK (reemplazar 'usuarios_ibfk_X' por el nombre real)
ALTER TABLE usuarios DROP FOREIGN KEY usuarios_ibfk_1;

-- 3. Modificar columna a NULL
ALTER TABLE usuarios MODIFY COLUMN farmacia_id INT UNSIGNED NULL;

-- 4. Actualizar rol ENUM (añadir CLIENTE)
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN', 'FARMACEUTICO', 'AUXILIAR', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE';

-- 5. Hacer email único global (antes era único por farmacia)
-- Primero eliminar el índice único anterior (si existe)
ALTER TABLE usuarios DROP INDEX farmacia_id;  -- o el nombre del índice
-- Luego crear nuevo índice único global
ALTER TABLE usuarios ADD UNIQUE (email);
```

#### Estructura Final de la Tabla

```sql
CREATE TABLE usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NULL,  -- Nullable para clientes globales
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    rol ENUM('ADMIN', 'FARMACEUTICO', 'AUXILIAR', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
    activo BOOLEAN DEFAULT TRUE,
    nombre VARCHAR(100),
    
    -- Índice único global por email
    UNIQUE (email),

    -- FK solo aplica cuando farmacia_id no es NULL
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;
```

---

## Cómo encontrar el nombre de la FK

Si `usuarios_ibfk_1` no existe, ejecutar:

```sql
-- Ver todas las restricciones de la tabla
SHOW CREATE TABLE usuarios;

-- O listar todas las FK
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'pharma_master'
  AND TABLE_NAME = 'usuarios'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

El nombre típico de la FK puede ser:
- `usuarios_ibfk_1` (auto-generado por MySQL)
- `usuarios_ibfk_2`
- `usuarios_fk_farmacia`
- `usuarios_farmacia_id_foreign`

---

## Verificación Post-Migración

```sql
-- Verificar estructura
DESCRIBE usuarios;

-- Verificar que clientes pueden tener NULL
SELECT id, email, rol, farmacia_id FROM usuarios WHERE rol = 'CLIENTE';

-- Verificar índice único
SHOW INDEX FROM usuarios WHERE Non_unique = 0;
```

---

## Rutas para Clientes (Frontend)

**Fecha:** Mayo 2026
**Objetivo:** Crear experiencia tipo e-commerce para clientes sin acceso al panel administrativo

### Nuevas Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/mi-cuenta` | `ClientDashboardPage.js` | Dashboard simplificado del cliente |
| `/mi-cuenta/tienda` | `ClientStorePage.js` | Catálogo para comprar/reservar |
| `/mi-cuenta/reservas` | `ClientReservationsPage.js` | Mis reservas simplificado |
| `/mi-cuenta/compras` | (pendiente) | Historial de compras |

### Archivos Creados

```
public/frontend/
├── layout/
│   └── ClientLayout.js       # Layout tipo e-commerce (sin sidebar admin)
├── pages/
│   ├── ClientDashboardPage.js
│   ├── ClientStorePage.js
│   └── ClientReservationsPage.js
```

### Flujo de Redirección

1. **Cliente logueado hace click en "Comprar"** → `/mi-cuenta/tienda?producto=X`
2. **Cliente logueado hace click en "Reservar"** → `/mi-cuenta/reservas?producto=X`
3. **Cliente intenta acceder a /dashboard** → Redirigido a `/mi-cuenta`
4. **Admin intenta acceder a /mi-cuenta/** → Redirigido a `/dashboard`

### Modificaciones en Archivos Existentes

- `public/js/app.js` - Añadido sistema de redirección por rol
- `public/frontend/pages/HomePage.js` - Redirecciones según rol
- `public/index.html` - Carga de scripts de cliente
```