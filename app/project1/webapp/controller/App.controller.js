sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/CustomData",
        "sap/ui/core/format/DateFormat" 

    ],
    function (BaseController, CustomData, DateFormat) {
        "use strict";

        return BaseController.extend("project1.controller.App", {
            onInit: function () {



                var oProcessFlow = this.byId("processflow1");
                oProcessFlow.attachNodePress(this.onNodePress, this);

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


           /// getProyect: ()



           filterEstado: async function(){
            try {
                // Obtener los proyectos
                const response = await fetch("/odata/v4/datos-cdo/DatosProyect");
                const result = await response.json();

//                    console.log("RESUELTO " + JSON.stringify(result));
                const aProjects = result.value;
        
                // Obtener el estado más reciente de cada proyecto
                const aProyectosConEstado = await Promise.all(
                    aProjects.map(async (proyecto) => {
                        var projectId = proyecto.ID;

                        console.log("IDD PROYECTO " + projectId);
        
                        // Obtener la última instancia de workflow
                        const wfResponse = await fetch(`/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq '${projectId}'&$orderby=creadoEn desc&$top=1&$select=estado`);
                        const wfData = await wfResponse.json();
                  //      console.log("RESUELTO " + JSON.stringify(wfData));

                        // Agregar el estado al proyecto
                        proyecto.Estado = wfData.value[0]?.estado || "Sin estado";

                        

                        console.log(" proyectos " + JSON.stringify(proyecto.Estado));
                        
                        return proyecto;
                    })
                );


                // Crear y asignar el modelo JSON
                const oJsonModel = new sap.ui.model.json.JSONModel({ DatosProyect: aProyectosConEstado });
                this.getView().setModel(oJsonModel);
        
            } catch (error) {
                console.error("Error al cargar los proyectos con estado:", error);
            }
        },






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
              
                      console.log("📌 Datos seteados en la vista:", userInfo);
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
            
          /*  loadFilteredDataPend: function () {
                // Crea el filtro para obtener solo los registros con estado "Aprobado"
                var oFilter = new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, "Pendiente");

        
                // Obtén la referencia a la tabla en la vista
                var oTable = this.byId("idPendientes");

                // Verifica si el binding está disponible y aplica el filtro
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter([oFilter]);
                    this.updateIconTabFilterCountPen(oBinding); // Llama a la función para actualizar el coun
                } else {
                    oTable.attachEventOnce("updateFinished", function () {
                        var oBinding = oTable.getBinding("items");
                        oBinding.filter([oFilter]);
                        this.updateIconTabFilterCountPen(oBinding);
                    }.bind(this));
                }
            },*/


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



            onActivityPress: function (oEvent) {
                var oButton = oEvent.getSource();
                var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto
                var sID = oButton.getCustomData()[1].getValue();          // ID del proyecto


                var oTitle = this.byId("idTitleProceso");
                oTitle.setText("Proceso de solicitud: " + sNameProyect);

                var oText = this.byId("text1881");
                oText.setText("PEP de solicitud: " + sID);


                var oProcessFlow = this.byId("processflow1");
                oProcessFlow.removeAllNodes(); // Limpiar nodos existentes

                this.bProcessFlowAllowed = true;

                // Nodo inicial (Solicitante CdO)
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "solicitanteCdoNode",
                    title: sNameProyect,
                    laneId: "0",
                    state: "Positive",
                    stateText: "Solicitud Iniciada",
                    children: ["revisarTQNode"]  // Conectar con "Requiere Basis/TQ/Factoria"
                }));

                // Nodo "Requiere Basis/TQ/Factoria"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "revisarTQNode",
                    title: "Requiere Basis/TQ/Factoria",
                    laneId: "1",
                    state: "Neutral",
                    stateText: "Esperando Revisión",
                    children: ["revisionTQNode", "revisionPMONode"]  // Conectar con "Revisión TQ" o "Revisión PMO" dependiendo
                }));

                // Nodo "Revisión Basis/TQ/Factoria"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "revisionTQNode",
                    title: "Revisión Basis/TQ/Factoria",
                    laneId: "2",
                    state: "Neutral",
                    stateText: "En Revisión",
                    children: ["revisionPMONode"]
                }));

                // Nodo "Revisión PMO"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "revisionPMONode",
                    title: "Revisión PMO",
                    laneId: "3",
                    state: "Neutral",
                    stateText: "Revisión PMO Pendiente",
                    children: ["rechazadoPMONode", "revisionCdGNode"]
                }));

                // Nodo "Rechazado PMO"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "rechazadoPMONode",
                    title: "Rechazado por PMO",
                    laneId: "4",
                    state: "Negative",
                    stateText: "Solicitud Rechazada"
                }));

                // Nodo "Revisión Control de Gestión"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "revisionCdGNode",
                    title: "Revisión Control de Gestión",
                    laneId: "5",
                    state: "Neutral",
                    stateText: "En Revisión",
                    children: ["revisionDireccionNode"]
                }));



                // Nodo "Revisión Dirección"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "revisionDireccionNode",
                    title: "Aprobado por Gestion",
                    laneId: "6",
                    state: "Positive",
                    stateText: "Aprobada por Gestion",
                    children: ["ReviDirec"]
                }));


                // Nodo "Revisión Dirección"
                oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
                    nodeId: "ReviDirec",
                    title: "Revisión Dirección/CdO",
                    laneId: "8",
                    state: "Neutral",
                    stateText: "Aprobada por Dirección"
                }));
                // Cambiar la pestaña seleccionada al IconTabFilter con id 'people'
                var oIconTabBar = this.byId("itb1");
                oIconTabBar.setSelectedKey("people");

                // Añadir evento de presión en los nodos
                oProcessFlow.attachNodePress(this.onNodePress.bind(this));
            },




            onNodePress: function (oEvent) {
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
            },


            onIconTabSelect: function (oEvent) {
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


            _onObjectMatched: function (oEvent) {
                // Obtener el ID recibido como parámetro de la URL
                const newId = oEvent.getParameter("arguments").newId;
            
                // Verifica si el ID es válido
                if (!newId) {
                    console.error("No se recibió un ID válido");
                    return;
                }
            
                // Llamar a la función para resaltar la fila
                this._highlightNewRow(newId);
            },
            
            _highlightNewRow: function (newId) {
                const oTable = this.byId("idPendientes");
            
                // Si la tabla ya tiene datos, procesar inmediatamente
                if (oTable.getItems().length > 0) {
                    this._processTableRows(oTable, newId);
                } else {
                    // Esperar a que se actualicen los datos
                    oTable.attachEventOnce("updateFinished", () => {
                        this._processTableRows(oTable, newId);
                    });
                }
                this._refreshTableData(oTable);

            },
            

            _processTableRows: function (oTable, newId) {
                // Procesar cada fila de la tabla
                oTable.getItems().forEach(item => {
                    // Comprobar si el ID de la fila coincide con el ID recibido
                    if (item.getBindingContext().getProperty("ID") === newId) {
                        // Si es así, agregar una clase CSS para resaltar la fila
                        item.addStyleClass("highlight"); // Asume que la clase "highlight" está definida en tu CSS
                    }
                });
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
                                    item.addStyleClass("highlight-border");
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
                var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto

                var sProjectID = oButton.getCustomData().find(function (oData) {
                    return oData.getKey() === "projectId";
                }).getValue();
            
                if (!sProjectID) {
                    console.error("El ID del proyecto es nulo o indefinido");
                    return;
                }
            


                
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
            
              
            },
            


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
            


            onView: function(oEvent){
     
                    if (!this.Dialog) {
                        this.Dialog = this.loadFragment({
                            name: "project1.view.Dialog"
                        });
                    }
                    this.Dialog.then(function(oDialog) {
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
           
                console.log("Metodo project "  + sProjectID);
               
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
                let oModel = this.getView().getModel();
                let sServiceUrl = oModel.sServiceUrl;
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
                    let oTokenResponse = await fetch(sServiceUrl, {
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
                                            onClose: function () {
                                                // Refrescar la tabla después de cerrar el mensaje
                                                let oTable = this.byId("idPendientes");
                                                if (oTable) {
                                                    oTable.getBinding("items")?.refresh();
                                                }
                                                oModel.refresh();
                                            }.bind(this)  // Asegura que "this" siga apuntando al controlador
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
            }





        });
    }
);
