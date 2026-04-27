---
name: Fase 3 backend inventario
overview: "Organizar el backend para Inventario/Stock Engine según el cronograma: endpoint de movimientos Kardex y carga masiva desde Excel (.xlsx) usando PhpSpreadsheet vía Composer, respetando el trigger como source of truth y aplicando separación SOLID."
todos:
  - id: inv-mov-refactor
    content: Refactorizar/encapsular `POST /api/inventario/movimiento` en un servicio (validaciones + persistencia Kardex) manteniendo el trigger como source of truth.
    status: completed
  - id: add-phpspreadsheet
    content: Añadir `phpoffice/phpspreadsheet` vía Composer y crear wrapper de lectura `.xlsx` en infraestructura.
    status: completed
  - id: import-endpoint
    content: Crear endpoint `POST /api/inventario/import-excel` (multipart `file`) que parsea la plantilla por `codigo_barras` y genera lotes + movimientos ENTRADA en transacción.
    status: completed
  - id: repos-and-queries
    content: "Agregar métodos/repositorios necesarios: buscar producto por `codigo_barras`, upsert/lookup de lote por clave única, insertar movimientos."
    status: completed
  - id: verify-fire-test
    content: Implementar verificación básica post-import (conteos y consistencia Kardex vs lotes) y respuestas de error por fila.
    status: completed
isProject: false
---

## Objetivo
- Implementar en backend la **Fase 3**: 
  - `POST /api/inventario/movimiento` (Kardex) como única vía para modificar stock.
  - **Carga masiva Excel** (`.xlsx`) para poblar `lotes` y registrar movimiento `ENTRADA` inicial.

## Decisiones (según tus respuestas)
- **Plantilla Excel por código de barras**: columnas mínimas: `codigo_barras`, `codigo_lote`, `fecha_vencimiento` (YYYY-MM-DD), `costo_unitario`, `cantidad`.
- **Upload multipart/form-data**: archivo en campo `file`.

## Alineación a documentación
- La integridad de stock es **Kardex-driven** como indica `docs/Documentation/ArquitecturayDefiniciónTécnica.txt`: nadie debe actualizar `lotes.stock_actual` directo.
- FEFO y semáforo se consumen luego vía consultas ordenadas por `fecha_vencimiento` y reglas de bloqueo.

## Organización SOLID propuesta (backend)
- **Rutas**: delgadas, solo validan entrada/salida.
  - `src/API/routes/inventario.php` (ya tiene `handlePostMovimientoInventario()` y `handleGetFefo()`/`alertas`).
  - Agregar una ruta nueva para importación (p.ej. `POST /api/inventario/import-excel`).
- **Servicios de dominio/aplicación** (lógica):
  - `src/Domain/Services/InventarioMovimientoService.php`: valida reglas (no negativos, bloqueo vencimiento) y ejecuta el INSERT a `movimientos_inventario`.
  - `src/Domain/Services/InventarioImportService.php`: orquesta el import (parseo + upserts de lotes + movimientos ENTRADA), usando transacciones por lote o por archivo.
- **Infraestructura** (parsing Excel):
  - `src/Infrastructure/Services/ExcelXlsxReader.php` (wrapper de PhpSpreadsheet) para convertir el archivo a filas normalizadas.
- **Persistencia**:
  - Reusar `src/Infrastructure/Persistence/ProductoRepository.php` para resolver `producto_id` por `codigo_barras` (añadir método `findByCodigoBarras()` si no existe).
  - Crear `LoteRepository` y `MovimientoInventarioRepository` si hace falta aislar SQL.

## Carga masiva: flujo exacto
1. Endpoint recibe archivo `.xlsx` (`multipart/form-data`, campo `file`).
2. Parsear filas y validar:
   - `codigo_barras` obligatorio
   - `codigo_lote` obligatorio
   - `fecha_vencimiento` formato YYYY-MM-DD (permitir null solo si definimos caso AJUSTE)
   - `cantidad > 0`
   - `costo_unitario >= 0`
3. Por cada fila:
   - Resolver `producto_id` desde `productos.codigo_barras`.
   - Crear/obtener lote por clave única `(producto_id, farmacia_id, codigo_lote)`.
   - Insertar movimiento `ENTRADA` con `cantidad` al lote (deja que el trigger actualice stock).
4. Responder resumen:
   - filas procesadas OK
   - filas con error (y motivo)
   - lotes creados/encontrados
   - movimientos creados

## Dependencias (Composer)
- Agregar `phpoffice/phpspreadsheet` a `composer.json` y regenerar autoload.

## Prueba de fuego (según cronograma)
- Tras importar, verificar que:
  - `SUM(lotes.stock_actual)` para un producto/farmacia coincide con la suma de movimientos ENTRADA/SALIDA/RESERVA/LIBERACION.
  - No hay lotes duplicados por `(producto_id, farmacia_id, codigo_lote)`.
