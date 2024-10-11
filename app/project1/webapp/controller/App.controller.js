sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
      "sap/ui/core/CustomData",
      "sap/ui/core/format/DateFormat" // Importamos el formateador de fecha

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

        
      },

      
      onActivityPress: function (oEvent) {
        var oButton = oEvent.getSource();
        var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto
        var sID = oButton.getCustomData()[1].getValue();          // ID del proyecto
    
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
    


    /*  onActivityPress: function (oEvent) {
        var oButton = oEvent.getSource();
        var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto
        var sID = oButton.getCustomData()[1].getValue();          // ID del proyecto
    
        // Obtener el ProcessFlow
        var oProcessFlow = this.byId("processflow1");
        
        // Limpiar nodos existentes y añadir los nuevos datos
        oProcessFlow.removeAllNodes();
    
        this.bProcessFlowAllowed = true;



        // Nodo principal (Solicitud)
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "mainNode",  // ID único para el nodo principal
            title: sNameProyect + " (ID: " + sID + ")",  // Mostrar el nombre del proyecto y el ID
            laneId: "0",  // Lane de Solicitud
            state: "Positive",
            stateText: "Enviado",
            children: ["approvalNode"]  // Conectar con "Pendiente de Aprobación"
        }));
    
        // Nodo "Pendiente de Aprobación"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "approvalNode",  // ID único para el nodo de aprobación
            title: "Verificacion de Solicitud",
            laneId: "1",  // Lane de Pendiente de Aprobación
            state: "Neutral",
            stateText: "Esperando Aprobación",
            children: ["calidadNode"]  // Conectar con "Pendiente Calidad"
        }));
    
        // Nodo "Pendiente de Calidad"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "calidadNode",  // ID único para el nodo de calidad
            title: "Pendiente Calidad",
            laneId: "2",  // Lane de Calidad
            state: "Neutral",
            stateText: "Esperando Calidad",
            children: ["testingNode"]  // Conectar con "Pendiente Testing"
        }));
    
        // Nodo "Pendiente Testing"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "testingNode",  // ID único para el nodo de testing
            title: "Pendiente Testing",
            laneId: "3",  // Lane de Testing
            state: "Neutral",
            stateText: "Esperando Testing",
            children: ["factoriaNode"]  // Conectar con "Pendiente Factoria"
        }));
    
        // Nodo "Pendiente Factoria"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "factoriaNode",  // ID único para el nodo de factoria
            title: "Pendiente Factoria",
            laneId: "4",  // Lane de Factoria
            state: "Neutral",
            stateText: "Esperando Factoria",
            children: ["revisionCotizacionNode"]  // Conectar con "Revision Cotizacion"
        }));
    
        // Nodo "Revision Cotizacion"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "revisionCotizacionNode",  // ID único para el nodo de revisión de cotización
            title: "Revision Cotizacion",
            laneId: "5",  // Lane de Revision Cotizacion
            state: "Neutral",
            stateText: "Revisando Cotización",
            children: ["revisionPMONode"]  // Conectar con "Revision PMO"
        }));
    
        // Nodo "Revision PMO"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "revisionPMONode",  // ID único para el nodo de revisión PMO
            title: "Revision PMO",
            laneId: "6",  // Lane de Revision PMO
            state: "Neutral",
            stateText: "Revisando PMO",
            children: ["rechazadoPMONode"]  // Conectar con "Rechazado PMO"
        }));
    
        // Nodo "Rechazado PMO"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "rechazadoPMONode",  // ID único para el nodo de rechazado PMO
            title: "Rechazado PMO",
            laneId: "7",  // Lane de Rechazo PMO
            state: "Negative",
            stateText: "Rechazado por PMO",
            children: ["aprobacionDireccionNode"]  // Conectar con "Aprobación Dirección"
        }));
    
        // Nodo "Aprobación Dirección"
        oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
            nodeId: "aprobacionDireccionNode",  // ID único para el nodo de aprobación dirección
            title: "Aprobación Dirección",
            laneId: "8",  // Lane de Aprobación
            state: "Positive",
            stateText: "Aprobada",
        }));
      
        // Cambiar la pestaña seleccionada al IconTabFilter con id 'people'
        var oIconTabBar = this.byId("itb1");
        oIconTabBar.setSelectedKey("people");

          // Añadir evento de presión en los nodos
          oProcessFlow.attachNodePress(this.onNodePress.bind(this));
        },
    */

        onNodePress: function (oEvent) {
          // Obtener el nodo seleccionado
          var oNode = oEvent.getParameters().getNodeId(); // ID del nodo seleccionado
      
          // Obtener el nodo del ProcessFlow
          var oProcessFlow = this.byId("processflow1");
          var aNodes = oProcessFlow.getNodes(); // Obtener todos los nodos
      
          // Encontrar el nodo que coincide con el nodeId
          var oSelectedNode = aNodes.find(function(node) {
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
                  placement:  sap.m.PlacementType.Auto,
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
      

      onIconTabSelect: function(oEvent) {
        var sSelectedKey = oEvent.getParameter("key");
        var oIconTabBar = this.byId("itb1");
        var oPeopleTab = this.byId("ma77"); // Accede al IconTabFilter que deseas ocultar
    
        // Verificar si el usuario está intentando acceder al IconTabFilter "people" sin haber pasado por "attachments"
        if (sSelectedKey === "people" && !this.bProcessFlowAllowed) {
            // Mostrar un mensaje de advertencia
            sap.m.MessageToast.show("Por favor, seleccione una solicitud en la pestaña de solicitudes para ver el proceso.");
    
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
    


   /*   onActivityPress: function (oEvent) {
        var oButton = oEvent.getSource();
        var sNameProyect = oButton.getCustomData()[0].getValue(); // nombre del proyecto
        var sID = oButton.getCustomData()[1].getValue();          // ID del proyecto
    
        // Obtener el ProcessFlow
        var oProcessFlow = this.byId("processflow1");
        
        // Limpiar nodos existentes y añadir los nuevos datos
        oProcessFlow.removeAllNodes();
    
       // Nodo principal (Solicitud)
    oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID,
      title: sNameProyect,
      laneId: "0",  // Lane de Solicitud
      state: "Positive",
      stateText: "Enviado",
      children: [sID + "_approval"]  // Conectar con "Pendiente de Aprobación"
  }));

  // Nodo "Pendiente de Aprobación"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_approval",
      title: "Verificacion de Solicitud",
      laneId: "1",  // Lane de Pendiente de Aprobación
      state: "Neutral",
      stateText: "Esperando Aprobación",
      children: [sID + "_calidad"]  // Conectar con "Pendiente Calidad"
  }));

  // Nodo "Pendiente de Calidad"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_calidad",
      title: "Pendiente Calidad",
      laneId: "2",  // Lane de Calidad
      state: "Neutral",
      stateText: "Esperando Calidad",
      children: [sID + "_testing"]  // Conectar con "Pendiente Testing"
  }));

  // Nodo "Pendiente Testing"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_testing",
      title: "Pendiente Testing",
      laneId: "3",  // Lane de Testing
      state: "Neutral",
      stateText: "Esperando Testing",
      children: [sID + "_factoria"]  // Conectar con "Pendiente Factoria"
  }));

  // Nodo "Pendiente Factoria"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_factoria",
      title: "Pendiente Factoria",
      laneId: "4",  // Lane de Factoria
      state: "Neutral",
      stateText: "Esperando Factoria",
      children: [sID + "_revision_cotizacion"]  // Conectar con "Revision Cotizacion"
  }));

  // Nodo "Revision Cotizacion"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_revision_cotizacion",
      title: "Revision Cotizacion",
      laneId: "5",  // Lane de Revision Cotizacion
      state: "Neutral",
      stateText: "Revisando Cotización",
      children: [sID + "_revision_pmo"]  // Conectar con "Revision PMO"
  }));

  // Nodo "Revision PMO"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_revision_pmo",
      title: "Revision PMO",
      laneId: "6",  // Lane de Revision PMO
      state: "Neutral",
      stateText: "Revisando PMO",
      children: [sID + "_rechazado_pmo"]  // Conectar con "Rechazado PMO"
  }));

  // Nodo "Rechazado PMO"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_rechazado_pmo",
      title: "Rechazado PMO",
      laneId: "7",  // Lane de Rechazo PMO
      state: "Negative",
      stateText: "Rechazado por PMO",
      children: [sID + "_aprobacion_direccion"]  // Conectar con "Aprobación Dirección"
  }));

  // Nodo "Aprobación Dirección"
  oProcessFlow.addNode(new sap.suite.ui.commons.ProcessFlowNode({
      nodeId: sID + "_aprobacion_direccion",
      title: "Aprobación Dirección",
      laneId: "8",  // Lane de Aprobación
      state: "Positive",
      stateText: "Aprobada",
  }));
  
    
        // Cambiar la pestaña seleccionada al IconTabFilter con id 'people'
        var oIconTabBar = this.byId("itb1");
        oIconTabBar.setSelectedKey("people");
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


      _onObjectMatched: function (oEvent) {
        console.log("Parámetros del evento:", oEvent.getParameters());
        const newId = oEvent.getParameter("arguments").newId;
        console.log("ID de nuevo:", newId);
        this._highlightNewRow(newId);
      },

      _highlightNewRow: function (newId) {
        const oTable = this.byId("idPendientes");
        const oItems = oTable.getItems();
    
        oItems.forEach(item => {
            // Encuentra el botón dentro del ColumnListItem
            const oButton = item.getCells().find(cell => cell.getId().endsWith("butn34"));
            if (oButton) {
                const oCustomData = oButton.getCustomData().find(data => data.getKey() === "projectId");
                if (oCustomData) {
                    const itemId = oCustomData.getValue();
                    if (itemId === newId) {
                        // Resaltar la fila (por ejemplo, añadiendo una clase de estilo)
                        item.addStyleClass("highlightRow");
                    }
                }
            }
        });
    },

     // Función para formatear la fecha
     formatDate: function(dateString) {
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
  },

    






      onEditPress: function (oEvent) {
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
      },



      onDeletePress: async function(oEvent) {
        var oButton = oEvent.getSource();
        var sProjectId = oButton.getCustomData()[0].getValue();  // Obtén el ID del proyecto
        console.log(sProjectId);
    
        // Mostrar el mensaje de confirmación
        sap.m.MessageBox.confirm("¿Estás seguro de que deseas eliminar este proyecto?", {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: async function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    try {
                        // Realiza la llamada fetch para eliminar el proyecto
                        let response = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectId})`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json"
                            }
                        });
    
                        if (response.ok) {
                            sap.m.MessageToast.show("Proyecto eliminado exitosamente");
    
                            // Refresca el binding de la tabla
                            const oTable = this.byId("idPendientes");
                            const oBinding = oTable.getBinding("items");
                            oBinding.refresh(); // Refresca los datos de la tabla
    
                            // Refresca el modelo para actualizar el count
                            var oModel = this.getView().getModel(); // Asegúrate de que este sea el modelo correcto
                            oModel.refresh(); // Elimina el true, no se necesita
                        } else {
                            sap.m.MessageToast.show("Error al eliminar el proyecto");
                        }
                    } catch (error) {
                        console.error("Error eliminando el proyecto:", error);
                        sap.m.MessageToast.show("Error al eliminar el proyecto");
                    }
                }
            }.bind(this)
        });
    },
    
    
    



 




      onNavToView1: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
        console.log("Navigating to View1");

        oRouter.navTo("viewNoParam");
      },
    });
  }
);
