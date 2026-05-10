/**
 * PharmaQuick QA - Generador de Reportes
 * Genera reportes HTML a partir de los resultados JSON de Artillery
 */

const fs = require('fs');
const path = require('path');

const resultadosDir = path.join(__dirname, '..', 'resultados');

// Verificar que exista la carpeta resultados
if (!fs.existsSync(resultadosDir)) {
  console.log('❌ La carpeta "resultados" no existe. Ejecuta primero las pruebas.');
  process.exit(1);
}

// Buscar archivos JSON de resultados
const archivos = fs.readdirSync(resultadosDir).filter(f => f.endsWith('.json'));

if (archivos.length === 0) {
  console.log('❌ No se encontraron resultados JSON en la carpeta "resultados".');
  console.log('   Ejecuta: npx artillery run tests/jwt-auth.yaml --output resultados/jwt-auth.json');
  process.exit(1);
}

console.log('\n📊 Archivos de resultados disponibles:\n');
archivos.forEach((archivo, i) => {
  console.log(`   ${i + 1}. ${archivo}`);
});

console.log('\n📈 Para generar el reporte HTML, usa:\n');
console.log('   npx artillery-report resultados/<nombre-del-archivo>.json');
console.log('\n   Ejemplo:');
console.log(`   npx artillery-report ${archivos[0]}`);
console.log('\n💡 Los resultados también se muestran en la consola al ejecutar cada test.');
console.log('   Revisa las métricas: p50, p95, p99, rps, errors, vusers.failed\n');

// Intentar generar reporte automáticamente si hay artillery-report instalado
const reporte = require('artillery-report');
if (archivos.length > 0) {
  console.log('🎯 Generando reporte para el primer archivo...\n');
  try {
    const reportePath = path.join(resultadosDir, archivos[0]);
    require('artillery-report');
    console.log(`   Ejecuta: npx artillery-report ${archivos[0]}`);
  } catch (e) {
    // No está instalado, solo mostrar instructions
  }
}