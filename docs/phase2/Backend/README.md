# Documentacion Tecnica - Fase 2: Gestion de Productos y Precios

## 1. Overview del Sistema

### 1.1 Descripcion General

Fase 2 del sistema PharmaQuick implementa la gestion completa de productos y precios con logica multi-tenant segura. El backend esta desarrollado en PHP 8.2 sin frameworks pesados, utilizando una arquitectura API REST propia con autenticacion JWT.

### 1.2 Caracteristicas Principales

- **CRUD de Productos**: Creacion, lectura, actualizacion y eliminacion de productos del catalogo global
- **Gestion de Precios**: Sistema de precios por producto y farmacia con regla de activacion unica
- **Multi-Tenant**: Aislamiento total de datos por farmacia basado en JWT
- **Sistema de Roles**: Control de acceso basado en roles desde base de datos
- **Seguridad**: Todas las consultas SQL parametrizadas y validadas

---

## 2. Arquitectura del Sistema

### 2.1 Estructura de Archivos

```
src/
|-- API/
|   |-- Controllers/           (no usado - arquitectura basada en funciones)
|   |-- Middleware/
|   |   |-- JwtMiddleware.php
|   |-- routes/
|   |   |-- auth.php
|   |   |-- productos.php
|   |   |-- precios.php
|   |-- Router.php
|-- Core/
|   |-- App.php
|   |-- Exceptions.php
|   |-- JsonResponse.php
|-- Domain/
|   |-- Services/
|       |-- PrecioService.php
|-- Infrastructure/
|   |-- Persistence/
|   |   |-- ClusterRepository.php
|   |   |-- PDOFactory.php
|   |   |-- PrecioRepository.php
|   |   |-- ProductoRepository.php
|   |   |-- UsuarioRepository.php
|   |-- Services/
|       |-- AuthService.php
|       |-- JwtService.php
```

### 2.2 Diagrama de Capas

```
HTTP Request
    |
    v
Router.php (entrada)
    |
    +--> JwtMiddleware.php (autenticacion)
    |       |
    |       +--> Auth (helper estatico)
    |
    v
Routes (productos.php, precios.php)
    |
    +--> Services (PrecioService)
    |
    +--> Repositories (ProductoRepository, PrecioRepository, UsuarioRepository)
    |
    v
PDOFactory (conexion a MySQL)
```

---

## 3. Autenticacion y Autorizacion

### 3.1 Sistema JWT

El sistema de autenticacion utiliza tokens JWT con el algoritmo HS256. El token contiene los siguientes datos en el payload:

```php
$payload = [
    'sub' => $userData['id'],           // user_id
    'email' => $userData['email'],       // email del usuario
    'farmacia_id' => $userData['farmacia_id'],  // ID de la farmacia (tenant)
    // 'rol' se obtiene desde BD en cada request
];
```

### 3.2 Middleware de Autenticacion

**Archivo**: `src/API/Middleware/JwtMiddleware.php`

La clase `JwtMiddleware` procesa cada request protegido:

1. Extrae el token del header `Authorization: Bearer <token>`
2. Valida la firma y expiration del token
3. Consulta el rol del usuario desde la base de datos
4. Inyecta el contexto de autenticacion en `$_REQUEST['auth']`

### 3.3 Helper Auth

**Archivo**: `src/API/Middleware/JwtMiddleware.php` (clase Auth estatica)

Metodos disponibles:

```php
// Obtiene el array de contexto complet
Auth::user(): ?array

// Obtiene el ID del usuario autenticado
Auth::userId(): ?int

// Obtiene el ID de la farmacia (tenant actual)
Auth::farmaciaId(): ?int

// Obtiene el email del usuario
Auth::email(): ?string

// Obtiene el rol desde la base de datos
// Retorna 'USUARIO' o 'ADMINISTRADOR'
Auth::rol(): ?string

// Verifica si el usuario es administrador
// Alias de: Auth::rol() === 'ADMINISTRADOR'
Auth::isAdmin(): bool

// Verifica si hay usuario autenticado
Auth::check(): bool
```

### 3.4 Sistema de Roles

El sistema de roles esta basado en la columna `rol` de la tabla `usuarios`:

```sql
CREATE TABLE usuarios (
    ...
    rol ENUM('USUARIO','ADMINISTRADOR') DEFAULT 'USUARIO',
    activo BOOLEAN DEFAULT TRUE,
    ...
);
```

**Reglas de acceso**:

| accion | rol requerido |
|--------|----------------|
| Listar productos por farmacia | Cualquier usuario autenticado |
| Ver producto por ID | Cualquier usuario autenticado |
| Buscar productos | Cualquier usuario autenticado |
| Crear producto | ADMINISTRADOR |
| Actualizar producto | ADMINISTRADOR |
| Eliminar producto | ADMINISTRADOR |
| Gestionar precios | Cualquier usuario autenticado |

---

## 4. Multi-Tenant

### 4.1 Concepto

El sistema es multi-tenant, donde cada farmacia tiene acceso unicamente a sus propios datos. El aislamiento se implementa de la siguiente manera:

1. **Farmacia origen**: El `farmacia_id` se obtiene exclusivamente del JWT
2. **Sin input del frontend**: Nunca se confia en datos recibidos del frontend para aislamiento
3. **Filtrado en consultas**: Todas las queries filtran por `farmacia_id`

### 4.2 Filtrado por Entidad

**Productos**:

Los productos forman parte de un catalogo global. Se accede a ellos mediante:
- JOIN con la tabla `lotes` que contiene el `farmacia_id`
- Filtro implicito: solo productos con stock en la farmacia aparecen

```sql
-- Lista de productos de una farmacia
SELECT DISTINCT p.*
FROM productos p
INNER JOIN lotes l ON p.id = l.producto_id
WHERE l.farmacia_id = :farmacia_id  -- DESDE JWT, NO DEL REQUEST
  AND p.activo = 1
  AND l.stock_actual > 0
```

**Precios**:

Los precios son por farmacia y producto:

```sql
-- Lista de precios de una farmacia
SELECT pr.*, p.nombre AS producto_nombre
FROM precios pr
INNER JOIN productos p ON pr.producto_id = p.id
WHERE pr.farmacia_id = :farmacia_id  -- DESDE JWT, NO DEL REQUEST
```

---

## 5. Esquema de Base de Datos

### 5.1 Tablas Principales

**Tabla: usuarios**

```sql
CREATE TABLE usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmacia_id INT UNSIGNED NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    rol ENUM('USUARIO','ADMINISTRADOR') DEFAULT 'USUARIO',
    activo BOOLEAN DEFAULT TRUE,
    
    UNIQUE (farmacia_id, email),
    
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;
```

**Tabla: productos**

```sql
CREATE TABLE productos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    descripcion TEXT,
    categoria VARCHAR(50),
    presentacion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_activo (activo)
) ENGINE=InnoDB;
```

**Tabla: precios**

```sql
CREATE TABLE precios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED,
    farmacia_id INT UNSIGNED,
    precio DECIMAL(12,2),
    activo BOOLEAN DEFAULT FALSE,
    
    INDEX idx_precio (producto_id, farmacia_id, activo),
    
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id)
) ENGINE=InnoDB;
```

### 5.2 Regla de Negocio de Precios

**Regla critica**: Solo puede haber un precio activo por producto y farmacia.

Cuando se activa un precio:
1. Se desactivan todos los demas precios de ese producto en la misma farmacia
2. Se activa el precio especificado

```sql
-- Al activar un precio:
-- Paso 1: Desactivar todos los precios del producto
UPDATE precios 
SET activo = 0
WHERE producto_id = :producto_id 
  AND farmacia_id = :farmacia_id;

-- Paso 2: Activar el precio especifico
UPDATE precios 
SET activo = 1
WHERE id = :precio_id 
  AND producto_id = :producto_id 
  AND farmacia_id = :farmacia_id;
```

---

## 6. Endpoints de la API

### 6.1 Productos

| Metodo | Endpoint | Descripcion | Auth |
|-------|---------|-------------|------|
| GET | /api/productos | Lista productos de la farmacia | JWT |
| GET | /api/productos/{id} | Ver producto por ID | JWT |
| GET | /api/productos/search?q= | Buscar productos | JWT |
| POST | /api/productos | Crear producto | JWT + ADMIN |
| PUT | /api/productos/{id} | Actualizar producto | JWT + ADMIN |
| DELETE | /api/productos/{id} | Eliminar producto | JWT + ADMIN |

**Estructura POST /api/productos**:

```json
{
    "nombre": "string (requerido)",
    "codigo_barras": "string (opcional, unico)",
    "descripcion": "string (opcional)",
    "categoria": "string (opcional)",
    "presentacion": "string (opcional)",
    "activo": "boolean (opcional, default true)"
}
```

**Estructura PUT /api/productos/{id}**:

```json
{
    "nombre": "string",
    "codigo_barras": "string",
    "descripcion": "string",
    "categoria": "string",
    "presentacion": "string",
    "activo": "boolean"
}
```

### 6.2 Precios

| Metodo | Endpoint | Descripcion | Auth |
|-------|---------|-------------|------|
| GET | /api/precios | Lista todos los precios | JWT |
| GET | /api/precios/{id} | Ver precio por ID | JWT |
| GET | /api/precios/producto/{id} | Precios por producto | JWT |
| POST | /api/precios | Crear precio | JWT |
| PUT | /api/precios/{id} | Actualizar/activar precio | JWT |
| DELETE | /api/precios/{id} | Eliminar precio | JWT |

**Estructura POST /api/precios**:

```json
{
    "producto_id": "integer (requerido)",
    "precio": "float > 0 (requerido)",
    "activar": "boolean (opcional, default true)"
}
```

**Estructura PUT /api/precios/{id}**:

```json
{
    "precio": "float > 0 (opcional)",
    "activar": "boolean (opcional)"
}
```

---

## 7. Repositorios

### 7.1 ProductoRepository

**Archivo**: `src/Infrastructure/Persistence/ProductoRepository.php`

Metodos disponibles:

```php
// Lista productos de una farmacia (con stock desde lotes)
findAllByFarmacia(int $farmaciaId): array

// Busca un producto por ID (con filtro de farmacia via lote)
findById(int $productoId, int $farmaciaId): ?array

// Busca productos por nombre o codigo de barras
search(string $query, int $farmaciaId): array

// Crea un nuevo producto en el catalogo global
create(array $data): int

// Actualiza un producto existente
update(int $id, array $data): bool

// Busca un producto por ID sin filtro de farmacia
findByIdGlobal(int $id): ?array

// Lista todos los productos del catalogo global
findAllGlobal(): array

// Busca productos en catalogo global (sin filtro de farmacia)
searchGlobal(string $query): array

// Obtiene producto global con su precio activo
findByIdWithPrecio(int $productoId, int $farmaciaId): ?array
```

### 7.2 PrecioRepository

**Archivo**: `src/Infrastructure/Persistence/PrecioRepository.php`

Metodos disponibles:

```php
// Busca un precio por ID (verificando propiedad de la farmacia)
findById(int $precioId, int $farmaciaId): ?array

// Crea un nuevo precio
create(int $productoId, int $farmaciaId, float $precio, bool $activo = false): int

// Busca el precio activo de un producto
findActiveByProducto(int $productoId, int $farmaciaId): ?array

// Busca todos los precios de un producto
findAllByProducto(int $productoId, int $farmaciaId): array

// Desactiva todos los precios de un producto
deactivateAll(int $productoId, int $farmaciaId): int

// Activa un precio (desactiva los demas automaticamente)
activate(int $precioId, int $productoId, int $farmaciaId): bool

// Actualiza el monto de un precio
update(int $precioId, int $farmaciaId, float $precio): bool

// Elimina un precio
delete(int $precioId, int $farmaciaId): bool

// Lista precios con detalles de producto
findWithProductoByFarmacia(int $farmaciaId): array
```

### 7.3 UsuarioRepository

**Archivo**: `src/Infrastructure/Persistence/UsuarioRepository.php`

Metodos disponibles:

```php
// Autentica un usuario (login)
authenticate(string $email, string $password): array

// Busca un usuario por ID
findById(int $userId): ?array
```

---

## 8. Servicios de Dominio

### 8.1 PrecioService

**Archivo**: `src/Domain/Services/PrecioService.php`

Este servicio contiene toda la logica de negocio de precios y es la unica fuente de verdad para las operaciones de precios.

```php
// Constructor
__construct(PrecioRepository $repository, ?ProductoRepository $productoRepository = null)

// Crea un precio y lo activa automaticamente
crearYActivar(int $productoId, int $farmaciaId, float $precio): array

// Crea un precio sin activar
crear(int $productoId, int $farmaciaId, float $precio, bool $activo = false): int

// Activa un precio existente
activar(int $precioId, int $productoId, int $farmaciaId): array

// Desactiva todos los precios de un producto
desactivarTodo(int $productoId, int $farmaciaId): int

// Actualiza el precio de un registro
actualizar(int $precioId, int $farmaciaId, float $precio): bool

// Elimina un precio
eliminar(int $precioId, int $farmaciaId): bool

// Obtiene el precio activo de un producto
getPrecioActivo(int $productoId, int $farmaciaId): ?array

// Obtiene todos los precios de un producto
getTodos(int $productoId, int $farmaciaId): array

// Obtiene todos los precios de una farmacia
getPorFarmacia(int $farmaciaId): array
```

---

## 9. Respuestas JSON

### 9.1 Estructura de Respuestas

Todas las respuestas siguen una estructura consistente:

**Exito**:

```json
{
    "success": true,
    "data": {
        // contenido segun endpoint
    }
}
```

**Error**:

```json
{
    "success": false,
    "message": "Descripcion del error"
}
```

### 9.2 Codigos de Estado HTTP

| Codigo | Significado |
|-------|-------------|
| 200 | OK - solicitud exitosa |
| 201 | Created - recurso creado |
| 400 | Bad Request - datos invalidos |
| 401 | Unauthorized - no autenticado |
| 403 | Forbidden - sin permisos |
| 404 | Not Found - recurso no encontrado |
| 500 | Internal Server Error - error del servidor |

---

## 10. Seguridad

### 10.1 Medidas Implementadas

1. **SQL Injection**: Todas las consultas usan prepared statements con parametros
2. **Autenticacion JWT**: Tokens con firma HMAC-SHA256 y expiracion
3. **Filtrado multi-tenant**: Ningun dato accesible sin autenticacion valida
4. **Control de roles**: Operaciones sensibles requieren rol ADMINISTRADOR
5. **Validacion de entrada**: Todos los inputs son validados y sanitizados
6. **Errores genericos**: Mensajes de error sin detalles de implementacion

### 10.2 Conexiones a Base de Datos

El sistema utiliza el patron Factory paraManage conexiones a la base de datos:

**Archivo**: `src/Infrastructure/Persistence/PDOFactory.php`

```php
// Conexion al master (tablas globales)
PDOFactory::getMaster(): PDO

// Conexion a un cluster especifico
PDOFactory::getCluster(int $num): PDO
```

La distribucion en clusters permite escalar horizontalmente manteniendo el aislamiento multi-tenant.

---

## 11. Dependencias y Requisitos

### 11.1 Requisitos del Sistema

- PHP 8.2+
- MySQL 8.0+
- Servidor web compatible (Nginx recomendado)

### 11.2 Extensiones PHP Requeridas

- pdo
- pdo_mysql
- json
- hash (para HMAC-SHA256)

---

## 12. Ejemplos de Uso

### 12.1 Autenticacion (Login)

```bash
curl -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmaquick.com", "password": "password"}'
```

Respuesta:

```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "usuario": {...},
        "farmacia_id": 1,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### 12.2 Listar Productos

```bash
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer <token>"
```

### 12.3 Crear Precio

```bash
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "precio": 1250.00, "activar": true}'
```

### 12.4 Activar Precio Existente

```bash
curl -X PUT "http://localhost/api/precios/2" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"activar": true}'
```

---

## 13. Apendice: Scripts SQL de Inicializacion

### 13.1 Estructura de Archivos SQL

```
docker/mysql/init/
|-- 01-master.sql         (pharma_master - tablas globales y usuarios master)
|-- 02-cluster-1.sql    (db_cluster_1 - Farmacias 1-5)
|-- 03-cluster-2.sql    (db_cluster_2 - Farmacias 6+)
|
docker/mysql/
|-- migration_1.0.0_to_1.0.1.sql  (actualizacion desde version anterior)
```

### 13.2 Scripts de Inicializacion

**01-master.sql**: Base de datos master (pharma_master)
- Tabla `farmacias` - Catalogo de todas las farmacias
- Tabla `usuarios` - Usuarios con roles
- Tabla `cluster_farmacias` - Mapeo de farmacias a clusters
- Tabla `logs` - Auditoria

**02-cluster-1.sql**: Cluster 1 (db_cluster_1)
- Contiene las tablas de datos para farmacias 1-5
- Productos, lotes, precios, ventas, etc.

**03-cluster-2.sql**: Cluster 2 (db_cluster_2)
- Contiene las tablas de datos para farmacia 6+

### 13.3 Sistema de Roles

Los scripts SQL incluyen el sistema de roles actualizado:

```sql
-- En la tabla usuarios:
rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO',
activo BOOLEAN DEFAULT TRUE,
```

**Valores de rol**:
- `ADMINISTRADOR`: Puede crear/editar/eliminar productos del catalogo global
- `USUARIO`: Acceso basico a productos y precios de su farmacia

### 13.4 Datos de Prueba Incluidos

**Master (pharma_master)**:
```sql
-- Farmacias
(1, 'F001', 'PharmaQuick Central')
(2, 'F002', 'PharmaQuick Norte')
(3, 'F003', 'PharmaQuick Cedritos')
(4, 'F004', 'PharmaQuick Chapinero')
(5, 'F005', 'PharmaQuick Calle 80')
(6, 'F006', 'PharmaQuick Alamos')

-- Usuarios (password: 'password' para todos)
(1, 'admin@pharmaquick.com', 'ADMINISTRADOR')
(1, 'vendedor@pharmaquick.com', 'USUARIO')
(2, 'vendedor2@pharmaquick.com', 'USUARIO')
-- ... etc.
```

**Clusters**:
include productos, lotes y precios de prueba para testing

### 13.5 Migration (para instalaciones existentes)

Para actualizar una instalacion existente a la version 1.0.1:

```bash
# Ejecutar en el contenedor MySQL
docker exec -it pharmaquick_mysql mysql -uroot -proot_pharma_2024 < docker/mysql/migration_1.0.0_to_1.0.1.sql
```

O manualmente en cada base de datos:

```sql
-- Actualizar enum de roles
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMINISTRADOR', 'USUARIO') DEFAULT 'USUARIO';

-- Migrar valores old
UPDATE usuarios SET rol = 'ADMINISTRADOR' WHERE rol = 'ADMIN';
UPDATE usuarios SET rol = 'USUARIO' WHERE rol IN ('VENDEDOR', 'AUXILIAR');

-- Agregar columna activo
ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT TRUE;
```

---

## 14. Referencias

- **Archivo principal del router**: `src/API/Router.php`
- **Middleware de autenticacion**: `src/API/Middleware/JwtMiddleware.php`
- **Repositorio de productos**: `src/Infrastructure/Persistence/ProductoRepository.php`
- **Repositorio de precios**: `src/Infrastructure/Persistence/PrecioRepository.php`
- **Servicio de precios**: `src/Domain/Services/PrecioService.php`
- **Esquema de base de datos**: `docs/database/pharmaquick.sql`

---

*Documento generado para referencia tecnica del backend de Fase 2 - PharmaQuick*