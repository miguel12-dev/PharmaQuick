<?php

declare(strict_types=1);

namespace PharmaQuick\Domain\Services;

use PharmaQuick\Infrastructure\Persistence\LoteRepository;
use PharmaQuick\Infrastructure\Services\ExcelXlsxReader;
use PDO;
use RuntimeException;

/**
 * PharmaQuick - InventarioImportService
 */
class InventarioImportService {
    private ExcelXlsxReader $excelReader;
    private \ProductoRepository $productoRepo;
    private LoteRepository $loteRepo;
    private InventarioMovimientoService $movService;
    private PDO $pdo;

    public function __construct(
        ExcelXlsxReader $excelReader,
        \ProductoRepository $productoRepo,
        LoteRepository $loteRepo,
        InventarioMovimientoService $movService,
        PDO $pdo
    ) {
        $this->excelReader = $excelReader;
        $this->productoRepo = $productoRepo;
        $this->loteRepo = $loteRepo;
        $this->movService = $movService;
        $this->pdo = $pdo;
    }

    /**
     * Procesa un archivo Excel para carga masiva de inventario.
     */
    public function import(string $filePath, int $farmaciaId, int $usuarioId): array {
        $rows = $this->excelReader->read($filePath);
        $summary = [
            'total_filas' => count($rows),
            'procesados_ok' => 0,
            'errores' => [],
            'lotes_afectados' => 0
        ];

        foreach ($rows as $index => $row) {
            $linea = $index + 2; // +1 por base 0, +1 por encabezados
            try {
                $this->pdo->beginTransaction();

                $this->procesarFila($row, $farmaciaId, $usuarioId);

                $this->pdo->commit();
                $summary['procesados_ok']++;
            } catch (\Throwable $e) {
                if ($this->pdo->inTransaction()) {
                    $this->pdo->rollBack();
                }
                $summary['errores'][] = [
                    'linea' => $linea,
                    'codigo_barras' => $row['codigo_barras'] ?? 'N/A',
                    'error' => $e->getMessage()
                ];
            }
        }

        return $summary;
    }

    private function procesarFila(array $row, int $farmaciaId, int $usuarioId): void {
        // 1. Validar campos mínimos
        $codigoBarras = trim((string)($row['codigo_barras'] ?? ''));
        $codigoLote = trim((string)($row['codigo_lote'] ?? ''));
        $cantidad = (int)($row['cantidad'] ?? 0);
        $costoUnitario = (float)($row['costo_unitario'] ?? 0);
        $fechaVencimiento = $row['fecha_vencimiento'] ?? null;

        if (empty($codigoBarras)) throw new RuntimeException("Código de barras ausente.");
        if (empty($codigoLote)) throw new RuntimeException("Código de lote ausente.");
        if ($cantidad <= 0) throw new RuntimeException("Cantidad debe ser positiva.");

        // 2. Resolver Producto
        $producto = $this->productoRepo->findByCodigoBarras($codigoBarras);
        if (!$producto) {
            throw new RuntimeException("Producto con código '$codigoBarras' no existe en el catálogo.");
        }

        // 3. Upsert Lote
        $loteId = $this->loteRepo->upsert([
            'producto_id' => $producto['id'],
            'farmacia_id' => $farmaciaId,
            'codigo_lote' => $codigoLote,
            'fecha_vencimiento' => $fechaVencimiento,
            'costo_unitario' => $costoUnitario
        ]);

        // 4. Registrar Movimiento ENTRADA
        $this->movService->registrarMovimiento([
            'lote_id' => $loteId,
            'farmacia_id' => $farmaciaId,
            'usuario_id' => $usuarioId,
            'tipo' => 'ENTRADA',
            'cantidad' => $cantidad,
            'descripcion' => 'Carga masiva vía Excel'
        ]);
    }
}
