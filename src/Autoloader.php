<?php

declare(strict_types=1);

/**
 * PharmaQuick - Autoloader PSR-4
 *
 * Carga automaticamente las clases del proyecto basandose en namespaces.
 *
 * @package PharmaQuick
 * @version 1.0.0
 */

namespace PharmaQuick;

/**
 * Autoloader simple para el proyecto.
 * Sigue el estandar PSR-4.
 *
 * @since 1.0.0
 */
final class Autoloader
{
    /** @var array Mapeo de namespaces a paths */
    private static $paths = [
        'PharmaQuick\\Core\\' => __DIR__ . '/../src/Core/',
        'PharmaQuick\\Domain\\' => __DIR__ . '/../src/Domain/',
        'PharmaQuick\\Infrastructure\\' => __DIR__ . '/../src/Infrastructure/',
        'PharmaQuick\\API\\' => __DIR__ . '/../src/API/',
    ];

    /**
     * Registra el autoloader en SPL.
     *
     * @return void
     *
     * @since 1.0.0
     */
    public static function register(): void
    {
        spl_autoload_register(self::load(...));
    }

    /**
     * Carga una clase basandose en su namespace.
     *
     * @param string $class Nombre completo de la clase
     * @return bool True si la clase fue cargada
     *
     * @since 1.0.0
     */
    public static function load(string $class): bool
    {
        foreach (self::$paths as $prefix => $path) {
            if (str_starts_with($class, $prefix)) {
                $relativeClass = substr($class, strlen($prefix));
                $filePath = $path . str_replace('\\', '/', $relativeClass) . '.php';

                if (file_exists($filePath)) {
                    require_once $filePath;
                    return true;
                }
            }
        }

        return false;
    }
}

// Registrar autoloader al incluir este archivo
Autoloader::register();