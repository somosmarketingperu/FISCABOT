const { executeQuerySIIT } = require('./connection');
const { generarPDFReporteErgonomia } = require('../reports/ergonomiaReport');

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
                AND C.N_CODGRUPMAT = 72
        ) b
        WHERE ORDENES_PROCEDEN = 'SI' AND CIERRE_MASIVO = 'NO' AND TRANSFERENCIA = 'NO'
        GROUP BY ORIGEN
        ORDER BY ORIGEN`;
  return await executeQuerySIIT(sql);
}

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
                AND C.N_CODGRUPMAT = 72
        ) 
        GROUP BY V_RESULTADO
        ORDER BY V_RESULTADO`;
  return await executeQuerySIIT(sql);
}

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
                AND C.N_CODGRUPMAT = 72
        )
        GROUP BY SECTOR_ECONOMICO
        ORDER BY COUNT(*) DESC`;
  return await executeQuerySIIT(sql);
}

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
                AND C.N_CODGRUPMAT = 72
        )
        GROUP BY REGION
        ORDER BY COUNT(*) DESC`;
  return await executeQuerySIIT(sql);
}

async function obtenerTablaResolucionesPrimeraInstanciaErgonomia() {
  const sql = `
        SELECT
            'Resoluciones' AS Descripcion,
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM
            SIIT.VST_EXPEDIENTE_RECURSO E
        INNER JOIN SIIT.VST_MATXRSD D
            ON E.V_ANHORES = D.V_ANHORES
            AND E.N_NUMDEPDESRES = D.N_NUMDEPDESRES
            AND E.V_NUMRES = D.V_NUMRES
        WHERE
            D.N_CODGRUPMAT = 72
            AND D.N_CODSUBGRUPMAT IN (222, 999)
            AND E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO', 'DENEGATORIA DE RECURSO', 'CORRECCION')
            AND D.N_MONTOXMAT > 0
            AND E.V_FLGANUL_RSD = 'N'
        UNION ALL
        SELECT
            'Multas' AS Descripcion,
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2016' THEN D.N_MONTOXMAT ELSE 0 END) AS "2016",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2017' THEN D.N_MONTOXMAT ELSE 0 END) AS "2017",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2018' THEN D.N_MONTOXMAT ELSE 0 END) AS "2018",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2019' THEN D.N_MONTOXMAT ELSE 0 END) AS "2019",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2020' THEN D.N_MONTOXMAT ELSE 0 END) AS "2020",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2021' THEN D.N_MONTOXMAT ELSE 0 END) AS "2021",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2022' THEN D.N_MONTOXMAT ELSE 0 END) AS "2022",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2023' THEN D.N_MONTOXMAT ELSE 0 END) AS "2023",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2024' THEN D.N_MONTOXMAT ELSE 0 END) AS "2024",
            SUM(CASE WHEN TO_CHAR(E.D_FECRES,'YYYY') = '2025' THEN D.N_MONTOXMAT ELSE 0 END) AS "2025",
            SUM(D.N_MONTOXMAT) AS "Total"
        FROM
            SIIT.VST_EXPEDIENTE_RECURSO E
        INNER JOIN SIIT.VST_MATXRSD D
            ON E.V_ANHORES = D.V_ANHORES
            AND E.N_NUMDEPDESRES = D.N_NUMDEPDESRES
            AND E.V_NUMRES = D.V_NUMRES
        WHERE
            D.N_CODGRUPMAT = 72
            AND D.N_CODSUBGRUPMAT IN (222, 999)
            AND E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO', 'DENEGATORIA DE RECURSO', 'CORRECCION')
            AND D.N_MONTOXMAT > 0
            AND E.V_FLGANUL_RSD = 'N'
            AND (E.D_FECRES >= TO_DATE('01/01/2016', 'DD/MM/YYYY') AND E.D_FECRES < SYSDATE)`;
  return await executeQuerySIIT(sql);
}

async function obtenerTablaResolucionesSegundaInstanciaErgonomia() {
  const sql = `
        SELECT
            'Resoluciones' AS Descripcion,
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2016' THEN 1 ELSE 0 END) AS "2016",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2017' THEN 1 ELSE 0 END) AS "2017",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2018' THEN 1 ELSE 0 END) AS "2018",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2019' THEN 1 ELSE 0 END) AS "2019",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2020' THEN 1 ELSE 0 END) AS "2020",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2021' THEN 1 ELSE 0 END) AS "2021",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2022' THEN 1 ELSE 0 END) AS "2022",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2023' THEN 1 ELSE 0 END) AS "2023",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2024' THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2025' THEN 1 ELSE 0 END) AS "2025",
            COUNT(*) AS "Total"
        FROM
            SIIT.VST_EXPEDIENTE_RECURSO E
        INNER JOIN SIIT.VST_MATXRD D
            ON E.V_NUM_RD = D.V_NUM_RD
            AND E.V_ANHO_RD = D.V_ANHO_RD
            AND E.N_NUMDEP_RD = D.N_NUMDEP_RD
        WHERE
            D.N_CODGRUPMAT = 72
            AND D.N_CODSUBGRUPMAT IN (222, 999)
            AND E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO', 'DENEGATORIA DE RECURSO', 'CORRECCION')
            AND D.N_MONTOXMAT > 0
            AND E.V_FLGANUL_RD = 'N'
        UNION ALL
        SELECT
            'Multas' AS Descripcion,
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2016' THEN D.N_MONTOXMAT ELSE 0 END) AS "2016",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2017' THEN D.N_MONTOXMAT ELSE 0 END) AS "2017",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2018' THEN D.N_MONTOXMAT ELSE 0 END) AS "2018",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2019' THEN D.N_MONTOXMAT ELSE 0 END) AS "2019",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2020' THEN D.N_MONTOXMAT ELSE 0 END) AS "2020",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2021' THEN D.N_MONTOXMAT ELSE 0 END) AS "2021",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2022' THEN D.N_MONTOXMAT ELSE 0 END) AS "2022",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2023' THEN D.N_MONTOXMAT ELSE 0 END) AS "2023",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2024' THEN D.N_MONTOXMAT ELSE 0 END) AS "2024",
            SUM(CASE WHEN TO_CHAR(E.D_FEC_RD,'YYYY') = '2025' THEN D.N_MONTOXMAT ELSE 0 END) AS "2025",
            SUM(D.N_MONTOXMAT) AS "Total"
        FROM
            SIIT.VST_EXPEDIENTE_RECURSO E
        INNER JOIN SIIT.VST_MATXRD D
            ON E.V_NUM_RD = D.V_NUM_RD
            AND E.V_ANHO_RD = D.V_ANHO_RD
            AND E.N_NUMDEP_RD = D.N_NUMDEP_RD
        WHERE
            D.N_CODGRUPMAT = 72
            AND D.N_CODSUBGRUPMAT IN (222, 999)
            AND E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO', 'DENEGATORIA DE RECURSO', 'CORRECCION')
            AND D.N_MONTOXMAT > 0
            AND E.V_FLGANUL_RD = 'N'
            AND (E.D_FEC_RD >= TO_DATE('01/01/2016', 'DD/MM/YYYY') AND E.D_FEC_RD < SYSDATE)`;
  return await executeQuerySIIT(sql);
}

function calcularResumen(datosTabla1, datosTabla2) {
  let totalOrdenes = 0, denuncias = 0, operativos = 0, actasInfraccion = 0, informesInspeccion = 0, ordenes2025 = 0;
  if (datosTabla1 && datosTabla1.length > 0) {
    datosTabla1.forEach(row => {
      if (row.ORIGEN === 'DENUNCIA') denuncias = parseInt(row.Total) || 0;
      else if (row.ORIGEN === 'OPERATIVO') operativos = parseInt(row.Total) || 0;
      ordenes2025 += parseInt(row['2025']) || 0;
    });
    totalOrdenes = denuncias + operativos;
  }
  if (datosTabla2 && datosTabla2.length > 0) {
    datosTabla2.forEach(row => {
      if (row.V_RESULTADO === 'ACTA DE INFRACCION') actasInfraccion = parseInt(row.Total) || 0;
      else if (row.V_RESULTADO === 'INFORME DE INSPECCION') informesInspeccion = parseInt(row.Total) || 0;
    });
  }
  return { totalOrdenes, denuncias, operativos, actasInfraccion, informesInspeccion, ordenes2025 };
}

async function generarReporteErgonomia() {
  try {
    console.log('🔄 Generando reporte de ergonomía...');
    const datosTabla1 = await obtenerTablaOrigen();
    const datosTabla2 = await obtenerTablaResultado();
    const datosTabla3 = await obtenerTablaSector();
    const datosTabla4 = await obtenerTablaRegion();
    const datosTabla5 = await obtenerTablaResolucionesPrimeraInstanciaErgonomia();
    const datosTabla6 = await obtenerTablaResolucionesSegundaInstanciaErgonomia();
    const resumen = calcularResumen(datosTabla1, datosTabla2);
    const pdfBuffer = await generarPDFReporteErgonomia({
      titulo: 'AYUDA DE MEMORIA DEL SISTEMA DE INSPECCIÓN DEL TRABAJO EN: MATERIA: MATER-Ergonomía(72)',
      tabla1: datosTabla1, tabla2: datosTabla2, tabla3: datosTabla3, tabla4: datosTabla4,
      tabla5: datosTabla5, tabla6: datosTabla6, resumen
    });
    console.log('✅ Reporte de ergonomía generado exitosamente');
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error generando reporte de ergonomía:', error);
    throw error;
  }
}

module.exports = {
  obtenerTablaOrigen,
  obtenerTablaResultado,
  obtenerTablaSector,
  obtenerTablaRegion,
  obtenerTablaResolucionesPrimeraInstanciaErgonomia,
  obtenerTablaResolucionesSegundaInstanciaErgonomia,
  calcularResumen,
  generarReporteErgonomia,
};


