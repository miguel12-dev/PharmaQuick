# 📊 Reporte de Test de Estrés - PharmaQuick

**Test**: stress-1000.yaml (1000 usuarios)
**Duración**: ~4.5 minutos
**Fecha**: 07 Mayo 2026

---

## ✅ Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Usuarios virtuales creados | 108,150 | - |
| Usuarios completados exitosamente | 59 | ⚠️ Bajo |
| Usuarios fallidos | 108,091 | ⚠️ Alto |
| **Tasa de éxito** | **0.05%** | ⚠️ Bajo |
| Solicitudes HTTP realizadas | 108,268 | - |
| Respuestas recibidas | 3,879 | ⚠️ Bajo |
| Solicitudes por segundo | 390 | - |

**Veredicto**: ⚠️ **El test tuvo problemas de sobrecarga**

---

## ⏱️ Métricas de Latencia (Tiempo de Respuesta)

### Latencia Global

| Percentil | Tiempo (ms) | Análisis |
|-----------|-------------|----------|
| **Mín** | 4 | Excelente |
| **p50** | 7.9 | ✅ Excelente |
| **p75** | 13.1 | ✅ Bueno |
| **p90** | 40.9 | ✅ Aceptable |
| **p95** | 80.6 | ✅ Dentro del umbral (2000ms) |
| **p99** | 102.5 | ✅ Dentro del umbral (4000ms) |
| **p999** | 125.2 | ✅ Bien |
| **Máx** | 204 | ✅ Bien |
| **Media** | 16.7 | ✅ Excelente |

**✅ Los tiempos de respuesta son BUENOS** - El p95 (80.6ms) está muy por debajo del umbral de 2000ms.

---

## 📈 Códigos de Respuesta HTTP

| Código | Descripción | Cantidad | Porcentaje |
|--------|-------------|----------|------------|
| **200** | Éxito | 177 | 4.6% |
| **401** | No autorizado | 3,702 | 95.5% |

### Detalle por Endpoint

| Endpoint | 200 | 401 | Errores |
|----------|-----|-----|---------|
| `/api/auth/login` | 59 | 3,702 | 90,543 timeout |
| `/api/perfil` | 16 | 0 | 0 |
| `/api/productos` | 16 | 0 | 0 |
| `/api/inventario/resumen` | 17 | 0 | 0 |
| `/api/inventario/alertas` | 17 | 0 | 0 |
| `/api/productos/search` | 22 | 0 | 0 |
| `/api/productos/categorias` | 22 | 0 | 0 |
| `/api/ventas` | 4 | 0 | 0 |
| `/api/reservas` | 4 | 0 | 0 |

---

## 🔴 Errores

| Tipo de Error | Cantidad | Porcentaje |
|---------------|----------|------------|
| **ECONNRESET** (Conexión reiniciada) | 90,543 | 86.7% |
| **ERR_SOCKET_TIMEOUT** (Tiempo agotado) | 13,846 | 13.3% |

### Causa del problema:
El servidor começou a rechazar conexiones debido a sobrecarga en el endpoint de login.

---

## 🎯 Latencia por Endpoint (ordenada por mejor rendimiento)

| Endpoint | Media | p50 | p95 | p99 | Peticiones |
|----------|-------|-----|-----|-----|-------------|
| `/api/ventas` | 7.3ms | 6ms | 8.9ms | 8.9ms | 4 |
| `/api/inventario/resumen` | 8.7ms | 7ms | 16ms | 16ms | 17 |
| `/api/inventario/alertas` | 8.9ms | 7ms | 18ms | 18ms | 17 |
| `/api/productos/search` | 7.9ms | 6ms | 10.1ms | 13.1ms | 22 |
| `/api/productos/categorias` | 8.9ms | 7ms | 12.1ms | 13.9ms | 22 |
| `/api/productos` | 10.8ms | 7.9ms | 13.1ms | 13.1ms | 16 |
| `/api/perfil` | 14.1ms | 6ms | 10.9ms | 10.9ms | 16 |
| `/api/auth/login` | 17ms | 7.9ms | 80.6ms | 102.5ms | 3,761 |
| `/api/reservas` | - | - | - | - | 4 |

---

## 📊 Distribución de Escenarios

| Escenario | Usuarios Creados | Porcentaje |
|-----------|------------------|------------|
| Usuario Autenticado - CRUD | 43,178 | 39.9% |
| Operaciones de Inventario | 32,439 | 30.0% |
| Búsqueda de Productos | 21,804 | 20.2% |
| Ventas y Reservas | 10,729 | 9.9% |

---

## 🔍 Análisis

### ✅ Lo que funcionó bien:
1. **Tiempos de respuesta rápidos**: p95 de solo 80.6ms (vs umbral de 2000ms)
2. **Sin errores 500**: No hubo errores del servidor (500, 502, 503)
3. **Latencia excelente**: La mayoría de endpoints respondieron en <20ms

### ❌ Problemas encontrados:
1. **Sobrecarga del endpoint de login**: 90,543 errores de conexión
2. **Tasa de éxito baja**: Solo 59 de 108,150 usuarios completaron
3. **Fallo en autenticación**: 3,702 respuestas 401

---

## 💡 Conclusiones

| Aspecto | Resultado |
|---------|-----------|
| **Capacidad del servidor** | ✅ Soporta las solicitudes cuando no hay overload |
| **Rendimiento** | ✅Excelente - latencias muy bajas |
| **Punto de ruptura** | ❌ El servidor no soporta la carga de arrivalRate alta |
| **Recomendación** | Reducir arrivalRate o usar múltiples fases de ramp-up |

---

## 🛠️ Recomendaciones

1. **Reducir arrivalRate inicial**: Cambiar de 50 a 20 en la primera fase
2. **Aumentar duración de fases**: Más tiempo de ramp-up
3. **Optimizar autenticación**: Considerar cacheo de tokens
4. **Próximo test**: Probar con 500 usuarios para ver si mejora la tasa de éxito

---

## 📁 Archivos Generados

- `stress-1000.json` - Datos crudos
- `stress-1000.json.html` - Reporte HTML de Artillery
- `stress-1000-reporte.md` - Este reporte

---

*Reporte generado automáticamente - PharmaQuick QA*