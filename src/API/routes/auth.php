<?php

declare(strict_types=1);

// Cargar EmailService
require_once SRC_PATH . '/Infrastructure/Services/EmailService.php';

/**
 * PharmaQuick - Rutas de Autenticación
 * 
 * Maneja el login y logout (rutas públicas, SIN middleware JWT)
 * OPTIMIZADO: Usa singleton de AuthService
 * @version 1.2.0
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

function handleAuthRegister(): void {
    global $authService;
    
    $postData = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $email = $postData['email'] ?? '';
    $password = $postData['password'] ?? '';
    $nombre = $postData['nombre'] ?? null;

    if (empty($email) || empty($password)) {
        JsonResponse::error('Email y contrasena son requeridos', 400);
        return;
    }

    try {
        $result = $authService->register($email, $password, $nombre);
        
        // Enviar correo de bienvenida con credenciales
        $emailService = new EmailService();
        $emailSent = $emailService->sendWelcomeEmail(
            $email,
            $nombre ?? '',
            $password
        );
        
        $responseMessage = 'Registro exitoso. Ya puede iniciar sesion.';
        if ($emailSent) {
            $responseMessage .= ' Te hemos enviado un correo con tus credenciales.';
        }
        
        JsonResponse::success($result, $responseMessage, 201);
    } catch (AuthenticationException $e) {
        JsonResponse::error($e->getMessage(), 400);
    } catch (\Throwable $e) {
        JsonResponse::error('Error: ' . $e->getMessage(), 500);
    }
}