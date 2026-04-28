<?php

/**
 * PharmaQuick - Entry Point
 */

define('BASE_PATH', dirname(__DIR__));
define('SRC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'src');
define('PUBLIC_PATH', BASE_PATH . DIRECTORY_SEPARATOR . 'public');

require_once SRC_PATH . DIRECTORY_SEPARATOR . 'API' . DIRECTORY_SEPARATOR . 'Router.php';