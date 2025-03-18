const cds = require('@sap/cds');

console.log("HOLAAAAAAAAAAAAA");




module.exports = cds.service.impl(async function () {
  console.log("Servicio cargado correctamente");

  const {
    DatosProyect,
    ProveedoresC,
    RecursosExternos,
    LicenciasCon,
    otrosConceptos,
    ValorMensuReInter,
    GastoViajeRecExter,
    serviRecurExter,
    planificacion,
    Facturacion,
    ClientFactura,
    RecursosInternos,
    otrosGastoRecu,
    otrosRecursos,
    ConsumoExternos,
    GastoViajeConsumo,
    otrosServiciosConsu
  } = this.entities;

  this.on('getUserInfo', async (req) => {
    console.log("⚡ HOLAAAAAAAAAAAAA   estoy dentro de getUserInfo");
    
    // Verificar si el usuario está autenticado
    if (!req.user || !req.user.id) {
      console.log("⚠️ No se encontró usuario autenticado.");
      return {}; // Devuelve un objeto vacío si no se encuentra al usuario
    }

    // Obtener los datos básicos del usuario desde req.user
    const userInfo = {
      id: req.user.id, // Usamos req.user.id, el cual debería ser el identificador único del usuario
      email: req.user.email || "No disponible", // Usamos el correo si está disponible
      name: req.user.attr?.given_name || req.user.id, // Usamos el nombre si está disponible, o el id si no lo está
      fullName: req.user.attr?.name || "No disponible", // Intenta obtener el nombre completo (fullName)
      phoneNumber: req.user.attr?.phone_number || "No disponible" // Intenta obtener el número de teléfono
    };

    console.log("✅ Datos del usuario:", userInfo);
    return userInfo; // Devolvemos el objeto con los datos del usuario
  });


  module.exports = cds.service.impl(async function() {
    
    this.on('startWorkflow', async (req) => {
        const payload = req.data.payload;
  
        // Simulación de llamada a SAP Build Process Automation
        const response = await fetch('https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
            return req.error(500, 'Error al iniciar el flujo de trabajo');
        }
  
        const data = await response.json();
        return data.instanceId;  // Devuelve el ID del workflow
    });
  
  });
  


  this.on('CREATE', 'DatosProyect', async (req) => {
    //console.log(" Evento CREATE DatosProyect ejecutado.");
    console.log(" Datos recibidos:", JSON.stringify(req.data, null, 2));

    const {
        codigoProyect, nameProyect, pluriAnual, multijuridica,funcionalString, clienteFacturacion,
        sMultiJuri, objetivoAlcance, AsuncionesyRestricciones, Naturaleza_ID,
        Iniciativa_ID, Area_ID, jefeProyectID_ID, Seguimiento_ID, EjecucionVia_ID, datosExtra,
        AmReceptor_ID, Vertical_ID, clienteFuncional_ID, Estado, IPC_apli,costeEstructura, Fechainicio , FechaFin
    } = req.data;

    req.data.fechaCreacion = new Date().toISOString();


    if (!codigoProyect || !nameProyect) {
        console.log("❌ Faltan campos obligatorios");
        return req.reject(400, "Faltan campos obligatorios: codigoProyect o nameProyect.");
    }

    try {
        console.log("✅ Insertando en la base de datos...");

        // Realizar la inserción
        await INSERT.into(DatosProyect).entries({
            codigoProyect,
            nameProyect,
            pluriAnual,
            funcionalString,
            multijuridica,
            clienteFacturacion,
            IPC_apli,
            sMultiJuri,
            objetivoAlcance,
            datosExtra,
            Fechainicio,
            FechaFin,
            AsuncionesyRestricciones,
            Naturaleza_ID,
            Iniciativa_ID,
            Area_ID,
            jefeProyectID_ID,
            Seguimiento_ID,
            EjecucionVia_ID,
            AmReceptor_ID,
            Vertical_ID,
            Estado,
            clienteFuncional_ID,
            costeEstructura
        });

        console.log("🎉 Inserción exitosa.");

        //  Obtener el ID recién generado
        const newRecord = await SELECT.one.from(DatosProyect).where({ codigoProyect });

        if (!newRecord || !newRecord.ID) {
            console.error("⚠️ No se pudo recuperar el ID después de la inserción.");
            return req.reject(500, "No se pudo recuperar el ID después de la inserción.");
        }

        console.log("📌 ID generado:", newRecord.ID);

        return { ID: newRecord.ID, mensaje: "Inserción exitosa" };

    } catch (error) {
        console.error("❌ ERROR en CREATE DatosProyect:", error);

        if (error.message.includes("duplicate key")) {
            return req.reject(400, "Error: Código de proyecto duplicado.");
        }
        if (error.message.includes("constraint violation")) {
            return req.reject(400, "Error: Restricción de clave foránea fallida.");
        }
        if (error.message.includes("table") && error.message.includes("not found")) {
            return req.reject(500, "Error: La tabla referenciada no existe.");
        }

        return req.reject(500, `Error interno en CREATE DatosProyect: ${error.message}`);
    }
});




  this.on('ProveedoresC', async (req) => {
    const { ID, projectId, datosProyect_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!projectId) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(ProveedoresC).entries({

        checkCondi, checkProveedor, valueCondi, valueProvee, datosProyect_ID
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });



  this.on('Facturacion', async (req) => {
    const { ID, datosProyect_ID, } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(Facturacion).entries({

        descripcionHito, fechaEstimida, facturacion, total, datosProyect_ID
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('ClientFactura', async (req) => {
    const { ID, datosProyect_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(ClientFactura).entries({

        juridica, oferta, total, datosProyect_ID
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('RecursosInternos', async (req) => {
    const { ID, datosProyect_ID, Vertical_ID, year1, year2, year3, year4, year5, year6, PerfilServicio_ID, tipoServicio_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(RecursosInternos).entries({

        ConceptoOferta, PMJ, total, year1, year2, year3, year4, year5, year6, total, totalE, datosProyect_ID, Vertical: { ID: Vertical_ID }, PerfilServicio: { ID: PerfilServicio_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('ValorMensuReInter', async (req) => {
    const { ID, RecursosInternos_ID, mesAno, valor } = req.data;

    // Verifica que los datos no sean nulos
    console.log("Datos recibidos:", req.data);

    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    if (!RecursosInternos_ID) {
      req.error(400, 'recursosInternos_ID is required');
      return;
    }

    if (!mesAno) {
      req.error(400, 'mesAño is required');
      return;
    }

    if (valor === undefined || valor === null) {
      req.error(400, 'valor is required');
      return;
    }

    try {
      console.log("Intentando insertar:", { mesAno, valor, RecursosInternos_ID });
      await INSERT.into(ValorMensuReInter).entries({
        mesAno,
        valor,
        RecursosInternos: { ID: RecursosInternos_ID }
      });

      return { message: "Datos insertados correctamente." };

    } catch (error) {
      console.error('Error en la inserción:', error); // Log del error
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });







  this.on('otrosGastoRecu', async (req) => {
    const { ID, RecursosInternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(otrosGastoRecu).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, RecursosInternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });



  this.on('otrosRecursos', async (req) => {
    const { ID, RecursosInternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(otrosRecursos).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, RecursosInternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('ConsumoExternos', async (req) => {
    const { ID, datosProyect_ID, Vertical_ID, PerfilConsumo_ID, tipoServicio_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(ConsumoExternos).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, total, totalC, datosProyect_ID, Vertical: { ID: Vertical_ID }, PerfilServicio: { ID: PerfilServicio_ID }, tipoServicio: { ID: tipoServicio_ID }, PerfilConsumo: { ID: PerfilConsumo_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('otrosServiciosConsu', async (req) => {
    const { ID, ConsumoExternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(otrosServiciosConsu).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, ConsumoExternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('GastoViajeConsumo', async (req) => {
    const { ID, ConsumoExternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(GastoViajeConsumo).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, ConsumoExternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });






  this.on('RecursosExternos', async (req) => {
    const { ID, datosProyect_ID, Vertical_ID, PerfilServicio_ID, tipoServicio_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(RecursosExternos).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, total, totalR, datosProyect_ID, Vertical: { ID: Vertical_ID }, PerfilServicio, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('serviRecurExter', async (req) => {
    const { ID, RecursosExternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(serviRecurExter).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, RecursosExternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('GastoViajeRecExter', async (req) => {
    const { ID, RecursosExternos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(GastoViajeRecExter).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalE, RecursosExternos_ID, Vertical: { ID: Vertical_ID }, tipoServicio: { ID: tipoServicio_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });



  this.on('LicenciasCon', async (req) => {
    const { ID, otrosConceptos_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(LicenciasCon).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalC, otrosConceptos_ID, Vertical: { ID: Vertical_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });


  this.on('otrosConceptos', async (req) => {
    const { ID, datosProyect_ID, tipoServicio_ID, Vertical_ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
      req.error(400, 'ID is required');
      return;
    }

    try {
      const result = await INSERT.into(otrosConceptos).entries({

        ConceptoOferta, PMJ, total, mesYear, year1, year2, year3, year4, year5, year6, totalC, datosProyect_ID, Vertical: { ID: Vertical_ID }
      });

      return result;

    } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
    }
  });





});