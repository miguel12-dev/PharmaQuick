# Reporte de Test de Estrés - PharmaQuick

**Fecha de ejecución**: Thu May 07 2026
**Archivo de datos**: stress-test.json
**Test**: stress-test.yaml (5000 usuarios simultáneos)

---

## 1. Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Total de usuarios virtuales creados | 3,420,200 | - |
| Usuarios virtuales completados | 261 | ⚠️ Muy bajo |
| Usuarios virtuales fallidos | 3,424,893 | ❌ Crítico |
| Tasa de éxito | 0.007% | ❌ Fallido |
| Solicitudes HTTP realizadas | 3,420,982 | - |
| Respuestas HTTP recibidas | 14,548 | ⚠️ Bajo |
| Solicitudes por segundo | 182 | - |

**Veredicto**: ❌ **El test FALLÓ** - El servidor no soportó la carga de 5000 usuarios.

---

## 2. Métricas de Latencia (Tiempo de Respuesta)

### Latencia Global

| Percentil | Tiempo (ms) | Descripción |
|-----------|-------------|-------------|
| **Min** | 0 | Respuesta más rápida |
| **p50** | 13.1 | Mediana |
| **p75** | 37 | 75% de las respuestas |
| **p90** | 2,618.1 | 90% de las respuestas |
| **p95** | 5,598.4 | Umbral configurado: 1500ms |
| **p99** | 7,865.6 | Umbral configurado: 3000ms |
| **p999** | 8,352 | Peor 0.1% |
| **Max** | 8,568 | Peor respuesta |
| **Media** | 650 | Promedio |

**Análisis**: El p95 (5,598ms) excede significativamente el umbral de 1500ms configurado.

---

## 3. Códigos de Respuesta HTTP

| Código | Cantidad | Porcentaje |
|--------|----------|------------|
| **200 (OK)** | 918 | 6.3% |
| **400 (Bad Request)** | 125 | 0.9% |
| **401 (Unauthorized)** | 13,505 | 92.8% |
| **Total respuestas** | 14,548 | 100% |

### Detalle por Endpoint

| Endpoint | 200 | 400 | 401 | Errores Timeout |
|----------|-----|-----|-----|-----------------|
| `/api/auth/login` | 290 | 0 | 13,505 | 3,061,255 |
| `/api/perfil` | 121 | 0 | 0 | 4 |
| `/api/productos` | 112 | 0 | 0 | 9 |
| `/api/inventario/resumen` | 108 | 0 | 0 | 4 |
| `/api/productos/search` | 50 | 0 | 0 | 3 |
| `/api/productos/categorias` | 50 | 0 | 0 | 0 |
| `/api/lotes` | 0 | 63 | 0 | 4 |
| `/api/inventario/fefo` | 0 | 62 | 0 | 1 |
| `/api/inventario/alertas` | 62 | 0 | 0 | 0 |
| `/api/ventas` | 42 | 0 | 0 | 3 |
| `/api/reservas` | 42 | 0 | 0 | 0 |
| `/api/ventas/top-productos` | 41 | 0 | 0 | 1 |

---

## 4. Errores Encontrados

| Tipo de Error | Cantidad | Porcentaje |
|---------------|----------|------------|
| **ERR_SOCKET_TIMEOUT** | 3,061,284 | 89.3% |
| **ECONNRESET** (Conexión reiniciada) | 341,453 | 10.0% |
| **ETIMEDOUT** (Tiempo agotado) | 8,434 | 0.2% |
| **EADDRINUSE** (Puerto en uso) | 215 | 0.006% |
| **ECONNREFUSED** (Conexión rechazada) | 2 | 0.0001% |

**Causa principal**: El servidor no pudo manejar el volumen de solicitudes y comenzó a rechazar conexiones.

---

## 5. Distribución de Escenarios

| Escenario | Usuarios Creados | Peso |
|-----------|------------------|------|
| Usuario Autenticado - CRUD Completo | 1,366,867 | 40% |
| Operaciones de Inventario | 855,412 | 25% |
| Búsqueda de Productos | 684,700 | 20% |
| Ventas y Reservas | 513,221 | 15% |

---

## 6. Latencia por Endpoint

| Endpoint | Media (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Peticiones |
|----------|-------------|----------|----------|----------|------------|
| `/api/ventas/top-productos` | 20.7 | 7.9 | 45.2 | 194.4 | 41 |
| `/api/reservas` | 129.0 | 8.9 | 30.3 | 194.4 | 42 |
| `/api/inventario/fefo` | 114.4 | 8.9 | 441.5 | 1,107.9 | 62 |
| `/api/inventario/alertas` | 125.8 | 10.9 | 262.5 | 391.6 | 62 |
| `/api/productos/search` | 158.6 | 8.9 | 120.3 | 3,262.4 | 50 |
| `/api/productos/categorias` | 237.6 | 8.9 | 120.3 | 5,378.9 | 50 |
| `/api/lotes` | 217.9 | 8.9 | 391.6 | 4,676.2 | 63 |
| `/api/ventas` | 233.2 | 10.1 | 16.9 | 3,984.7 | 42 |
| `/api/productos` | 366.8 | 10.9 | 1,107.9 | 6,064.7 | 112 |
| `/api/inventario/resumen` | 133.4 | 10.1 | 257.3 | 383.8 | 108 |
| `/api/perfil` | 755.7 | 10.9 | 5,598.4 | 5,944.6 | 121 |
| `/api/auth/login` | 670.1 | 13.1 | 5,598.4 | 7,865.6 | 13,795 |

---

## 7. Conclusiones y Recomendaciones

### Problemas Identificados

1. **Sobrecarga del servidor**: El servidor no soportó la carga de 5000 usuarios
2. **Timeouts masivos**: 89.3% de las solicitudes fallaron por timeout
3. **Autenticación fallida**: 13,505 respuestas 401 (posible overload del endpoint de login)
4. **Latencia excesiva**: p95 de 5,598ms vs umbral de 1,500ms (273% sobre el límite)

### Recomendaciones

1. **Reducir carga de prueba**: Iniciar con 1000 usuarios en lugar de 5000
2. **Ramp-up más gradual**: Aumentar la duración de las fases de incremento
3. **Mejorar timeout**: Aumentar el timeout del cliente de 30s a 60s
4. **Verificar infraestructura**: El servidor posiblemente requiere más recursos
5. **Considerarテスト distribuido**: Usar múltiples instancias de Artillery

### Pruebas sugeridas para siguiente iteración

- Test con 1000 usuarios (stress-test-1000.yaml)
- Test con 2000 usuarios (stress-test-2000.yaml)
- Test de resistencia sostenida con 500 usuarios por 30 minutos

---

## 8. Archivos Generados

- `stress-test.json` - Datos crudos del test
- `stress-test.json.html` - Reporte HTML de Artillery
- `stress-test-reporte.md` - Este reporte

---

*Reporte generado automáticamente para PharmaQuick QA*