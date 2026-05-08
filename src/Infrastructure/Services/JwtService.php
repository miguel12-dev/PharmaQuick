<?php

declare(strict_types=1);

/**
 * PharmaQuick - JWT Service
 *
 * Servicio para generación y validación de JWT usando HS256
 * OPTIMIZADO: Uso singleton para evitar recrear instancias
 * 
 * @version 1.1.0
 */

class JwtService {
    private string $secretKey;
    private string $algorithm;
    private int $expirySeconds;
    
    // Singleton instance
    private static ?JwtService $instance = null;

    public function __construct(
        string $secretKey = 'pharmaquick_jwt_secret_key_2024',
        string $algorithm = 'HS256',
        int $expirySeconds = 3600
    ) {
        $this->secretKey = $secretKey;
        $this->algorithm = $algorithm;
        $this->expirySeconds = $expirySeconds;
    }
    
    /**
     * Get singleton instance - evita crear nuevas instancias
     */
    public static function getInstance(): JwtService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Genera un JWT para el usuario autenticado
     * OPTIMIZADO: menos operaciones
     */
    public function generate(array $payload): string {
        $time = time();
        $expiresAt = $time + $this->expirySeconds;

        // Generar todo en una sola operación JSON
        $headerPayload = '{"alg":"HS256","typ":"JWT","iss":"pharmaquick_api","iat":' . $time . ',"exp":' . $expiresAt . ',"sub":' . ($payload['sub'] ?? 0) . ',"email":"' . ($payload['email'] ?? '') . '","farmacia_id":' . ($payload['farmacia_id'] ?? 0) . '}';
        
        $headerEncoded = $this->base64UrlEncode($headerPayload);
        
        // Firma directa sin explode
        $signature = $this->sign($headerEncoded);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $headerEncoded . '.' . $signatureEncoded;
    }

    /**
     * Genera un JWT optimizado con datos del usuario
     * Este método es más eficiente que generate() cuando ya tienes los datos
     * 
     * @param int|null $farmaciaId Puede ser null para clientes globales (sin farmacia)
     */
    public function generateUserToken(int $userId, string $email, ?int $farmaciaId = null): string {
        $time = time();
        $expiresAt = $time + $this->expirySeconds;
        
        // JSON encode directo del payload
        $tokenPayload = json_encode([
            'iss' => 'pharmaquick_api',
            'iat' => $time,
            'exp' => $expiresAt,
            'sub' => $userId,
            'email' => $email,
            'farmacia_id' => $farmaciaId,
        ], JSON_FORCE_OBJECT);
        
        $headerPayload = '{"alg":"HS256","typ":"JWT","iss":"pharmaquick_api","iat":' . $time . ',"exp":' . $expiresAt . '}';
        
        $headerEncoded = $this->base64UrlEncode($headerPayload);
        $payloadEncoded = $this->base64UrlEncode($tokenPayload);
        
        $signature = $this->sign($headerEncoded . '.' . $payloadEncoded);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * Valida y decodifica un JWT
     * 
     * @return array|false Datos del token o false si es inválido
     */
    public function validate(string $token): array|false {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verificar firma
        $expectedSignature = $this->sign($headerEncoded . '.' . $payloadEncoded);
        $expectedSignatureEncoded = $this->base64UrlEncode($expectedSignature);

        if (!hash_equals($expectedSignatureEncoded, $signatureEncoded)) {
            return false;
        }

        // Decodificar payload
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);

        if (!$payload || !isset($payload['exp'])) {
            return false;
        }

        // Verificar expiración
        if ($payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Extrae el payload sin validar firma (para debugging)
     */
    public function decodeWithoutValidation(string $token): array|false {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }

        return json_decode($this->base64UrlDecode($parts[1]), true);
    }

    /**
     * Genera la firma HMAC
     */
    private function sign(string $data): string {
        return hash_hmac('sha256', $data, $this->secretKey, true);
    }

    /**
     * Codifica en base64url (sin padding)
     */
    private function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decodifica desde base64url
     */
    private function base64UrlDecode(string $data): string {
        $padding = strlen($data) % 4;
        if ($padding) {
            $data .= str_repeat('=', 4 - $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}