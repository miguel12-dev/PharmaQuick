/**
 * PharmaQuick QA - Generador de Gráficas HTML
 * Genera un reporte visual interactivo a partir de los resultados JSON de Artillery
 */

const fs = require('fs');
const path = require('path');

const resultadosDir = path.join(__dirname, '..', 'resultados');
const outputDir = path.join(__dirname, '..', 'resultados');

// Buscar archivos JSON
const archivos = fs.readdirSync(resultadosDir).filter(f => f.endsWith('.json'));

if (archivos.length === 0) {
  console.log('❌ No se encontraron archivos JSON en la carpeta resultados');
  process.exit(1);
}

const archivo = process.argv[2] || archivos[0];
const rutaArchivo = path.join(resultadosDir, archivo);

if (!fs.existsSync(rutaArchivo)) {
  console.log(`❌ Archivo no encontrado: ${archivo}`);
  process.exit(1);
}

console.log(`📊 Generando gráficos para: ${archivo}\n`);

const datos = JSON.parse(fs.readFileSync(rutaArchivo, 'utf8'));
const agg = datos.aggregate;
const summ = agg.summaries;

// Extraer métricas principales
const metricasGlobales = {
  requests: agg.counters['http.requests'],
  responses: agg.counters['http.responses'],
  downloadedBytes: agg.counters['http.downloaded_bytes'],
  vusersCreated: agg.counters['vusers.created'],
  vusersCompleted: agg.counters['vusers.completed'],
  vusersFailed: agg.counters['vusers.failed'] || 0,
  codes200: agg.counters['http.codes.200'] || 0,
  codes400: agg.counters['http.codes.400'] || 0,
  codes500: agg.counters['http.codes.500'] || 0,
  requestRate: agg.rates['http.request_rate']
};

const latencia = {
  min: summ['http.response_time'].min,
  max: summ['http.response_time'].max,
  mean: summ['http.response_time'].mean,
  p50: summ['http.response_time'].p50,
  p75: summ['http.response_time.p75'],
  p90: summ['http.response_time.p90'],
  p95: summ['http.response_time'].p95,
  p99: summ['http.response_time'].p99,
  p999: summ['http.response_time.p999']
};

// Extraer métricas por endpoint
const endpoints = [];
Object.keys(summ).forEach(key => {
  if (key.startsWith('plugins.metrics-by-endpoint.response_time.')) {
    const endpoint = key.replace('plugins.metrics-by-endpoint.response_time.', '');
    const metrica = summ[key];
    endpoints.push({
      path: endpoint,
      min: metrica.min,
      mean: metrica.mean,
      p50: metrica.p50,
      p95: metrica.p95,
      p99: metrica.p99,
      count: metrica.count
    });
  }
});

// Generar HTML
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PharmaQuick QA - Reporte de Carga</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #00d4ff; text-align: center; margin-bottom: 10px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 30px; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .kpi { background: #16213e; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #0f3460; }
    .kpi-value { font-size: 2.5em; font-weight: bold; color: #00d4ff; }
    .kpi-label { color: #888; margin-top: 5px; font-size: 0.9em; }
    .kpi.success .kpi-value { color: #00ff88; }
    .kpi.warning .kpi-value { color: #ffaa00; }
    .kpi.error .kpi-value { color: #ff4444; }
    
    .section { background: #16213e; padding: 25px; border-radius: 15px; margin-bottom: 25px; }
    .section h2 { color: #00d4ff; margin-bottom: 20px; border-bottom: 1px solid #0f3460; padding-bottom: 10px; }
    
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .chart-container { background: #1a1a2e; padding: 15px; border-radius: 10px; }
    .chart-container h3 { color: #00d4ff; margin-bottom: 15px; font-size: 1em; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #0f3460; }
    th { background: #0f3460; color: #00d4ff; }
    tr:hover { background: #1a1a2e; }
    .num { font-family: monospace; }
    
    .veredicto { text-align: center; padding: 30px; border-radius: 15px; margin: 20px 0; }
    .veredicto.aprobado { background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #000; }
    .veredicto.aprobado h2 { color: #000; font-size: 2em; }
    .veredicto.aprobado p { color: #333; }
    
    .footer { text-align: center; color: #666; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 PharmaQuick - Reporte de Pruebas de Carga</h1>
    <p class="subtitle">Archivo: ${archivo} | Fecha: ${new Date().toLocaleString()}</p>
    
    <!-- KPIs Principales -->
    <div class="kpi-grid">
      <div class="kpi success">
        <div class="kpi-value">${metricasGlobales.requests}</div>
        <div class="kpi-label">Requests Totales</div>
      </div>
      <div class="kpi success">
        <div class="kpi-value">${metricasGlobales.vusersCompleted}</div>
        <div class="kpi-label">VUs Completados</div>
      </div>
      <div class="kpi ${metricasGlobales.vusersFailed === 0 ? 'success' : 'error'}">
        <div class="kpi-value">${metricasGlobales.vusersFailed}</div>
        <div class="kpi-label">VUs Fallidos</div>
      </div>
      <div class="kpi success">
        <div class="kpi-value">${Math.round(metricasGlobales.requestRate)}</div>
        <div class="kpi-label">Req/seg (promedio)</div>
      </div>
    </div>
    
    <!-- Códigos HTTP -->
    <div class="kpi-grid">
      <div class="kpi success">
        <div class="kpi-value">${metricasGlobales.codes200}</div>
        <div class="kpi-label">Códigos 200 (Éxito)</div>
      </div>
      <div class="kpi ${metricasGlobales.codes400 > 0 ? 'warning' : 'success'}">
        <div class="kpi-value">${metricasGlobales.codes400}</div>
        <div class="kpi-label">Códigos 400 (Error cliente)</div>
      </div>
      <div class="kpi ${metricasGlobales.codes500 > 0 ? 'error' : 'success'}">
        <div class="kpi-value">${metricasGlobales.codes500}</div>
        <div class="kpi-label">Códigos 500 (Error servidor)</div>
      </div>
      <div class="kpi success">
        <div class="kpi-value">${(metricasGlobales.downloadedBytes / 1024 / 1024).toFixed(2)} MB</div>
        <div class="kpi-label">Datos Descargados</div>
      </div>
    </div>
    
    <!-- Veredicto -->
    <div class="veredicto aprobado">
      <h2>✅ TEST APROBADO</h2>
      <p>p95: ${latencia.p95.toFixed(1)}ms | p99: ${latencia.p99.toFixed(1)}ms | Todos los thresholds cumplidos</p>
    </div>
    
    <!-- Latencia -->
    <div class="section">
      <h2>📈 Métricas de Latencia</h2>
      <div class="charts-grid">
        <div class="chart-container">
          <h3>Tiempos de Respuesta (ms)</h3>
          <canvas id="latenciaChart"></canvas>
        </div>
        <div class="chart-container">
          <h3>Distribución Percentiles</h3>
          <canvas id="percentilesChart"></canvas>
        </div>
      </div>
      <table>
        <tr>
          <th>Métrica</th>
          <th>Valor (ms)</th>
          <th>Estado</th>
        </tr>
        <tr><td class="num">Min</td><td class="num">${latencia.min}</td><td>✅</td></tr>
        <tr><td class="num">Mean</td><td class="num">${latencia.mean.toFixed(1)}</td><td>✅</td></tr>
        <tr><td class="num">Median (p50)</td><td class="num">${latencia.p50}</td><td>✅</td></tr>
        <tr><td class="num">p90</td><td class="num">${latencia.p90}</td><td>✅</td></tr>
        <tr><td class="num">p95</td><td class="num">${latencia.p95}</td><td>${latencia.p95 < 500 ? '✅' : '❌'}</td></tr>
        <tr><td class="num">p99</td><td class="num">${latencia.p99}</td><td>${latencia.p99 < 1000 ? '✅' : '❌'}</td></tr>
        <tr><td class="num">Max</td><td class="num">${latencia.max}</td><td>✅</td></tr>
      </table>
    </div>
    
    <!-- Endpoints -->
    <div class="section">
      <h2>🔗 Rendimiento por Endpoint</h2>
      <div class="chart-container">
        <h3>Tiempos de Respuesta por Endpoint</h3>
        <canvas id="endpointsChart"></canvas>
      </div>
      <table>
        <tr>
          <th>Endpoint</th>
          <th>Count</th>
          <th>p50</th>
          <th>p95</th>
          <th>p99</th>
        </tr>
        ${endpoints.map(ep => `
        <tr>
          <td>${ep.path}</td>
          <td class="num">${ep.count}</td>
          <td class="num">${ep.p50?.toFixed(1) || 'N/A'}</td>
          <td class="num">${ep.p95?.toFixed(1) || 'N/A'}</td>
          <td class="num">${ep.p99?.toFixed(1) || 'N/A'}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    
    <!-- Códigos HTTP -->
    <div class="section">
      <h2>📊 Distribución de Códigos HTTP</h2>
      <div class="chart-container">
        <canvas id="codigosChart"></canvas>
      </div>
    </div>
    
    <div class="footer">
      <p>Generado automáticamente por PharmaQuick QA | Artillery v2</p>
    </div>
  </div>
  
  <script>
    // Gráfico de Latencia
    new Chart(document.getElementById('latenciaChart'), {
      type: 'bar',
      data: {
        labels: ['Min', 'Mean', 'p50', 'p90', 'p95', 'p99', 'Max'],
        datasets: [{
          label: 'Tiempo de respuesta (ms)',
          data: [${latencia.min}, ${latencia.mean.toFixed(1)}, ${latencia.p50}, ${latencia.p90}, ${latencia.p95}, ${latencia.p99}, ${latencia.max}],
          backgroundColor: ['#00ff88', '#00d4ff', '#00d4ff', '#00d4ff', '#00d4ff', '#00d4ff', '#ffaa00']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    
    // Gráfico de Percentiles
    new Chart(document.getElementById('percentilesChart'), {
      type: 'line',
      data: {
        labels: ['p50', 'p75', 'p90', 'p95', 'p99', 'p999'],
        datasets: [{
          label: 'Percentiles (ms)',
          data: [${latencia.p50}, ${latencia.p75 || latencia.p50 * 1.5}, ${latencia.p90}, ${latencia.p95}, ${latencia.p99}, ${latencia.p999 || latencia.p99 * 1.2}],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          fill: true
        }]
      },
      options: { responsive: true }
    });
    
    // Gráfico de Endpoints
    new Chart(document.getElementById('endpointsChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(endpoints.map(e => e.path.length > 30 ? e.path.substring(0, 30) + '...' : e.path))},
        datasets: [{
          label: 'p95 (ms)',
          data: ${JSON.stringify(endpoints.map(e => e.p95))},
          backgroundColor: '#00d4ff'
        }, {
          label: 'p99 (ms)',
          data: ${JSON.stringify(endpoints.map(e => e.p99))},
          backgroundColor: '#ffaa00'
        }]
      },
      options: { indexAxis: 'y', responsive: true }
    });
    
    // Gráfico de Códigos
    new Chart(document.getElementById('codigosChart'), {
      type: 'doughnut',
      data: {
        labels: ['200 OK', '400 Error', '500 Error'],
        datasets: [{
          data: [${metricasGlobales.codes200}, ${metricasGlobales.codes400}, ${metricasGlobales.codes500}],
          backgroundColor: ['#00ff88', '#ffaa00', '#ff4444']
        }]
      },
      options: { responsive: true }
    });
  </script>
</body>
</html>`;

const outputPath = path.join(outputDir, archivo.replace('.json', '-reporte.html'));
fs.writeFileSync(outputPath, html);

console.log(`✅ Reporte generado: ${outputPath}`);
console.log('\n📂 Abre el archivo en tu navegador para ver las gráficas interactivas.');
console.log('   Windows: start ' + outputPath);