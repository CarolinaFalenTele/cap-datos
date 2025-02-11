sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/CustomData","sap/ui/core/format/DateFormat"],function(e,o,t){"use strict";return e.extend("project1.controller.App",{onInit:function(){var e=this.byId("processflow1");e.attachNodePress(this.onNodePress,this);this._loadProjectData();const o=this.getOwnerComponent().getRouter();o.getRoute("app").attachPatternMatched(this._onObjectMatched,this);this.bProcessFlowAllowed=false;this.loadFilteredData();this.loadFilteredDataPend();console.log("Vista de appp "+this.getView())},loadFilteredData:function(){var e=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Aprobado");var o=this.byId("idProductsTable");var t=o.getBinding("items");if(t){t.filter([e]);this.updateIconTabFilterCount(t)}else{o.attachEventOnce("updateFinished",function(){var t=o.getBinding("items");t.filter([e]);this.updateIconTabFilterCount(t)}.bind(this))}},updateIconTabFilterCount:function(e){e.attachEventOnce("dataReceived",function(){var o=e.getLength();this.byId("ma55").setCount(o.toString())}.bind(this))},loadFilteredDataPend:function(){var e=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Pendiente");var o=this.byId("idPendientes");var t=o.getBinding("items");if(t){t.filter([e]);this.updateIconTabFilterCountPen(t)}else{o.attachEventOnce("updateFinished",function(){var t=o.getBinding("items");t.filter([e]);this.updateIconTabFilterCountPen(t)}.bind(this))}},updateIconTabFilterCountPen:function(e){e.attachEventOnce("dataReceived",function(){var o=e.getLength();this.byId("ma3").setCount(o.toString())}.bind(this))},onSearch:function(e){var o=e.getParameter("newValue");var t=this.byId("idPendientes");var n=t.getBinding("items");var a=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Pendiente");var s=[a];if(o&&o.length>0){var i=new sap.ui.model.Filter({path:"nameProyect",operator:sap.ui.model.FilterOperator.Contains,value1:o.toLowerCase(),caseSensitive:false});s.push(i)}var r=new sap.ui.model.Filter({filters:s,and:true});n.filter(r)},onSearchApro:function(e){var o=e.getParameter("newValue");var t=this.byId("idProductsTable");var n=t.getBinding("items");var a=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Aprobado");var s=[a];if(o&&o.length>0){var i=new sap.ui.model.Filter({path:"nameProyect",operator:sap.ui.model.FilterOperator.Contains,value1:o.toLowerCase(),caseSensitive:false});s.push(i)}var r=new sap.ui.model.Filter({filters:s,and:true});n.filter(r)},onActivityPress:function(e){var o=e.getSource();var t=o.getCustomData()[0].getValue();var n=o.getCustomData()[1].getValue();var a=this.byId("idTitleProceso");a.setText("Proceso de solicitud: "+t);var s=this.byId("text1881");s.setText("PEP de solicitud: "+n);var i=this.byId("processflow1");i.removeAllNodes();this.bProcessFlowAllowed=true;i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"solicitanteCdoNode",title:t,laneId:"0",state:"Positive",stateText:"Solicitud Iniciada",children:["revisarTQNode"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisarTQNode",title:"Requiere Basis/TQ/Factoria",laneId:"1",state:"Neutral",stateText:"Esperando Revisión",children:["revisionTQNode","revisionPMONode"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionTQNode",title:"Revisión Basis/TQ/Factoria",laneId:"2",state:"Neutral",stateText:"En Revisión",children:["revisionPMONode"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionPMONode",title:"Revisión PMO",laneId:"3",state:"Neutral",stateText:"Revisión PMO Pendiente",children:["rechazadoPMONode","revisionCdGNode"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"rechazadoPMONode",title:"Rechazado por PMO",laneId:"4",state:"Negative",stateText:"Solicitud Rechazada"}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionCdGNode",title:"Revisión Control de Gestión",laneId:"5",state:"Neutral",stateText:"En Revisión",children:["revisionDireccionNode"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionDireccionNode",title:"Aprobado por Gestion",laneId:"6",state:"Positive",stateText:"Aprobada por Gestion",children:["ReviDirec"]}));i.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"ReviDirec",title:"Revisión Dirección/CdO",laneId:"8",state:"Neutral",stateText:"Aprobada por Dirección"}));var r=this.byId("itb1");r.setSelectedKey("people");i.attachNodePress(this.onNodePress.bind(this))},onNodePress:function(e){var o=e.getParameters().getNodeId();var t=this.byId("processflow1");var n=t.getNodes();var a=n.find(function(e){return e.getNodeId()===o});if(!a){console.error("Nodo no encontrado");return}var s=a.getTitle();var i=a.getStateText();if(!this._oPopover){this._oPopover=new sap.m.Popover({title:"Detalles",placement:sap.m.PlacementType.Auto,content:[new sap.m.Text({text:""}),new sap.m.Button({text:"Cerrar",press:function(){this._oPopover.close()}.bind(this)})]})}var r=this._oPopover.getContent()[0];var l;if(i==="Estado1"){l="Solicitud Enviado Correctamente. \nTítulo: "+s}else if(i==="Estado2"){l="Información adicional para Estado2. \nTítulo: "+s}else{l="Nodo: "+s+"\nEstado: "+i}r.setText(l);this._oPopover.openBy(e.getSource());this.getView().addDependent(this._oPopover)},onIconTabSelect:function(e){var o=e.getParameter("key");var t=this.byId("itb1");var n=this.byId("ma77");if(o==="people"&&!this.bProcessFlowAllowed){sap.m.MessageBox.show("Por favor, seleccione una solicitud en la pestaña de solicitudes para ver el proceso.",{title:"Advertencia",actions:[sap.m.MessageBox.Action.OK],onClose:function(e){}});t.setSelectedKey("attachments");return}if(this.bProcessFlowAllowed){n.setVisible(true)}else{n.setVisible(false)}},onAfterShow:function(){this._loadProjectData()},_loadProjectData:function(){const e=this.byId("idPendientes");const o=e.getBinding("items");if(o){o.refresh()}},_onObjectMatched:function(e){const o=e.getParameter("arguments").newId;this._highlightNewRow(o)},_highlightNewRow:function(e){const o=this.byId("idPendientes");o.attachEventOnce("updateFinished",()=>{const t=o.getItems();console.log("Número de ítems en la tabla:",t.length);if(t.length===0){console.log("No hay ítems en la tabla.");return}let n=false;t.forEach(o=>{const t=o.getCells().find(e=>e.getId().endsWith("butn34"));console.log("Botón encontrado:",t);if(t){const a=t.getCustomData().find(e=>e.getKey()==="projectId");console.log("CustomData encontrado:",a?a.getValue():"No encontrado");if(a){const t=a.getValue();console.log("Comparando IDs:",t,e);if(t===e){console.log("Resaltando fila con ID:",t);o.addStyleClass("highlight-border");n=true}}}});if(!n){console.log("No se encontró una fila con el ID:",e)}o.rerender()})},formatDate:function(e){if(!e){return""}var o=new Date(e);if(isNaN(o.getTime())){return e}var n=t.getInstance({pattern:"dd MMM yyyy",UTC:true});return n.format(o)},onEditPress:function(e){var o=e.getSource();var t=o.getCustomData().find(function(e){return e.getKey()==="projectId"}).getValue();if(!t){console.error("El ID del proyecto es nulo o indefinido");return}else{console.log("ID Correct",t)}var n=sap.ui.core.UIComponent.getRouterFor(this);n.navTo("view",{sProjectID:t})},onDeletePress:async function(e){let o=this.getView().getModel();let t=o.sServiceUrl;let n=e.getSource();let a=n.getCustomData()[0].getValue();if(!a){console.error("No se encontró un ID válido para eliminar.");sap.m.MessageToast.show("Error: No se encontró un ID válido.");return}console.log("ID del Proyecto a eliminar:",a);try{let e=await fetch(t,{method:"GET",headers:{"x-csrf-token":"Fetch"}});if(!e.ok){throw new Error("Error al obtener el CSRF Token")}let n=e.headers.get("x-csrf-token");if(!n){throw new Error("No se recibió un CSRF Token")}console.log("✅ CSRF Token obtenido:",n);sap.m.MessageBox.confirm("¿Estás seguro de que deseas eliminar este proyecto y todos sus registros relacionados?",{actions:[sap.m.MessageBox.Action.YES,sap.m.MessageBox.Action.NO],onClose:async e=>{if(e===sap.m.MessageBox.Action.YES){try{const e=[`planificacion`,`Facturacion`,`ClientFactura`,`ProveedoresC`,`RecursosInternos`,`ConsumoExternos`,`RecursosExternos`,`otrosConceptos`];for(let o of e){let e=await fetch(`/odata/v4/datos-cdo/DatosProyect(${a})/${o}`,{method:"GET",headers:{"Content-Type":"application/json","x-csrf-token":n}});if(!e.ok){console.error(`Error al obtener los registros de ${o}`);continue}const t=e.headers.get("Content-Type");if(t&&t.includes("application/json")){const t=await e.json();if(Array.isArray(t.value)&&t.value.length>0){for(let e of t.value){console.log(`Eliminando hijo con ID ${e.ID} en ${o}`);let t=await fetch(`/odata/v4/datos-cdo/${o}(${e.ID})`,{method:"DELETE",headers:{"Content-Type":"application/json","x-csrf-token":n}});if(!t.ok){console.error(`Error al eliminar el hijo en ${o}: ${e.ID}`)}else{console.log(`Hijo eliminado exitosamente en ${o}: ${e.ID}`)}}}else if(t.ID){console.log(`Eliminando objeto único con ID ${t.ID} en ${o}`);let e=await fetch(`/odata/v4/datos-cdo/${o}(${t.ID})`,{method:"DELETE",headers:{"Content-Type":"application/json","x-csrf-token":n}});if(!e.ok){console.error(`Error al eliminar el hijo en ${o}: ${t.ID}`)}else{console.log(`Hijo eliminado exitosamente en ${o}: ${t.ID}`)}}else{console.log(`No se encontró ningún ID en la respuesta de ${o}`)}}else{console.warn(`La respuesta de ${o} no es JSON o está vacía.`);continue}}console.log("Eliminando el proyecto principal con ID:",a);let t=await fetch(`/odata/v4/datos-cdo/DatosProyect(${a})`,{method:"DELETE",headers:{"Content-Type":"application/json","x-csrf-token":n}});if(t.ok){console.log("Proyecto eliminado exitosamente.");sap.m.MessageToast.show("Proyecto y sus hijos eliminados exitosamente");const e=this.byId("idPendientes");if(e){const o=e.getBinding("items");if(o){o.refresh()}}o.refresh()}else{console.error("Error al eliminar el proyecto principal.");sap.m.MessageToast.show("Error al eliminar el proyecto")}}catch(e){console.error("Error eliminando el proyecto o sus hijos:",e);sap.m.MessageToast.show("Error al eliminar el proyecto o sus hijos")}}}})}catch(e){console.error("Error al obtener el CSRF Token:",e);sap.m.MessageToast.show("Error al obtener el CSRF Token")}},onNavToView1:function(){var e=sap.ui.core.UIComponent.getRouterFor(this);var o=this.getOwnerComponent();var t=o.byId("view");if(!t){console.warn("No se encontró la vista objetivo.");e.navTo("viewNoParam");return}function n(e){if(e instanceof sap.m.Input){e.setValue("")}else if(e instanceof sap.m.Select||e instanceof sap.m.ComboBox){e.setSelectedKey("")}else if(e instanceof sap.m.DatePicker){e.setDateValue(null)}else if(e instanceof sap.m.TextArea){e.setValue("")}else if(e instanceof sap.m.CheckBox){e.setSelected(false)}if(e.getAggregation){const o=e.getMetadata().getAllAggregations();for(let t in o){const o=e.getAggregation(t);if(Array.isArray(o)){o.forEach(n)}else if(o instanceof sap.ui.core.Control){n(o)}}}}t.findAggregatedObjects(false,n);e.navTo("viewNoParam")}})});
//# sourceMappingURL=App.controller.js.map