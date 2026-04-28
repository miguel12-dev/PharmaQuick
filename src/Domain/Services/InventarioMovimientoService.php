<?php

declare(strict_types=1);

namespace PharmaQuick\Domain\Services;

use PharmaQuick\Infrastructure\Persistence\LoteRepository;
use PharmaQuick\Infrastructure\Persistence\MovimientoInventarioRepository;
use RuntimeException;

/**
 * PharmaQuick - InventarioMovimientoService
 * 
 * Lógica de negocio para movimientos de stock (Kardex).
 */
class InventarioMovimientoService {
    private LoteRepository $loteRepo;
    private MovimientoInventarioRepository $movRepo;

    public function __construct(LoteRepository $loteRepo, MovimientoInventarioRepository $movRepo) {
        $this->loteRepo = $loteRepo;
        $this->movRepo = $movRepo;
    }

    /**
     * Registra un movimiento de inventario validando reglas de negocio.
     */
    public function registrarMovimiento(array $data): int {
        $loteId = (int)($data['lote_id'] ?? 0);
        $farmaciaId = (int)($data['farmacia_id'] ?? 0);
        $tipo = strtoupper(trim((string)($data['tipo'] ?? '')));
        $cantidad = (int)($data['cantidad'] ?? 0);
        $usuarioId = (int)($data['usuario_id'] ?? 0);

        // 1. Validaciones básicas
        if ($loteId <= 0 || $farmaciaId <= 0 || $usuarioId <= 0) {
            throw new RuntimeException("Datos incompletos para el movimiento.");
        }
        if ($cantidad <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a cero.");
        }

        $allowed = ['ENTRADA', 'SALIDA', 'RESERVA', 'LIBERACION'];
        if (!in_array($tipo, $allowed, true)) {
            throw new RuntimeException("Tipo de movimiento '$tipo' no permitido.");
        }

        // 2. Obtener lote y validar pertenencia
        $lote = $this->loteRepo->findById($loteId, $farmaciaId);
        if (!$lote) {
            throw new RuntimeException("Lote no encontrado o no pertenece a la farmacia.");
        }

        // 3. Política FEFO - Bloqueo preventivo
        if (in_array($tipo, ['SALIDA', 'RESERVA'], true)) {
            if ($this->loteEstaBloqueadoPorVencimiento($lote['fecha_vencimiento'])) {
                throw new RuntimeException("Movimiento bloqueado: el lote está por vencer o ya venció.");
            }
        }

        // 4. Validar disponibilidad (pre-trigger check)
        $stockActual = (int)$lote['stock_actual'];
        $stockReservado = (int)$lote['stock_reservado'];


        if ($tipo === 'SALIDA' && $cantidad > $stockActual) {
            throw new RuntimeException("Stock insuficiente en el lote.");
        }
        if ($tipo === 'RESERVA' && $cantidad > $stockActual) {
            throw new RuntimeException("Stock insuficiente para reservar.");
        }
        if ($tipo === 'LIBERACION' && $cantidad > $stockReservado) {
            throw new RuntimeException("No hay suficiente stock reservado para liberar.");
        }

        // 5. Persistir
        return $this->movRepo->create([
            'lote_id' => $loteId,
            'farmacia_id' => $farmaciaId,
            'usuario_id' => $usuarioId,
            'tipo' => $tipo,
            'cantidad' => $cantidad,
            'descripcion' => $data['descripcion'] ?? null
        ]);
    }

    private function loteEstaBloqueadoPorVencimiento(?string $fechaVencimiento): bool {
        if (!$fechaVencimiento) return false;
        
        $minDias = $this->getMinDiasBloqueo();
        $v = new \DateTimeImmutable($fechaVencimiento);
        $hoy = new \DateTimeImmutable('today');
        $diff = (int)$hoy->diff($v)->format('%r%a');
        
        return $diff < $minDias;
    }

    private function getMinDiasBloqueo(): int {
        $val = $_ENV['PQ_FEFO_BLOQUEO_DIAS'] ?? $_SERVER['PQ_FEFO_BLOQUEO_DIAS'] ?? null;
        $n = is_numeric($val) ? (int)$val : 15;
        return max(0, $n);
    }
}
