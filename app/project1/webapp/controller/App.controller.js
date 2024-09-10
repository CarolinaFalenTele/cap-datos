sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("project1.controller.App", {
        onInit: function() {

        //  this._loadProjectData();


        },



        onEditPress: function(oEvent) {
          // Obtener el botón que fue presionado
          var oButton = oEvent.getSource();
          
          // Obtener el valor de CustomData (ID del proyecto)
          var sProjectID = oButton.getCustomData().find(function(oData) {
              return oData.getKey() === "projectId";  // Usamos "projectId" como clave para obtener el ID
          }).getValue();
      
          // Verifica que sProjectID tiene un valor válido
          if (!sProjectID) {
              console.error("El ID del proyecto es nulo o indefinido");
              return;
          }else{
            console.log("ID Correct", sProjectID)        
          }
      
          // Navegar a la vista del formulario correspondiente, pasando el ID del proyecto
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.navTo("view", {
              sProjectID: sProjectID  // Asegúrate de que "sProjectID" coincida con lo que tienes en manifest.json
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
  