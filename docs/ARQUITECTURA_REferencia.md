# PharmaQuick - Referencia de Arquitectura y Convenciones

> Este documento consolida las reglas de estilo, arquitectura y negocio para guiar el desarrollo.
> Actualizado: 2026-04-23

---

## 1. Stack Tecnológico

| Componente | Tecnología |
|------------|-------------|
| Lenguaje | PHP 8.x nativo |
| Base de datos | MySQL 8.0 |
| Contenedor | Docker |
| Gestor dependencias | Composer |
| Librerías | phpoffice/phpspreadsheet, dompdf/dompdf |

---

## 2. Arquitectura Multi-Tenant

- **Estrategia**: 1 Base de datos por cada 5 farmacias (db_cluster_N)
- **Central**: `pharma_master` mapea cada `farmacia_id` a un clúster específico
- **Conexión**: PDO Factory instancia conexión basándose en el prefijo del clúster

---

## 3. Convenciones de Nomenclatura

| Tipo | Formato | Ejemplo |
|------|--------|---------|
| Clases | PascalCase | `InventoryController` |
| Métodos y Variables | camelCase | `calculateTotalStock` |
| Constantes | UPPER_CASE | `MAX_STOCK_LIMIT` |

---

## 4. Estructura de Directorios

```
/src           → Lógica pura PHP (Controllers, Models, Services)
/public/css    → Solo archivos .css
/public/js     → Solo archivos .js
/templates     → Archivos .php/.html con solo markup y variables
```

> **Regla Anti-Mezcla**: No lógica de negocio en vistas, no etiquetas `<style>` ni `<script>` internas en templates.

---

## 5. Gestión de Errores y Logs

- Uso obligatorio de bloques `try-catch`
- Implementar `LoggerService` centralizado
- **Máximo**: 200 líneas por archivo → modularidad obligatoria

---

## 6. Reglas de Negocio

### 6.1 FEFO (First Expired, First Out)
- Priorizar lotes con fecha de vencimiento más cercana en punto de venta y reportes
- Índice `idx_fefo_lookup` optimiza consulta FEFO
- **Semáforo**:
  - 🔴 Rojo: < 3 meses
  - 🟡 Amarillo: < 6 meses
  - 🟢 Verde: Vigente

### 6.2 Resolución 1403 de 2007
- Registro obligatorio de Fecha de Vencimiento y Lote
- La interfaz debe **impedir** cualquier venta sin lote o fecha de vencimiento asignada

### 6.3 Sistema de Reservas
- Tipos de movimiento: `RESERVA` (bloquea stock), `LIBERACION` (libera stock)
- Estados reserva: `ACTIVA`, `EXPIRADA`, `CANCELADA`, `CONSUMIDA`
- Job/script expira reservas automáticamente y libera stock

### 6.4 Precios
- Solo **UN precio activo** por producto por farmacia a la vez
- Al activar uno, los demás pasan a 0

---

## 7. Estructura de Base de Datos

### 7.1 Tablas Principales

| Tabla | Clave | Descripción |
|------|------|-------------|
| `farmacias` | id, codigo_sucursal | Farmacias/clústeres |
| `usuarios` | id, farmacia_id, email | Usuarios por farmacia |
| `productos` | id, nombre, codigo_barras | Catálogo global |
| `lotes` | producto_id, codigo_lote | Inventario por lote (FEFO) |
| `movimientos_inventario` | lote_id, tipo, cantidad | Kardex (fuente de verdad) |
| `ventas` | farmacia_id, usuario_id, total | Registro de ventas |
| `detalle_ventas` | venta_id, lote_id, cantidad | Detalle por lote |
| `reservas` | lote_id, estado, fecha_expiracion | Reservas de clientes |
| `precios` | producto_id, precio_activo | Precios por farmacia |
| `logs` | evento, data JSON | Auditoría |

### 7.2 Trigger Centralizado (Stock Engine)

```sql
-- trg_kardex_stock: única fuente de verdad
-- NUNCA modificar lotes directamente
-- Siempre insertar en movimientos_inventario

ENTRADA  → stock_actual + cantidad
SALIDA    → stock_actual - cantidad
RESERVA   → stock_actual - cantidad, stock_reservado + cantidad
LIBERACION → stock_actual + cantidad, stock_reservado - cantidad
```

### 7.3 Índices Importantes

- `idx_fefo_lookup`: (farmacia_id, producto_id, fecha_vencimiento, stock_actual) ��� optimización FEFO
- `idx_lote`: (lote_id) — búsqueda Kardex
- `idx_estado`: (estado) — reservas
- `idx_farmacia_fecha`: (farmacia_id, creado_en) — ventas

---

## 8. Cumplimiento Ley 1581 (Habeas Data)

- Cifrado **AES-256** obligatorio para datos sensibles:
  - Cédula
  - Teléfono
  - Dirección del paciente
- **Regla**: Ningún dato personal identificable en texto plano
- Usar `EncryptionService` antes de cualquier `INSERT` o `UPDATE`

---

## 9. Endpoints API

| Verbo | Ruta | Parámetros | Respuesta |
|------|------|-----------|----------|
| POST | `/api/auth/login` | email, password | `{token, user_data, farmacia_id}` |
| GET | `/api/inventario/fefo` | producto_id | `[{lote_id, stock, fecha_venc, dias_restantes}]` |
| POST | `/api/inventario/movimiento` | lote_id, tipo, cantidad | `{msg, nuevo_stock}` |
| POST | `/api/ventas/crear` | cliente_id, items[] | `{venta_id, total, link_pdf}` |
| GET | `/api/public/buscar` | lat, lng, query | `[{farmacia, producto, precio, distancia}]` |

---

## 10. Documentación de Código (DocBlocks)

Todo clase y método debe tener:

```php
/**
 * Descripción breve del método/clase
 *
 * @param tipo $nombre Descripción
 * @return tipo Descripción
 * @throws Excepción Posible
 */
```

- Idioma: **Español Técnico**
- Prohibición: **Sin emojis**

---

## 11. Integraciones Externas

| Servicio | Propósito |
|----------|-----------|
| phpoffice/phpspreadsheet | Carga masiva .xlsx, exportación Excel |
| dompdf/dompdf | Generación facturas PDF, reportes farmacovigilancia |
| GeoAPI | Geolocalización (fórmula Haversine) |

---

## 12. Vistas/Frontends

| Vista | Propósito | API Consumida |
|-------|----------|---------------|
| Dashboard Operativo | Resumen lotes por vencer, ventas del día | `/api/inventario/alertas` |
| Punto de Venta (POS) | Facturación rápida con FEFO | `/api/inventario/fefo` |
| Buscador Público | Cliente final: precios y reservas | `/api/public/buscar` |
| Perfil/Auditoría | Gestión usuario y logs | `/api/auditoria` |

---

## 13. Reglas Críticas importadas

1. **Stock Engine**: INSERT en `movimientos_inventario`, nunca directo en `lotes`
2. **FEFO**: No es opcional, es requerimiento legal (Resolución 1403)
3. **Precios**: Solo 1 activo por producto/farmacia
4. **Cifrado**: Datos sensibles = AES-256 obligatoria
5. **Logs**: Toda modificación genera registro en tabla `logs`

---

_Documento generado desde auditoría de /docs — Consolidado para referencia de IA_