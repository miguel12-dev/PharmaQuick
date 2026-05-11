# PharmaQuick - Guía de Deployment (Hosting Compartido)

> **Nota:** Esta guía es para hosting compartido (sin Docker).

---

## 📋 Requisitos Previos

- Hosting con **PHP 8.2+**
- **MySQL 5.7+** (incluido en hosting compartido)
- Acceso a **phpMyAdmin**

---

## 🗄️ Estructura de Bases de Datos

Tu aplicación usa **múltiples bases de datos**:

| Base de Datos | Propósito | Contenido |
|---------------|-----------|-----------|
| `u631215701_pharmaquick` | **Master** | Farmacias, usuarios, logs |
| `u631215701_pharmaquick_cluster` | **Cluster 1** | Productos, ventas, inventarios |
| `u631215701_pharmaquick_cluster2` (opcional) | **Cluster 2** | Para más farmacias |

**Fórmula de asignación:**
- Farmacias 1-5 → Cluster 1
- Farmacias 6-10 → Cluster 2
- etc.

---

## 🚀 Pasos de Instalación

### 1. Ya tienes la base de datos master ✅

Tu base de datos principal ya tiene las tablas del master.

### 2. Crear la base de datos del Cluster

1. En **phpMyAdmin** de tu hosting:
   - Haz clic en **Nueva base de datos**
   - Nombre: `u631215701_pharmaquick_cluster`
   - Cotejamiento: `utf8mb4_unicode_ci`
   - Crear

### 3. Exportar/Importar el Cluster desde tu PC local

Como no puedes ejecutar scripts SQL en el hosting, haz esto:

**Opción A: Desde tu Docker local (recomendado)**

1. Asegúrate de tener Docker corriendo con MySQL
2. Exporta la base de datos del cluster desde tu local:

```bash
# Si usas Docker en Windows, primero entra al contenedor:
docker exec -it pharmaquick-mysql-1 bash

# Luego exporta:
mysqldump -u root -proot_pharma_2024 db_cluster_1 > /tmp/cluster1.sql

# Copia el archivo al host:
docker cp pharmaquick-mysql-1:/tmp/cluster1.sql ./
```

**Opción B: Desde phpMyAdmin local**

1. Abre phpMyAdmin de tu Docker (localhost:8080)
2. Selecciona `db_cluster_1`
3. Ve a **Exportar** → **Continuar**
4. Descarga el archivo `.sql`

### 4. Importar en el Hosting

1. En phpMyAdmin del hosting:
   - Selecciona `u631215701_pharmaquick_cluster`
   - Ve a **Importar**
   - Selecciona el archivo `.sql` descargado
   - **Continuar**

### 5. Configurar las Credenciales

Edita `config/database.php` en tu hosting:

```php
<?php
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbUser = 'u631215701_pharmaquick';
$dbPass = 'Pharmaquick_2314';

// Master
$dbNameMaster = 'u631215701_pharmaquick';

// Clusters
$dbNameCluster1 = 'u631215701_pharmaquick_cluster';
$dbNameCluster2 = 'u631215701_pharmaquick_cluster2';

return [
    'master' => [
        'host'     => $dbHost,
        'port'     => $dbPort,
        'database' => $dbNameMaster,
        'username' => $dbUser,
        'password' => $dbPass,
    ],
    'clusters' => [
        'db_cluster_1' => [
            'host'     => $dbHost,
            'port'     => $dbPort,
            'database' => $dbNameCluster1,
            'username' => $dbUser,
            'password' => $dbPass,
        ],
        'db_cluster_2' => [
            'host'     => $dbHost,
            'port'     => $dbPort,
            'database' => $dbNameCluster2,
            'username' => $dbUser,
            'password' => $dbPass,
        ],
    ],
];
```

### 6. Actualizar .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u631215701_pharmaquick
DB_USER=u631215701_pharmaquick
DB_PASSWORD=Pharmaquick_2314

DB_NAME_CLUSTER1=u631215701_pharmaquick_cluster
DB_NAME_CLUSTER2=u631215701_pharmaquick_cluster2
```

---

## 📁 Archivos a Subir

Sube estos archivos/carpetas al hosting:

```
public_html/
├── public/
│   ├── index.php
│   ├── .htaccess
│   └── uploads/
├── src/
├── vendor/
├── config/
│   └── database.php
├── .env
├── composer.json
└── index.php
```

**No subir:**
- `.git/`
- `docker/`
- `QA/`
- `node_modules/`

---

## ✅ Checklist Final

- [ ] Base de datos master tiene datos (ya la tienes)
- [ ] Creada base de datos `u631215701_pharmaquick_cluster`
- [ ] Importadas tablas del cluster (productos, ventas, etc.)
- [ ] `config/database.php` configurado con ambas bases
- [ ] `.env` actualizado
- [ ] Archivos subidos al hosting
- [ ] App accesible - prueba el login

---

## 🔧 Solución de Problemas

### "Unknown database" para cluster
- Verifica que creaste la base de datos del cluster en phpMyAdmin
- El nombre debe coincidir exactamente con `DB_NAME_CLUSTER1` en .env

### Error de conexión
- Confirma que el usuario MySQL tiene permisos para ambas bases de datos
- Generalmente el mismo usuario puede acceder a todas las DBs de tu cuenta

### Rutas no funcionan (404)
- Tu hosting debe apuntar a `public/`
- Verifica que `.htaccess` esté activo

---

## 📝 Credenciales por Defecto

| Email | Password | Rol |
|-------|----------|-----|
| admin@pharmaquick.com | password | ADMINISTRADOR |
| vendedor@pharmaquick.com | password | USUARIO |

**Cambia estas contraseñas después de instalar!**

---

## ➕ Agregar Más Farmacias (Clusters)

Si necesitas más de 5 farmacias, crea otro cluster:

1. Crea `u631215701_pharmaquick_cluster2` en phpMyAdmin
2. Importa la estructura del cluster (mismas tablas que cluster_1)
3. Actualiza `.env` con `DB_NAME_CLUSTER2`
4. Las farmacias 6-10 automáticamente usarán cluster 2