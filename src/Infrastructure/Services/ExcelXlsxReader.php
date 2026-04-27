<?php

declare(strict_types=1);

namespace PharmaQuick\Infrastructure\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

/**
 * PharmaQuick - ExcelXlsxReader
 * 
 * Wrapper para lectura de archivos Excel .xlsx usando PhpSpreadsheet.
 */
class ExcelXlsxReader {
    /**
     * Lee un archivo Excel y retorna un array de filas asociativas.
     * 
     * @param string $filePath Ruta al archivo temporal.
     * @return array Listado de filas con encabezados normalizados.
     */
    public function read(string $filePath): array {
        if (!file_exists($filePath)) {
            throw new RuntimeException("El archivo no existe: $filePath");
        }

        try {
            $spreadsheet = IOFactory::load($filePath);
            $sheet = $spreadsheet->getActiveSheet();
            $data = $sheet->toArray(null, true, true, true);

            if (empty($data)) {
                return [];
            }

            // Primera fila son los encabezados
            $headers = array_shift($data);
            $headers = array_map(function($h) {
                return strtolower(trim((string)$h));
            }, $headers);

            $rows = [];
            foreach ($data as $rowIndex => $row) {
                // Saltar filas vacías (donde la primera celda es null)
                if ($row['A'] === null && count(array_filter($row)) === 0) {
                    continue;
                }

                $mappedRow = [];
                foreach ($headers as $colKey => $headerName) {
                    if (empty($headerName)) continue;
                    $mappedRow[$headerName] = $row[$colKey] ?? null;
                }
                $rows[] = $mappedRow;
            }

            return $rows;
        } catch (\Throwable $e) {
            throw new RuntimeException("Error al leer el archivo Excel: " . $e->getMessage());
        }
    }
}
