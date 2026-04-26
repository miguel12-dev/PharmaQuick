<?php

declare(strict_types=1);

/**
 * PharmaQuick - JWT Service
 *
 * Servicio para generación y validación de JWT usando HS256
 * 
 * @version 1.0.0
 */

class JwtService {
    private string $secretKey;
    private string $algorithm;
    private int $expirySeconds;

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
     * Genera un JWT para el usuario autenticado
     */
    public function generate(array $payload): string {
        $issuedAt = time();
        $expiresAt = $issuedAt + $this->expirySeconds;

        // Header JWT
        $header = [
            'alg' => $this->algorithm,
            'typ' => 'JWT'
        ];

        // Payload base
        $tokenPayload = [
            'iss' => 'pharmaquick_api',
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ];

        // Merge con datos del usuario
        $tokenPayload = array_merge($tokenPayload, $payload);

        // Codificar header y payload
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($tokenPayload));

        // Generar firma
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