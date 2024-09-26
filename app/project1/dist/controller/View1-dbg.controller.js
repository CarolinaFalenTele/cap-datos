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

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        oRouter.getRoute("view").attachPatternMatched(this._onObjectMatched, this);


        
      },











      
      _onObjectMatched: async function (oEvent) {
    
        var sProjectID = oEvent.getParameter("arguments").sProjectID;

           // Almacenar el ID en una variable de instancia del controlador para usarlo más tarde
    this._sProjectID = sProjectID;


        // Construye la URL con el ID correctamente escapado
        var sUrl = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})`;

        try {
          const response = await fetch(sUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Network response was not ok: ' + errorText);
          }

          const oData = await response.json();
          console.log("Datos del proyecto:", oData);

          // Actualiza los controles de la vista con los datos obtenidos
          if (oData) {
            // Ejemplos de cómo poblar los controles
            this.byId("input0").setValue(oData.codigoProyect || "");
            this.byId("input1").setValue(oData.nameProyect || "");
            this.byId("int_clienteFun").setValue(oData.clienteFuncional || "");
            this.byId("id_Cfactur").setValue(oData.clienteFacturacion || "");
            this.byId("idObje").setValue(oData.objetivoAlcance || "");
            this.byId("idAsunyRestri").setValue(oData.AsuncionesyRestricciones || "");
            this.byId("box_multiJuridica").setSelected(!!oData.multijuridica);
            this.byId("box_pluriAnual").setSelected(!!oData.pluriAnual);
            this.byId("slct_area").setSelectedKey(oData.Area_ID || "");
            this.byId("slct_Jefe").setSelectedKey(oData.jefeProyectID_ID || "");
            this.byId("slct_verti").setSelectedKey(oData.Vertical_ID || "");
            this.byId("slct_inic").setSelectedKey(oData.Iniciativa_ID || "");
            this.byId("idNatu").setSelectedKey(oData.Naturaleza_ID || "");
            this.byId("date_inico").setDateValue(new Date(oData.fechaInicio || ""));
            this.byId("date_fin").setDateValue(new Date(oData.fechaFin || ""));
            this.byId("input0").setValue(oProjectData.codigoProyect);
            this.byId("input1").setValue(oProjectData.nameProyect);
            this.byId("box_pluriAnual").setSelected(oProjectData.pluriAnual);
            this.byId("id_Cfactur").setValue(oProjectData.clienteFacturacion);
            this.byId("box_multiJuridica").setSelected(oProjectData.multijuridica)




            // this.byId("datePickerStart").setDateValue(new Date(oData.startDate)); // Asegúrate de que el formato sea correcto
            //     this.byId("comboBoxStatus").setSelectedKey(oData.status || "defaultStatus");
            // Añade más campos según los controles en tu formulario
          }

        } catch (error) {
          console.error("Error al obtener los datos del proyecto:", error);
          sap.m.MessageToast.show("Error al cargar los datos del proyecto");
        }
      },





      onFechaChange: function () {
        // Cuando se cambia una fecha en la tabla, se actualiza el gráfico
        //() this._updateChart();
        this.updateVizFrame1();

      },




      // Evento para la primera tabla
      onPerfilChangeTabla1: function (oEvent) {
        this.updateRowData(oEvent, "table_dimicFecha"); // Reemplaza con el ID de tu primera tabla
      },


      updateRowData: function (oEvent, oTableId) {
        // Obtén el ID del Select que ha generado el evento
        const oSource = oEvent.getSource();

        // Encuentra la tabla
        var oTable = this.byId(oTableId);

        // Obtén el índice de la fila seleccionada desde el Select
        var oItem = oSource.getParent(); // Obtiene el ColumnListItem
        var iIndex = oTable.indexOfItem(oItem); // Obtiene el índice de la fila

        if (iIndex === -1) {
          console.error("Índice de la fila no encontrado. Verifica la estructura de la tabla.");
          return;
        }

        // Obtén las celdas de la fila
        var aItems = oTable.getItems();
        var oRowData = aItems[iIndex].getCells();

        if (!oRowData || oRowData.length === 0) {
          console.error("Datos de la fila no encontrados.");
          return;
        }

        // Obtén el valor seleccionado del Select
        var sSelectedText = oSource.getSelectedItem().getText();

        // Define un objeto de configuración para las actualizaciones
        var oConfig = {
          "Director": {
            PMJ: 1370.88,
            "2024": 41.00,
            "2025": 15.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,


          },
          "CG4.C": {
            PMJ: 182.72,
            "2024": 5.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG4.A": {
            PMJ: 331.24,
            "2024": 51.93,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG4.B": {
            PMJ: 225.11,
            "2024": 51.93,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          }

        };

        // Lógica para actualizar datos basados en la selección del Select
        var oUpdate = oConfig[sSelectedText];

        if (oUpdate) {
          oRowData[4].setText(oUpdate.PMJ); // Ajusta según la celda específica para PMJ
          oRowData[5].setText(oUpdate["2024"]);   // Ajusta según la celda específica para el año 2024
          oRowData[6].setText(oUpdate["2025"]);   // Ajusta según la celda específica para el año 2025
          oRowData[7].setText(oUpdate["2026"]);   // Ajusta según la celda específica para el año 2025
          oRowData[8].setText(oUpdate["2027"]);   // Ajusta según la celda específica para el año 2025
          oRowData[9].setText(oUpdate["2028"]);   // Ajusta según la celda específica para el año 2025
          oRowData[10].setText(oUpdate["2029"]);   // Ajusta según la celda específica para el año 2025

          // Suma de 2024 y 2025 para 'Total'
          var total = oUpdate["2024"] + oUpdate["2025"];
          oRowData[11].setText(total);  // Coloca la suma en 'Total'

          // Suma de PMJ + Total para 'Total1'
          var total1 = oUpdate.PMJ + total;
          oRowData[12].setText(total1);  // Coloca la suma en 'Total1'

          // Asigna 5.00 a las columnas que no sean junio, julio o agosto y 4.00 a las correspondientes
          var months = ["junio", "julio", "agosto"];

          // Obtén las columnas de la tabla
          var oColumns = oTable.getColumns();

          // Empieza desde la columna después de 'Total1' (columna 9 en adelante)
          for (var i = 9; i < oRowData.length; i++) {
            var columnHeaderText = oColumns[i].getHeader().getText().toLowerCase();

            if (months.some(month => columnHeaderText.includes(month))) {
              oRowData[i].setText("4.00");  // Asignar 4.00 a junio, julio, agosto
            }
          }

        } else {
          console.error(`No hay configuración definida para el valor seleccionado: ${sSelectedText}`);
        }
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

        console.log(aChartData);


          this._aChartData = aChartData;


        var oFechas = {};
        aChartData.forEach(function (oHito) {
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
            {
              fase: "Fechas Importantes",
              fechaInicioConstruccion: oFechas.fechaInicioConstruccion,
              fechaFinPruebasTQ: oFechas.fechaFinPruebasTQ
            }
          ]
        });

        // Establecer el nuevo modelo en la vista
        oView.setModel(oFechasModel, "fechasModel");



      },
      //------------------------------------------------- 

      onSave: async function (oEvent) {


        let errorCount = 0;


        const sProjectID = this._sProjectID; // Aquí usamos el ID del proyecto almacenado en _onObjectMatched

        const saChartdata = this._aChartData;
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



        // Accede al control Select usando su ID

        var oSelect = this.byId("idNatu");

        var sSelectedKey = oSelect.getSelectedKey();

        var oselectA = this.byId("slct_area");

        var sSelecKeyA = oselectA.getSelectedKey();

        var oSelectJe = this.byId("slct_Jefe");

        var sSelecKeyJe = oSelectJe.getSelectedKey();

        var oSelectInic = this.byId("slct_inic");

        var sSelectKeyIni = oSelectInic.getSelectedKey();

        var oSelectSegui = this.byId("selc_Segui");

        var sSelectKeySegui = oSelectSegui.getSelectedKey();

        var oSelectEjecu = this.byId("selc_ejcu");

        var sSelectKeyEjcu = oSelectEjecu.getSelectedKey();

        var oSelectVerti = this.byId("slct_verti");

        var sSelectKeyVerti = oSelectVerti.getSelectedKey();

        var oSelectAmRep = this.byId("selct_Amrecp");

        var sSelectKeyAmrep = oSelectAmRep.getSelectedKey();


        // Función para verificar campo vacío y marcar error

        const validateField = (control, value) => {

          if (!value || (typeof value === 'string' && value.trim() === "")) {

            control.setValueState("Error");

            control.setValueStateText("Este campo es obligatorio");

            errorCount++;

          } else {

            control.setValueState("None");

          }

        };



        // Validar cada campo

        validateField(this.byId("input0"), scodigoProyect);

        validateField(this.byId("input1"), snameProyect);

        validateField(this.byId("id_Cfactur"), sClienteFac);

        validateField(this.byId("int_clienteFun"), sClienteFunc);

        validateField(this.byId("idNatu"), sSelectedKey);



        // Si hay errores, actualizar IconTabFilter y detener el envío

        if (errorCount > 0) {

          const oIconTabFilter = this.byId("idIniu");

          oIconTabFilter.setCount(errorCount);

          return; // Detener el proceso si hay errores

        }





        // Prepara el payload /  / Creación delPayload

        const payload = {

          codigoProyect: scodigoProyect,

          nameProyect: this.byId("input1").getValue(),

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

          Vertical_ID: sSelectKeyVerti,

          //          AmReceptor_ID : sSelectKeyAmrep
      //    planificaciones: aChartData
        };





          try {

        let response;
        if (sProjectID) {
          console.log(sProjectID);
            // Si hay un ID, es una actualización (PATCH)
            response = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectID})`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Si no hay ID, es una creación (POST)
            response = await fetch("/odata/v4/datos-cdo/DatosProyect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            console.log("chartfata", saChartdata);
  // var oModel = this.getView().getModel(); // Asumiendo que tu modelo OData está configurado en la vista  
   
 /*  oModel.create("/Planificacion", {
      chartData: saChartdata,
      projectId: sProjectID
    }, {
      success: function() {
        sap.m.MessageToast.show("Planificación insertada correctamente");
      },
      error: function(oError) {
        sap.m.MessageToast.show("Error al insertar la planificación");
      }
    });*/

        }

        if (response.ok) {
            const result = await response.json();
            const generatedId = result.ID || sProjectID;
            console.log("Guardado con éxito. ID:", generatedId);

            // Navegar de vuelta a la vista principal o hacer lo que necesites después de guardar
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("app", {
                newId: generatedId
            });

            console.log(oRouter);
        } else {
            const errorMessage = await response.text();
            console.log("Error al guardar el proyecto:", errorMessage);
        }
    } catch (error) {
      console.log("Error en la llamada al servicio:", error);
    }

  },




      // ---------- Metodo Save ----------------- 
  /*    onSave: async function (oEvent) {


        let errorCount = 0;


        const sProjectID = this._sProjectID; // Aquí usamos el ID del proyecto almacenado en _onObjectMatched

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



        // Accede al control Select usando su ID

        var oSelect = this.byId("idNatu");

        var sSelectedKey = oSelect.getSelectedKey();

        var oselectA = this.byId("slct_area");

        var sSelecKeyA = oselectA.getSelectedKey();

        var oSelectJe = this.byId("slct_Jefe");

        var sSelecKeyJe = oSelectJe.getSelectedKey();

        var oSelectInic = this.byId("slct_inic");

        var sSelectKeyIni = oSelectInic.getSelectedKey();

        var oSelectSegui = this.byId("selc_Segui");

        var sSelectKeySegui = oSelectSegui.getSelectedKey();

        var oSelectEjecu = this.byId("selc_ejcu");

        var sSelectKeyEjcu = oSelectEjecu.getSelectedKey();

        var oSelectVerti = this.byId("slct_verti");

        var sSelectKeyVerti = oSelectVerti.getSelectedKey();

        var oSelectAmRep = this.byId("selct_Amrecp");

        var sSelectKeyAmrep = oSelectAmRep.getSelectedKey();


        // Función para verificar campo vacío y marcar error

        const validateField = (control, value) => {

          if (!value || (typeof value === 'string' && value.trim() === "")) {

            control.setValueState("Error");

            control.setValueStateText("Este campo es obligatorio");

            errorCount++;

          } else {

            control.setValueState("None");

          }

        };



        // Validar cada campo

        validateField(this.byId("input0"), scodigoProyect);

        validateField(this.byId("input1"), snameProyect);

        validateField(this.byId("id_Cfactur"), sClienteFac);

        validateField(this.byId("int_clienteFun"), sClienteFunc);

        validateField(this.byId("idNatu"), sSelectedKey);



        // Si hay errores, actualizar IconTabFilter y detener el envío

        if (errorCount > 0) {

          const oIconTabFilter = this.byId("idIniu");

          oIconTabFilter.setCount(errorCount);

          return; // Detener el proceso si hay errores

        }





        // Prepara el payload /  / Creación delPayload

        const payload = {

          codigoProyect: scodigoProyect,

          nameProyect: this.byId("input1").getValue(),

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

          Vertical_ID: sSelectKeyVerti,

          //          AmReceptor_ID : sSelectKeyAmrep
      //    planificaciones: aChartData
        };





          try {

        let response;
        if (sProjectID) {
          console.log(sProjectID);
            // Si hay un ID, es una actualización (PATCH)
            response = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectID})`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Si no hay ID, es una creación (POST)
            response = await fetch("/odata/v4/datos-cdo/DatosProyect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            


        }

        if (response.ok) {
            const result = await response.json();
            const generatedId = result.ID || sProjectID;
            console.log("Guardado con éxito. ID:", generatedId);

            // Navegar de vuelta a la vista principal o hacer lo que necesites después de guardar
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("app", {
                newId: generatedId
            });

            console.log(oRouter);
        } else {
            const errorMessage = await response.text();
            console.log("Error al guardar el proyecto:", errorMessage);
        }
    } catch (error) {
      console.log("Error en la llamada al servicio:", error);
    }
},*/




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

        // Definir las IDs de las tablas
        var tableIds = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
        ];

        // Iterar sobre cada tabla
        tableIds.forEach(function (tableId) {
          var oTable = this.getView().byId(tableId);
          if (!oTable) {
            console.error("Error: No se pudo obtener la tabla con ID " + tableId);
            return;
          }

          var totalColumnIndex = this.findTotalColumnIndex(oTable);

          if (totalColumnIndex === -1) {
            console.error("Error: No se encontró la columna 'Total1' en la tabla " + tableId);
            return;
          }

          // Eliminar las columnas dinámicas existentes después de "Total1"
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
            var month = columnDate.toLocaleString("default", { month: "long" });
            var columnHeaderText = year + "-" + month;
            var oColumn = new sap.m.Column({
              header: new sap.m.Label({ text: columnHeaderText }),
              width: "100px",
            });
            oTable.insertColumn(oColumn, totalColumnIndex + 1 + i);
          }

          // Ajustar el ancho de la tabla y habilitar el desplazamiento horizontal
          var oScrollContainer = this.getView().byId("scroll_container_" + tableId);
          if (oScrollContainer) {
            oScrollContainer.setHorizontal(true);
            oScrollContainer.setVertical(false);
            oScrollContainer.setWidth("100%");
          }

          console.log("startDate:", startDate);
          console.log("endDate:", endDate);
        }, this); // Asegúrate de pasar 'this' como contexto para acceder a las funciones internas
      },

      findTotalColumnIndex: function (oTable) {
        var columns = oTable.getColumns();
        for (var i = 0; i < columns.length; i++) {
          var headerLabel = columns[i].getHeader();
          if (headerLabel && headerLabel.getText() === "Total1") {  // Cambia "Total" a "Total1"
            return i;
          }
        }
        return -1; // No se encontró la columna 'Total1'
      },

      getMonthsDifference: function (startDate, endDate) {
        var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        diffMonths -= startDate.getMonth();
        diffMonths += endDate.getMonth();
        return diffMonths;
      },





      //Navegacion VIew 1 
      onNavToView1: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
        console.log("Navigating to View1");

        oRouter.navTo("appNoparame");
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


        var oselectPerf5 = this.byId("idNatu");
        var sSelectValue5 = "";

        if (oselectPerf5 && oselectPerf5.getSelectedItem()) {
          sSelectValue5 = oselectPerf5.getSelectedItem().getText();
          console.log("Selected Function Text:", sSelectValue5);
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


        //Tercera tabla 
        this.byId("textClitFu3").setText(sClienteFuncio);
        this.byId("textCliFac3").setText(sClienteFact);
        this.byId("textCodigo3").setText(sCodeValue);
        this.byId("textNatural3").setText(sSelectValue5);
        this.byId("txtNombre3").setText(sNombrePro);
        this.byId("txtAre3").setText(sSelectValue2);
        this.byId("txtFechInici3").setText(sFormattedDateIni);
        this.byId("txtFechFin3").setText(sFormattedDate);





      },
      onSelectCheckbox: function (oEvent) {
        try {
          var oTable = this.byId("table2");
          if (!oTable) {
            console.error("Tabla no encontrada.");
            return;
          }
      
          var aItems = oTable.getItems();
          var bSelected = oEvent.getSource().getSelected();
      
          if (bSelected === undefined) {
            console.error("Error al obtener el estado del checkbox.");
            return;
          }
      
          // Obtener el índice de la columna seleccionada
          var iSelectedColumnIndex = oEvent.getSource().getParent().getParent().indexOfColumn(oEvent.getSource().getParent());
      
          // IDs de los CheckBoxes
          var sOtherCheckboxId = iSelectedColumnIndex === 0 ? "box_prove" : "box_condi";
          var oOtherCheckbox = this.byId(sOtherCheckboxId);
      
          if (!oOtherCheckbox) {
            console.error("El otro checkbox no se encontró.");
            return;
          }
      
          // Deshabilitar el otro checkbox si este está seleccionado
          oOtherCheckbox.setEnabled(!bSelected);
      
          // Recorrer los ítems de la tabla para hacer editable solo la columna seleccionada
          aItems.forEach(function (oItem) {
            var aCells = oItem.getCells();
            aCells.forEach(function (oCell, iIndex) {
              if (oCell.setEditable) {
                oCell.setEditable(iIndex === iSelectedColumnIndex ? bSelected : !bSelected);
              }
            });
          });
        } catch (error) {
          console.error("Error en la función onSelectCheckbox:", error);
        }
      },
      

      //----------------Funcion CheckBox -------------------------------------------
  /*    onSelectCheckbox: function (oEvent) {
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
      },*/
      //--------------------------------------------------------------------------------




    });
  });
