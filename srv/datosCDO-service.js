const cds = require('@sap/cds');
const fetch = require('node-fetch');
const axios = require("axios");
const xssec = require('@sap/xssec');
const xsenv = require('@sap/xsenv');


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
    otrosServiciosConsu,
  } = this.entities;




  const { WorkflowService } = this.entities;

this.on('startWorkflow', async (req) => {
  const input = JSON.parse(req.data.payload);

  const workflowPayload = {
    definitionId: "eu10.p051dvk8.datoscdoprocesoflujo.aprobacionCDO",
    context: input
  };

  try {
    const token = await getWorkflowToken();

    const response = await axios.post(
      'https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances',
      workflowPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

   
  // Aquí, asegúrate de que la respuesta tiene el ID del flujo de trabajo
  const workflowInstanceId = response.data.id; 
  console.log("ID del Workflow:", workflowInstanceId);
    // Opcional: lo puedes guardar en tu tabla para hacer seguimiento
    // await INSERT.into("DatosProyect").entries({ generatedid: input.generatedid, workflowInstanceId });

    return {
      message: "Workflow iniciado correctamente",
      workflowInstanceId: workflowInstanceId // Devuelto al frontend o quien lo consuma
    };

  } catch (err) {
    console.error("Error en backend:", err.response?.data || err.message);
    req.reject(500, `Error al iniciar workflow: ${err.message}`);
  }
});


this.on('completeWorkflow', async (req) => {
  const { workflowInstanceId, decision } = req.data;


  console.log("ID del Workflow:" +   workflowInstanceId); 
  console.log("Iniciando actualización del workflow...");
  const token = await getWorkflowToken();
  //console.log("Token obtenido:", token);

  try {
    console.log("Realizando PATCH al contexto del workflow...");

    const patchResponse = await axios.patch(
      `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances/${workflowInstanceId}/context`,
      {
        custom: {
          aprobado: decision,
          readytocontinue : true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Contexto actualizado exitosamente");
   // console.log("📄 Respuesta:", patchResponse.data);

    return `Workflow actualizado con decisión: ${decision}`;

  } catch (err) {
    console.error("❌ Error al actualizar workflow:", err.response?.data || err.message);
    req.reject(500, `Error al actualizar workflow: ${err.message}`);
  }
});



this.on("getWorkflowTimeline", async (req) => {
  const { ID } = req.data;
  console.log("📥 ID recibido:", ID);

  try {
    const workflowInstanceId = ID;
    const token = await getWorkflowToken(); // función que obtiene el token
    console.log("🔑 Token obtenido (truncado):", token.substring(0, 30) + "...");

    const response = await fetch(`https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances/${workflowInstanceId}/execution-logs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`No se pudo obtener el timeline. Código de estado: ${response.status}`);
    }

    const timeline = await response.json();

    let events = [];

    // 🔍 Detectamos si es array directo o envuelto
    if (Array.isArray(timeline)) {
      events = timeline;
    } else if (Array.isArray(timeline.events)) {
      events = timeline.events;
    } else if (Array.isArray(timeline.logs)) {
      events = timeline.logs;
    } else if (Array.isArray(timeline.items)) {
      events = timeline.items;
    }

    if (events.length === 0) {
      console.warn("⚠️ No hay eventos disponibles para esta instancia:", ID);
      req.reject(204, `No hay historial disponible para la instancia con ID: ${ID}`);
      return;
    }

    // (Opcional) Traducir tipos de eventos a algo más legible
    const tipoEventoLegible = {
      WORKFLOW_STARTED: "Inicio del workflow",
      WORKFLOW_COMPLETED: "Finalización del workflow",
      WORKFLOW_CANCELED: "Cancelación del workflow",
      WORKFLOW_SUSPENDED: "Workflow suspendido",
      WORKFLOW_RESUMED: "Reanudación del workflow",
      USER_TASK_COMPLETED: "Tarea completada",
      USER_TASK_CREATED: "Tarea creada"
      // Agrega más si lo necesitas
    };

    const eventosTransformados = events.map(ev => {
      const descripcion = tipoEventoLegible[ev.type] || ev.type;
      const paso = ev.subject || ev.subjectId || ev.activityId || "Paso desconocido";
    
      console.log(`➡️ ${ev.type}  →  ${descripcion}, Paso: ${paso}`);
    
      return {
        id: ev.id,
        tipo: ev.type,
        descripcion,
        timestamp: ev.timestamp,
        usuario: ev.userId,
        instancia: ev.referenceInstanceId,
        paso
      };
    });
    
    return eventosTransformados;

  } catch (error) {
    console.error("❌ Error al obtener el timeline del workflow:", error.message);
    req.reject(500, "Error al consultar el historial del workflow");
  }
});







this.on('getUserTask', async (req) => {
  const { workflowInstanceId } = req.data;

  try {
    const token = await getWorkflowToken(); // Usa la misma función que ya tienes para obtener token

    const response = await axios.get(
      `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}&status=READY`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    const tasks = response.data;

    if (tasks.length > 0) {
      return {
        taskId: tasks[0].id,
        subject: tasks[0].subject
      };
    } else {
      return { message: "No hay tareas pendientes para esta instancia." };
    }

  } catch (err) {
    console.error("Error obteniendo tareas:", err.response?.data || err.message);
    req.reject(500, `Error al obtener la tarea: ${err.message}`);
  }
});

  /*const { WorkflowService } = this.entities;

  this.on('startWorkflow', async (req) => {
    const input = JSON.parse(req.data.payload);
  
    const workflowPayload = {
      definitionId: "eu10.p051dvk8.datoscdoprocess1.aprobacionCDO",
      context: input
    };
  
    try {
      const token = await getWorkflowToken(); 
  
      const response = await axios.post(
        'https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances',
        workflowPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      return "Workflow iniciado correctamente";
    } catch (err) {
      console.error("Error en backend:", err.response?.data || err.message);
      req.reject(500, `Error al iniciar workflow: ${err.message}`);
    }
  });**/
  

  

  
this.on('getUserInfo', async (req) => {
  console.log(" HOLAAAAAAAAAAAAA   estoy dentro de getUserInfo");

  if (!req.user || !req.user.id) {
    console.log(" No se encontró usuario autenticado.");
    return {};
  }

  console.log("🧾 req.user completo:", req.user);

  const attr = req.user.attr || {};

  const userInfo = {
    id: req.user.id,
    email: attr.email || "No disponible",
    name: attr.givenName || "No disponible",
    familyName: attr.familyName || "No disponible",
    fullName: `${attr.givenName || ''} ${attr.familyName || ''}`.trim() || "No disponible",
    phoneNumber: attr.phoneNumber || "No disponible"
  };

  console.log(" Datos del usuario:", userInfo);
  return userInfo;
});


  module.exports = cds.service.impl(async function() {
    
    this.on('elenacarolina.falensoriano@telefonica.com', async (req) => {
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
        codigoProyect, nameProyect, Total,descripcion, pluriAnual, multijuridica,funcionalString, clienteFacturacion,
        sMultiJuri, objetivoAlcance, AsuncionesyRestricciones, Naturaleza_ID, Email, Empleado, comentarioProveedor, comentarioPvD, CambioEuRUSD,
        Iniciativa_ID, Area_ID, jefeProyectID_ID, Seguimiento_ID, EjecucionVia_ID, datosExtra, fechaCreacion, FechaModificacion, mensual,
        AmReceptor_ID, Vertical_ID, clienteFuncional_ID, Estado, IPC_apli,costeEstructura, Fechainicio , FechaFin, TipoCompra_ID, MotivoCondi_ID,   comentarioFacturacion, comentarioTipoCompra
    } = req.data;

   // req.data.fechaCreacion = new Date().toISOString();


    try {
        console.log(" Insertando en la base de datos...");

        // Realizar la inserción
        await INSERT.into(DatosProyect).entries({
            codigoProyect,
            nameProyect,
            Email,
            Empleado,
            fechaCreacion,
            FechaModificacion,
            descripcion,
            pluriAnual,
            mensual,
            Total,
            funcionalString,
            multijuridica,
            clienteFacturacion,
            comentarioFacturacion,
            comentarioTipoCompra,
            comentarioPvD,
            comentarioProveedor,
            IPC_apli,
            sMultiJuri,
            CambioEuRUSD,
            objetivoAlcance,
            datosExtra,
            Fechainicio,
            FechaFin,
            AsuncionesyRestricciones,
            Naturaleza_ID,
            TipoCompra: { ID: TipoCompra_ID },
            MotivoCondi: { ID: MotivoCondi_ID },
            Iniciativa_ID,
            Area_ID,
            jefeProyectID_ID,
            Seguimiento_ID,
            EjecucionVia_ID,
            AmReceptor_ID,
            Vertical_ID,
            Estado,
            clienteFuncional_ID,
            costeEstructura,
         
        });

        console.log(" Inserción exitosa.");

        //  Obtener el ID recién generado
        const newRecord = await SELECT.one.from(DatosProyect).where({ nameProyect });

        if (!newRecord || !newRecord.ID) {
            console.error(" No se pudo recuperar el ID después de la inserción.");
            return req.reject(500, "No se pudo recuperar el ID después de la inserción.");
        }

        console.log(" ID generado:", newRecord.ID);

        return { ID: newRecord.ID, mensaje: "Inserción exitosa" };

    } catch (error) {
        console.error(" ERROR en CREATE DatosProyect:", error);

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




  async function getWorkflowToken() {
    const clientid = "sb-512669ea-168d-4b94-9719-cdbb586218b4!b546737|xsuaa!b120249";
    const clientsecret = "03796186-69f6-40b7-85d2-3120d218ca1a$UTF1yJVWdMf8R4fpV_E-K_mEhFUcSz1F3dG4XzmBUvA=";
    const url = "https://p051dvk8.authentication.eu10.hana.ondemand.com/oauth/token"; 
  
    const response = await axios({
      method: "post",
      url: `${url}/oauth/token`,
      auth: {
        username: clientid,
        password: clientsecret
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: "grant_type=client_credentials"
    });
  
    return response.data.access_token;
  }
  
});