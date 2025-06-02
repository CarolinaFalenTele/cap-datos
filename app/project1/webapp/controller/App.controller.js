

sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/CustomData",
        "sap/ui/core/format/DateFormat",
        "sap/m/MessageBox",     // Importar MessageBox


    ],
    function (BaseController, CustomData, MessageBox, DateFormat) {
        "use strict";

        return BaseController.extend("project1.controller.App", {
            onInit: function () {





                //   var oProcessFlow = this.byId("processflow1");
                //oProcessFlow.attachNodePress(this.onNodePress, this);

                this._loadProjectData();
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("app").attachPatternMatched(this._onObjectMatched, this);

                this.bProcessFlowAllowed = false;  // Bandera para controlar el acceso al ProcessFlow
                this.loadFilteredData();
                this.loadFilteredDataPend();


                //     console.log("Vista de appp " + this.getView());

                // this.DialogInfo();
                this.getUserInfo();
                this.filterEstado();


            },



            pressFichas: function(){

                    



            },



            filterEstado: async function () {
                try {
                    // Cargar proyectos con relaciones expand
                    const response = await fetch("/odata/v4/datos-cdo/DatosProyect?$expand=Area,jefeProyectID");
                    const data = await response.json();
                    const aProjects = data.value;
            
                    const aProyectosConEstado = await Promise.all(
                        aProjects.map(async (proyecto) => {
                            const projectId = proyecto.ID;
            
                            // Formateo de fechas
                            const formatearFecha = (fechaStr) => {
                                if (!fechaStr) return null;
                                const fecha = new Date(fechaStr);
                                return `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            };
            
                            proyecto.FechaCreacionFormateada = formatearFecha(proyecto.fechaCreacion);
                            proyecto.FechaModificacionFormateada = formatearFecha(proyecto.FechaModificacion);
            
                            // Obtener los nombres relacionados
                            proyecto.NombreArea = proyecto.Area?.NombreArea || "Sin área";
                            proyecto.NombreJefe = proyecto.jefeProyectID?.name || "Sin jefe";
            
                            // Si ya tiene estado "Borrador", no buscamos en WorkflowInstancias
                            if (proyecto.Estado === "Borrador") {
                                proyecto.workflowId = null;
                                proyecto.actualizadoEn = null;
                                proyecto.actualizadoEnFormateada = "No aplica";
                                return proyecto;
                            }
            
                            // Buscar última instancia de workflow solo si no es Borrador
                            const wfResponse = await fetch(`/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq '${projectId}'&$orderby=creadoEn desc&$top=1&$select=estado,workflowId,actualizadoEn`);
                            const wfData = await wfResponse.json();
                            const wfItem = wfData.value[0];
            
                            // Estado del proyecto
                            proyecto.Estado = wfItem?.estado || "Pendiente";
                            proyecto.workflowId = wfItem?.workflowId || null;
                            proyecto.actualizadoEn = wfItem?.actualizadoEn || null;
                            proyecto.actualizadoEnFormateada = formatearFecha(proyecto.actualizadoEn) || "Fecha no disponible";
            
                            return proyecto;
                        })
                    );
            
                    // Separar por estado
                    const aProyectosAprobados = aProyectosConEstado.filter(p => p.Estado === "Aprobado");
                    const aProyectosPendientes = aProyectosConEstado.filter(p => p.Estado === "Pendiente");
                    const aProyectosBorrador = aProyectosConEstado.filter(p => p.Estado === "Borrador");
            
                    // Control de estado visual
                    const oStatusControl = this.byId("status0");
                    if (aProyectosPendientes.length > 0) {
                        oStatusControl.setText("Pendiente");
                        oStatusControl.setState("Warning");
                    } else if (aProyectosBorrador.length > 0) {
                        oStatusControl.setText("Borrador");
                        oStatusControl.setState("None");
                    } else {
                        oStatusControl.setText("Aprobado");
                        oStatusControl.setState("Success");
                    }
            
                    // Modelos JSON
                    const oJsonModelAprobados = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAprobados,
                        Count: aProyectosAprobados.length
                    });
            
                    const oJsonModelPendientes = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosPendientes,
                        Count: aProyectosPendientes.length
                    });
            
                    const oJsonModelBorrador = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosBorrador,
                        Count: aProyectosBorrador.length
                    });
            
                    const oJsonModelTotal = new sap.ui.model.json.JSONModel({
                        Count: aProyectosConEstado.length
                    });
            
                    // Asignar modelos
                    this.getView().setModel(oJsonModelAprobados, "modelAprobados");
                    this.getView().setModel(oJsonModelPendientes, "modelPendientes");
                    this.getView().setModel(oJsonModelBorrador, "modelBorrador");
                    this.getView().setModel(oJsonModelTotal, "modelTotal");
            
                    // Verificar en consola
                //    console.log(aProyectosPendientes[0]?.NombreArea);
                //    console.log(aProyectosPendientes[0]?.NombreJefe);
            
                } catch (error) {
                    console.error("Error al cargar los proyectos con estado:", error);
                }
            },
            
            

         /*   filterEstado: async function () {
                try {
                    // Cargar proyectos con relaciones expand
                    const response = await fetch("/odata/v4/datos-cdo/DatosProyect?$expand=Area,jefeProyectID");
                    const data = await response.json();
                    const aProjects = data.value;
            
                    const aProyectosConEstado = await Promise.all(
                        aProjects.map(async (proyecto) => {
                            const projectId = proyecto.ID;
            
                            // Buscar última instancia de workflow
                            const wfResponse = await fetch(`/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq '${projectId}'&$orderby=creadoEn desc&$top=1&$select=estado,workflowId,actualizadoEn`);
                            const wfData = await wfResponse.json();
                            const wfItem = wfData.value[0];
            
                            // Estado del proyecto
                            proyecto.Estado = wfItem?.estado || "Pendiente";
                            proyecto.workflowId = wfItem?.workflowId || null;
                            proyecto.actualizadoEn = wfItem?.actualizadoEn || null;
            
                            // Formateo de fechas
                            const formatearFecha = (fechaStr) => {
                                if (!fechaStr) return null;
                                const fecha = new Date(fechaStr);
                                return `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            };
            
                            proyecto.FechaCreacionFormateada = formatearFecha(proyecto.fechaCreacion);
                            proyecto.FechaModificacionFormateada = formatearFecha(proyecto.FechaModificacion);
                            proyecto.actualizadoEnFormateada = formatearFecha(proyecto.actualizadoEn) || "Fecha no disponible";
            
                            // Obtener los nombres relacionados
                            proyecto.NombreArea = proyecto.Area?.NombreArea || "Sin área";
                            proyecto.NombreJefe = proyecto.jefeProyectID?.name || "Sin jefe";
            
                            return proyecto;
                        })
                    );
            
                    // Separar por estado
                    const aProyectosAprobados = aProyectosConEstado.filter(p => p.Estado === "Aprobado");
                    const aProyectosPendientes = aProyectosConEstado.filter(p => p.Estado !== "Aprobado");
                 
                 
                    const oStatusControl = this.byId("status0");
   
                    if (aProyectosPendientes.length > 0) {
                        oStatusControl.setText("Pendiente");
                        oStatusControl.setState("Warning"); // Amarillo (pendiente)
                    } else {
                        oStatusControl.setText("Aprobado");
                        oStatusControl.setState("Success"); // Verde (aprobado)
                    }
                    
                    // Modelos JSON
                    const oJsonModelAprobados = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAprobados,
                        Count: aProyectosAprobados.length
                    });
            
                    const oJsonModelPendientes = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosPendientes,
                        Count: aProyectosPendientes.length
                    });
            
                    const oJsonModelTotal = new sap.ui.model.json.JSONModel({
                        Count: aProyectosConEstado.length
                    });
            
                    // Asignar modelos
                    this.getView().setModel(oJsonModelAprobados, "modelAprobados");
                    this.getView().setModel(oJsonModelPendientes, "modelPendientes");
                    this.getView().setModel(oJsonModelTotal, "modelTotal");
            
                    // Verificar los nombres en consola
                    console.log(aProyectosPendientes[0]?.NombreArea);
                    console.log(aProyectosPendientes[0]?.NombreJefe);
            
                } catch (error) {
                    console.error("Error al cargar los proyectos con estado:", error);
                }
            },*/
            
    
            






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
                    console.log(` Historial del workflow (${modelo}):`, result);



                    await this.onActivityPress(oEvent, result);
                 //   sap.m.MessageBox.information(JSON.stringify(result, null, 2));
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
                this.createProcessFlowNodes(eventos, oProcessFlow , sNameProyect);

                //  Solo una vez, fuera del bucle
                oProcessFlow.attachNodePress(this.onNodePress.bind(this));

                this.byId("idTitleProceso").setText("Proceso de solicitud: " + sNameProyect);
                this.byId("text1881").setText("PEP de solicitud: " + sID);
                this.byId("itb1").setSelectedKey("people");
            },

            createProcessFlowNodes: function (eventos, oProcessFlow, sNameProyect) {
                const laneMap = {
                    "CDO": "0",
                    "APROBACIÓN": "1",
                    "NOTIFICACIÓN": "1",
                    "CONFIRMAR ENTRADAS": "2",
                    "BASIS": "2",
                    "LEER ENTRADAS": "3",
                    "REVISION PMO": "3",
                    "APROBADO PMO": "4",
                    "APROBADO": "4",
                    "CONTROL": "5",
                    "GESTION": "6",
                    "REVISION DIRECCION": "8",
                    "DIRECCION": "8",
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
                    "EMAIL": "Neutral",
                    "CREATED": "Neutral",
                    "TRIGGERED": "Neutral",
                    "REACHED": "Neutral"
                };
            
                const pasosExcluidos = [
                    "Condición de Espera",
                    "Esperar a terminar el flujo",
                    "Espera respuesta",
                    "Leer entradas",
                    "Confirmar entradas" ,
                    "Esperar antes de avanzar",
                    "Iniciar Variable",
                    "Condición 3",
                    "Espera 1",
                    "Tarea de script 12",
                    "Condición 5",
                    "Wait 1 minute 10",
                    "Condición",
                    "Esperar Rechazo",
                    "Tarea de script",
                    "Wait 1 minute 11",
                    "Condición",
                    "Condición 2",
                    "Condición 8",

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
            
                const listaEventos = Array.from(eventoMap.values()).sort((a, b) =>
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
            

                if (listaEventos.length === 0) {
                    console.warn("No hay eventos válidos para mostrar en el flujo.");
                    return;
                }
            
                // Crear nodos (sin nodo inicial)
                listaEventos.forEach((evento, index) => {
                    if (!evento.id) evento.id = "evento_" + index;
                
                    if (index === 0 && (evento.paso || "").toUpperCase().includes("INICIALIZAR VARIABLE")) {
                        evento.paso = "Solicitud enviada correctamente " + sNameProyect;
                    }
                    




                    let pasoRaw = (evento.paso || "Paso desconocido").trim();

                    if (
                        index === listaEventos.length - 1 &&
                        pasoRaw === "Paso desconocido" &&
                        (evento.descripcion || "").toUpperCase().includes("FINALIZACIÓN DEL WORKFLOW")
                    ) {
                        pasoRaw = "Fin del proceso de aprobación";
                    }
                    


                    const paso = pasoRaw.toUpperCase();


          
                    const descripcion = evento.descripcion || "";
                
                    let laneId = "0";
                    for (let key in laneMap) {
                        if (paso.includes(key)) {
                            laneId = laneMap[key];
                            break;
                        }
                    }
                
                    let state = "Neutral";
                    for (let key in stateMap) {
                        if ((evento.tipo || "").toUpperCase().includes(key)) {
                            state = stateMap[key];
                            break;
                        }
                    }

                    if ((evento.tipo || "").toUpperCase() === "INTERMEDIATE_TIMER_EVENT_TRIGGERED") {
                        state = "Critical"; // o 'Planned' si usas SAP Fiori 3 / Horizon
                    }
                    
                    
                    if ((evento.tipo || "").toUpperCase() === "EXCLUSIVE_GATEWAY_REACHED") {
                        state = "Critical"; // o 'Planned' si usas SAP Fiori 3 / Horizon
                    }
                    const siguiente = listaEventos[index + 1];
                    const children = siguiente ? [siguiente.id] : [];
                
                    const node = new sap.suite.ui.commons.ProcessFlowNode({
                        nodeId: evento.id,
                        laneId: laneId,
                        title: pasoRaw,
                        titleAbbreviation: pasoRaw.substring(0, 3),
                        state: state,
                        stateText: descripcion,
                        children: children,
                        isTitleClickable: true,
                        focused: false,
                        highlighted: false,
                        texts: [pasoRaw, descripcion]
                    });
                
                    node.addCustomData(new sap.ui.core.CustomData({
                        key: "eventoOriginal",
                        value: JSON.stringify(evento)
                    }));
                
                    node.data("eventoOriginal", evento);
                    oProcessFlow.addNode(node);
                });
                
            },
            
            onNodePress: function (oEvent) {
                const node = oEvent.getParameters();
            
                if (!node) {
                    console.warn("Nodo no encontrado (evento vacío)");
                    return;
                }
            
                const evento = node.data("eventoOriginal");
                if (!evento) {
                    console.warn("El nodo no tiene data 'eventoOriginal'");
                    return;
                }
            
                if (!this._oPopover) {
                    this._oPopover = new sap.m.Popover({
                        title: "Detalles del Paso",
                        placement: sap.m.PlacementType.Auto,
                        contentWidth: "300px",
                        content: [
                            new sap.m.VBox({
                                items: [
                                    new sap.m.HBox({
                                        alignItems: "Center",
                                        items: [
                                            new sap.ui.core.Icon({
                                                src: "sap-icon://hint",
                                                color: "#0070f2",
                                            }),
                                            new sap.m.Label({
                                                text: " Información del Paso ",
                                                design: "Bold",
                                                class: "sapUiSmallMarginBegin"
                                            })
                                        ],
                                        class: "sapUiSmallMarginBottom"
                                    }),
                                    new sap.m.ObjectStatus({
                                        title: "Paso ",
                                        text: "{/eventoPaso}",
                                        state: "Success",
                                        id: "statusPaso"
                                    }),
                                    new sap.m.ObjectStatus({
                                        title: "Descripción ",
                                        text: "{/eventoDescripcion}",
                                        state: "Information",
                                        id: "statusDescripcion"
                                    }),
                                    new sap.m.ObjectStatus({
                                        title: "Fecha ",
                                        text: "{/eventoFecha}",
                                        state: "Warning",
                                        id: "statusFecha"
                                    }),
                                    new sap.m.Button({
                                        text: "Cerrar",
                                        type: "Emphasized",
                                        icon: "sap-icon://decline",
                                        press: function () {
                                            this._oPopover.close();
                                        }.bind(this),
                                        class: "sapUiSmallMarginTop"
                                    })
                                ],
                                class: "sapUiContentPadding"
                            })
                        ]
                    });
                }
            
                // Actualizar datos en los ObjectStatus
                sap.ui.getCore().byId("statusPaso").setText(evento.paso);
                sap.ui.getCore().byId("statusDescripcion").setText(evento.descripcion);
                sap.ui.getCore().byId("statusFecha").setText(evento.timestamp);
            
                this._oPopover.openBy(node);
            },
            
            
            
            
            


            /*          onVerHistorial: async function (oEvent) {
                          try {
                              const oItem = oEvent.getSource().getBindingContext("modelPendientes").getObject();
                              const workflowId = oItem.workflowId;
                      
                              if (!workflowId) {
                                  sap.m.MessageToast.show("Este proyecto no tiene un workflow asociado.");
                                  return;
                              }
                      
                              const oModel = this.getOwnerComponent().getModel();
                              const oContext = oModel.bindContext("/getWorkflowTimeline(...)");
                      
                              oContext.setParameter("ID", workflowId);
                      
                              await oContext.execute();
                      
                              const result = oContext.getBoundContext().getObject();
                              console.log(" Historial del workflow:", result);
                      
                              sap.m.MessageBox.information(JSON.stringify(result, null, 2));
                          } catch (error) {
                              console.error(" Error al obtener el historial del workflow:", error);
                              sap.m.MessageBox.error("No se pudo obtener el historial del workflow.");
                          }
                      },*/














            // Método para obtener información del usuario
            getUserInfo: function () {
                fetch('/odata/v4/datos-cdo/getUserInfo')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("No se pudo obtener la información del usuario.");
                        }
                        return response.json();
                    })
                    .then(data => {
                        const userInfo = data.value;
                        const token = data.token || (userInfo && userInfo.token);

                        if (userInfo) {
                            // Asignar datos a los controles en la vista
                            //this.byId("dddtg")?.setText(userInfo.name);
                            this.byId("dddtg")?.setText(userInfo.email);


                            this.byId("233")?.setText(userInfo.fullName);
                            //this.byId("apellidoUsuario")?.setText(userInfo.familyName);
                            //this.byId("telefonoUsuario")?.setText(userInfo.phoneNumber);


                            if (token) {
                                this._startSessionWatcher(token);
                             ///   console.log("Token recibido y watcher iniciado.");
                              } else {
                                console.warn("Token no recibido en la respuesta.");
                              }


                            // console.log(" Datos seteados en la vista:", userInfo);
                        } else {
                            console.error("No se encontró la información del usuario.");
                        }
                    })
                    .catch(error => {
                        console.error(" Error obteniendo datos del usuario:", error);
                    });
            },


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
                    MessageBox.error("⛔ Tu sesión ha expirado. (En pruebas: no se cerrará la sesión)");
                    return;
                  }
              
                  // Actualiza el texto del diálogo dinámicamente
                  if (dialog && dialog.getContent && dialog.getContent()[0]) {
                    dialog.getContent()[0].setText(`Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?`);
                  }
              
                  secondsLeft--;
                }, 1000);
              
                const dialog = new sap.m.Dialog({
                  title: "⚠️ Sesión a punto de expirar",
                  content: [new sap.m.Text({ text: `Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?` })],
                  beginButton: new sap.m.Button({
                    text: "Sí, mantener sesión",
                    press: () => {
                      clearInterval(interval);
                      dialog.close();
                      this._refreshToken(); // 🔁 Simula renovación de sesión
                    }
                  }),
                  endButton: new sap.m.Button({
                    text: "No",
                    press: () => {
                      clearInterval(interval);
                      dialog.close();
                      // 🔕 No hay logout en pruebas
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
                var oTable = this.byId("idProductsTable");
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
                    console.log("Datos filtrados (Pendientes):", aFilteredData);
                    this.updateIconTabFilterCountPen(oBinding);
                } else {
                    oTable.attachEventOnce("updateFinished", function () {
                        var oBinding = oTable.getBinding("items");
                        var oFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Pendiente");
                        oBinding.filter([oFilter]);
                        var aFilteredContexts = oBinding.getContexts();
                        var aFilteredData = aFilteredContexts.map(ctx => ctx.getObject());
                        console.log("Datos filtrados (Pendientes):", aFilteredData);

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
            },



            onSearchApro: function (oEvent) {
                // Obtener el valor ingresado en el SearchField
                var sQuery = oEvent.getParameter("newValue");
                var oTable = this.byId("idProductsTable"); // Obtener la tabla
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

            /*    onActivityPress: function (oEvent, result) {
                    console.log("RESULT DEL WORKFLOW " + JSON.stringify(result));
    
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
    
                    const lanes = {
                        "INTERMEDIATE_TIMER_EVENT_TRIGGERED": "1",
                        "WORKFLOW_COMPLETED": "2"
                    };
    
                    eventos.forEach((evento, index) => {
                        if (!evento.id) {
                            evento.id = "evento_" + index;
                        }
    
                        const node = new sap.suite.ui.commons.ProcessFlowNode({
                            nodeId: evento.id,
                            title: evento.paso,
                            laneId: lanes[evento.tipo] || "0",
                            state: "Neutral",
                            stateText: evento.paso,
                            children: index < eventos.length - 1 ? [eventos[index + 1].id || ("evento_" + (index + 1))] : [],
                            isTitleClickable: true
                        });
                        node.addCustomData(new sap.ui.core.CustomData({
                            key: "eventoId", // Clave personalizada para identificar el evento
                            value: evento.id // Valor que es el ID del evento
                        }));
    
                        node.data("eventoOriginal", evento); // Guarda los datos originales
    
                        console.log("EVENTO " + JSON.stringify(evento));
                        oProcessFlow.addNode(node); // Añade el nodo al ProcessFlow
                    });
    
                    // ✅ Solo una vez, fuera del bucle
                    oProcessFlow.attachNodePress(this.onNodePress.bind(this));
    
                    this.byId("idTitleProceso").setText("Proceso de solicitud: " + sNameProyect);
                    this.byId("text1881").setText("PEP de solicitud: " + sID);
                    this.byId("itb1").setSelectedKey("people");
                },*/


            /*   onActivityPress: function (oEvent, result) {
                   console.log("RESULT DEL WORKFLOW " + JSON.stringify(result));  
                   console.log("Método onActivityPress ejecutado");
               
                   var oButton = oEvent.getSource();
                   var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto
                   var sID = oButton.getCustomData()[1].getValue();          // ID del proyecto
               
                   const eventos = result.value;  // Accedemos a todos los eventos del workflow
               
                   var oProcessFlow = this.byId("processflow1"); // Asegúrate de definirlo aquí
                   if (!oProcessFlow) {
                       console.error("No se pudo encontrar el ProcessFlow con el id 'processflow1'");
                       return;
                   }
               
                   oProcessFlow.removeAllNodes(); // Limpiar nodos existentes
               
                   this.bProcessFlowAllowed = true;
               
                   eventos.forEach((evento, index) => {
                       console.log(`Evento ${index + 1}:`);
                       console.log("ID: ", evento.id);  // Asegúrate de que el ID es válido
                       console.log("Tipo: ", evento.tipo);
                       console.log("Descripción: ", evento.descripcion);
                       console.log("Timestamp: ", evento.timestamp);
                       console.log("Instancia: ", evento.instancia);
                       console.log("Paso: ", evento.paso);
                       console.log("Usuario: ", evento.usuario);
                       console.log("---------------------------");
               
                       if (!evento.id) {
                           console.error(`Evento ${index + 1} no tiene un ID válido, asignando uno alternativo.`);
                           evento.id = "evento_" + index;  // Asigna un ID alternativo si no hay uno
                       }
               
                       // Verifica que el id se asigna correctamente en el nodo
                       console.log("Creando nodo con ID:", evento.id);
               
                       var lanes = {
                           "INTERMEDIATE_TIMER_EVENT_TRIGGERED": "1",
                           "WORKFLOW_COMPLETED": "2",
                           // Añade más tipos de eventos y sus lanes si es necesario
                       };
               
                       var node = new sap.suite.ui.commons.ProcessFlowNode({
                           nodeId: evento.id,
                           title: evento.paso,
                           laneId: lanes[evento.tipo] || "0",
                           state: "Neutral",
                           stateText: evento.paso,
                           children: index < eventos.length - 1 ? [eventos[index + 1].id || ("evento_" + (index + 1))] : [],
                           isTitleClickable: true // Muy importante
                       });
                       
                       // 🔁 Asegura que el nodo reaccione al click
                       node.attachPress(this.onNodePress, this); // Bind al controlador actual
                       
                       oProcessFlow.addNode(node);
                       
                   });
               
                   var oTitle = this.byId("idTitleProceso");
                   oTitle.setText("Proceso de solicitud: " + sNameProyect);
               
                   var oText = this.byId("text1881");
                   oText.setText("PEP de solicitud: " + sID);
               
                   // Cambiar la pestaña seleccionada al IconTabFilter con id 'people'
                   var oIconTabBar = this.byId("itb1");
                   oIconTabBar.setSelectedKey("people");
               
                   // Añadir evento de presión en los nodos
                //   node.attachPress(this.onNodePress, this); // ✅ correcta
   
            
               },

            onNodePress: function (oEvent) {
                // Obtener el nodo presionado
                var oNode = oEvent.getSource();

                // Recuperar los datos personalizados (CustomData)
                var aCustomData = oNode.getCustomData();

                // Depurar los datos personalizados
                console.log("Datos personalizados del nodo: ", aCustomData);

                if (aCustomData && aCustomData.length > 0) {
                    // Buscar el CustomData con el key "eventoId"
                    var oEventoIdData = aCustomData.find(function (data) {
                        return data.getKey() === "eventoId";
                    });

                    if (oEventoIdData) {
                        // Recuperar el valor de "eventoId"
                        var sEventoId = oEventoIdData.getValue();
                        console.log("ID del evento presionado:", sEventoId);

                        // Buscar el evento en el array `result.value` usando el ID
                        const evento = result.value.find(function (evento) {
                            return evento.id === sEventoId;
                        });

                        if (evento) {
                            // Si se encontró el evento, puedes hacer algo con los datos
                            console.log("Detalles del evento:", evento);
                        } else {
                            console.error("No se encontró el evento con ID:", sEventoId);
                        }
                    } else {
                        console.error("No se encontró CustomData con key 'eventoId'.");
                    }
                } else {
                    console.error("El nodo no tiene datos personalizados.");
                }
            },
*/






















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
                const newId = oEvent.getParameter("arguments").newId;

                console.log("ids comtenriofg")
                // Verifica si el ID es válido
                if (!newId) {
                    console.error("No se recibió un ID válido");
                    return;
                }

                //actualizar tabla 
                await this.filterEstado();


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
              
                var oContext = oContextPendientes || oContextAprobados || oContextBorradores;
              
                if (!oContext) {
                  console.error("No se pudo obtener el contexto del ítem.");
                  return;
                }
              
                var sProjectID = oContext.getProperty("ID");
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
              
                var sourceModelName = oContextPendientes
                  ? "modelPendientes"
                  : (oContextAprobados ? "modelAprobados" : "modelBorrador");
              
                // 👇 Aquí se decide el modo dinámicamente
                var mode = (sourceModelName === "modelAprobados") ? "display" : "edit";
              
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
                      oRouter.navTo("viewWithMode", {
                        sourceModel: sourceModelName,
                        mode: mode,
                        sProjectID: sProjectID,
                 
                      }, true);
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

                console.log("Metodo project " + sProjectID);

                const Token = this._sCsrfToken;
                var oModel = this.getView().getModel("mainService");
                if (oModel) {
                    oModel.setData({});  // Limpia los datos al cargar la vista
                    oModel.refresh(true);
                }



                // Construye la URL con el ID correctamente escapado
                var sUrl = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})`;

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

                    console.log(JSON.stringify(oData));


                    this.byId("idNombreProyecto").setText(oData.nameProyect);
                    this.byId("idDescripcion1").setText(oData.descripcion);
                    this.byId("idCreador").setText(oData.Empleado);
                    this.byId("idEMail").setText(oData.Email);
                    this.byId("idModifi").setText(oData.FechaModificacion);
                    this.byId("fechainitProyect").setText(oData.Fechainicio);

                    const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        style: "medium" // Puedes usar "short", "medium", "long", o "full"
                    });

                    const date = new Date(oData.fechaCreacion);
                    const formattedDate = oDateFormat.format(date);

                    this.byId("idCreacion").setText(formattedDate);


                    var fecha = oData.FechaFin.split("T")[0]; // obtenemos solo la fecha 2025-03-27
                    var partes = fecha.split("-"); // separamos ["2025","03","27"]
                    var fechaFormateada = partes[2] + "-" + partes[1] + "-" + partes[0]; // armamos 27/03/2025
                    this.byId("idFechaFinProyect").setText(fechaFormateada);

                    //      this.byId("idFechaFinProyect").setText(oData.FechaFin);
                    this.byId("idEstadoProyect").setText(oData.Estado);
                    this.byId("idArea").setText(oData.Area_ID.NombreArea);
                    var formattedTotal = new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(oData.Total);

                    // Agregar el símbolo de euro al final
                    var formattedTotalWithEuro = formattedTotal + ' €';
                    this.byId("idtotal").setText(formattedTotalWithEuro);

                } catch (error) {
                    console.error("Error al obtener los datos del proyecto:", error);
                    sap.m.MessageToast.show("Error al cargar los datos del proyecto");
                }
            },


            onEmailPress2: function (oEvent) {
                const sEmail = oEvent.getSource().getText();
                window.location.href = "mailto:" + sEmail;
            },



            onDeletePress: async function (oEvent) {
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
                                            console.warn(`⚠️ No se pudieron obtener los registros de ${path}`);
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

                                    // 3️⃣ Eliminar el proyecto principal
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
                                                        console.warn("⚠️ No se encontró el binding de la tabla.");
                                                    }
                                                } else {
                                                    console.warn("⚠️ Tabla no encontrada con ID idPendientes.");
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
            },






               onNavToView1: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var oComponent = this.getOwnerComponent();
              
                var oTargetView = oComponent.byId("view"); // ID de la view destino
              
                if (oTargetView && oTargetView.getController && typeof oTargetView.getController === "function") {
                  var oController = oTargetView.getController();
              
                  if (oController._clearAllInputs) {
                    oController._clearAllInputs(); // Limpieza manual
                  }
                }
              
         

                oRouter.navTo("viewNoParam", {
                    mode: "create",
                  });

              },
              


        });


    },




);
