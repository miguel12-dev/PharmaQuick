<?php

declare(strict_types=1);

namespace PharmaQuick\Domain\Services;

use PDO;
use Exception;
use PharmaQuick\Infrastructure\Persistence\VentaRepository;
use PharmaQuick\Infrastructure\Persistence\LoteRepository;

class VentaService {
    private VentaRepository $ventaRepo;
    private LoteRepository $loteRepo;
    private InventarioMovimientoService $movService;
    private PDO $pdo;

    public function __construct(
        VentaRepository $ventaRepo,
        LoteRepository $loteRepo,
        InventarioMovimientoService $movService,
        PDO $pdo
    ) {
        $this->ventaRepo = $ventaRepo;
        $this->loteRepo = $loteRepo;
        $this->movService = $movService;
        $this->pdo = $pdo;
    }

    /**
     * @param array $datos {cliente_nombre, cliente_documento, descuento, items: [{lote_id, cantidad, precio}]}
     */
    public function procesarVenta(array $datos, int $farmaciaId, int $usuarioId): int {
        if (empty($datos['items'])) {
            throw new Exception("La venta no contiene items.");
        }

        try {
            $this->pdo->beginTransaction();

            $total = 0;
            foreach ($datos['items'] as $item) {
                $sub = (float)$item['cantidad'] * (float)$item['precio'];
                $total += $sub;
            }
            $descuento = isset($datos['descuento']) ? (float)$datos['descuento'] : 0;
            $totalFinal = max(0, $total - $descuento);

            $ventaId = $this->ventaRepo->create([
                'farmacia_id' => $farmaciaId,
                'usuario_id' => $usuarioId,
                'cliente_nombre' => $datos['cliente_nombre'] ?? null,
                'cliente_documento' => $datos['cliente_documento'] ?? null,
                'total' => $totalFinal,
                'descuento' => $descuento,
                'estado' => 'COMPLETADA'
            ]);

            foreach ($datos['items'] as $item) {
                $loteId = (int)$item['lote_id'];
                $cantidad = (float)$item['cantidad'];
                $precio = (float)$item['precio'];
                $subtotal = $cantidad * $precio;

                $stmt = $this->pdo->prepare("SELECT stock_actual FROM lotes WHERE id = :id AND farmacia_id = :farmacia FOR UPDATE");
                $stmt->execute([':id' => $loteId, ':farmacia' => $farmaciaId]);
                $lote = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$lote) {
                    throw new Exception("Lote $loteId no encontrado para la farmacia.");
                }
                if ((float)$lote['stock_actual'] < $cantidad) {
                    throw new Exception("Stock insuficiente para el lote $loteId. Disponible: {$lote['stock_actual']}, Requerido: $cantidad.");
                }

                $this->ventaRepo->createDetalle([
                    'venta_id' => $ventaId,
                    'lote_id' => $loteId,
                    'cantidad' => $cantidad,
                    'precio' => $precio,
                    'subtotal' => $subtotal
                ]);

                // Registrar salida en inventario (esto disparara el trigger para descontar stock)
                $this->movService->registrarMovimiento([
                    'lote_id' => $loteId,
                    'farmacia_id' => $farmaciaId,
                    'usuario_id' => $usuarioId,
                    'tipo' => 'SALIDA',
                    'cantidad' => $cantidad,
                    'descripcion' => "Venta #$ventaId"
                ]);
            }

            $this->pdo->commit();
            return $ventaId;
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }
}
