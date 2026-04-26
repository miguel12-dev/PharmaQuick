# PharmaQuick - Ejemplos curl para Fase 2
# 
# Autenticación y pruebas de Productos y Precios
# =========================================

# 1. LOGIN - Obtener token JWT
echo "=== 1. LOGIN ==="
curl -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pharmaquick.com",
    "password": "password"
  }'

# Guardar el token en variable (bash):
# TOKEN=$(curl -s -X POST "http://localhost/api/auth/login" ... | jq -r '.data.token')


# =========================================
# PRODUCTOS
# =========================================

# 2. GET - Listar productos de la farmacia
echo ""
echo "=== 2. GET PRODUCTOS ==="
curl -X GET "http://localhost/api/productos" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 3. POST - Crear producto
echo ""
echo "=== 3. CREAR PRODUCTO ==="
curl -X POST "http://localhost/api/productos" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Paracetamol 500mg",
    "codigo_barras": "7891234567890",
    "descripcion": "Analgésico y antipirético",
    "categoria": "Analgésicos",
    "presentación": "Tabletas x 10"
  }'

# 4. GET - Obtener producto por ID
echo ""
echo "=== 4. GET PRODUCTO POR ID ==="
curl -X GET "http://localhost/api/productos/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 5. PUT - Actualizar producto
echo ""
echo "=== 5. ACTUALIZAR PRODUCTO ==="
curl -X PUT "http://localhost/api/productos/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Paracetamol 500mg",
    "descripcion": "Analgésico y antipirético - NUEVA DESCRIPCIÓN",
    "categoria": "Analgésicos",
    "presentacion": "Tabletas x 20",
    "activo": true
  }'

# 6. DELETE - Eliminar producto (soft delete)
echo ""
echo "=== 6. ELIMINAR PRODUCTO ==="
curl -X DELETE "http://localhost/api/productos/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 7. SEARCH - Buscar productos
echo ""
echo "=== 7. BUSCAR PRODUCTOS ==="
curl -X GET "http://localhost/api/productos/search?q=para" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"


# =========================================
# PRECIOS
# =========================================

# 8. GET - Listar todos los precios
echo ""
echo "=== 8. GET PRECIOS ==="
curl -X GET "http://localhost/api/precios" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 9. POST - Crear y activar precio
echo ""
echo "=== 9. CREAR PRECIO (activar) ==="
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "precio": 1250.00,
    "activar": true
  }'

# 10. POST - Crear precio sin activar
echo ""
echo "=== 10. CREAR PRECIO (sin activar) ==="
curl -X POST "http://localhost/api/precios" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "precio": 1100.00,
    "activar": false
  }'

# 11. GET - Ver precios de un producto
echo ""
echo "=== 11. GET PRECIOS POR PRODUCTO ==="
curl -X GET "http://localhost/api/precios/producto/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 12. PUT - Activar un precio existente
echo ""
echo "=== 12. ACTIVAR PRECIO ==="
curl -X PUT "http://localhost/api/precios/2" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "activar": true
  }'

# 13. PUT - Actualizar precio sin activar
echo ""
echo "=== 13. ACTUALIZAR PRECIO ==="
curl -X PUT "http://localhost/api/precios/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "precio": 1300.00
  }'

# 14. DELETE - Eliminar precio
echo ""
echo "=== 14. ELIMINAR PRECIO ==="
curl -X DELETE "http://localhost/api/precios/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"


# =========================================
# NOTAS IMPORTANTES
# =========================================
#
# 1. El token JWT debe incluirse en el header: Authorization: Bearer <token>
# 2. El farmacia_id se obtiene del JWT, NO del request
# 3. Los precios son por farmacia, no globales
# 4. Solo puede haber UN precio activo por producto/farmacia
# 5. Al activar un precio, se automáticamnete desactivan los demás
#
# Multi-tenant seguro:
# - farmaco_id viene desde Auth::farmaciaId()
# - Nunca se confia en datos del frontend para aislar tenants
# - Todas las queries filtran por farmacia_id desde JWT