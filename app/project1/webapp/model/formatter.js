// webapp/util/formatter.js
sap.ui.define([], function () {
  "use strict";
  return {
    formatOfertaIcon: function (bValue) {
      return bValue ? "sap-icon://accept" : "sap-icon://decline";
    },
    formatOfertaColor: function (bValue) {
      return bValue ? "green" : "red";
    },

    testFormatter: function (bValue) {
      console.log("Formatter testFormatter value:", bValue);
      return bValue ? "Sí hay oferta" : "No hay oferta";
    },
    statusText: function (oferta) {
      return oferta ? "true" : "false";
    },
    statusState: function (oferta) {
      return oferta ? "Success" : "Error";
    }
  };
});
