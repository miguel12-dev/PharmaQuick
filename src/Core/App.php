<?php

declare(strict_types=1);

/**
 * PharmaQuick - App
 */

class App {
    const BASE_PATH = '/var/www/html';
    const SRC_PATH = '/var/www/html/src';
    const TIMEZONE = 'America/Bogota';
    const DEBUG = true;

    public static function bootstrap(): void {
        date_default_timezone_set(self::TIMEZONE);
        if (self::DEBUG) {
            error_reporting(E_ALL);
            ini_set('display_errors', '1');
        }
    }
}