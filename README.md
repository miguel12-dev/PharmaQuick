# PharmaQuick - Plataforma Integral para Farmacias

PharmaQuick es un ecosistema multi-tenant diseñado para la gestión moderna de farmacias, combinando un potente **Punto de Venta (POS)**, gestión inteligente de **Inventario (FEFO)** y una **Tienda E-commerce** integrada.

> **Estado Actual:** v1.2.0 (Premium Dashboard Update)
> **Stack:** Docker (LEMP), Vanilla JS (SPA), JWT Auth, MySQL 8.0 (Clustering)

---

## 🚀 Funcionalidades Principales

### 💎 Dashboard Administrativo (Nuevo)
- **Visualización Premium**: Interfaz basada en *Glassmorphism* con la identidad visual verde menta de la marca.
- **Métricas en Tiempo Real**: Resumen de ventas diarias, transacciones y alertas críticas.
- **Omnicanalidad**: Integración de ventas físicas (POS) y ventas digitales (E-commerce) en un solo panel.

### 📦 Gestión de Inventario Inteligente (FEFO)
- **Control de Lotes**: Seguimiento detallado por fecha de vencimiento y costo unitario.
- **Semáforo de Alertas**: Sistema visual de criticidad (Rojo < 90 días, Amarillo < 180 días).
- **Kardex Automático**: Registro inmutable de movimientos (Entradas, Salidas, Ajustes).

### 🛒 E-commerce & Ventas
- **Catálogo Público**: Buscador debounced con carga asíncrona de productos.
- **Carrito & Checkout**: Proceso de compra para clientes finales integrado con `pharma_master`.
- **Módulo POS**: Interfaz de venta rápida para mostrador con selección automática de lotes (FEFO).

---

## 🏗️ Arquitectura Técnica

### Frontend (SPA)
La aplicación funciona como una **SPA (Single Page Application)** pura:
- **Router.js**: Sistema de enrutamiento dinámico basado en hash/path.
- **Componentes**: Arquitectura modular con servicios y controladores independientes.
- **Estética**: Diseño moderno utilizando Vanilla CSS con variables CSS3 para temas dinámicos.

### Backend (Multi-tenant & Clustering)
- **Aislamiento de Datos**: Cada farmacia pertenece a un cluster específico según su ID.
- **Clustering SQL**: Distribución de carga entre `db_cluster_1`, `db_cluster_2`, etc.
- **Base Central**: `pharma_master` gestiona usuarios globales, farmacias y compras e-commerce.

---

## 🛠️ Guía de Inicio Rápido

1. **Levantar Entorno**:
   ```powershell
   docker-compose up -d
   ```
2. **Accesos Locales**:

| Servicio | URL | Credenciales |
|---------|-----|------------|
| **Plataforma (Web)** | http://localhost:8080 | admin@pharmaquick.com / password |
| **phpMyAdmin** | http://localhost:8081 | root / root_pharma_2024 |
| **MySQL (Directo)** | localhost:3307 | root / root_pharma_2024 |

---

## 📉 Próximos Pasos & Roadmap
- [ ] Generación de Reportes PDF de Ventas
- [ ] Módulo de Facturación Electrónica
- [ ] Optimización de Imágenes (WebP)

---
*PharmaQuick v1.4.1 - Desarrollado para la excelencia farmacéutica.*