<?php

declare(strict_types=1);

// Cargar PHPMailer via autoload global
require_once '/var/www/html/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * PharmaQuick - Email Service
 *
 * Servicio para envío de correos electrónicos usando PHPMailer con SMTP
 * Configuración tomada del .env
 * 
 * @version 2.1.0
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
     * Enviar correo de bienvenida con credenciales de registro
     */
    public function sendWelcomeEmail(
        string $toEmail,
        string $customerName,
        string $password
    ): bool {
        if (!$this->isConfigured()) {
            error_log("EmailService: SMTP no configurado");
            return false;
        }
        
        $subject = "Bienvenido a PharmaQuick - Tus credenciales de acceso";
        
        $body = $this->buildWelcomeEmailBody($customerName, $toEmail, $password);
        
        return $this->sendWithEmbeddedImage($toEmail, $subject, $body);
    }

    /**
     * Enviar correo de recuperación de contraseña
     */
    public function sendPasswordRecoveryEmail(
        string $toEmail,
        string $token
    ): bool {
        if (!$this->isConfigured()) {
            error_log("EmailService: SMTP no configurado");
            return false;
        }
        
        $subject = "Recupera tu contraseña - PharmaQuick";
        
        $body = $this->buildPasswordRecoveryEmailBody($toEmail, $token);
        
        return $this->sendWithEmbeddedImage($toEmail, $subject, $body);
    }

    /**
     * Construir el cuerpo del correo de recuperación
     */
    private function buildPasswordRecoveryEmailBody(
        string $email,
        string $token
    ): string {
        $resetUrl = $this->appUrl . '/recover-password?token=' . $token;
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recupera tu contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Contenedor principal -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                    <!-- Header con logo -->
                    <tr>
                        <td style="background: #ffffff; padding: 35px 30px 25px 30px; text-align: center;">
                            <img src="cid:logo_pharmaquick" alt="PharmaQuick" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
                        </td>
                    </tr>
                    <!-- Barra decorativa -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); padding: 0 30px; height: 8px;"></td>
                    </tr>
                    
                    <!-- Contenido -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            <!-- Badge -->
                            <div style="background: linear-gradient(135deg, #e17055 0%, #d63031 100%); border-radius: 30px; padding: 10px 20px; text-align: center; margin-bottom: 30px;">
                                <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">🔐 RECUPERAR CONTRASEÑA</span>
                            </div>
                            
                            <!-- Saludo -->
                            <h1 style="margin: 0 0 15px 0; color: #1a1a2e; font-size: 24px; font-weight: 700; text-align: center;">
                                ¿Olvidaste tu contraseña?
                            </h1>
                            <p style="margin: 0 0 30px 0; color: #636e72; font-size: 15px; line-height: 1.6; text-align: center;">
                                Recebimos una solicitud para restablecer la contraseña de tu cuenta.
                            </p>
                            
                            <!-- Aviso importante -->
                            <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    <strong>⚠️ Importante:</strong> Este enlace caduca en 1 hora. Si no solicitaste este cambio, ignora este correo.
                                </p>
                            </div>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="{$resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: #ffffff; padding: 16px 45px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 184, 148, 0.4);">Restablecer mi Contraseña</a>
                            </div>
                            
                            <!-- Informações adicionales -->
                            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #636e72; font-size: 13px;">
                                    <strong>¿No solicitaste este cambio?</strong>
                                </p>
                                <p style="margin: 0; color: #636e72; font-size: 13px;">
                                    Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 25px 35px; text-align: center; border-top: 1px solid #e8e8e8;">
                            <p style="margin: 0 0 8px 0; color: #636e72; font-size: 14px;">
                                💊 <strong style="color: #00b894;">PharmaQuick</strong> - Tu salud, nuestra prioridad
                            </p>
                            <p style="margin: 0; color: #b2bec3; font-size: 12px;">
                                Este correo fue enviado a {$email}
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Copyright -->
                <p style="margin: 25px 0 0 0; color: #b2bec3; font-size: 12px; text-align: center;">
                    © 2026 PharmaQuick. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
    
    /**
     * Enviar correo con imagen embebida
     */
    private function sendWithEmbeddedImage(string $to, string $subject, string $body): bool {
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
            
            // Adjuntar logo como imagen embebida
            $logoPath = '/var/www/html/public/image/logo_pharmaQuick.png';
            if (file_exists($logoPath)) {
                $mail->addEmbeddedImage($logoPath, 'logo_pharmaquick', 'logo_pharmaQuick.png', 'base64', 'image/png');
            }
            
            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body);
            
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
    
    /**
     * Construir el cuerpo del correo de bienvenida
     */
    private function buildWelcomeEmailBody(
        string $customerName,
        string $email,
        string $password
    ): string {
        $loginUrl = $this->appUrl . '/#/login';
        $greeting = !empty($customerName) ? $customerName : 'Cliente';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a PharmaQuick</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Contenedor principal -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                    <!-- Header con logo (fondo blanco para que se vea el logo) -->
                    <tr>
                        <td style="background: #ffffff; padding: 35px 30px 25px 30px; text-align: center;">
                            <img src="cid:logo_pharmaquick" alt="PharmaQuick" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
                        </td>
                    </tr>
                    <!-- Barra decorativa con gradiente -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); padding: 0 30px; height: 8px;"></td>
                    </tr>
                    
                    <!-- Contenido -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            <!-- Badge de bienvenida -->
                            <div style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); border-radius: 30px; padding: 10px 20px; text-align: center; margin-bottom: 30px;">
                                <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">🎉 ¡BIENVENIDO!</span>
                            </div>
                            
                            <!-- Saludo -->
                            <h1 style="margin: 0 0 15px 0; color: #1a1a2e; font-size: 24px; font-weight: 700; text-align: center;">
                                Hola, {$greeting}
                            </h1>
                            <p style="margin: 0 0 30px 0; color: #636e72; font-size: 15px; line-height: 1.6; text-align: center;">
                                Tu cuenta ha sido creada exitosamente. Ahora puedes comprar tus medicamentos de forma rápida y segura.
                            </p>
                            
                            <!-- Credenciales -->
                            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e8e8e8;">
                                <h2 style="margin: 0 0 20px 0; color: #1a1a2e; font-size: 16px; font-weight: 600; text-align: center;">
                                    🔐 Tus Credenciales
                                </h2>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e8e8e8;">
                                            <p style="margin: 0; color: #636e72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Correo electrónico</p>
                                            <p style="margin: 5px 0 0 0; color: #1a1a2e; font-size: 16px; font-weight: 600; word-break: break-all;">{$email}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <p style="margin: 0; color: #636e72; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña</p>
                                            <p style="margin: 5px 0 0 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">{$password}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="{$loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: #ffffff; padding: 16px 45px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 184, 148, 0.4);">Iniciar Sesión</a>
                            </div>
                            
                            <!-- Consejos de seguridad -->
                            <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
                                <h3 style="margin: 0 0 12px 0; color: #1a1a2e; font-size: 14px; font-weight: 600;">🛡️ Recomendaciones de seguridad</h3>
                                <ul style="margin: 0; padding-left: 18px; color: #636e72; font-size: 13px; line-height: 1.8;">
                                    <li>Te recomendamos cambiar tu contraseña después del primer inicio de sesión</li>
                                    <li>No compartas tus credenciales con nadie</li>
                                    <li>Mantén tu correo electrónico seguro</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 25px 35px; text-align: center; border-top: 1px solid #e8e8e8;">
                            <p style="margin: 0 0 8px 0; color: #636e72; font-size: 14px;">
                                💊 Gracias por confiar en <strong style="color: #00b894;">PharmaQuick</strong>
                            </p>
                            <p style="margin: 0; color: #b2bec3; font-size: 12px;">
                                Este correo fue enviado a {$email}
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Copyright -->
                <p style="margin: 25px 0 0 0; color: #b2bec3; font-size: 12px; text-align: center;">
                    © 2026 PharmaQuick. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
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
     * Construir el cuerpo del correo de confirmación de compra
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
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->SMTPSecure = $this->encryption === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = $this->port;
            
            $mail->setFrom($this->fromAddress, $this->fromName);
            $mail->addAddress($to);
            $mail->addReplyTo($this->fromAddress, 'Soporte PharmaQuick');
            
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body);
            
            $mail->CharSet = 'UTF-8';
            
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
