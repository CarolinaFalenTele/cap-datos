sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
  
      return BaseController.extend("project1.controller.App", {
        onInit: function() {
        },
        onNavToView1: function () {
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
  
          // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
          console.log("Navigating to View1");
  
          oRouter.navTo("view");
        },
      });
    }
  );
  