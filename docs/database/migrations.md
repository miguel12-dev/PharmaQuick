# Documentación de Migraciones - Compras de Cliente

## Resumen

Se implementó un sistema de compras simuladas para clientes que guarda los datos en la base de datos real, haciendo el proceso más realista y sostenible.

## Estructura de Archivos

```
src/
├── Database/
│   └── migrations/
│       └── 001_compras_cliente.sql    # Script de migración
├── API/
│   ├── routes/
│   │   └── compras_cliente.php       # Rutas API
│   └── Router.php                     # Actualizado con nuevas rutas
└── ...

public/frontend/
├── modules/
│   └── shopping/
│       └── ShoppingService.js         # Servicio frontend
└── pages/
    └── ClientShoppingPage.js          # Actualizado para usar backend
```

## Tablas Creadas

### 1. `compras_cliente`
Almacena las compras realizadas por los clientes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGINT UNSIGNED | ID único(auto-increment) |
| usuario_id | BIGINT UNSIGNED | FK al usuario cliente |
| farmacia_id | INT UNSIGNED | FK a la farmacia |
| codigo_pedido | VARCHAR(20) | Código único del pedido |
| total | DECIMAL(12,2) | Total de la compra |
| metodo_pago | ENUM('TARJETA','NEQUI') | Método de pago usado |
| estado | ENUM('PENDIENTE','CONFIRMADA','CANCELADA','ENTREGADA') | Estado de la compra |
| direccion_envio | VARCHAR(255) | Dirección de entrega |
| nombre_recibe | VARCHAR(100) | Nombre de quien recibe |
| telefono_contacto | VARCHAR(20) | Teléfono de contacto |
| observaciones | TEXT | Notas adicionales |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de actualización |

### 2. `compras_detalle`
Detalle de los productos en cada compra.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGINT UNSIGNED | ID único |
| compra_id | BIGINT UNSIGNED | FK a compras_cliente |
| producto_id | BIGINT UNSIGNED | FK al producto |
| producto_nombre | VARCHAR(150) | Nombre del producto (desnormalizado) |
| cantidad | INT UNSIGNED | Cantidad comprada |
| precio_unitario | DECIMAL(12,2) | Precio por unidad |
| subtotal | DECIMAL(12,2) | Cantidad × precio |
| created_at | TIMESTAMP | Fecha de creación |

### 3. `metodos_pago_cliente` (opcional)
Métodos de pago guardados por el cliente para checkout rápido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGINT UNSIGNED | ID único |
| usuario_id | BIGINT UNSIGNED | FK al usuario |
| tipo | ENUM('TARJETA','NEQUI') | Tipo de método |
| ultimo_digito | VARCHAR(4) | Últimos 4 dígitos (tarjeta) |
| tipo_tarjeta | VARCHAR(20) | Visa, Mastercard, etc. |
| telefono | VARCHAR(20) | Teléfono Nequi |
| activo | BOOLEAN | Si está activo |
| created_at | TIMESTAMP | Fecha de creación |

## Rutas API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/compras` | Crear nueva compra |
| GET | `/api/compras` | Listar compras del cliente |
| GET | `/api/compras/{codigo}` | Obtener compra específica |
| POST | `/api/compras/metodo-pago` | Guardar método de pago |
| GET | `/api/compras/metodos-pago` | Listar métodos de pago |

## Cómo Aplicar la Migración

### Opción 1: Ejecutar directamente en MySQL

```bash
mysql -u usuario -p pharmaquick < src/Database/migrations/001_compras_cliente.sql
```

### Opción 2: Desde PHPMyAdmin o Adminer

1. Abrir la herramienta de administración de base de datos
2. Seleccionar la base de datos `pharmaquick`
3. Importar el archivo `001_compras_cliente.sql`

### Opción 3: Desde código PHP

```php
$migrationFile = __DIR__ . '/src/Database/migrations/001_compras_cliente.sql';
$pdo = PDOFactory::getCluster(1);
$sql = file_get_contents($migrationFile);
$pdo->exec($sql);
```

## Integración con Frontend

El `ClientShoppingPage.js` ahora:

1. **Carga compras desde el backend** usando `ShoppingService`
2. **Guarda compras en la base de datos** al procesar el pago
3. **Mantiene fallback local** si el backend no está disponible

### Flujo de datos:

```
1. Usuario completa el checkout
       ↓
2. ClientShoppingPage.processPayment()
       ↓
3. ShoppingService.createPurchase() → POST /api/compras
       ↓
4. Backend: compras_cliente + compras_detalle
       ↓
5. Respuesta exitosa → Mostrar confirmación
```

## Notas Importantes

- Las rutas API están actualmente **públicas** (sin JWT) para facilitar testing
- En producción, agregar validación JWT en el Router
- El código de pedido se genera automáticamente con formato `PED-XXXXXXXX`
- Los productos se guardan con información desnormalizada (nombre) para evitar dependencias

## Verificación

Para verificar que la migración se aplicó correctamente:

```sql
SHOW TABLES LIKE 'compras%';
-- Debe mostrar: compras_cliente, compras_detalle, metodos_pago_cliente

DESCRIBE compras_cliente;
-- Debe mostrar todas las columnas definidas
```

---

**Fecha de creación:** 2026-05-09
**Versión:** 1.0.0