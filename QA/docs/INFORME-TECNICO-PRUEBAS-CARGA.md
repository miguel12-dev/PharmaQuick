# Informe Técnico de Pruebas de Carga - PharmaQuick

## 1. Información General del Test

| Campo | Valor |
|-------|-------|
| **Fecha de ejecución** | 6 de Mayo 2026 |
| **Herramienta** | Artillery v2.x |
| **Test ejecutado** | `jwt-auth.yaml` |
| **Target** | `http://localhost:8080` |
| **Duración total** | ~89 segundos (1 min 29 seg) |
| **ID del test** | txzr7_aprkxfzpy4a3zym5tp7rf68apbfdb_tacj |

---

## 2. Configuración del Test

### Fases de Carga

| Fase | Nombre | Duración | arrivalRate | Descripción |
|------|--------|----------|-------------|-------------|
| 1 | Warm-up | 20s | 2 | Calentamiento |
| 2 | Carga con auth | 60s | 2 → 10 | Incremento gradual |

### Escenarios Probados

| Escenario | Peso | Descripción |
|----------|------|-------------|
| Flujo usuario autenticado | 80% | Login JWT + endpoints protegidos |
| Visitante público (sin auth) | 20% | Páginas públicas sin token |

---

## 3. Métricas Globales

### Request & Response

| Métrica | Valor |
|---------|-------|
| **Total de requests** | 2,112 |
| **Total de respuestas** | 2,112 |
| **Request rate promedio** | 35 req/seg |
| **Bytes descargados** | 6,372,608 (~6.1 MB) |

### Códigos HTTP

| Código | Cantidad | Porcentaje | Descripción |
|--------|----------|------------|-------------|
| **200** | 1,712 | 81.1% | Éxito |
| **400** | 400 | 18.9% | Error del cliente |

> **⚠️ Observación**: Los 400 errores están relacionados con el endpoint `/api/public/catalogo` al ser llamado sin token JWT desde el escenario de visitante público. Esto indica que el endpoint debería ser público pero está recibiendo token inválido.

### Métricas de Latencia (Global)

| Percentil | Tiempo (ms) | Objetivo (ms) | Estado |
|-----------|-------------|---------------|--------|
| **min** | 1 | - | ✅ |
| **max** | 128 | - | ✅ |
| **mean** | 18.1 | - | ✅ |
| **median (p50)** | 7 | < 100 | ✅ |
| **p75** | 12.1 | - | ✅ |
| **p90** | 80.6 | - | ✅ |
| **p95** | 87.4 | < 500 | ✅ PASA |
| **p99** | 104.6 | < 1000 | ✅ PASA |
| **p999** | 125.2 | - | ✅ |

---

## 4. Análisis por Endpoint

### Endpoints Exitosos (200 OK)

| Endpoint | Requests | p50 (ms) | p95 (ms) | p99 (ms) | Estado |
|----------|----------|----------|----------|----------|--------|
| `/api/auth/login` | 321 | 85.6 | 111.1 | 125.2 | ⚠️ Lento |
| `/api/perfil` | 321 | 7 | 16 | 21.1 | ✅ Rápido |
| `/api/productos` | 321 | 7.9 | 15 | 29.1 | ✅ Rápido |
| `/api/inventario/resumen` | 321 | 7.9 | 16 | 22.9 | ✅ Rápido |
| `/api/inventario/alertas` | 321 | 7.9 | 15 | 22 | ✅ Rápido |
| `/` (home) | 96 | 10.1 | 16.9 | 22 | ✅ Rápido |
| `/health` | 96 | 8.9 | 16 | 19.1 | ✅ Rápido |

### Endpoints con Errores (400)

| Endpoint | Requests | Código | Causa probable |
|----------|----------|--------|-----------------|
| `/api/public/catalogo` | 400 | 400 | Requiere auth o mal formato |

---

## 5. Rendimiento de Usuarios Virtuales

| Métrica | Valor |
|---------|-------|
| **VUs creados** | 400 |
| **VUs completados** | 400 |
| **VUs fallidos** | 0 |
| **Tasa de éxito** | 100% |

### Distribución de VUs por Escenario

| Escenario | Creados | Porcentaje |
|-----------|---------|------------|
| Flujo usuario autenticado | 304 | 76% |
| Visitante público (sin auth) | 96 | 24% |

### Duración de Sesión (VUs)

| Percentil | Tiempo (ms) | Tiempo (seg) |
|-----------|-------------|--------------|
| **min** | 3,027.2 | 3.0s |
| **max** | 8,241.3 | 8.2s |
| **mean** | 6,934.4 | 6.9s |
| **median (p50)** | 8,186.6 | 8.2s |
| **p95** | 8,186.6 | 8.2s |
| **p99** | 8,186.6 | 8.2s |

---

## 6. Evolución del Rendimiento (Timeline)

| Tiempo | Request Rate | p95 (ms) | p99 (ms) | Observación |
|--------|--------------|----------|----------|--------------|
| 10:28:30 | 7/s | 89.1 | 96.6 | Warm-up |
| 10:28:40 | 12/s | 87.4 | 104.6 | Carga inicial |
| 10:28:50 | 15/s | 96.6 | 104.6 | Fase aumentando |
| 10:29:00 | 21/s | 92.8 | 102.5 | Carga media |
| 10:29:10 | 29/s | 89.1 | 102.5 | Pre-pico |
| 10:29:20 | 36/s | 89.1 | 102.5 | Pico (~36/s) |
| 10:29:30 | 40/s | 85.6 | 100.5 | Pico (~40/s) |
| 10:29:40 | 49/s | 85.6 | 102.5 | Pico (~49/s) |
| 10:29:50 | 30/s | 13.1 | 82.3 | Enfriamiento |

**Observación**: El sistema mantiene latencias estables incluso en pico de ~49 req/seg. No hay degradación significativa.

---

## 7. Hallazgos y Observaciones

### ✅ Fortalezas

1. **Latencia excelente**: p95 de 87.4ms y p99 de 104.6ms están muy por debajo de los umbrales (500ms y 1000ms respectivamente).

2. **Estabilidad bajo carga**: El sistema mantiene tiempos de respuesta consistentes incluso cuando el request rate alcanza ~49 req/seg.

3. **Thresholds cumplidos**: Todos los umbrales de calidad configurados fueron alcanzados.

4. **Sin errores 5xx**: No se registraron errores del servidor.

5. **Tasa de éxito 100%**: Todos los VUs completaron exitosamente.

### ⚠️ Áreas de Mejora

1. **Endpoint `/api/public/catalogo` devuelve 400**: El endpoint de catálogo público está devolviendo errores 400 cuando se accede sin token. Debería ser 200 para tráfico público o manejar mejor la ausencia de token.

2. **Login más lento que otros endpoints**: El endpoint `/api/auth/login` tiene p95 de 111.1ms, significativamente más alto que otros endpoints (15-16ms). Esto es esperado dado que incluye validación de credenciales, hash de password y generación de JWT.

---

## 8. Recomendaciones

### Corto Plazo

| # | Recomendación | Prioridad |
|---|---------------|-----------|
| 1 | Revisar configuración de `/api/public/catalogo` para permitir acceso sin token | Alta |
| 2 | Considerar cacheo de respuestas de login para usuarios frecuentes | Media |
| 3 | Agregar logs de auditoría para los errores 400 del catálogo | Baja |

### Largo Plazo

| # | Recomendación | Prioridad |
|---|---------------|-----------|
| 1 | Realizar pruebas de estrés con mayor carga (>100 req/seg) | Alta |
| 2 | Implementar pruebas de soak testing (larga duración) | Media |
| 3 | Agregar métricas de base de datos (queries lentas) | Media |
| 4 | Configurar monitoreo con Datadog/CloudWatch | Baja |

---

## 9. Veredicto Final

| Criterio | Resultado | Detalle |
|----------|-----------|---------|
| **Umbral p95 < 500ms** | ✅ PASA | 87.4ms (17.5% del umbral) |
| **Umbral p99 < 1000ms** | ✅ PASA | 104.6ms (10.5% del umbral) |
| **Sin errores 5xx** | ✅ PASA | 0 errores 5xx |
| **VUs fallidos = 0** | ✅ PASA | 100% completados |
| **Condición http.codes.200 > 0** | ✅ PASA | 1,712 códigos 200 |

### Resultado: **APROBADO** ✅

La aplicación PharmaQuick soporta satisfactoriamente la carga de prueba de hasta ~49 requests por segundo con tiempos de respuesta óptimos.

---

## 10. Archivos de Evidencia

| Archivo | Descripción |
|---------|-------------|
| `resultados/jwt-auth.json` | Datos crudos de Artillery (formato JSON) |
| `resultados/jwt-auth.yaml.txt` | Log completo de la ejecución en consola |

---

## Anexo: Comparativa de Latencia por Endpoint

```
Endpoint                    p50    p95    p99    Estado
─────────────────────────────────────────────────────────────
/api/auth/login           85.6   111.1  125.2   ⚠️ Más lento
/api/perfil                7.0    16.0   21.1   ✅ Rápido
/api/productos             7.9    15.0   29.1   ✅ Rápido
/api/inventario/resumen    7.9    16.0   22.9   ✅ Rápido
/api/inventario/alertas    7.9    15.0   22.0   ✅ Rápido
/api/public/catalogo       4.0     8.9   16.0   ⚠️ Error 400
/ (home)                  10.1    16.9   22.0   ✅ Rápido
/health                    8.9    16.0   19.1   ✅ Rápido
─────────────────────────────────────────────────────────────
```

---

**Documento generado**: 6 de Mayo 2026  
**Herramienta**: Artillery v2 Load Testing  
**Proyecto**: PharmaQuick QA