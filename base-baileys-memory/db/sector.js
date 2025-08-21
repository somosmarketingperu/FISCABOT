const { executeQuerySIIT } = require('./connection');
const { generarPDFReporteSector } = require('../reports/sectorReport');

async function obtenerTablaOrigenSector(codSec) {
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
            TO_CHAR(A.D_FECCIERRE, 'YYYY') AS AÑO_CIERRE,
            CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_FLGCIEFOR = 'S' THEN 'SI' ELSE 'NO' END AS CIERRE_MASIVO,
            CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_OBS LIKE '%TRANS%' THEN 'SI' ELSE 'NO' END AS TRANSFERENCIA,
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
        WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
          AND A.V_CODSEC = :codSec
    ) b
    WHERE ORDENES_PROCEDEN = 'SI'
      AND CIERRE_MASIVO = 'NO'
      AND TRANSFERENCIA = 'NO'
    GROUP BY ORIGEN
    ORDER BY ORIGEN`;
  return executeQuerySIIT(sql, [codSec]);
}

function calcularResumenSector(rows) {
  let totalOrdenes = 0, denuncias = 0, operativos = 0, ordenes2025 = 0;
  (rows || []).forEach(r => {
    if (r.ORIGEN === 'DENUNCIA') denuncias = parseInt(r.Total) || 0;
    if (r.ORIGEN === 'OPERATIVO') operativos = parseInt(r.Total) || 0;
    ordenes2025 += parseInt(r['2025']) || 0;
  });
  totalOrdenes = denuncias + operativos;
  return { totalOrdenes, denuncias, operativos, ordenes2025 };
}

function calcularResumenRegionSector(rows) {
  if (!rows || rows.length === 0) {
    return "No hay datos disponibles para mostrar el resumen por región.";
  }
  
  // Ordenar por total descendente y tomar las 3 primeras regiones
  const topRegiones = rows
    .sort((a, b) => parseInt(b.Total) - parseInt(a.Total))
    .slice(0, 3);
  
  if (topRegiones.length === 0) {
    return "No hay datos suficientes para mostrar el resumen por región.";
  }
  
  const totalGeneral = rows.reduce((sum, row) => sum + parseInt(row.Total), 0);
  
  let resumen = `Durante el período 2016 - 2025, las regiones con mayor actividad inspectiva fueron: `;
  
  if (topRegiones.length === 1) {
    resumen += `${topRegiones[0].REGION} con ${topRegiones[0].Total} inspecciones (${((parseInt(topRegiones[0].Total) / totalGeneral) * 100).toFixed(1)}% del total).`;
  } else if (topRegiones.length === 2) {
    resumen += `${topRegiones[0].REGION} con ${topRegiones[0].Total} inspecciones (${((parseInt(topRegiones[0].Total) / totalGeneral) * 100).toFixed(1)}% del total) y ${topRegiones[1].REGION} con ${topRegiones[1].Total} inspecciones (${((parseInt(topRegiones[1].Total) / totalGeneral) * 100).toFixed(1)}% del total).`;
  } else {
    resumen += `${topRegiones[0].REGION} con ${topRegiones[0].Total} inspecciones (${((parseInt(topRegiones[0].Total) / totalGeneral) * 100).toFixed(1)}% del total), ${topRegiones[1].REGION} con ${topRegiones[1].Total} inspecciones (${((parseInt(topRegiones[1].Total) / totalGeneral) * 100).toFixed(1)}% del total) y ${topRegiones[2].REGION} con ${topRegiones[2].Total} inspecciones (${((parseInt(topRegiones[2].Total) / totalGeneral) * 100).toFixed(1)}% del total).`;
  }
  
  return resumen;
}

function calcularResumenResultadoSector(rows) {
  if (!rows || rows.length === 0) {
    return "No hay datos disponibles para mostrar el resumen por resultado.";
  }
  
  const totalInspecciones = rows.reduce((sum, row) => sum + parseInt(row.Total), 0);
  const actas = rows.find(r => r.RESULTADO === 'ACTA')?.Total || 0;
  const informes = rows.find(r => r.RESULTADO === 'INFORME')?.Total || 0;
  
  const porcentajeActas = totalInspecciones > 0 ? ((parseInt(actas) / totalInspecciones) * 100).toFixed(2) : '0.00';
  const porcentajeInformes = totalInspecciones > 0 ? ((parseInt(informes) / totalInspecciones) * 100).toFixed(2) : '0.00';
  
  return `Además, se aprecia que durante el periodo 2016 - 2025, como resultado de las ${totalInspecciones.toLocaleString()} inspecciones realizadas, se emitieron ${parseInt(actas).toLocaleString()} actas de infracciones y ${parseInt(informes).toLocaleString()} informes de actuación inspectiva que representa el ${porcentajeActas}% y ${porcentajeInformes}% de manera respectiva.`;
}

async function obtenerTablaRegionSector(codSec) {
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
        TO_CHAR(A.D_FECCIERRE,'YYYY') AS AÑO_CIERRE
      FROM SIIT.VST_ORDENESINSPECCION A
      WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
        AND A.V_CODSEC = :codSec
        AND (
          CASE
            WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_FLGCIEFOR = 'S' THEN 'SI' ELSE 'NO'
          END
        ) = 'NO'
        AND (
          CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_OBS LIKE '%TRANS%' THEN 'SI' ELSE 'NO' END
        ) = 'NO'
        AND (
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
          END
        ) = 'SI'
    )
    GROUP BY REGION
    ORDER BY COUNT(*) DESC`;
  return executeQuerySIIT(sql, [codSec]);
}

async function obtenerTablaResultadoSector(codSec) {
  const sql = `
    SELECT
      RESULTADO,
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
          WHEN A.V_RESULTADO = 'ACTA DE INFRACCION' THEN 'ACTA'
          WHEN A.V_RESULTADO = 'INFORME' THEN 'INFORME'
          WHEN A.V_RESULTADO = '-' THEN 'INFORME'
          WHEN A.V_RESULTADO IS NULL THEN 'INFORME'
          ELSE 'INFORME'
        END AS RESULTADO,
        TO_CHAR(A.D_FECCIERRE, 'YYYY') AS AÑO_CIERRE,
        CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_FLGCIEFOR = 'S' THEN 'SI' ELSE 'NO' END AS CIERRE_MASIVO,
        CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_OBS LIKE '%TRANS%' THEN 'SI' ELSE 'NO' END AS TRANSFERENCIA,
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
      WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
        AND A.V_CODSEC = :codSec
    ) b
    WHERE ORDENES_PROCEDEN = 'SI'
      AND CIERRE_MASIVO = 'NO'
      AND TRANSFERENCIA = 'NO'
    GROUP BY RESULTADO
    ORDER BY RESULTADO`;
  return executeQuerySIIT(sql, [codSec]);
}

// Top 15 materias con mayor cantidad de órdenes de inspección (2016-2025) por sector
async function obtenerTopMateriasSector(codSec) {
  const sql = `
    SELECT materia_inspeccionada FROM (
      SELECT
        V_DESGRUPMAT AS materia_inspeccionada,
        COUNT(DISTINCT NUMERO_ORDEN) AS total_ordenes
      FROM (
        SELECT DISTINCT
          TO_NUMBER(A.V_ANHO) || '-' || A.N_NUMDEP || '-' || A.V_NUMORDINSP AS NUMERO_ORDEN,
          C.N_CODGRUPMAT,
          C.V_DESGRUPMAT,
          CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_FLGCIEFOR = 'S' THEN 'SI' ELSE 'NO' END AS CIERRE_MASIVO,
          CASE WHEN A.D_FECCIERRE >= TO_DATE('01/01/2020','DD/MM/YYYY') AND A.V_OBS LIKE '%TRANS%' THEN 'SI' ELSE 'NO' END AS TRANSFERENCIA,
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
        LEFT JOIN SIIT.VST_MATINSPECXOI C ON (A.V_NUMORDINSP = C.V_NUMORDINSP AND A.V_ANHO = C.V_ANHO AND A.N_NUMDEP = C.N_NUMDEP)
        WHERE (A.D_FECCIERRE >= TO_DATE('01/01/2016','DD/MM/YYYY') AND A.D_FECCIERRE < SYSDATE)
          AND C.N_CODGRUPMAT IS NOT NULL
          AND A.V_CODSEC = :codSec
      ) b
      WHERE (ORDENES_PROCEDEN = 'SI' AND CIERRE_MASIVO = 'NO' AND TRANSFERENCIA = 'NO')
      GROUP BY V_DESGRUPMAT
      ORDER BY 2 DESC
    )
    WHERE ROWNUM <= 15`;
  return executeQuerySIIT(sql, [codSec]);
}

// Tabla 5: PAS - Resoluciones y Multas en primera instancia (2016-2025)
async function obtenerTablaPASSEctor(codSec) {
  const sql = `
    SELECT 
      'Resoluciones' AS Descripcion,
      SUM(CASE WHEN AÑO_RES = '2016' THEN 1 ELSE 0 END) AS "2016",
      SUM(CASE WHEN AÑO_RES = '2017' THEN 1 ELSE 0 END) AS "2017",
      SUM(CASE WHEN AÑO_RES = '2018' THEN 1 ELSE 0 END) AS "2018",
      SUM(CASE WHEN AÑO_RES = '2019' THEN 1 ELSE 0 END) AS "2019",
      SUM(CASE WHEN AÑO_RES = '2020' THEN 1 ELSE 0 END) AS "2020",
      SUM(CASE WHEN AÑO_RES = '2021' THEN 1 ELSE 0 END) AS "2021",
      SUM(CASE WHEN AÑO_RES = '2022' THEN 1 ELSE 0 END) AS "2022",
      SUM(CASE WHEN AÑO_RES = '2023' THEN 1 ELSE 0 END) AS "2023",
      SUM(CASE WHEN AÑO_RES = '2024' THEN 1 ELSE 0 END) AS "2024",
      SUM(CASE WHEN AÑO_RES = '2025' THEN 1 ELSE 0 END) AS "2025",
      COUNT(*) AS Total
    FROM (
      SELECT * FROM (
        SELECT SECTOR_ECONOMICO, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA, ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn FROM (
          -- PRIMERA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHORES) || '-' || E.N_NUMDEPDESRES || '-' || E.V_NUMRES AS NUMERO_RES,
            TO_CHAR(E.D_FECRES,'YYYY') AS AÑO_RES,
            E.D_FECRES AS FECHARES,
            E.N_MONTOMULTARES AS MULTA,
            E.V_DESTIPRES,
            E.V_FLGANUL_RSD AS ANULACION,
            'PRIMERA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FECRES >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FECRES < SYSDATE
          UNION ALL
          -- SEGUNDA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHO_RD) || '-' || E.N_NUMDEP_RD || '-' || E.V_NUM_RD AS NUMERO_RES,
            TO_CHAR(E.D_FEC_RD,'YYYY') AS AÑO_RES,
            E.D_FEC_RD AS FECHARES,
            E.N_MONTOMULTA_RD AS MULTA,
            E.V_DESTIP_RD AS V_DESTIPRES,
            E.V_FLGANUL_RD AS ANULACION,
            'SEGUNDA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FEC_RD >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FEC_RD < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA' AND SECTOR_ECONOMICO = (CASE WHEN :codSec = 'A' THEN 'AGRICULTURA' WHEN :codSec = 'K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)' WHEN :codSec = 'M' THEN 'ENSEÑANZA' WHEN :codSec = 'F' THEN 'CONSTRUCCIÓN' WHEN :codSec = 'G' THEN 'COMERCIO AL POR MAYOR Y MENOR' WHEN :codSec = 'D' THEN 'INDUSTRIAS MANUFACTURERAS' WHEN :codSec = 'H' THEN 'HOTELES Y RESTAURANTES' WHEN :codSec = 'I' THEN 'TRANSPORTES Y ALMACENAMIENTO' WHEN :codSec = 'O' THEN 'OTROS' WHEN :codSec = 'N' THEN 'SERVICIOS SOCIALES Y DE SALUD' WHEN :codSec = 'C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS' WHEN :codSec = 'J' THEN 'INTERMEDIACIÓN FINANCIERA' WHEN :codSec = 'L' THEN 'ADMINISTRACIÓN PÚBLICA' WHEN :codSec = 'E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA' WHEN :codSec = 'B' THEN 'PESCA' ELSE 'OTROS' END)
      ) WHERE rn = 1 AND INSTANCIA = 'PRIMERA'
    )
    UNION ALL
    SELECT 
      'Multas' AS Descripcion,
      ROUND(SUM(CASE WHEN AÑO_RES = '2016' THEN MULTA ELSE 0 END), 0) AS "2016",
      ROUND(SUM(CASE WHEN AÑO_RES = '2017' THEN MULTA ELSE 0 END), 0) AS "2017",
      ROUND(SUM(CASE WHEN AÑO_RES = '2018' THEN MULTA ELSE 0 END), 0) AS "2018",
      ROUND(SUM(CASE WHEN AÑO_RES = '2019' THEN MULTA ELSE 0 END), 0) AS "2019",
      ROUND(SUM(CASE WHEN AÑO_RES = '2020' THEN MULTA ELSE 0 END), 0) AS "2020",
      ROUND(SUM(CASE WHEN AÑO_RES = '2021' THEN MULTA ELSE 0 END), 0) AS "2021",
      ROUND(SUM(CASE WHEN AÑO_RES = '2022' THEN MULTA ELSE 0 END), 0) AS "2022",
      ROUND(SUM(CASE WHEN AÑO_RES = '2023' THEN MULTA ELSE 0 END), 0) AS "2023",
      ROUND(SUM(CASE WHEN AÑO_RES = '2024' THEN MULTA ELSE 0 END), 0) AS "2024",
      ROUND(SUM(CASE WHEN AÑO_RES = '2025' THEN MULTA ELSE 0 END), 0) AS "2025",
      ROUND(SUM(MULTA), 0) AS Total
    FROM (
      SELECT * FROM (
        SELECT SECTOR_ECONOMICO, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA, ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn FROM (
          -- PRIMERA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHORES) || '-' || E.N_NUMDEPDESRES || '-' || E.V_NUMRES AS NUMERO_RES,
            TO_CHAR(E.D_FECRES,'YYYY') AS AÑO_RES,
            E.D_FECRES AS FECHARES,
            E.N_MONTOMULTARES AS MULTA,
            E.V_DESTIPRES,
            E.V_FLGANUL_RSD AS ANULACION,
            'PRIMERA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FECRES >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FECRES < SYSDATE
          UNION ALL
          -- SEGUNDA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHO_RD) || '-' || E.N_NUMDEP_RD || '-' || E.V_NUM_RD AS NUMERO_RES,
            TO_CHAR(E.D_FEC_RD,'YYYY') AS AÑO_RES,
            E.D_FEC_RD AS FECHARES,
            E.N_MONTOMULTA_RD AS MULTA,
            E.V_DESTIP_RD AS V_DESTIPRES,
            E.V_FLGANUL_RD AS ANULACION,
            'SEGUNDA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FEC_RD >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FEC_RD < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA' AND SECTOR_ECONOMICO = (CASE WHEN :codSec = 'A' THEN 'AGRICULTURA' WHEN :codSec = 'K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)' WHEN :codSec = 'M' THEN 'ENSEÑANZA' WHEN :codSec = 'F' THEN 'CONSTRUCCIÓN' WHEN :codSec = 'G' THEN 'COMERCIO AL POR MAYOR Y MENOR' WHEN :codSec = 'D' THEN 'INDUSTRIAS MANUFACTURERAS' WHEN :codSec = 'H' THEN 'HOTELES Y RESTAURANTES' WHEN :codSec = 'I' THEN 'TRANSPORTES Y ALMACENAMIENTO' WHEN :codSec = 'O' THEN 'OTROS' WHEN :codSec = 'N' THEN 'SERVICIOS SOCIALES Y DE SALUD' WHEN :codSec = 'C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS' WHEN :codSec = 'J' THEN 'INTERMEDIACIÓN FINANCIERA' WHEN :codSec = 'L' THEN 'ADMINISTRACIÓN PÚBLICA' WHEN :codSec = 'E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA' WHEN :codSec = 'B' THEN 'PESCA' ELSE 'OTROS' END)
      ) WHERE rn = 1 AND INSTANCIA = 'PRIMERA'
    )
    ORDER BY Descripcion`;
  return executeQuerySIIT(sql, [codSec]);
}

// Tabla 7: PAS - Resoluciones y Multas en segunda instancia (2016-2025)
async function obtenerTablaPASSEctorSegunda(codSec) {
  const sql = `
    SELECT 
      'Resoluciones' AS Descripcion,
      SUM(CASE WHEN AÑO_RES = '2016' THEN 1 ELSE 0 END) AS "2016",
      SUM(CASE WHEN AÑO_RES = '2017' THEN 1 ELSE 0 END) AS "2017",
      SUM(CASE WHEN AÑO_RES = '2018' THEN 1 ELSE 0 END) AS "2018",
      SUM(CASE WHEN AÑO_RES = '2019' THEN 1 ELSE 0 END) AS "2019",
      SUM(CASE WHEN AÑO_RES = '2020' THEN 1 ELSE 0 END) AS "2020",
      SUM(CASE WHEN AÑO_RES = '2021' THEN 1 ELSE 0 END) AS "2021",
      SUM(CASE WHEN AÑO_RES = '2022' THEN 1 ELSE 0 END) AS "2022",
      SUM(CASE WHEN AÑO_RES = '2023' THEN 1 ELSE 0 END) AS "2023",
      SUM(CASE WHEN AÑO_RES = '2024' THEN 1 ELSE 0 END) AS "2024",
      SUM(CASE WHEN AÑO_RES = '2025' THEN 1 ELSE 0 END) AS "2025",
      COUNT(*) AS Total
    FROM (
      SELECT * FROM (
        SELECT SECTOR_ECONOMICO, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA, ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn FROM (
          -- PRIMERA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHORES) || '-' || E.N_NUMDEPDESRES || '-' || E.V_NUMRES AS NUMERO_RES,
            TO_CHAR(E.D_FECRES,'YYYY') AS AÑO_RES,
            E.D_FECRES AS FECHARES,
            E.N_MONTOMULTARES AS MULTA,
            E.V_DESTIPRES,
            E.V_FLGANUL_RSD AS ANULACION,
            'PRIMERA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FECRES >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FECRES < SYSDATE
          UNION ALL
          -- SEGUNDA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHO_RD) || '-' || E.N_NUMDEP_RD || '-' || E.V_NUM_RD AS NUMERO_RES,
            TO_CHAR(E.D_FEC_RD,'YYYY') AS AÑO_RES,
            E.D_FEC_RD AS FECHARES,
            E.N_MONTOMULTA_RD AS MULTA,
            E.V_DESTIP_RD AS V_DESTIPRES,
            E.V_FLGANUL_RD AS ANULACION,
            'SEGUNDA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FEC_RD >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FEC_RD < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA' AND SECTOR_ECONOMICO = (CASE WHEN :codSec = 'A' THEN 'AGRICULTURA' WHEN :codSec = 'K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)' WHEN :codSec = 'M' THEN 'ENSEÑANZA' WHEN :codSec = 'F' THEN 'CONSTRUCCIÓN' WHEN :codSec = 'G' THEN 'COMERCIO AL POR MAYOR Y MENOR' WHEN :codSec = 'D' THEN 'INDUSTRIAS MANUFACTURERAS' WHEN :codSec = 'H' THEN 'HOTELES Y RESTAURANTES' WHEN :codSec = 'I' THEN 'TRANSPORTES Y ALMACENAMIENTO' WHEN :codSec = 'O' THEN 'OTROS' WHEN :codSec = 'N' THEN 'SERVICIOS SOCIALES Y DE SALUD' WHEN :codSec = 'C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS' WHEN :codSec = 'J' THEN 'INTERMEDIACIÓN FINANCIERA' WHEN :codSec = 'L' THEN 'ADMINISTRACIÓN PÚBLICA' WHEN :codSec = 'E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA' WHEN :codSec = 'B' THEN 'PESCA' ELSE 'OTROS' END)
      ) WHERE rn = 1 AND INSTANCIA = 'SEGUNDA'
    )
    UNION ALL
    SELECT 
      'Multas' AS Descripcion,
      ROUND(SUM(CASE WHEN AÑO_RES = '2016' THEN MULTA ELSE 0 END), 0) AS "2016",
      ROUND(SUM(CASE WHEN AÑO_RES = '2017' THEN MULTA ELSE 0 END), 0) AS "2017",
      ROUND(SUM(CASE WHEN AÑO_RES = '2018' THEN MULTA ELSE 0 END), 0) AS "2018",
      ROUND(SUM(CASE WHEN AÑO_RES = '2019' THEN MULTA ELSE 0 END), 0) AS "2019",
      ROUND(SUM(CASE WHEN AÑO_RES = '2020' THEN MULTA ELSE 0 END), 0) AS "2020",
      ROUND(SUM(CASE WHEN AÑO_RES = '2021' THEN MULTA ELSE 0 END), 0) AS "2021",
      ROUND(SUM(CASE WHEN AÑO_RES = '2022' THEN MULTA ELSE 0 END), 0) AS "2022",
      ROUND(SUM(CASE WHEN AÑO_RES = '2023' THEN MULTA ELSE 0 END), 0) AS "2023",
      ROUND(SUM(CASE WHEN AÑO_RES = '2024' THEN MULTA ELSE 0 END), 0) AS "2024",
      ROUND(SUM(CASE WHEN AÑO_RES = '2025' THEN MULTA ELSE 0 END), 0) AS "2025",
      ROUND(SUM(MULTA), 0) AS Total
    FROM (
      SELECT * FROM (
        SELECT SECTOR_ECONOMICO, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA, ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn FROM (
          -- PRIMERA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHORES) || '-' || E.N_NUMDEPDESRES || '-' || E.V_NUMRES AS NUMERO_RES,
            TO_CHAR(E.D_FECRES,'YYYY') AS AÑO_RES,
            E.D_FECRES AS FECHARES,
            E.N_MONTOMULTARES AS MULTA,
            E.V_DESTIPRES,
            E.V_FLGANUL_RSD AS ANULACION,
            'PRIMERA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FECRES >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FECRES < SYSDATE
          UNION ALL
          -- SEGUNDA INSTANCIA
          SELECT DISTINCT
            CASE
              WHEN A.V_CODSEC='A' THEN 'AGRICULTURA'
              WHEN A.V_CODSEC='K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)'
              WHEN A.V_CODSEC='M' THEN 'ENSEÑANZA'
              WHEN A.V_CODSEC='F' THEN 'CONSTRUCCIÓN'
              WHEN A.V_CODSEC='G' THEN 'COMERCIO AL POR MAYOR Y MENOR'
              WHEN A.V_CODSEC='D' THEN 'INDUSTRIAS MANUFACTURERAS'
              WHEN A.V_CODSEC='H' THEN 'HOTELES Y RESTAURANTES'
              WHEN A.V_CODSEC='I' THEN 'TRANSPORTES Y ALMACENAMIENTO'
              WHEN A.V_CODSEC='O' THEN 'OTROS'
              WHEN A.V_CODSEC='N' THEN 'SERVICIOS SOCIALES Y DE SALUD'
              WHEN A.V_CODSEC='C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS'
              WHEN A.V_CODSEC='J' THEN 'INTERMEDIACIÓN FINANCIERA'
              WHEN A.V_CODSEC='L' THEN 'ADMINISTRACIÓN PÚBLICA'
              WHEN A.V_CODSEC='E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA'
              WHEN A.V_CODSEC='B' THEN 'PESCA'
              WHEN A.V_CODSEC IN ('P','Z','Q') OR A.V_CODSEC IS NULL OR A.V_CODSEC = '' THEN 'OTROS'
              ELSE 'OTROS'
            END AS SECTOR_ECONOMICO,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHO_RD) || '-' || E.N_NUMDEP_RD || '-' || E.V_NUM_RD AS NUMERO_RES,
            TO_CHAR(E.D_FEC_RD,'YYYY') AS AÑO_RES,
            E.D_FEC_RD AS FECHARES,
            E.N_MONTOMULTA_RD AS MULTA,
            E.V_DESTIP_RD AS V_DESTIPRES,
            E.V_FLGANUL_RD AS ANULACION,
            'SEGUNDA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FEC_RD >= TO_DATE('01/01/2016','DD/MM/YYYY') 
            AND E.D_FEC_RD < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA' AND SECTOR_ECONOMICO = (CASE WHEN :codSec = 'A' THEN 'AGRICULTURA' WHEN :codSec = 'K' THEN 'SERVICIOS (INMOBILIARIAS, EMPRESARIALES Y ALQUILERES)' WHEN :codSec = 'M' THEN 'ENSEÑANZA' WHEN :codSec = 'F' THEN 'CONSTRUCCIÓN' WHEN :codSec = 'G' THEN 'COMERCIO AL POR MAYOR Y MENOR' WHEN :codSec = 'D' THEN 'INDUSTRIAS MANUFACTURERAS' WHEN :codSec = 'H' THEN 'HOTELES Y RESTAURANTES' WHEN :codSec = 'I' THEN 'TRANSPORTES Y ALMACENAMIENTO' WHEN :codSec = 'O' THEN 'OTROS' WHEN :codSec = 'N' THEN 'SERVICIOS SOCIALES Y DE SALUD' WHEN :codSec = 'C' THEN 'EXPLOTACIÓN DE MINAS Y CANTERAS' WHEN :codSec = 'J' THEN 'INTERMEDIACIÓN FINANCIERA' WHEN :codSec = 'L' THEN 'ADMINISTRACIÓN PÚBLICA' WHEN :codSec = 'E' THEN 'SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA' WHEN :codSec = 'B' THEN 'PESCA' ELSE 'OTROS' END)
      ) WHERE rn = 1 AND INSTANCIA = 'SEGUNDA'
    )
    ORDER BY Descripcion`;
  return executeQuerySIIT(sql, [codSec]);
}

function calcularResumenPASGeneralSegunda(tabla7) {
  if (!Array.isArray(tabla7) || tabla7.length === 0) return '';
  let totalResoluciones = 0;
  let totalMultas = 0;
  tabla7.forEach(r => {
    const desc = (r.Descripcion || r.DESCRIPCION || '').toUpperCase();
    if (desc === 'RESOLUCIONES') totalResoluciones = Number(r.Total || r.TOTAL || 0);
    if (desc === 'MULTAS') totalMultas = Number(r.Total || r.TOTAL || 0);
  });
  const resolucionesFmt = totalResoluciones.toLocaleString('es-PE');
  const multasFmt = totalMultas.toLocaleString('es-PE');
  return `Del mismo modo, se emitieron ${resolucionesFmt} resoluciones de multa en segunda instancia, con un monto de multa de S/ ${multasFmt}.`;
}
// Tabla 6: PAS - Resoluciones de multa en primera instancia, por región (2016-2025)
async function obtenerTablaPASRegionSector(codSec) {
  const sql = `
    SELECT
      REGION,
      SUM(CASE WHEN AÑO_RES = '2016' THEN 1 ELSE 0 END) AS "2016",
      SUM(CASE WHEN AÑO_RES = '2017' THEN 1 ELSE 0 END) AS "2017",
      SUM(CASE WHEN AÑO_RES = '2018' THEN 1 ELSE 0 END) AS "2018",
      SUM(CASE WHEN AÑO_RES = '2019' THEN 1 ELSE 0 END) AS "2019",
      SUM(CASE WHEN AÑO_RES = '2020' THEN 1 ELSE 0 END) AS "2020",
      SUM(CASE WHEN AÑO_RES = '2021' THEN 1 ELSE 0 END) AS "2021",
      SUM(CASE WHEN AÑO_RES = '2022' THEN 1 ELSE 0 END) AS "2022",
      SUM(CASE WHEN AÑO_RES = '2023' THEN 1 ELSE 0 END) AS "2023",
      SUM(CASE WHEN AÑO_RES = '2024' THEN 1 ELSE 0 END) AS "2024",
      SUM(CASE WHEN AÑO_RES = '2025' THEN 1 ELSE 0 END) AS "2025",
      COUNT(*) AS Total
    FROM (
      SELECT * FROM (
        SELECT REGION, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA,
               ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn
        FROM (
          SELECT DISTINCT
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
              WHEN A.n_numdep IN ('0330','0515') THEN 'LORETO'
              WHEN A.n_numdep = '0336' THEN 'MADRE DE DIOS'
              WHEN A.n_numdep IN ('0325','0327') THEN 'MOQUEGUA'
              WHEN A.n_numdep IN ('0268','1278') THEN 'PASCO'
              WHEN A.n_numdep IN ('0337','0432','0524','0420','1017') THEN 'PIURA'
              WHEN A.n_numdep IN ('0329','0438','1151') THEN 'PUNO'
              WHEN A.n_numdep = '0338' THEN 'SAN MARTIN'
              WHEN A.n_numdep = '0328' THEN 'TACNA'
              WHEN A.n_numdep IN ('0250','0490') THEN 'LA LIBERTAD'
              WHEN A.n_numdep IN ('0339','0493') THEN 'TUMBES'
              WHEN A.n_numdep IN ('0326','1294') THEN 'UCAYALI'
              WHEN A.n_numdep IN ('0447','0446','0448','1267') THEN 'SAN MARTIN'
              WHEN A.n_numdep IN ('0506','1291') THEN 'APURÍMAC'
              WHEN A.n_numdep IN ('0324','0495','0494') THEN 'ANCASH'
              WHEN A.n_numdep = '0432' THEN 'PIURA'
              WHEN A.n_numdep = '0509' THEN 'AREQUIPA'
              WHEN A.n_numdep = '0487' THEN 'CAJAMARCA'
              WHEN A.n_numdep IN ('1005') THEN 'CUSCO'
              WHEN A.n_numdep IN ('0484') THEN 'HUÁNUCO'
              WHEN A.n_numdep IN ('0491') THEN 'ICA'
              WHEN A.n_numdep IN ('0489') THEN 'LORETO'
              WHEN A.n_numdep IN ('0492') THEN 'MOQUEGUA'
              WHEN A.n_numdep IN ('1020') THEN 'CALLAO'
              WHEN A.n_numdep IN ('1022') THEN 'LAMBAYEQUE'
              WHEN A.n_numdep IN ('1150') THEN 'AYACUCHO'
              WHEN A.n_numdep IN ('1268') THEN 'JUNÍN'
              WHEN A.n_numdep IN ('1273') THEN 'LIMA PROVINCIA'
              WHEN A.n_numdep IN ('1281') THEN 'MADRE DE DIOS'
              WHEN A.n_numdep IN ('1285') THEN 'HUANCAVELICA'
              WHEN A.n_numdep IN ('1288') THEN 'AMAZONAS'
              WHEN A.n_numdep IN ('1297') THEN 'TACNA'
              WHEN A.n_numdep IN ('0462','0460','0461') THEN 'LIMA'
              ELSE 'OTRAS REGIONES'
            END AS REGION,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHORES) || '-' || E.N_NUMDEPDESRES || '-' || E.V_NUMRES AS NUMERO_RES,
            TO_CHAR(E.D_FECRES,'YYYY') AS AÑO_RES,
            E.D_FECRES AS FECHARES,
            E.N_MONTOMULTARES AS MULTA,
            E.V_DESTIPRES,
            E.V_FLGANUL_RSD AS ANULACION,
            'PRIMERA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE A.V_CODSEC = :codSec
            AND E.V_DESTIPRES NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FECRES >= TO_DATE('01/01/2016','DD/MM/YYYY')
            AND E.D_FECRES < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA'
      ) WHERE rn = 1 AND INSTANCIA = 'PRIMERA'
    )
    GROUP BY REGION
    ORDER BY COUNT(*) DESC`;
  return executeQuerySIIT(sql, [codSec]);
}

function calcularResumenPASRegionSector(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 'No se registran resoluciones de multa en primera instancia en el período 2016 - 2025.';
  }
  const ordenadas = [...rows].sort((a, b) => (parseInt(b.Total || b.TOTAL || 0) - parseInt(a.Total || a.TOTAL || 0)));
  const top = ordenadas.slice(0, 3);
  const partes = top.map(r => r.REGION + '');
  if (top.length === 1) {
    return `La mayor cantidad de resoluciones de multa en primera instancia se dieron en la región de ${partes[0]}.`;
  }
  if (top.length === 2) {
    return `La mayor cantidad de resoluciones de multa en primera instancia se dieron en las regiones de ${partes[0]} y ${partes[1]}.`;
  }
  return `La mayor cantidad de resoluciones de multa en primera instancia se dieron en las regiones de ${partes[0]}, ${partes[1]}, ${partes[2]}.`;
}

function calcularResumenPASGeneral(tabla5) {
  if (!Array.isArray(tabla5) || tabla5.length === 0) return '';
  let totalResoluciones = 0;
  let totalMultas = 0;
  tabla5.forEach(r => {
    const desc = (r.Descripcion || r.DESCRIPCION || '').toUpperCase();
    if (desc === 'RESOLUCIONES') totalResoluciones = Number(r.Total || r.TOTAL || 0);
    if (desc === 'MULTAS') totalMultas = Number(r.Total || r.TOTAL || 0);
  });
  const resolucionesFmt = totalResoluciones.toLocaleString('es-PE');
  const multasFmt = totalMultas.toLocaleString('es-PE');
  return `Del mismo modo, se advierte que, como resultado del procedimiento administrativo sancionador, se emitieron ${resolucionesFmt} resoluciones en primera instancia, con un monto de multa de S/ ${multasFmt}.`;
}

async function generarReporteSector({ codSec, sectorTitulo }) {
  const datos1 = await obtenerTablaOrigenSector(codSec);
  const resumen = calcularResumenSector(datos1);
  const datos2 = await obtenerTablaRegionSector(codSec);
  const resumenRegion = calcularResumenRegionSector(datos2);
  const datos3 = await obtenerTablaResultadoSector(codSec);
  const resumenResultado = calcularResumenResultadoSector(datos3);
  const materiasTop = await obtenerTopMateriasSector(codSec);
  const tabla5 = await obtenerTablaPASSEctor(codSec);
  // Ordenar para que "Resoluciones" aparezca primero que "Multas"
  tabla5.sort((a, b) => {
    const da = (a.Descripcion || a.DESCRIPCION || '').toUpperCase();
    const db = (b.Descripcion || b.DESCRIPCION || '').toUpperCase();
    if (da === 'RESOLUCIONES' && db !== 'RESOLUCIONES') return -1;
    if (db === 'RESOLUCIONES' && da !== 'RESOLUCIONES') return 1;
    return 0;
  });
  const tabla6 = await obtenerTablaPASRegionSector(codSec);
  const resumenPASRegion = calcularResumenPASRegionSector(tabla6);
  const resumenPAS = calcularResumenPASGeneral(tabla5);
  // Tabla 7: Segunda instancia (igual estructura que tabla 5, pero INSTANCIA = 'SEGUNDA')
  const tabla7 = await obtenerTablaPASSEctorSegunda(codSec);
  // Ordenar para que "Resoluciones" aparezca primero que "Multas"
  tabla7.sort((a, b) => {
    const da = (a.Descripcion || a.DESCRIPCION || '').toUpperCase();
    const db = (b.Descripcion || b.DESCRIPCION || '').toUpperCase();
    if (da === 'RESOLUCIONES' && db !== 'RESOLUCIONES') return -1;
    if (db === 'RESOLUCIONES' && da !== 'RESOLUCIONES') return 1;
    return 0;
  });
  const resumenPASSegunda = calcularResumenPASGeneralSegunda(tabla7);
  // Tabla 8: Segunda instancia por región (igual estructura que tabla 6, pero INSTANCIA = 'SEGUNDA')
  const tabla8 = await obtenerTablaPASRegionSectorSegunda(codSec);
  const resumenPASRegionSegunda = calcularResumenPASRegionSectorSegunda(tabla8);
  return generarPDFReporteSector({ sectorTitulo, tabla1: datos1, tabla2: datos2, tabla3: datos3, resumen, resumenRegion, resumenResultado, materiasTop, tabla5, tabla6, resumenPASRegion, resumenPAS, tabla7, resumenPASSegunda, tabla8, resumenPASRegionSegunda });
}

// Tabla 8: PAS - Resoluciones de multa en segunda instancia, por región (2016-2025)
async function obtenerTablaPASRegionSectorSegunda(codSec) {
  const sql = `
    SELECT
      REGION,
      SUM(CASE WHEN AÑO_RES = '2016' THEN 1 ELSE 0 END) AS "2016",
      SUM(CASE WHEN AÑO_RES = '2017' THEN 1 ELSE 0 END) AS "2017",
      SUM(CASE WHEN AÑO_RES = '2018' THEN 1 ELSE 0 END) AS "2018",
      SUM(CASE WHEN AÑO_RES = '2019' THEN 1 ELSE 0 END) AS "2019",
      SUM(CASE WHEN AÑO_RES = '2020' THEN 1 ELSE 0 END) AS "2020",
      SUM(CASE WHEN AÑO_RES = '2021' THEN 1 ELSE 0 END) AS "2021",
      SUM(CASE WHEN AÑO_RES = '2022' THEN 1 ELSE 0 END) AS "2022",
      SUM(CASE WHEN AÑO_RES = '2023' THEN 1 ELSE 0 END) AS "2023",
      SUM(CASE WHEN AÑO_RES = '2024' THEN 1 ELSE 0 END) AS "2024",
      SUM(CASE WHEN AÑO_RES = '2025' THEN 1 ELSE 0 END) AS "2025",
      COUNT(*) AS Total
    FROM (
      SELECT * FROM (
        SELECT REGION, NUM_EXP_SAN, NUMERO_RES, AÑO_RES, MULTA, V_DESTIPRES, INSTANCIA,
               ROW_NUMBER() OVER (PARTITION BY NUM_EXP_SAN ORDER BY FECHARES DESC, NUMERO_RES DESC) rn
        FROM (
          SELECT DISTINCT
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
              WHEN A.n_numdep IN ('0330','0515') THEN 'LORETO'
              WHEN A.n_numdep = '0336' THEN 'MADRE DE DIOS'
              WHEN A.n_numdep IN ('0325','0327') THEN 'MOQUEGUA'
              WHEN A.n_numdep IN ('0268','1278') THEN 'PASCO'
              WHEN A.n_numdep IN ('0337','0432','0524','0420','1017') THEN 'PIURA'
              WHEN A.n_numdep IN ('0329','0438','1151') THEN 'PUNO'
              WHEN A.n_numdep = '0338' THEN 'SAN MARTIN'
              WHEN A.n_numdep = '0328' THEN 'TACNA'
              WHEN A.n_numdep IN ('0250','0490') THEN 'LA LIBERTAD'
              WHEN A.n_numdep IN ('0339','0493') THEN 'TUMBES'
              WHEN A.n_numdep IN ('0326','1294') THEN 'UCAYALI'
              WHEN A.n_numdep IN ('0447','0446','0448','1267') THEN 'SAN MARTIN'
              WHEN A.n_numdep IN ('0506','1291') THEN 'APURÍMAC'
              WHEN A.n_numdep IN ('0324','0495','0494') THEN 'ANCASH'
              WHEN A.n_numdep = '0432' THEN 'PIURA'
              WHEN A.n_numdep = '0509' THEN 'AREQUIPA'
              WHEN A.n_numdep = '0487' THEN 'CAJAMARCA'
              WHEN A.n_numdep IN ('1005') THEN 'CUSCO'
              WHEN A.n_numdep IN ('0484') THEN 'HUÁNUCO'
              WHEN A.n_numdep IN ('0491') THEN 'ICA'
              WHEN A.n_numdep IN ('0489') THEN 'LORETO'
              WHEN A.n_numdep IN ('0492') THEN 'MOQUEGUA'
              WHEN A.n_numdep IN ('1020') THEN 'CALLAO'
              WHEN A.n_numdep IN ('1022') THEN 'LAMBAYEQUE'
              WHEN A.n_numdep IN ('1150') THEN 'AYACUCHO'
              WHEN A.n_numdep IN ('1268') THEN 'JUNÍN'
              WHEN A.n_numdep IN ('1273') THEN 'LIMA PROVINCIA'
              WHEN A.n_numdep IN ('1281') THEN 'MADRE DE DIOS'
              WHEN A.n_numdep IN ('1285') THEN 'HUANCAVELICA'
              WHEN A.n_numdep IN ('1288') THEN 'AMAZONAS'
              WHEN A.n_numdep IN ('1297') THEN 'TACNA'
              WHEN A.n_numdep IN ('0462','0460','0461') THEN 'LIMA'
              ELSE 'OTRAS REGIONES'
            END AS REGION,
            TO_NUMBER(E.V_ANHOEXP) || '-' || E.N_NUMDEPEXP || '-' || E.V_NUMEXP AS NUM_EXP_SAN,
            TO_NUMBER(E.V_ANHO_RD) || '-' || E.N_NUMDEP_RD || '-' || E.V_NUM_RD AS NUMERO_RES,
            TO_CHAR(E.D_FEC_RD,'YYYY') AS AÑO_RES,
            E.D_FEC_RD AS FECHARES,
            E.N_MONTOMULTA_RD AS MULTA,
            E.V_DESTIP_RD AS V_DESTIPRES,
            E.V_FLGANUL_RD AS ANULACION,
            'SEGUNDA' AS INSTANCIA
          FROM SIIT.VST_ORDENESINSPECCION A
          LEFT JOIN SIIT.VST_EXPEDIENTE_RECURSO E ON (A.V_NUMORDINSP = E.V_NUM_OI AND A.N_NUMDEP = E.N_NUMDEP_OI AND A.V_ANHO = E.V_ANHO_OI)
          WHERE A.V_CODSEC = :codSec
            AND E.V_DESTIP_RD NOT IN ('CONCESIÓN DE RECURSO','DENEGATORIA DE RECURSO','CORRECCION')
            AND E.D_FEC_RD >= TO_DATE('01/01/2016','DD/MM/YYYY')
            AND E.D_FEC_RD < SYSDATE
        )
        WHERE ANULACION = 'N' AND V_DESTIPRES = 'MULTADA'
      ) WHERE rn = 1 AND INSTANCIA = 'SEGUNDA'
    )
    GROUP BY REGION
    ORDER BY COUNT(*) DESC`;
  return executeQuerySIIT(sql, [codSec]);
}

function calcularResumenPASRegionSectorSegunda(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 'No se registran resoluciones de multa en segunda instancia en el período 2016 - 2025.';
  }
  const ordenadas = [...rows].sort((a, b) => (parseInt(b.Total || b.TOTAL || 0) - parseInt(a.Total || a.TOTAL || 0)));
  const top = ordenadas.slice(0, 3);
  const partes = top.map(r => r.REGION + '');
  if (top.length === 1) {
    return `La mayor cantidad de resoluciones de multa en segunda instancia se dieron en la región de ${partes[0]}.`;
  }
  if (top.length === 2) {
    return `La mayor cantidad de resoluciones de multa en segunda instancia se dieron en las regiones de ${partes[0]} y ${partes[1]}.`;
  }
  return `La mayor cantidad de resoluciones de multa en segunda instancia se dieron en las regiones de ${partes[0]}, ${partes[1]}, ${partes[2]}.`;
}

module.exports = { obtenerTablaOrigenSector, obtenerTablaRegionSector, obtenerTablaResultadoSector, calcularResumenSector, calcularResumenRegionSector, calcularResumenResultadoSector, obtenerTopMateriasSector, obtenerTablaPASSEctor, obtenerTablaPASRegionSector, calcularResumenPASRegionSector, calcularResumenPASGeneral, obtenerTablaPASSEctorSegunda, calcularResumenPASGeneralSegunda, generarReporteSector, obtenerTablaPASRegionSectorSegunda, calcularResumenPASRegionSectorSegunda };


