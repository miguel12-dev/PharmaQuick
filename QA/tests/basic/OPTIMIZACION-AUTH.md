# PharmaQuick - Comparativa de Optimizaciones Auth API
# Resultados de测试

## Resumen de Optimizaciones Aplicadas

### 1. JwtService - Singleton Pattern
- Added `getInstance()` para reuse de instancia
- Optimizado `generateUserToken()` con json_encode directo

### 2. AuthService - Singleton
- Usa JwtService::getInstance() en lugar de `new JwtService()`

### 3. auth.php - Singleton
- AuthService se crea una sola vez y se reuse

### 4. UsuarioRepository
- Agregado LIMIT 1 a la query

## Resultados Métricos

| Test | p50 | p95 | p99 | mean | requests |
|------|-----|-----|-----|------|---------|
| Original | 85.6ms | 133ms | 162.4ms | 88ms | 1625 |
| Optimizado | 87.4ms | 115.6ms | 135.7ms | 79.6ms | 2500 |

## Mejora Porcentual

- p95: **13% más rápido**
- p99: **16% más rápido**  
- mean: **10% más rápido**

## Notas

El p50 stayed igual porque el cuello de botella principal sigue siendo:
1. MySQL connection (network)
2. password_verify() (cryptographic - intentionally slow)
3. PHP file loading (dev only - con PHP-FPM stays in memory)

## Archivos Modificados

- `src/Infrastructure/Services/JwtService.php`
- `src/Infrastructure/Services/AuthService.php`
- `src/API/routes/auth.php`
- `src/Infrastructure/Persistence/UsuarioRepository.php`

## Archivo de Test

- `QA/tests/basic/auth-login-v2.yaml`