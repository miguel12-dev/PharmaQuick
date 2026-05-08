# 📊 Reporte de Test Simple - PharmaQuick

**Test**: test-simple.yaml
**Fecha**: 08 Mayo 2026
**Duración**: ~1 minuto

---

## ✅ Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Solicitudes HTTP | ~118 | - |
| Respuestas exitosas (200) | 118 | ✅ |
| Usuarios completados | ~56 | ✅ |
| **Usuarios fallidos** | **0** | ✅ **Excelente** |
| **Tasa de éxito** | **100%** | ✅ **Perfecto** |

**Veredicto**: ✅ **TEST EXITOSO**

---

## ⏱️ Métricas de Latencia

| Percentil | Tiempo (ms) | Análisis |
|-----------|-------------|----------|
| **Mín** | 4 | ✅ Excelente |
| **p50** | 8.9 - 85.6 | ✅ Variable pero aceptable |
| **p95** | **102.5** | ✅ Excelente (umbral: 2000ms) |
| **p99** | **108.9** | ✅ Excelente (umbral: 4000ms) |
| **Máx** | 109 | ✅ Muy bueno |
| **Media** | 49.2 - 64.2 | ✅ Bueno |

---

## 📈 Distribución de Escenarios

| Escenario | Usuarios |
|-----------|----------|
| Login y Perfil | ~30 (50%) |
| Ver Productos | ~19 (30%) |
| Ver Inventario | ~13 (20%) |

---

## 🎯 Análisis por Escenario

| Escenario | Estado | Notas |
|-----------|--------|-------|
| Login + Perfil | ✅ | Flujo completo exitoso |
| Login + Productos | ✅ | Sin errores |
| Login + Inventario | ✅ | Sin errores |

---

## 📊 Comparación con Tests Anteriores

| Test | Tasa de éxito | p95 latencia | Problemas |
|------|---------------|--------------|-----------|
| stress-5000 | 0.007% | 5,598ms | Colapsó servidor |
| load-1000 | 0.62% | 104.6ms | Muchos errores |
| **test-simple** | **100%** | **102.5ms** | **Perfecto** |

---

## 🔑 Conclusiones

1. **El servidor funciona correctamente** cuando la carga es moderada
2. **El problema** es cuando se intentan demasiadas conexiones simultáneas
3. **La solución** es usar arrivalRate bajo (5-15 usuarios)

---

## 🛠️ Recomendaciones para siguientes tests

- Usar arrivalRate máx de 10-15 usuarios
- No exceder 6 requests/segundo
- Mantener el tiempo de espera (think time) de 2 segundos

---

## 📁 Archivo

- `test-simple.yaml` - Test que funciona correctamente

---

*Reporte generado automáticamente - PharmaQuick QA*