# PharmaQuick - Guia de Configuracion y Despliegue

> **Version:** 1.0.0
> **Ultima Actualizacion:** 2026-04-23
> **Stack:** Docker (LEMP Stack: Linux, Nginx, MySQL 8.0, PHP 8.2-FPM)

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Levantar los Contenedores](#levantar-los-contenedores)
4. [Verificar Conectividad de Servicios](#verificar-conectividad-de-servicios)
5. [Ejecutar Migraciones](#ejecutar-migraciones)
6. [Configuracion de la Base de Datos](#configuracion-de-la-base-de-datos)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Probar el Trigger de Stock](#probar-el-trigger-de-stock)
9. [Comandos de Utilidad](#comandos-de-utilidad)
10. [Solucion de Problemas](#solucion-de-problemas)

---

## Requisitos Previos

| Requisito | Version Minima |
|-----------|----------------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Git | 2.30+ |
| Puerto 8080 | Disponible |

### Verificar Instalacion

```powershell
docker --version
docker-compose --version
```

---

## Estructura del Proyecto

```
PharmaQuick/
├── docker/
│   ├── mysql/
│   │   └── init/
│   │       ├── 01-master.sql        # Base master (pharma_master)
│   │       ├── 02-cluster-1.sql      # Cluster 1 (farmacias 1-5)
│   │       └── 03-cluster-2.sql      # Cluster 2 (farmacia 6+)
│   ├── nginx/
│   │   ├── default.conf             # Configuracion del servidor
│   │   └── logs/                    # Logs de Nginx
│   └── php/
│       ├── Dockerfile               # Imagen PHP 8.2-FPM
│       └── php.ini                   # Configuracion PHP
├── public/
│   └── index.php                    # Router principal
├── src/
│   ├── Core/                        # Nucleo del sistema
│   │   ├── App.php                  # Configuracion global
│   │   ├── Exceptions.php           # Excepciones personalizadas
│   │   └── JsonResponse.php         # Helper de respuestas JSON
│   ├── Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── PDOFactory.php       # Fabrica de conexiones PDO
│   │   │   ├── UsuarioRepository.php # Repositorio de usuarios
│   │   │   └── ClusterRepository.php # Mapeo clusters/farmacias
│   │   └── Services/
│   │       └── AuthService.php      # Logica de autenticacion
│   └── API/
│       ├── Controllers/
│       │   └── AuthController.php   # Controlador de autenticacion
│       └── Router.php                # Router principal
├── docs/
│   ├── database/
│   │   └── pharmaquick.sql          # Esquema completo
│   └── Documentation/
├── composer.json                     # Dependencias (PSR-4)
└── docker-compose.yml                # Orquestacion de contenedores
```

---

## Levantar los Contenedores

### Paso 1: Construir las Imagenes

```powershell
cd C:\Users\Miguel\Desktop\Projects\ing_Yudy\PharmaQuick
docker-compose build
```

> **Nota:** Esta operacion puede tardar entre 3-5 minutos en la primera ejecucion.

### Paso 2: Iniciar los Contenedores

```powershell
# En modo Attached (ver logs en tiempo real)
docker-compose up -d

# En modo Attached con logs visibles
docker-compose up
```

### Paso 3: Verificar que los Contenedores Estan Corriendo

```powershell
docker-compose ps
```

**Salida esperada:**

```
NAME                STATUS
pharma_php          Up (healthy)
pharma_nginx        Up (healthy)
pharma_mysql        Up (healthy)
```

---

## Verificar Conectividad de Servicios

### 1. Verificar que los Contenedores Estan Activos

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. Verificar Health Checks de los Servicios

```powershell
# Health check de Nginx
curl http://localhost:8080/health

# Response esperada:
{
    "service": "PharmaQuick API",
    "status": "running",
    "version": "1.0.0",
    "timestamp": "2026-04-23T10:30:00+00:00"
}
```

### 3. Verificar Conexion a MySQL

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 -e "SELECT 'MySQL OK' as status;"
```

### 4. Verificar Extension PHP y Configuracion

```powershell
docker exec -it pharma_php php -m | grep -E "pdo_mysql|gd|zip|bcmath"
docker exec -it pharma_php php -i | grep "memory_limit"
```

---

## Ejecutar Migraciones

Las migraciones se ejecutan automaticamente al iniciar MySQL gracias a los scripts en `/docker-entrypoint-initdb.d/`.

### Verificacion Post-Inicializacion

```powershell
# Verificar que las bases de datos fueron creadas
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 -e "SHOW DATABASES;"
```

**Salida esperada:**

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| pharma_master      |
| db_cluster_1       |
| db_cluster_2       |
+--------------------+
```

### Verificar Tablas en pharma_master

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 pharma_master -e "SHOW TABLES;"
```

**Salida esperada:**

```
+------------------------+
| Tables_in_pharma_master|
+------------------------+
| farmacias              |
| cluster_farmacias      |
| logs                   |
+------------------------+
```

### Verificar Tablas en db_cluster_1

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "SHOW TABLES;"
```

**Salida esperada:**

```
+---------------------------+
| Tables_in_db_cluster_1    |
+---------------------------+
| usuarios                  |
| productos                 |
| lotes                     |
| movimientos_inventario    |
| ventas                    |
| detalle_ventas            |
| reservas                 |
| precios                   |
+---------------------------+
```

---

## Configuracion de la Base de Datos

### Arquitectura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                     pharma_master                           │
│  (Catalogo central: farmacias, cluster_farmacias)          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ db_cluster_1   │    │ db_cluster_2  │    │ db_cluster_N  │
│ (Farmacias 1-5)│    │(Farmacias 6-10)│    │(Farmacias N..)│
└───────────────┘    └───────────────┘    └───────────────┘
```

### Formula de Clustering

```
Cluster = ceil(farmacia_id / 5)
```

| Farmacia ID | Cluster |
|-------------|---------|
| 1-5         | db_cluster_1 |
| 6-10        | db_cluster_2 |
| 11-15       | db_cluster_3 |
| ...         | ... |

---

## Endpoints de la API

### 1. Autenticacion

**POST /api/auth/login**

```powershell
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@pharmaquick.com\",\"password\":\"password\"}"
```

**Respuesta de Exito (200):**

```json
{
    "success": true,
    "message": "Autenticacion exitosa. Bienvenido a PharmaQuick.",
    "farmacia_id": 1,
    "user": {
        "id": 1,
        "farmacia_id": 1,
        "email": "admin@pharmaquick.com"
    }
}
```

**Respuesta de Error (401):**

```json
{
    "success": false,
    "message": "Email o contrasena incorrectos"
}
```

### 2. Health Check de Autenticacion

**GET /api/auth/health**

```powershell
curl -X GET http://localhost:8080/api/auth/health
```

### 3. Health Check General

**GET /health**

```powershell
curl -X GET http://localhost:8080/health
```

---

## Probar el Trigger de Stock

El trigger `trg_kardex_stock` es el unico punto de modificacion del stock. **Nunca modifique lotes directamente.**

### Paso 1: Verificar Estado Inicial del Lote

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
SELECT id, stock_actual, stock_reservado FROM lotes WHERE id = 1;"
```

### Paso 2: Insertar un Movimiento (ENTRADA)

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, referencia)
VALUES (1, 1, 1, 'ENTRADA', 50, 'Test: Insertar entrada');"
```

### Paso 3: Verificar que el Stock se Actualizo

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
SELECT id, stock_actual, stock_reservado FROM lotes WHERE id = 1;"
```

**Resultado esperado:** `stock_actual` aumento en 50.

### Paso 4: Probar una SALIDA

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, referencia)
VALUES (1, 1, 1, 'SALIDA', 25, 'Test: Venta');"
```

Verificar: `stock_actual` disminuyo en 25.

### Paso 5: Probar RESERVA

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, referencia)
VALUES (1, 1, 1, 'RESERVA', 10, 'Test: Reserva cliente');"
```

Verificar: `stock_actual` decreased en 10, `stock_reservado` aumento en 10.

### Paso 6: Probar LIBERACION

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad, referencia)
VALUES (1, 1, 1, 'LIBERACION', 10, 'Test: Cancelar reserva');"
```

Verificar: `stock_actual` aumento en 10, `stock_reservado` disminuyo en 10.

---

## Comandos de Utilidad

### Ver Logs de un Contenedor

```powershell
# Logs de Nginx
docker-compose logs -f nginx

# Logs de PHP
docker-compose logs -f php

# Logs de MySQL
docker-compose logs -f mysql
```

### Reiniciar un Servicio Especifico

```powershell
docker-compose restart php
docker-compose restart nginx
docker-compose restart mysql
```

### Acceso Directo a MySQL

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024
```

### Acceso a MySQL con Base de Datos Especifica

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1
```

### Ejecutar PHP de forma Interactiva

```powershell
docker exec -it pharma_php php -a
```

### Detener y Eliminar Contenedores

```powershell
# Detener (preserva volumenes)
docker-compose stop

# Detener y eliminar
docker-compose down

# Detener y eliminar VOLUMENES (pierde datos!)
docker-compose down -v
```

### Reconstruir Contenedores

```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Solucion de Problemas

### Error: Puerto 8080 en Uso

```powershell
# Identificar que esta usando el puerto
netstat -ano | findstr :8080

# Cambiar puerto en docker-compose.yml
# Modificar: "8080:80" -> "8081:80"
```

### Error: MySQL No Inicia

```powershell
# Ver logs detallados
docker-compose logs mysql

# Verificar permisos de volumen
docker volume inspect pharmaquick_mysql_data
```

### Error: PHP No Puede Conectar a MySQL

```powershell
# Verificar que MySQL esta corriendo
docker-compose ps mysql

# Reiniciar PHP
docker-compose restart php

# Verificar variables de entorno
docker-compose config
```

### Verificar que el Trigger Existe

```powershell
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "
SHOW TRIGGERS LIKE 'trg_kardex_stock';"
```

### Reconstruir Base de Datos Desde Cero

```powershell
# Detener y eliminar todo, incluyendo volumenes
docker-compose down -v

# Eliminar archivos de esquema para que se reinicien
docker-compose up -d

# Verificar que las BD se crearon de nuevo
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 -e "SHOW DATABASES;"
```

---

## Datos de Prueba

### Usuarios de Prueba

| Email | Password | Rol | Farmacia |
|-------|----------|-----|----------|
| admin@pharmaquick.com | password | ADMIN | 1 |
| vendedor@pharmaquick.com | password | VENDEDOR | 1 |
| vendedor2@pharmaquick.com | password | VENDEDOR | 2 |

> **Nota:** Las contrasenas son hashes pre-generados. Para fines de prueba, puede usar `password` ya que el hash coincide con `password_hash('password', PASSWORD_DEFAULT)`.

### Farmacias Configuradas

| ID | Codigo | Nombre | Cluster |
|----|--------|--------|---------|
| 1 | F001 | PharmaQuick Central | db_cluster_1 |
| 2 | F002 | PharmaQuick Norte | db_cluster_1 |
| 3 | F003 | PharmaQuick Cedritos | db_cluster_1 |
| 4 | F004 | PharmaQuick Chapinero | db_cluster_1 |
| 5 | F005 | PharmaQuick Calle 80 | db_cluster_1 |
| 6 | F006 | PharmaQuick Alamos | db_cluster_2 |

---

## Siguientes Pasos

1. **Autenticacion JWT** - Implementar tokens de sesion
2. **Endpoints de Inventario** - CRUD de lotes y movimientos
3. **FEFO** - Algoritmo de seleccion de lotes por vencer
4. **Ventas** - Proceso de facturacion con PDF
5. **Reservas** - Sistema de reservas con expiracion automatica

---

*Documentacion generada para PharmaQuick v1.0.0 - 2026*