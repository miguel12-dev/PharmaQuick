# Plan de Pruebas - Fase 2 PharmaQuick

## 1. Autenticación

### 1.1 Login Exitoso
```bash
curl -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmaquick.com", "password": "password"}'
```
- **Esperado**: HTTP 200
- **Respuesta**: `{ "success": true, "data": { "token": "..." } }`

### 1.2 Login con Credenciales Incorrectas
```bash
curl -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmaquick.com", "password": "wrongpass"}'
```
- **Esperado**: HTTP 401
- **Respuesta**: `{ "success": false, "message": "Credenciales invalidas" }`

### 1.3 Login con Usuario Inactivo
```bash
# Primero, cambiar un usuario a inactivo en la BD:
# UPDATE usuarios SET activo = FALSE WHERE email = 'vendedor@pharmaquick.com';

# Luego intentar login:
curl -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "vendedor@pharmaquick.com", "password": "password"}'
```
- **Esperado**: HTTP 401
- **Respuesta**: `{ "success": false, "message": "Credenciales invalidas" }`

### 1.4 JWT Expirado
```bash
# Usar un token expirado o manipular la fecha exp
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer token_expirado"
```
- **Esperado**: HTTP 401
- **Respuesta**: `{ "success": false, "message": "Token invalido o expirado" }`

---

## 2. Multi-Tenant

### 2.1 Aislamiento de Productos por Farmacia
```bash
# Login como usuario de farmacia 1
TOKEN_F1=$(curl -s -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmaquick.com", "password": "password"}' | jq -r '.data.token')

# Login como usuario de farmacia 2
TOKEN_F2=$(curl -s -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "vendedor2@pharmaquick.com", "password": "password"}' | jq -r '.data.token')

# Consultar productos de farmacia 1
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F1"

# Consultar productos de farmacia 2
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F2"
```
- **Esperado**: Diferentes listas de productos para cada farmacia

### 2.2 Aislamiento de Precios por Farmacia
```bash
# Login como usuario de farmacia 1
curl -X GET "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F1"

# Login como usuario de farmacia 2  
curl -X GET "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F2"
```
- **Esperado**: Diferentes precios para cada farmacia

### 2.3 Intento de Acceso por ID Directo
```bash
# Intentar acceder a precio de otra farmacia usando ID directo
curl -X GET "http://localhost/api/precios/1" \
  -H "Authorization: Bearer $TOKEN_F2"
```
- **Esperado**: HTTP 404 (el precio no pertenece a la farmacia del token)

---

## 3. Productos

### 3.1 GET /api/productos (Listar)
```bash
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: HTTP 200, lista de productos activos con stock > 0

### 3.2 GET /api/productos/{id} (Ver por ID)
```bash
curl -X GET "http://localhost/api/productos/1" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: HTTP 200, datos del producto

### 3.3 GET /api/productos/search?q= (Buscar)
```bash
curl -X GET "http://localhost/api/productos/search?q=para" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: HTTP 200, productos que coinciden

### 3.4 POST /api/productos (Crear - Solo Admin)
```bash
curl -X POST "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Producto", "codigo_barras": "1234567890123"}'
```
- **Esperado como ADMIN**: HTTP 201
- **Esperado como USUARIO**: HTTP 403

### 3.5 PUT /api/productos/{id} (Actualizar - Solo Admin)
```bash
curl -X PUT "http://localhost/api/productos/1" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Nueva descripcion"}'
```
- **Esperado como ADMIN**: HTTP 200
- **Esperado como USUARIO**: HTTP 403

### 3.6 DELETE /api/productos/{id} (Eliminar - Solo Admin)
```bash
curl -X DELETE "http://localhost/api/productos/1" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado como ADMIN**: HTTP 200 (soft delete)
- **Esperado como USUARIO**: HTTP 403
- **Verificar**: Producto pasa a activo = 0

---

## 4. Precios

### 4.1 GET /api/precios (Listar todos)
```bash
curl -X GET "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: HTTP 200, lista de precios con nombres de productos

### 4.2 POST /api/precios (Crear precio)
```bash
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "precio": 1500.00, "activar": true}'
```
- **Esperado**: HTTP 201, precio creado y activado

### 4.3 Crear múltiples precios para mismo producto
```bash
# Primer precio
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "precio": 1000.00, "activar": true}'

# Segundo precio
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "precio": 1200.00, "activar": true}'
```
- **Esperado**: Solo un precio activo (el ultimo creado)

### 4.4 Verificar regla de un solo precio activo
```bash
curl -X GET "http://localhost/api/precios/producto/1" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: Solo 1 precio con `activo: true`

### 4.5 PUT /api/precios/{id} (Activar precio)
```bash
# Obtener ID de un precio inactivo
curl -X GET "http://localhost/api/precios/producto/1" \
  -H "Authorization: Bearer $TOKEN_F1" | jq '.data.precios[] | select(.activo == false)'

# Activar ese precio
curl -X PUT "http://localhost/api/precios/2" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "Content-Type: application/json" \
  -d '{"activar": true}'
```
- **Esperado**: El precio anterior se desactiva, este se activa

### 4.6 DELETE /api/precios/{id} (Eliminar precio)
```bash
curl -X DELETE "http://localhost/api/precios/1" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: HTTP 200, precio eliminado

---

## 5. Seguridad

### 5.1 Acceso sin Token
```bash
curl -X GET "http://localhost/api/productos"
```
- **Esperado**: HTTP 401

### 5.2 Token malformado
```bash
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer token_invalido"
```
- **Esperado**: HTTP 401

### 5.3 SQL Injection básica
```bash
curl -X GET "http://localhost/api/productos/search?q=' OR '1'='1" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**:HTTP 200 (con datos seguros, no revela todo)

### 5.4 Intento de Manipulation de Header
```bash
# Modificar el header para otra farmacia
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F1" \
  -H "X-Farmacia-ID: 2"
```
- **Esperado**: Se ignora el header X-Farmacia-ID, usa solo la del JWT

---

## 6. Verificación de Consistencia

### 6.1 Verificar que usuarios inactivos no pueden usar JWT
```sql
-- En la BD:
UPDATE usuarios SET activo = FALSE WHERE email = 'vendedor@pharmaquick.com';

-- Intentar usar JWT existente:
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer {JWT_ANTERIOR}"
```
- **Esperado**: HTTP 401 con mensaje de error apropiado

### 6.2 Verificar productos inactivos no aparecen
```sql
-- En la BD:
UPDATE productos SET activo = FALSE WHERE id = 1;

-- Consultar:
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer $TOKEN_F1"
```
- **Esperado**: El producto 1 NO aparece en la lista

### 6.3 Verificar precios huérfanos
```sql
-- Verificar que no existen precios sin producto
SELECT p.id, p.producto_id 
FROM precios p 
LEFT JOIN productos pr ON p.producto_id = pr.id 
WHERE pr.id IS NULL;
```
- **Esperado**: Sin resultados (0 precios huérfanos)

---

## 7. Resultados Esperados - Resumen

| Prueba | HTTP Code | Resultado |
|--------|-----------|----------|
| Login válido | 200 | Token retornado |
| Login inválido | 401 | Error credentials |
| Usuario inactivo login | 401 | Error credentials |
| Usuario inactivo JWT | 401 | Error usuario inactivo |
| GET productos (auth) | 200 | Lista productos |
| POST productos (admin) | 201 | Producto creado |
| POST productos (user) | 403 | Forbidden |
| GET precios farm1 | 200 | Precios farm1 |
| GET precios farm2 | 200 | Precios farm2 (distintos) |
| Crear precio | 201 | Precio creado |
| Activar precio | 200 | Precio activado |
| Acceso sin token | 401 | Forbidden |
| SQL Injection | 200 (o 400) | Sin datos comprometidos |

---

## 8. Ejecución Secuencial

Para ejecutar todas las pruebas de forma secuencial:

```bash
#!/bin/bash
BASE_URL="http://localhost/api"

# 1. Login
echo "=== 1. Login ==="
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pharmaquick.com", "password": "password"}' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Productos
echo "=== GET Productos ==="
curl -s -X GET "$BASE_URL/productos" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Precios
echo "=== GET Precios ==="
curl -s -X GET "$BASE_URL/precios" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Crear precio
echo "=== POST Precio ==="
curl -s -X POST "$BASE_URL/precios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "precio": 1000.00, "activar": true}' | jq '.'

# 5. Ver precios por producto
echo "=== GET Precios x Producto ==="
curl -s -X GET "$BASE_URL/precios/producto/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

*Plan de pruebas generado para validación de Fase 2 - PharmaQuick*