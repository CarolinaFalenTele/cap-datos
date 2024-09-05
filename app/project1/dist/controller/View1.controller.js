sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/format/DateFormat","sap/viz/ui5/controls/VizFrame","sap/ui/model/odata/v4/ODataModel","sap/m/MessageToast","sap/ui/model/Sorter","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/FilterType","sap/ui/model/json/JSONModel"],function(e,t,o,a,n,i,r,l,s){"use strict";return e.extend("project1.controller.View1",{onInit:function(){},onSave:async function(){const e=parseInt(this.byId("input0").getValue(),10);const t=this.byId("input1").getValue();const o=this.byId("box_pluriAnual").getSelected();const a=this.byId("id_Cfactur").getValue();const n=this.byId("box_multiJuridica").getSelected();const i=this.byId("date_inico").getDateValue();const r=this.byId("date_fin").getDateValue();const l=this.byId("int_clienteFun").getValue();const s={codigoProyect:e,nameProyect:t,pluriAnual:o,clienteFacturacion:a,multijuridica:n,Fechainicio:i,FechaFin:r,clienteFuncional:l};try{const e=await fetch("/odata/v4/datos-cdo/DatosProyect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(e.ok){console.log("Producto guardado con éxito.")}else{const t=await e.text();console.error("Error al guardar el producto:",t)}}catch(e){if(e.message.includes("401")){console.error("Token expirado o inválido, redirigiendo al inicio de sesión.")}else{console.error("Error en la llamada al servicio:",e)}}},onprueba:function(e){var t=this.byId("table1");if(!t){console.error("No se encontró la tabla.");return}var o=t.getItems();if(o.length===0){console.warn("No hay ítems en la tabla.");return}o.forEach(function(e){var t=e.getBindingContext();if(!t){console.error("No se encontró el contexto de enlace para el ítem.");return}var o=t.getObject();console.log("Hito/Fase:",o.hito);console.log("Fecha Inicio:",o.fecha_inicio);console.log("Fecha Fin:",o.fecha_fin)})},onselectFun:function(e){var t=this.byId("slct_client");var o=t.getSelectedItem();if(o){var a=o.getKey();var n=o.getText();console.log("Selected Key:",a);console.log("Selected Text:",n)}else{console.log("No item selected")}},onSelectIniMethod:function(e){this.onInputChange(e);this.onSelectOpx(e)},onselectmethodsetinfo:function(e){this.onInputChange(e);this.fechasDinamicas(e)},onAddRowPress:function(e){console.log(e);var t=this.byId(e);if(t){var o=new sap.m.ColumnListItem({cells:[new sap.m.Select({selectedKey:"{Vertical>valueVertical}",forceSelection:false,items:{path:"/Vertical",template:new sap.ui.core.Item({key:"{ID}",text:"{NombreVertical}"})}}),new sap.m.Select({selectedKey:"{TipoServicio>valueTipoServ}",forceSelection:false,items:{path:"/TipoServicio",template:new sap.ui.core.Item({key:"{ID}",text:"{NombreTipoServ}"})}}),new sap.m.Select({selectedKey:"{PerfilServicio>valuePerfil}",forceSelection:false,items:{path:"/PerfilServicio",template:new sap.ui.core.Item({key:"{ID}",text:"{NombrePerfil}"})}}),new sap.m.Input({value:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""}),new sap.m.Text({text:""})]});t.addItem(o)}else{console.error("No se encontró la tabla con ID: "+e)}},onDateChange:function(){this.updateVizFrame()},fechasDinamicas:function(e){var t=this.getView().byId("date_inico");var o=this.getView().byId("date_fin");if(!t||!o){console.error("Error: No se pudieron obtener los DatePickers.");return}var a=t.getDateValue();var n=o.getDateValue();if(!a||!n){console.log("Esperando a que se seleccionen ambas fechas.");return}var i=this.getMonthsDifference(a,n);var r=this.getView().byId("table_dimicFecha");var l=this.findTotalColumnIndex(r);if(l===-1){console.error("Error: No se encontró la columna 'Total'.");return}var s=r.getColumns().length;for(var c=s-1;c>l;c--){r.removeColumn(c)}for(var d=0;d<=i;d++){var u=new Date(a.getFullYear(),a.getMonth()+d,1);var g=u.getFullYear();var h=u.toLocaleString("default",{month:"long"});var m=g+"-"+h;var f=new sap.m.Column({header:new sap.m.Label({text:m}),width:"100px"});r.insertColumn(f,l+1+d)}var v=this.getView().byId("scroll_container");v.setHorizontal(true);v.setVertical(false);v.setWidth("100%");console.log("startDate:",a);console.log("endDate:",n)},findTotalColumnIndex:function(e){var t=e.getColumns();for(var o=0;o<t.length;o++){var a=t[o].getHeader();if(a&&a.getText()==="Total"){return o}}return-1},getMonthsDifference:function(e,t){var o=(t.getFullYear()-e.getFullYear())*12;o-=e.getMonth();o+=t.getMonth();return o},updateVizFrame:function(){var e=this.oModel.getData();console.log(e);var t=sap.ui.core.format.DateFormat.getInstance({pattern:"yyyy-MM-dd"});var o=e.milestones.map(function(e){var o=t.parse(e.fechaInicio);var a=t.parse(e.fechaFin);var n=(a-o)/(1e3*60*60*24);return{hito:e.hito,fechaInicio:t.format(o),duracion:n}});this.oModel.setProperty("/chartData",o);console.log("aChartData")},onNavToView1:function(){var e=sap.ui.core.UIComponent.getRouterFor(this);console.log("Navigating to View1");e.navTo("app")},onSelectOpx:function(e){var t=e.getParameter("selectedItem").getKey();console.log(t);var o=this.getView().byId("table0");if(t==="Opex Servicios"){o.setVisible(false)}else{o.setVisible(true)}},onCheckBoxSelectMulti:function(e){console.log("onCheckBoxSelect called");var t=e.getSource();var o=t.getSelected();console.log("Checkbox selected: ",o);var a=this.byId("table_clienteFac");console.log("Table found: ",!!a);if(a){a.setVisible(o)}},onInputChange:function(){var e=this.getView();var t=this.byId("input0").getValue();var o=this.byId("input1").getValue();var a=this.byId("id_Cfactur").getValue();var n=this.byId("int_clienteFun").getValue();console.log(t,o);var i=this.byId("slct_area");var r="";var l="";if(i&&i.getSelectedItem()){r=i.getSelectedItem().getText();l=i.getSelectedItem().getKey();console.log("Selected Key:",l);console.log("Selected Text:",r)}var s=this.byId("slct_Jefe");var c="";if(s&&s.getSelectedItem()){c=s.getSelectedItem().getText();console.log("Selected Jefe Text:",c)}var d=this.byId("slct_client");var u="";if(d&&d.getSelectedItem()){u=d.getSelectedItem().getText();console.log("Selected Function Text:",u)}var g=this.byId("date_inico");var h=g?g.getDateValue():null;var m="";if(h){m=sap.ui.core.format.DateFormat.getDateTimeInstance({pattern:"yyyy-MM-dd"}).format(h)}var f=this.byId("slct_inic");var v="";if(f&&f.getSelectedItem()){v=f.getSelectedItem().getText();console.log("Selected Function Text:",v)}var x=this.byId("date_fin");var p=x?x.getDateValue():null;var I="";if(p){I=sap.ui.core.format.DateFormat.getDateTimeInstance({pattern:"yyyy-MM-dd"}).format(p)}console.log("Formatted Start Date: ",m);console.log("Formatted End Date: ",I);this.byId("txt_codig").setText(t);this.byId("txt_nomPro").setText(o);this.byId("txt_area").setText(r);this.byId("txt_NomJefe").setText(c);this.byId("txt_funcio").setText(n);this.byId("txt_feIni").setText(m);this.byId("txt_feFin").setText(I);this.byId("txt_ini").setText(v);this.byId("txt_client").setText(n);this.byId("txt_cFactura").setText(a);this.byId("txt_Codi2").setText(t);this.byId("txt_Nombre2").setText(o);this.byId("txt_area2").setText(r);this.byId("txt_Fe_ini2").setText(m);this.byId("txt_Fe_fin2").setText(I)},onSelectCheckbox:function(e){var t=this.byId("table2");var o=t.getColumns();var a=t.getItems();var n=e.getSource().getSelected();var i=e.getSource().getParent().getParent().indexOfColumn(e.getSource().getParent());var r=i===0?"box_prove":"box_condi";var l=this.byId(r);l.setEnabled(!n);o.forEach(function(e,t){a.forEach(function(e){var o=e.getCells()[t];o.setEditable(t===i?n:!n)})})}})});
//# sourceMappingURL=View1.controller.js.map