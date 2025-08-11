// database.js
const oracledb = require('oracledb');
oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient-basic-windows.x64-23.8.0.25.04\\instantclient_23_8' });
const config = require('./config');
const { generarPDFReporteErgonomia } = require('./pdfGenerator');

// Función para inicializar el pool
async function initializePool() {
    try {
        await oracledb.createPool(config.db);
        console.log("Pool de conexiones de Oracle creado exitosamente.");
    } catch (err) {
        console.error("Error al inicializar el pool de Oracle:", err);
        process.exit(1);
    }
}

// Función para ejecutar consultas
async function executeQuery(sql, params = []) {
    let connection;
    try {
        console.log('--- EJECUTANDO CONSULTA SQL ---');
        console.log('SQL:', sql);
        console.log('Parámetros:', params);
        connection = await oracledb.getConnection();
        const result = await connection.execute(sql, params, { outFormat: oracledb.OBJECT });
        console.log('Resultado:', result.rows);
        return result.rows;
    } catch (err) {
        console.error("Error en la base de datos:", err);
        return [];
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error al cerrar la conexión:", err);
            }
        }
    }
}

// Consulta datos generales de empresa por RUC (QUERY 1)
async function getEmpresaDatosGenerales(ruc) {
    // Aquí va el query integral de empresa (ajusta según tu versión final)
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

// Lista de trabajadores declarados en el último periodo para un RUC (QUERY 2)
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
        ORDER BY p.NOMBRE_TRABAJADOR
    `;
    const rows = await executeQuery(sql, [ruc]);
    return rows;
}

// Resumen de trabajadores declarados en el último periodo para un RUC (QUERY 3)
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
        GROUP BY t.V_PERDECLA
    `;
    const rows = await executeQuery(sql, [ruc]);
    return rows[0] || null;
}

// Consulta datos de trabajador por DNI (Planillón)
async function getTrabajadorDatos(dni) {
    const sql = `SELECT RUC, RAZON_SOCIAL, NOMBRE_TRABAJADOR, NUM_DOC, TIPO_TRABAJADOR, SEXO, EDAD, NACIONALIDAD, AÑO, ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO, JULIO, AGOSTO, SETIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE FROM DINI_PLANILLON_HIST WHERE NUM_DOC = TO_CHAR(:dni) ORDER BY AÑO DESC FETCH FIRST 1 ROWS ONLY`;
    const rows = await executeQuery(sql, [dni]);
    return rows[0] || null;
}

// Consulta última planilla (PLAME) del trabajador por DNI
async function getTrabajadorUltimaPlanilla(dni) {
    const sql = `SELECT V_PERDECLA, N_NUMEFELAB, N_MTOTOTPAG, (N_MTOTOTPAG * 0.09) AS APORTE_ESSALUD FROM INSUMO WHERE V_NUMDOCIDE = TO_CHAR(:dni) ORDER BY V_PERDECLA DESC FETCH FIRST 1 ROWS ONLY`;
    const rows = await executeQuery(sql, [dni]);
    return rows[0] || null;
}

// Función para generar reporte de ergonomía
async function generarReporteErgonomia() {
    try {
        console.log('🔄 Generando reporte de ergonomía...');
        
        // Obtener datos de las 4 tablas
        const datosTabla1 = await obtenerTablaOrigen();
        const datosTabla2 = await obtenerTablaResultado();
        const datosTabla3 = await obtenerTablaSector();
        const datosTabla4 = await obtenerTablaRegion();
        
        // Calcular resumen
        const resumen = calcularResumen(datosTabla1, datosTabla2);
        
        // Generar PDF
        const pdfBuffer = await generarPDFReporteErgonomia({
            titulo: "AYUDA DE MEMORIA DEL SISTEMA DE INSPECCIÓN DEL TRABAJO EN: MATERIA: MATER-Ergonomía(72)",
            tabla1: datosTabla1,
            tabla2: datosTabla2,
            tabla3: datosTabla3,
            tabla4: datosTabla4,
            resumen: resumen
        });
        
        console.log('✅ Reporte de ergonomía generado exitosamente');
        return pdfBuffer;
        
    } catch (error) {
        console.error('❌ Error generando reporte de ergonomía:', error);
        throw error;
    }
}

// Tabla 1: Origen
async function obtenerTablaOrigen() {
    const sql = `
        SELECT 
            ORIGEN,
            SUM(CASE WHEN AÑO_CIERRE = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN AÑO_CIERRE = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN AÑO_CIERRE = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN AÑO_CIERRE = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN AÑO_CIERRE = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN AÑO_CIERRE = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN AÑO_CIERRE = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN AÑO_CIERRE = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN AÑO_CIERRE = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN AÑO_CIERRE = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM (
            SELECT DISTINCT
                TO_NUMBER(A.V_ANHO) || '-' || A.N_NUMDEP || '-' || A.V_NUMORDINSP AS NUMERO_ORDEN,
                CASE
                    WHEN A.V_CODOPER IS NOT NULL THEN 'OPERATIVO'
                    WHEN A.N_NUMREGENTRA IS NULL THEN 'OPERATIVO'
                    ELSE 'DENUNCIA'
                END AS ORIGEN,
                TO_CHAR(A.D_FECCIERRE,'YYYY') AS AÑO_CIERRE,
                A.N_CODLINACC,
                CASE
                    WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') and A.V_FLGCIEFOR = 'S' THEN 'SI'
                    ELSE 'NO'
                END AS CIERRE_MASIVO,
                CASE
                    WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') and A.V_OBS LIKE '%TRANS%' THEN 'SI'
                    ELSE 'NO'
                END AS TRANSFERENCIA,
                CASE
                    WHEN A.n_numdep ='0191' AND A.D_FECCIERRE >= TO_DATE('19/06/2020','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0225' AND A.D_FECCIERRE >= TO_DATE('26/07/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0252' AND A.D_FECCIERRE >= TO_DATE('10/10/2022','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0260' AND A.D_FECCIERRE >= TO_DATE('16/07/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0332','0506') AND A.D_FECCIERRE >= TO_DATE('16/10/2020','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0227' AND A.D_FECCIERRE >= TO_DATE('19/06/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0271' AND A.D_FECCIERRE >= TO_DATE('17/12/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0267' AND A.D_FECCIERRE >= TO_DATE('02/12/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0265' AND A.D_FECCIERRE >= TO_DATE('11/04/2022','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0269' AND A.D_FECCIERRE >= TO_DATE('18/12/2020','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0335' AND A.D_FECCIERRE >= TO_DATE('13/12/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0330','0515') AND A.D_FECCIERRE >= TO_DATE('12/09/2022','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0336' AND A.D_FECCIERRE >= TO_DATE('18/10/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0325','0327') AND A.D_FECCIERRE >= TO_DATE('15/10/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0268' AND A.D_FECCIERRE >= TO_DATE('16/09/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0329','0438') AND A.D_FECCIERRE >= TO_DATE('22/06/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0328' AND A.D_FECCIERRE >= TO_DATE('04/12/2020','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0250' AND A.D_FECCIERRE >= TO_DATE('15/06/2022','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0339' AND A.D_FECCIERRE >= TO_DATE('30/06/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0326' AND A.D_FECCIERRE >= TO_DATE('13/11/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0338','0446','0447','0448') AND A.D_FECCIERRE >= TO_DATE('27/11/2020','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0324' AND A.D_FECCIERRE >= TO_DATE('27/08/2019','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep IN ('0337','0432','0420','0524') AND A.D_FECCIERRE >= TO_DATE('30/11/2021','DD/MM/YYYY') THEN 'NO'
                    WHEN A.n_numdep ='0265' AND A.D_FECCIERRE >= TO_DATE('11/04/2022','DD/MM/YYYY') THEN 'NO'
                    ELSE 'SI'
                END AS ORDENES_PROCEDEN
            FROM SIIT.VST_ORDENESINSPECCION A
            LEFT JOIN SIIT.VST_MATINSPECXOI C on (a.v_numordinsp=c.V_NUMORDINSP and a.v_anho=c.V_ANHO and a.n_numdep=c.N_NUMDEP)
            WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') and A.D_FECCIERRE < (SELECT SYSDATE FROM DUAL))
                AND C.N_CODGRUPMAT = 72  -- Filtro por materia Ergonomía
        ) b
        WHERE ORDENES_PROCEDEN = 'SI' AND CIERRE_MASIVO = 'NO' AND TRANSFERENCIA = 'NO'
        GROUP BY ORIGEN
        ORDER BY ORIGEN`;
    return await executeQuery(sql);
}

// Tabla 2: Resultado
async function obtenerTablaResultado() {
    const sql = `
        SELECT 
            V_RESULTADO,
            SUM(CASE WHEN AÑO_CIERRE = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN AÑO_CIERRE = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN AÑO_CIERRE = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN AÑO_CIERRE = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN AÑO_CIERRE = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN AÑO_CIERRE = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN AÑO_CIERRE = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN AÑO_CIERRE = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN AÑO_CIERRE = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN AÑO_CIERRE = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM (
            SELECT DISTINCT
                TO_NUMBER(A.V_ANHO) || '-' || A.N_NUMDEP || '-' || A.V_NUMORDINSP AS NUMERO_ORDEN,
                A.V_RESULTADO,
                TO_CHAR(A.D_FECCIERRE,'YYYY') AS AÑO_CIERRE,
                A.N_CODLINACC
            FROM SIIT.VST_ORDENESINSPECCION A
            LEFT JOIN SIIT.VST_MATINSPECXOI C on (a.v_numordinsp=c.V_NUMORDINSP and a.v_anho=c.V_ANHO and a.n_numdep=c.N_NUMDEP)
            WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
                AND C.N_CODGRUPMAT = 72  -- Filtro por materia Ergonomía
        ) 
        GROUP BY V_RESULTADO
        ORDER BY V_RESULTADO`;
    
    return await executeQuery(sql);
}

// Función para obtener tabla de sector económico (limitada a top 10)
async function obtenerTablaSector() {
    const sql = `
        SELECT
            SECTOR_ECONOMICO,
            SUM(CASE WHEN AÑO_CIERRE = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN AÑO_CIERRE = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN AÑO_CIERRE = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN AÑO_CIERRE = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN AÑO_CIERRE = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN AÑO_CIERRE = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN AÑO_CIERRE = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN AÑO_CIERRE = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN AÑO_CIERRE = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN AÑO_CIERRE = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM (
            SELECT DISTINCT
                TO_NUMBER(A.V_ANHO) || '-' || A.N_NUMDEP || '-' || A.V_NUMORDINSP AS NUMERO_ORDEN,
                CASE
                    WHEN A.V_CODSEC = 'A' THEN 'AGRICULTURA'
                    WHEN A.V_CODSEC = 'K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
                    WHEN A.V_CODSEC = 'M' THEN 'ENSEÑANZA'
                    WHEN A.V_CODSEC = 'F' THEN 'CONSTRUCCIÓN'
                    WHEN A.V_CODSEC = 'G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
                    WHEN A.V_CODSEC = 'D' THEN 'INDUSTRIAS MANUFACTURERAS'
                    WHEN A.V_CODSEC = 'H' THEN 'HOTELES Y RESTAURANTES'
                    WHEN A.V_CODSEC = 'I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
                    WHEN A.V_CODSEC = 'O' THEN 'OTROS'
                    WHEN A.V_CODSEC = 'N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
                    WHEN A.V_CODSEC = 'C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
                    WHEN A.V_CODSEC = 'J' THEN 'INTERMEDIACIÓN FINANCIERA'
                    WHEN A.V_CODSEC = 'L' THEN 'ADMINISTRACIÓN PÚBLICA'
                    WHEN A.V_CODSEC = 'E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
                    WHEN A.V_CODSEC = 'B' THEN 'PESCA'
                    WHEN A.V_CODSEC = 'P' THEN 'OTROS'
                    WHEN A.V_CODSEC = 'Z' THEN 'OTROS'
                    WHEN A.V_CODSEC = 'Q' THEN 'OTROS'
                    WHEN A.V_CODSEC = '' THEN 'OTROS'
                    WHEN A.V_CODSEC = 'NULL' THEN 'OTROS'
                    ELSE 'OTROS'
                END AS SECTOR_ECONOMICO,
                TO_CHAR(A.D_FECCIERRE,'YYYY') AS AÑO_CIERRE,
                A.N_CODLINACC
            FROM SIIT.VST_ORDENESINSPECCION A
            LEFT JOIN SIIT.VST_MATINSPECXOI C on (a.v_numordinsp=c.V_NUMORDINSP and a.v_anho=c.V_ANHO and a.n_numdep=c.N_NUMDEP)
            WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
                AND C.N_CODGRUPMAT = 72  -- Filtro por materia Ergonomía
        )
        GROUP BY SECTOR_ECONOMICO
        ORDER BY COUNT(*) DESC`;
    
    return await executeQuery(sql);
}

// Función para obtener tabla de región (limitada a top 15)
async function obtenerTablaRegion() {
    const sql = `
        SELECT
            REGION,
            SUM(CASE WHEN AÑO_CIERRE = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN AÑO_CIERRE = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN AÑO_CIERRE = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN AÑO_CIERRE = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN AÑO_CIERRE = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN AÑO_CIERRE = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN AÑO_CIERRE = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN AÑO_CIERRE = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN AÑO_CIERRE = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN AÑO_CIERRE = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM (
            SELECT DISTINCT
                TO_NUMBER(A.V_ANHO) || '-' || A.N_NUMDEP || '-' || A.V_NUMORDINSP AS NUMERO_ORDEN,
                CASE
                    WHEN A.n_numdep = '0191' THEN 'LIMA'
                    WHEN A.n_numdep = '0225' THEN 'LIMA PROVINCIA'
                    WHEN A.n_numdep = '0252' THEN 'AREQUIPA'
                    WHEN A.n_numdep = '0260' THEN 'CUSCO'
                    WHEN A.n_numdep = '0298' THEN 'LIMA'
                    WHEN A.n_numdep = '0332' THEN 'APURÍMAC'
                    WHEN A.n_numdep = '0227' THEN 'CALLAO'
                    WHEN A.n_numdep = '0271' THEN 'HUÁNUCO'
                    WHEN A.n_numdep = '0267' THEN 'ICA'
                    WHEN A.n_numdep = '0265' THEN 'AYACUCHO'
                    WHEN A.n_numdep = '0269' THEN 'JUNÍN'
                    WHEN A.n_numdep = '0335' THEN 'LAMBAYEQUE'
                    WHEN A.n_numdep = '0330' THEN 'LORETO'
                    WHEN A.n_numdep = '0515' THEN 'LORETO'
                    WHEN A.n_numdep = '0336' THEN 'MADRE DE DIOS'
                    WHEN A.n_numdep = '0325' THEN 'MOQUEGUA'
                    WHEN A.n_numdep = '0268' THEN 'PASCO'
                    WHEN A.n_numdep = '0337' THEN 'PIURA'
                    WHEN A.n_numdep = '0329' THEN 'PUNO'
                    WHEN A.n_numdep = '0438' THEN 'PUNO'
                    WHEN A.n_numdep = '0338' THEN 'SAN MARTIN'
                    WHEN A.n_numdep = '0328' THEN 'TACNA'
                    WHEN A.n_numdep = '0250' THEN 'LA LIBERTAD'
                    WHEN A.n_numdep = '0339' THEN 'TUMBES'
                    WHEN A.n_numdep = '0326' THEN 'UCAYALI'
                    WHEN A.n_numdep = '0447' THEN 'SAN MARTIN'
                    WHEN A.n_numdep = '0446' THEN 'SAN MARTIN'
                    WHEN A.n_numdep = '0448' THEN 'SAN MARTIN'
                    WHEN A.n_numdep = '0506' THEN 'APURÍMAC'
                    WHEN A.n_numdep = '0324' THEN 'ANCASH'
                    WHEN A.n_numdep = '0327' THEN 'MOQUEGUA'
                    WHEN A.n_numdep = '0432' THEN 'PIURA'
                    WHEN A.n_numdep = '0524' THEN 'PIURA'
                    WHEN A.n_numdep = '0420' THEN 'PIURA'
                    WHEN A.n_numdep = '0462' THEN 'LIMA'
                    WHEN A.n_numdep = '0460' THEN 'LIMA'
                    WHEN A.n_numdep = '0461' THEN 'LIMA'
                    WHEN A.n_numdep = '0494' THEN 'ANCASH'
                    WHEN A.n_numdep = '0509' THEN 'AREQUIPA'
                    WHEN A.n_numdep = '0487' THEN 'CAJAMARCA'
                    WHEN A.n_numdep = '1005' THEN 'CUSCO'
                    WHEN A.n_numdep = '0484' THEN 'HUÁNUCO'
                    WHEN A.n_numdep = '0491' THEN 'ICA'
                    WHEN A.n_numdep = '0490' THEN 'LA LIBERTAD'
                    WHEN A.n_numdep = '0489' THEN 'LORETO'
                    WHEN A.n_numdep = '0492' THEN 'MOQUEGUA'
                    WHEN A.n_numdep = '1017' THEN 'PIURA'
                    WHEN A.n_numdep = '0493' THEN 'TUMBES'
                    WHEN A.n_numdep = '0495' THEN 'ANCASH'
                    WHEN A.n_numdep = '1020' THEN 'CALLAO'
                    WHEN A.n_numdep = '1022' THEN 'LAMBAYEQUE'
                    WHEN A.n_numdep = '1150' THEN 'AYACUCHO'
                    WHEN A.n_numdep = '1151' THEN 'PUNO'
                    WHEN A.n_numdep = '1267' THEN 'SAN MARTIN'
                    WHEN A.n_numdep = '1268' THEN 'JUNÍN'
                    WHEN A.n_numdep = '1273' THEN 'LIMA PROVINCIA'
                    WHEN A.n_numdep = '1278' THEN 'PASCO'
                    WHEN A.n_numdep = '1281' THEN 'MADRE DE DIOS'
                    WHEN a.n_numdep = '1285' THEN 'HUANCAVELICA'
                    WHEN a.n_numdep = '1288' THEN 'AMAZONAS'
                    WHEN a.n_numdep = '1291' THEN 'APURÍMAC'
                    WHEN a.n_numdep = '1294' THEN 'UCAYALI'
                    WHEN a.n_numdep = '1297' THEN 'TACNA'
                    ELSE 'OTRAS REGIONES'
                END AS REGION,
                TO_CHAR(A.D_FECCIERRE,'YYYY') AS AÑO_CIERRE,
                A.N_CODLINACC
            FROM SIIT.VST_ORDENESINSPECCION A
            LEFT JOIN SIIT.VST_MATINSPECXOI C on (a.v_numordinsp=c.V_NUMORDINSP and a.v_anho=c.V_ANHO and a.n_numdep=c.N_NUMDEP)
            WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
                AND C.N_CODGRUPMAT = 72  -- Filtro por materia Ergonomía
        )
        GROUP BY REGION
        ORDER BY COUNT(*) DESC`;
    
    return await executeQuery(sql);
}

// Calcular resumen de los datos
function calcularResumen(datosTabla1, datosTabla2) {
    let totalOrdenes = 0;
    let denuncias = 0;
    let operativos = 0;
    let actasInfraccion = 0;
    let informesInspeccion = 0;
    let ordenes2025 = 0;
    
    // Calcular desde tabla 1 (origen)
    if (datosTabla1 && datosTabla1.length > 0) {
        datosTabla1.forEach(row => {
            if (row.ORIGEN === 'DENUNCIA') {
                denuncias = parseInt(row.Total) || 0;
            } else if (row.ORIGEN === 'OPERATIVO') {
                operativos = parseInt(row.Total) || 0;
            }
            ordenes2025 += parseInt(row["2025"]) || 0;
        });
        totalOrdenes = denuncias + operativos;
    }
    
    // Calcular desde tabla 2 (resultado)
    if (datosTabla2 && datosTabla2.length > 0) {
        datosTabla2.forEach(row => {
            if (row.V_RESULTADO === 'ACTA DE INFRACCION') {
                actasInfraccion = parseInt(row.Total) || 0;
            } else if (row.V_RESULTADO === 'INFORME DE INSPECCION') {
                informesInspeccion = parseInt(row.Total) || 0;
            }
        });
    }
    
    return {
        totalOrdenes,
        denuncias,
        operativos,
        actasInfraccion,
        informesInspeccion,
        ordenes2025
    };
}

module.exports = { 
    initializePool, 
    executeQuery, 
    getEmpresaDatosGenerales, 
    getListaTrabajadoresUltimoPeriodo, 
    getResumenTrabajadoresUltimoPeriodo, 
    getTrabajadorDatos, 
    getTrabajadorUltimaPlanilla,
    generarReporteErgonomia,
    obtenerTablaOrigen,
    obtenerTablaResultado,
    obtenerTablaSector,
    obtenerTablaRegion,
    calcularResumen
};