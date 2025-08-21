const oracledb = require('oracledb');
// Fijar ruta correcta del Instant Client (escape de backslashes y con ':') y fallback a modo thin
try {
  oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient-basic-windows.x64-23.8.0.25.04\\instantclient_23_8' });
  console.log('Oracle Client nativo inicializado.');
} catch (e) {
  console.warn('No se pudo inicializar Oracle Client nativo. Usando modo thin. Detalle:', e?.message);
}
const config = require('./config');

// Pool para consultas de RUC/DNI
let mainPool = null;
// Pool para consultas de SIIT (Ergonomía/Sector)
let siitPool = null;

async function initializePool() {
  try {
    // Crear pool principal para RUC/DNI
    mainPool = await oracledb.createPool(config.db);
    console.log('Pool principal de conexiones de Oracle creado exitosamente.');
    
    // Crear pool para SIIT
    siitPool = await oracledb.createPool(config.dbSIIT);
    console.log('Pool SIIT de conexiones de Oracle creado exitosamente.');
  } catch (err) {
    console.error('Error al inicializar los pools de Oracle:', err);
    process.exit(1);
  }
}

async function executeQuery(sql, params = []) {
  let connection;
  try {
    console.log('--- EJECUTANDO CONSULTA SQL (RUC/DNI) ---');
    console.log('SQL:', sql);
    console.log('Parámetros:', params);
    connection = await mainPool.getConnection();
    const result = await connection.execute(sql, params, { outFormat: oracledb.OBJECT });
    console.log('Resultado:', result.rows);
    return result.rows;
  } catch (err) {
    console.error('Error en la base de datos:', err);
    return [];
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error al cerrar la conexión:', err); }
    }
  }
}

async function executeQuerySIIT(sql, params = []) {
  let connection;
  try {
    console.log('--- EJECUTANDO CONSULTA SQL (SIIT) ---');
    console.log('SQL:', sql);
    console.log('Parámetros:', params);
    connection = await siitPool.getConnection();
    const result = await connection.execute(sql, params, { outFormat: oracledb.OBJECT });
    console.log('Resultado:', result.rows);
    return result.rows;
  } catch (err) {
    console.error('Error en la base de datos SIIT:', err);
    return [];
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error al cerrar la conexión SIIT:', err); }
    }
  }
}

module.exports = { initializePool, executeQuery, executeQuerySIIT };


