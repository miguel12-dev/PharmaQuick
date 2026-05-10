<?php

declare(strict_types=1);

namespace PharmaQuick\Domain\Services;

use PDO;
use Exception;
use PharmaQuick\Infrastructure\Persistence\ReservaRepository;
use PharmaQuick\Infrastructure\Persistence\LoteRepository;

class ReservaService {
    private ReservaRepository $reservaRepo;
    private LoteRepository $loteRepo;
    private InventarioMovimientoService $movService;
    private PDO $pdo;

    public function __construct(
        ReservaRepository $reservaRepo,
        LoteRepository $loteRepo,
        InventarioMovimientoService $movService,
        PDO $pdo
    ) {
        $this->reservaRepo = $reservaRepo;
        $this->loteRepo = $loteRepo;
        $this->movService = $movService;
        $this->pdo = $pdo;
    }

    public function crearReserva(array $datos, int $farmaciaId, int $usuarioId): int {
        try {
            $this->pdo->beginTransaction();

            $loteId = (int)$datos['lote_id'];
            $cantidad = (float)$datos['cantidad'];

            $stmt = $this->pdo->prepare("SELECT stock_actual FROM lotes WHERE id = :id AND farmacia_id = :farmacia FOR UPDATE");
            $stmt->execute([':id' => $loteId, ':farmacia' => $farmaciaId]);
            $lote = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$lote) {
                throw new Exception("Lote $loteId no encontrado.");
            }
            if ((float)$lote['stock_actual'] < $cantidad) {
                throw new Exception("Stock insuficiente para reservar. Disponible: {$lote['stock_actual']}.");
            }

            $fechaExp = date('Y-m-d H:i:s', strtotime('+24 hours'));
            if (!empty($datos['horas_duracion'])) {
                $horas = (int)$datos['horas_duracion'];
                $fechaExp = date('Y-m-d H:i:s', strtotime("+$horas hours"));
            }

            $reservaId = $this->reservaRepo->create([
                'farmacia_id' => $farmaciaId,
                'cliente_id' => $datos['cliente_id'] ?? null,
                'lote_id' => $loteId,
                'cantidad' => $cantidad,
                'estado' => 'ACTIVA',
                'fecha_expiracion' => $fechaExp
            ]);

            $this->movService->registrarMovimiento([
                'lote_id' => $loteId,
                'farmacia_id' => $farmaciaId,
                'usuario_id' => $usuarioId,
                'tipo' => 'RESERVA',
                'cantidad' => $cantidad,
                'descripcion' => "Reserva #$reservaId"
            ]);

            $this->pdo->commit();
            return $reservaId;
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function expirarReservas(int $usuarioIdAdmin = 1): int {
        $expiradas = $this->reservaRepo->getReservasExpiradasParaCron();
        if (empty($expiradas)) {
            return 0;
        }

        $count = 0;
        foreach ($expiradas as $res) {
            try {
                $this->pdo->beginTransaction();
                
                // Actualizar estado
                $upd = $this->pdo->prepare("UPDATE reservas SET estado = 'EXPIRADA' WHERE id = :id AND estado = 'ACTIVA'");
                $upd->execute([':id' => $res['id']]);
                
                if ($upd->rowCount() > 0) {
                    // Retornar al inventario
                    $this->movService->registrarMovimiento([
                        'lote_id' => $res['lote_id'],
                        'farmacia_id' => $res['farmacia_id'],
                        'usuario_id' => $usuarioIdAdmin,
                        'tipo' => 'LIBERACION',
                        'cantidad' => $res['cantidad'],
                        'descripcion' => "Expiración auto. Reserva #" . $res['id']
                    ]);
                    $count++;
                }
                $this->pdo->commit();
            } catch (Exception $e) {
                if ($this->pdo->inTransaction()) {
                    $this->pdo->rollBack();
                }
                // Continue with next instead of failing the whole cron
            }
        }
        return $count;
    }
}
