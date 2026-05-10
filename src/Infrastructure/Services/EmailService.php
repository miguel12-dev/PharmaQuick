<?php

declare(strict_types=1);

/**
 * PharmaQuick - Email Service
 *
 * Servicio para envío de correos electrónicos usando SMTP
 * Configuración tomada del .env
 * 
 * @version 1.0.0
 */

class EmailService {
    private string $host;
    private int $port;
    private string $username;
    private string $password;
    private string $encryption;
    private string $fromAddress;
    private string $fromName;
    
    private ?object $smtp = null;
    
    public function __construct(
        ?string $host = null,
        ?int $port = null,
        ?string $username = null,
        ?string $password = null,
        ?string $encryption = null,
        ?string $fromAddress = null,
        ?string $fromName = null
    ) {
        // Leer desde .env o usar valores por defecto
        $this->host = $host ?? getenv('MAIL_HOST') ?: 'smtp.gmail.com';
        $this->port = $port ?? (int)(getenv('MAIL_PORT') ?: 587);
        $this->username = $username ?? getenv('MAIL_USERNAME') ?: '';
        $this->password = $password ?? getenv('MAIL_PASSWORD') ?: '';
        $this->encryption = $encryption ?? getenv('MAIL_ENCRYPTION') ?: 'tls';
        $this->fromAddress = $fromAddress ?? getenv('MAIL_FROM_ADDRESS') ?: 'noreply@pharmaquick.com';
        $this->fromName = $fromName ?? getenv('MAIL_FROM_NAME') ?: 'PharmaQuick';
    }
    
    /**
     * Verificar si el servicio está configurado
     */
    public function isConfigured(): bool {
        return !empty($this->username) && !empty($this->password);
    }
    
    /**
     * Enviar correo de confirmación de compra
     */
    public function sendPurchaseConfirmation(
        string $toEmail,
        string $customerName,
        string $orderCode,
        float $total,
        string $paymentMethod,
        string $deliveryMethod,
        ?string $deliveryAddress = null,
        array $items = []
    ): bool {
        if (!$this->isConfigured()) {
            error_log("EmailService: SMTP no configurado");
            return false;
        }
        
        $subject = "Confirmación de tu pedido - PharmaQuick";
        
        // Construir cuerpo del correo
        $body = $this->buildPurchaseEmailBody(
            $customerName,
            $orderCode,
            $total,
            $paymentMethod,
            $deliveryMethod,
            $deliveryAddress,
            $items
        );
        
        return $this->send($toEmail, $subject, $body);
    }
    
    /**
     * Construir el cuerpo del correo de confirmación
     */
    private function buildPurchaseEmailBody(
        string $customerName,
        string $orderCode,
        float $total,
        string $paymentMethod,
        string $deliveryMethod,
        ?string $deliveryAddress,
        array $items
    ): string {
        $itemsHtml = '';
        foreach ($items as $item) {
            $subtotal = $item['cantidad'] * $item['precio_unitario'];
            $itemsHtml .= "<tr>
                <td style='padding: 8px; border: 1px solid #ddd;'>{$item['producto_nombre']}</td>
                <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{$item['cantidad']}</td>
                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>$" . number_format($item['precio_unitario'], 0, ',', '.') . "</td>
                <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>$" . number_format($subtotal, 0, ',', '.') . "</td>
            </tr>";
        }
        
        $deliveryInfo = $deliveryMethod === 'RECOGER' 
            ? '<p><strong>Tipo de entrega:</strong> Recoger en tienda (Apartado)</p>'
            : "<p><strong>Dirección de entrega:</strong> {$deliveryAddress}</p>";
        
        $paymentMethodLabel = $paymentMethod === 'NEQUI' ? 'Nequi' : 'Tarjeta';
        $deliveryMethodLabel = $deliveryMethod === 'RECOGER' ? 'Recoger en tienda' : 'Envío a domicilio';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;'>
    <div style='background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
        <div style='text-align: center; margin-bottom: 20px;'>
            <h1 style='color: #3eb489; margin: 0;'>💊 PharmaQuick</h1>
            <p style='color: #666; margin-top: 5px;'>Confirmación de tu pedido</p>
        </div>
        
        <div style='background: #e8f5e9; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 20px;'>
            <h2 style='color: #2e7d32; margin: 0;'>¡Pedido Confirmado!</h2>
            <p style='color: #666; margin: 5px 0 0 0;'>Código: <strong>{$orderCode}</strong></p>
        </div>
        
        <div style='margin-bottom: 20px;'>
            <p>Hola <strong>{$customerName}</strong>,</p>
            <p>Tu pedido ha sido procesado exitosamente. A continuación los detalles:</p>
        </div>
        
        <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
            <thead>
                <tr style='background: #3eb489; color: white;'>
                    <th style='padding: 10px; border: 1px solid #3eb489; text-align: left;'>Producto</th>
                    <th style='padding: 10px; border: 1px solid #3eb489; text-align: center;'>Cant.</th>
                    <th style='padding: 10px; border: 1px solid #3eb489; text-align: right;'>Precio</th>
                    <th style='padding: 10px; border: 1px solid #3eb489; text-align: right;'>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {$itemsHtml}
            </tbody>
        </table>
        
        <div style='background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 20px;'>
            <p style='margin: 5px 0;'><strong>Método de pago:</strong> {$paymentMethodLabel}</p>
            <p style='margin: 5px 0;'><strong>Método de entrega:</strong> {$deliveryMethodLabel}</p>
            {$deliveryInfo}
        </div>
        
        <div style='text-align: center; padding: 15px; background: #3eb489; border-radius: 8px;'>
            <span style='color: #666; font-size: 14px;'>Total pagado:</span>
            <span style='color: white; font-size: 24px; font-weight: bold;'>$ {number_format($total, 0, ',', '.')}</span>
        </div>
        
        <div style='margin-top: 20px; text-align: center; color: #666; font-size: 12px;'>
            <p>Gracias por confiar en PharmaQuick para tus necesidades de salud.</p>
            <p>Este correo fue enviado a {$toEmail}</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * Enviar correo usando SMTP
     */
    public function send(string $to, string $subject, string $body): bool {
        // Usar la función mail() de PHP con configuración SMTP básica
        // Para producción, se recomienda usar PHPMailer o SwiftMailer
        
        $headers = [];
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: text/html; charset=UTF-8";
        $headers[] = "From: {$this->fromName} <{$this->fromAddress}>";
        $headers[] = "Reply-To: {$this->fromAddress}";
        
        $headerString = implode("\r\n", $headers);
        
        // Intentar enviar usando mail()
        $result = @mail($to, $subject, $body, $headerString);
        
        if (!$result) {
            // Log del error
            $error = error_get_last();
            error_log("EmailService Error: " . ($error['message'] ?? 'Unknown error'));
        }
        
        return $result;
    }
}