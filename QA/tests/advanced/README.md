# PharmaQuick - Tests de Carga Avanzados

Este directorio contiene pruebas de carga avanzadas con Artillery para simular hasta **5000 usuarios simultáneos**.

## Requisitos Previos

1. **Servidor corriendo**: Asegúrate de que el servidor de PharmaQuick esté ejecutándose en `http://localhost:8080`
2. **Dependencias instaladas**: Ejecuta `npm install` en el directorio `QA/`

```bash
cd QA
npm install
```

## Estructura de Archivos

```
tests/advanced/
├── config/
│   └── base-5000.yaml          # Configuración base reusable para 5000 usuarios
├── data/
│   └── usuarios.csv            # Datos de usuarios para las pruebas (45 usuarios)
├── scripts/
│   ├── run-stress-test.ps1     # Ejecutar test de estrés
│   ├── run-realistic-test.ps1  # Ejecutar test de escenario realista
│   ├── run-spike-test.ps1      # Ejecutar test de picos
│   └── run-all-advanced-tests.ps1 # Ejecutar todos los tests
├── stress-test.yaml             # Test de estrés: hasta 5000 usuarios
├── realistic-scenario.yaml     # Test de escenario realista: simulación de día laboral
├── spike-test.yaml             # Test de picos: promociones y eventos inesperados
└── README.md                   # Este archivo
```

## Tests Disponibles

### 1. Test de Estrés (`stress-test.yaml`)

**Objetivo**: Encontrar el punto de ruptura del sistema incrementando gradualmente la carga.

- **Usuarios pico**: 5000
- **Duración**: ~20 minutos
- **Fases**:
  - Warm-up inicial (10-50 usuarios)
  - Carga ligera (50-200 usuarios)
  - Carga media (200-500 usuarios)
  - Carga alta (500-1500 usuarios)
  - Carga extrema (1500-3500 usuarios)
  - Pico máximo (3500-5000 usuarios)
  - Carga sostenida (5000 usuarios)
  - Enfriamiento

**Ejecutar**:
```bash
npm run test:stress
# o con script PowerShell
npm run test:stress:ps1
```

### 2. Test de Escenario Realista (`realistic-scenario.yaml`)

**Objetivo**: Simular un día laboral típico en una farmacia.

- **Usuarios pico**: 5000
- **Duración**: ~18 minutos
- **Patrones de uso**:
  - Consulta de catálogo (40%) - Más común
  - Búsqueda de productos (25%)
  - Compras y reservas (20%)
  - Operaciones administrativas (10%)
  - Endpoints públicos (5%)

**Ejecutar**:
```bash
npm run test:realistic
# o con script PowerShell
npm run test:realistic:ps1
```

### 3. Test de Spike (`spike-test.yaml`)

**Objetivo**: Probar la capacidad del sistema para manejar picos de tráfico inesperados.

- **Usuarios pico**: 3500
- **Duración**: ~8 minutos
- **Escenarios**:
  - Promoción flash (pico rápido a 2000 usuarios)
  - Evento de marketing (pico mayor a 3500 usuarios)
  - Recuperación post-spike

**Ejecutar**:
```bash
npm run test:spike
# o con script PowerShell
npm run test:spike:ps1
```

## Resultados y Reportes

Los resultados se guardan automáticamente en la carpeta `QA/resultados/` como archivos JSON.

### Ver Reportes en Consola

```bash
npx artillery report resultados/stress-test.json
npx artillery report resultados/realistic-test.json
npx artillery report resultados/spike-test.json
```

### Archivo de Salida

Cada test genera un archivo JSON con el siguiente formato de nombre:
```
resultados/[nombre-test]_[timestamp].json
```

Por ejemplo:
- `resultados/stress-test_20240507_143022.json`
- `resultados/realistic-test_20240507_150045.json`
- `resultados/spike-test_20240507_152530.json`

### Métricas Incluidas

- **Latencia**: p50, p95, p99, min, max
- **Throughput**: requests por segundo
- **Códigos de respuesta**: 200, 201, 400, 401, 500, etc.
- **Errores**: breakdown por tipo de error

## Ejecutar Todos los Tests

```bash
npm run test:advanced:all
```

Esto ejecuta los 3 tests en secuencia:
1. Spike test (~8 min)
2. Realistic scenario (~18 min)
3. Stress test (~20 min)

**Duración total**: ~46 minutos

## Configuración de Usuarios

El archivo `data/usuarios.csv` contiene 45 usuarios de prueba:
- 2 administradores
- 5 vendedores
- 38 clientes

Cada usuario tiene email, password, nombre y rol definidos.

## Notas Importantes

- Los resultados JSON se guardan con timestamp para evitar sobrescribir pruebas anteriores
- Los scripts de PowerShell verifican que el servidor esté corriendo antes de ejecutar
- Los thresholds de respuesta están configurados para tolerar latencia alta en pruebas de estrés
- El endpoint `/health` no existe en la aplicación - los tests esperan 404
- Todos los endpoints de prueba requieren autenticación JWT (excepto login)
- Los endpoints públicos como `/api/public/catalogo` requieren parámetros adicionales (`farmacia_id`) y no se usan en los tests avanzados
- Los tests usan endpoints autenticados: `/api/auth/login`, `/api/perfil`, `/api/productos`, `/api/inventario/*`, `/api/ventas`, `/api/reservas`, etc.

## Solución de Problemas

### "El servidor no está corriendo"

Asegúrate de que el servidor esté ejecutándose:
```bash
# Verificar que el servidor responde
curl http://localhost:8080/api/public/catalogo
```

### Errors de timeout

Aumenta el timeout en la configuración del test si es necesario.

### Memoria insuficiente

Si experimentas problemas de memoria, reduce el arrivalRate en las fases de prueba.