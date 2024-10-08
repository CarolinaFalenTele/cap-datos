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
