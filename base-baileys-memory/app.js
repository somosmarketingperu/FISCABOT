const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { initializePool } = require('./db/connection');
const { getEmpresaDatosGenerales, getEmpresaContacto, getEmpresaUbicacion, getEmpresaTRegistroPlame, getEmpresaInfoCompleta, getListaTrabajadoresUltimoPeriodo, getResumenTrabajadoresUltimoPeriodo } = require('./db/employer');
const { getTrabajadorDatos, getTrabajadorUltimaPlanilla } = require('./db/trabajador');
const { generarReporteErgonomia } = require('./db/ergonomia');
const { generarReporteSector } = require('./db/sector');
const { generateEmployerReportPDF } = require('./reports/employerReport');
const { generateTrabajadorReportPDF } = require('./reports/trabajadorReport');
const path = require('path');
const fs = require('fs');

const logCtx = (ctx, extra = '') => {
    console.log('--- LOG CONTEXTO ---');
    console.log('Mensaje:', ctx.body);
    console.log('De:', ctx.from);
    console.log('ID:', ctx.id);
    if (extra) console.log('Extra:', extra);
    console.log('---------------------');
};

// Fase 1: Bienvenida y Autenticación (solo se activa con palabras clave exactas)
const flowInicio = addKeyword(['hola', 'empezar', 'inicio'])
    .addAnswer('¡Hola! Soy FiscaBot, tu asistente virtual de la SUNAFIL.\nPor favor, ingresa tu correo institucional (nombre.apellido@sunafil.gob.pe):', 
        { capture: true }, 
        async (ctx, { state, fallBack }) => {
            logCtx(ctx, 'Inicio - Solicitud de correo');
            const correo = ctx.body.trim().toLowerCase();
            if (!correo.includes('@sunafil.gob.pe')) {
                return fallBack('Por favor, ingresa un correo institucional válido.');
            }
            await state.update({ correo });
        }
    )
    .addAnswer('Gracias. Ahora, por favor, ingresa tu contraseña institucional.\n(Tu mensaje será borrado automáticamente por seguridad)', 
        { capture: true }, 
        async (ctx, { state, gotoFlow, flowDynamic }) => {
            logCtx(ctx, 'Inicio - Solicitud de contraseña');
            await state.update({ autenticado: true });
            await flowDynamic('Contraseña recibida. Autenticando...');
            return gotoFlow(flowMenuPrincipal);
        }
    );

// FLUJO PARA MENÚ: captura "menu" o "menú" y va directamente al menú principal
const flowMenu = addKeyword(['menu', 'menú'])
    .addAnswer('', { capture: false }, async (ctx, { state, gotoFlow, flowDynamic }) => {
        logCtx(ctx, 'Menú solicitado');
        const myState = await state.getMyState();
        if (myState?.autenticado) {
            return gotoFlow(flowMenuPrincipal);
        } else {
            await flowDynamic('Para acceder al menú principal, primero debes autenticarte. Escribe "hola" para comenzar.');
        }
    });

// FLUJO PARA VOLVER: captura "volver" y va al menú principal si está autenticado
const flowVolver = addKeyword(['volver', 'volver al menu', 'volver al menú'])
    .addAnswer('', { capture: false }, async (ctx, { state, gotoFlow, flowDynamic }) => {
        const myState = await state.getMyState();
        if (myState?.autenticado) {
            return gotoFlow(flowMenuPrincipal);
        } else {
            await flowDynamic('Para acceder al menú principal, primero debes autenticarte. Escribe "hola" para comenzar.');
        }
    });

// FLUJO DE BIENVENIDA GLOBAL: ahora solo para usuarios realmente nuevos
const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer('', { capture: false }, async (ctx, { state, gotoFlow, flowDynamic }) => {
        logCtx(ctx, 'Bienvenida');
        const myState = await state.getMyState();
        // Si ya está autenticado, va al menú principal
        if (myState?.autenticado) {
            return gotoFlow(flowMenuPrincipal);
        }
        // Si no está autenticado, pide el correo
        await flowDynamic('¡Hola! Soy FiscaBot, tu asistente virtual de la SUNAFIL. Para proteger la información, por favor, inicia sesión.\nEscribe tu correo institucional (nombre.apellido@sunafil.gob.pe).');
        await state.update({ fase: 'correo', intentos: 0, correo: null, autenticado: false, bloqueado: false });
        return gotoFlow(flowInicio);
    });

const flowAutenticacion = addKeyword(EVENTS.ACTION)
    .addAnswer('', { capture: true }, async (ctx, { flowDynamic, state, gotoFlow }) => {
        const myState = await state.getMyState();
        const fase = myState?.fase || 'correo';

        if (myState?.bloqueado) {
            await flowDynamic('❌ Has superado el número de intentos permitidos. Por seguridad, tu acceso ha sido bloqueado temporalmente. Por favor, contacta a la mesa de ayuda de TI.');
            return;
        }

        if (fase === 'autenticado') {
            return gotoFlow(flowMenuPrincipal);
        }

        await state.update({ fase: 'correo', intentos: 0, correo: null, bloqueado: false });
        return await flowDynamic('Por favor, ingresa tu correo institucional (nombre.apellido@sunafil.gob.pe).');
    });

// FLUJO DE MENÚ PRINCIPAL: también como fallback global
const flowMenuPrincipal = addKeyword([EVENTS.ACTION, EVENTS.WELCOME])
    .addAnswer('✅ ¡Autenticación exitosa! Bienvenido/a al prototipo de FiscaBot.\n\nMenú Principal:\nA. Consultar empresa por RUC\nB. Consultar trabajador por DNI\nC. Reportes\nD. Guías y Listas de Verificación (por implementar)\nE. Consultar Base Normativa (por implementar)\nF. Ver Mis Expedientes Asignados (por implementar)\nG. Cerrar Sesión (por implementar)',
        { capture: true },
        async (ctx, { gotoFlow, fallBack }) => {
            logCtx(ctx, 'Menú principal');
            const opcion = ctx.body.trim().toUpperCase();
            if (opcion === 'A') return gotoFlow(flowRUC);
            if (opcion === 'B') return gotoFlow(flowTrabajador);
            if (opcion === 'C') return gotoFlow(flowReportes);
            if (["D", "E", "F", "G"].includes(opcion)) {
                return fallBack('Esta funcionalidad está por implementar. Por favor, elige otra opción.');
            }
            // Si el usuario escribe cualquier otra cosa, repite el menú principal
            return fallBack('Opción no válida. Por favor, elige A, B, C, D, E, F o G.');
        }
    );

const flowCerrarSesion = addKeyword(EVENTS.ACTION)
    .addAnswer('✅ Sesión cerrada de forma segura. Para volver a usar el servicio, deberás autenticarte de nuevo. ¡Que tengas un buen día!',
        { capture: false },
        async (ctx, { state }) => {
            await state.update({ 
                fase: 'correo', 
                intentos: 0, 
                correo: null, 
                autenticado: false,
                bloqueado: false 
            });
        });

// FLUJO RUC (Consultar empresa por RUC)
const flowRUC = addKeyword(EVENTS.ACTION)
    .addAnswer('Por favor, escribe el número de RUC de la empresa (11 dígitos) que deseas consultar:\n\nO escribe "menu" para volver al menú principal.',
        { capture: true },
        async (ctx, { flowDynamic, fallBack, state, provider, gotoFlow }) => {
            const input = ctx.body.trim();
            
            // Verificar si quiere volver al menú
            if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'menú') {
                return gotoFlow(flowMenuPrincipal);
            }
            
            // Validar RUC
            if (!/^20\d{9}$/.test(input)) {
                return fallBack('El RUC ingresado no es válido. Debe tener 11 dígitos y empezar con 20.\n\nO escribe "menu" para volver al menú principal.');
            }
            
            logCtx(ctx, 'Ingreso RUC');
            const ruc = input;
            await state.update({ ruc_consulta: ruc });
            let responded = false;
            const timer = setTimeout(async () => {
                if (!responded) {
                    await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                }
            }, 10000);
            try {
                // Ejecutar los 3 queries en paralelo
                const [datosEmpresaArr, listaTrabajadores, resumenTrabajadores] = await Promise.all([
                    getEmpresaDatosGenerales(ruc),
                    getListaTrabajadoresUltimoPeriodo(ruc),
                    getResumenTrabajadoresUltimoPeriodo(ruc)
                ]);
                responded = true;
                clearTimeout(timer);
                if (!datosEmpresaArr || datosEmpresaArr.length === 0) {
                    await flowDynamic('❌ No se encontraron datos para ese RUC.');
                    await flowDynamic('Por favor, intenta con otro número de RUC o verifica que el número sea correcto.');
                    return gotoFlow(flowRUC);
                }
                const datosEmpresa = datosEmpresaArr[0];
                // Generar el PDF
                const rutaPDF = generateEmployerReportPDF(datosEmpresa, listaTrabajadores, resumenTrabajadores, ruc);
                await flowDynamic('✅ Consulta realizada con éxito. El reporte integral en PDF ha sido generado. Enviando el archivo...');
                // Enviar el PDF como archivo adjunto por WhatsApp (asegurando JID válido)
                let jid = ctx.from;
                if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                    jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }
                console.log('jid usado para enviar:', jid);
                if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                    const hoy = new Date();
                    const dd = String(hoy.getDate()).padStart(2, '0');
                    const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                    const yyyy = hoy.getFullYear();
                    const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                    const tituloEmp = `Reporte integral del empleador - RUC ${ruc} - Generado el ${fechaEtiqueta}`;
                    const baseName = path.basename(rutaPDF);
                    await provider.sendMedia(jid, rutaPDF, { caption: tituloEmp, fileName: baseName, mimetype: 'application/pdf' });
                    await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                } else {
                    await flowDynamic('No se pudo enviar el PDF porque el número de destino no es válido. Valor de jid: ' + jid);
                }
                // Ir al flujo post-RUC para capturar la respuesta
                return gotoFlow(flowPostRUC);
            } catch (err) {
                responded = true;
                clearTimeout(timer);
                console.error('Error en consulta integral de empresa:', err);
                return fallBack('Ocurrió un error al consultar la información de la empresa. Intente nuevamente.');
            }
        }
    );

// FLUJO POST-RUC (para manejar la respuesta después del reporte)
const flowPostRUC = addKeyword(EVENTS.ACTION)
    .addAnswer('¿Deseas consultar otro RUC o volver al menú principal? Escribe "menu" para regresar o envía otro RUC (11 dígitos).',
        { capture: true },
        async (ctx, { gotoFlow, fallBack, state, flowDynamic, provider }) => {
            const input = ctx.body.trim();
            const lower = input.toLowerCase();
            
            if (lower === 'menu' || lower === 'menú') {
                return gotoFlow(flowMenuPrincipal);
            }
            
            if (/^20\d{9}$/.test(input)) {
                // Procesar el nuevo RUC directamente aquí
                const ruc = input;
                await state.update({ ruc_consulta: ruc });
                
                await flowDynamic('🔄 Procesando nuevo RUC...');
                
                try {
                    // Ejecutar los 3 queries en paralelo
                    const [datosEmpresaArr, listaTrabajadores, resumenTrabajadores] = await Promise.all([
                        getEmpresaDatosGenerales(ruc),
                        getListaTrabajadoresUltimoPeriodo(ruc),
                        getResumenTrabajadoresUltimoPeriodo(ruc)
                    ]);
                    
                    if (!datosEmpresaArr || datosEmpresaArr.length === 0) {
                        await flowDynamic('❌ No se encontraron datos para ese RUC.');
                        await flowDynamic('Por favor, intenta con otro número de RUC o verifica que el número sea correcto.');
                        return gotoFlow(flowPostRUC);
                    }
                    
                    const datosEmpresa = datosEmpresaArr[0];
                    
                    // Generar el PDF
                    const rutaPDF = generateEmployerReportPDF(datosEmpresa, listaTrabajadores, resumenTrabajadores, ruc);
                    await flowDynamic('✅ Consulta realizada con éxito. El reporte integral en PDF ha sido generado. Enviando el archivo...');
                    
                    // Enviar el PDF
                    let jid = ctx.from;
                    if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                        jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    }
                    
                    if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                        const hoy = new Date();
                        const dd = String(hoy.getDate()).padStart(2, '0');
                        const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                        const yyyy = hoy.getFullYear();
                        const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                        const tituloEmp = `Reporte integral del empleador - RUC ${ruc} - Generado el ${fechaEtiqueta}`;
                        const baseName = path.basename(rutaPDF);
                        await provider.sendMedia(jid, rutaPDF, { caption: tituloEmp, fileName: baseName, mimetype: 'application/pdf' });
                        await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                    }
                    
                    // Volver a preguntar qué hacer
                    return gotoFlow(flowPostRUC);
                    
                } catch (err) {
                    console.error('Error en consulta de nuevo RUC:', err);
                    await flowDynamic('❌ Ocurrió un error al consultar la información de la empresa. Intente nuevamente.');
                    return gotoFlow(flowPostRUC);
                }
            }
            
            return fallBack('Por favor, escribe "menu" para ir al menú principal o envía otro RUC válido (11 dígitos y empieza con 20).');
        }
    );

// FLUJO SUBMENÚ EMPRESA (separado para robustez)
const flowSubmenuEmpresa = addKeyword(EVENTS.ACTION)
    .addAnswer('RUC recibido. ¿Qué información deseas consultar?\n1. Datos generales\n2. Contacto\n3. Ubicación\n4. Estado T-Registro/PLAME\n5. Volver al menú principal',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack, state }) => {
            console.log('Entró al flowSubmenuEmpresa');
            logCtx(ctx, 'Submenú empresa (flowSubmenuEmpresa)');
            console.log('Valor exacto de ctx.body:', ctx.body);
            const opcion = ctx.body.trim();
            const myState = await state.getMyState();
            const ruc = myState?.ruc_consulta;
            console.log('Opción seleccionada en submenú empresa:', opcion, '| RUC:', ruc);
            if (opcion === '1') {
                console.log('Llamando a getEmpresaDatosGenerales con RUC:', ruc);
                let responded = false;
                const timer = setTimeout(async () => {
                    if (!responded) {
                        await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                    }
                }, 5000);
                try {
                    const datos = await getEmpresaDatosGenerales(ruc);
                    console.log('Datos recibidos de getEmpresaDatosGenerales:', datos);
                    responded = true;
                    clearTimeout(timer);
                    if (!datos) return fallBack('No se encontraron datos para ese RUC.');
                    await flowDynamic(`Datos generales de la empresa (RUC: ${ruc}):\nRazón Social: ${datos.RAZON_SOCIAL}\nEstado: ${datos.ESTADO_CONTRIBUYENTE}\nDomicilio Fiscal: ${datos.DOMICILIO_FISCAL}\nTipo Empresa: ${datos.TIPO_EMPRESA_TAMAÑO}`);
                } catch (err) {
                    responded = true;
                    clearTimeout(timer);
                    console.error('Error en consulta de datos generales:', err);
                    return fallBack('Ocurrió un error al consultar los datos generales. Intente nuevamente.');
                }
            } else if (opcion === '2') {
                console.log('Llamando a getEmpresaContacto con RUC:', ruc);
                let responded = false;
                const timer = setTimeout(async () => {
                    if (!responded) {
                        await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                    }
                }, 5000);
                try {
                    const contacto = await getEmpresaContacto(ruc);
                    console.log('Datos recibidos de getEmpresaContacto:', contacto);
                    responded = true;
                    clearTimeout(timer);
                    if (!contacto) return fallBack('No se encontraron datos de contacto para ese RUC.');
                    await flowDynamic(`Contacto de la empresa (RUC: ${ruc}):\nCorreo Casilla: ${contacto.CORRE_ELEC_CASILLA}\nTeléfono Casilla: ${contacto.NUM_TELF_CASILLA}\nCorreo T-Registro: ${contacto.CORRE_ELEC_TREGISTRO}\nTeléfono T-Registro: ${contacto.NUM_TELF_TREGISTRO}\nCorreo SUNAT: ${contacto.CORRE_ELEC_SUNAT}\nTeléfono SUNAT: ${contacto.NUM_TELF_SUNAT}`);
                } catch (err) {
                    responded = true;
                    clearTimeout(timer);
                    console.error('Error en consulta de contacto:', err);
                    return fallBack('Ocurrió un error al consultar el contacto. Intente nuevamente.');
                }
            } else if (opcion === '3') {
                console.log('Llamando a getEmpresaUbicacion con RUC:', ruc);
                let responded = false;
                const timer = setTimeout(async () => {
                    if (!responded) {
                        await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                    }
                }, 5000);
                try {
                    const ubicacion = await getEmpresaUbicacion(ruc);
                    console.log('Datos recibidos de getEmpresaUbicacion:', ubicacion);
                    responded = true;
                    clearTimeout(timer);
                    if (!ubicacion) return fallBack('No se encontró la ubicación para ese RUC.');
                    await flowDynamic(`Ubicación de la empresa (RUC: ${ruc}):\nDirección: ${ubicacion.DOMICILIO_FISCAL}\nRegión: ${ubicacion.REGION}\nProvincia: ${ubicacion.PROVINCIA}\nDistrito: ${ubicacion.DISTRITO}`);
                } catch (err) {
                    responded = true;
                    clearTimeout(timer);
                    console.error('Error en consulta de ubicación:', err);
                    return fallBack('Ocurrió un error al consultar la ubicación. Intente nuevamente.');
                }
            } else if (opcion === '4') {
                console.log('Llamando a getEmpresaTRegistroPlame con RUC:', ruc);
                let responded = false;
                const timer = setTimeout(async () => {
                    if (!responded) {
                        await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                    }
                }, 5000);
                try {
                    const tReg = await getEmpresaTRegistroPlame(ruc);
                    console.log('Datos recibidos de getEmpresaTRegistroPlame:', tReg);
                    responded = true;
                    clearTimeout(timer);
                    await flowDynamic(`Estado T-Registro/PLAME para RUC: ${ruc}:\nT-Registro: ${tReg.t_registro || 'No disponible'}\nPLAME - Último periodo declarado: ${tReg.periodo_plame || 'No disponible'}\nNº de trabajadores activos: ${tReg.num_trabajadores}`);
                } catch (err) {
                    responded = true;
                    clearTimeout(timer);
                    console.error('Error en consulta de T-Registro/PLAME:', err);
                    return fallBack('Ocurrió un error al consultar el estado T-Registro/PLAME. Intente nuevamente.');
                }
            } else if (opcion === '5' || opcion.toLowerCase() === 'volver') {
                return gotoFlow(flowMenuPrincipal);
            } else {
                return fallBack('Opción no válida. Por favor, elige 1, 2, 3, 4 o 5.');
            }
            await flowDynamic('¿Deseas consultar otra información de esta empresa o volver al menú principal? Escribe "volver" para regresar.');
        });

// FLUJO TRABAJADOR (Consultar trabajador por DNI)
const flowTrabajador = addKeyword(EVENTS.ACTION)
    .addAnswer('Por favor, escribe el número de DNI del trabajador que deseas consultar:\n\nO escribe "menu" para volver al menú principal.',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack, state, provider }) => {
            const input = ctx.body.trim();
            
            // Verificar si quiere volver al menú
            if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'menú') {
                return gotoFlow(flowMenuPrincipal);
            }
            
            // Validar DNI
            if (!/^\d{8}$/.test(input)) {
                console.log('DNI inválido:', input);
                return fallBack('El DNI ingresado no es válido. Debe tener 8 dígitos.\n\nO escribe "menu" para volver al menú principal.');
            }
            
            logCtx(ctx, 'Ingreso DNI trabajador');
            const dni = input;
            console.log('DNI recibido:', dni);
            await state.update({ dni_consulta: dni });
            let responded = false;
            const timer = setTimeout(async () => {
                if (!responded) {
                    await flowDynamic('⏳ La consulta está tomando más tiempo de lo habitual. Por favor, espere un momento mientras obtenemos la información...');
                }
            }, 10000);
            try {
            console.log('Llamando a getTrabajadorDatos con DNI:', dni);
            const datos = await getTrabajadorDatos(dni);
            console.log('Datos recibidos de getTrabajadorDatos:', datos);
                responded = true;
                clearTimeout(timer);
                if (!datos) {
                    await flowDynamic('❌ No se encontraron datos para ese DNI.');
                    await flowDynamic('Por favor, intenta con otro número de DNI o verifica que el número sea correcto.');
                    return gotoFlow(flowTrabajador);
                }
            console.log('Llamando a getTrabajadorUltimaPlanilla con DNI:', dni);
            const plame = await getTrabajadorUltimaPlanilla(dni);
            console.log('Datos recibidos de getTrabajadorUltimaPlanilla:', plame);
                
                // Generar el PDF
                const rutaPDFTrab = generateTrabajadorReportPDF(datos, plame);
                await flowDynamic('✅ Consulta realizada con éxito. El reporte integral en PDF ha sido generado. Enviando el archivo...');
                
                // Enviar el PDF como archivo adjunto por WhatsApp (asegurando JID válido)
                let jid = ctx.from;
                if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                    jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }
                console.log('jid usado para enviar:', jid);
                if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                    const hoy = new Date();
                    const dd = String(hoy.getDate()).padStart(2, '0');
                    const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                    const yyyy = hoy.getFullYear();
                    const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                    const tituloTrab = `Reporte del Trabajador - DNI ${dni} - Generado el ${fechaEtiqueta}`;
                    const baseName = path.basename(rutaPDFTrab);
                    await provider.sendMedia(jid, rutaPDFTrab, { caption: tituloTrab, fileName: baseName, mimetype: 'application/pdf' });
                    await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                } else {
                    await flowDynamic('No se pudo enviar el PDF porque el número de destino no es válido. Valor de jid: ' + jid);
                }
                // Ir al flujo post-DNI para capturar la respuesta
                return gotoFlow(flowPostDNI);
            } catch (err) {
                responded = true;
                clearTimeout(timer);
                console.error('Error en consulta integral de trabajador:', err);
                return fallBack('Ocurrió un error al consultar la información del trabajador. Intente nuevamente.');
            }
        }
    );

// FLUJO POST-DNI (para manejar la respuesta después del reporte)
const flowPostDNI = addKeyword(EVENTS.ACTION)
    .addAnswer('¿Deseas consultar otro trabajador o volver al menú principal? Escribe "menu" para regresar o envía otro DNI (8 dígitos).',
        { capture: true },
        async (ctx, { gotoFlow, fallBack, state, flowDynamic, provider }) => {
        logCtx(ctx, 'Submenú trabajador');
            const input = ctx.body.trim();
            const lower = input.toLowerCase();
            
            if (lower === 'menu' || lower === 'menú') {
                return gotoFlow(flowMenuPrincipal);
            }
            
            if (/^\d{8}$/.test(input)) {
                // Procesar el nuevo DNI directamente aquí
                const dni = input;
                await state.update({ dni_consulta: dni });
                
                await flowDynamic('🔄 Procesando nuevo DNI...');
                
                try {
                    const datos = await getTrabajadorDatos(dni);
                    if (!datos) {
                        await flowDynamic('❌ No se encontraron datos para ese DNI.');
                        await flowDynamic('Por favor, intenta con otro número de DNI o verifica que el número sea correcto.');
                        return gotoFlow(flowPostDNI);
                    }
                    
                    const plame = await getTrabajadorUltimaPlanilla(dni);
                    
                    // Generar el PDF
                    const rutaPDFTrab = generateTrabajadorReportPDF(datos, plame);
                    await flowDynamic('✅ Consulta realizada con éxito. El reporte integral en PDF ha sido generado. Enviando el archivo...');
                    
                    // Enviar el PDF
                    let jid = ctx.from;
                    if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                        jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    }
                    
                    if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                        const hoy = new Date();
                        const dd = String(hoy.getDate()).padStart(2, '0');
                        const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                        const yyyy = hoy.getFullYear();
                        const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                        const tituloTrab = `Reporte del Trabajador - DNI ${dni} - Generado el ${fechaEtiqueta}`;
                        const baseName = path.basename(rutaPDFTrab);
                        await provider.sendMedia(jid, rutaPDFTrab, { caption: tituloTrab, fileName: baseName, mimetype: 'application/pdf' });
                        await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                    }
                    
                    // Volver a preguntar qué hacer
                    return gotoFlow(flowPostDNI);
                    
                } catch (err) {
                    console.error('Error en consulta de nuevo DNI:', err);
                    await flowDynamic('❌ Ocurrió un error al consultar la información del trabajador. Intente nuevamente.');
                    return gotoFlow(flowPostDNI);
                }
            }
            
            return fallBack('Por favor, escribe "menu" para regresar al menú principal o envía otro DNI válido (8 dígitos).');
        }
    );

// FLUJO DE REPORTES
const flowReportes = addKeyword(EVENTS.ACTION)
    .addAnswer('📊 REPORTES DISPONIBLES\n\n1️⃣ Reporte de Ergonomía (Materia 72)\n2️⃣ Reporte por Sector (ej. Agricultura, Ganadería, Caza y Silvicultura)\n3️⃣ [Otro reporte - por implementar]\n\nEscribe "volver" para ver nuevamente esta lista o "menu" para ir al menú principal.\n\nElige una opción (1, 2, 3, "volver" o "menu"):',
        { capture: true },
        async (ctx, { gotoFlow, fallBack, flowDynamic, provider }) => {
            logCtx(ctx, 'Menú reportes');
            const opcion = ctx.body.trim();
            
            if (opcion === '1' || opcion.toLowerCase().includes('ergonomía') || opcion.toLowerCase().includes('ergonomia')) {
                await flowDynamic('🔄 Generando reporte de ergonomía... Esto puede tomar unos segundos.');
                
                try {
                    const pdfBuffer = await generarReporteErgonomia();
                    
                    // Guardar el PDF temporalmente y enviarlo
                    const fs = require('fs');
                    const path = require('path');
                    const hoy = new Date();
                    const dd = String(hoy.getDate()).padStart(2, '0');
                    const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                    const yyyy = hoy.getFullYear();
                    const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                    const tempFileName = `Reporte_Ergonomia_Materia_72_${dd}-${MM}-${yyyy}.pdf`;
                    const tempFilePath = path.join(__dirname, tempFileName);
                    
                    // Escribir el buffer a un archivo temporal
                    fs.writeFileSync(tempFilePath, pdfBuffer);
                    
                    await flowDynamic('✅ Reporte generado exitosamente. Enviando el archivo...');
                    
                    // Enviar el PDF usando la misma estructura que el reporte de empresa
                    let jid = ctx.from;
                    if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                        jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    }
                    console.log('jid usado para enviar reporte ergonomía:', jid);
                    
                    if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                        const tituloErgo = `Reporte de Ergonomía (Materia 72) - Generado el ${fechaEtiqueta}`;
                        const ergoBase = path.basename(tempFilePath);
                        await provider.sendMedia(jid, tempFilePath, { caption: tituloErgo, fileName: ergoBase, mimetype: 'application/pdf' });
                        
                        // Eliminar archivo temporal después de enviar
                        setTimeout(() => {
                            try {
                                fs.unlinkSync(tempFilePath);
                            } catch (err) {
                                console.log('Archivo temporal ya eliminado');
                            }
                        }, 5000);
                        
                        await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                    } else {
                        await flowDynamic('❌ No se pudo enviar el PDF porque el número de destino no es válido.');
                    }
                    
                } catch (error) {
                    console.error('Error generando reporte de ergonomía:', error);
                    await flowDynamic('❌ Error generando el reporte. Por favor, inténtalo de nuevo.');
                }
                
                await flowDynamic('¿Deseas generar otro reporte o volver al menú principal? Escribe "volver" para ver la lista de reportes o "menu" para ir al menú principal.');
                
            } else if (opcion === '2') {
                // Reporte por Sector - por defecto V_CODSEC = 'A'
                const codSec = 'A';
                const sectorTitulo = 'AGRICULT., GANAD., CAZA Y SILVIC.';
                await flowDynamic('🔄 Generando reporte por sector...');
                try {
                    const pdfBuffer = await generarReporteSector({ codSec, sectorTitulo });
                    const fs = require('fs');
                    const path = require('path');
                    const hoy = new Date();
                    const dd = String(hoy.getDate()).padStart(2, '0');
                    const MM = String(hoy.getMonth() + 1).padStart(2, '0');
                    const yyyy = hoy.getFullYear();
                    const fechaEtiqueta = `${dd}/${MM}/${yyyy}`;
                    const tempFileName = `Reporte_Sector_${codSec}_${dd}-${MM}-${yyyy}.pdf`;
                    const tempFilePath = path.join(__dirname, tempFileName);
                    fs.writeFileSync(tempFilePath, pdfBuffer);
                    let jid = ctx.from;
                    if (typeof jid === 'string' && !jid.endsWith('@s.whatsapp.net')) {
                        jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    }
                    if (typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')) {
                        const caption = `Reporte por Sector: ${sectorTitulo} - Generado el ${fechaEtiqueta}`;
                        const sectorBase = path.basename(tempFilePath);
                        await provider.sendMedia(jid, tempFilePath, { caption, fileName: sectorBase, mimetype: 'application/pdf' });
                        await flowDynamic(`✅ Reporte enviado exitosamente. Fecha de generación: ${fechaEtiqueta}.`);
                        setTimeout(() => { try { fs.unlinkSync(tempFilePath); } catch (_) {} }, 5000);
                    }
                } catch (e) {
                    console.error('Error generando reporte sector:', e);
                    await flowDynamic('❌ Error generando el reporte por sector.');
                }
                await flowDynamic('¿Deseas generar otro reporte o volver al menú principal? Escribe "volver" para ver la lista de reportes o "menu" para ir al menú principal.');
            } else if (opcion === '3') {
                return fallBack('Este reporte está por implementar. Por favor, elige otra opción.');
            } else if (opcion.toLowerCase() === 'volver') {
                return gotoFlow(flowReportes); // re-mostrar lista de reportes
            } else if (opcion.toLowerCase() === 'menu' || opcion.toLowerCase() === 'menú') {
            return gotoFlow(flowMenuPrincipal);
        } else {
                return fallBack('Opción no válida. Elige 1, 2, 3; escribe "volver" para ver la lista de reportes o "menu" para ir al menú principal.');
            }
        }
    );

// FLUJO CHECKLISTS (sin estados, tolerante a errores)
const flowChecklists = addKeyword(EVENTS.ACTION)
    .addAnswer('Elige el tipo de checklist que necesitas:\n1. Checklist General de Materias Sociolaborales\n2. Checklist de Seguridad y Salud en el Trabajo (SST)\n3. Checklist para el sector Construcción\n4. Checklist para el sector Agrario\n5. Volver al menú principal',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const opcion = ctx.body.trim();
            if (opcion === '1') {
                await flowDynamic('Checklist General de Materias Sociolaborales:\n- Contratos escritos\n- Planillas actualizadas\n- Pago oportuno de remuneraciones\n- Otros...');
                await flowDynamic('¿Deseas ver otro checklist o volver al menú principal? Escribe "volver" para regresar.');
            } else if (opcion === '2') {
                await flowDynamic('Generando... Aquí tienes la Lista de Verificación de SST (Ley N° 29783).\nPolítica de SST: ¿Publicada y difundida?\nIPERC: ¿Elaborado, actualizado y por puesto de trabajo?\nRISST: ¿Aprobado y entregado? (Para empresas con +20 trabajadores)\nComité de SST: ¿Constituido y funcionando?\nRegistros Obligatorios:\n- Accidentes/Incidentes\n- Exámenes Médicos Ocupacionales\n- Monitoreo de Agentes\n- Inspecciones Internas\n- Capacitaciones\n- EPP: ¿Entrega y registro documentado?');
                await flowDynamic('¿Deseas ver otro checklist o volver al menú principal? Escribe "volver" para regresar.');
            } else if (opcion === '3') {
                await flowDynamic('Checklist para el sector Construcción:\n- Licencia de obra\n- Plan de seguridad\n- EPP para trabajadores\n- Otros...');
                await flowDynamic('¿Deseas ver otro checklist o volver al menú principal? Escribe "volver" para regresar.');
            } else if (opcion === '4') {
                await flowDynamic('Checklist para el sector Agrario:\n- Contratos agrarios\n- Condiciones de vivienda\n- Equipos de protección\n- Otros...');
                await flowDynamic('¿Deseas ver otro checklist o volver al menú principal? Escribe "volver" para regresar.');
            } else if (opcion === '5' || opcion.toLowerCase() === 'volver') {
                return gotoFlow(flowMenuPrincipal);
            } else {
                if (!ctx.state) ctx.state = {};
                ctx.state.checklistTries = (ctx.state.checklistTries || 0) + 1;
                if (ctx.state.checklistTries >= 2) return gotoFlow(flowMenuPrincipal);
                return fallBack('Opción no válida. Por favor, elige 1, 2, 3, 4 o 5.');
            }
        }
    );

// FLUJO NORMATIVA (sin estados, tolerante a errores)
const flowNormativa = addKeyword(EVENTS.ACTION)
    .addAnswer('Escribe una palabra clave o el número de la norma que buscas (ej: "CTS", "Ley 29783", "horas extra").',
        { capture: true },
        async (ctx, { flowDynamic, fallBack }) => {
            const consulta = ctx.body.trim().toLowerCase();
            if (consulta.includes('iperc')) {
                await flowDynamic('Según el D.S. 019-2006-TR y sus modificatorias, no contar con el IPERC es una infracción grave en materia de Seguridad y Salud en el Trabajo.\nLa multa se calcula en base al tipo de empresa y el número de trabajadores afectados.');
            } else {
                if (!ctx.state) ctx.state = {};
                ctx.state.normativaTries = (ctx.state.normativaTries || 0) + 1;
                if (ctx.state.normativaTries >= 2) return gotoFlow(flowMenuPrincipal);
                return fallBack('No se encontró información específica para esa consulta. Intenta con otra palabra clave.');
            }
        }
    )
    .addAnswer('¿Deseas ver la tabla de sanciones actualizada? (Sí/No)',
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const opcion = ctx.body.trim().toLowerCase();
            if (opcion === 'sí' || opcion === 'si') {
                await flowDynamic('Aquí tienes la tabla de sanciones actualizada: [Enlace a PDF o tabla].');
                await flowDynamic('¿Deseas realizar otra consulta normativa o volver al menú principal? Escribe "volver" para regresar.');
            } else if (opcion === 'no' || opcion === 'volver') {
                return gotoFlow(flowMenuPrincipal);
            } else {
                if (!ctx.state) ctx.state = {};
                ctx.state.normativaTableTries = (ctx.state.normativaTableTries || 0) + 1;
                if (ctx.state.normativaTableTries >= 2) return gotoFlow(flowMenuPrincipal);
                return fallBack('Por favor, responde Sí, No o Volver.');
            }
        }
    );

// FLUJO EXPEDIENTES (ya robusto)
const flowExpedientes = addKeyword(EVENTS.ACTION)
    .addAnswer('Tus Expedientes (Usuario de Prueba):\nExp. 001-2025: Empresa Demo S.A.C. - Estado: En curso.\nExp. 002-2025: Empresa Prueba S.R.L. - Estado: Pendiente de visita.\nExp. 003-2025: Restaurante "El Buen Sabor" E.I.R.L. - Estado: Acta emitida.\nEscribe Volver para regresar al menú principal.',
        { capture: true },
        async (ctx, { gotoFlow, fallBack }) => {
            if (ctx.body.trim().toLowerCase() === 'volver') {
                return gotoFlow(flowMenuPrincipal);
            } else {
                return fallBack('Por favor, escribe Volver para regresar al menú principal.');
            }
        }
    );

(async () => {
    try {
        console.log('Intentando inicializar el pool de conexiones a Oracle...');
        await initializePool();
        console.log('✅ Pool de conexiones de Oracle inicializado correctamente.');
    } catch (err) {
        console.error('❌ Error al inicializar el pool de Oracle:', err);
        process.exit(1);
    }
})();

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([
        flowInicio,
        flowWelcome,
        flowAutenticacion,
        flowMenu,
        flowVolver,
        flowMenuPrincipal,
        flowRUC,
        flowPostRUC, // Flujo para manejar respuesta post-RUC
        flowSubmenuEmpresa, // Added flowSubmenuEmpresa to the flow
        flowTrabajador,
        flowPostDNI, // Flujo para manejar respuesta post-DNI
        flowReportes, // ← AGREGADO
        flowChecklists,
        flowNormativa,
        flowExpedientes,
        flowCerrarSesion,
    ]);

    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();

// MANEJO GLOBAL DE ERRORES
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});
