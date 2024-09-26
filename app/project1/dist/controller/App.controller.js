sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/CustomData"],function(e,t){"use strict";return e.extend("project1.controller.App",{onInit:function(){this._loadProjectData();const e=this.getOwnerComponent().getRouter();e.getRoute("app").attachPatternMatched(this._onObjectMatched,this)},onAfterShow:function(){this._loadProjectData()},_loadProjectData:function(){const e=this.byId("idPendientes");const t=e.getBinding("items");if(t){t.refresh()}},_onObjectMatched:function(e){console.log("Parámetros del evento:",e.getParameters());const t=e.getParameter("arguments").newId;console.log("ID de nuevo:",t);this._highlightNewRow(t)},_highlightNewRow:function(e){const t=this.byId("idPendientes");const o=t.getItems();o.forEach(t=>{const o=t.getCells().find(e=>e.getId().endsWith("butn34"));if(o){const n=o.getCustomData().find(e=>e.getKey()==="projectId");if(n){const o=n.getValue();if(o===e){t.addStyleClass("highlightRow")}}}})},onEditPress:function(e){var t=e.getSource();var o=t.getCustomData().find(function(e){return e.getKey()==="projectId"}).getValue();if(!o){console.error("El ID del proyecto es nulo o indefinido");return}else{console.log("ID Correct",o)}var n=sap.ui.core.UIComponent.getRouterFor(this);n.navTo("view",{sProjectID:o})},onDeletePress:async function(e){var t=e.getSource();var o=t.getCustomData()[0].getValue();console.log(o);sap.m.MessageBox.confirm("¿Estás seguro de que deseas eliminar este proyecto?",{actions:[sap.m.MessageBox.Action.YES,sap.m.MessageBox.Action.NO],onClose:async function(e){if(e===sap.m.MessageBox.Action.YES){try{let e=await fetch(`/odata/v4/datos-cdo/DatosProyect(${o})`,{method:"DELETE",headers:{"Content-Type":"application/json"}});if(e.ok){sap.m.MessageToast.show("Proyecto eliminado exitosamente");const e=this.byId("idPendientes");const t=e.getBinding("items");t.refresh()}else{sap.m.MessageToast.show("Error al eliminar el proyecto")}}catch(e){console.error("Error eliminando el proyecto:",e);sap.m.MessageToast.show("Error al eliminar el proyecto")}}}.bind(this)})},onNavToView1:function(){var e=sap.ui.core.UIComponent.getRouterFor(this);console.log("Navigating to View1");e.navTo("viewNoParam")}})});
//# sourceMappingURL=App.controller.js.map