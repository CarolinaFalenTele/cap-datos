

sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/CustomData",
        "sap/ui/core/format/DateFormat",
        "sap/m/MessageBox",     // Importar MessageBox


    ],
    function (BaseController, CustomData,MessageBox, DateFormat) {
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





            filterEstado: async function () {
                try {
                    const response = await fetch("/odata/v4/datos-cdo/DatosProyect");
                    const data = await response.json();
                    const aProjects = data.value;
            
                    const aProyectosConEstado = await Promise.all(
                        aProjects.map(async (proyecto) => {
                            const projectId = proyecto.ID;
            
                            // Buscar última instancia de workflow relacionada
                            const wfResponse = await fetch(`/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq '${projectId}'&$orderby=creadoEn desc&$top=1&$select=estado,workflowId,actualizadoEn`);
                            const wfData = await wfResponse.json();
                            const wfItem = wfData.value[0];
            
                            // Si no hay workflow, lo marcamos como "Pendiente"
                            proyecto.Estado = wfItem?.estado || "Pendiente";
                            proyecto.workflowId = wfItem?.workflowId || null;
                            proyecto.actualizadoEn = wfItem?.actualizadoEn || null;
            
                            // Formateo de fechas
                            if (proyecto.fechaCreacion) {
                                const fecha = new Date(proyecto.fechaCreacion);
                                proyecto.FechaCreacionFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            }
            
                            if (proyecto.FechaModificacion) {
                                const fecha = new Date(proyecto.FechaModificacion);
                                proyecto.FechaModificacionFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            }
            
                            if (proyecto.actualizadoEn) {
                                const fecha = new Date(proyecto.actualizadoEn);
                                proyecto.actualizadoEnFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
                            } else {
                                proyecto.actualizadoEnFormateada = "Fecha no disponible";
                            }
            
                            return proyecto;
                        })
                    );
            
                    // Clasificación por estado
                    const aProyectosAprobados = aProyectosConEstado.filter(p => p.Estado === "Aprobado");
                    const aProyectosPendientes = aProyectosConEstado.filter(p => p.Estado !== "Aprobado");
            
                    // Crear modelos
                    const oJsonModelAprobados = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAprobados,
                        Count: aProyectosAprobados.length
                    });
            
                    const oJsonModelPendientes = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosPendientes,
                        Count: aProyectosPendientes.length
                    });
            
                    this.getView().setModel(oJsonModelAprobados, "modelAprobados");
                    this.getView().setModel(oJsonModelPendientes, "modelPendientes");
            
                } catch (error) {
                    console.error("Error al cargar los proyectos con estado:", error);
                }
            },
            
            
          /*  filterEstado: async function () {
                try {
                    // 1. Obtener los proyectos desde OData
                    const response = await fetch("/odata/v4/datos-cdo/DatosProyect");
                    const data = await response.json();
                    const aProjects = data.value;

                    console.log("Proyectos desde fetch:", aProjects);

                    // 2. Enriquecer con el estado y formatear la fecha
                    const aProyectosConEstado = await Promise.all(
                        aProjects.map(async (proyecto) => {
                            const projectId = proyecto.ID;

                            // 2.1 Obtener estado desde WorkflowInstancias
                            const wfResponse = await fetch(`/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq '${projectId}'&$orderby=creadoEn desc&$top=1&$select=estado,workflowId,actualizadoEn`);
                            const wfData = await wfResponse.json();



                            proyecto.Estado = wfData.value[0]?.estado || "Sin estado";
                            proyecto.workflowId = wfData.value[0]?.workflowId || null;
                            proyecto.actualizadoEn = wfData.value[0]?.actualizadoEn || null; 


                            // 2.2 Formatear la fecha (ajusta el nombre del campo si es distinto)
                            if (proyecto.fechaCreacion) {
                                const fecha = new Date(proyecto.fechaCreacion);
                                const dia = String(fecha.getDate()).padStart(2, '0');
                                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                                const anio = fecha.getFullYear();
                                proyecto.FechaCreacionFormateada = `${dia}-${mes}-${anio}`;
                            }


                            if (proyecto.FechaModificacion) {
                                const fecha = new Date(proyecto.FechaModificacion);
                                const dia = String(fecha.getDate()).padStart(2, '0');
                                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                                const anio = fecha.getFullYear();
                                proyecto.FechaModificacionFormateada = `${dia}-${mes}-${anio}`;
                            }


                            if (proyecto.actualizadoEn) {
                                const fecha = new Date(proyecto.actualizadoEn);
                                const dia = String(fecha.getDate()).padStart(2, '0');
                                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                                const anio = fecha.getFullYear();
                                proyecto.actualizadoEnFormateada = `${dia}-${mes}-${anio}`;
                            } else {
                                proyecto.actualizadoEnFormateada = "Fecha no disponible"; // Puedes poner un valor predeterminado si no existe
                            }

                            return proyecto;
                        })
                    );

                    // 3. Filtrar los proyectos según su estado
                    const aProyectosAprobados = aProyectosConEstado.filter((proyecto) => proyecto.Estado === "Aprobado");
                    const aProyectosPendientes = aProyectosConEstado.filter((proyecto) => proyecto.Estado === "Pendiente");

                    console.log("Proyectos Aprobados:", aProyectosAprobados);
                    console.log("Proyectos Pendientes:", aProyectosPendientes);

                    // 4. Crear modelos JSON para cada tabla
                    const oJsonModelAprobados = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosAprobados,
                        Count: aProyectosAprobados.length
                    });
                    const oJsonModelPendientes = new sap.ui.model.json.JSONModel({
                        DatosProyect: aProyectosPendientes,
                        Count: aProyectosPendientes.length
                    });

                    // 5. Asignar los modelos a las tablas correspondientes
                    this.getView().setModel(oJsonModelAprobados, "modelAprobados");
                    this.getView().setModel(oJsonModelPendientes, "modelPendientes");

                } catch (error) {
                    console.error("Error al cargar los proyectos con estado:", error);
                }
            },
*/


        onPressWORklow: async function (oEvent){
            await    this.onVerHistorial(oEvent);
        //    await this.onActivityPress(oEvent);




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
                        sap.m.MessageToast.show("Este proyecto no tiene un workflow asociado.");
                        return;
                    }
            
                    const oModel = this.getOwnerComponent().getModel(); // OData Model principal
                    const oBoundContext = oModel.bindContext("/getWorkflowTimeline(...)");
            
                    oBoundContext.setParameter("ID", workflowId);
                    await oBoundContext.execute();
            
                    const result = oBoundContext.getBoundContext().getObject();
                    console.log(`✅ Historial del workflow (${modelo}):`, result);
            


                    await   this.onActivityPress(oEvent, result);
                    sap.m.MessageBox.information(JSON.stringify(result, null, 2));
                } catch (error) {
                    console.error("❌ Error al obtener el historial del workflow:", error);
                    sap.m.MessageBox.error("No se pudo obtener el historial del workflow.");
                }
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
                    console.log("✅ Historial del workflow:", result);
            
                    sap.m.MessageBox.information(JSON.stringify(result, null, 2));
                } catch (error) {
                    console.error("❌ Error al obtener el historial del workflow:", error);
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

                        if (userInfo) {
                            // Asignar datos a los controles en la vista
                            //this.byId("dddtg")?.setText(userInfo.name);
                            this.byId("dddtg")?.setText(userInfo.email);


                            this.byId("233")?.setText(userInfo.fullName);
                            //this.byId("apellidoUsuario")?.setText(userInfo.familyName);
                            //this.byId("telefonoUsuario")?.setText(userInfo.phoneNumber);

                            // console.log("📌 Datos seteados en la vista:", userInfo);
                        } else {
                            console.error("No se encontró la información del usuario.");
                        }
                    })
                    .catch(error => {
                        console.error("❌ Error obteniendo datos del usuario:", error);
                    });
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

            onActivityPress: function (oEvent, result) {
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
            },
            
            
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

         
            },*/

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
            
            
            

            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
         /*   onActivityPress: function (oEvent, result) {
                console.log("RESULT DEL WORKLOW " + JSON.stringify(result));  
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
                    console.log("ID: ", evento.id);
                    console.log("Tipo: ", evento.tipo);
                    console.log("Descripción: ", evento.descripcion);
                    console.log("Timestamp: ", evento.timestamp);
                    console.log("Instancia: ", evento.instancia);
                    console.log("Paso: ", evento.paso);
                    console.log("Usuario: ", evento.usuario);
                    console.log("---------------------------");
            
                    // Crear nodos dinámicamente basados en los eventos
                    oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                        nodeId: evento.id, // Usar el ID del evento como nodeId
                        title: evento.paso, // Usar la descripción como título
                        laneId: "0", // Puedes asignar un laneId dinámico si lo necesitas
                        state: "Neutral", // Puedes usar estado dinámico según el evento
                        stateText: evento.paso, // Usar tipo de evento para el estado
                        children: []  // Si el evento tiene pasos siguientes, puedes agregar nodos hijos
                    }));
                });
            
                var oTitle = this.byId("idTitleProceso");
                oTitle.setText("Proceso de solicitud: " + sNameProyect);
            
                var oText = this.byId("text1881");
                oText.setText("PEP de solicitud: " + sID);
            
                // Cambiar la pestaña seleccionada al IconTabFilter con id 'people'
                var oIconTabBar = this.byId("itb1");
                oIconTabBar.setSelectedKey("people");
            
                // Añadir evento de presión en los nodos
                oProcessFlow.attachNodePress(this.onNodePress.bind(this));
            },
            
            


            onNodePress: function (oEvent) {
                var sNodeId = oEvent.getParameter("nodeId");
            
                var oProcessFlow = this.byId("processflow1");
                var aNodes = oProcessFlow.getNodes();
            
                var oNode = aNodes.find(function (node) {
                    return node.getNodeId() === sNodeId;
                });
            
                if (!oNode) {
                    console.error("Nodo no encontrado para nodeId: " + sNodeId);
                    return;
                }
            
                console.log("Nodo encontrado:", oNode.getTitle());
            },
            */
            




         /*   onNodePress: function (oEvent) {
                // Obtener el nodo seleccionado
                var oNode = oEvent.getParameters().getNodeId(); // ID del nodo seleccionado

                // Obtener el nodo del ProcessFlow
                var oProcessFlow = this.byId("processflow1");
                var aNodes = oProcessFlow.getNodes(); // Obtener todos los nodos

                // Encontrar el nodo que coincide con el nodeId
                var oSelectedNode = aNodes.find(function (node) {
                    return node.getNodeId() === oNode;
                });

                if (!oSelectedNode) {
                    console.error("Nodo no encontrado");
                    return;
                }

                // Obtener información del nodo
                var sNodeTitle = oSelectedNode.getTitle(); // Título del nodo
                var sStateText = oSelectedNode.getStateText(); // Estado del nodo

                // Crear Popover si no existe
                if (!this._oPopover) {
                    this._oPopover = new sap.m.Popover({
                        title: "Detalles",
                        placement: sap.m.PlacementType.Auto,
                        content: [
                            new sap.m.Text({ text: "" }), // Placeholder para el texto dinámico
                            new sap.m.Button({
                                text: "Cerrar",
                                press: function () {
                                    this._oPopover.close(); // Cerrar el popover
                                }.bind(this)
                            })
                        ]
                    });

                }

                // Actualizar el texto del Popover con la información del nodo
                var oText = this._oPopover.getContent()[0];

                // Cambiar el texto según el estado o el título del nodo
                var sDynamicText;
                if (sStateText === "Estado1") {
                    sDynamicText = "Solicitud Enviado Correctamente. \nTítulo: " + sNodeTitle;
                } else if (sStateText === "Estado2") {
                    sDynamicText = "Información adicional para Estado2. \nTítulo: " + sNodeTitle;
                } else {
                    sDynamicText = "Nodo: " + sNodeTitle + "\nEstado: " + sStateText;
                }

                oText.setText(sDynamicText);

                // Mostrar el Popover en el nodo seleccionado
                this._oPopover.openBy(oEvent.getSource());
                // Agregar el Popover como dependiente de la vista
                this.getView().addDependent(this._oPopover); // Abrir el popover en el nodo presionado
            },*/

        /*    onIconTabSelect: function (oEvent) {
                var sSelectedKey = oEvent.getParameter("key");
                var oIconTabBar = this.byId("itb1");
                var oPeopleTab = this.byId("ma77"); // Accede al IconTabFilter que deseas ocultar

                // Verificar si el usuario está intentando acceder al IconTabFilter "people" sin haber pasado por "attachments"
                if (sSelectedKey === "people" && !this.bProcessFlowAllowed) {
                    // Mostrar un mensaje de advertencia
                    sap.m.MessageBox.show(
                        "Por favor, seleccione una solicitud en la pestaña de solicitudes para ver el proceso.",
                        {
                            title: "Advertencia", // Título del MessageBox
                            actions: [sap.m.MessageBox.Action.OK], // Opciones de botones
                            onClose: function (oAction) {
                                // Acción a realizar cuando se cierra el MessageBox
                            }
                        }
                    );

                    // Volver a la primera pestaña (lista de solicitudes)
                    oIconTabBar.setSelectedKey("attachments");

                    return; // Detener la ejecución
                }

                // Lógica para mostrar u ocultar el IconTabFilter basado en el estado
                if (this.bProcessFlowAllowed) {
                    oPeopleTab.setVisible(true); // Mostrar si se permite
                } else {
                    oPeopleTab.setVisible(false); // Ocultar si no se permite
                }
            },*/





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

          
            /*  _processTableRows: function (oTable, newId) {
                  const oItems = oTable.getItems();
                  let found = false;
              
                  oItems.forEach(item => {
                      // Buscar el botón dentro de cada fila
                      const oButton = item.getCells().find(cell => cell.getId().endsWith("butn34"));
                      if (oButton) {
                          // Buscar el CustomData con la clave 'projectId'
                          const oCustomData = oButton.getCustomData().find(data => data.getKey() === "projectId");
                          if (oCustomData) {
                              // Obtener el valor de projectId y compararlo con newId
                              const itemId = oCustomData.getValue();
                              console.log("Comparando IDs:", itemId, newId);
              
                              // Si los IDs coinciden, resaltar la fila
                              if (itemId === newId) {
                                  console.log("Resaltando fila con ID:", itemId);
                                  item.addStyleClass("highlight-border");
                                  found = true;
                              }
                          }
                      }
                  });
              
                  // Si no se encontró ninguna fila con el ID, muestra un mensaje
                  if (!found) {
                   //No hay datos de servi Externos  disponibles.   console.log("No se encontró una fila con el ID:", newId);
                  }
              
                  // Forzar el renderizado de la tabla para reflejar los cambios visuales
                  oTable.rerender();
              },*/


            _refreshTableData: function () {
                const oTable = this.byId("idPendientes");  // Obtener la referencia a la tabla

                // Verificar si la tabla existe
                if (oTable) {
                    // Refrescar el binding de los elementos de la tabla
                    oTable.getBinding("items")?.refresh();
                }


            },


            /*  _onObjectMatched: function (oEvent) {
                  //   console.log("Parámetros del evento:", oEvent.getParameters());
  
                  // Obtén el ID enviado como parámetro
                  const newId = oEvent.getParameter("arguments").newId;
                  //    console.log("ID de nuevo:", newId);
  
                  // Llama a la función para resaltar la fila
                  this._highlightNewRow(newId);
              },
  
              _highlightNewRow: function (newId) {
                  const oTable = this.byId("idPendientes");
  
                  // Asegúrate de que la tabla esté completamente cargada antes de continuar
                  oTable.attachEventOnce("updateFinished", () => {
                      const oItems = oTable.getItems();
                      console.log("Número de ítems en la tabla:", oItems.length);
  
                      // Verifica si hay elementos en la tabla
                      if (oItems.length === 0) {
                          console.log("No hay ítems en la tabla.");
                          return;
                      }
  
                      let found = false;
  
                      oItems.forEach(item => {
                          // Encuentra el botón en la fila actual
                          const oButton = item.getCells().find(cell => cell.getId().endsWith("butn34"));
                          console.log("Botón encontrado:", oButton);
  
                          if (oButton) {
                              // Encuentra el CustomData con la clave 'projectId'
                              const oCustomData = oButton.getCustomData().find(data => data.getKey() === "projectId");
                              console.log("CustomData encontrado:", oCustomData ? oCustomData.getValue() : "No encontrado");
  
                              if (oCustomData) {
                                  // Obtén el valor del projectId y compáralo con newId
                                  const itemId = oCustomData.getValue();
                                  console.log("Comparando IDs:", itemId, newId);
  
                                  if (itemId === newId) {
                                      // Si los IDs coinciden, resalta la fila
                                      console.log("Resaltando fila con ID:", itemId);
                                      item.addStyleClass(" ");
                                      found = true; // Marca que se ha encontrado y resaltado la fila
                                  }
                              }
                          }
                      });
  
                      if (!found) {
                          console.log("No se encontró una fila con el ID:", newId);
                      }
  
                      // Forzar el renderizado de la tabla para reflejar los cambios visuales
                      oTable.rerender();
                  });
              },*/




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


            // Función para formatear la fecha
            /* formatDate: function (dateString) {
                 if (!dateString) {
                     return "";
                 }
 
                 // Convertimos el string en un objeto Date
                 var date = new Date(dateString);
                 // Verificamos si es una fecha válida
                 if (isNaN(date.getTime())) {
                     return dateString; // Devolvemos el string original si no es válida
                 }
 
                 // Usamos DateFormat para formatear la fecha
                 var oDateFormat = DateFormat.getInstance({
                     pattern: "dd MMM yyyy", // Formato deseado
                     UTC: true // Para asegurarnos de que se considere la zona horaria UTC
                 });
 
                 return oDateFormat.format(date);
             },*/




            onEditPress: function (oEvent) {
                var oButton = oEvent.getSource();

                // Obtener el contexto del ítem en la tabla
                var oContext = oButton.getBindingContext("modelPendientes");  // Usa el nombre del modelo correcto

                if (!oContext) {
                    console.error("No se pudo obtener el contexto del ítem.");
                    return;
                }

                // Obtener el valor de "sProjectID" directamente desde el contexto del modelo
                var sProjectID = oContext.getProperty("ID");  // "ID" debe ser el nombre correcto del campo en los datos

                if (!sProjectID) {
                    console.error("El ID del proyecto es nulo o indefinido");
                    return;
                }

                console.log("edit id " + sProjectID);

                var sNameProyect = oContext.getProperty("nameProyect"); // Obtén también el nombre del proyecto

                var that = this;

                // Limpia los datos previos del modelo
                var oModel = this.getView().getModel("mainService"); // Usa el nombre correcto del modelo
                if (oModel) {
                    oModel.setData({});  // Limpia los datos previos
                    oModel.refresh(true); // Fuerza la actualización del modelo
                }

                var oDialog = new sap.m.Dialog({
                    title: "Confirmar Edición",
                    type: "Message",
                    state: "Warning",
                    content: new sap.m.Text({
                        text: "¿Estás seguro de que quieres editar el proyecto '" + sNameProyect + "'?"
                    }),
                    beginButton: new sap.m.Button({
                        text: "Confirmar",
                        press: function () {
                            oDialog.close();

                            var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                            oRouter.navTo("view", {
                                sProjectID: sProjectID
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



            /*onEditPress: function (oEvent) {
                var oButton = oEvent.getSource();
                var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto

               

                var sProjectID = oButton.getCustomData().find(function (oData) {
                    return oData.getKey() === "projectId";
                }).getValue();
            
                if (!sProjectID) {
                    console.error("El ID del proyecto es nulo o indefinido");
                    return;
                }


                console.log("edit id "  + sProjectID);
            


                
                var that = this;
           //     var oModel = this.getView().getModel("mainService"); // OData V4 Model
            
    
            
              
           var oModel = this.getView().getModel("mainService"); // Usa el nombre correcto del modelo
           if (oModel) {
               oModel.setData({});  // Limpia los datos previos
               oModel.refresh(true); // Fuerza la actualización del modelo
           }
            
                    var oDialog = new sap.m.Dialog({
                        title: "Confirmar Edición",
                        type: "Message",
                        state: "Warning",
                        content: new sap.m.Text({
                            text: "¿Estás seguro de que quieres editar el proyecto '" + sNameProyect + "'?"
                        }),
                        beginButton: new sap.m.Button({
                            text: "Confirmar",
                            press: function () {
                                oDialog.close();
            
                         
                            
                                var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                                oRouter.navTo("view", {
                                    sProjectID: sProjectID
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
            
              
            },*/



            /*    onEditPress: function (oEvent) {
                    // Obtener el botón que fue presionado
                    var oButton = oEvent.getSource();
                
                    // Obtener el valor de CustomData (ID del proyecto)
                    var sProjectID = oButton.getCustomData().find(function (oData) {
                        return oData.getKey() === "projectId";  
                    }).getValue();
                
                    // Verifica que sProjectID tiene un valor válido
                    if (!sProjectID) {
                        console.error("El ID del proyecto es nulo o indefinido");
                        return;
                    } else {
                        console.log("ID Correcto", sProjectID);
                    }
                
                    // Obtener el modelo del formulario y limpiarlo antes de editar
                    var oModel = this.getView().getModel("mainService"); // Usa el nombre correcto del modelo
                    if (oModel) {
                        oModel.setData({});  // Limpia los datos previos
                        oModel.refresh(true); // Fuerza la actualización del modelo
                    }
                
                    // Navegar a la vista del formulario con el ID del proyecto
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("view", {
                        sProjectID: sProjectID
                    }, true );
                },*/



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


            /*onEditPress: function (oEvent) {
                // Obtener el botón que fue presionado
                var oButton = oEvent.getSource();

                // Obtener el valor de CustomData (ID del proyecto)
                var sProjectID = oButton.getCustomData().find(function (oData) {
                    return oData.getKey() === "projectId";  // Usamos "projectId" como clave para obtener el ID
                }).getValue();

                // Verifica que sProjectID tiene un valor válido
                if (!sProjectID) {
                    console.error("El ID del proyecto es nulo o indefinido");
                    return;
                } else {
                    console.log("ID Correct", sProjectID)
                }

                // Navegar a la vista del formulario correspondiente, pasando el ID del proyecto
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("view", {
                    sProjectID: sProjectID  // Asegúrate de que "sProjectID" coincida con lo que tienes en manifest.json
                });
            },*/

           onDeletePress: async function (oEvent) {
             //   let oModel = this.getView().getModel("modelPendientes");

                let oButton = oEvent.getSource();
                let sProjectId = oButton.getCustomData()[0].getValue();

                if (!sProjectId) {
                    console.error("No se encontró un ID válido para eliminar.");
                    sap.m.MessageToast.show("Error: No se encontró un ID válido.");
                    return;
                }

                console.log("🔴 Eliminando Proyecto con ID:", sProjectId);

                try {
                    // 1️⃣ Obtener el CSRF Token
                    let oTokenResponse = await fetch("/odata/v4/datos-cdo/", {
                        method: "GET",
                        headers: { "x-csrf-token": "Fetch" }
                    });
                    

                    if (!oTokenResponse.ok) throw new Error("Error al obtener el CSRF Token");

                    let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
                    if (!sCsrfToken) throw new Error("No se recibió un CSRF Token");

                    console.log("✅ CSRF Token obtenido:", sCsrfToken);

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
                                        "WorkflowInstancias"
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
                                                        console.error(`❌ Error eliminando ${path} con ID ${hijo.ID}`);
                                                    } else {
                                                        console.log(`✅ ${path} eliminado: ${hijo.ID}`);
                                                    }
                                                })
                                            );
                                        }
                                    });

                                    await Promise.all(deletePromises);
                                    console.log("✅ Registros relacionados eliminados.");

                                    // 3️⃣ Eliminar el proyecto principal
                                    let projectResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "x-csrf-token": sCsrfToken
                                        },
                                    });

                                    if (projectResponse.ok) {
                                        console.log("✅ Proyecto eliminado correctamente.");
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
                                    console.error("❌ Error eliminando el proyecto o registros:", error);
                                    sap.m.MessageToast.show("Error al eliminar el proyecto o registros.");
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error("❌ Error al obtener el CSRF Token:", error);
                    sap.m.MessageToast.show("Error al obtener el CSRF Token.");
                }
            },





            /* onDeletePress: async function (oEvent) {
                   var oButton = oEvent.getSource();
                   var sProjectId = oButton.getCustomData()[0].getValue();
                   console.log("ID del Proyecto a eliminar:", sProjectId);
   
                   // Confirmación de eliminación
                   await new Promise(resolve => setTimeout(resolve, 50));
   
                   sap.m.MessageBox.confirm("¿Estás seguro de que deseas eliminar este proyecto y todos sus registros relacionados?", {
                       actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                       onClose: async function (oAction) {
                           if (oAction === sap.m.MessageBox.Action.YES) {
                               try {
                                   const paths = [
                                       `planificacion`,
                                       `Facturacion`,
                                       `ClientFactura`,
                                       `ProveedoresC`,
                                       `RecursosInternos`,
                                       `ConsumoExternos`,
                                       `RecursosExternos`,
                                       `otrosConceptos`
                                   ];
   
                                   for (let path of paths) {
                                       console.log(`Procesando entidad: ${path}`);
   
                                       // Solicitar registros hijos
                                       let hijosResponse = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})/${path}`, {
                                           method: "GET",
                                           headers: {
                                               "Accept": "application/json",
                                               "Content-Type": "application/json"
                                           }
                                       });
   
                                       if (!hijosResponse.ok) {
                                           console.error(`Error al obtener los registros de ${path}`);
                                           continue;
                                       }
   
                                       const contentType = hijosResponse.headers.get("Content-Type");
                                       if (contentType && contentType.includes("application/json")) {
                                           const hijosData = await hijosResponse.json();
                                           console.log(`Datos recibidos de ${path}:`, hijosData);
   
                                           // Verificar si es una lista o un objeto individual
                                           if (Array.isArray(hijosData.value) && hijosData.value.length > 0) {
                                               // Si es una lista, iterar y eliminar cada elemento
                                               for (let hijo of hijosData.value) {
                                                   console.log(`Eliminando hijo con ID ${hijo.ID} en ${path}`);
                                                   let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijo.ID})`, {
                                                       method: "DELETE",
                                                       headers: {
                                                           "Content-Type": "application/json"
                                                       }
                                                   });
   
                                                   if (!deleteResponse.ok) {
                                                       console.error(`Error al eliminar el hijo en ${path}: ${hijo.ID}`);
                                                   } else {
                                                       console.log(`Hijo eliminado exitosamente en ${path}: ${hijo.ID}`);
                                                   }
                                               }
                                           } else if (hijosData.ID) {
                                               // Si es un objeto individual, eliminar directamente
                                               console.log(`Eliminando objeto único con ID ${hijosData.ID} en ${path}`);
                                               let deleteResponse = await fetch(`/odata/v4/datos-cdo/${path}(${hijosData.ID})`, {
                                                   method: "DELETE",
                                                   headers: {
                                                       "Content-Type": "application/json"
                                                   }
                                               });
   
                                               if (!deleteResponse.ok) {
                                                   console.error(`Error al eliminar el hijo en ${path}: ${hijosData.ID}`);
                                               } else {
                                                   console.log(`Hijo eliminado exitosamente en ${path}: ${hijosData.ID}`);
                                               }
                                           } else {
                                               console.warn(`No se encontró ningún ID en la respuesta de ${path}`);
                                           }
                                       } else {
                                           console.warn(`La respuesta de ${path} no es JSON o está vacía. Continuando con el siguiente...`);
                                           continue;
                                       }
                                   }
   
                                   // Eliminar el proyecto principal
                                   console.log("Eliminando el proyecto principal con ID:", sProjectId);
                                   let response = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                                       method: "DELETE",
                                       headers: {
                                           "Content-Type": "application/json"
                                       }
                                   });
   
                                   if (response.ok) {
                                       console.log("Proyecto eliminado exitosamente.");
                                       sap.m.MessageToast.show("Proyecto y sus hijos eliminados exitosamente");
   
                                       const oTable = this.byId("idPendientes");
                                       const oBinding = oTable.getBinding("items");
                                       oBinding.refresh();
   
                                       var oModel = this.getView().getModel();
                                       oModel.refresh();
                                   } else {
                                       console.error("Error al eliminar el proyecto principal.");
                                       sap.m.MessageToast.show("Error al eliminar el proyecto");
                                   }
                               } catch (error) {
                                   console.error("Error eliminando el proyecto o sus hijos:", error);
                                   sap.m.MessageToast.show("Error al eliminar el proyecto o sus hijos");
                               }
                           }
                       }.bind(this)
                   });
               },*/


               onNavToView1: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var oComponent = this.getOwnerComponent();
                
                // Obtener la vista que deseas limpiar (reemplaza "idView1" con el ID real de la vista)
                var oTargetView = oComponent.byId("view");
            
                if (!oTargetView) {
                    console.warn("No se encontró la vista objetivo.");
                    oRouter.navTo("viewNoParam"); // Navega aunque no se haya encontrado la vista
                    return;
                }
            
                // Función para limpiar los controles de la vista
                function clearAllFields(oControl) {
                    if (oControl instanceof sap.m.Input) {
                        oControl.setValue("");
                    } else if (oControl instanceof sap.m.Select || oControl instanceof sap.m.ComboBox) {
                        oControl.setSelectedKey("");
                    } else if (oControl instanceof sap.m.DatePicker) {
                        oControl.setDateValue(null);
                    } else if (oControl instanceof sap.m.TextArea) {
                        oControl.setValue("");
                    } else if (oControl instanceof sap.m.CheckBox) {
                        oControl.setSelected(false);
                    } else if (oControl instanceof sap.viz.ui5.controls.VizFrame) {
                        // Limpiar el VizFrame: por ejemplo, eliminando datos vinculados o restableciendo la configuración
                        oControl.destroyDataset();  // Elimina los datasets actuales
                        oControl.destroyFeeds();     // Elimina los feeds asociados
                        oControl.setVizProperties({}); // Restablece las propiedades visuales
                    }
            
                    // Limpiar controles dentro de contenedores
                    if (oControl.getAggregation) {
                        const aAggregations = oControl.getMetadata().getAllAggregations();
                        for (let sAggregationName in aAggregations) {
                            const oAggregation = oControl.getAggregation(sAggregationName);
                            if (Array.isArray(oAggregation)) {
                                oAggregation.forEach(clearAllFields);
                            } else if (oAggregation instanceof sap.ui.core.Control) {
                                clearAllFields(oAggregation);
                            }
                        }
                    }
                }
            
                // Ejecutar la limpieza en la vista antes de navegar
                oTargetView.findAggregatedObjects(false, clearAllFields);
            
                // Aquí puedes agregar la lógica para actualizar la vista
                // Si tu vista tiene un modelo o necesitas recargar datos, hazlo aquí
                var oModel = oComponent.getModel(); // Asumiendo que el modelo es global
                if (oModel) {
                    oModel.refresh(); // Esto recargará el modelo
                }
            
                // Actualizar todos los controles vinculados, si es necesario
                // oTargetView.getBindingContext().requestContext(); // Esto puede forzar la actualización del contexto, si es necesario.
            
                // Si necesitas actualizar algún dato específico, puedes hacerlo aquí.
            
                // Navegar a la nueva vista después de limpiar y actualizar la vista
                oRouter.navTo("viewNoParam");
            },
            
            

         /*   onNavToView1: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var oComponent = this.getOwnerComponent();

                // Obtener la vista que deseas limpiar (reemplaza "idView1" con el ID real de la vista)
                var oTargetView = oComponent.byId("view");

                if (!oTargetView) {
                    console.warn("No se encontró la vista objetivo.");
                    oRouter.navTo("viewNoParam"); // Navega aunque no se haya encontrado la vista
                    return;
                }

                // Función para limpiar los controles de la vista
                function clearAllFields(oControl) {
                    if (oControl instanceof sap.m.Input) {
                        oControl.setValue("");
                    } else if (oControl instanceof sap.m.Select || oControl instanceof sap.m.ComboBox) {
                        oControl.setSelectedKey("");
                    } else if (oControl instanceof sap.m.DatePicker) {
                        oControl.setDateValue(null);
                    } else if (oControl instanceof sap.m.TextArea) {
                        oControl.setValue("");
                    } else if (oControl instanceof sap.m.CheckBox) {
                        oControl.setSelected(false);
                    }

                    // Limpiar controles dentro de contenedores
                    if (oControl.getAggregation) {
                        const aAggregations = oControl.getMetadata().getAllAggregations();
                        for (let sAggregationName in aAggregations) {
                            const oAggregation = oControl.getAggregation(sAggregationName);
                            if (Array.isArray(oAggregation)) {
                                oAggregation.forEach(clearAllFields);
                            } else if (oAggregation instanceof sap.ui.core.Control) {
                                clearAllFields(oAggregation);
                            }
                        }
                    }
                }

                // Ejecutar la limpieza en la vista antes de navegar
                oTargetView.findAggregatedObjects(false, clearAllFields);

                // Navegar a la nueva vista después de limpiar
                oRouter.navTo("viewNoParam");
            }*/





        });
    }
);
