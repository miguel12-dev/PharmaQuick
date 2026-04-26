# =========================================================
# PharmaQuick - PHP 8.2-FPM Dockerfile
# Extensiones: pdo_mysql, gd, zip, bcmath
# Composer instalado para gestion de dependencias
# =========================================================

FROM php:8.2-fpm

# ------------------------------------------------------------
# Metadatos
# ------------------------------------------------------------
LABEL maintainer="PharmaQuick Dev Team"\
    description="PHP 8.2-FPM con extensiones pharma"\
    VERSION="1.0.0"

# ------------------------------------------------------------
# Actualizacion de paquetes y dependencias del sistema
# ------------------------------------------------------------
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Instalacion de Composer
# ------------------------------------------------------------
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Configuracion de Composer
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV COMPOSER_HOME=/tmp/composer
ENV COMPOSER_CACHE_DIR=/tmp/composer/cache

# ------------------------------------------------------------
# Compilacion e instalacion de extensiones PHP
# ------------------------------------------------------------

# GD (extension para procesamiento de imagenes)
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd

# PDO MySQL (driver para base de datos)
RUN docker-php-ext-install -j$(nproc) pdo_mysql

# ZIP (soporte para archivos comprimidos)
RUN docker-php-ext-install -j$(nproc) zip

# BCMATH (funciones matematicas de precision)
RUN docker-php-ext-install -j$(nproc) bcmath

# Intl (soporte para internacionalizacion)
RUN docker-php-ext-install -j$(nproc) intl

# ------------------------------------------------------------
# Configuracion de PHP
# ------------------------------------------------------------
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# ------------------------------------------------------------
# Permisos y limpieza
# ------------------------------------------------------------
RUN mkdir -p /var/www/html && \
    chown -R www-data:www-data /var/www/html

WORKDIR /var/www/html

# ------------------------------------------------------------
# Exposicion de puertos
# ------------------------------------------------------------
EXPOSE 9000

# ------------------------------------------------------------
# Comando de inicio
# ------------------------------------------------------------
CMD ["php-fpm"]