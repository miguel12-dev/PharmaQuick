# PharmaQuick - Sistema Multi-Tenant para Farmacias

> **Version:** 1.0.0
> **Fecha:** 2026-04-24
> **Stack:** Docker (LEMP: Linux, Nginx, MySQL 8.0, PHP 8.2-FPM)

---

## Quick Start

### Requisitos Previos
- Docker 20.10+
- Docker Compose 2.0+
- Puerto 8080 y 8081 disponibles

### Levantar el Proyecto

```powershell
# 1. Navegar al directorio del proyecto
cd C:\"Tu Carpeta"

# 2. Construir imagenes (primera vez)
docker-compose build

# 3. Iniciar contenedores
docker-compose up -d

# 4. Verificar estado
docker-compose ps
```

### Accesos

| Servicio | URL | Credenciales |
|---------|-----|------------|
| **API** | http://localhost:8080 | - |
| **phpMyAdmin** | http://localhost:8081 | root / root_pharma_2024 |
| **MySQL** | localhost:3307 | root / root_pharma_2024 |

---

## Endpoints de la API

### Health Check
```powershell
curl http://localhost:8080/health
```

### Login
```powershell
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@pharmaquick.com\",\"password\":\"password\"}"
```

---

## Estructura del Proyecto

```
PharmaQuick/
├── docker/                    # Configuracion Docker
│   ├── php/                   # PHP-FPM
│   ├── nginx/                 # Servidor web
│   └── mysql/init/           # Scripts SQL
├── public/                    # Punto de entrada
├── src/
│   ├── Core/                 # Nucleo (App, Exceptions, JsonResponse)
│   ├── Infrastructure/       # Persistence + Services
│   └── API/                  # Controllers + Router
├── docs/                     # Documentacion
├── docker-compose.yml        # Orquestacion
└── composer.json            # Dependencias
```

---

## Comandos Utiles

### Ver contenedores
```powershell
docker-compose ps
```

### Ver logs
```powershell
docker-compose logs -f php
docker-compose logs -f nginx
docker-compose logs -f mysql
```

### Reiniciar servicios
```powershell
docker-compose restart php
docker-compose restart nginx
```

### Detener todo
```powershell
docker-compose down
```

### Eliminar datos (cuidado!)
```powershell
docker-compose down -v
```

---

## Base de Datos

### Bases de Datos Creadas

| Database | Descripcion | Farmacias |
|----------|-------------|-----------|
| `pharma_master` | Catalogo central | 1-6 |
| `db_cluster_1` | Cluster 1 | 1-5 |
| `db_cluster_2` | Cluster 2 | 6+ |

### Formula de Clustering
```
Cluster = ceil(farmacia_id / 5)
```

### Usuarios de Prueba

| Email | Password | Farmacia |
|-------|----------|----------|
| admin@pharmaquick.com | password | 1 |
| vendedor@pharmaquick.com | password | 1 |
| vendedor2@pharmaquick.com | password | 2 |

---

## Test Flight

### 1. Verificar contenedores corriendo
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. Probar API
```powershell
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@pharmaquick.com\",\"password\":\"password\"}"
```

### 3. Verificar trigger de stock
```powershell
# Ver stock inicial
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "SELECT stock_actual FROM lotes WHERE id = 1;"

# Insertar movimiento
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "INSERT INTO movimientos_inventario (lote_id, farmacia_id, usuario_id, tipo, cantidad) VALUES (1, 1, 1, 'ENTRADA', 10);"

# Verificar cambio
docker exec -it pharma_mysql mysql -uroot -proot_pharma_2024 db_cluster_1 -e "SELECT stock_actual FROM lotes WHERE id = 1;"
```

### 4. Acceder a phpMyAdmin

1. Abrir http://localhost:8081
2. Servidor: `mysql`
3. Usuario: `root`
4. Contrasena: `root_pharma_2024`

---

## Documentacion Completa

Ver [docs/SETUP.md](./docs/SETUP.md) para guia detallada.

---

## Siguientes Pasos

- [ ] Implementar JWT para autenticacion
- [ ] CRUD de inventario (lotes, movimientos)
- [ ] Algoritmo FEFO
- [ ] Modulo de ventas con PDF
- [ ] Sistema de reservas

---

*PharmaQuick v1.0.0 - 2026*