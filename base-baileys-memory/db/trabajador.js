const { executeQuery } = require('./connection');

async function getTrabajadorDatos(dni) {
  const sql = `SELECT RUC, RAZON_SOCIAL, NOMBRE_TRABAJADOR, NUM_DOC, TIPO_TRABAJADOR, SEXO, EDAD, NACIONALIDAD, AÑO, ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO, JULIO, AGOSTO, SETIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE FROM DINI_PLANILLON_HIST WHERE NUM_DOC = TO_CHAR(:dni) ORDER BY AÑO DESC FETCH FIRST 1 ROWS ONLY`;
  const rows = await executeQuery(sql, [dni]);
  return rows[0] || null;
}

async function getTrabajadorUltimaPlanilla(dni) {
  const sql = `SELECT V_PERDECLA, N_NUMEFELAB, N_MTOTOTPAG, (N_MTOTOTPAG * 0.09) AS APORTE_ESSALUD FROM INSUMO WHERE V_NUMDOCIDE = TO_CHAR(:dni) ORDER BY V_PERDECLA DESC FETCH FIRST 1 ROWS ONLY`;
  const rows = await executeQuery(sql, [dni]);
  return rows[0] || null;
}

module.exports = { getTrabajadorDatos, getTrabajadorUltimaPlanilla };


