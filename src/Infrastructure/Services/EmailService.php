<?php

declare(strict_types=1);

// Cargar PHPMailer
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * PharmaQuick - Email Service
 *
 * Servicio para envío de correos electrónicos usando PHPMailer con SMTP
 * Configuración tomada del .env
 * 
 * @version 2.0.0
 */

class EmailService {
    private string $host;
    private int $port;
    private string $username;
    private string $password;
    private string $encryption;
    private string $fromAddress;
    private string $fromName;
    private string $appUrl;
    
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
        $this->appUrl = getenv('APP_URL') ?: 'http://localhost:8080';
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
        $logoUrl = $this->appUrl . '/image/logo_pharmaQuick.png';
        
        $itemsHtml = '';
        foreach ($items as $item) {
            $subtotal = $item['cantidad'] * $item['precio_unitario'];
            $itemsHtml .= "<tr>
                <td style='padding: 10px 8px; border: 1px solid #e0e0e0;'>{$item['producto_nombre']}</td>
                <td style='padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;'>{$item['cantidad']}</td>
                <td style='padding: 10px 8px; border: 1px solid #e0e0e0; text-align: right;'>$" . number_format($item['precio_unitario'], 0, ',', '.') . "</td>
                <td style='padding: 10px 8px; border: 1px solid #e0e0e0; text-align: right;'>$" . number_format($subtotal, 0, ',', '.') . "</td>
            </tr>";
        }
        
        $deliveryInfo = $deliveryMethod === 'RECOGER' 
            ? '<p style="margin: 5px 0;"><strong>Tipo de entrega:</strong> Recoger en tienda (Apartado)</p>'
            : "<p style=\"margin: 5px 0;\"><strong>Dirección de entrega:</strong> {$deliveryAddress}</p>";
        
        $paymentMethodLabel = $paymentMethod === 'NEQUI' ? 'Nequi' : 'Tarjeta Débito/Crédito';
        $deliveryMethodLabel = $deliveryMethod === 'RECOGER' ? 'Recoger en tienda' : 'Envío a domicilio';
        
        // Iconos para métodos de pago y entrega
        $paymentIcon = $paymentMethod === 'NEQUI' ? '📱' : '💳';
        $deliveryIcon = $deliveryMethod === 'RECOGER' ? '🏪' : '🚚';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f4f8;'>
    <!-- Header con logo -->
    <div style='background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;'>
        <img src='{$logoUrl}' alt='PharmaQuick' style='max-width: 180px; height: auto; display: inline-block;' />
    </div>
    
    <!-- Cuerpo principal -->
    <div style='background: white; border-radius: 0 0 10px 10px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
        <!-- Badge de confirmación -->
        <div style='background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); border-radius: 50px; padding: 12px 25px; text-align: center; margin-bottom: 25px; display: inline-block; width: 100%; box-sizing: border-box;'>
            <span style='color: white; font-size: 18px; font-weight: bold;'>✅ Pedido Confirmado</span>
        </div>
        
        <div style='text-align: center; margin-bottom: 25px;'>
            <p style='color: #666; margin: 0; font-size: 14px;'>Código de tu pedido:</p>
            <p style='color: #2d3436; font-size: 24px; font-weight: bold; margin: 5px 0 0 0; letter-spacing: 2px;'>{$orderCode}</p>
        </div>
        
        <!-- Saludo -->
        <div style='margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #00b894;'>
            <p style='margin: 0; color: #2d3436; font-size: 16px;'>Hola <strong style='color: #00b894;'>{$customerName}</strong>,</p>
            <p style='margin: 10px 0 0 0; color: #636e72; font-size: 14px;'>¡Tu pedido ha sido procesado exitosamente! 🎉</p>
        </div>
        
        <!-- Tabla de productos -->
        <div style='margin-bottom: 25px;'>
            <h3 style='color: #2d3436; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #00b894; padding-bottom: 10px;'>📦 Detalles del Pedido</h3>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 10px;'>
                <thead>
                    <tr style='background: #f0f4f8;'>
                        <th style='padding: 12px 8px; border: 1px solid #e0e0e0; text-align: left; font-size: 12px; color: #636e72; text-transform: uppercase;'>Producto</th>
                        <th style='padding: 12px 8px; border: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #636e72; text-transform: uppercase;'>Cant.</th>
                        <th style='padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right; font-size: 12px; color: #636e72; text-transform: uppercase;'>Precio</th>
                        <th style='padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right; font-size: 12px; color: #636e72; text-transform: uppercase;'>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
            </table>
        </div>
        
        <!-- Información de pago y entrega -->
        <div style='display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;'>
            <div style='flex: 1; min-width: 200px; background: #f8f9fa; border-radius: 10px; padding: 20px;'>
                <p style='margin: 0 0 10px 0; color: #636e72; font-size: 12px; text-transform: uppercase;'>💳 Método de Pago</p>
                <p style='margin: 0; color: #2d3436; font-size: 16px; font-weight: bold;'>{$paymentIcon} {$paymentMethodLabel}</p>
            </div>
            <div style='flex: 1; min-width: 200px; background: #f8f9fa; border-radius: 10px; padding: 20px;'>
                <p style='margin: 0 0 10px 0; color: #636e72; font-size: 12px; text-transform: uppercase;'>🚚 Método de Entrega</p>
                <p style='margin: 0; color: #2d3436; font-size: 16px; font-weight: bold;'>{$deliveryIcon} {$deliveryMethodLabel}</p>
                {$deliveryInfo}
            </div>
        </div>
        
        <!-- Total -->
        <div style='background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); border-radius: 10px; padding: 25px; text-align: center; margin-bottom: 25px;'>
            <span style='color: rgba(255,255,255,0.9); font-size: 14px;'>💰 Total Pagado</span>
            <div style='color: white; font-size: 32px; font-weight: bold; margin-top: 5px;'>$ {number_format($total, 0, ',', '.')}</div>
        </div>
        
        <!-- Footer -->
        <div style='text-align: center; color: #636e72; font-size: 13px; border-top: 1px solid #e0e0e0; padding-top: 20px;'>
            <p style='margin: 0 0 10px 0;'>💊 Gracias por confiar en <strong>PharmaQuick</strong> para tus necesidades de salud</p>
            <p style='margin: 0; color: #b2bec3; font-size: 11px;'>Este correo fue enviado a {$this->fromAddress}</p>
        </div>
    </div>
    
    <!-- Barra inferior -->
    <div style='text-align: center; padding: 20px; color: #636e72; font-size: 12px;'>
        <p style='margin: 0;'>📞 ¿Tienes dudas? Contáctanos en nuestra app o visita nuestra tienda</p>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * Enviar correo usando PHPMailer con SMTP
     */
    public function send(string $to, string $subject, string $body): bool {
        $mail = new PHPMailer(true);
        
        try {
            // Configuración del servidor SMTP
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->SMTPSecure = $this->encryption === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = $this->port;
            
            // Configuración del remitente
            $mail->setFrom($this->fromAddress, $this->fromName);
            $mail->addAddress($to);
            $mail->addReplyTo($this->fromAddress, 'Soporte PharmaQuick');
            
            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body); // Versión sin HTML para clientes de correo que no soporten HTML
            
            // Codificación
            $mail->CharSet = 'UTF-8';
            
            // Enviar correo
            $result = $mail->send();
            
            if ($result) {
                error_log("EmailService: Correo enviado exitosamente a {$to}");
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("EmailService Error: {$mail->ErrorInfo}");
            return false;
        }
    }
}