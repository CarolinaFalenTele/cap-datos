sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/CustomData","sap/ui/core/format/DateFormat"],function(e,t,o){"use strict";return e.extend("project1.controller.App",{onInit:function(){var e=this.byId("processflow1");e.attachNodePress(this.onNodePress,this);this._loadProjectData();const t=this.getOwnerComponent().getRouter();t.getRoute("app").attachPatternMatched(this._onObjectMatched,this);this.bProcessFlowAllowed=false;this.loadFilteredData();this.loadFilteredDataPend();this.getUserInfo()},getUserInfo:function(){fetch("/odata/v4/datos-cdo/getUserInfo").then(e=>{if(!e.ok){throw new Error("No se pudo obtener la información del usuario.")}return e.json()}).then(e=>{const t=e.value;if(t){this.byId("dddtg")?.setText(t.email);this.byId("233")?.setText(t.fullName);console.log("📌 Datos seteados en la vista:",t)}else{console.error("No se encontró la información del usuario.")}}).catch(e=>{console.error("❌ Error obteniendo datos del usuario:",e)})},loadFilteredData:function(){var e=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Aprobado");var t=this.byId("idProductsTable");var o=t.getBinding("items");if(o){o.filter([e]);this.updateIconTabFilterCount(o)}else{t.attachEventOnce("updateFinished",function(){var o=t.getBinding("items");o.filter([e]);this.updateIconTabFilterCount(o)}.bind(this))}},updateIconTabFilterCount:function(e){e.attachEventOnce("dataReceived",function(){var t=e.getLength();this.byId("ma55").setCount(t.toString())}.bind(this))},loadFilteredDataPend:function(){var e=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Pendiente");var t=this.byId("idPendientes");var o=t.getBinding("items");if(o){o.filter([e]);this.updateIconTabFilterCountPen(o)}else{t.attachEventOnce("updateFinished",function(){var o=t.getBinding("items");o.filter([e]);this.updateIconTabFilterCountPen(o)}.bind(this))}},updateIconTabFilterCountPen:function(e){e.attachEventOnce("dataReceived",function(){var t=e.getLength();this.byId("ma3").setCount(t.toString())}.bind(this))},onSearch:function(e){var t=e.getParameter("newValue");var o=this.byId("idPendientes");var i=o.getBinding("items");var s=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Pendiente");var a=[s];if(t&&t.length>0){var n=new sap.ui.model.Filter({path:"nameProyect",operator:sap.ui.model.FilterOperator.Contains,value1:t.toLowerCase(),caseSensitive:false});a.push(n)}var r=new sap.ui.model.Filter({filters:a,and:true});i.filter(r)},onSearchApro:function(e){var t=e.getParameter("newValue");var o=this.byId("idProductsTable");var i=o.getBinding("items");var s=new sap.ui.model.Filter("Estado",sap.ui.model.FilterOperator.EQ,"Aprobado");var a=[s];if(t&&t.length>0){var n=new sap.ui.model.Filter({path:"nameProyect",operator:sap.ui.model.FilterOperator.Contains,value1:t.toLowerCase(),caseSensitive:false});a.push(n)}var r=new sap.ui.model.Filter({filters:a,and:true});i.filter(r)},onActivityPress:function(e){var t=e.getSource();var o=t.getCustomData()[0].getValue();var i=t.getCustomData()[1].getValue();var s=this.byId("idTitleProceso");s.setText("Proceso de solicitud: "+o);var a=this.byId("text1881");a.setText("PEP de solicitud: "+i);var n=this.byId("processflow1");n.removeAllNodes();this.bProcessFlowAllowed=true;n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"solicitanteCdoNode",title:o,laneId:"0",state:"Positive",stateText:"Solicitud Iniciada",children:["revisarTQNode"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisarTQNode",title:"Requiere Basis/TQ/Factoria",laneId:"1",state:"Neutral",stateText:"Esperando Revisión",children:["revisionTQNode","revisionPMONode"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionTQNode",title:"Revisión Basis/TQ/Factoria",laneId:"2",state:"Neutral",stateText:"En Revisión",children:["revisionPMONode"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionPMONode",title:"Revisión PMO",laneId:"3",state:"Neutral",stateText:"Revisión PMO Pendiente",children:["rechazadoPMONode","revisionCdGNode"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"rechazadoPMONode",title:"Rechazado por PMO",laneId:"4",state:"Negative",stateText:"Solicitud Rechazada"}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionCdGNode",title:"Revisión Control de Gestión",laneId:"5",state:"Neutral",stateText:"En Revisión",children:["revisionDireccionNode"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"revisionDireccionNode",title:"Aprobado por Gestion",laneId:"6",state:"Positive",stateText:"Aprobada por Gestion",children:["ReviDirec"]}));n.addNode(new sap.suite.ui.commons.ProcessFlowNode({nodeId:"ReviDirec",title:"Revisión Dirección/CdO",laneId:"8",state:"Neutral",stateText:"Aprobada por Dirección"}));var r=this.byId("itb1");r.setSelectedKey("people");n.attachNodePress(this.onNodePress.bind(this))},onNodePress:function(e){var t=e.getParameters().getNodeId();var o=this.byId("processflow1");var i=o.getNodes();var s=i.find(function(e){return e.getNodeId()===t});if(!s){console.error("Nodo no encontrado");return}var a=s.getTitle();var n=s.getStateText();if(!this._oPopover){this._oPopover=new sap.m.Popover({title:"Detalles",placement:sap.m.PlacementType.Auto,content:[new sap.m.Text({text:""}),new sap.m.Button({text:"Cerrar",press:function(){this._oPopover.close()}.bind(this)})]})}var r=this._oPopover.getContent()[0];var d;if(n==="Estado1"){d="Solicitud Enviado Correctamente. \nTítulo: "+a}else if(n==="Estado2"){d="Información adicional para Estado2. \nTítulo: "+a}else{d="Nodo: "+a+"\nEstado: "+n}r.setText(d);this._oPopover.openBy(e.getSource());this.getView().addDependent(this._oPopover)},onIconTabSelect:function(e){var t=e.getParameter("key");var o=this.byId("itb1");var i=this.byId("ma77");if(t==="people"&&!this.bProcessFlowAllowed){sap.m.MessageBox.show("Por favor, seleccione una solicitud en la pestaña de solicitudes para ver el proceso.",{title:"Advertencia",actions:[sap.m.MessageBox.Action.OK],onClose:function(e){}});o.setSelectedKey("attachments");return}if(this.bProcessFlowAllowed){i.setVisible(true)}else{i.setVisible(false)}},onAfterShow:function(){this._loadProjectData()},_loadProjectData:function(){const e=this.byId("idPendientes");const t=e.getBinding("items");if(t){t.refresh()}},_onObjectMatched:function(e){const t=e.getParameter("arguments").newId;if(!t){console.error("No se recibió un ID válido");return}this._highlightNewRow(t)},_highlightNewRow:function(e){const t=this.byId("idPendientes");if(t.getItems().length>0){this._processTableRows(t,e)}else{t.attachEventOnce("updateFinished",()=>{this._processTableRows(t,e)})}this._refreshTableData(t)},_processTableRows:function(e,t){e.getItems().forEach(e=>{if(e.getBindingContext().getProperty("ID")===t){e.addStyleClass("highlight")}})},_refreshTableData:function(){const e=this.byId("idPendientes");if(e){e.getBinding("items")?.refresh()}},formatDate:function(e){if(!e){return""}var t=new Date(e);if(isNaN(t.getTime())){return e}var i=o.getInstance({pattern:"dd MMM yyyy",UTC:true});return i.format(t)},onEditPress:function(e){var t=e.getSource();var o=t.getCustomData()[0].getValue();var i=t.getCustomData().find(function(e){return e.getKey()==="projectId"}).getValue();if(!i){console.error("El ID del proyecto es nulo o indefinido");return}var s=this;var a=this.getView().getModel("mainService");if(a){a.setData({});a.refresh(true)}var n=new sap.m.Dialog({title:"Confirmar Edición",type:"Message",state:"Warning",content:new sap.m.Text({text:"¿Estás seguro de que quieres editar el proyecto '"+o+"'?"}),beginButton:new sap.m.Button({text:"Confirmar",press:function(){n.close();var e=sap.ui.core.UIComponent.getRouterFor(s);e.navTo("view",{sProjectID:i},true)}}),endButton:new sap.m.Button({text:"Cancelar",press:function(){n.close()}})});n.open()},onView:function(e){if(!this.Dialog){this.Dialog=this.loadFragment({name:"project1.view.Dialog"})}this.Dialog.then(function(e){this.oDialog=e;this.oDialog.open()}.bind(this))},_closeDialog:function(){this.oDialog.close()},DialogInfo:async function(e){this.onView();var t=e.getSource();var o=t.getCustomData().find(function(e){return e.getKey()==="projectId"}).getValue();console.log("Metodo project "+o);const i=this._sCsrfToken;var s=this.getView().getModel("mainService");if(s){s.setData({});s.refresh(true)}var a=`/odata/v4/datos-cdo/DatosProyect(${o})`;try{const e=await fetch(a,{method:"GET",headers:{Accept:"application/json","Content-Type":"application/json","x-csrf-token":i}});if(!e.ok){const t=await e.text();throw new Error("Network response was not ok: "+t)}const t=await e.json();console.log(JSON.stringify(t));this.byId("idNombreProyecto").setText(t.nameProyect);this.byId("idDescripcion1").setText(t.descripcion);this.byId("idCreador").setText(t.Empleado);this.byId("fechainitProyect").setText(t.Fechainicio);const o=sap.ui.core.format.DateFormat.getDateTimeInstance({style:"medium"});const s=new Date(t.fechaCreacion);const u=o.format(s);this.byId("idCreacion").setText(u);var n=t.FechaFin.split("T")[0];var r=n.split("-");var d=r[2]+"-"+r[1]+"-"+r[0];this.byId("idFechaFinProyect").setText(d);this.byId("idEstadoProyect").setText(t.Estado);this.byId("idArea").setText(t.Area_ID.NombreArea);var c=new Intl.NumberFormat("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t.Total);var l=c+" €";this.byId("idtotal").setText(l)}catch(e){console.error("Error al obtener los datos del proyecto:",e);sap.m.MessageToast.show("Error al cargar los datos del proyecto")}},onDeletePress:async function(e){let t=this.getView().getModel();let o=t.sServiceUrl;let i=e.getSource();let s=i.getCustomData()[0].getValue();if(!s){console.error("No se encontró un ID válido para eliminar.");sap.m.MessageToast.show("Error: No se encontró un ID válido.");return}console.log("🔴 Eliminando Proyecto con ID:",s);try{let e=await fetch(o,{method:"GET",headers:{"x-csrf-token":"Fetch"}});if(!e.ok)throw new Error("Error al obtener el CSRF Token");let i=e.headers.get("x-csrf-token");if(!i)throw new Error("No se recibió un CSRF Token");console.log("✅ CSRF Token obtenido:",i);sap.m.MessageBox.confirm("¿Deseas eliminar este proyecto y todos sus registros relacionados?",{actions:[sap.m.MessageBox.Action.YES,sap.m.MessageBox.Action.NO],onClose:async e=>{if(e!==sap.m.MessageBox.Action.YES)return;try{const e=["planificacion","Facturacion","ClientFactura","ProveedoresC","RecursosInternos","ConsumoExternos","RecursosExternos","otrosConceptos","otrosGastoRecu","otrosRecursos","otrosServiciosConsu","GastoViajeConsumo","serviRecurExter","GastoViajeRecExter","LicenciasCon"];let o=e.map(async e=>{let t=await fetch(`/odata/v4/datos-cdo/DatosProyect(${s})/${e}`,{method:"GET",headers:{"Content-Type":"application/json","x-csrf-token":i}});if(!t.ok){console.warn(`⚠️ No se pudieron obtener los registros de ${e}`);return}let o=t.headers.get("Content-Type");let a=o&&o.includes("application/json")?await t.json():{value:[]};let n=Array.isArray(a.value)?a.value:[a];if(n.length>0){return Promise.all(n.map(async t=>{let o=await fetch(`/odata/v4/datos-cdo/${e}(${t.ID})`,{method:"DELETE",headers:{"Content-Type":"application/json","x-csrf-token":i}});if(!o.ok){console.error(`❌ Error eliminando ${e} con ID ${t.ID}`)}else{console.log(`✅ ${e} eliminado: ${t.ID}`)}}))}});await Promise.all(o);console.log("✅ Registros relacionados eliminados.");let a=await fetch(`/odata/v4/datos-cdo/DatosProyect(${s})`,{method:"DELETE",headers:{"Content-Type":"application/json","x-csrf-token":i}});if(a.ok){console.log("✅ Proyecto eliminado correctamente.");sap.m.MessageBox.success("Proyecto y registros eliminados exitosamente.",{title:"Éxito",actions:[sap.m.MessageBox.Action.OK],onClose:function(){let e=this.byId("idPendientes");if(e){e.getBinding("items")?.refresh()}t.refresh()}.bind(this)})}else{throw new Error("Error al eliminar el proyecto principal")}}catch(e){console.error("❌ Error eliminando el proyecto o registros:",e);sap.m.MessageToast.show("Error al eliminar el proyecto o registros.")}}})}catch(e){console.error("❌ Error al obtener el CSRF Token:",e);sap.m.MessageToast.show("Error al obtener el CSRF Token.")}},onNavToView1:function(){var e=sap.ui.core.UIComponent.getRouterFor(this);var t=this.getOwnerComponent();var o=t.byId("view");if(!o){console.warn("No se encontró la vista objetivo.");e.navTo("viewNoParam");return}function i(e){if(e instanceof sap.m.Input){e.setValue("")}else if(e instanceof sap.m.Select||e instanceof sap.m.ComboBox){e.setSelectedKey("")}else if(e instanceof sap.m.DatePicker){e.setDateValue(null)}else if(e instanceof sap.m.TextArea){e.setValue("")}else if(e instanceof sap.m.CheckBox){e.setSelected(false)}if(e.getAggregation){const t=e.getMetadata().getAllAggregations();for(let o in t){const t=e.getAggregation(o);if(Array.isArray(t)){t.forEach(i)}else if(t instanceof sap.ui.core.Control){i(t)}}}}o.findAggregatedObjects(false,i);e.navTo("viewNoParam")}})});
//# sourceMappingURL=App.controller.js.map