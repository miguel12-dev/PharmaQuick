<?php

declare(strict_types=1);

function handleGetPerfil(): void {
    try {
        require_once SRC_PATH . '/API/Middleware/JwtMiddleware.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/UsuarioRepository.php';

        $userId = Auth::userId();
        $farmaciaId = Auth::farmaciaId();

        if (!$userId || !$farmaciaId) {
            JsonResponse::error('Contexto de autenticación inválido', 401);
            return;
        }

        $cluster = (int) ceil($farmaciaId / 5);
        $cluster = $cluster < 1 ? 1 : $cluster;
        $pdo = PDOFactory::getCluster($cluster);
        $repo = new UsuarioRepository($pdo);
        $user = $repo->findProfileById($userId);

        if (!$user) {
            JsonResponse::error('Usuario no encontrado', 404);
            return;
        }

        $farmaciaNombre = $repo->findFarmaciaNameById((int) $user['farmacia_id']);
        $user['farmacia_nombre'] = $farmaciaNombre ?? ('Farmacia #' . (int) $user['farmacia_id']);

        JsonResponse::success(['perfil' => $user], 200);
    } catch (\Throwable $e) {
        JsonResponse::error('Error al obtener perfil: ' . $e->getMessage(), 500);
    }
}

function handlePutPerfilPassword(): void {
    try {
        require_once SRC_PATH . '/API/Middleware/JwtMiddleware.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/PDOFactory.php';
        require_once SRC_PATH . '/Infrastructure/Persistence/UsuarioRepository.php';

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $password = (string) ($body['password'] ?? '');
        $passwordConfirm = (string) ($body['password_confirm'] ?? '');

        if ($password === '' || $passwordConfirm === '') {
            JsonResponse::error('La nueva contraseña y su confirmación son requeridas', 400);
            return;
        }

        if ($password !== $passwordConfirm) {
            JsonResponse::error('La confirmación de contraseña no coincide', 400);
            return;
        }

        if (strlen($password) < 8) {
            JsonResponse::error('La contraseña debe tener al menos 8 caracteres', 400);
            return;
        }

        $userId = Auth::userId();
        $farmaciaId = Auth::farmaciaId();
        if (!$userId || !$farmaciaId) {
            JsonResponse::error('Contexto de autenticación inválido', 401);
            return;
        }

        $cluster = (int) ceil($farmaciaId / 5);
        $cluster = $cluster < 1 ? 1 : $cluster;
        $pdo = PDOFactory::getCluster($cluster);
        $repo = new UsuarioRepository($pdo);
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $updated = $repo->updatePassword($userId, $passwordHash);

        if (!$updated) {
            JsonResponse::error('No fue posible actualizar la contraseña', 500);
            return;
        }

        JsonResponse::success(['message' => 'Contraseña actualizada correctamente'], 200);
    } catch (\Throwable $e) {
        JsonResponse::error('Error al actualizar contraseña: ' . $e->getMessage(), 500);
    }
}
