
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/format/DateFormat",
  "sap/viz/ui5/controls/VizFrame",
  "sap/ui/model/odata/v4/ODataModel",
  'sap/m/MessageToast',
  "sap/ui/model/Sorter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/FilterType",
  "sap/ui/model/json/JSONModel",

],

  function (Controller, VizFrame, MessageToast, ODataModel, Sorter, Filter, FilterOperator, JSONModel, FilterType,) {
    "use strict";

    return Controller.extend("project1.controller.View1", {

      onInit: function () {



        // Crear un modelo inicial con los hitos y vincularlo a la vista
        var oModel = new sap.ui.model.json.JSONModel({
          milestones: [
            { fase: "Kick off", fechaInicio: null, fechaFin: null },
            { fase: "Diseño", fechaInicio: null, fechaFin: null },
            { fase: "Construcción", fechaInicio: null, fechaFin: null },
            { fase: "Pruebas TQ", fechaInicio: null, fechaFin: null },
            { fase: "Go live", fechaInicio: null, fechaFin: null },
            { fase: "Paso AM", fechaInicio: null, fechaFin: null },
            { fase: "Server post/prod", fechaInicio: null, fechaFin: null }
          ],
          chartData: [], // Inicializamos el chartData
        });
        this.getView().setModel(oModel, "planning");

        console.log(oModel);

        // Inicializar el gráfico con los datos actuales
        this.updateVizFrame1();

      },

      onFechaChange: function () {
        // Cuando se cambia una fecha en la tabla, se actualiza el gráfico
      //() this._updateChart();
        this.updateVizFrame1();

       
      },





      //---------------Grafico fechasvizframe para Fases  --------------------------------


      updateVizFrame1: function () {
        var oView = this.getView();

        var oModel = oView.getModel("planning");

        var oData = oModel.getData();

        var oDateFormat = sap.ui.core.format.DateFormat.getInstance({

          pattern: "yyyy-MM-dd",

        });

        var aChartData = oData.milestones.map(function (milestone) {

          var startDate = milestone.fechaInicio ? new Date(milestone.fechaInicio) : null;

          var endDate = milestone.fechaFin ? new Date(milestone.fechaFin) : null;

          if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {

            var duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // Convertir a días

            return {

              fase: milestone.fase,

              fechaInicio: oDateFormat.format(startDate),

              fechaFin: oDateFormat.format(endDate),

              duracion: duration,

              // Combinar la duración con las fechas para mostrar en las etiquetas

              label: `Inicio: ${oDateFormat.format(startDate)}, Fin: ${oDateFormat.format(endDate)}, Duración: ${duration} días`

            };

          } else {

            return null;

          }

        }).filter(Boolean);

        oModel.setProperty("/chartData", aChartData);


        var oFechas = {};
        aChartData.forEach(function(oHito) {
          if (oHito.fase === "Construcción") {
              oFechas.fechaInicioConstruccion = oHito.fechaInicio;
          }
          if (oHito.fase === "Pruebas TQ") {
              oFechas.fechaFinPruebasTQ = oHito.fechaFin;
          }
      });

     
 // Crear un modelo JSON para las fechas específicas
 var oFechasModel = new sap.ui.model.json.JSONModel({
  fechas: [
      { fase: "Fechas Importantes",
        fechaInicioConstruccion: oFechas.fechaInicioConstruccion,
        fechaFinPruebasTQ: oFechas.fechaFinPruebasTQ }
  ]
});

// Establecer el nuevo modelo en la vista
oView.setModel(oFechasModel, "fechasModel");

    

      },



      //------------------------------------------------- 

    



      // ---------- Metodo Save ----------------- 
      onSave: async function () {
        let errorCount = 0;
    
        // Recopila los datos del formulario principal
        const scodigoProyect = parseInt(this.byId("input0").getValue(), 10);
        const snameProyect = this.byId("input1").getValue();
        const spluriAnual = this.byId("box_pluriAnual").getSelected();
        const sClienteFac = this.byId("id_Cfactur").getValue();
        const sMultiJuri = this.byId("box_multiJuridica").getSelected();
        const sFechaIni = this.byId("date_inico").getDateValue();
        const sFechaFin = this.byId("date_fin").getDateValue();
        const sClienteFunc = this.byId("int_clienteFun").getValue();
        const sObjetivoAlcance = this.byId("idObje").getValue();
        const sAsunyRestric = this.byId("idAsunyRestri").getValue();
        const sSelectedKey = this.byId("idNatu").getSelectedKey();
        const sSelecKeyA = this.byId("slct_area").getSelectedKey();
        const sSelecKeyJe = this.byId("slct_Jefe").getSelectedKey();
        const sSelectKeyIni = this.byId("slct_inic").getSelectedKey();
    
        // Recolecta los datos de Proveedores desde la tabla o inputs
        const oTable = this.byId("table2");
        const aItems = oTable.getItems();
    
        const aProveedores = aItems.map(item => {
            const aCells = item.getCells();
            const condicionadoCheckbox = aCells[0];
            const proveedorCheckbox = aCells[1];
            const inputCondicionado = aCells[2];
            const inputProveedor = aCells[3];
    
            const condicionado = condicionadoCheckbox?.getSelected ? condicionadoCheckbox.getSelected() : false;
            const proveedor = proveedorCheckbox?.getSelected ? proveedorCheckbox.getSelected() : false;
            const valorCondicionado = inputCondicionado?.getValue ? inputCondicionado.getValue() : "";
            const valorProveedor = inputProveedor?.getValue ? inputProveedor.getValue() : "";
    
            return {
                condicionado,
                proveedor,
                valorCondicionado,
                valorProveedor
            };
        });
    
        // Creación del payload para la entidad `DatosProyect` incluyendo los proveedores
        const payload = {
            codigoProyect: scodigoProyect,
            nameProyect: snameProyect,
            pluriAnual: spluriAnual,
            clienteFacturacion: sClienteFac,
            multijuridica: sMultiJuri,
            Fechainicio: sFechaIni,
            FechaFin: sFechaFin,
            clienteFuncional: sClienteFunc,
            Naturaleza_ID: sSelectedKey,
            Area_ID: sSelecKeyA,
            Iniciativa_ID: sSelectKeyIni,
            jefeProyectID_ID: sSelecKeyJe,
            objetivoAlcance: sObjetivoAlcance,
            AsuncionesyRestricciones: sAsunyRestric,
            Proveedores: aProveedores // Relacionamos proveedores en el payload
        };
    
        // Realizamos la llamada POST al servicio OData para guardar los datos
        try {
            const response = await fetch("/odata/v4/datos-cdo/DatosProyect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
    
            if (response.ok) {
                console.log("Datos guardados con éxito.");
            } else {
                const errorMessage = await response.text();
                console.error("Error al guardar los datos:", errorMessage);
            }
        } catch (error) {
            console.error("Error en la llamada al servicio:", error);
        }
    },
    



      /// limpiar text 
      onClearFields: function () {
        // Obtener la vista actual
        var oView = this.getView();

        // Función recursiva para limpiar los controles
        function clearAllFields(oControl) {
          // Verificar y limpiar según el tipo de control
          if (oControl instanceof sap.m.Input) {
            oControl.setValue(""); // Limpia Input
          } else if (oControl instanceof sap.m.Select || oControl instanceof sap.m.ComboBox) {
            oControl.setSelectedKey(""); // Limpia Select y ComboBox
          } else if (oControl instanceof sap.m.DatePicker) {
            oControl.setDateValue(null); // Limpia DatePicker
          } else if (oControl instanceof sap.m.TextArea) {
            oControl.setValue(""); // Limpia TextArea
          } else if (oControl instanceof sap.m.CheckBox) {
            oControl.setSelected(false); // Limpia CheckBox
          }

          // Verificar si el control es un contenedor y limpiar sus elementos hijos
          if (oControl.getAggregation) {
            // Obtiene todas las agregaciones del control
            const aAggregations = oControl.getMetadata().getAllAggregations();
            for (let sAggregationName in aAggregations) {
              const oAggregation = oControl.getAggregation(sAggregationName);
              if (Array.isArray(oAggregation)) {
                oAggregation.forEach(clearAllFields); // Recursividad si es un arreglo de controles
              } else if (oAggregation instanceof sap.ui.core.Control) {
                clearAllFields(oAggregation); // Recursividad si es un solo control
              }
            }
          }
        }

        // Ejecutar la función de limpieza en la vista completa
        oView.findAggregatedObjects(false, clearAllFields);
      },





      // prueba Vizframe
      onprueba: function (oEvent) {
        var oTable = this.byId("table1");

        // Verifica si la tabla existe
        if (!oTable) {
          console.error("No se encontró la tabla.");
          return;
        }

        // Obtén los ítems de la tabla
        var aItems = oTable.getItems();

        // Verifica si hay ítems en la tabla
        if (aItems.length === 0) {
          console.warn("No hay ítems en la tabla.");
          return;
        }

        // Itera sobre los ítems y obtiene las fechas
        aItems.forEach(function (oItem) {
          var oBindingContext = oItem.getBindingContext();
          if (!oBindingContext) {
            console.error("No se encontró el contexto de enlace para el ítem.");
            return;
          }

          var oData = oBindingContext.getObject();

          // Imprime las fechas en la consola
          console.log("Hito/Fase:", oData.hito);
          console.log("Fecha Inicio:", oData.fecha_inicio);
          console.log("Fecha Fin:", oData.fecha_fin);
        });

      },



      //doble metodo 
      onSelectIniMethod: function (oEvent) {
        this.onInputChange(oEvent);
        this.onSelectOpx(oEvent);
      },


      //doble metodo 
      onselectmethodsetinfo: function (oEvent) {
        this.onInputChange(oEvent);
        this.fechasDinamicas(oEvent);
      },


      // Añadir mas Columnas en tabla dinamica  
      onAddRowPress: function (sTableId) {
        console.log(sTableId);

        var oTable = this.byId(sTableId);
        if (oTable) {
          var oNewItem = new sap.m.ColumnListItem({
            cells: [
              new sap.m.Select({
                selectedKey: "{Vertical>valueVertical}",
                forceSelection: false,
                items: {
                  path: "/Vertical",
                  template: new sap.ui.core.Item({
                    key: "{ID}",
                    text: "{NombreVertical}",
                  }),
                },
              }),
              new sap.m.Select({
                selectedKey: "{TipoServicio>valueTipoServ}",
                forceSelection: false,
                items: {
                  path: "/TipoServicio",
                  template: new sap.ui.core.Item({
                    key: "{ID}",
                    text: "{NombreTipoServ}",
                  }),
                },
              }),
              new sap.m.Select({
                selectedKey: "{PerfilServicio>valuePerfil}",
                forceSelection: false,
                items: {
                  path: "/PerfilServicio",
                  template: new sap.ui.core.Item({
                    key: "{ID}",
                    text: "{NombrePerfil}",
                  }),
                },
              }),
              new sap.m.Input({ value: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
              new sap.m.Text({ text: "" }),
            ],
          });
          oTable.addItem(oNewItem);
        } else {
          console.error("No se encontró la tabla con ID: " + sTableId);
        }
      },


      // Fechas dinamicas y tabla dinamica  

      onDateChange: function () {
        this.updateVizFrame();
      },


      fechasDinamicas: function (oEvent) {
        // Obtener las fechas seleccionadas de los DatePickers
        var startDatePicker = this.getView().byId("date_inico");
        var endDatePicker = this.getView().byId("date_fin");

        // Comprobar si los DatePickers tienen valores seleccionados
        if (!startDatePicker || !endDatePicker) {
          console.error("Error: No se pudieron obtener los DatePickers.");
          return;
        }

        var startDate = startDatePicker.getDateValue();
        var endDate = endDatePicker.getDateValue();

        // Si las fechas no están definidas, salir de la función
        if (!startDate || !endDate) {
          console.log("Esperando a que se seleccionen ambas fechas.");
          return;
        }

        // Calcular el número de meses en el rango
        var diffMonths = this.getMonthsDifference(startDate, endDate);

        // Generar dinámicamente las columnas de la tabla
        var oTable = this.getView().byId("table_dimicFecha");
        var totalColumnIndex = this.findTotalColumnIndex(oTable);

        if (totalColumnIndex === -1) {
          console.error("Error: No se encontró la columna 'Total'.");
          return;
        }

        // Eliminar las columnas dinámicas existentes después de "Total"
        var columnCount = oTable.getColumns().length;
        for (var j = columnCount - 1; j > totalColumnIndex; j--) {
          oTable.removeColumn(j);
        }

        // Agregar nuevas columnas
        for (var i = 0; i <= diffMonths; i++) {
          var columnDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + i,
            1
          );
          var year = columnDate.getFullYear();
          var month = columnDate.toLocaleString("default", { month: "long" }); // Obtener el nombre del mes en letras
          var columnHeaderText = year + "-" + month;
          var oColumn = new sap.m.Column({
            header: new sap.m.Label({ text: columnHeaderText }),
            width: "100px", // Ajustar el ancho de la columna según sea necesario
          });
          oTable.insertColumn(oColumn, totalColumnIndex + 1 + i);
        }

        // Ajustar el ancho de la tabla y habilitar el desplazamiento horizontal
        var oScrollContainer = this.getView().byId("scroll_container");
        oScrollContainer.setHorizontal(true);
        oScrollContainer.setVertical(false);
        oScrollContainer.setWidth("100%");

        console.log("startDate:", startDate);
        console.log("endDate:", endDate);
      },

      findTotalColumnIndex: function (oTable) {
        var columns = oTable.getColumns();
        for (var i = 0; i < columns.length; i++) {
          var headerLabel = columns[i].getHeader();
          if (headerLabel && headerLabel.getText() === "Total") {
            return i;
          }
        }
        return -1; // No se encontró la columna 'Total'
      },

      getMonthsDifference: function (startDate, endDate) {
        var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        diffMonths -= startDate.getMonth();
        diffMonths += endDate.getMonth();
        return diffMonths;
      },

      //---------------------------------------------------------------






      //Navegacion VIew 1 
      onNavToView1: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
        console.log("Navigating to View1");

        oRouter.navTo("app");
      },

      //Visible table Facturacion
      onSelectOpx: function (oEvent) {
        var selectedItem = oEvent.getParameter("selectedItem").getKey();

        console.log(selectedItem);
        var oTable = this.getView().byId("table0");

        if (selectedItem === "Opex Servicios") {
          oTable.setVisible(false);
        } else {
          oTable.setVisible(true);
        }
      },


      //Visible Table
      onCheckBoxSelectMulti: function (oEvent) {
        // Verificar si se ha llamado a la función
        console.log("onCheckBoxSelect called");

        var oCheckBox = oEvent.getSource();
        var bSelected = oCheckBox.getSelected();
        console.log("Checkbox selected: ", bSelected);

        var oTable = this.byId("table_clienteFac");
        console.log("Table found: ", !!oTable);

        if (oTable) {
          oTable.setVisible(bSelected);
        }
      },



      //Gets de input informacion 
      onInputChange: function () {
        var oView = this.getView();

        // Capturar valores de los inputs y selects
        var sCodeValue = this.byId("input0").getValue();
        var sNombrePro = this.byId("input1").getValue();
        var sClienteFact = this.byId("id_Cfactur").getValue();
        var sClienteFuncio = this.byId("int_clienteFun").getValue();
        console.log(sCodeValue, sNombrePro);

        var oSelect2 = this.byId("slct_area");
        var sSelectValue2 = "";
        var sKey2 = "";

        if (oSelect2 && oSelect2.getSelectedItem()) {
          sSelectValue2 = oSelect2.getSelectedItem().getText();
          sKey2 = oSelect2.getSelectedItem().getKey();
          console.log("Selected Key:", sKey2);
          console.log("Selected Text:", sSelectValue2);
        }

        var oSelect1 = this.byId("slct_Jefe");
        var sSelectValue1 = "";

        if (oSelect1 && oSelect1.getSelectedItem()) {
          sSelectValue1 = oSelect1.getSelectedItem().getText();
          console.log("Selected Jefe Text:", sSelectValue1);
        }

        var oSelect3 = this.byId("slct_client");
        var sSelectValue3 = "";

        if (oSelect3 && oSelect3.getSelectedItem()) {
          sSelectValue3 = oSelect3.getSelectedItem().getText();
          console.log("Selected Function Text:", sSelectValue3);
        }

        var oStartDatePicker = this.byId("date_inico");
        var sStartDatePicker = oStartDatePicker ? oStartDatePicker.getDateValue() : null;
        var sFormattedDateIni = "";

        if (sStartDatePicker) {
          sFormattedDateIni = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "yyyy-MM-dd"
          }).format(sStartDatePicker);
        }


        var oSelect4 = this.byId("slct_inic");
        var sSelectValue4 = "";

        if (oSelect4 && oSelect4.getSelectedItem()) {
          sSelectValue4 = oSelect4.getSelectedItem().getText();
          console.log("Selected Function Text:", sSelectValue4);
        }

        var oDatePicker = this.byId("date_fin");
        var sDateValue = oDatePicker ? oDatePicker.getDateValue() : null;
        var sFormattedDate = "";

        if (sDateValue) {
          sFormattedDate = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "yyyy-MM-dd"
          }).format(sDateValue);
        }

        // Imprime las fechas formateadas
        console.log("Formatted Start Date: ", sFormattedDateIni);
        console.log("Formatted End Date: ", sFormattedDate);

        this.byId("txt_codig").setText(sCodeValue);
        this.byId("txt_nomPro").setText(sNombrePro);
        this.byId("txt_area").setText(sSelectValue2);
        this.byId("txt_NomJefe").setText(sSelectValue1);
        this.byId("txt_funcio").setText(sClienteFuncio);
        this.byId("txt_feIni").setText(sFormattedDateIni);
        this.byId("txt_feFin").setText(sFormattedDate);
        this.byId("txt_ini").setText(sSelectValue4);



        //Segunda tabla 
        this.byId("txt_client").setText(sClienteFuncio);
        this.byId("txt_cFactura").setText(sClienteFact);
        this.byId("txt_Codi2").setText(sCodeValue);
        this.byId("txt_Nombre2").setText(sNombrePro);
        this.byId("txt_area2").setText(sSelectValue2);
        this.byId("txt_Fe_ini2").setText(sFormattedDateIni);
        this.byId("txt_Fe_fin2").setText(sFormattedDate);





      },


      //----------------Funcion CheckBox -------------------------------------------
      onSelectCheckbox: function (oEvent) {
        try {
          var oTable = this.byId("table2");
          if (!oTable) {
              console.error("Tabla no encontrada.");
              return;
          }
  
          var aColumns = oTable.getColumns();
          var aItems = oTable.getItems();
          var bSelected = oEvent.getSource()?.getSelected();
  
          if (bSelected === undefined) {
              console.error("Error al obtener el estado del checkbox.");
              return;
          }
  
          var iSelectedColumnIndex = oEvent
              .getSource()
              .getParent()
              .getParent()
              .indexOfColumn(oEvent.getSource().getParent());
  
          // IDs de los checkboxes
          var sOtherCheckboxId = iSelectedColumnIndex === 0 ? "box_prove" : "box_condi";
          var oOtherCheckbox = this.byId(sOtherCheckboxId);
  
          if (!oOtherCheckbox) {
              console.error("El otro checkbox no se encontró.");
              return;
          }
  
          // Deshabilitar el otro checkbox si este está seleccionado, habilitar si está deseleccionado
          oOtherCheckbox.setEnabled(!bSelected);
  
          // Recorrer cada columna y establecer el estado editable de los inputs en esa columna
          aColumns.forEach(function (oColumn, iColumnIndex) {
              aItems.forEach(function (oItem) {
                  var oInput = oItem.getCells()[iColumnIndex];
                  if (oInput && oInput.setEditable) {
                      oInput.setEditable(iColumnIndex === iSelectedColumnIndex ? bSelected : !bSelected);
                  }
              });
          });
      } catch (error) {
          console.error("Error en la función onSelectCheckbox:", error);
      }
      },
      //--------------------------------------------------------------------------------




    });
  });
