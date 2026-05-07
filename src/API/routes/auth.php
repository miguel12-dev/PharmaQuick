<?php

declare(strict_types=1);

/**
 * PharmaQuick - Rutas de Autenticación
 * 
 * Maneja el login y logout (rutas públicas, SIN middleware JWT)
 * OPTIMIZADO: Usa singleton de AuthService
 * @version 1.1.0
 */

// Singleton de AuthService para reuse
static $authService = null;
if ($authService === null) {
    $authService = new AuthService(1);
}

function handleAuthLogin(): void {
    global $authService;
    
    // Soporta tanto JSON como FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $postData = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $postData = [];
        parse_str(file_get_contents('php://input'), $postData);
        $postData = array_merge($postData, $_POST);
    }
    
    $email = $postData['email'] ?? '';
    $password = $postData['password'] ?? '';

    if (empty($email) || empty($password)) {
        JsonResponse::error('Email y contrasena son requeridos', 400);
        return;
    }

    try {
        $result = $authService->login($email, $password);

        JsonResponse::authSuccess(1, $result['user'], $result['token'], 'Autenticacion exitosa');

    } catch (AuthenticationException $e) {
        JsonResponse::error($e->getMessage(), 401);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}