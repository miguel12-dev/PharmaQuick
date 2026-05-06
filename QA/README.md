# PharmaQuick QA - Load Testing con Artillery

## Descripción

Este módulo contiene las pruebas de carga y rendimiento para la aplicación PharmaQuick utilizando **Artillery** (v2.x).

## Estructura del Proyecto

```
QA/
├── tests/              # Archivos YAML de pruebas
│   ├── basico.yaml     # Test básico sin autenticación
│   ├── jwt-auth.yaml   # Test con JWT Authentication
│   └── api-rest.yaml   # Test API REST completo
├── scripts/            # Funciones JavaScript personalizadas
│   └── helpers.js      # Helpers para generación de datos
├── data/               # Datos de prueba
│   └── usuarios.csv    # Usuarios para testing
├── resultados/         # Resultados de las pruebas (JSON + HTML)
└── package.json        # Configuración npm
```

## Requisitos

- **Node.js 18+** - Verificar con `node --version`
- **npm** - Administrador de paquetes
- **Servidor PharmaQuick** corriendo en `http://localhost:8080`

## Instalación

```bash
# Navegar a la carpeta QA
cd QA

# Instalar Artillery
npm install

# O instalar globalmente
npm install -g artillery@latest
```

## Uso Básico

### Ejecutar un test específico

```bash
# Test básico (sin auth)
npx artillery run tests/basico.yaml

# Test con JWT
npx artillery run tests/jwt-auth.yaml

# Test API REST
npx artillery run tests/api-rest.yaml
```

### Guardar resultados

```bash
# Guardar resultado en JSON
npx artillery run tests/jwt-auth.yaml --output resultados/jwt-auth-$(date +%Y%m%d-%H%M).json

# Generar reporte HTML
npx artillery report resultados/jwt-auth-*.json
```

### Scripts npm disponibles

```bash
npm run test:basic    # Ejecuta test básico
npm run test:auth    # Ejecuta test con JWT
npm run test:api      # Ejecuta test API REST
npm run test:all     # Ejecuta todos los tests
npm run report       # Muestra archivos de resultados disponibles
```

### Ver los resultados

**Los resultados se muestran automáticamente en la consola** al ejecutar cada test. No necesitas un paso adicional.

```bash
# Ejecutar test - los resultados aparecen al final en la consola
npx artillery run tests/jwt-auth.yaml --output resultados/jwt-auth.json
```

#### Opciones de reporte en Artillery v2

**Opción 1: Artillery Cloud (Recomendado)**
```bash
# Subir resultados a la nube de Artillery (gratis, requiere registro)
npx artillery cloud resultados/jwt-auth.json

# Visitar https://app.artillery.io para ver reportes interactivos
```

**Opción 2: Solo consola**
Los resultados de p50, p95, p99, rps, errors, vusers.failed ya se muestran automáticamente. Para la mayoría de casos esto es suficiente.

**Opción 3: Instalar versión legacy de Artillery**
```bash
# Si necesitas el comando report, instala artillery@1.x
npm install -g artillery@1
# Luego: artillery report resultados.json
```

## Configuración de Entornos

### Entorno local (por defecto)

```yaml
config:
  target: "http://localhost:8080"
```

### Otros entornos

```bash
# Cambiar target en tiempo de ejecución
npx artillery run tests/jwt-auth.yaml --overrides '{"config":{"target":"https://staging.pharmaquick.com"}}'
```

## Tests Disponibles

### 1. Test Básico (basico.yaml)

**Propósito**: Medir rendimiento de endpoints públicos sin autenticación

**Endpoints probados**:
- `GET /` - Página principal
- `GET /health` - Health check
- `GET /api/public/catalogo` - Catálogo público
- `GET /api/public/productos-top` - Productos destacados

**Fases**:
- Warm-up: 20s, 2 usuarios/seg
- Carga gradual: 40s, 2→10 usuarios/seg
- Carga sostenida: 60s, 10 usuarios/seg

**Thresholds**:
- p95 < 500ms
- p99 < 1000ms

---

### 2. Test con JWT (jwt-auth.yaml)

**Propósito**: Probar autenticación y endpoints protegidos

**Flujo**:
1. Login (`POST /api/auth/login`)
2. Captura de token JWT (`$.data.token`)
3. Endpoints protegidos con Bearer token

**Endpoints probados**:
- `POST /api/auth/login` - Autenticación
- `GET /api/perfil` - Perfil del usuario
- `GET /api/productos` - Listar productos
- `GET /api/public/catalogo` - Catálogo (con auth)
- `GET /api/inventario/resumen` - KPIs inventario
- `GET /api/inventario/alertas` - Alertas inventario

**Usuarios de prueba**:
- Email: `admin@pharmaquick.com`
- Password: `password`

**Fases**:
- Warm-up: 20s, 2 usuarios/seg
- Carga con auth: 60s, 2→10 usuarios/seg

---

### 3. Test API REST (api-rest.yaml)

**Propósito**: Probar operaciones CRUD completas y búsqueda

**Operaciones probadas**:
- **CREATE**: Crear productos, precios, lotes (implementar según necesidad)
- **READ**: Listar, obtener por ID, buscar
- **UPDATE**: Actualizar recursos
- **DELETE**: Eliminar recursos

**Endpoints probados**:
- `GET /api/productos` - Listar productos
- `GET /api/productos/categorias` - Categorías
- `GET /api/precios` - Listar precios
- `GET /api/lotes` - Listar lotes
- `GET /api/inventario/fefo` - Sugerencia FEFO
- `GET /api/ventas` - Listar ventas
- `GET /api/reservas` - Listar reservas
- `GET /api/inventario/movimientos` - Movimientos inventario
- `GET /api/productos/search?q=...` - Búsqueda
- `GET /api/ventas/top-productos` - Top productos

## Métricas y Reportes

### Ver resultados en consola

Al ejecutar cada test, Artillery muestra automáticamente las métricas en la consola:

```
─────────────────────────────────────────────────────────
Summary report @ 14:32:07(+0500) 2024-01-15
─────────────────────────────────────────────────────────
http.codes.200: ................................. 3480   ✓
http.response_time:
  min: .......................................... 23
  max: .......................................... 4821
  median: ....................................... 87
  p95: .......................................... 312
  p99: .......................................... 1204
vusers.completed: .............................. 232
vusers.failed: ................................. 4
```

### Generar reporte HTML (Artillery v2)

En Artillery v2, el comando `report` está deprecated. Usa una de estas alternativas:

#### Opción 1: Artillery Cloud (Recomendado)

```bash
# Subir resultados a Artillery Cloud
artillery cloud resultados/jwt-auth.json

# Requiere cuenta gratuita en https://app.artillery.io
```

#### Opción 2: Paquete artillery-report

```bash
# Instalar el paquete
npm install -D artillery-report

# Generar reporte HTML
npx artillery-report resultados/jwt-auth.json
```

#### Opción 3: Ver solo resumen en consola

Los resultados ya se muestran en la consola al ejecutar cada test. No necesitas un paso adicional.

### Métricas clave

| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| p50 | Mediana de latencia | < 100ms |
| p95 | Percentil 95 | < 300-500ms |
| p99 | Percentil 99 | < 500-1000ms |
| rps | Requests por segundo | Depende del objetivo |
| errors | Tasa de errores | 0% |

## Interpretación de Resultados

### Síntomas comunes

| Síntoma | Diagnóstico | Acción |
|---------|-------------|--------|
| p99 > 2s al escalar | Cuello de botella en DB | Revisar pool de conexiones |
| Errores 502/503 | Servidor saturado | Escalar horizontalmente |
| vusers.failed > 0 | Timeouts o errores | Revisar logs del servidor |
| Latencia crece linealmente | Sin caché, N+1 queries | Optimizar queries |
| p50 bien, p99 muy alto | Casos edge lentos | Analizar outliers |
| Latencia sube en soak test | Memory leak | Heap profiling |

## Variables de Entorno

```bash
# API key para tests que la requieran
export API_KEY="tu-api-key"

# Ejecutar con variable de entorno
API_KEY=mi-key npx artillery run tests/jwt-auth.yaml
```

## Tips para Pruebas

1. **Siempre incluye `think`**: Los usuarios reales no disparan 100 requests/segundo
2. **Empieza con arrivalRate bajo**: Ejecuta `arrivalRate: 1` primero
3. **Ejecuta la app primero**: Asegúrate que PharmaQuick esté corriendo
4. **No tests en producción**: Coordina con tu equipo antes de probar
5. **Guarda los resultados**: Usa `--output` para análisis posterior

## Troubleshooting

### Error de conexión

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:8080/health

# Si usa Docker, verificar puertos
docker ps
```

### Error de autenticación

```bash
# Verificar credenciales en jwt-auth.yaml
# El token debe estar en $.data.token (ver JsonResponse.php)
```

### Errores CORS

El servidor debe permitir requests desde localhost. Verificar configuración deheaders.

## Próximos Pasos

1. [ ] Agregar test de estrés (stress test)
2. [ ] Agregar test de WebSocket si aplica
3. [ ] Integrar con CI/CD (GitHub Actions)
4. [ ] Configurar plugin de métricas (Datadog, CloudWatch)
5. [ ] Agregar test de soak testing (pruebas de larga duración)

## Documentación Relacionada

- [Guía completa de Artillery](https://dckcloud.com/)
- [Documentación oficial de Artillery](https://www.artillery.io/docs)

---

**PharmaQuick QA** - Powered by Artillery v2