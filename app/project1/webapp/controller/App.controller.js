sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/CustomData",
        "sap/m/MessageBox",
        "sap/ui/core/format/DateFormat",
        "project1/model/formatter"
    ],
    function (BaseController, CustomData, MessageBox, DateFormat, Formatter) {
        "use strict";

        return BaseController.extend("project1.controller.App", {

            formatter: Formatter,
            onInit: function () {



                this._loadProjectData();
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("app").attachPatternMatched(this._onObjectMatched, this);
                oRouter.getRoute("appNoparame").attachPatternMatched(this._onObjectMatched, this);

                this.bProcessFlowAllowed = false;  // Bandera para controlar el acceso al ProcessFlow
                this.loadFilteredData();
                this.loadFilteredDataPend();


                //     console.log("Vista de appp " + this.getView());

                // this.DialogInfo();
                this.getUserInfo();

                this._cargarDatosUsuario();
            },



            _cargarDatosUsuario: async function () {
                try {
                    const userResponse = await fetch("/odata/v4/datos-cdo/userdata");

                    if (!userResponse.ok) {
                        throw new Error("No se pudo obtener el usuario desde el backend.");
                    }

                    const userData = await userResponse.json();

                    const userModel = new sap.ui.model.json.JSONModel(userData);
                    this.getView().setModel(userModel, "userModel");

                    await this.filterEstado();


                } catch (error) {
                    console.error("Error al cargar el usuario:", error);
                }
            },



            filterEstado: async function () {
                try {
                    const userModel = this.getView().getModel("userModel");
                    if (!userModel) {
                        //    console.error(" userModel no está definido aún.");
                        return;
                    }

                    const userId = userModel.getProperty("/ID");
                    const userEmail = userModel.getProperty("/email");

                    // 1️ Fetch de TODOS los proyectos
                    const responseAll = await fetch(`/odata/v4/datos-cdo/DatosProyect?$expand=Area,jefeProyectID`);
                    const allData = await responseAll.json();
                    const allProjects = allData.value;

                    // 2️ Separar mis solicitudes
                    const myProjects = allProjects.filter(p => p.Usuarios_ID === userId);

                    // 3️ Función para procesar cada proyecto
                    const procesarProyectos = async (proyectos) => {
                        return await Promise.all(proyectos.map(async (proyecto) => {
                            const projectId = proyecto.ID;
                            const formatearFecha = (fechaStr) => {
                                if (!fechaStr) return null;
                                const fecha = new Date(fechaStr);
                                return `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            };

                            proyecto.FechaCreacionFormateada = formatearFecha(proyecto.fechaCreacion);
                            proyecto.fechaComiteForm = formatearFecha(proyecto.fechaComite);
                            proyecto.FechaModificacionFormateada = formatearFecha(proyecto.FechaModificacion);
                            proyecto.NombreArea = proyecto.Area?.NombreArea || "Sin área";
                            proyecto.NombreJefe = proyecto.jefeProyectID?.name || "Sin jefe";
                            proyecto.EstadoStatus = proyecto.Estado === "Aprobado"
                                ? "Success"
                                : proyecto.Estado === "Rechazado"
                                    ? "Error"
                                    : "None";


                            // Aquí colocamos el campo para el ícono y el color según Oferta (true/false) 
                            proyecto.OfertaIcon = proyecto.Oferta ? "sap-icon://accept" : "sap-icon://decline";
                            proyecto.OfertaColor = proyecto.Oferta ? "#0066FF" : "red";
                            proyecto.OfertaTexto = proyecto.Oferta ? "Si" : "No";

                            //  console.log("OFERTAS " + proyecto.Oferta);


                            if (proyecto.Estado === "Borrador") {
                                proyecto.workflowId = null;
                                proyecto.actualizadoEn = null;
                                proyecto.actualizadoEnFormateada = "No aplica";
                                proyecto.Etapas = [];
                                return proyecto;
                            }

                            const wfResponse = await fetch(
                                `/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq ${projectId}&$orderby=creadoEn desc&$top=1`
                            );
                            const wfData = await wfResponse.json();
                            const wfItem = wfData.value[0];

                            let etapas = [];
                            if (wfItem?.ID) {
                                const etapasResponse = await fetch(
                                    `/odata/v4/datos-cdo/WorkflowEtapas?$filter=workflow_ID eq ${wfItem.workflowId}`
                                );

                                this._workID = wfItem.workflowId;
                                const etapasData = await etapasResponse.json();
                                etapas = etapasData.value || [];
                            }

                            const hayEtapasPendientes = etapas.some(et => et.estado === "Pendiente");

                            if (hayEtapasPendientes) {
                                proyecto.Estado = "Pendiente";
                            } else if (wfItem?.estado) {
                                proyecto.Estado = wfItem.estado;
                            } else {
                                proyecto.Estado = proyecto.Estado || "Borrador";
                            }

                            proyecto.workflowId = wfItem?.workflowId || null;
                            proyecto.actualizadoEn = wfItem?.actualizadoEn || null;
                            proyecto.actualizadoEnFormateada = formatearFecha(proyecto.actualizadoEn) || "Fecha no disponible";
                            proyecto.Etapas = etapas;



                            return proyecto;
                        }));
                    };

                    // Procesar todos los proyectos
                    // Procesar todos los proyectos
                    const aProyectosConEstado = await procesarProyectos(allProjects);



                    // Separar por estado
                    const aProyectosAprobados = aProyectosConEstado.filter(p => p.Estado === "Aprobado");
                    const aProyectosPendientes = aProyectosConEstado.filter(p => p.Estado === "Pendiente");
                    const aProyectosBorrador = aProyectosConEstado.filter(p => p.Estado === "Borrador" && p.Usuarios_ID === userId);
                    const aProyectosRechazados = aProyectosConEstado.filter(p => p.Estado === "Rechazado");

                    // Etapas asignadas al usuario
                    const aEtapasAsignadas = [];
                    const aProyectosAsignadosAlUsuario = [];

                    aProyectosPendientes.forEach((proyecto) => {

                        const ultimaEtapa = proyecto.Etapas
                            .filter(e => e.estado === "Aprobado" || e.estado === "Rechazado")
                            .sort((a, b) => new Date(b.fechaAprobado || b.creadoEn) - new Date(a.fechaAprobado || a.creadoEn))[0];

                        if (ultimaEtapa) {
                            proyecto.UltimaEtapaComentario = ultimaEtapa.comentario || "";
                            proyecto.UltimaEtapaNombre = ultimaEtapa.nombreEtapa || "Etapa sin nombre";

                        } else {
                            proyecto.UltimaEtapaComentario = "";
                            proyecto.UltimaEtapaNombre = "";
                        }


                        let tieneEtapaAsignada = false;

                        proyecto.Etapas.forEach((etapa) => {
                            const asignados = etapa.asignadoA
                                ?.split(',')
                                .map(email => email.trim().toLowerCase()) || [];

                            if (etapa.estado === "Pendiente" && asignados.includes(userEmail?.trim().toLowerCase())) {
                                tieneEtapaAsignada = true;
                                tieneEtapaAsignada = true;

                                aEtapasAsignadas.push({
                                    nombreEtapa: etapa.nombreEtapa,
                                    asignadoA: etapa.asignadoA,
                                    aprobadoPor: etapa.aprobadoPor,
                                    estado: etapa.estado,
                                    comentario: proyecto.UltimaEtapaComentario,
                                    fechaAprobado: etapa.fechaAprobado,
                                    nameProyect: proyecto.nameProyect,
                                    creadoPor: proyecto.creadoPor,
                                    descripcion: proyecto.descripcion,
                                    projectId: proyecto.ID
                                });
                            }
                        });

                        if (tieneEtapaAsignada) {
                            aProyectosAsignadosAlUsuario.push(proyecto);
                        }
                    });

                    //console.log("PENDIENTES:   "  +  JSON.stringify(aProyectosPendientes ))

                    // Contar todos los proyectos, pero ignorar los borradores de otros usuarios
                    const countTotal = aProyectosConEstado.reduce((acc, proyecto) => {
                        if (proyecto.Estado === "Borrador" && proyecto.Usuarios_ID !== userId) {
                            return acc; // no contar borradores de otros
                        }
                        return acc + 1; // contar el resto
                    }, 0);

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        Count: countTotal
                    }), "modelTotal");


                    // Procesar mis solicitudes (solo creados por mí)
                    const aMisSolicitudes = await procesarProyectos(myProjects);

                    // Filtrar solo las pendientes de mis solicitudes
                    const aMisSolicitudesPendientes = aMisSolicitudes.filter(p => p.Estado === "Pendiente");


                    const aProyectosAprobadosYRechazados = [
                        ...aProyectosAprobados,
                        ...aProyectosRechazados
                    ];

                    //console.log((" modelAprobados + Rechazados:", aProyectosAprobadosYRechazados);

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAprobadosYRechazados,
                        Count: aProyectosAprobadosYRechazados.length
                    }), "modelAprobados");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosPendientes,
                        Count: aProyectosPendientes.length
                    }), "modelPendientes");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosBorrador,
                        Count: aProyectosBorrador.length
                    }), "modelBorrador");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosRechazados,
                        Count: aProyectosRechazados.length
                    }), "modelRechazados");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        Count: countTotal,
                    }), "modelTotal");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        Etapas: aEtapasAsignadas,
                        Count: aEtapasAsignadas.length
                    }), "modelEtapasAsignadas");

                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAsignadosAlUsuario,
                        Count: aProyectosAsignadosAlUsuario.length
                    }), "modelAsignados");

                    //  Este es el modelo que contiene solo tus solicitudes pendientes
                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aMisSolicitudesPendientes,
                        Count: aMisSolicitudesPendientes.length
                    }), "modelMisSolicitudesPendientes");

                    //  Si también quieres tener el modelo con **todas** tus solicitudes (no solo pendientes)
                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                        DatosProyect: aMisSolicitudesPendientes,
                        Count: aMisSolicitudesPendientes.length
                    }), "modelMisSolicitudes");

                    // Actualizar texto de estado general
                    const oStatusControl = this.byId("status0");
                    if (aProyectosPendientes.length > 0) {
                        oStatusControl.setText("Pendiente");
                        oStatusControl.setState("Warning");
                    } else if (aProyectosRechazados.length > 0) {
                        oStatusControl.setText("Rechazado");
                        oStatusControl.setState("None");
                    } else if (aProyectosBorrador.length > 0) {
                        oStatusControl.setText("Borrador");
                        oStatusControl.setState("None");
                    } else {
                        oStatusControl.setText("Aprobado");
                        oStatusControl.setState("Success");
                    }

                } catch (error) {
                    console.error("❌ Error al cargar los proyectos con estado:", error);
                }
            },

            filtrarProyectosPorNombre: function (sNombre) {
                if (typeof sNombre !== "string") {
                    sNombre = "";
                }

                var oModel = this.getView().getModel("modelRechazados");
                var aTodosProyectos = oModel.getProperty("/DatosProyect") || [];

                var aFiltrados = aTodosProyectos.filter(function (proyecto) {
                    return proyecto.name && proyecto.name.toLowerCase().includes(sNombre.toLowerCase());
                });

                oModel.setProperty("/DatosProyect", aFiltrados);
                oModel.setProperty("/Count", aFiltrados.length);
            },

            filtrarProyectosPorNombre: function (sNombre) {
                if (typeof sNombre !== "string") {
                    sNombre = "";
                }

                var oModel = this.getView().getModel("modelRechazados");
                var aTodosProyectos = oModel.getProperty("/DatosProyect") || [];

                var aFiltrados = aTodosProyectos.filter(function (proyecto) {
                    return proyecto.name && proyecto.name.toLowerCase().includes(sNombre.toLowerCase());
                });

                oModel.setProperty("/DatosProyect", aFiltrados);
                oModel.setProperty("/Count", aFiltrados.length);
            },








            /*  onVerHistorial: async function (oEvent) {
                            try {
                                const oSource = oEvent.getSource();
            
                                // Intenta obtener el contexto desde modelPendientes
                                let oContext = oSource.getBindingContext("modelPendientes");
                                let modelo = "modelPendientes";
            
                                // Si no lo encuentra en modelPendientes, intenta con modelAprobados
                                if (!oContext) {
                                    oContext = oSource.getBindingContext("modelAprobados");
                                    modelo = "modelAprobados";
                                }
            
                                if (!oContext) {
                                    sap.m.MessageBox.warning("No se pudo determinar el modelo de origen.");
                                    return;
                                }
            
                                const oItem = oContext.getObject();
                                const workflowId = oItem.workflowId;
            
                                if (!workflowId) {
                                    //     sap.m.MessageToast.show("Este proyecto no tiene un workflow asociado.");
                                    return;
                                }
            
                                const oModel = this.getOwnerComponent().getModel(); // OData Model principal
                                const oBoundContext = oModel.bindContext("/getWorkflowTimeline(...)");
            
                                oBoundContext.setParameter("ID", workflowId);
                                await oBoundContext.execute();
            
                                const result = oBoundContext.getBoundContext().getObject();
                                //console.log((` Historial del workflow (${modelo}):`, result);
            
            
            
                                await this.onActivityPress(oEvent, result);
                                //   sap.m.MessageBox.information(JSON.stringify(result, null, 2));
                            } catch (error) {
                                console.error(" Error al obtener el historial del workflow:", error);
                                sap.m.MessageBox.error("No se pudo obtener el historial del workflow.");
                            }
                        },*/



            onActivityPress: function (oEvent, result) {

                this.byId("ma77").setVisible(true); // Para ocultar

                var oButton = oEvent.getSource();
                var sNameProyect = oButton.getCustomData()[0].getValue();
                var sID = oButton.getCustomData()[1].getValue();

                const eventos = result.value;

                var oProcessFlow = this.byId("processflow1");
                if (!oProcessFlow) {
                    console.error("No se encontró el ProcessFlow con ID 'processflow1'");
                    return;
                }


                oProcessFlow.removeAllNodes(); // Limpiar nodos existentes


                //  SOLO esta línea para crear nodos
                this.createProcessFlowNodes(eventos, oProcessFlow, sNameProyect);

                //  Solo una vez, fuera del bucle
                oProcessFlow.attachNodePress(this.onNodePress.bind(this));

                this.byId("idTitleProceso").setText("Proceso de solicitud: " + sNameProyect);
                this.byId("text1881").setText("PEP de solicitud: " + sID);
                this.byId("itb1").setSelectedKey("people");
            },



            onVerHistorial: async function (oEvent) {
                try {
                    const oSource = oEvent.getSource();

                    // Intenta obtener el contexto desde modelPendientes
                    let oContext = oSource.getBindingContext("modelPendientes");
                    let modelo = "modelPendientes";

                    // Si no lo encuentra en modelPendientes, intenta con modelAprobados
                    if (!oContext) {
                        oContext = oSource.getBindingContext("modelAprobados");
                        modelo = "modelAprobados";
                    }

                    if (!oContext) {
                        sap.m.MessageBox.warning("No se pudo determinar el modelo de origen.");
                        return;
                    }

                    const oItem = oContext.getObject();
                    const workflowId = oItem.workflowId;

                    if (!workflowId) {
                        //     sap.m.MessageToast.show("Este proyecto no tiene un workflow asociado.");
                        return;
                    }

                    const oModel = this.getOwnerComponent().getModel(); // OData Model principal
                    const oBoundContext = oModel.bindContext("/getWorkflowTimeline(...)");

                    oBoundContext.setParameter("ID", workflowId);
                    await oBoundContext.execute();

                    const result = oBoundContext.getBoundContext().getObject();
                    //console.log((` Historial del workflow (${modelo}):`, result);



                    await this.onActivityPress(oEvent, result);
                 sap.m.MessageBox.information(JSON.stringify(result, null, 2));
                } catch (error) {
                    console.error(" Error al obtener el historial del workflow:", error);
                    sap.m.MessageBox.error("No se pudo obtener el historial del workflow.");
                }
            },



            onActivityPress: function (oEvent, result) {

                this.byId("ma77").setVisible(true); // Para ocultar

                var oButton = oEvent.getSource();
                var sNameProyect = oButton.getCustomData()[0].getValue();
                var sID = oButton.getCustomData()[1].getValue();

                const eventos = result.value;

                var oProcessFlow = this.byId("processflow1");
                if (!oProcessFlow) {
                    console.error("No se encontró el ProcessFlow con ID 'processflow1'");
                    return;
                }


                oProcessFlow.removeAllNodes(); // Limpiar nodos existentes


                //  SOLO esta línea para crear nodos
                this.createProcessFlowNodes(eventos, oProcessFlow, sNameProyect);

                //  Solo una vez, fuera del bucle
                oProcessFlow.attachNodePress(this.onNodePress.bind(this));

                this.byId("idTitleProceso").setText("Proceso de solicitud: " + sNameProyect);
                this.byId("text1881").setText("PEP de solicitud: " + sID);
                this.byId("itb1").setSelectedKey("people");
            },


            createProcessFlowNodes: function (eventos, oProcessFlow, sNameProyect) {
                const laneMap = {
                    "SOLICITUD CDO": "0",
                    "APROBACIÓN": "1",
                         "PMO": "2",
                 // tanto revision como aprobado PMO
                    "APROBADO PMO": "3",
                    "BASIS": "4",
                    "CONTROL": "5",
                    "GESTIÓN": "6",
                    "DIRECCIÓN": "8",
                    "APROBACIÓN DIRECCIÓN": "9",
                    "RECHAZO": "99",
                    "FINALIZADO": "99"
                };

                const stateMap = {
                    "COMPLETED": "Positive",
                    "APPROVED": "Positive",
                    "RECHAZO": "Negative",
                    "REJECTED": "Negative",
                    "PENDIENTE": "Critical",
                    "CREATED": "Neutral",
                    "TRIGGERED": "Neutral"
                };

                const pasosExcluidos = [  "INVOKE FUNCTION" 
            

                 ];

                const eventosFiltrados = eventos.filter(e => {
                    const paso = (e.paso || "").trim().toUpperCase();
                    return !pasosExcluidos.some(ex => paso.includes(ex.toUpperCase()));
                });

                const eventoMap = new Map();
                eventosFiltrados.forEach(e => {
                    const clave = `${e.instancia}-${(e.paso || "").trim()}`;
                    const existente = eventoMap.get(clave);
                    if (!existente || new Date(e.timestamp) > new Date(existente.timestamp)) {
                        eventoMap.set(clave, e);
                    }
                });

                const listaEventos = Array.from(eventoMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                oProcessFlow.removeAllNodes();

                listaEventos.forEach((evento, index) => {
                    if (!evento.id) evento.id = "evento_" + index;

                    let pasoRaw = evento.paso || "Solicitud enviada";

                    // Asignar laneId según palabras clave específicas en el paso (pasoRaw)
                    let laneId = this.obtenerLaneIdDesdePaso(pasoRaw);

                    const pasoUpper = pasoRaw.toUpperCase();

                    console.log("PASOS: --> " + pasoUpper);

                    // Mapeo más específico:
// Condición especial para EXCLUSIVE_GATEWAY
if (pasoUpper.includes("VERIFICAR SSFF") || pasoUpper.includes("SAP")) {
    if (pasoUpper.includes("SSFF") || pasoUpper.includes("SAP")) {
        laneId = "9"; // Notificación de Area (Basis/TQ/Factoría)
//state = "Critical";
    } else {
        laneId = "5"; // Notificación Control de Gestión
    }
} 
// Mapeo más específico
else if (pasoUpper.includes("NOTIFICACIÓN")  && pasoUpper.includes("EMAIL")) {
      console.log("He entrado1 ");

    laneId = "1"; // Solicitud CDO

      console.log("He terminado 1 ");

} else if (pasoUpper.includes("APROBACIÓN") && pasoUpper.includes("ÁREA")) {
  console.log("He entrado 2");
    laneId = "2"; // Aprobación PMO
      console.log("He terminado 2 ");

} else if (
    pasoUpper.includes("BASIS") ||
    pasoUpper.includes("TQ") ||
    pasoUpper.includes("FACTORIA") ||
    pasoUpper.includes("TÉCNICA")
) {
   {
    laneId = "4";
    state = "Critical"; // amarillo
}
} else if (pasoUpper.includes("CONTROL") && pasoUpper.includes("NOTIFICACIÓN")) {
    laneId = "5"; // Notificación Control de Gestión
} else if (pasoUpper.includes("CONTROL") && pasoUpper.includes("APROBACIÓN")) {
    laneId = "6"; // Aprobación Control de Gestión
} else if (pasoUpper.includes("DIRECCIÓN") && pasoUpper.includes("NOTIFICACIÓN")) {
    laneId = "8"; // Notificación Dirección
} else if (pasoUpper.includes("DIRECCIÓN") && pasoUpper.includes("APROBACIÓN")) {
    laneId = "9"; // Aprobación Dirección
} else if (pasoUpper.includes("FINALIZADO") || pasoUpper.includes("RECHAZO") || pasoUpper.includes("RECHAZADO")) {
    laneId = "99"; // Finalizado / Rechazado
}


                    // Estado del nodo
                    let state = "Neutral";
                    const estadoEvento = (evento.estado || evento.tipo || "").toUpperCase();
                    for (let key in stateMap) {
                        if (estadoEvento.includes(key)) {
                            state = stateMap[key];
                            break;
                        }
                    }

                    const siguiente = listaEventos[index + 1];
                    const children = siguiente ? [siguiente.id] : [];

                    const node = new sap.suite.ui.commons.ProcessFlowNode({
                        nodeId: evento.id,
                        laneId: laneId,
                        title: pasoRaw,
                        titleAbbreviation: pasoRaw.substring(0, 3),
                        state: state,
                        stateText: evento.descripcion || "",
                        children: children,
                        isTitleClickable: true,
                        focused: false,
                        highlighted: false,
                        texts: [pasoRaw, evento.descripcion || ""]
                    });

                    node.addCustomData(new sap.ui.core.CustomData({
                        key: "eventoOriginal",
                        value: JSON.stringify(evento)
                    }));

                    node.data("eventoOriginal", evento);
                    oProcessFlow.addNode(node);
                });
            },


            obtenerLaneIdDesdePaso: function (pasoRaw) {
                const texto = (pasoRaw || "").toUpperCase();

                if (texto.includes("CDO") || texto.includes("SOLICITUD")) return "0";
                if (texto.includes("NOTIFICACIÓN") && texto.includes("AL AREA PMO")) return "1";
                if (texto.includes("APROBACIÓN") && texto.includes("PMO")) return "2";
                if (texto.includes("PMO") && !texto.includes("NOTIFICACIÓN")) return "3";
                if (texto.includes("BASIS") || texto.includes("TQ") || texto.includes("FACTORIA")) return "4";
                if (texto.includes("NOTIFICACIÓN") && texto.includes("CONTROL")) return "5";
                if (texto.includes("CONTROL") && !texto.includes("NOTIFICACIÓN")) return "6";
                if (texto.includes("NOTIFICACIÓN") && texto.includes("DIRECCIÓN")) return "8";
                if (texto.includes("DIRECCIÓN") && !texto.includes("NOTIFICACIÓN")) return "9";
                if (texto.includes("FINALIZADO") || texto.includes("RECHAZO") || texto.includes("RECHAZADO")) return "99";

                return "0"; // fallback
            },

            onNodePress: function (oEvent) {
                const node = oEvent.getParameters();
                if (!node) return;

                const evento = node.data("eventoOriginal");
                if (!evento) return;

                if (!this._oDialog) {
                    this._oDialog = new sap.m.Dialog({
                        title: "Detalles del Paso",
                        contentWidth: "500px",
                        contentHeight: "auto",
                        stretchOnPhone: true,
                        verticalScrolling: true,
                        content: [
                            new sap.ui.layout.form.SimpleForm({
                                editable: false,
                                layout: "ResponsiveGridLayout",
                                content: [
                                    new sap.m.Label({ text: "Paso" }),
                                    new sap.m.Text({ text: evento.paso || "Paso desconocido" }),

                                    new sap.m.Label({ text: "Descripción" }),
                                    new sap.m.Text({ text: evento.descripcion || "" }),

                                    new sap.m.Label({ text: "Fecha" }),
                                    new sap.m.Text({ text: evento.timestamp || "" }),

                                    new sap.m.Label({ text: "Comentario" }),
                                    new sap.m.Text({ text: evento.comentario || "N/A", wrapping: true })
                                ]
                            })

                        ],
                        beginButton: new sap.m.Button({
                            text: "Cerrar",
                            type: "Emphasized",
                            press: function () {
                                this._oDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oDialog);
                } else {
                    // Actualizamos el contenido si el dialog ya existe
                    const panel = this._oDialog.getContent()[0];
                    panel.removeAllContent();
                    panel.addContent(new sap.m.ObjectStatus({ title: "Paso", text: evento.paso || "Paso desconocido", state: "Success" }));
                    panel.addContent(new sap.m.ObjectStatus({ title: "Descripción", text: evento.descripcion || "", state: "Information" }));
                    panel.addContent(new sap.m.ObjectStatus({ title: "Fecha", text: evento.timestamp || "", state: "Warning" }));
                    panel.addContent(new sap.m.Label({ text: "Comentario", design: "Bold", class: "sapUiSmallMarginTop" }));
                    panel.addContent(new sap.m.Text({ title: "Comentario", text: evento.comentario || "N/A", wrapping: true, width: "100%" }));
                }

                this._oDialog.open();
            },





            getUserInfo: function () {

                fetch('/odata/v4/datos-cdo/getUserInfo')
                    .then(response => {
                        //    console.log("📥 Respuesta recibida del backend:", response);
                        if (!response.ok) {
                            throw new Error(" No se pudo obtener la información del usuario.");
                        }
                        return response.json();
                    })
                    .then(data => {
                        //            console.log("📦 Datos parseados:", data);

                        const userInfo = data.value;
                        const token = data.token || userInfo?.token;

                        if (!userInfo) {
                            console.error(" No se encontró la información del usuario.");
                            return;
                        }

                        // console.log("👤 Información del usuario:", userInfo);

                        // Actualizar controles de email y nombre con chequeo
                        const setControlText = (id, text, fallback) => {
                            const ctrl = this.byId(id);
                            if (ctrl) {
                                ctrl.setText(text || fallback);
                                //console.log((` Control '${id}' seteado a:`, text || fallback);
                            } else {
                                //  console.warn(` Control no encontrado: id '${id}'`);
                            }
                        };

                        setControlText("dddtg", userInfo.email, "Sin email");
                        setControlText("attrEmpleado", userInfo.fullName, "Sin nombre");

                        // Roles
                        const rolesObject = userInfo.roles || {};
                        const roleKeys = Object.keys(rolesObject);

                        const rolesEsperadosVisualizador = ["", "Visualizador", "user", "DatosProyect.Read"];
                        // Ordenar para comparar sin importar orden
                        const isVisualizadorSolo = roleKeys.length === rolesEsperadosVisualizador.length &&
                            roleKeys.every(role => rolesEsperadosVisualizador.includes(role));

                        console.log("Roles del usuario:", roleKeys);

                        // Botones a controlar
                        const botonesEditarIDs = ["newId_btnEditar", "aprobBtnEdit", "butn34"];
                        const botonesEliminarIDs = ["ww", "wsw", "newId_btnEliminar", "newId_btnEliminar2"];
                        const btnCrear = this.byId("33");



                        // Mostrar IconTabFilter si el usuario tiene ciertos roles
                        const rolesParaMostrarTab = ["Control", "Direccion", "BasisTQFac", "PMO"];
                        const mostrarTab = rolesParaMostrarTab.some(role => roleKeys.includes(role));

                        const tab = this.byId("id34");
                        if (tab) {
                            tab.setVisible(mostrarTab);
                            //   console.log(`IconTabFilter 'id34' visibilidad: ${mostrarTab}`);
                        } else {
                            //  console.warn("IconTabFilter con ID 'id34' no encontrado.");
                        }
                        // Función para toggle de botones con logs
                        const toggleBotones = (ids, estado, tipo) => {
                            ids.forEach(id => {
                                const btn = this.byId(id);
                                if (!btn) {
                                    //   console.warn(` Botón de ${tipo} no encontrado:`, id);
                                } else {
                                    btn.setEnabled(estado);

                                }
                            });
                        };

                        if (isVisualizadorSolo) {

                            toggleBotones(botonesEditarIDs, false, "editar");
                            toggleBotones(botonesEliminarIDs, false, "eliminar");

                            if (btnCrear) {
                                btnCrear.setEnabled(false);
                                //                                console.log(" Botón de creación deshabilitado.");
                            } else {
                                //                              console.warn(" Botón de creación no encontrado: id '33'");
                            }

                            sap.m.MessageBox.warning(
                                "Solo tiene permisos de visualizador. No puede crear, editar ni borrar.",
                                { title: "Permisos insuficientes" }
                            );
                        } else {
                            //                        console.log("Usuario con más permisos: habilitando botones...");
                            toggleBotones(botonesEditarIDs, true, "editar");
                            toggleBotones(botonesEliminarIDs, true, "eliminar");

                            if (btnCrear) {
                                btnCrear.setEnabled(true);
                                //                          console.log(" Botón de creación habilitado.");
                            } else {
                                console.warn(" Botón de creación no encontrado: id '33'");
                            }
                        }

                        if (token) {

                            this._startSessionWatcher(token);
                        } else {
                            console.warn("Token no recibido en la respuesta.");
                        }
                    })
                    .catch(error => {
                        console.error("Error obteniendo datos del usuario:", error);
                    });
            },

            // Método para obtener información del usuario
            /*  getUserInfo: function () {
                  console.log(" Iniciando getUserInfo...");
              
                  fetch('/odata/v4/datos-cdo/getUserInfo')
                      .then(response => {
                          console.log(" Respuesta recibida del backend:", response);
                          if (!response.ok) {
                              throw new Error(" No se pudo obtener la información del usuario.");
                          }
                          return response.json();
                      })
                      .then(data => {
                          console.log(" Datos parseados:", data);
              
                          const userInfo = data.value;
                          const token = data.token || (userInfo && userInfo.token);
              
                          if (!userInfo) {
                              console.error(" No se encontró la información del usuario.");
                              return;
                          }
              
                          console.log(" Información del usuario:", userInfo);
              
                          // Mostrar datos del usuario
                          const emailCtrl = this.byId("dddtg");
                          const nameCtrl = this.byId("attrEmpleado");
              
                          if (emailCtrl) {
                              emailCtrl.setText(userInfo.email || "Sin email");
                              console.log(" Email seteado:", userInfo.email || "Sin email");
                          } else {
                              console.warn("  Control de email no encontrado (id 'dddtg')");
                          }
              
                          if (nameCtrl) {
                              nameCtrl.setText(userInfo.fullName || "Sin nombre");
                              console.log(" Nombre seteado:", userInfo.fullName || "Sin nombre");
                          } else {
                              console.warn("  Control de nombre no encontrado (id 'attrEmpleado')");
                          }
              
                          // Roles
                          const roles = userInfo.roles || [];
                          console.log(" Roles del usuario:", roles);
  
                          const rolesObject = userInfo.roles || {};
                          const rolesEsperadosVisualizador = ["", "Visualizador", "user", "DatosProyect.Read"];
                          const roleKeys = Object.keys(userInfo.roles || {});
                          
                          // Ordenamos para evitar diferencias por el orden
                          const isVisualizadorSolo = roleKeys.length === rolesEsperadosVisualizador.length &&
                              roleKeys.every(role => rolesEsperadosVisualizador.includes(role));
                          
                          console.log("  ¿Es solo Visualizador?", isVisualizadorSolo);
                          
  
                          console.log("  ¿Es solo Visualizador?", isVisualizadorSolo);
                          
              
                          // Botones a controlar
                          const botonesEditarIDs = ["newId_btnEditar", "aprobBtnEdit", "butn34"];
                          const botonesEliminarIDs = ["ww", "wsw", "newId_btnEliminar", "newId_btnEliminar2"];
                          const btnCrear = this.byId("33");
              
                          // Toggle de botones con logs
                          const toggleBotones = (ids, estado, tipo) => {
                              ids.forEach(id => {
                                  const btn = this.byId(id);
                                  if (!btn) {
                                      console.warn(`  Botón de ${tipo} no encontrado:`, id);
                                  } else {
                                      btn.setEnabled(estado);
                                      console.log(` Botón ${id} (${tipo}) seteado a:`, estado);
                                  }
                              });
                          };
              
                          if (isVisualizadorSolo) {
                              console.log(" Usuario es solo visualizador: deshabilitando botones...");
                              toggleBotones(botonesEditarIDs, false, "editar");
                              toggleBotones(botonesEliminarIDs, false, "eliminar");
              
                              if (btnCrear) {
                                  btnCrear.setEnabled(false);
                                  console.log("  Botón de creación deshabilitado.");
                              } else {
                                  console.warn("  Botón de creación no encontrado: id '33'");
                              }
              
                              sap.m.MessageBox.warning(
                                  "Solo tiene permisos de visualizador. No puede crear, editar ni borrar.",
                                  { title: "Permisos insuficientes" }
                              );
                          } else {
                              console.log("  Usuario con más permisos: habilitando botones...");
                              toggleBotones(botonesEditarIDs, true, "editar");
                              toggleBotones(botonesEliminarIDs, true, "eliminar");
              
                              if (btnCrear) {
                                  btnCrear.setEnabled(true);
                                  console.log("  Botón de creación habilitado.");
                              } else {
                                  console.warn("  Botón de creación no encontrado: id '33'");
                              }
                          }
              
                          if (token) {
                              console.log("  Token recibido:", token);
                              console.log("  Iniciando watcher de sesión...");
                              this._startSessionWatcher(token);
                          } else {
                              console.warn("  Token no recibido en la respuesta.");
                          }
                      })
                      .catch(error => {
                          console.error("  Error obteniendo datos del usuario:", error);
                      });
              },*/




            _startSessionWatcher: function (token) {
                const decoded = this._parseJwt(token);
                const expiresAt = decoded.exp * 1000; // Expiración en milisegundos
                const now = Date.now();
                const timeUntilWarning = expiresAt - now - (1 * 60 * 1000); // 1 minuto antes

                if (timeUntilWarning > 0) {
                    setTimeout(() => {
                        this._showSessionWarning(expiresAt);
                    }, timeUntilWarning);
                } else {
                    this._showSessionWarning(expiresAt);
                }
            },


            _showSessionWarning: function (expiresAt) {
                let secondsLeft = Math.floor((expiresAt - Date.now()) / 1000);

                const interval = setInterval(() => {
                    if (secondsLeft <= 0) {
                        clearInterval(interval);
                        MessageBox.error("  Tu sesión ha expirado. (En pruebas: no se cerrará la sesión)");
                        return;
                    }

                    // Actualiza el texto del diálogo dinámicamente
                    if (dialog && dialog.getContent && dialog.getContent()[0]) {
                        dialog.getContent()[0].setText(`Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?`);
                    }

                    secondsLeft--;
                }, 1000);

                const dialog = new sap.m.Dialog({
                    title: "  Sesión a punto de expirar",
                    content: [new sap.m.Text({ text: `Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?` })],
                    beginButton: new sap.m.Button({
                        text: "Sí, mantener sesión",
                        press: () => {
                            clearInterval(interval);
                            dialog.close();
                            this._refreshToken(); //   Simula renovación de sesión
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "No",
                        press: () => {
                            clearInterval(interval);
                            dialog.close();
                            //   No hay logout en pruebas
                        }
                    }),
                    afterClose: () => {
                        dialog.destroy();
                    }
                });

                dialog.open();
            },



            _parseJwt: function (token) {
                const base64Url = token.split('.')[1];
                const base64 = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
                return JSON.parse(decodeURIComponent(escape(base64)));
            },

            _refreshToken: async function () {
                try {
                    const response = await fetch("/odata/v4/datos-cdo/getUserInfo", {
                        method: "GET"
                    });
                    const data = await response.json();

                    console.log("Respuesta refresco token:", data); // <<<<<< Aquí para debug

                    const token = data.token || (data.value && data.value.token);

                    if (token) {
                        this._startSessionWatcher(token);
                        MessageBox.success("Sesión renovada.");
                    } else {
                        throw new Error("Token no recibido.");
                    }
                } catch (err) {
                    MessageBox.error("No se pudo renovar la sesión: " + err.message);
                }
            },












            loadFilteredData: function () {
                var oFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Aprobado");
                var oTable = this.byId("tabla_Aprobadores");
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    oBinding.filter([oFilter]);
                    this.updateIconTabFilterCount(oBinding); // Llama a la función para actualizar el count
                } else {
                    oTable.attachEventOnce("updateFinished", function () {
                        var oBinding = oTable.getBinding("items");
                        oBinding.filter([oFilter]);
                        this.updateIconTabFilterCount(oBinding);
                    }.bind(this));
                }
            },

            updateIconTabFilterCount: function (oBinding) {
                // Espera a que la tabla termine de procesar los datos filtrados
                oBinding.attachEventOnce("dataReceived", function () {
                    // Aquí debería estar el conteo correcto de los elementos
                    var iCount = oBinding.getLength();
                    //console.log("TOTAL COUNT --> ", iCount);

                    // Actualiza el valor de "count" en el IconTabFilter
                    this.byId("ma55").setCount(iCount.toString());
                }.bind(this));
            },


            loadFilteredDataPend: function () {
                var oTable = this.byId("idPendientes");
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    var oFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Pendiente");
                    oBinding.filter([oFilter]);
                    var aFilteredContexts = oBinding.getContexts();
                    var aFilteredData = aFilteredContexts.map(ctx => ctx.getObject());
                    //   console.log("Datos filtrados (Pendientes):", aFilteredData);
                    this.updateIconTabFilterCountPen(oBinding);
                } else {
                    oTable.attachEventOnce("updateFinished", function () {
                        var oBinding = oTable.getBinding("items");
                        var oFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Pendiente");
                        oBinding.filter([oFilter]);
                        var aFilteredContexts = oBinding.getContexts();
                        var aFilteredData = aFilteredContexts.map(ctx => ctx.getObject());
                        //    console.log("Datos filtrados (Pendientes):", aFilteredData);

                        this.updateIconTabFilterCountPen(oBinding);
                    }.bind(this));
                }
            },


            updateIconTabFilterCountPen: function (oBinding) {
                // Espera a que la tabla termine de procesar los datos filtrados
                oBinding.attachEventOnce("dataReceived", function () {
                    // Aquí debería estar el conteo correcto de los elementos
                    var iCount = oBinding.getLength();

                    // Actualiza el valor de "count" en el IconTabFilter
                    this.byId("ma3").setCount(iCount.toString());
                }.bind(this));
            },

            onSearch: function (oEvent) {
                const sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
                const oTable = this.byId("TableBorrador"); // Cambia por el id real de la tabla
                const oBinding = oTable.getBinding("items");

                if (oBinding) {
                    if (sQuery.length > 0) {
                        const oFilter = new sap.ui.model.Filter({
                            filters: [
                                // Filtros en los campos de tu modelo
                                new sap.ui.model.Filter("FechaCreacionFormateada", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("nameProyect", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("descripcion", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("NombreArea", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("NombreJefe", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("FechaModificacionFormateada", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.Contains, sQuery)
                            ],
                            and: false
                        });
                        oBinding.filter(oFilter);
                    } else {
                        oBinding.filter([]);
                    }
                }
            },


            /*  onSearch: function (oEvent) {
                 // Obtener el valor ingresado en el SearchField
                 var sQuery = oEvent.getParameter("newValue");
                 var oTable = this.byId("idPendientes"); // Obtener la tabla
                 var oBinding = oTable.getBinding("items"); // Obtener el binding de los items
 
                 // Crear el filtro de estado "Pendiente"
                 var oStatusFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Pendiente");
 
                 // Crear el filtro de búsqueda para el nombre del proyecto
                 var aFilters = [oStatusFilter]; // Incluir el filtro de estado por defecto
                 if (sQuery && sQuery.length > 0) {
                     // Crear un filtro que sea insensible al caso (case insensitive)
                     var oSearchFilter = new sap.ui.model.Filter({
                         path: "nameProyect",
                         operator: sap.ui.model.FilterOperator.Contains,
                         value1: sQuery.toLowerCase(),  // Convertir a minúsculas el valor de búsqueda
                         caseSensitive: false           // Configurar el filtro para que no sea sensible al caso
                     });
                     aFilters.push(oSearchFilter); // Agregar el filtro de búsqueda al array de filtros
                 }
 
                 // Combinar ambos filtros usando un filtro AND
                 var oCombinedFilter = new sap.ui.model.Filter({
                     filters: aFilters,
                     and: true
                 });
 
                 // Aplicar el filtro combinado
                 oBinding.filter(oCombinedFilter);
             },*/



            onSearchApro: function (oEvent) {
                // Obtener el valor ingresado en el SearchField
                var sQuery = oEvent.getParameter("newValue");
                var oTable = this.byId("tabla_Aprobadores"); // Obtener la tabla
                var oBinding = oTable.getBinding("items"); // Obtener el binding de los items

                // Crear el filtro de estado "Pendiente"
                var oStatusFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Aprobado");

                // Crear el filtro de búsqueda para el nombre del proyecto
                var aFilters = [oStatusFilter]; // Incluir el filtro de estado por defecto
                if (sQuery && sQuery.length > 0) {
                    // Crear un filtro que sea insensible al caso (case insensitive)
                    var oSearchFilter = new sap.ui.model.Filter({
                        path: "nameProyect",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: sQuery.toLowerCase(),  // Convertir a minúsculas el valor de búsqueda
                        caseSensitive: false           // Configurar el filtro para que no sea sensible al caso
                    });
                    aFilters.push(oSearchFilter); // Agregar el filtro de búsqueda al array de filtros
                }

                // Combinar ambos filtros usando un filtro AND
                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                });

                // Aplicar el filtro combinado
                oBinding.filter(oCombinedFilter);
            },



            onSearchAprobadores: function (oEvent) {
                const sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
                const oTable = this.byId("tabla_Aprobadores");
                const oBinding = oTable.getBinding("items");

                if (oBinding) {
                    if (sQuery.length > 0) {
                        const oFilter = new sap.ui.model.Filter({
                            filters: [
                                new sap.ui.model.Filter("nombreEtapa", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("nameProyect", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("descripcion", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("asignadoA", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("comentario", sap.ui.model.FilterOperator.Contains, sQuery)
                            ],
                            and: false  // OR entre filtros para buscar en varios campos
                        });
                        oBinding.filter(oFilter);
                    } else {
                        oBinding.filter([]);  // Quitar filtros si no hay texto
                    }
                }
            },



            onAfterShow: function () {
                this._loadProjectData();
            },

            _loadProjectData: function () {
                const oTable = this.byId("idPendientes");
                const oBinding = oTable.getBinding("items");

                if (oBinding) {
                    oBinding.refresh(); // Refresca los datos de la tabla
                }
            },


            _onObjectMatched: async function (oEvent) {

                // Obtener el ID recibido como parámetro de la URL
                /*  const newId = oEvent.getParameter("arguments").newId;
  
                  //console.log(("ids comtenriofg")
                  // Verifica si el ID es válido
                  if (!newId) {
                      console.error("No se recibió un ID válido");
                      return;
                  }*/

                const oModel = this.getOwnerComponent().getModel("modelEtapasAsignadas");
                if (oModel) {
                    oModel.refresh(true); // true = fuerza la actualización de datos desde backend (si es OData)
                }


                this._refrescarModelEtapas();
                this.filterEstado();


            },

            _refrescarModelEtapas: async function () {
                try {
                    const userModel = this.getView().getModel("userModel");
                    if (!userModel) return;

                    const userEmail = userModel.getProperty("/email");
                    const modelPendientes = this.getView().getModel("modelPendientes");

                    if (!modelPendientes) return;

                    const aProyectosPendientes = modelPendientes.getProperty("/DatosProyect") || [];

                    const aEtapasAsignadas = [];

                    aProyectosPendientes.forEach((proyecto) => {
                        proyecto.Etapas.forEach((etapa) => {
                            if (
                                etapa.estado === "Pendiente" &&
                                etapa.asignadoA?.trim().toLowerCase() === userEmail?.trim().toLowerCase()
                            ) {
                                aEtapasAsignadas.push({
                                    nombreEtapa: etapa.nombreEtapa,
                                    asignadoA: etapa.asignadoA,
                                    aprobadoPor: etapa.aprobadoPor,
                                    estado: etapa.estado,
                                    comentario: etapa.comentario,
                                    fechaAprobado: etapa.fechaAprobado,
                                    nameProyect: proyecto.nameProyect,
                                    creadoPor: proyecto.creadoPor,
                                    descripcion: proyecto.descripcion,
                                    projectId: proyecto.ID
                                });
                            }
                        });
                    });

                    this.getView().getModel("modelEtapasAsignadas").setData({
                        Etapas: aEtapasAsignadas,
                        Count: aEtapasAsignadas.length
                    });
                } catch (error) {
                    console.error("Error al refrescar modelEtapasAsignadas:", error);
                }
            },






            _refreshTableData: function () {
                const oTable = this.byId("idPendientes");  // Obtener la referencia a la tabla

                // Verificar si la tabla existe
                if (oTable) {
                    // Refrescar el binding de los elementos de la tabla
                    oTable.getBinding("items")?.refresh();
                }


            },






            formatDate: function (dateValue) {
                if (!dateValue) {
                    return "";
                }

                // Si es tipo Raw (OData V4), puede llegar como un objeto con función getTime
                if (typeof dateValue === "object" && typeof dateValue.getTime === "function") {
                    dateValue = dateValue;
                } else {
                    dateValue = new Date(dateValue);
                }

                if (isNaN(dateValue.getTime())) {
                    return ""; // no válido
                }

                var oDateFormat = DateFormat.getInstance({
                    pattern: "dd MMM yyyy",
                    UTC: true
                });

                return oDateFormat.format(dateValue);
            },

            onEditPress: function (oEvent) {
                var oButton = oEvent.getSource();

                var oContextPendientes = oButton.getBindingContext("modelPendientes");
                var oContextAprobados = oButton.getBindingContext("modelAprobados");
                var oContextBorradores = oButton.getBindingContext("modelBorrador");
                var oContextAprobadores = oButton.getBindingContext("modelEtapasAsignadas");
                var oContextRechazados = oButton.getBindingContext("modelRechazados");


                var oContext = oContextPendientes || oContextAprobados || oContextBorradores || oContextAprobadores || oContextRechazados;

                if (!oContext) {
                    console.error("No se pudo obtener el contexto del ítem.");
                    return;
                }

                var sProjectID = oContext.getProperty("ID") || oContext.getProperty("projectId");
                if (!sProjectID) {
                    console.error("El ID del proyecto es nulo o indefinido");
                    return;
                }

                var sNameProyect = oContext.getProperty("nameProyect");

                var that = this;

                var oModel = this.getView().getModel("mainService");
                if (oModel) {
                    oModel.setData({});
                    oModel.refresh(true);
                }

                // Determinar el modelo de origen

                var sourceModelName = null;

                if (oContextPendientes) {
                    sourceModelName = "modelPendientes";
                } else if (oContextAprobados) {
                    sourceModelName = "modelAprobados";
                } else if (oContextBorradores) {
                    sourceModelName = "modelBorrador";
                } else if (oContextAprobadores) {
                    sourceModelName = "modelEtapasAsignadas";
                } else if (oContextRechazados) {
                    sourceModelName = "modelRechazados";
                }

                // Modo: si es del modelo de etapas asignadas => siempre display
                var mode = (sourceModelName === "modelEtapasAsignadas" || sourceModelName === "modelAprobados" || sourceModelName === "modelRechazados")
                    ? "display"
                    : "edit";

                var dialogTitle = (mode === "edit") ? "Confirmar Edición" : "Ver Solicitud";
                var dialogText = (mode === "edit")
                    ? "¿Estás seguro de que quieres editar el proyecto '" + sNameProyect + "'?"
                    : "¿Quieres ver el contenido de esta solicitud?";

                var oDialog = new sap.m.Dialog({
                    title: dialogTitle,
                    type: "Message",
                    state: "Warning",
                    content: new sap.m.Text({ text: dialogText }),
                    beginButton: new sap.m.Button({
                        text: "Confirmar",
                        press: function () {
                            oDialog.close();

                            var oRouter = sap.ui.core.UIComponent.getRouterFor(that);

                            // 🚀 Navegación especial si es del modelo de aprobadores
                            if (sourceModelName === "modelEtapasAsignadas") {
                                oRouter.navTo("viewWithAprobacion", {
                                    sourceModel: sourceModelName,
                                    mode: mode,
                                    sProjectID: sProjectID,
                                    aprobacion: "true"
                                });
                            } else {
                                // Ruta estándar con modo
                                oRouter.navTo("viewWithMode", {
                                    sourceModel: sourceModelName,
                                    mode: mode,
                                    sProjectID: sProjectID
                                }, true);
                            }
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancelar",
                        press: function () {
                            oDialog.close();
                        }
                    })
                });

                oDialog.open();
            },






            onView: function (oEvent) {

                if (!this.Dialog) {
                    this.Dialog = this.loadFragment({
                        name: "project1.view.Dialog"
                    });
                }
                this.Dialog.then(function (oDialog) {
                    this.oDialog = oDialog;
                    this.oDialog.open();
                }.bind(this));



            },



            _closeDialog: function () {
                this.oDialog.close();
            },



            // Método asíncrono que maneja la información del diálogo
            DialogInfo: async function (oEvent) {
                this.onView();

                // Obtener el botón que fue presionado
                var oButton = oEvent.getSource();

                // Obtener el valor de CustomData (ID del proyecto)
                var sProjectID = oButton.getCustomData().find(function (oData) {
                    return oData.getKey() === "projectId";
                }).getValue();

                //console.log(("Metodo project " + sProjectID);

                const Token = this._sCsrfToken;
                var oModel = this.getView().getModel("mainService");
                if (oModel) {
                    oModel.setData({});  // Limpia los datos al cargar la vista
                    oModel.refresh(true);
                }



                // Construye la URL con el ID correctamente escapado
                var sUrl = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})?$expand=jefeProyectID,Area`;

                try {
                    const response = await fetch(sUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'x-csrf-token': Token
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error('Network response was not ok: ' + errorText);
                    }

                    const oData = await response.json();

                    //console.log((JSON.stringify(oData));


                    this.byId("idNombreProyecto").setText(oData.nameProyect);
                    this.byId("idDescripcion1").setText(oData.descripcion);
                    this.byId("idCreador").setText(oData.Empleado);
                    this.byId("idEMail").setText(oData.Email);
                    this.byId("idModifi").setText(oData.FechaModificacion);
                    this.byId("fechainitProyect").setText(oData.Fechainicio);
                    const sNombreJefe = oData.jefeProyectID?.name || "Sin jefe asignado";
                    this.byId("idJefeProyect").setText(sNombreJefe);
                    this.byId("idArea").setText(oData.Area?.NombreArea || "Sin área");

                    const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        style: "medium" // Puedes usar "short", "medium", "long", o "full"
                    });

                    const date = new Date(oData.fechaCreacion);
                    const formattedDate = oDateFormat.format(date);

                    this.byId("idCreacion").setText(formattedDate);


                    if (oData.FechaFin) {
                        var fecha = oData.FechaFin.split("T")[0];
                        var partes = fecha.split("-");
                        var fechaFormateada = partes[2] + "-" + partes[1] + "-" + partes[0];
                        this.byId("idFechaFinProyect").setText(fechaFormateada);
                    } else {
                        this.byId("idFechaFinProyect").setText("Sin fecha");
                        console.warn("FechaFin es null o indefinido");
                    }


                    //      this.byId("idFechaFinProyect").setText(oData.FechaFin);
                    this.byId("idEstadoProyect").setText(oData.Estado);

                    const sEstado = oData.Estado || "";
                    const oObjectStatus = this.byId("idEstadoProyect");

                    oObjectStatus.setText(sEstado);

                    switch (sEstado.toLowerCase()) {
                        case "aprobado":
                            oObjectStatus.setState("Success");
                            break;
                        case "rechazado":
                            oObjectStatus.setState("Error");
                            break;
                        case "pendiente":
                            oObjectStatus.setState("Warning");
                            break;
                        case "borrador":
                            oObjectStatus.setState("None"); // o "Information"
                            break;
                        default:
                            oObjectStatus.setState("None");
                            break;
                    }
                    var formattedTotal = new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(oData.Total);

                    // Agregar el símbolo de euro al final
                    var formattedTotalWithEuro = formattedTotal + ' €';
                    this.byId("idtotal").setText(formattedTotalWithEuro);

                } catch (error) {
                    console.error("Error al obtener los datos del proyecto:", error);
                    //     sap.m.MessageToast.show("Error al cargar los datos del proyecto");
                }
            },


            onEmailPress2: function (oEvent) {
                const sEmail = oEvent.getSource().getText();
                window.location.href = "mailto:" + sEmail;
            },







            // Define un objeto con las propiedades hijas que quieres eliminar
            onDeletePress: async function (oEvent) {
                let oButton = oEvent.getSource();
                const workflowInstanceId = oButton.data("etapaId");
                let sProjectId = oButton.getCustomData()[0].getValue();

                if (!sProjectId) {
                    console.error("No se encontró un ID válido para eliminar.");
                    sap.m.MessageToast.show("Error: No se encontró un ID válido.");
                    return;
                }



                //console.log(("Eliminando Proyecto con ID:", sProjectId);

                const hijosAnidados = {
                    otrosGastoRecu: ["ValorMensuServReInter"],
                    RecursosInternos: ["ValorMensuReInter"],
                    otrosRecursos: ["ValorMensuGastViaReInter"],
                    ConsumoExternos: ["ValorMensuConsuEx"],
                    otrosServiciosConsu: ["ValorMensuServConsuEx"],
                    GastoViajeConsumo: ["ValorMensuGastoViaConsuEx"],
                    RecursosExternos: ["ValorMensuRecuExter"],
                    serviRecurExter: ["ValorMensuSerExter"],
                    GastoViajeRecExter: ["ValorMensuGastoViExter"],
                    otrosConceptos: ["ValorMensuOtrConcep"],
                    LicenciasCon: ["ValorMensulicencia"]
                };

                try {

                    // 1️⃣ Obtener CSRF Token
                    let oTokenResponse = await fetch("/odata/v4/datos-cdo/", {
                        method: "GET",
                        headers: { "x-csrf-token": "Fetch" }
                    });

                    if (!oTokenResponse.ok) throw new Error("Error al obtener el CSRF Token");

                    let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
                    if (!sCsrfToken) throw new Error("No se recibió un CSRF Token");

                    //console.log(("CSRF Token obtenido:", sCsrfToken);

                    sap.m.MessageBox.confirm(
                        "¿Deseas eliminar este proyecto y todos sus registros relacionados?",
                        {
                            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],

                            onClose: async (oAction) => {
                                if (oAction !== sap.m.MessageBox.Action.YES) return;
                                this.byId("idPendientes").setBusy(true);
                                this.byId("idTableAprobados").setBusy(true);
                                this.byId("TableBorrador").setBusy(true);
                                this.byId("tabla_Aprobadores").setBusy(true);
                                try {

                                    // ❗ Cancelar workflow si existe
                                    const workflowRes = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})?$expand=WorkflowInstancias`, {
                                        method: "GET",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "x-csrf-token": sCsrfToken
                                        }
                                    });

                                    if (workflowRes.ok) {


                                        if (workflowInstanceId) {
                                            try {
                                                const oModel = this.getOwnerComponent().getModel();
                                                const oContext = oModel.bindContext("/cancelWorkflow(...)");
                                                oContext.setParameter("workflowInstanceId", workflowInstanceId);
                                                await oContext.execute();  // <-- Si da error aquí, entra al catch
                                            } catch (cancelError) {
                                                console.warn("Error al cancelar el workflow. Continuando con la eliminación.", cancelError);
                                            }
                                        }
                                    } else {
                                        console.warn("No se pudo obtener la instancia de workflow.");
                                    }

                                    const paths = [
                                        "planificacion",
                                        "planServicio",
                                        "Facturacion",
                                        "ClientFactura",
                                        "ProveedoresC",
                                        "RecursosInternos",
                                        "ConsumoExternos",
                                        "RecursosExternos",
                                        "otrosConceptos",
                                        "otrosGastoRecu",
                                        "otrosRecursos",
                                        "otrosServiciosConsu",
                                        "GastoViajeConsumo",
                                        "serviRecurExter",
                                        "GastoViajeRecExter",
                                        "LicenciasCon",
                                        "WorkflowInstancias",
                                        "ResumenCostesTotal",
                                        "RecurInterTotal",
                                        "ConsuExterTotal",
                                        "RecuExterTotal",
                                        "InfraestrLicencia",
                                        "PerfilTotal",
                                        "Archivos"

                                    ];

                                    //   Eliminar registros relacionados, incluyendo hijos anidados
                                    for (const path of paths) {
                                        let res = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})/${path}`, {
                                            method: "GET",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "x-csrf-token": sCsrfToken
                                            },
                                        });

                                        if (!res.ok) {
                                            console.warn(`  No se pudieron obtener los registros de ${path}`);
                                            continue;
                                        }

                                        let contentType = res.headers.get("Content-Type");
                                        let data = contentType && contentType.includes("application/json") ? await res.json() : { value: [] };
                                        let records = Array.isArray(data.value) ? data.value : [data];

                                        if (records.length > 0) {
                                            for (const hijo of records) {
                                                // Eliminar hijos anidados
                                                if (hijosAnidados[path]) {
                                                    let subPaths = hijosAnidados[path];
                                                    for (const hijoAnidado of subPaths) {
                                                        let subRes = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})/${hijoAnidado}`, {
                                                            method: "GET",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "x-csrf-token": sCsrfToken
                                                            }
                                                        });

                                                        if (subRes.ok) {
                                                            let subData = await subRes.json();
                                                            let subRecords = subData.value || [];

                                                            await Promise.all(subRecords.map(async (subRegistro) => {
                                                                let deleteSubRes = await fetch(`/odata/v4/datos-cdo/${hijoAnidado}(${subRegistro.ID})`, {
                                                                    method: "DELETE",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                        "x-csrf-token": sCsrfToken
                                                                    }
                                                                });
                                                                if (!deleteSubRes.ok) {
                                                                    console.error(`Error eliminando hijo anidado ${hijoAnidado} con ID ${subRegistro.ID}`);
                                                                } else {
                                                                    //console.log((`Hijo anidado eliminado: ${hijoAnidado} ID ${subRegistro.ID}`);
                                                                }
                                                            }));
                                                        } else {
                                                            console.warn(`No se pudieron obtener registros para hijo anidado ${hijoAnidado} de ${path}(${hijo.ID})`);
                                                        }
                                                    }
                                                }

                                                // Eliminar registro principal
                                                let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})`, {
                                                    method: "DELETE",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "x-csrf-token": sCsrfToken
                                                    }
                                                });

                                                if (!deleteResponse.ok) {
                                                    console.error(`Error eliminando ${path} con ID ${hijo.ID}`);
                                                } else {
                                                    //console.log((`${path} eliminado: ${hijo.ID}`);
                                                }
                                            }
                                        }
                                    }

                                    //console.log(("Registros relacionados eliminados.");

                                    //   Eliminar el proyecto principal
                                    let projectResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "x-csrf-token": sCsrfToken
                                        },
                                    });

                                    if (projectResponse.ok) {
                                        //     console.log("Proyecto eliminado correctamente.");
                                        sap.m.MessageBox.success("Proyecto y registros eliminados exitosamente.", {
                                            title: "Éxito",
                                            actions: [sap.m.MessageBox.Action.OK],
                                            onClose: async function () {
                                                let oTable = this.byId("idPendientes");
                                                if (oTable) {
                                                    let oBinding = oTable.getBinding("items");
                                                    if (oBinding) {
                                                        oBinding.refresh(true);  // Forzar actualización desde backend
                                                    } else {
                                                        console.warn("  No se encontró el binding de la tabla.");
                                                    }
                                                } else {
                                                    console.warn("  Tabla no encontrada con ID idPendientes.");
                                                }
                                                await this.filterEstado();
                                            }.bind(this)
                                        });
                                    } else {
                                        throw new Error("Error al eliminar el proyecto principal");
                                    }
                                } catch (error) {
                                    console.error("Error eliminando el proyecto o registros:", error);
                                    sap.m.MessageToast.show("Error al eliminar el proyecto o registros.");
                                } finally {
                                    this.byId("TableBorrador").setBusy(false);
                                    this.byId("idPendientes").setBusy(false);
                                    this.byId("idTableAprobados").setBusy(false);
                                    this.byId("tabla_Aprobadores").setBusy(false);
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error("Error al obtener el CSRF Token:", error);
                    sap.m.MessageToast.show("Error al obtener el CSRF Token.");
                }

            },

            /*onDeletePress: async function (oEvent) {
                let oButton = oEvent.getSource();
                let sProjectId = oButton.getCustomData()[0].getValue();
            
                if (!sProjectId) {
                    console.error("No se encontró un ID válido para eliminar.");
                    sap.m.MessageToast.show("Error: No se encontró un ID válido.");
                    return;
                }
            
                console.log("Eliminando Proyecto con ID:", sProjectId);
            
                const hijosAnidados = {
                    otrosGastoRecu: ["ValorMensuServReInter"],
                    RecursosInternos: ["ValorMensuReInter"],
                    otrosRecursos: ["ValorMensuGastViaReInter"],
                    ConsumoExternos: ["ValorMensuConsuEx"],
                    otrosServiciosConsu: ["ValorMensuServConsuEx"],
                    GastoViajeConsumo: ["ValorMensuGastoViaConsuEx"],
                    RecursosExternos: ["ValorMensuRecuExter"],
                    serviRecurExter: ["ValorMensuSerExter"],
                    GastoViajeRecExter: ["ValorMensuGastoViExter"],
                    otrosConceptos: ["ValorMensuOtrConcep"],
                    LicenciasCon: ["ValorMensulicencia"]
                };
            
                try {
                    // 1️⃣ Obtener CSRF Token
                    let oTokenResponse = await fetch("/odata/v4/datos-cdo/", {
                        method: "GET",
                        headers: { "x-csrf-token": "Fetch" }
                    });
            
                    if (!oTokenResponse.ok) throw new Error("Error al obtener el CSRF Token");
            
                    let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
                    if (!sCsrfToken) throw new Error("No se recibió un CSRF Token");
            
                    console.log("CSRF Token obtenido:", sCsrfToken);
            
                    sap.m.MessageBox.confirm(
                        "¿Deseas eliminar este proyecto y todos sus registros relacionados?",
                        {
                            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                            onClose: async (oAction) => {
                                if (oAction !== sap.m.MessageBox.Action.YES) return;
            
                                try {
                                    const paths = [
                                        "planificacion",
                                        "Facturacion",
                                        "ClientFactura",
                                        "ProveedoresC",
                                        "RecursosInternos",
                                        "ConsumoExternos",
                                        "RecursosExternos",
                                        "otrosConceptos",
                                        "otrosGastoRecu",
                                        "otrosRecursos",
                                        "otrosServiciosConsu",
                                        "GastoViajeConsumo",
                                        "serviRecurExter",
                                        "GastoViajeRecExter",
                                        "LicenciasCon",
                                        "WorkflowInstancias",
                                        "ResumenCostesTotal",
                                        "RecurInterTotal",
                                        "ConsuExterTotal",
                                        "RecuExterTotal",
                                        "InfraestrLicencia",
                                        "PerfilTotal"
                                    ];
            
                                    //   Eliminar registros relacionados, incluyendo hijos anidados
                                    for (const path of paths) {
                                        // Obtener registros relacionados
                                        let res = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})/${path}`, {
                                            method: "GET",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "x-csrf-token": sCsrfToken
                                            },
                                        });
            
                                        if (!res.ok) {
                                            console.warn(`  No se pudieron obtener los registros de ${path}`);
                                            continue;
                                        }
            
                                        let contentType = res.headers.get("Content-Type");
                                        let data = contentType && contentType.includes("application/json") ? await res.json() : { value: [] };
                                        let records = Array.isArray(data.value) ? data.value : [data];
            
                                        if (records.length > 0) {
                                            for (const hijo of records) {
                                                // Primero eliminar hijos anidados (si existen)
                                                if (hijosAnidados[path]) {
                                                    let subPaths = hijosAnidados[path];
                                                    for (const hijoAnidado of subPaths) {
                                                        let subRes = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})/${hijoAnidado}`, {
                                                            method: "GET",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "x-csrf-token": sCsrfToken
                                                            }
                                                        });
            
                                                        if (subRes.ok) {
                                                            let subData = await subRes.json();
                                                            let subRecords = subData.value || [];
            
                                                            await Promise.all(subRecords.map(async (subRegistro) => {
                                                                let deleteSubRes = await fetch(`/odata/v4/datos-cdo/${hijoAnidado}(${subRegistro.ID})`, {
                                                                    method: "DELETE",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                        "x-csrf-token": sCsrfToken
                                                                    }
                                                                });
                                                                if (!deleteSubRes.ok) {
                                                                    console.error(`Error eliminando hijo anidado ${hijoAnidado} con ID ${subRegistro.ID}`);
                                                                } else {
                                                                    console.log(`Hijo anidado eliminado: ${hijoAnidado} ID ${subRegistro.ID}`);
                                                                }
                                                            }));
                                                        } else {
                                                            console.warn(`No se pudieron obtener registros para hijo anidado ${hijoAnidado} de ${path}(${hijo.ID})`);
                                                        }
                                                    }
                                                }
            
                                                // Ahora eliminar el registro principal
                                                let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})`, {
                                                    method: "DELETE",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "x-csrf-token": sCsrfToken
                                                    }
                                                });
            
                                                if (!deleteResponse.ok) {
                                                    console.error(`Error eliminando ${path} con ID ${hijo.ID}`);
                                                } else {
                                                    console.log(`${path} eliminado: ${hijo.ID}`);
                                                }
                                            }
                                        }
                                    }
            
                                    console.log("Registros relacionados eliminados.");
            
                                    //   Eliminar el proyecto principal
                                    let projectResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "x-csrf-token": sCsrfToken
                                        },
                                    });
            
                                    if (projectResponse.ok) {
                                        console.log("Proyecto eliminado correctamente.");
                                        sap.m.MessageBox.success("Proyecto y registros eliminados exitosamente.", {
                                            title: "Éxito",
                                            actions: [sap.m.MessageBox.Action.OK],
                                            onClose: async function () {
                                                let oTable = this.byId("idPendientes");
                                                if (oTable) {
                                                    let oBinding = oTable.getBinding("items");
                                                    if (oBinding) {
                                                        oBinding.refresh(true);  // Forzar actualización desde el backend
                                                    } else {
                                                        console.warn("  No se encontró el binding de la tabla.");
                                                    }
                                                } else {
                                                    console.warn("  Tabla no encontrada con ID idPendientes.");
                                                }
                                                await this.filterEstado();
                                            }.bind(this)
                                        });
                                    } else {
                                        throw new Error("Error al eliminar el proyecto principal");
                                    }
                                } catch (error) {
                                    console.error("Error eliminando el proyecto o registros:", error);
                                    sap.m.MessageToast.show("Error al eliminar el proyecto o registros.");
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error("Error al obtener el CSRF Token:", error);
                    sap.m.MessageToast.show("Error al obtener el CSRF Token.");
                }
            },*/








            /*  onDeletePress: async function (oEvent) {
                  let oButton = oEvent.getSource();
                  let sProjectId = oButton.getCustomData()[0].getValue();
  
  
                  console.log("id seleccionado "    + sProjectId); 
                  const workflowInstanceId = oButton.data("etapaId");
  
                 console.log("  Eliminar etapa", workflowInstanceId +" " +  sProjectId);
              
                  if (!sProjectId) {
                      console.error("No se encontró un ID válido para eliminar.");
                      sap.m.MessageToast.show("Error: No se encontró un ID válido.");
                      return;
                  }
              
                  console.log(" Eliminando Proyecto con ID:", sProjectId);
              
                  try {
                      // Obtener CSRF Token
                      let oTokenResponse = await fetch("/odata/v4/datos-cdo/", {
                          method: "GET",
                          headers: { "x-csrf-token": "Fetch" }
                      });
              
                      if (!oTokenResponse.ok) throw new Error("Error al obtener el CSRF Token");
              
                      let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
                      if (!sCsrfToken) throw new Error("No se recibió un CSRF Token");
              
                      console.log(" CSRF Token obtenido:", sCsrfToken);
              
                      sap.m.MessageBox.confirm(
                          "¿Deseas eliminar este proyecto y todos sus registros relacionados?",
                          {
                              actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                              onClose: async (oAction) => {
                                  if (oAction !== sap.m.MessageBox.Action.YES) return;
              
                                  try {
                                      // ❗ Cancelar workflow si existe
                                     console.log("Cancelando el workflow con ID:", workflowInstanceId);
                                      if (workflowInstanceId) {
                                          const oModel = this.getOwnerComponent().getModel();
                                          const oContext = oModel.bindContext("/cancelWorkflow(...)");
                                  
                                          oContext.setParameter("workflowInstanceId", workflowInstanceId);
                                          await oContext.execute();
                                      }
              
                                      const paths = [
                                          "planificacion", "Facturacion", "ClientFactura", "ProveedoresC", "RecursosInternos","Archivos",
                                          "ConsumoExternos", "RecursosExternos", "otrosConceptos", "otrosGastoRecu", 
                                          "otrosRecursos", "otrosServiciosConsu", "GastoViajeConsumo", "serviRecurExter",
                                          "GastoViajeRecExter", "LicenciasCon", "WorkflowInstancias", "ResumenCostesTotal",
                                          "RecurInterTotal", "ConsuExterTotal", "RecuExterTotal", "InfraestrLicencia", "PerfilTotal"
                                      ];
              
                                      // Eliminar registros relacionados
                                      let deletePromises = paths.map(async (path) => {
                                          let res = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})/${path}`, {
                                              method: "GET",
                                              headers: {
                                                  "Content-Type": "application/json",
                                                  "x-csrf-token": sCsrfToken
                                              },
                                          });
              
                                          if (!res.ok) {
                                              console.warn(`  No se pudieron obtener los registros de ${path}`);
                                              return;
                                          }
              
                                          let contentType = res.headers.get("Content-Type");
                                          let data = contentType && contentType.includes("application/json") ? await res.json() : { value: [] };
                                          let records = Array.isArray(data.value) ? data.value : [data];
              
                                          if (records.length > 0) {
                                              return Promise.all(
                                                  records.map(async (hijo) => {
                                                      let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})`, {
                                                          method: "DELETE",
                                                          headers: {
                                                              "Content-Type": "application/json",
                                                              "x-csrf-token": sCsrfToken
                                                          }
                                                      });
              
                                                      if (!deleteResponse.ok) {
                                                          console.error(` Error eliminando ${path} con ID ${hijo.ID}`);
                                                      } else {
                                                          console.log(` ${path} eliminado: ${hijo.ID}`);
                                                      }
                                                  })
                                              );
                                          }
                                      });
              
                                      await Promise.all(deletePromises);
                                      console.log(" Registros relacionados eliminados.");
              
                                      // Eliminar proyecto principal
                                      let projectResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                          method: "DELETE",
                                          headers: {
                                              "Content-Type": "application/json",
                                              "x-csrf-token": sCsrfToken
                                          },
                                      });
              
                                      if (projectResponse.ok) {
                                          console.log(" Proyecto eliminado correctamente.");
                                          sap.m.MessageBox.success("Proyecto y registros eliminados exitosamente.", {
                                              title: "Éxito",
                                              actions: [sap.m.MessageBox.Action.OK],
                                              onClose: async function () {
                                                  let oTable = this.byId("idPendientes");
                                                  if (oTable) {
                                                      let oBinding = oTable.getBinding("items");
                                                      if (oBinding) {
                                                          oBinding.refresh(true);
                                                      } else {
                                                          console.warn("  No se encontró el binding de la tabla.");
                                                      }
                                                  } else {
                                                      console.warn("  Tabla no encontrada con ID idPendientes.");
                                                  }
                                                  await this.filterEstado();
                                              }.bind(this)
                                          });
                                      } else {
                                          throw new Error("Error al eliminar el proyecto principal");
                                      }
                                  } catch (error) {
                                      console.error(" Error eliminando el proyecto o registros:", error);
                                      sap.m.MessageToast.show("Error al eliminar el proyecto o registros.");
                                  }
                              }
                          }
                      );
                  } catch (error) {
                      console.error(" Error al obtener el CSRF Token:", error);
                      sap.m.MessageToast.show("Error al obtener el CSRF Token.");
                  }
              },*/


            /*  onDeletePress: async function (oEvent) {
                  //   let oModel = this.getView().getModel("modelPendientes");
  
                  let oButton = oEvent.getSource();
                  let sProjectId = oButton.getCustomData()[0].getValue();
  
                  if (!sProjectId) {
                      console.error("No se encontró un ID válido para eliminar.");
                      sap.m.MessageToast.show("Error: No se encontró un ID válido.");
                      return;
                  }
  
                  console.log(" Eliminando Proyecto con ID:", sProjectId);
  
                  try {
                      // 1️⃣ Obtener el CSRF Token
                      let oTokenResponse = await fetch("/odata/v4/datos-cdo/", {
                          method: "GET",
                          headers: { "x-csrf-token": "Fetch" }
                      });
  
  
                      if (!oTokenResponse.ok) throw new Error("Error al obtener el CSRF Token");
  
                      let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
                      if (!sCsrfToken) throw new Error("No se recibió un CSRF Token");
  
                      console.log(" CSRF Token obtenido:", sCsrfToken);
  
                      sap.m.MessageBox.confirm(
                          "¿Deseas eliminar este proyecto y todos sus registros relacionados?",
                          {
                              actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                              onClose: async (oAction) => {
                                  if (oAction !== sap.m.MessageBox.Action.YES) return;
  
                                  try {
                                      const paths = [
                                          "planificacion",
                                          "Facturacion",
                                          "ClientFactura",
                                          "ProveedoresC",
                                          "RecursosInternos",
                                          "ConsumoExternos",
                                          "RecursosExternos",
                                          "otrosConceptos",
                                          "otrosGastoRecu",
                                          "otrosRecursos",
                                          "otrosServiciosConsu",
                                          "GastoViajeConsumo",
                                          "serviRecurExter",
                                          "GastoViajeRecExter",
                                          "LicenciasCon",
                                          "WorkflowInstancias",
                                          "ResumenCostesTotal",
                                          "RecurInterTotal",
                                          "ConsuExterTotal",
                                          "RecuExterTotal",
                                          "InfraestrLicencia",
                                          "PerfilTotal"
  
                                      ];
  
                                      // 2️ Obtener y eliminar registros relacionados
                                      let deletePromises = paths.map(async (path) => {
                                          let res = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})/${path}`, {
                                              method: "GET",
                                              headers: {
                                                  "Content-Type": "application/json",
                                                  "x-csrf-token": sCsrfToken
                                              },
                                          });
  
                                          if (!res.ok) {
                                              console.warn(`  No se pudieron obtener los registros de ${path}`);
                                              return;
                                          }
  
                                          let contentType = res.headers.get("Content-Type");
                                          let data = contentType && contentType.includes("application/json") ? await res.json() : { value: [] };
                                          let records = Array.isArray(data.value) ? data.value : [data];
  
                                          if (records.length > 0) {
                                              return Promise.all(
                                                  records.map(async (hijo) => {
                                                      let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})`, {
                                                          method: "DELETE",
                                                          headers: {
                                                              "Content-Type": "application/json",
                                                              "x-csrf-token": sCsrfToken
                                                          }
                                                      });
  
                                                      if (!deleteResponse.ok) {
                                                          console.error(` Error eliminando ${path} con ID ${hijo.ID}`);
                                                      } else {
                                                          console.log(` ${path} eliminado: ${hijo.ID}`);
                                                      }
                                                  })
                                              );
                                          }
                                      });
  
                                      await Promise.all(deletePromises);
                                      console.log(" Registros relacionados eliminados.");
  
                                      //   Eliminar el proyecto principal
                                      let projectResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                          method: "DELETE",
                                          headers: {
                                              "Content-Type": "application/json",
                                              "x-csrf-token": sCsrfToken
                                          },
                                      });
  
                                      if (projectResponse.ok) {
                                          console.log(" Proyecto eliminado correctamente.");
                                          sap.m.MessageBox.success("Proyecto y registros eliminados exitosamente.", {
                                              title: "Éxito",
                                              actions: [sap.m.MessageBox.Action.OK],
                                              onClose: async function () {
                                                  let oTable = this.byId("idPendientes");
                                                  if (oTable) {
                                                      let oBinding = oTable.getBinding("items");
                                                      if (oBinding) {
                                                          oBinding.refresh(true);  // Forzar actualización desde el backend
                                                      } else {
                                                          console.warn(" No se encontró el binding de la tabla.");
                                                      }
                                                  } else {
                                                      console.warn(" Tabla no encontrada con ID idPendientes.");
                                                  }
                                                  await this.filterEstado();
                                              }.bind(this)
                                              // Asegura que "this" siga apuntando al controlador
                                          });
  
  
                                      } else {
                                          throw new Error("Error al eliminar el proyecto principal");
                                      }
                                  } catch (error) {
                                      console.error(" Error eliminando el proyecto o registros:", error);
                                      sap.m.MessageToast.show("Error al eliminar el proyecto o registros.");
                                  }
                              }
                          }
                      );
                  } catch (error) {
                      console.error(" Error al obtener el CSRF Token:", error);
                      sap.m.MessageToast.show("Error al obtener el CSRF Token.");
                  }
              },*/






            onNavToView1: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var oComponent = this.getOwnerComponent();

                // Limpieza en paralelo (no bloquea la navegación)
                Promise.resolve().then(() => {
                    var oTargetView = oComponent.byId("view");
                    if (oTargetView && oTargetView.getController && typeof oTargetView.getController === "function") {
                        var oController = oTargetView.getController();
                        if (oController._clearAllInputs) {
                            oController._clearAllInputs();
                        }
                    }
                });

                // Navegar inmediatamente
                oRouter.navTo("viewNoParam", {
                    mode: "create"
                });
            },




        });


    },




);
