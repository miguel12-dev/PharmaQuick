<?php

declare(strict_types=1);

/**
 * PharmaQuick - Excepciones
 *
 * @version 1.0.0
 */

// =========================================================
// NO HAY NAMESPACE - clases globales
// =========================================================

class PharmaException extends \Exception {
    protected $context = [];
    
    public function __construct(string $message, int $code = 0, \Throwable $previous = null, array $context = []) {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }
}

class DatabaseException extends PharmaException {
    public function __construct(string $message) {
        parent::__construct($message, 500);
    }
}

class AuthenticationException extends PharmaException {
    public function __construct(string $message = 'Credenciales invalidas') {
        parent::__construct($message, 401);
    }
}