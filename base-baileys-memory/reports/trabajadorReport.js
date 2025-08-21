const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// === Encabezado consistente con el reporte de RUC ===
function agregarEncabezado(doc) {
  try {
    // Misma ruta que el reporte de RUC
    const logoPath = 'C:\\Users\\jgarciaq\\Documents\\ChatBots\\FiscaBot\\base-baileys-memory\\logo-sunafil.png';
    doc.image(logoPath, 50, 15, { width: 250, height: 40 });
  } catch (error) {
    // Fallback si no se puede cargar el logo
    doc.fontSize(10).font('Helvetica-Bold').fillColor('red').text('SUNAFIL', 50, 20);
    doc.fontSize(7).font('Helvetica').fillColor('gray').text('SUPERINTENDENCIA NACIONAL DE FISCALIZACIÓN LABORAL', 50, 35);
  }

  // Textos oficiales (centrados)
  doc.fontSize(8).font('Helvetica').fillColor('black').text('"Decenio de la igualdad de oportunidades para mujeres y hombres"', 50, 65, { width: 495, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor('black').text('"Año de la Recuperación y Consolidación de la Economía Peruana"', 50, 75, { width: 495, align: 'center' });

  // Línea separadora
  doc.strokeColor('gray').lineWidth(0.5).moveTo(50, 85).lineTo(545, 85).stroke();

  // Título del reporte en banner negro
  const tituloWidth = 495;
  const tituloX = (595.28 - tituloWidth) / 2; // centrado
  doc.rect(tituloX, 95, tituloWidth, 35).fill('black');
  doc.fontSize(12).font('Helvetica-Bold').fillColor('white').text('REPORTE INTEGRAL DEL TRABAJADOR', tituloX, 103, { width: tituloWidth, align: 'center' });
  doc.moveDown(1);
  doc.fillColor('black');
  doc.strokeColor('black');
}
function formatPeriodo(periodo) {
  if (!periodo) return '-';
  const str = periodo.toString();
  if (str.length !== 6) return periodo;
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const anio = str.substring(0, 4);
  const mes = parseInt(str.substring(4, 6), 10);
  return `${meses[mes - 1] || '-'} ${anio}`;
}

// === Utilidades de maquetado (mismo esquema tablas/bloques que RUC) ===
function drawSectionHeader(doc, titulo) {
  const x = doc.page.margins.left;
  let y = doc.y + 2;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const height = 18;
  if (y + height + 10 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.y + 2;
  }
  doc.save();
  doc.rect(x, y, width, height).fill('black');
  doc.fillColor('white').font('Helvetica-Bold').fontSize(11).text(titulo, x + 8, y + 4, { width: width - 16, align: 'left' });
  doc.restore();
  doc.moveDown(1.2);
}

function ensureSpace(doc, neededHeight) {
  const remaining = doc.page.height - doc.y - doc.page.margins.bottom;
  if (remaining < neededHeight) {
    doc.addPage();
    return true;
  }
  return false;
}

function drawKVTable(doc, rows, options = {}) {
  const marginLeft = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colKey = options.colKeyWidth || Math.floor(usableWidth * 0.35);
  const colVal = usableWidth - colKey;
  const rowH = options.rowHeight || 22;

  rows.forEach(([key, value]) => {
    ensureSpace(doc, rowH + 6);
    const y = doc.y;
    doc.rect(marginLeft, y, colKey, rowH).stroke();
    doc.rect(marginLeft + colKey, y, colVal, rowH).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text(key, marginLeft + 6, y + 6, { width: colKey - 12 });
    doc.font('Helvetica').fontSize(9).text((value ?? '').toString(), marginLeft + colKey + 6, y + 6, { width: colVal - 12 });
    doc.y = y + rowH;
  });
  doc.moveDown(0.3);
}

function generateTrabajadorReportPDF(trabajadorDatos, ultimaPlanilla) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fechaEtiqueta = `${dd}-${MM}-${yyyy}`;
  const dni = trabajadorDatos?.NUM_DOC || 'dni';
  const nombreArchivo = `Reporte_Trabajador_DNI_${dni}_${fechaEtiqueta}.pdf`;
  const outputPath = path.join(process.cwd(), nombreArchivo);

  const doc = new PDFDocument({ size: 'A4', autoFirstPage: false, margins: { top: 120, bottom: 50, left: 50, right: 50 } });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  function addFooter() {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor('gray').text(`Página ${i + 1} de ${range.count}`, 0, doc.page.height - 40, { align: 'center', width: doc.page.width });
    }
    doc.fillColor('black');
  }

  // Primera página y encabezado
  doc.addPage();
  agregarEncabezado(doc);
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica').text(`Fecha de generación: ${now.toLocaleString('es-PE')}`, { align: 'right' });
  doc.moveDown(0.5);

  // Encabezado para nuevas páginas
  doc.on('pageAdded', () => {
    agregarEncabezado(doc);
    doc.moveDown(2);
  });

  // === Sección I: Identificación del trabajador ===
  drawSectionHeader(doc, 'I.  IDENTIFICACIÓN DEL TRABAJADOR');
  drawKVTable(doc, [
    ['DNI', trabajadorDatos?.NUM_DOC || '-'],
    ['Nombre completo', trabajadorDatos?.NOMBRE_TRABAJADOR || trabajadorDatos?.NOMBRE || '-'],
    ['Sexo', trabajadorDatos?.SEXO || '-'],
    ['Edad', trabajadorDatos?.EDAD ?? '-'],
    ['Nacionalidad', trabajadorDatos?.NACIONALIDAD || '-'],
    ['Tipo de vínculo', trabajadorDatos?.TIPO_TRABAJADOR || '-']
  ], { rowHeight: 22, colKeyWidth: Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.40) });

  // === Sección II: Empleador vinculado ===
  drawSectionHeader(doc, 'II.  EMPLEADOR VINCULADO (ÚLTIMO REGISTRO EN PLANILLÓN)');
  drawKVTable(doc, [
    ['RUC', trabajadorDatos?.RUC || '-'],
    ['Razón Social', trabajadorDatos?.RAZON_SOCIAL || '-']
  ]);

  // === Sección III: Última planilla declarada (PLAME) ===
  drawSectionHeader(doc, 'III.  ÚLTIMA PLANILLA DECLARADA (PLAME)');
  drawKVTable(doc, [
    ['Periodo', formatPeriodo(ultimaPlanilla?.V_PERDECLA)],
    ['Número de planillas', ultimaPlanilla?.N_NUMEFELAB ?? '-'],
    ['Monto Total Pagado', ultimaPlanilla?.N_MTOTOTPAG ?? '-'],
    ['Aporte ESSALUD (9%)', ultimaPlanilla?.APORTE_ESSALUD ?? '-']
  ]);

  // (Se omite sección de Presencia en Planillón por requerimiento)

  doc.on('end', addFooter);
  doc.end();
  return outputPath;
}

module.exports = { generateTrabajadorReportPDF };


