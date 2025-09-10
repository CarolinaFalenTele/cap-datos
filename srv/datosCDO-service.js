const cds = require('@sap/cds');
const fetch = require('node-fetch');
const axios = require("axios");
const xssec = require('@sap/xssec');
const xsenv = require('@sap/xsenv');
const { getDestination } = require("@sap-cloud-sdk/connectivity");


console.log("HOLAAAAAAAAAAAAA");


//getTokenUser();

module.exports = cds.service.impl(async function () {
  const db = await cds.connect.to('db'); 


  console.log("Servicio cargado correctamente");

  const {
    DatosProyect,
    Usuarios,
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
    WorkflowEtapas,
    Archivos,
    Aprobadores,
    Jefeproyect
  } = this.entities;

  const { WorkflowService } = this.entities;


  const testID = '9159aee0-e77e-4401-a2b4-9eafcb527ab8'

  this.before('CREATE', Aprobadores, async (req) => {
    const { matricula } = req.data;
    
    const bExists = await SELECT.one.from(Aprobadores).where({ matricula: matricula, Activo: true });
    if (bExists) {
      req.error(400, `Matricula ${matricula} already exists and must be unique`);
    }
  });

  this.before('CREATE', Jefeproyect, async (req) => {
    const { matricula } = req.data;
    
    const bExists = await SELECT.one.from(Jefeproyect).where({ matricula: matricula, Activo: true });
    if (bExists) {
      req.error(400, `Matricula ${matricula} already exists and must be unique`);
    }
  });

  this.on("getResultado", async (req) => {
    // Recibimos arrays de UUID desde el view
    const { idRecursos = [], idServi = [], idViaje = [] } = req.data;
   
    const db = await cds.connect.to("db");
   
    // Mapear arrays a objetos con clave ID (como espera tu TYPE)
    const recursosTable = idRecursos.map(id => ({ ID: id }));
    const serviTable    = idServi.map(id => ({ ID: id }));
    const viajeTable    = idViaje.map(id => ({ ID: id }));
   
    try {
      const result = await db.run(
        `CALL "totalesCostesMensualizados"(?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          { val: recursosTable, type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
          { val: serviTable,    type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
          { val: viajeTable,    type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
          { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
          { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
          { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
          { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
          { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
        ]
      );
   
      // Los OUT vienen como array en el mismo orden
      const response = {
        year1: result[0],
        year2: result[1],
        year3: result[2],
        year4: result[3],
        year5: result[4],
      };
   
      console.log("--- RESULTADO PROCEDURE ---", response);
      return response;
   
    } catch (e) {
      console.error("--- ERROR PROCEDURE ---");
      console.error("Mensaje:", e.message);
      console.error("Stack:", e.stack);
      }
    });

  this.on('getWorkflowToken', async req => {
    const id = req.data.id;
    console.log('procedure: ejecutando con ID:', id);

    try {
    const result = await db.run(
      `CALL "totalesCostesMensualizados"(?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        { val: recursosTable, type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
        { val: serviTable,    type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
        { val: viajeTable,    type: "TABLE", tableType: "TRECURSOEXT_ID_LIST" },
        { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
        { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
        { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
        { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
        { dir: "OUT", type: "DECIMAL", precision: 20, scale: 4 },
      ]
    );

    // Los OUT vienen como array en el mismo orden
    const response = {
      year1: result[0],
      year2: result[1],
      year3: result[2],
      year4: result[3],
      year5: result[4],
    };

    console.log("--- RESULTADO PROCEDURE ---", response);
    return response;

  } catch (e) {
    console.error("--- ERROR PROCEDURE ---");
    console.error("Mensaje:", e.message);
    console.error("Stack:", e.stack);


    
      const workflowInstanceId = response.data.id;
      console.log("  ID del Workflow creado:", workflowInstanceId);

      let taskList = [];
      let attempts = 0;
      const maxAttempts = 10;
      const delay = ms => new Promise(res => setTimeout(res, ms));

      //   Esperar dinámicamente hasta que existan tareas
      while (taskList.length === 0 && attempts < maxAttempts) {
        attempts++;
        console.log(`  Esperando tareas... intento ${attempts}`);
        await delay(1500); // espera 1.5 segundos

        const getTasks = await axios.get(
          `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        taskList = getTasks.data;
      }

      if (!taskList || taskList.length === 0) {
        console.warn("  No se encontraron tareas después de varios intentos.");
      } else {
        console.log(`  Tareas encontradas en intento ${attempts}:`, JSON.stringify(taskList, null, 2));

        for (const task of taskList) {
          console.log("  Insertando tarea:", {
            taskId: task.id,
            subject: task.subject,
            assigned: task.recipientUsers?.[0]
          });

          await INSERT.into('WorkflowEtapas').entries({
            workflow_ID: workflowInstanceId,
            taskInstanceId: task.id,
            nombreEtapa: task.subject || 'Etapa sin nombre',
            asignadoA: task.recipientUsers?.[0] || null,
            estado: 'Pendiente'
          });
        }
      }

      return {
        message: "  Workflow iniciado. Etapas insertadas si existían.",
        workflowInstanceId
      };

    }
  });





  //-------------- Envio Archivos ----------------------------------
  // PUT /Archivos(ID)/$value para subir el contenido binario
  this.on("PUT", "Archivos/$value", async (req) => {
    const id = req.params[0].ID;
    console.log("  Entró al handler PUT /$value");

    const chunks = [];
    for await (const chunk of req._.req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const db = await cds.transaction(req);
    await db.update(Archivos)
      .set({ contenido: buffer })
      .where({ ID: id });

    req.reply(204);
  });

  // GET /Archivos(ID)/$value para devolver el archivo
  this.on("GET", "Archivos/$value", async (req) => {
    const id = req.params[0].ID;

    const db = await cds.transaction(req);
    const archivo = await db.read(Archivos)
      .where({ ID: id })
      .columns("contenido", "tipoMime");

    if (!archivo || !archivo.contenido) {
      return req.reject(404, "Archivo no encontrado");
    }

    req._.res.setHeader("Content-Type", archivo.tipoMime);
    req._.res.end(archivo.contenido);
  });

  //------------------------------------------------------------





  // ------ Crear, editar , Cancelar  workflows ------------
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

      const workflowInstanceId = response.data.id;
      console.log("  ID del Workflow creado:", workflowInstanceId);

      let taskList = [];
      let attempts = 0;
      const maxAttempts = 10;
      const delay = ms => new Promise(res => setTimeout(res, ms));

      //   Esperar dinámicamente hasta que existan tareas
      while (taskList.length === 0 && attempts < maxAttempts) {
        attempts++;
        console.log(`  Esperando tareas... intento ${attempts}`);
        await delay(1500); // espera 1.5 segundos

        const getTasks = await axios.get(
          `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        taskList = getTasks.data;
      }

      if (!taskList || taskList.length === 0) {
        console.warn("  No se encontraron tareas después de varios intentos.");
      } else {
        console.log(`  Tareas encontradas en intento ${attempts}:`, JSON.stringify(taskList, null, 2));

        for (const task of taskList) {
          console.log("  Insertando tarea:", {
            taskId: task.id,
            subject: task.subject,
            assigned: task.recipientUsers?.[0]
          });

          await INSERT.into('WorkflowEtapas').entries({
            workflow_ID: workflowInstanceId,
            taskInstanceId: task.id,
            nombreEtapa: task.subject || 'Etapa sin nombre',
            asignadoA: task.recipientUsers?.[0] || null,
            estado: 'Pendiente'
          });
        }
      }

      return {
        message: "  Workflow iniciado. Etapas insertadas si existían.",
        workflowInstanceId
      };

    } catch (err) {
      console.error("  Error en backend:", err.response?.data || err.message);
      req.reject(500, `Error al iniciar workflow: ${err.message}`);
    }
  });


  this.on('completeWorkflow', async (req) => {
    const { workflowInstanceId, decision, comentario, idProject } = req.data;
    const userEmail = req.user.email;
    const token = await getWorkflowToken();
    console.log("  req.data:", req.data);
    console.log("TOKENNNN   ---->>> ", token);


    if (!idProject) {
      console.warn("  idProject no recibido. Verifica el payload.");
    }


    console.log("ID DEL PROYECTO " + idProject);

    // Función para esperar y reintentar obtener nuevas tareas
    async function waitForNextTasks(workflowInstanceId, token, maxRetries = 5, delayMs = 1500) {
      for (let i = 0; i < maxRetries; i++) {
        const response = await axios.get(
          `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const tasks = response.data;
        const newTasks = tasks.filter(task => (task.status === "READY" || task.status === "RESERVED"));
        if (newTasks.length > 0) {
          return newTasks;
        }
        await new Promise(res => setTimeout(res, delayMs));
      }
      return [];
    }

    try {
      console.log("  Buscando tareas para el workflowInstanceId:", workflowInstanceId);

      // Paso 1: Obtener tareas actuales
      const getResponse = await axios.get(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tasks = getResponse.data;

      if (!tasks || tasks.length === 0) {
        return req.reject(404, `  No se encontraron tareas para el workflowInstanceId ${workflowInstanceId}`);
      }

      // Paso 2: Buscar la tarea activa (READY o RESERVED)
      const activeTask = tasks.find(task => task.status === "READY" || task.status === "RESERVED");
      if (!activeTask) {
        return req.reject(400, `  No hay tareas activas (READY o RESERVED) para este workflow.`);
      }

      const taskId = activeTask.id;
      console.log("  Tarea activa encontrada:", taskId);

      // Paso 3: Completar la tarea
      await axios.patch(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances/${taskId}`,
        {
          status: "COMPLETED",
          decision: decision,
          context: {
            idcompmo: comentario,
            comentario: comentario,

          }

        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("  Tarea completada con éxito:", taskId);

      // Paso 4: Actualizar etapa actual en la tabla WorkflowEtapas
      await UPDATE('WorkflowEtapas')
        .set({
          aprobadoPor: userEmail,
          estado: decision === 'approve' ? 'Aprobado' : 'Rechazado',
          comentario: comentario,
          fechaAprobado: new Date()
        })
        .where({ taskInstanceId: taskId });




      // Paso 5: Reintentar obtener tareas nuevas con espera
      const newActiveTasks = await waitForNextTasks(workflowInstanceId, token);

      let inserted = 0;
      for (const task of newActiveTasks) {
        if (task.id !== taskId) { // no reinsertar la tarea completada
          const exists = await SELECT.one.from('WorkflowEtapas').where({ taskInstanceId: task.id });
          if (!exists) {
            await INSERT.into('WorkflowEtapas').entries({
              workflow_ID: workflowInstanceId,
              taskInstanceId: task.id,
              nombreEtapa: task.subject || 'Etapa sin nombre',
              asignadoA: task.recipientUsers?.[0] || null,
              estado: 'Pendiente'
            });
            inserted++;
          }
        }
      }

      if (inserted > 0) {
        return { message: `  Tarea completada. ${inserted} nueva(s) etapa(s) insertada(s).` };
      }

      // Paso 6: Si no hay más tareas nuevas, marcar workflow como finalizado
      const etapas = await SELECT.from('WorkflowEtapas').where({ workflow_ID: workflowInstanceId });
      const algunoRechazado = etapas.some(e => e.estado === 'Rechazado');
      const estadoFinal = algunoRechazado ? 'Rechazado' : 'Aprobado';

      await UPDATE('WorkflowInstancias')
        .set({
          estado: estadoFinal,
          actualizadoEn: new Date()
        })
        .where({ ID: workflowInstanceId });

      // ** Aquí agrego el UPDATE para DatosProyect solo estado **
      const result = await UPDATE('DatosProyect')
        .set({ Estado: estadoFinal })
        .where({ ID: idProject });

      console.log("  Resultado UPDATE DatosProyect:", result);

      return { message: `  Workflow completado. Estado final: ${estadoFinal}` };

    } catch (err) {
      console.error("  Error al completar tarea:", err.response?.data || err.message);
      req.reject(500, `Error al completar task: ${err.message}`);
    }
  });


  this.on('etapasPendientesParaUsuario', async (req) => {
    const email = req.data.email;

    try {
      const resultados = await SELECT.from(WorkflowEtapas).where({
        estado: 'Pendiente',
        asignadoA: email
      });

      console.log("  Etapas encontradas para", email, ":", resultados.length);
      return resultados;

    } catch (err) {
      console.error("  Error al consultar etapas pendientes:", err.message);
      req.reject(500, "No se pudieron obtener las etapas pendientes.");
    }
  });

  this.on('cancelWorkflow', async (req) => {
    const workflowInstanceId = req.data.workflowInstanceId;

    console.log("id recibido " + workflowInstanceId);
    try {
      const token = await getWorkflowToken();

      const url = `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances/${workflowInstanceId}`;

      const result = await axios.patch(
        url,
        { status: "CANCELED" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return `Workflow ${workflowInstanceId} cancelado correctamente`;
    } catch (err) {
      const status = err.response?.status;

      //  Si el workflow ya fue cancelado o no existe, no lanzamos error
      if (status === 404 || status === 400) {
        console.warn(`Workflow ${workflowInstanceId} ya estaba cancelado o no existe`);
        return `Workflow ${workflowInstanceId} ya estaba cancelado o no existe`;
      }

      console.error("Error cancelando workflow en backend:", err.response?.data || err.message);
      req.reject(500, `Error al cancelar workflow: ${err.message}`);
    }
  });

  this.on('completeWorkflow', async (req) => {
    const { workflowInstanceId, decision, comentario = '' } = req.data;
    const userEmail = req.user.email;
    const token = await getWorkflowToken();

    try {
      console.log("  Buscando tareas para el workflowInstanceId:", workflowInstanceId);

      // Paso 1: Obtener todas las tareas de la instancia
      const getResponse = await axios.get(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances?workflowInstanceId=${workflowInstanceId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const tasks = getResponse.data;

      console.log("  TAREAS ENCONTRADAS:", JSON.stringify(tasks));

      if (!tasks || tasks.length === 0) {
        return req.reject(404, `  No se encontraron tareas para el workflowInstanceId ${workflowInstanceId}`);
      }

      // Paso 2: Buscar la tarea activa (READY o RESERVED)
      const activeTask = tasks.find(task => task.status === "READY" || task.status === "RESERVED");
      if (!activeTask) {
        return req.reject(400, `  No hay tareas activas en estado READY o RESERVED para este workflow.`);
      }

      const taskId = activeTask.id;
      console.log("  Próxima tarea pendiente encontrada:", taskId);

      // Paso 3: Completar la tarea vía PATCH
      await axios.patch(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/task-instances/${taskId}`,
        {
          status: "COMPLETED",
          decision: decision
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("  Tarea completada con éxito:", taskId);

      // Paso 4: Actualizar WorkflowEtapas en la base de datos CAP
      await UPDATE('WorkflowEtapas')
        .set({
          aprobadoPor: userEmail,
          estado: decision === 'approve' ? 'Aprobado' : 'Rechazado',
          comentario: comentario,
          fechaAprobado: new Date()
        })
        .where({ taskInstanceId: taskId });

      // Paso 5: Verificar si quedan tareas pendientes
      const remainingTasks = tasks.filter(task => (task.status === "READY" || task.status === "RESERVED") && task.id !== taskId);

      if (remainingTasks.length > 0) {
        const nextTask = remainingTasks[0]; // Podrías elegir otra tarea si tienes reglas específicas

        // Insertar nueva etapa en WorkflowEtapas
        await INSERT.into('WorkflowEtapas').entries({
          workflow_ID: workflowInstanceId,
          taskInstanceId: nextTask.id,
          nombreEtapa: nextTask.subject || 'Etapa sin nombre',
          asignadoA: nextTask.recipientUsers?.[0] || null,
          estado: 'Pendiente'
        });

        return { message: 'Tarea completada. Nueva etapa creada.' };
      }

      // Paso 6: Si no quedan tareas, actualizar el estado final de WorkflowInstancias
      const etapas = await SELECT.from('WorkflowEtapas').where({ workflow_ID: workflowInstanceId });
      const algunoRechazado = etapas.some(e => e.estado === 'Rechazado');
      const estadoFinal = algunoRechazado ? 'Rechazado' : 'Aprobado';

      await UPDATE('WorkflowInstancias')
        .set({
          estado: estadoFinal,
          actualizadoEn: new Date()
        })
        .where({ ID: workflowInstanceId });

      return { message: `Workflow completado. Estado final: ${estadoFinal}` };

    } catch (err) {
      console.error("  Error al completar task:", err.response?.data || err.message);
      req.reject(500, `Error al completar task: ${err.message}`);
    }
  });


  this.on("getWorkflowTimeline", async (req) => {
    const { ID } = req.data;
    console.log("ID recibido:", ID);

    try {
      const workflowInstanceId = ID;
      const token = await getWorkflowToken();
      console.log("Token obtenido (truncado):", token.substring(0, 30) + "...");

      // 1️⃣ Obtener timeline del workflow
      const timelineResponse = await fetch(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances/${workflowInstanceId}/execution-logs`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!timelineResponse.ok) {
        throw new Error(`No se pudo obtener el timeline. Código: ${timelineResponse.status}`);
      }

      const timeline = await timelineResponse.json();
      let events = [];
      if (Array.isArray(timeline)) events = timeline;
      else if (Array.isArray(timeline.events)) events = timeline.events;
      else if (Array.isArray(timeline.logs)) events = timeline.logs;
      else if (Array.isArray(timeline.items)) events = timeline.items;

      if (events.length === 0) {
        req.reject(204, `No hay historial disponible para la instancia con ID: ${ID}`);
        return;
      }

      // 2️⃣ Obtener el contexto completo de la instancia (incluye formularios con comentarios)
      const contextResponse = await fetch(
        `https://spa-api-gateway-bpi-eu-prod.cfapps.eu10.hana.ondemand.com/workflow/rest/v1/workflow-instances/${workflowInstanceId}/context`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!contextResponse.ok) {
        throw new Error(`No se pudo obtener el contexto. Código: ${contextResponse.status}`);
      }

      const instanceContext = await contextResponse.json();

      // 3️⃣ Mapeo de tipos de evento
      const tipoEventoLegible = {
        WORKFLOW_STARTED: "Inicio del workflow",
        WORKFLOW_COMPLETED: "Finalización del workflow",
        WORKFLOW_CANCELED: "Cancelación del workflow",
        WORKFLOW_SUSPENDED: "Workflow suspendido",
        WORKFLOW_RESUMED: "Reanudación del workflow",
        USER_TASK_COMPLETED: "Tarea completada",
        USER_TASK_CREATED: "Tarea creada"
      };

      // 4️⃣ Función para obtener comentario según activityId del evento
      const getComentario = (ev) => {
        if (!instanceContext) return "";
        const forms = Object.keys(instanceContext).filter(key => key.startsWith("form_"));
        const form = forms.find(f => f === ev.activityId); // coincide activityId con form
        if (form && instanceContext[form].comentario && instanceContext[form].comentario.trim() !== "") {
          return instanceContext[form].comentario;
        }
        return "";
      };

      // 5️⃣ Transformar eventos incluyendo comentario
      const eventosTransformados = events.map(ev => ({
        id: ev.id,
        tipo: ev.type,
        descripcion: tipoEventoLegible[ev.type] || ev.type,
        timestamp: ev.timestamp,
        usuario: ev.userId,
        instancia: ev.referenceInstanceId,
        paso: ev.subject || ev.subjectId || ev.activityId || "Paso desconocido",
        comentario: getComentario(ev)
      }));

      return eventosTransformados;

    } catch (error) {
      console.error("Error al obtener el timeline del workflow:", error.message);
      req.reject(500, "Error al consultar el historial del workflow");
    }
  });





  /*this.on("getWorkflowTimeline", async (req) => {
    const { ID } = req.data;
    console.log("  ID recibido:", ID);

    try {
      const workflowInstanceId = ID;
      const token = await getWorkflowToken(); // función que obtiene el token
      console.log(" Token obtenido (truncado):", token.substring(0, 30) + "...");

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

      //   Detectamos si es array directo o envuelto
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
        console.warn("  No hay eventos disponibles para esta instancia:", ID);
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

        console.log(`  ${ev.type}  →  ${descripcion}, Paso: ${paso}`);

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
      console.error("  Error al obtener el timeline del workflow:", error.message);
      req.reject(500, "Error al consultar el historial del workflow");
    }
  });*/


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



  //-----------------------------------------------------------------






  //  ---------------   Info user --------------------------
  this.on('getUserInfo', async (req) => {
    console.log("  Entrando en getUserInfo");

    if (!req.user || !req.user.id) {
      console.log("  No se encontró usuario autenticado.");
      return {};
    }

    const jwt = req._.req.headers.authorization?.split(' ')[1];
    // console.log("Token JWT:", jwt);

    this._Token = jwt;

    console.log("🧾 req.user completo:", req.user);
    const attr = req.user.attr || {};

    //   Obtener el token
    ///  const token = await getTokenUser();

    const userInfo = {
      id: req.user.id,
      email: attr.email || "No disponible",
      name: attr.givenName || "No disponible",
      familyName: attr.familyName || "No disponible",
      fullName: `${attr.givenName || ''} ${attr.familyName || ''}`.trim() || "No disponible",
      phoneNumber: attr.phoneNumber || "No disponible",
      roles: req.user.roles || [],
      scopes: req.user.scopes || [],

      token: jwt //   aquí lo agregas
    };

    console.log("  Datos del usuario:", userInfo);
    return userInfo;
  });


  //__------------------------------------------------------------




  this.on('CREATE', 'DatosProyect', async (req) => {
    //console.log(" Evento CREATE DatosProyect ejecutado.");
    console.log(" Datos recibidos:", JSON.stringify(req.data, null, 2));

    const {
      codigoProyect, nameProyect, Total, descripcion, pluriAnual, multijuridica, funcionalString, clienteFacturacion,
      sMultiJuri, objetivoAlcance, AsuncionesyRestricciones, Naturaleza_ID, Email, Empleado, comentarioProveedor, comentarioPvD, CambioEuRUSD,
      Iniciativa_ID, Area_ID, jefeProyectID_ID, Seguimiento_ID, EjecucionVia_ID, datosExtra, fechaCreacion, FechaModificacion, mensual, Oferta, modalidad, fechaComite,
      AmReceptor_ID, Vertical_ID, ClienteNuevo_ID, Estado, IPC_apli, costeEstructura, Fechainicio, FechaFin, TipoCompra_ID, MotivoCondi_ID, comentarioFacturacion, comentarioTipoCompra
    } = req.data;




    if (!req.user || !req.user.id) {
      return req.reject(401, "Usuario no autenticado");
    }



    const userEmail = req.user.id;

    console.log("ID DEL USUARIO -->>> " + userEmail);
    let user = await SELECT.one.from(Usuarios).where({ email: userEmail });

    if (!user) {
      // Crear usuario si no existe
      await INSERT.into(Usuarios).entries({
        email: userEmail,
        // otros campos si los tienes
      });
      user = await SELECT.one.from(Usuarios).where({ email: userEmail });
    }

    try {
      console.log(" Insertando en la base de datos...");

      // Realizar la inserción
      await INSERT.into(DatosProyect).entries({
        codigoProyect,
        nameProyect,
        Email,
        modalidad,
        Empleado,
        Oferta,
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
        fechaComite,
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
        Usuarios: { ID: user.ID }, // <--- Aquí estaba el error

        Estado,
        ClienteNuevo_ID,
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

  this.on("userdata", async (req) => {
    const user = await SELECT.one.from(Usuarios).where({ email: req.user.id });
    return user;
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
    try {
      // Obtiene el destination (workflow-api) desde el servicio Destination
      const destination = await getDestination({ destinationName: "workflow-api" });

      if (!destination?.authTokens || destination.authTokens.length === 0) {
        throw new Error("No se encontró ningún token en el destino workflow-api");
      }

      // Devuelve el primer token válido
      const token = destination.authTokens[0].value;
      return token;

    } catch (err) {
      console.error("Error al obtener token del workflow-api:", err.message);
      throw err;
    }
  }
});


