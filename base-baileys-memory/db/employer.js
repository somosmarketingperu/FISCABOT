const { executeQuery } = require('./connection');

async function getEmpresaDatosGenerales(ruc) {
  const sql = `WITH PRIMER_ANEXO AS (
        SELECT ANEXO_BASE.*, ROW_NUMBER() OVER (PARTITION BY V_NUMRUC ORDER BY N_CODCORREL) as RN
        FROM ODS.MD_SUTB_EMPLEADORANEXOS ANEXO_BASE
    ),
    INFO_PLANILLON AS (
        SELECT PLANILLON_BASE.*, ROW_NUMBER() OVER (PARTITION BY RUC ORDER BY AÑO DESC, COMPETENCIA DESC) as RN_PLANILLON
        FROM USR_JPARIONA.DINI_PLANILLON_HIST PLANILLON_BASE
    )
    SELECT
        EMPLEADOR.V_DESNOMBRE AS "Nombre/Razón Social",
        EMPLEADOR.V_NOMCOM AS "Nombre Comercial",
        EMPLEADOR.D_FECALT AS "Fecha Alta",
        EMPLEADOR.D_CONSTI AS "Fecha Constitución",
        EMPLEADOR.D_INICIO AS "Fecha Inicio Actividades",
        VIA_PRINCIPAL.V_DESTIPVIA AS "Dirección Principal - Tipo Vía",
        EMPLEADOR.V_NOMVIA AS "Dirección Principal - Nombre Vía",
        EMPLEADOR.V_NUMER1 AS "Dirección Principal - Número",
        ZONA_PRINCIPAL.V_DESTIPZON AS "Dirección Principal - Zona",
        EMPLEADOR.V_CODCIIU AS "Actividad Económica (CIIU 1)",
        EMPLEADOR.V_CODCIIU2 AS "Actividad Económica (CIIU 2)",
        EMPLEADOR.V_TEL1 AS "Teléfono 1",
        EMPLEADOR.V_TEL2 AS "Teléfono 2",
        EMPLEADOR.V_TEL3 AS "Teléfono 3",
        EMPLEADOR.V_FAX AS "Fax",
        EMPLEADOR.V_FICHA AS "Ficha Registral",
        EMPLEADOR.V_ASIENTORRPP AS "Asiento Registros Públicos",
        EMPLEADOR.V_DESPARREG AS "Partida Registral",
        EMPLEADOR.V_CODESTADO AS "Estado",
        EMPLEADOR.V_PATRON AS "Patrón",
        EMPLEADOR.V_DEPORI AS "Origen",
        EMPLEADOR.V_CODCONTAB AS "Código Contabilidad",
        EMPLEADOR.V_CODFACTUR AS "Código Facturación",
        REP_LEGAL.V_NOMBRE AS "Rep Legal - Nombre",
        REP_LEGAL.V_NRODOC AS "Rep Legal - Documento",
        REP_LEGAL.V_CARGOO AS "Rep Legal - Cargo",
        REP_LEGAL.D_FECVDESDE AS "Rep Legal - Fecha Inicio Cargo",
        PLANILLON.TIPO_EMPRESA AS "Planillón - Tipo Empresa",
        PLANILLON.TAMAÑO_RENTA AS "Planillón - Tamaño Empresa",
        PLANILLON.TAMAÑO_REMYPE AS "Planillón - Tamaño REMYPE",
        PLANILLON.ESTADO_CONTRIBUYENTE AS "Planillón - Estado Contribuyente",
        PLANILLON.COND_DOMICILIO_FISCAL AS "Planillón - Condición Domicilio",
        PLANILLON."INDICADOR SST" AS "Planillón - Indicador SST",
        PLANILLON.ANEXOS AS "Planillón - Nro. de Anexos",
        CORREO_CE.CORREO_ELECTRONICO AS "Correo Casilla Electrónica",
        TEL_CE.NUMERO_TELEFONO AS "Teléfono Casilla Electrónica",
        CORREO_TR.CORREO_ELECTRONICO AS "Correo T-Registro",
        TEL_TR.NUMERO_TELEFONO AS "Teléfono T-Registro",
        CORREO_SU.CORREO_ELECTRONICO AS "Correo SUNAT",
        TEL_SU.NUMERO_TELEFONO AS "Teléfono SUNAT",
        SECTOR.DESC_CIIU_PADRON AS "Sector - Descripción Actividad",
        SECTOR.DES_SEC_PADRON AS "Sector - Descripción Sector",
        SECTOR.IND_ALTRIESGO AS "Sector - Indicador Alto Riesgo",
        VIA_ANEXO.V_DESTIPVIA AS "Anexo - Tipo Vía",
        ANEXO.V_NOMVIA AS "Anexo - Nombre Vía",
        ANEXO.V_NUMER1 AS "Anexo - Número",
        ZONA_ANEXO.V_DESTIPZON AS "Anexo - Zona",
        ANEXO.V_REFER1 AS "Anexo - Referencia",
        ANEXO.V_CODTIPEST AS "Anexo - Tipo Establecimiento",
        ANEXO.V_CODINDCONLEG AS "Anexo - Indicador Legal"
    FROM
        ODS.MD_SUTB_EMPLEADOR EMPLEADOR
    LEFT JOIN ODS.MD_SUTB_TIPOVIA VIA_PRINCIPAL ON EMPLEADOR.V_CODTIPVIA = VIA_PRINCIPAL.V_CODTIPVIA
    LEFT JOIN USR_JPARIONA.MD_SUTB_TIPOZONA ZONA_PRINCIPAL ON EMPLEADOR.V_CODTIPZON = ZONA_PRINCIPAL.V_CODTIPZON
    LEFT JOIN ODSSTG.SUTB_REPRESENTANTELEGAL REP_LEGAL ON EMPLEADOR.V_NUMRUC = REP_LEGAL.V_NUMRUC
    LEFT JOIN INFO_PLANILLON PLANILLON ON EMPLEADOR.V_NUMRUC = PLANILLON.RUC AND PLANILLON.RN_PLANILLON = 1
    LEFT JOIN USR_JPARIONA.DINI_CORREO_CE CORREO_CE ON EMPLEADOR.V_NUMRUC = CORREO_CE.RUC
    LEFT JOIN USR_JPARIONA.DINI_TELEFONO_CE TEL_CE ON EMPLEADOR.V_NUMRUC = TEL_CE.RUC
    LEFT JOIN USR_JPARIONA.DINI_CORREO_TR CORREO_TR ON EMPLEADOR.V_NUMRUC = CORREO_TR.RUC
    LEFT JOIN USR_JPARIONA.DINI_TELEFONO_TR TEL_TR ON EMPLEADOR.V_NUMRUC = TEL_TR.RUC
    LEFT JOIN USR_JPARIONA.DINI_CORREO_SU CORREO_SU ON EMPLEADOR.V_NUMRUC = CORREO_SU.RUC
    LEFT JOIN USR_JPARIONA.DINI_TELEFONO_SU TEL_SU ON EMPLEADOR.V_NUMRUC = TEL_SU.RUC
    LEFT JOIN USR_JPARIONA.INII_SECTORES_ECONOMICOS SECTOR ON EMPLEADOR.V_CODCIIU = SECTOR.CIIU_PADRON
    LEFT JOIN PRIMER_ANEXO ANEXO ON EMPLEADOR.V_NUMRUC = ANEXO.V_NUMRUC AND ANEXO.RN = 1
    LEFT JOIN ODS.MD_SUTB_TIPOVIA VIA_ANEXO ON ANEXO.V_CODTIPVIA = VIA_ANEXO.V_CODTIPVIA
    LEFT JOIN USR_JPARIONA.MD_SUTB_TIPOZONA ZONA_ANEXO ON ANEXO.V_CODTIPZON = ZONA_ANEXO.V_CODTIPZON
    WHERE EMPLEADOR.V_NUMRUC = :ruc`;
  const rows = await executeQuery(sql, [ruc]);
  return rows;
}

async function getListaTrabajadoresUltimoPeriodo(ruc) {
  const sql = `
        SELECT 
            t.V_NUMDOCIDE AS DNI, 
            p.NOMBRE_TRABAJADOR, 
            p.TIPO_TRABAJADOR, 
            p.SEXO, 
            p.EDAD, 
            p.NACIONALIDAD
        FROM DINI_PLAME_TRABAJADOR t
        LEFT JOIN DINI_PLANILLON_HIST p
            ON t.V_NUMDOCIDE = p.NUM_DOC AND t.V_NUMRUC = p.RUC
        WHERE t.V_NUMRUC = :ruc
          AND t.V_PERDECLA = (
              SELECT MAX(V_PERDECLA) 
              FROM DINI_PLAME_TRABAJADOR 
              WHERE V_NUMRUC = :ruc
          )
        ORDER BY p.NOMBRE_TRABAJADOR`;
  return await executeQuery(sql, [ruc]);
}

async function getResumenTrabajadoresUltimoPeriodo(ruc) {
  const sql = `
        SELECT 
            t.V_PERDECLA AS "Ultimo_Periodo",
            COUNT(*) AS "Cantidad_Trabajadores_Declarados"
        FROM DINI_PLAME_TRABAJADOR t
        WHERE t.V_NUMRUC = :ruc
          AND t.V_PERDECLA = (
              SELECT MAX(V_PERDECLA) 
              FROM DINI_PLAME_TRABAJADOR 
              WHERE V_NUMRUC = :ruc
          )
        GROUP BY t.V_PERDECLA`;
  const rows = await executeQuery(sql, [ruc]);
  return rows[0] || null;
}

module.exports = { getEmpresaDatosGenerales, getListaTrabajadoresUltimoPeriodo, getResumenTrabajadoresUltimoPeriodo };

// Placeholders para mantener compatibilidad con app.js (submenu empresa)
async function getEmpresaContacto(ruc) {
  console.warn('[WARN] getEmpresaContacto no implementado. Retornando null. RUC:', ruc);
  return null;
}
async function getEmpresaUbicacion(ruc) {
  console.warn('[WARN] getEmpresaUbicacion no implementado. Retornando null. RUC:', ruc);
  return null;
}
async function getEmpresaTRegistroPlame(ruc) {
  console.warn('[WARN] getEmpresaTRegistroPlame no implementado. Retornando valores placeholder. RUC:', ruc);
  return { t_registro: null, periodo_plame: null, num_trabajadores: 0 };
}
async function getEmpresaInfoCompleta(ruc) {
  console.warn('[WARN] getEmpresaInfoCompleta no implementado. Retornando null. RUC:', ruc);
  return null;
}

module.exports.getEmpresaContacto = getEmpresaContacto;
module.exports.getEmpresaUbicacion = getEmpresaUbicacion;
module.exports.getEmpresaTRegistroPlame = getEmpresaTRegistroPlame;
module.exports.getEmpresaInfoCompleta = getEmpresaInfoCompleta;


