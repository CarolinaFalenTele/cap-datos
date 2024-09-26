sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
      "sap/ui/core/CustomData"
  ],
  function (BaseController, CustomData) {
    "use strict";

    return BaseController.extend("project1.controller.App", {
      onInit: function () {



        this._loadProjectData();
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("app").attachPatternMatched(this._onObjectMatched, this);


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
    
                            const oTable = this.byId("idPendientes");
                            const oBinding = oTable.getBinding("items");
                    
                              oBinding.refresh(); // Refresca los datos de la tabla
                     


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
