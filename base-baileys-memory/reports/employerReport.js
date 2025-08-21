const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
// Utilidades locales
function formatFecha(fecha) {
  if (!fecha || fecha === '0001-01-01 00:00:00.000') return 'No especificada';
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: '2-digit' });
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

// === Utilidades de maquetado ===
function drawSectionHeader(doc, titulo) {
  const x = doc.page.margins.left;
  let y = doc.y + 2;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const height = 18;
  // Salto de página si no hay espacio para la barra
  if (y + height + 10 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    // Recalcular Y sobre la nueva página
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
    return true; // hubo salto de página
  }
  return false;
}

function drawKVTable(doc, rows, options = {}) {
  const marginLeft = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colKey = options.colKeyWidth || Math.floor(usableWidth * 0.35);
  const colVal = usableWidth - colKey;
  const rowH = options.rowHeight || 22;

  rows.forEach(([key, value], idx) => {
    ensureSpace(doc, rowH + 6);
    const y = doc.y;
    // celdas
    doc.rect(marginLeft, y, colKey, rowH).stroke();
    doc.rect(marginLeft + colKey, y, colVal, rowH).stroke();
    // textos
    doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text(key, marginLeft + 6, y + 6, { width: colKey - 12 });
    doc.font('Helvetica').fontSize(9).text((value ?? '').toString(), marginLeft + colKey + 6, y + 6, { width: colVal - 12 });
    doc.y = y + rowH;
  });
  doc.moveDown(0.3);
}

// Tabla en cuadrícula para listas (p.ej., trabajadores)
function drawGridTable(doc, columns, rows, widths) {
  const left = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = widths && widths.length === columns.length
    ? widths.map(p => Math.floor(usableWidth * p))
    : new Array(columns.length).fill(Math.floor(usableWidth / columns.length));
  const headerH = 18;
  const minRowH = 18;

  const drawHeader = () => {
    ensureSpace(doc, headerH + 6);
    let x = left;
    const y = doc.y;
    columns.forEach((h, i) => {
      const w = colWidths[i];
      doc.rect(x, y, w, headerH).fillAndStroke('black', 'black');
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text(h, x + 4, y + 4, { width: w - 8, align: 'left' });
      x += w;
    });
    doc.fillColor('black');
    doc.y = y + headerH;
  };

  // Encabezado inicial
  drawHeader();

  // Filas
  rows.forEach((r) => {
    // Calcular altura dinámica de la fila según contenido
    const cellHeights = r.map((cell, i) => {
      const text = (cell ?? '').toString();
      const w = colWidths[i] - 8;
      const h = doc.heightOfString(text, { width: w, align: 'left' });
      return Math.max(minRowH, Math.ceil(h) + 8);
    });
    const rowH = Math.max(minRowH, ...cellHeights);

    // Si no hay espacio para una fila, saltar de página y repetir encabezado
    const pageBreak = ensureSpace(doc, rowH + 4);
    if (pageBreak) {
      drawHeader();
    }

    let x = left;
    const y = doc.y;
    r.forEach((cell, i) => {
      const w = colWidths[i];
      doc.rect(x, y, w, rowH).stroke();
      doc.font('Helvetica').fontSize(9).text((cell ?? '').toString(), x + 4, y + 4, { width: w - 8, align: 'left' });
      x += w;
    });
    doc.y = y + rowH;
  });
  doc.moveDown(0.5);
}

function generateEmployerReportPDF(datosEmpresa, listaTrabajadores, resumenTrabajadores, ruc) {
    const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fechaEtiqueta = `${dd}-${MM}-${yyyy}`;
  const nombreArchivo = `Reporte_Empleador_RUC_${ruc}_${fechaEtiqueta}.pdf`;
  const outputPath = path.join(process.cwd(), nombreArchivo);
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: false, margins: { top: 120, bottom: 50, left: 50, right: 50 } });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Función para agregar encabezado en cada página
    function agregarEncabezado() {
        try {
            // Logo SUNAFIL - ocupa la parte superior izquierda hasta la mitad
            const logoPath = 'C:\\Users\\jgarciaq\\Documents\\ChatBots\\FiscaBot\\base-baileys-memory\\logo-sunafil.png';
            doc.image(logoPath, 50, 15, { width: 250, height: 40 });
        } catch (error) {
            console.log('Error cargando logo:', error.message);
            // Fallback si no se puede cargar la imagen
            doc.fontSize(10).font('Helvetica-Bold').fillColor('red').text('SUNAFIL', 50, 20);
            doc.fontSize(7).font('Helvetica').fillColor('gray').text('SUPERINTENDENCIA NACIONAL DE FISCALIZACIÓN LABORAL', 50, 35);
        }
        
        // Primero: Decenio de la igualdad... (debajo del logo, coordenada Y fija)
        doc.fontSize(8).font('Helvetica').fillColor('black').text('"Decenio de la igualdad de oportunidades para mujeres y hombres"', 50, 65, { width: 495, align: 'center' });
        
        // Segundo: Año de la recuperación... (debajo del decenio, coordenada Y fija)
        doc.fontSize(8).font('Helvetica').fillColor('black').text('"Año de la Recuperación y Consolidación de la Economía Peruana"', 50, 75, { width: 495, align: 'center' });
        
        // Línea separadora debajo de los textos oficiales
        doc.strokeColor('gray').lineWidth(0.5).moveTo(50, 85).lineTo(545, 85).stroke();
        
        // Título del reporte con fondo negro y letra blanca (debajo de la línea separadora)
        const tituloWidth = 495; // Ancho del rectángulo negro
        const tituloX = (595.28 - tituloWidth) / 2; // Centrar el rectángulo
        doc.rect(tituloX, 95, tituloWidth, 35).fill('black');
        
        // Primera línea del título
        doc.fontSize(12).font('Helvetica-Bold').fillColor('white').text('REPORTE INTEGRAL DEL EMPLEADOR', tituloX, 103, { width: tituloWidth, align: 'center' });
        
        // (Se elimina el subtítulo de versión para limpiar el encabezado)
        // Agregar espacio adicional después del banner del título
        doc.moveDown(1);
        
        // Resetear colores
        doc.fillColor('black');
        doc.strokeColor('black');
    }

    function addFooter() {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(9).fillColor('gray').text(`Página ${i + 1} de ${range.count}`, 0, doc.page.height - 40, { align: 'center', width: doc.page.width });
        }
        doc.fillColor('black');
    }

    doc.addPage();
    agregarEncabezado();
    doc.moveDown(2);
    
    // Configurar encabezado para páginas adicionales
    doc.on('pageAdded', () => {
        agregarEncabezado();
        doc.moveDown(2);
    });
    
    doc.fontSize(10).font('Helvetica').text(`Fecha de generación: ${now.toLocaleString('es-PE')}`, { align: 'right' });
    doc.moveDown(0.5);

    // === Sección I: Datos de identificación del empleador ===
    drawSectionHeader(doc, 'I.  DATOS DE IDENTIFICACIÓN DEL EMPLEADOR');
    drawKVTable(doc, [
      ['Nombre o denominación social', datosEmpresa["Nombre/Razón Social"] || '-'],
      ['RUC', datosEmpresa["RUC"] || ruc || '-'],
      ['Nombre Comercial', datosEmpresa["Nombre Comercial"] || 'No especificado'],
      ['Estado del contribuyente', datosEmpresa["Planillón - Estado Contribuyente"] || '-'],
      ['Condición de domicilio', datosEmpresa["Planillón - Condición Domicilio"] || '-'],
      ['Domicilio fiscal', datosEmpresa["Dirección Principal - Tipo Vía"] || '' + ' ' + (datosEmpresa["Dirección Principal - Nombre Vía"] || '') + ' ' + (datosEmpresa["Dirección Principal - Número"] || '')],
      ['Zona', datosEmpresa["Dirección Principal - Zona"] || 'No especificada']
    ], { rowHeight: 22, colKeyWidth: Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.40) });

    // === Sección II: Datos de Registros Públicos ===
    drawSectionHeader(doc, 'II.  DATOS DE REGISTROS PÚBLICOS Y CONSTITUCIÓN');
    drawKVTable(doc, [
      ['Fecha de constitución', formatFecha(datosEmpresa["Fecha Constitución"])],
      ['Ficha registral', datosEmpresa["Ficha Registral"] || 'No registra'],
      ['Partida registral', datosEmpresa["Partida Registral"] || 'No registra'],
      ['Asiento en RR.PP', datosEmpresa["Asiento Registros Públicos"] || 'No registra']
    ]);

    // === Sección III: Actividad económica ===
    drawSectionHeader(doc, 'III.  ACTIVIDAD ECONÓMICA Y CLASIFICACIÓN');
    drawKVTable(doc, [
      ['Actividad Económica (CIIU) Principal', `${datosEmpresa["Actividad Económica (CIIU 1)"] || '-'}${datosEmpresa["Sector - Descripción Actividad"] ? ' - ' + datosEmpresa["Sector - Descripción Actividad"] : ''}`],
      ['Actividad Económica (CIIU) Secundaria', datosEmpresa["Actividad Económica (CIIU 2)"] || 'No registra'],
      ['Descripción del Sector Económico', datosEmpresa["Sector - Descripción Sector"] || '-'],
      ['Indicador de Alto Riesgo (SCTR)', datosEmpresa["Sector - Indicador Alto Riesgo"] || 'NO']
    ]);

    // === Sección IV: Información de Contacto ===
    drawSectionHeader(doc, 'IV.  INFORMACIÓN DE CONTACTO');
    drawKVTable(doc, [
      ['Casilla Electrónica - Teléfonos', datosEmpresa["Teléfono Casilla Electrónica"] || 'No registra'],
      ['Casilla Electrónica - Correos', datosEmpresa["Correo Casilla Electrónica"] || 'No registra'],
      ['Registros SUNAT - Teléfonos', datosEmpresa["Teléfono SUNAT"] || 'No registra'],
      ['Registros SUNAT - Correos', datosEmpresa["Correo SUNAT"] || 'No registra'],
      ['T-Registro - Teléfonos', datosEmpresa["Teléfono T-Registro"] || 'No registra'],
      ['T-Registro - Correos', datosEmpresa["Correo T-Registro"] || 'No registra']
    ]);

    // === Sección V: Representación Legal (mantener unida) ===
    drawSectionHeader(doc, 'V.  REPRESENTACIÓN LEGAL');
    ensureSpace(doc, 100);
    doc.font('Helvetica').fontSize(9).text('Se listan los representantes legales encontrados en los registros.');
    doc.moveDown(0.3);
    drawKVTable(doc, [
      ['Nombre completo', datosEmpresa["Rep Legal - Nombre"] || '-'],
      ['Documento', datosEmpresa["Rep Legal - Documento"] || '-'],
      ['Cargo', datosEmpresa["Rep Legal - Cargo"] || '-'],
      ['Fecha de inicio', formatFecha(datosEmpresa["Rep Legal - Fecha Inicio Cargo" ])]
    ]);

    // === Sección VI: Información Laboral, SST y Códigos de Sistema ===
    drawSectionHeader(doc, 'VI.  INFORMACIÓN LABORAL, SST Y CÓDIGOS DE SISTEMA');
    drawKVTable(doc, [
      ['Indicador de SST', datosEmpresa["Planillón - Indicador SST"] || '-'],
      ['Tipo de Empresa (Planillón)', datosEmpresa["Planillón - Tipo Empresa"] || '-'],
      ['Tamaño (Según Renta)', datosEmpresa["Planillón - Tamaño Empresa"] || 'No especificado'],
      ['Tamaño (REMYPE)', datosEmpresa["Planillón - Tamaño REMYPE"] || 'No especificado'],
      ['Código de Origen', datosEmpresa["Origen"] || '-'],
      ['Código de Contabilidad', datosEmpresa["Código Contabilidad"] || '-'],
      ['Código de Facturación', datosEmpresa["Código Facturación"] || '-'],
      ['Código de Patrón', datosEmpresa["Patrón"] || 'No registra']
    ]);

    // === Sección VII: Resumen PLAME ===
    drawSectionHeader(doc, 'VII.  RESUMEN DE LA ÚLTIMA DECLARACIÓN (PLAME)');
    drawKVTable(doc, [
      ['Último Periodo Declarado', formatPeriodo(resumenTrabajadores?.Ultimo_Periodo)],
      ['Trabajadores Declarados en el Periodo', resumenTrabajadores?.Cantidad_Trabajadores_Declarados || '-']
    ]);

    // === Sección VIII: Detalle de Trabajadores Declarados ===
    drawSectionHeader(doc, 'VIII.  DETALLE DE TRABAJADORES DECLARADOS');
    doc.font('Helvetica').fontSize(9).text(`Listado correspondiente a la declaración de ${formatPeriodo(resumenTrabajadores?.Ultimo_Periodo)}.`);
    doc.moveDown(0.5);
    const colsTrab = ['N°', 'DNI', 'NOMBRE DEL TRABAJADOR', 'VÍNCULO', 'SEXO', 'EDAD', 'NACION'];
    const widthsTrab = [0.05, 0.10, 0.43, 0.19, 0.07, 0.07, 0.09];
    const rowsTrab = (listaTrabajadores || []).map((t, idx) => {
      const sexoRaw = (t.SEXO || '').toString().trim().toUpperCase();
      const sexo = sexoRaw.startsWith('M') ? 'M' : (sexoRaw.startsWith('F') ? 'F' : '');
      const nacRaw = (t.NACIONALIDAD || '').toString().trim().toUpperCase();
      const nacion = (nacRaw.includes('NACION') || nacRaw.includes('PERU')) ? 'PER' : (nacRaw ? 'EXTR' : '');
      return [
        (idx + 1).toString(),
        (t.DNI || t.NUM_DOC || '').toString(),
        t.NOMBRE_TRABAJADOR || t.NOMBRE || '',
        t.TIPO_TRABAJADOR || '',
        sexo,
        (t.EDAD || '').toString(),
        nacion
      ];
    });
    drawGridTable(doc, colsTrab, rowsTrab, widthsTrab);
    doc.moveDown(1);

    doc.on('end', addFooter);
    doc.end();
    return outputPath;
}

module.exports = { generateEmployerReportPDF };


