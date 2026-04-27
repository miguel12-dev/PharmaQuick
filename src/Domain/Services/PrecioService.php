<?php

declare(strict_types=1);

/**
 * PharmaQuick - PrecioService
 *
 * Servicio de precios con lógica de activación única
 * 
 * @version 1.0.0
 */

class PrecioService {
    private PrecioRepository $repository;
    private ?ProductoRepository $productoRepository;

    public function __construct(PrecioRepository $repository, ?ProductoRepository $productoRepository = null) {
        $this->repository = $repository;
        $this->productoRepository = $productoRepository;
    }

    /**
     * Permite injectar ProductoRepository para validaciones
     */
    public function setProductoRepository(ProductoRepository $repo): void {
        $this->productoRepository = $repo;
    }

    /**
     * Crea un precio y lo activa automáticamente (desactivando los demás)
     */
    public function crearYActivar(int $productoId, int $farmaciaId, float $precio): array {
        // Validar precio positivo
        if ($precio <= 0) {
            throw new InvalidArgumentException('El precio debe ser mayor a 0');
        }

        // Verificar que el producto exista
        $this->validarProducto($productoId);

        // Crear el nuevo precio
        $precioId = $this->repository->create($productoId, $farmaciaId, $precio);

        // Activar este precio (desactiva los demás automáticamente)
        $this->repository->activate($precioId, $productoId, $farmaciaId);

        return $this->repository->findActiveByProducto($productoId, $farmaciaId);
    }

    /**
     * Crea un precio sin activar (permite múltiples precios inactivos)
     */
    public function crear(int $productoId, int $farmaciaId, float $precio, bool $activo = false): int {
        if ($precio <= 0) {
            throw new InvalidArgumentException('El precio debe ser mayor a 0');
        }

        $this->validarProducto($productoId);

        return $this->repository->create($productoId, $farmaciaId, $precio, $activo);
    }

    /**
     * Activa un precio específico (desactiva todos los demás para ese producto/farmacia)
     */
    public function activar(int $precioId, int $productoId, int $farmaciaId): array {
        $success = $this->repository->activate($precioId, $productoId, $farmaciaId);
        
        if (!$success) {
            throw new RuntimeException('No se pudo activar el precio. Verifique que pertenezca a su farmacia.');
        }

        return $this->repository->findActiveByProducto($productoId, $farmaciaId);
    }

    /**
     * Desactiva todos los precios de un producto (useful para productos descontinuados)
     */
    public function desactivarTodo(int $productoId, int $farmaciaId): int {
        return $this->repository->deactivateAll($productoId, $farmaciaId);
    }

    /**
     * Actualiza el precio de un registro existente
     */
    public function actualizar(int $precioId, int $farmaciaId, float $precio): bool {
        if ($precio <= 0) {
            throw new InvalidArgumentException('El precio debe ser mayor a 0');
        }

        return $this->repository->update($precioId, $farmaciaId, $precio);
    }

    /**
     * Elimina un precio
     */
    public function eliminar(int $precioId, int $farmaciaId): bool {
        return $this->repository->delete($precioId, $farmaciaId);
    }

    /**
     * Obtiene el precio activo de un producto
     */
    public function getPrecioActivo(int $productoId, int $farmaciaId): ?array {
        return $this->repository->findActiveByProducto($productoId, $farmaciaId);
    }

    /**
     * Obtiene todos los precios de un producto
     */
    public function getTodos(int $productoId, int $farmaciaId): array {
        return $this->repository->findAllByProducto($productoId, $farmaciaId);
    }

    /**
     * Obtiene todos los precios de una farmacia
     */
    public function getPorFarmacia(int $farmaciaId): array {
        return $this->repository->findWithProductoByFarmacia($farmaciaId);
    }

    /**
     * Valida que un producto existe
     */
    private function validarProducto(int $productoId): void {
        if ($productoId <= 0) {
            throw new InvalidArgumentException('ID de producto inválido');
        }
        
        // Si tenemos ProductoRepository, verificamos existencia real
        if ($this->productoRepository !== null) {
            $producto = $this->productoRepository->findByIdGlobal($productoId);
            if (!$producto) {
                throw new InvalidArgumentException('Producto no existe');
            }
        }
    }
}