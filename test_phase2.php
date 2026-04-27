<?php
/**
 * PharmaQuick - Test Script
 * Ejecuta pruebas de validación del backend Fase 2
 */

$baseUrl = 'http://nginx/api';
$results = [];

// Helper function
function test($name, $method, $endpoint, $headers = [], $body = null, $expectedCode = 200) {
    global $baseUrl, $results;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $decoded = json_decode($response, true);
    
    $passed = $httpCode === $expectedCode;
    $results[] = [
        'name' => $name,
        'method' => $method,
        'endpoint' => $endpoint,
        'expected' => $expectedCode,
        'actual' => $httpCode,
        'passed' => $passed,
        'response' => $decoded
    ];
    
    $status = $passed ? 'PASS' : 'FAIL';
    echo "$status: $name (expected $expectedCode, got $httpCode)\n";
    
    return $passed;
}

echo "=== PHARMAQUICK FASE 2 - PRUEBAS ===\n\n";

// ============================================================
// 1. AUTENTICACION
// ============================================================
echo "--- 1. AUTENTICACION ---\n";

// 1.1 Login exitoso
$loginResponse = test(
    'Login exitoso', 
    'POST', 
    '/api/auth/login',
    ['Content-Type: application/json'],
    '{"email": "admin@pharmaquick.com", "password": "password"}',
    200
);

$token = '';
if ($loginResponse && isset($decoded['data']['token'])) {
    $token = $decoded['data']['token'];
    echo "Token obtenido: " . substr($token, 0, 30) . "...\n";
}

// Get token for farmacia 2 user to test multi-tenant
$loginResponse2 = curl_init();
curl_setopt($loginResponse2, CURLOPT_URL, $baseUrl . '/api/auth/login');
curl_setopt($loginResponse2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($loginResponse2, CURLOPT_POST, true);
curl_setopt($loginResponse2, CURLOPT_POSTFIELDS, '{"email": "vendedor2@pharmaquick.com", "password": "password"}');
curl_setopt($loginResponse2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$resp2 = curl_exec($loginResponse2);
$httpCode2 = curl_getinfo($loginResponse2, CURLINFO_HTTP_CODE);
curl_close($loginResponse2);
$decoded2 = json_decode($resp2, true);
$token2 = $decoded2['data']['token'] ?? '';

echo "\nToken Farmacia 2: " . ($token2 ? 'obtenido' : 'ERROR') . "\n";

// ============================================================
// 2. PRODUCTOS
// ============================================================
echo "\n--- 2. PRODUCTOS ---\n";

test(
    'GET productos sin auth',
    'GET',
    '/api/productos',
    [],
    null,
    401
);

test(
    'GET productos con auth',
    'GET',
    '/api/productos',
    ['Authorization: Bearer ' . $token],
    null,
    200
);

test(
    'GET producto por ID',
    'GET',
    '/api/productos/1',
    ['Authorization: Bearer ' . $token],
    null,
    200
);

// ============================================================
// 3. PRECIOS
// ============================================================
echo "\n--- 3. PRECIOS ---\n";

test(
    'GET precios con auth',
    'GET',
    '/api/precios',
    ['Authorization: Bearer ' . $token],
    null,
    200
);

test(
    'POST crear precio',
    'POST',
    '/api/precios',
    ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
    '{"producto_id": 1, "precio": 1500.00, "activar": true}',
    201
);

// ============================================================
// 4. MULTI-TENANT
// ============================================================
echo "\n--- 4. MULTI-TENANT ---\n";

// Get precios as user from farm 1
$test1 = curl_init();
curl_setopt($test1, CURLOPT_URL, $baseUrl . '/api/precios');
curl_setopt($test1, CURLOPT_RETURNTRANSFER, true);
curl_setopt($test1, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
$res1 = curl_exec($test1);
$code1 = curl_getinfo($test1, CURLINFO_HTTP_CODE);
curl_close($test1);
$data1 = json_decode($res1, true);

// Get precios as user from farm 2
$test2 = curl_init();
curl_setopt($test2, CURLOPT_URL, $baseUrl . '/api/precios');
curl_setopt($test2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($test2, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token2]);
$res2 = curl_exec($test2);
$code2 = curl_getinfo($test2, CURLINFO_HTTP_CODE);
curl_close($test2);
$data2 = json_decode($res2, true);

$passed = ($code1 === 200 && $code2 === 200);
$results[] = ['name' => 'Multi-tenant precios', 'passed' => $passed, 'expected' => 200, 'actual' => "$code1/$code2"];
echo ($passed ? 'PASS' : 'FAIL') . ":Multi-tenant precios (farm1:$code1, farm2:$code2)\n";

echo "\n=== RESUMEN ===\n";
$passed = 0;
$failed = 0;
foreach ($results as $r) {
    if ($r['passed']) $passed++;
    else $failed++;
}
echo "Total: " . count($results) . " pruebas\n";
echo "Pasadas: $passed\n";
echo "Fallidas: $failed\n";

exit($failed > 0 ? 1 : 0);