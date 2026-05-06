/**
 * PharmaQuick - Artillery Helper Functions
 * Funciones reutilizables para los tests de carga
 */

const crypto = require('crypto');

/**
 * Genera un email único para testing
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.generarEmailUnico = (context, events, done) => {
  const ts = Date.now();
  context.vars['emailUnico'] = `qa-test-${ts}@pharmaquick.com`;
  context.vars['nombreUnico'] = `Test User ${ts}`;
  done();
};

/**
 * Genera un nombre de producto aleatorio
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.generarNombreProducto = (context, events, done) => {
  const prefijos = ['Aspirina', 'Ibuprofeno', 'Paracetamol', 'Amoxicilina', 'Omeprazol'];
  const sais = ['500mg', '1g', '250mg', '20mg', '40mg'];
  constalea = () => prefijos[Math.floor(Math.random() * prefijos.length)];
  const saisAleatorio = () => sais[Math.floor(Math.random() * sais.length)];
  context.vars['nombreProducto'] = `${alea()} ${saisAleatorio()} - Test ${Date.now()}`;
  done();
};

/**
 * Genera datos para una venta
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.generarDatosVenta = (context, events, done) => {
  context.vars['cantidad'] = Math.floor(Math.random() * 5) + 1;
  context.vars['precioUnitario'] = (Math.random() * 50 + 10).toFixed(2);
  done();
};

/**
 * Valida que la respuesta tenga la estructura esperada
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.validarEstructuraJSON = (context, events, done) => {
  const respuesta = context.vars['ultimaRespuesta'];
  if (!respuesta) {
    events.emit('error', 'No hay respuesta previa para validar');
    return done(new Error('No response to validate'));
  }

  try {
    const json = typeof respuesta === 'string' ? JSON.parse(respuesta) : respuesta;
    if (!json.success && json.message) {
      events.emit('error', `Error en respuesta: ${json.message}`);
    }
  } catch (e) {
    events.emit('error', `JSON inválido: ${e.message}`);
  }
  done();
};

/**
 * Firma requests con HMAC para APIs que lo requieran
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.firmarRequest = (context, events, done) => {
  const secret = process.env.API_SECRET || 'pharmaquick-secret-key';
  const timestamp = Date.now().toString();
  const payload = JSON.stringify(context.vars['payload'] || {});

  const signature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + payload)
    .digest('hex');

  context.vars['signature'] = signature;
  context.vars['timestamp'] = timestamp;
  done();
};

/**
 * Genera un ID único de lote
 * @param {Object} context - Contexto de Artillery
 * @param {Object} events - Eventos de Artillery
 * @param {Function} done - Callback de завершения
 */
module.exports.generarIdLote = (context, events, done) => {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  context.vars['loteCodigo'] = `LOT-${fecha}-${random}`;
  context.vars['fechaVencimiento'] = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  done();
};

module.exports.generarIdLote2 = module.exports.generarIdLote;