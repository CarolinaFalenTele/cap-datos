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

        var oVizframe1 = this.byId("idVizFrame");
        oVizframe1.setVizProperties({ "title": { "text": "Planificacion" } });

        this._tableValues = {
          "tablaConsuExter": {}, // Asegúrate de que el nombre de la tabla esté correcto
          "table_dimicFecha": {}, // Asegúrate de que este nombre coincida con la vista
          "tablaRecExterno": {}
        };

        this._editedRows = this._editedRows || {};

        this._rowYearlySums = this._rowYearlySums || {}; // Asegúrate de que esté inicializado



        var oFechasModel = new sap.ui.model.json.JSONModel({
          fechas: [
            {
              fase: "Fechas Importantes",
              fechaInicioConstruccion: "2024-09-01",
              fechaFinPruebasTQ: "2024-09-30"
            }
            // Agrega más datos según sea necesario
          ]
        });

        this.getView().setModel(oFechasModel, "fechasModel");

        var oVizframe2 = this.byId("idVizFrame2");
        oVizframe2.setVizProperties({ "title": { "text": "Plan" } })


        // console.log(oModel);

        // Inicializar el gráfico con los datos actuales
        this.updateVizFrame1();
        this.updateVizFrame3();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        oRouter.getRoute("view").attachPatternMatched(this._onObjectMatched, this);

        this.updateVizFrame2();

        this._yearlySums = {
          2024: 0,
          2025: 0,
          2026: 0,
          2027: 0,
          2028: 0,
          2029: 0,
        };


      },




      //--------------------------------------METODOS TRAER INFORMACION ---------------------------------------
      //--------metodo traerdatos----------------- 


      highlightControls: function () {
        console.log("Se cambiaron las pestañas debido a campos vacíos.");

        const controlsToHighlight = [
          this.byId("input0"),
          this.byId("input1"),
          this.byId("int_clienteFun"),
          this.byId("id_Cfactur"),
          this.byId("id_Cfactur"),
          this.byId("idObje"),
          this.byId("idAsunyRestri"),
          this.byId("box_multiJuridica"),
          this.byId("box_pluriAnual"),
          this.byId("slct_area"),
          this.byId("slct_Jefe"),
          this.byId("slct_verti"),
          this.byId("slct_inic"),
          this.byId("idNatu"),
          this.byId("selct_Amrecp"),
          this.byId("selc_ejcu"),
          this.byId("selc_Segui"),
          this.byId("slct_client"),
          this.byId("date_inico"),
          this.byId("date_fin"),
          this.byId("input0"),
          this.byId("input1"),
          this.byId("box_pluriAnual"),
          this.byId("id_Cfactur"),
          this.byId("box_multiJuridica")

          // Agrega más controles aquí según sea necesario
        ];

        // Establecer el ValueState a Warning (amarillo)
        controlsToHighlight.forEach(control => {
          if (control && control.setValueState) {
            control.setValueState("Success");

          }
        });


        // Revertir el ValueState después de 2 segundos
        setTimeout(() => {
          controlsToHighlight.forEach(control => {
            if (control && control.setValueState) {
              control.setValueState("None");
            }
          });
        }, 2000); // 2000 ms = 2 segundos

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
            this.byId("selct_Amrecp").setSelectedKey(oData.AmReceptor_ID || "");
            this.byId("selc_ejcu").setSelectedKey(oData.EjecucionVia_ID || "");
            this.byId("selc_Segui").setSelectedKey(oData.Seguimiento_ID || "");
            this.byId("slct_client").setSelectedKey(oData.clienteFuncional_ID || "");
            this.byId("date_inico").setDateValue(oData.Fechainicio ? new Date(oData.Fechainicio) : null);
            this.byId("date_fin").setDateValue(oData.FechaFin ? new Date(oData.FechaFin) : null);
            this.byId("input0").setValue(oData.codigoProyect);
            this.byId("input1").setValue(oData.nameProyect);
            this.byId("box_pluriAnual").setSelected(oData.pluriAnual);
            this.byId("id_Cfactur").setValue(oData.clienteFacturacion);
            this.byId("box_multiJuridica").setSelected(oData.multijuridica)

            await this.fetchMilestones(sProjectID);
            await this.leerProveedor(sProjectID);
            await this.leerFacturacion(sProjectID);
            await this.leerClientFactura(sProjectID);
            await this.leerRecursos(sProjectID);


            // Cambiar el texto del botón de "Enviar" a "Guardar"
            const oButton = this.byId("564433"); // Asegúrate de que el ID del botón es "submitButton"
            oButton.setText("Guardar");

            // Mostrar un toast indicando que los datos se cargaron correctamente
            sap.m.MessageToast.show("Datos cargados correctamente");

            // this.byId("datePickerStart").setDateValue(new Date(oData.startDate)); // Asegúrate de que el formato sea correcto
            //     this.byId("comboBoxStatus").setSelectedKey(oData.status || "defaultStatus");
            // Añade más campos según los controles en tu formulario
          }

        } catch (error) {
          console.error("Error al obtener los datos del proyecto:", error);
          sap.m.MessageToast.show("Error al cargar los datos del proyecto");
        }
        this.highlightControls(); // Llama al método para resaltar los controles

      },
      //----------------------------------------------



      //----------Traer informacion de tabla Planificacion--------
      fetchMilestones: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/planificacion?$filter=datosProyect_ID eq ${projectID}`;

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
          console.log("Datos de planificación:", oData);

          if (oData && oData.value) {
            // Ordenar los hitos por fecha_inicio (de forma ascendente)
            oData.value.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

            var oPlanningModel = this.getView().getModel("planning");

            // Recorre los hitos y actualiza solo las fechas en el modelo
            oData.value.forEach((item, index) => {
              var sPath = "/milestones/" + index;

              // Formatear las fechas a "yyyy-MM-dd"
              var formattedFechaInicio = item.fecha_inicio ? new Date(item.fecha_inicio).toISOString().split('T')[0] : null;
              var formattedFechaFin = item.fecha_fin ? new Date(item.fecha_fin).toISOString().split('T')[0] : null;

              // Actualiza solo las propiedades de fechas en el modelo
              oPlanningModel.setProperty(sPath + "/fechaInicio", formattedFechaInicio);
              oPlanningModel.setProperty(sPath + "/fechaFin", formattedFechaFin);
            });
          }

          // Actualiza el VizFrame con los datos recuperados
          this.updateVizFrame1(oData);

        } catch (error) {
          console.error("Error al obtener los datos de planificación:", error);
          sap.m.MessageToast.show("Error al cargar los datos de planificación");
        }
      },
      //-------------------------------------------------



      //----------Leer Proveedor------------------------
      leerProveedor: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ProveedoresC?$filter=datosProyect_ID eq ${projectID}`;

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
          console.log("Datos de proveedor:", oData);

          // Obtener la tabla por ID
          var oTable = this.byId("table2");
          // Obtener todos los items (filas) de la tabla
          var aItems = oTable.getItems();

          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var proveedorData = oData.value[0]; // Asumiendo que quieres el primer proveedor

            // Recorrer cada fila de la tabla
            aItems.forEach(function (oItem) {
              // Obtener las celdas (inputs) de la fila
              var aCells = oItem.getCells();

              // Asegúrate de que el índice es correcto para cada input
              if (aCells.length > 1) {
                aCells[0].setValue(proveedorData.valueCondi || ""); // Input para valueCondi
                aCells[1].setValue(proveedorData.valueProvee || ""); // Input para valueProvee
              }

              // Establecer valores para checkboxes
              this.byId("box_condi").setSelected(proveedorData.checkCondi || false); // Checkbox Condicionado
              this.byId("box_prove").setSelected(proveedorData.checkProveedor || false); // Checkbox Proveedores
            }.bind(this));
          } else {
            console.log("No hay datos de proveedores disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de proveedor:", error);
          sap.m.MessageToast.show("Error al cargar los datos de proveedor");
        }
      },


      leerFacturacion: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/Facturacion?$filter=datosProyect_ID eq ${projectID}`;
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
          console.log("Datos de Facturacion :", oData);

          var oTable = this.byId("table0");
          var aItems = oTable.getItems();

          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Facturacion = oData.value[0]; // Asumiendo que quieres el primer proveedor

            console.log("Valor de fecha estimada:", Facturacion.fechaEstimida); // Verifica el valor de la fecha

            aItems.forEach(function (oItem) {
              var aCells = oItem.getCells();

              // Asegúrate de que el índice es correcto para cada input
              if (aCells.length > 1) {
                if (aCells[0] instanceof sap.m.DatePicker) {
                  console.log("Tipo de celda:", aCells[0].constructor.name); // Verifica el tipo de celda
                  aCells[0].setDateValue(Facturacion.fechaEstimida ? new Date(Facturacion.fechaEstimida) : null);
                }
                if (aCells[1] instanceof sap.m.Input) {
                  aCells[1].setValue(Facturacion.descripcionHito || ""); // Input para descripción
                }
                if (aCells[2] instanceof sap.m.Input) {
                  aCells[2].setValue(Facturacion.facturacion || ""); // Input para facturación
                }
              }
            }.bind(this));
          } else {
            console.log("No hay datos de Facturacion disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de Facturacion:", error);
          sap.m.MessageToast.show("Error al cargar los datos de Facturacion");
        }
      },

      leerClientFactura: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ClientFactura?$filter=datosProyect_ID eq ${projectID}`;
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
          console.log("Datos de Cliente factura:", oData);

          var oTable = this.byId("table_clienteFac");
          var aItems = oTable.getItems();

          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            // Asumiendo que tienes que llenar cada elemento de la tabla con los datos en orden
            for (let i = 0; i < Math.min(aItems.length, oData.value.length); i++) {
              var oItem = aItems[i];
              var aCells = oItem.getCells();
              var Facturacion = oData.value[i]; // Obteniendo el proveedor por índice

              // Verificar si la primera celda es un Input o Text y establecer el valor
              if (aCells[0].getMetadata().getName() === "sap.m.Input") {
                aCells[0].setValue(Facturacion.juridica || "");
              } else if (aCells[0].getMetadata().getName() === "sap.m.Text") {
                aCells[0].setText(Facturacion.juridica || "");
              }

              // Verificar si la segunda celda es un Input o Text y establecer el valor
              if (aCells[1].getMetadata().getName() === "sap.m.Input") {
                aCells[1].setValue(Facturacion.oferta || "");
              } else if (aCells[1].getMetadata().getName() === "sap.m.Text") {
                aCells[1].setText(Facturacion.oferta || "");
              }

              // Verificar si la segunda celda es un Input o Text y establecer el valor

              var totalOfer = this.byId("text73_172746565340567");
              if (totalOfer.getMetadata().getName() === "sap.m.Input") {
                totalOfer.setValue(Facturacion.oferta || "");
              } else if (totalOfer.getMetadata().getName() === "sap.m.Text") {
                totalOfer.setText(Facturacion.oferta || "");
              }


            }
          } else {
            console.log("No hay datos de cliente factura disponibles.");
          }

          // --- Verificar el estado del checkbox después de cargar los datos ---
          var oCheckBox = this.byId("box_multiJuridica"); // Coloca el ID correcto del checkbox
          var bSelected = oCheckBox.getSelected();

          // Llama manualmente a la función que muestra u oculta la tabla
          this.onCheckBoxSelectMulti({
            getSource: () => oCheckBox,
            getSelected: () => bSelected
          });

        } catch (error) {
          console.error("Error al obtener los datos de cliente Facturacion:", error);
          sap.m.MessageToast.show("Error al cargar los datos de cliente Facturacion");
        }
      },


      //----------Leer Proveedor------------------------

      /*  leerProveedor: async function (projectID) {
          var sUrl = `/odata/v4/datos-cdo/ProveedoresC?$filter=datosProyect_ID eq ${projectID}`;
    
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
            console.log("Datos de proveedor :", oData);
    
            // Obtener la tabla por ID
            var oTable = this.byId("table2");
            // Obtener todos los items (filas) de la tabla
            var aItems = oTable.getItems();
    
            var aData = [];
    
    
    
         // Recorrer cada fila de la tabla
         aItems.forEach(function(oItem) {
          // Obtener las celdas (inputs) de la fila
          var aCells = oItem.getCells();
    
          // Extraer el valor de cada celda (input) de la fila
          var valueCondi = aCells[0].setValue(oData.valueCondi); // Input para valueCondi
          var valueProvee = aCells[1].setValue(oData.valueProvee); // Input para valueProvee
          var checkCondi = this.byId("box_condi").setSelected(oData.checkCondi); // Checkbox Condicionado
          var checkProveedor = this.byId("box_prove").setSelected(oData.checkProveedor); // Checkbox Proveedores
    
    
    
        }.bind(this));
    
    
    
          } catch (error) {
            console.error("Error al obtener los datos de proveedor:", error);
            sap.m.MessageToast.show("Error al cargar los datos de proveedor");
          }
    
          },*/





      leerRecursos: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/RecursosInternos?$filter=datosProyect_ID eq ${projectID}`;
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
          console.log("Datos de DATOS RECURSOS TRAIDO:", oData);

          var oTable = this.byId("table_dimicFecha");
          var aItems = oTable.getItems();

          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso

            // Asegúrate de que la tabla tenga al menos una fila
            if (aItems.length > 0) {
              var oItem = aItems[0]; // Selecciona solo la primera fila
              var aCells = oItem.getCells();

              // Asegúrate de que el índice es correcto para cada input/select
              if (aCells.length > 1) {
                aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                aCells[4].setText(Recurso.PMJ || ""); // Para el Input (PMJ)
                aCells[5].setText(Recurso.total || ""); // Para el Input (Cantidad)

              }
            }
          } else {
            console.log("No hay datos de recursos internos disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },


      //---------------------------------------------------------------------------------




      //--------------------------METODOS GRAFICOS -------------------------------------------
      //------ Metodo vizframe1 y seleccion fechas importantes ------
      updateVizFrame1: function (oData) {
        var oView = this.getView();
        var oModel = oView.getModel("planning");

        if (!oModel) {
          console.error("El modelo 'planning' no está definido.");
          return;
        }

        //var oData = oModel.getData();

        if (!oData || !oData.value) {
          console.error("Los datos del modelo son inválidos o no contienen 'value'.", oData);
          return;
        }

        var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
          pattern: "yyyy-MM-dd",
        });

        var aChartData = oData.value.map(function (milestone) {
          var startDate = milestone.fecha_inicio ? new Date(milestone.fecha_inicio) : null;
          var endDate = milestone.fecha_fin ? new Date(milestone.fecha_fin) : null;

          // Validación de las fechas
          if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
            var duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // Convertir a días

            return {
              fase: milestone.hito,
              fechaInicio: oDateFormat.format(startDate),
              fechaFin: oDateFormat.format(endDate),
              duracion: duration,
              label: `Inicio: ${oDateFormat.format(startDate)}, Fin: ${oDateFormat.format(endDate)}, Duración: ${duration} días`
            };
          } else {
            console.warn("Fechas no válidas para el hito:", milestone);
            return null; // Devuelve null si las fechas no son válidas
          }
        }).filter(Boolean); // Filtra los elementos nulos

        oModel.setProperty("/chartData", aChartData);
        console.log(aChartData);

        this._aChartData = aChartData;

        // Ajuste en la lógica de fases importantes
        var oFechas = {};
        aChartData.forEach(function (oHito) {
          // Validar nombres de fases exactos para obtener las fechas correctas
          if (oHito.fase === "Kick off") { // Actualiza si es necesario
            oFechas.fechaInicioConstruccion = oHito.fechaInicio;
          }
          if (oHito.fase === "Server post/prod") { // Asegúrate de que el nombre de fase es correcto
            oFechas.fechaFinPruebasTQ = oHito.fechaFin;
          }
        });

        // Asegúrate de que las fechas importantes se carguen correctamente
        var oFechasModel = new sap.ui.model.json.JSONModel({
          fechas: [
            {
              fase: "Plan",
              fechaInicioConstruccion: oFechas.fechaInicioConstruccion || "No definida",
              fechaFinPruebasTQ: oFechas.fechaFinPruebasTQ || "No definida"
            }
          ]
        });

        oView.setModel(oFechasModel, "fechasModel");

        this.updateVizFrame2(oFechasModel);
      },
      //----------------------------------------------------------



      //------ Meotdo updateVizframe2 recoge fechas importantes y hace un grafico 
      updateVizFrame2: function (oFechasModel) {
        var oView = this.getView();
        var oModel = oView.getModel("planning"); // Obtén el modelo 'planning' si es necesario

        if (!(oFechasModel instanceof sap.ui.model.json.JSONModel) || !oFechasModel.getData) {
          console.error("El modelo 'fechasModel' no está definido.");
          return;
        }

        var fechasData = oFechasModel.getData().fechas; // Obtén los datos del modelo

        var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
          pattern: "yyyy-MM-dd",
        });

        // Procesar datos para el gráfico
        var aChartData2 = fechasData.map(function (fechas) {
          var startDate = fechas.fechaInicioConstruccion && fechas.fechaInicioConstruccion !== "No definida" ? new Date(fechas.fechaInicioConstruccion) : null;
          var endDate = fechas.fechaFinPruebasTQ && fechas.fechaFinPruebasTQ !== "No definida" ? new Date(fechas.fechaFinPruebasTQ) : null;

          // Validación de las fechas
          if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
            var duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // Convertir a días

            return {
              fase: fechas.fase,
              fechaInicio: oDateFormat.format(startDate),
              fechaFin: oDateFormat.format(endDate),
              duracion: duration,
              label: `Inicio: ${oDateFormat.format(startDate)}, Fin: ${oDateFormat.format(endDate)}, Duración: ${duration} días`
            };
          } else {
            console.warn("Fechas no válidas para la fase:", fechas);
            return null; // Devuelve null si las fechas no son válidas
          }
        }).filter(Boolean); // Filtra los elementos nulos

        // Asegúrate de que aChartData2 tenga la estructura adecuada
        oModel.setProperty("/chartModel", aChartData2); // Cambia esto a la propiedad que estás usando en tu modelo
        console.log("Datos del gráfico:", aChartData2);


      },
      //-----------------------------------------------------------    


      updateVizFrame3: function () {
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
          if (oHito.fase === "Kick off") {
            oFechas.fechaInicioConstruccion = oHito.fechaInicio;
          }
          if (oHito.fase === "Server post/prod") {
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

        this.updateVizFrame2(oFechasModel);
      },

      onFechaChange: function () {
        // Cuando se cambia una fecha en la tabla, se actualiza el gráfico
        //() this._updateChart();
        this.updateVizFrame1();
        this.updateVizFrame3();
      },


      //-------------------------------------------------------------------------














      // Evento para la primera tabla
      onPerfilChangeTabla1: function (oEvent) {
        this.updateRowData(oEvent, ["table_dimicFecha"]);
      },



      //---- Método selección de ítems y cambio para múltiples tablas ----
      updateRowData: function (oEvent) {
        // Obtén el ID del Select que ha generado el evento
        const oSource = oEvent.getSource();

        // var  aTableIds = this.byId("table_dimicFecha");


        // Encuentra la tabla
        var oTable = this.byId("table_dimicFecha");

        // Obtén el índice de la fila seleccionada desde el Select
        var oItem = oSource.getParent(); // Obtiene el ColumnListItem
        var iIndex = oTable.indexOfItem(oItem); // Obtiene el índice de la fila

        if (iIndex === -1) {
          console.error(`Índice de la fila no encontrado en la tabla ${oTableId}. Verifica la estructura de la tabla.`);
          return;
        } else {
          console.log("Encontrada");
        }

        // Obtén las celdas de la fila
        var aItems = oTable.getItems();
        var oRowData = aItems[iIndex].getCells();

        if (!oRowData || oRowData.length === 0) {
          console.error(`Datos de la fila no encontrados en la tabla ${oTableId}.`);
          return;
        }

        // Obtén el valor seleccionado del Select
        var sSelectedText = oSource.getSelectedItem().getText();

        // Define un objeto de configuración para las actualizaciones
        var oConfig = {
          "Director": {
            PMJ: 1370.88,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,


          },
          "CG4.C": {
            PMJ: 186.72,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG4.A": {
            PMJ: 331.24,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG4.B": {
            PMJ: 225.11,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG3": {
            PMJ: 408.81,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG2": {
            PMJ: 520.79,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "CG1": {
            PMJ: 656.80,
            "2024": 0.00,
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
          oRowData[7].setText(oUpdate["2026"]);   // Ajusta según la celda específica para el año 2026
          oRowData[8].setText(oUpdate["2027"]);   // Ajusta según la celda específica para el año 2027
          oRowData[9].setText(oUpdate["2028"]);   // Ajusta según la celda específica para el año 2028
          oRowData[10].setText(oUpdate["2029"]);  // Ajusta según la celda específica para el año 2029

          // Suma de 2024 y 2025 para 'Total'
          var total = 0;
          oRowData[11].setText(total);  // Coloca la suma en 'Total'

          // Suma de PMJ + Total para 'Total1'
          var total1 = 0;
          oRowData[12].setText(total1);  // Coloca la suma en 'Total1'
          console.log(total1);



        } else {
          console.error(`No hay configuración definida para el valor seleccionado: ${sSelectedText}`);
        }

      },


      selectFuncionchange: function (oEvent) {
        // Obtén el ID del Select que ha generado el evento
        const oSource = oEvent.getSource();

        // Encuentra la tabla
        const oTable = this.byId("tablaConsuExter");

        // Obtén el índice de la fila seleccionada desde el Select
        var oItem = oSource.getParent(); // Obtiene el ColumnListItem
        var iIndex = oTable.indexOfItem(oItem); // Obtiene el índice de la fila

        if (iIndex === -1) {
          console.error(`Índice de la fila no encontrado en la tabla ${oTableId}. Verifica la estructura de la tabla.`);
          return;
        }

        // Obtén las celdas de la fila
        var aItems = oTable.getItems();
        var oRowData = aItems[iIndex].getCells();

        if (!oRowData || oRowData.length === 0) {
          console.error(`Datos de la fila no encontrados en la tabla ${oTableId}.`);
          return;
        }

        // Obtén el valor seleccionado del Select
        var sSelectedText = oSource.getSelectedItem().getText();

        // Define un objeto de configuración para las actualizaciones
        var oConfig = {
          "Equipo Argentina - Analista": {
            PMJ: 216.18,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,


          },
          "Equipo Argentina - Asistente": {
            PMJ: 190.74,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Equipo Argentina - Jefe": {
            PMJ: 296.13,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Equipo Argentina - Gerente": {
            PMJ: 478.34,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Basis - Consultor Junior": {
            PMJ: 207.19,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Basis - Consultor Senior": {
            PMJ: 356.21,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Basis - Arquitecto": {
            PMJ: 356.21,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "QA - Análisis Funcional": {
            PMJ: 278.00,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "QA - Jefe Proyecto": {
            PMJ: 320.00,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "Testing - Análisis Funcional": {
            PMJ: 180.00,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "TA - Consultor Senior 1-2": {
            PMJ: 379.17,
            "2024": 0.00,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
          "TA - Consultor Senior 3": {
            PMJ: 455.40,
            "2024": 0.93,
            "2025": 0.00,
            "2026": 0.00,
            "2027": 0.00,
            "2028": 0.00,
            "2029": 0.00,
          },
        };

        // Lógica para actualizar datos basados en la selección del Select
        var oUpdate = oConfig[sSelectedText];

        if (oUpdate) {
          oRowData[4].setText(oUpdate.PMJ); // Ajusta según la celda específica para PMJ
          oRowData[5].setText(oUpdate["2024"]);   // Ajusta según la celda específica para el año 2024
          oRowData[6].setText(oUpdate["2025"]);   // Ajusta según la celda específica para el año 2025
          oRowData[7].setText(oUpdate["2026"]);   // Ajusta según la celda específica para el año 2026
          oRowData[8].setText(oUpdate["2027"]);   // Ajusta según la celda específica para el año 2027
          oRowData[9].setText(oUpdate["2028"]);   // Ajusta según la celda específica para el año 2028
          oRowData[10].setText(oUpdate["2029"]);  // Ajusta según la celda específica para el año 2029

          // Suma de 2024 y 2025 para 'Total'
          var total = 0;
          oRowData[11].setText(total);  // Coloca la suma en 'Total'

          // Suma de PMJ + Total para 'Total1'
          var total1 = 0;
          oRowData[12].setText(total1);  // Coloca la suma en 'Total1'
          console.log(total1);


        } else {
          console.error(`No hay configuración definida para el valor seleccionado: ${sSelectedText}`);
        }

      },















      //-------------------------- METODO INSERTAR ----------------------
      onSave: async function (oEvent) {
        let errorCount = 0;

        const incompleteFields = [];

        const sProjectID = this._sProjectID; // ID del proyecto
        const saChartdata = this._aChartData;
        const scodigoProyect = parseInt(this.byId("input0").getValue(), 10);
        const snameProyect = this.byId("input1").getValue();
        const spluriAnual = this.byId("box_pluriAnual").getSelected();
        const sClienteFac = this.byId("id_Cfactur").getValue();
        const sMultiJuri = this.byId("box_multiJuridica").getSelected();
        const sClienteFunc = this.byId("int_clienteFun").getValue();
        const sObjetivoAlcance = this.byId("idObje").getValue();
        const sAsunyRestric = this.byId("idAsunyRestri").getValue();
        const sDatosExtra = this.byId("area0").getValue();
        const sFechaIni = this.byId("date_inico").getDateValue();
        const sFechaFin = this.byId("date_fin").getDateValue();


        // Instanciar el formateador de fechas
        var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
          pattern: "yyyy-MM-dd'T'HH:mm:ss" // Formato requerido por OData
        });

        // Formatear las fechas a texto en el formato correcto
        const sFechaIniFormatted = sFechaIni ? oDateFormat.format(sFechaIni) : null;
        const sFechaFinFormatted = sFechaFin ? oDateFormat.format(sFechaFin) : null;




        // Acceder a los controles Select
        const sSelectedKey = this.byId("idNatu").getSelectedKey();
        const sSelecKeyA = this.byId("slct_area").getSelectedKey();
        const sSelecKeyJe = this.byId("slct_Jefe").getSelectedKey();
        const sSelectKeyIni = this.byId("slct_inic").getSelectedKey();
        const sSelectKeySegui = this.byId("selc_Segui").getSelectedKey();
        const sSelectKeyEjcu = this.byId("selc_ejcu").getSelectedKey();
        const sSelectKeyClienNuevo = this.byId("slct_client").getSelectedKey();
        const sSelectKeyVerti = this.byId("slct_verti").getSelectedKey();
        const sSelectKeyAmrep = this.byId("selct_Amrecp").getSelectedKey();

        // Función de validación
        const validateField = (control, value, fieldName) => {
          if (!value || (typeof value === 'string' && value.trim() === "")) {
            control.setValueState("Error");
            control.setValueStateText("Este campo es obligatorio");
            errorCount++;

            // Agregar el nombre del campo al array
            if (!incompleteFields.includes(fieldName)) {
              incompleteFields.push(fieldName);
            }

          } else {
            control.setValueState("None");
          }
        };


        // Validar cada campo
        validateField(this.byId("input0"), scodigoProyect, "Código del Proyecto");
        validateField(this.byId("input1"), snameProyect, "Nombre del Proyecto");
        validateField(this.byId("id_Cfactur"), sClienteFac, "Cliente de Facturación");
        validateField(this.byId("int_clienteFun"), sClienteFunc, "Cliente Funcional");
        validateField(this.byId("idNatu"), sSelectedKey, "Naturaleza");


        // Si hay errores, detener el envío
        if (errorCount > 0) {

          const message = `Por favor, complete los siguientes campos: ${incompleteFields.join(", ")}`;
          sap.m.MessageBox.warning(message, {
            title: "Advertencia"
          });

          const oIconTabFilter = this.byId("idIniu");
          oIconTabFilter.setCount(errorCount);
          return; // Detener el proceso si hay errores
        }

        // Prepara el payload
        const payload = {
          codigoProyect: scodigoProyect,
          nameProyect: snameProyect,
          pluriAnual: spluriAnual,
          clienteFacturacion: sClienteFac,
          multijuridica: sMultiJuri,
          Naturaleza_ID: sSelectedKey,
          Area_ID: sSelecKeyA,
          Iniciativa_ID: sSelectKeyIni,
          jefeProyectID_ID: sSelecKeyJe,
          objetivoAlcance: sObjetivoAlcance,
          AsuncionesyRestricciones: sAsunyRestric,
          Vertical_ID: sSelectKeyVerti,
          Fechainicio: sFechaIniFormatted,
          FechaFin: sFechaFinFormatted,
          Seguimiento_ID: sSelectKeySegui,
          EjecucionVia_ID: sSelectKeyEjcu,
          AmReceptor_ID: sSelectKeyAmrep,
          clienteFuncional_ID: sSelectKeyClienNuevo,
          Estado: "Pendiente",
          datosExtra: sDatosExtra,

        };


        /*
        // Solo añadir Fechainicio y FechaFin si tienen un valor válido
        if (sFechaIni) {
          payload.Fechainicio = sFechaIni.toISOString().split('T')[0]; // Solo la parte de la fecha (YYYY-MM-DD)
              console.log(sFechaFin);
          //    console.log(Fechainicio);
        
        }
        
        if (sFechaFin) {
          payload.FechaFin = sFechaFin.toISOString().split('T')[0]; // Solo la parte de la fecha (YYYY-MM-DD)
        
        }*/



        try {
          let response;

          // Si hay un ID, es una actualización (PATCH)
          if (sProjectID) {
            response = await fetch(`/odata/v4/datos-cdo/DatosProyect(${sProjectID})`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });


            if (response.ok) {
              sap.m.MessageToast.show("Actualización realizada con éxito");
              // Llamar correctamente al método
              //    await this.actualizarProveedores(sProjectID);

              this.getOwnerComponent().getRouter().navTo("appNoparame"); // Navegar de vuelta a la vista principal
            }

          } else {
            // Si no hay ID, es una creación (POST)
            response = await fetch("/odata/v4/datos-cdo/DatosProyect", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });




            // Manejo de la respuesta de inserción del proyecto
            if (response.ok) {
              const result = await response.json();
              const generatedId = result.ID; // Obtener el ID generado
              console.log("Guardado con éxito. ID:", generatedId);


              await this.inserChart(generatedId);

              await this.insertarProveedor(generatedId);

              await this.insertFacturacion(generatedId);

              await this.insertClientFactura(generatedId);

              await this.insertRecursosInternos(generatedId);

              await this.insertCosumoExterno(generatedId);

              await this.insertRecursoExterno(generatedId);

              await this.insertarOtrosConceptos(generatedId);

              // Navegar de vuelta a la vista principal o hacer lo que necesites después de guardar
              const oRouter = this.getOwnerComponent().getRouter();
              oRouter.navTo("app", {
                newId: generatedId
              });
            } else {
              const errorMessage = await response.text();
              console.log("Error al guardar el proyecto:", errorMessage);
              sap.m.MessageToast.show("Error al guardar el proyecto: " + errorMessage);
            }
          }
        } catch (error) {
          console.log("Error en la llamada al servicio:", error);
          sap.m.MessageToast.show("Error en la llamada al servicio: " + error.message);
        }
      },





      inserChart: async function (generatedId) {

        const saChartdata = this._aChartData;


        // ----------------Inserción de planificación
        const payload2Array = saChartdata.map(chart => ({
          hito: chart.fase,
          fecha_inicio: chart.fechaInicio,
          fecha_fin: chart.fechaFin,
          duracion: this.formatDuration(chart.duracion), // Llamada a la función
          datosProyect_ID: generatedId // Usar el ID generado
        }));

        // Insertar cada elemento en el array
        for (const payload2 of payload2Array) {
          const response2 = await fetch("/odata/v4/datos-cdo/planificacion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload2)
          });

          if (response2.ok) {
            const result2 = await response2.json();
            console.log("Planificación guardada con éxito:", result2);
          } else {
            const errorMessage = await response2.text();
            console.log("Error al guardar la planificación:", errorMessage);
            sap.m.MessageToast.show("Error al guardar la planificación: " + errorMessage);
          }
        }


      },



      insertFacturacion: async function (generatedId) {

        //Tabla facturacion 
        var oTablaFac = this.byId("table0");
        var itemsF = oTablaFac.getItems();
        var DataFac = [];
        var totalFacturacion = parseInt(this.byId("text73_172746565340567").getText(), 10);

        //   const totalFacturacion = this._totalOferta;

        console.log("Total facturación:", totalFacturacion);

        itemsF.forEach(function (oItem) {
          // Obtener las celdas (inputs) de la fila
          var aCells = oItem.getCells();


          // Comprobar que las celdas tengan controles y obtener los valores
          var fechaEstimida = (aCells[0] && aCells[0].getValue) ? aCells[0].getValue() : ""; // Fecha estimada
          var descripcionHito = (aCells[1] && aCells[1].getValue) ? aCells[1].getValue() : ""; // Descripción del hito
          var facturacion = (aCells[2] && aCells[2].getValue) ? parseInt(aCells[2].getValue(), 10) : 0; // Facturación



          // Validar la fecha
          if (fechaEstimida) {
            var parts = fechaEstimida.split("/");
            if (parts.length === 3) {
              var oDate = new Date(parts[2], parts[1] - 1, parts[0]); // Crear la fecha

              // Comprobar si la fecha es válida
              if (!isNaN(oDate.getTime())) {
                var sFormattedDate = oDate.toISOString().split('T')[0]; // Formatear la fecha
                // Agregar datos al arreglo
                DataFac.push({
                  fechaEstimida: sFormattedDate,
                  descripcionHito: descripcionHito,
                  facturacion: facturacion,
                  total: totalFacturacion, // Total puede calcularse si es necesario
                  datosProyect_ID: generatedId // ID del proyecto
                });
              } else {
                console.error("Fecha inválida:", fechaEstimida);
              }
            } else {
              console.error("Formato de fecha incorrecto:", fechaEstimida);
            }
          }
        });



        // 6. Guardar ProveedoresC (POST)
        for (let data of DataFac) {
          data.datosProyect_ID = generatedId;
          const response4 = await fetch("/odata/v4/datos-cdo/Facturacion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });

          if (response4.ok) {
            const response44 = await response4.json();
            console.log("Facturacion guardada con éxito:", response44);
          } else {
            const errorMessage = await response4.text();
            console.log("Error al guardar la Facturacion:", errorMessage);
            sap.m.MessageToast.show("Error al guardar la Facturacion: " + errorMessage);
          }
        }



      },




      insertarProveedor: async function (generatedId) {

        // Obtener la tabla por ID
        var oTable = this.byId("table2");
        var aItems = oTable.getItems();
        var aData = [];



        // Recorrer cada fila de la tabla
        aItems.forEach(function (oItem) {
          // Obtener las celdas (inputs) de la fila
          var aCells = oItem.getCells();

          // Extraer el valor de cada celda (input) de la fila
          var valueCondi = aCells[0].getValue(); // Input para valueCondi
          var valueProvee = aCells[1].getValue(); // Input para valueProvee
          var checkCondi = this.byId("box_condi").getSelected(); // Checkbox Condicionado
          var checkProveedor = this.byId("box_prove").getSelected(); // Checkbox Proveedores

          // Agregar los valores al arreglo de datos, asegurándonos de que coincidan con los campos en la entidad ProveedoresC
          aData.push({
            checkCondi: checkCondi,
            checkProveedor: checkProveedor,
            valueCondi: valueCondi,
            valueProvee: valueProvee,
            datosProyect_ID: generatedId // clave foránea
          });
        }.bind(this));


        // 6. Guardar ProveedoresC (POST)
        for (let data of aData) {
          data.datosProyect_ID = generatedId;
          await fetch("/odata/v4/datos-cdo/ProveedoresC", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
        }
      },


      //--- RECURSOS INTERNOS -----

      insertRecursosInternos: async function (generatedId) {
        // Obtener la tabla por su ID
        const oTable = this.byId("table_dimicFecha");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sPerfil = oItem.getCells()[2].getSelectedKey(); // Select de PerfilServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sPerfil || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            PerfilServicio_ID: sPerfil,
            datosProyect_ID: generatedId
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/RecursosInternos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();
              const idRecursos = result.ID; // Obtener el ID generado

              await this.insertOtrosGastos(idRecursos);
              await this.insertOtrosRecursos(idRecursos);

              console.log("Fila " + (i + 1) + " guardada con éxito: RECUROSOS INTERNOS", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },


      insertOtrosGastos: async function (idRecursos) {

        // Obtener la tabla por su ID
        const oTable = this.byId("table0_1727879576857");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            RecursosInternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/otrosGastoRecu", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();



              console.log("Fila " + (i + 1) + " guardada con éxito: INSERT OTROS GASTOS ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },


      insertOtrosRecursos: async function (idRecursos) {

        // Obtener la tabla por su ID
        const oTable = this.byId("table0_1727879940116");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            RecursosInternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/otrosRecursos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();



              console.log("Fila " + (i + 1) + " guardada con éxito: OTROS RECURSOS ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },


      //----------------------------


      // --------------CONSUMO EXTERNO ------------------
      insertCosumoExterno: async function (generatedId) {
        // Obtener la tabla por su ID
        const oTable = this.byId("tablaConsuExter");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sPerfil = oItem.getCells()[2].getSelectedKey(); // Select de PerfilServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sPerfil || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalC: stotalRe,
            tipoServicio_ID: stipoServi,
            PerfilConsumo_ID: sPerfil,
            datosProyect_ID: generatedId
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/ConsumoExternos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();
              const idRecursos = result.ID; // Obtener el ID generado


              await this.insertServiConsu(idRecursos);
              await this.insertGastoConsu(idRecursos);

              console.log("Fila " + (i + 1) + " guardada con éxito:CONSUMO EXTERNO", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },



      insertServiConsu: async function (idRecursos) {
        // Obtener la tabla por su ID
        const oTable = this.byId("idOtroserConsu");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            ConsumoExternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/otrosServiciosConsu", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();


              console.log("Fila " + (i + 1) + " guardada con éxito: INSERT SERVI ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },

      insertGastoConsu: async function (idRecursos) {
        // Obtener la tabla por su ID
        const oTable = this.byId("idGastoViajeConsu");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            ConsumoExternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/GastoViajeConsumo", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();


              console.log("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES CONSUMO ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },
      //-----------------------------------------------------------



      //------------RECURSO EXTERNO ------------------------

      insertRecursoExterno: async function (generatedId) {
        // Obtener la tabla por su ID
        const oTable = this.byId("tablaRecExterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sPerfil = oItem.getCells()[2].getValue(); // Select de PerfilServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sPerfil || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalR: stotalRe,
            tipoServicio_ID: stipoServi,
            PerfilServicio: sPerfil,
            datosProyect_ID: generatedId
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/RecursosExternos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();
              const idRecursos = result.ID; // Obtener el ID generado


              await this.insertServicioRecuExter(idRecursos);
              await this.insertGastoViajeExterno(idRecursos);

              console.log("Fila " + (i + 1) + " guardada con éxito:RECURSO EXTERNO", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },



      insertServicioRecuExter: async function (idRecursos) {
        // Obtener la tabla por su ID
        const oTable = this.byId("idServiExterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            RecursosExternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/serviRecurExter", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();


              console.log("Fila " + (i + 1) + " guardada con éxito: SERVICIO EXTERNO  ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },

      insertGastoViajeExterno: async function (idRecursos) {
        // Obtener la tabla por su ID
        const oTable = this.byId("idGastoRecuExter");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            RecursosExternos_ID: idRecursos
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/GastoViajeRecExter", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();


              console.log("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES RECURSO EXTERNO  ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },


      insertarOtrosConceptos: async function (generatedId) {
        // Obtener la tabla por su ID
        const oTable = this.byId("table0_1724413700665");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const sConcepto = oItem.getCells()[2].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[3]?.getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[4]?.getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[5]?.getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalC: stotalRe,
            datosProyect_ID: generatedId
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/otrosConceptos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();
              const idOtrosConcep = result.ID;
              await this.insertarLicencia(idOtrosConcep);

              console.log("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES RECURSO EXTERNO  ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },


      insertarLicencia: async function (idOtrosConcep) {

        // Obtener la tabla por su ID
        const oTable = this.byId("table0_1727955577124");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const sConcepto = oItem.getCells()[2].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[3]?.getText()); // Text de PMJ
          const sTotal = this.convertToInt(oItem.getCells()[4]?.getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[5]?.getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
            sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            return; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            total: sTotal,
            totalC: stotalRe,
            otrosConceptos_ID: idOtrosConcep
          };

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            const response = await fetch("/odata/v4/datos-cdo/LicenciasCon", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const result = await response.json();


              console.log("Fila " + (i + 1) + " guardada con éxito: INSERTAR LICENCIA ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }


      },



      /* insertRecursosInternos: async function (generatedId) {
         // Obtener la tabla por su ID
         const oTable = this.byId("table_dimicFecha");
         
         // Obtener todos los elementos del tipo ColumnListItem
         const aItems = oTable.getItems();
         
         // Iterar sobre cada fila
         for (let i = 0; i < aItems.length; i++) {
             const oItem = aItems[i];  // Obtener la fila actual
             
             // Obtener los controles dentro de cada celda
             const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
             const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
             const sPerfil = oItem.getCells()[2].getSelectedKey(); // Select de PerfilServicio
             const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
             const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
             const sTotal = this.convertToInt(oItem.getCells()[5].getText()); // Text de Total
             const stotalRe = this.convertToInt(oItem.getCells()[6].getText()); // Text de TotalE
             
             // Validar si todos los datos son válidos
             if (!sVertical || !stipoServi || !sPerfil || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
                 sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i+1) + " correctamente.");
                 return; // Si hay un error, no se envía la solicitud
             }
     
             // Construir el payload para cada fila
             const payload = {
                 Vertical_ID: sVertical,
                 ConceptoOferta: sConcepto,
                 PMJ: sPMJ,
                 total: sTotal,
                 totalE: stotalRe,
                 tipoServicio_ID: stipoServi,
                 PerfilServicio_ID: sPerfil,
                 datosProyect_ID: generatedId
             };
     
             try {
                 // Hacer el fetch de manera asincrónica para cada fila
                 const response = await fetch("/odata/v4/datos-cdo/RecursosInternos", {
                     method: "POST",
                     headers: {
                         "Content-Type": "application/json"
                     },
                     body: JSON.stringify(payload)
                 });
     
                 if (response.ok) {
                     const result = await response.json();
                     console.log("Fila " + (i+1) + " guardada con éxito: RECUROSOS INTERNOS", result);
                 } else {
                     const errorMessage = await response.text();
                     console.error("Error al guardar la fila " + (i+1) + ":", errorMessage);
                     sap.m.MessageToast.show("Error al guardar la fila " + (i+1) + ": " + errorMessage);
                 }
             } catch (error) {
                 console.error("Error en la llamada al servicio para la fila " + (i+1) + ":", error);
                 sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i+1) + ": " + error.message);
             }
         }
     },*/

      //----------------------------------------------------


      //--------------------METODO ACTUALIZAR  -------------------------------------









      // Función para convertir texto a entero con manejo de errores
      convertToInt: function (text) {
        const parsed = parseInt(text, 10);
        return isNaN(parsed) ? null : parsed;
      },






      /*insertRecursosInternos: async function (generatedId){

     const sVertical = this.byId("selec0").getSelectedKey();
     const stipoServi = this.byId("select0_17163029264").getSelectedKey();
     const sPerfil = this.byId("selct3").getSelectedKey();
     const sConcepto = this.byId("input0_2958934").getValue();
     const sPMJ =  parseInt(this.byId("pmj2").getText(),10);
     const sTotal =  parseInt( this.byId("text32").getText(),10);
     const stotalRe = parseInt(  this.byId("text33").getText(),10);




       const payload = {

        Vertical_ID : sVertical,
        ConceptoOferta : sConcepto,
        PMJ: sPMJ,
        total: sTotal,
        totalE: stotalRe,
        tipoServicio_ID : stipoServi,
        PerfilServicio_ID: sPerfil,
        datosProyect_ID : generatedId
        }



        try {
          let response;

        response = await fetch("/odata/v4/datos-cdo/RecursosInternos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result2 = await response.json();
          console.log("Recursos internos guardada con éxito:", result2);
        } else {
          const errorMessage = await response.text();
          console.log("Error al guardar la Recursos internos:", errorMessage);
          sap.m.MessageToast.show("Error al guardar la Recursos internos: " + errorMessage);
        }



      } catch (error) {
          console.log("Error en la llamada al servicio:", error);
          sap.m.MessageToast.show("Error en la llamada al servicio: " + error.message);
        }


      },*/

      insertClientFactura: async function (generatedId) {
        var oTablaFac = this.byId("table_clienteFac");
        var aItems = oTablaFac.getItems();
        var aData = [];
        var totalOferta = 0; // Variable para acumular la suma de "oferta"

        aItems.forEach(function (oItem, index) {
          // Omitir la última fila
          if (index === aItems.length - 1) {
            return; // Salir de esta iteración si es la última fila
          }

          var aCells = oItem.getCells();
          var valueJudi = "";
          var valueOferta = "";

          // Verificar si la celda no es undefined y luego obtener su metadata
          if (aCells[0] && aCells[0].getMetadata().getName() === "sap.m.Input") {
            valueJudi = aCells[0].getValue(); // Para inputs en la primera celda
          } else if (aCells[0] && aCells[0].getMetadata().getName() === "sap.m.Text") {
            valueJudi = aCells[0].getText(); // Para textos en la primera celda
          }

          if (aCells[1] && aCells[1].getMetadata().getName() === "sap.m.Input") {
            valueOferta = aCells[1].getValue(); // Para inputs en la segunda celda
          } else if (aCells[1] && aCells[1].getMetadata().getName() === "sap.m.Text") {
            valueOferta = aCells[1].getText(); // Para textos en la segunda celda
          }


          var totalOfer = this.byId("text73_172746565340567").getText();

          // Solo agregar aData si hay valores válidos
          if (valueJudi !== "" || valueOferta !== "") {
            aData.push({
              juridica: valueJudi,
              oferta: valueOferta,
              total: totalOfer,
              datosProyect_ID: generatedId
            });
          }
        }.bind(this));

        console.log("Total de la columna oferta: ", totalOferta); // Muestra el total en la consola

        // Aquí se procede a hacer el POST de cada fila a la entidad OData
        for (let data of aData) {
          const insert4 = await fetch("/odata/v4/datos-cdo/ClientFactura", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });

          if (insert4.ok) {
            const errorInfo = await insert4.json();
          } else {
            const errorMessage = await insert4.text();
            console.log("Error al guardar la Facturacion:", errorMessage);
            sap.m.MessageToast.show("Error al guardar la Facturacion: " + errorMessage);
          }
        }

        // También puedes mostrar el total usando un mensaje SAPUI5
        sap.m.MessageToast.show("El total de la columna oferta es: " + totalOferta);
      },








      /*   insertClientFactura: async function (generatedId) {
           var oTablaFac = this.byId("table_clienteFac");
           var aItems = oTablaFac.getItems();
           var aData = [];
           var totalOferta = 0; // Variable para acumular la suma de "oferta"
       
           aItems.forEach(function (oItem) {
               var aCells = oItem.getCells();
               var valueJudi = "";
               var valueOferta = "";
               var totalOfer = "";
       
               // Verificar si la celda no es undefined y luego obtener su metadata
               if (aCells[0] && aCells[0].getMetadata().getName() === "sap.m.Input") {
                   valueJudi = aCells[0].getValue(); // Para inputs en la primera celda
               } else if (aCells[0] && aCells[0].getMetadata().getName() === "sap.m.Text") {
                   valueJudi = aCells[0].getText(); // Para textos en la primera celda
               }
       
               if (aCells[1] && aCells[1].getMetadata().getName() === "sap.m.Input") {
                   valueOferta = aCells[1].getValue(); // Para inputs en la segunda celda
               } else if (aCells[1] && aCells[1].getMetadata().getName() === "sap.m.Text") {
                   valueOferta = aCells[1].getText(); // Para textos en la segunda celda
               }
       
               totalOfer =   this.byId("text73_172746565340567").getText();
   
               console.log(totalOfer);
       
               // Solo agregar aData si hay valores válidos
               if (valueJudi !== "" || valueOferta !== "") {
                   aData.push({
                       juridica: valueJudi,
                       oferta: valueOferta,
                       total: totalOfer,
                       datosProyect_ID: generatedId
                   });
               }
           }.bind(this));
       
           console.log("Total de la columna oferta: ", totalOferta); // Muestra el total en la consola
       
           // Aquí se procede a hacer el POST de cada fila a la entidad OData
           for (let data of aData) {
               const insert4 = await fetch("/odata/v4/datos-cdo/ClientFactura", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify(data)
               });
       
               if (insert4.ok) {
                   const errorInfo = await insert4.json();
               } else {
                   const errorMessage = await insert4.text();
                   console.log("Error al guardar la Facturacion:", errorMessage);
                   sap.m.MessageToast.show("Error al guardar la Facturacion: " + errorMessage);
               }
           }
       
           // También puedes mostrar el total usando un mensaje SAPUI5
           sap.m.MessageToast.show("El total de la columna oferta es: " + totalOferta);
       },*/


      metodoSumar: function () {


        var oTablaFac = this.byId("table_clienteFac");
        var aItems = oTablaFac.getItems();
        var totalOferta = 0;

        console.log("Cantidad de filas en la tabla:", aItems.length);

        // Iterar solo sobre las filas de datos (excluyendo la última)
        aItems.forEach(function (oItem, index) {
          // Verifica si es la fila de total (última fila)
          if (index < aItems.length - 1) { // Excluye la última fila
            var aCells = oItem.getCells();
            var valueOferta = "";

            // Obtiene el valor de la segunda celda (columna de Oferta)
            var ofertaCell = aCells[1];

            // Verifica si la celda es de tipo Input y obtiene el valor
            if (ofertaCell.getMetadata().getName() === "sap.m.Input") {
              valueOferta = ofertaCell.getValue();
            }

            // Limpiar espacios y convertir a número
            valueOferta = valueOferta.trim();
            var numericValue = parseFloat(valueOferta);

            // Imprimir para depuración
            console.log("Fila:", index, "Valor de la celda:", valueOferta, "-> Valor numérico:", numericValue);

            // Solo sumar si valueOferta es un número válido
            if (!isNaN(numericValue)) {
              totalOferta += numericValue; // Solo sumar si es un número
              console.log("Total acumulado hasta ahora:", totalOferta); // Imprimir el total acumulado
            }
          }
        });

        // Actualiza el control Text con el total de la oferta
        this.byId("text73_172746565340567").setText(totalOferta.toFixed(2));


        console.log("Total de la columna oferta:", totalOferta);


        this._totalOferta = totalOferta;

      },


      metodoSumarFac: function () {
        var oTablaFac = this.byId("table0");
        var aItems = oTablaFac.getItems();
        var totalOferta = 0;

        console.log("Cantidad de filas en la tabla:", aItems.length);

        // Iterar solo sobre las filas de datos (excluyendo la última)
        aItems.forEach(function (oItem, index) {
          // Verifica si es la fila de total (última fila)
          if (index < aItems.length - 1) { // Excluye la última fila
            var aCells = oItem.getCells();
            var valueOferta = "";

            // Obtiene el valor de la segunda celda (columna de Oferta)
            var ofertaCell = aCells[2];

            // Verifica si la celda es de tipo Input y obtiene el valor
            if (ofertaCell.getMetadata().getName() === "sap.m.Input") {
              valueOferta = ofertaCell.getValue();
            }

            // Limpiar espacios y convertir a número
            valueOferta = valueOferta.trim();
            var numericValue = parseFloat(valueOferta);

            // Imprimir para depuración
            console.log("Fila:", index, "Valor de la celda:", valueOferta, "-> Valor numérico:", numericValue);

            // Solo sumar si valueOferta es un número válido
            if (!isNaN(numericValue)) {
              totalOferta += numericValue; // Solo sumar si es un número
              console.log("Total acumulado hasta ahora:", totalOferta); // Imprimir el total acumulado
            }
          }
        });

        // Actualiza el control Text con el total de la oferta
        this.byId("text73_172746565340569997").setText(totalOferta.toFixed(2));

        console.log("Total de la columna oferta:", totalOferta);
      },





      //---- FORMATEAR HORAS PARA SU INSERCION PLANIFICIACION -------
      formatDuration: function (duration) {
        const hours = Math.floor(duration);
        const minutes = Math.floor((duration - hours) * 60);
        const seconds = 0; // Asumiendo que no tienes segundos en este caso
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      },
      //-------------------------------------------------



      /// ------- Metodo limpiar celdas ---------------------
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
      //------------------------------------------------




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


      //---- Añadir columnas tabla -----------------
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

                change: this.updateRowData.bind(this) // Asocia el evento de cambio aquí

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
          var oEvent = { getSource: () => oNewItem };  // Simular un evento con getSource
          this.updateRowData(oEvent);  // Pasar el evento simulado       



        } else {
          console.error("No se encontró la tabla con ID: " + sTableId);
        }
      },
      //--------------------------------------------





      onAddRowPress2: function (sTableId) {


        var oTable = this.byId(sTableId);


        if (!oTable) {
          // Si no funciona, intenta con sap.ui.getCore().byId y el ID completo
          oTable = sap.ui.getCore().byId("container-project1---view--tablaConsuExter");
        }



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
                selectedKey: "{PerfilConsumo>valuePerfilC}",
                forceSelection: false,
                items: {
                  path: "/PerfilConsumo",
                  template: new sap.ui.core.Item({
                    key: "{ID}",
                    text: "{nombrePerfilC}",
                  }),
                },
                change: this.selectFuncionchange.bind(this) // Asocia el evento de cambio aquí

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

            ],

          });
          oTable.addItem(oNewItem);

          this.fechasDinamicas();

          var oEvent = { getSource: () => oNewItem };  // Simular un evento con getSource
          this.selectFuncionchange(oEvent);  // Pasar el evento simulado       


        } else {
          console.error("No se encontró la tabla con ID: " + sTableId);
        }

      },

      onAddRowPress4: function (sTableId) {
        console.log(sTableId);

        var oTable = this.byId("table0_1724413700665");
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
              new sap.m.Text({ text: "" }),
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

      onAddRowPress3: function (sTableId) {
        console.log(sTableId);

        var oTable = this.byId("tablaRecExterno");
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
              new sap.m.Input({ value: "" }),
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


      // Fechas dinamicas y tabla dinamica---------  
      onDateChange: function () {
        this.updateVizFrame();
      },
      //-------------------------------------------


      fechasDinamicas: function (oEvent) {
        var startDatePicker = this.getView().byId("date_inico");
        var endDatePicker = this.getView().byId("date_fin");

        if (!startDatePicker || !endDatePicker) {
          console.error("Error: No se pudieron obtener los DatePickers.");
          return;
        }

        var startDate = startDatePicker.getDateValue();
        var endDate = endDatePicker.getDateValue();

        if (!startDate || !endDate) {
          console.log("Esperando a que se seleccionen ambas fechas.");
          return;
        }

        var diffMonths = this.getMonthsDifference(startDate, endDate);

        var flexBoxIds = [
          "box0_1714747137718",
          "box0_1727879568594",
          "box0_1727879817594",
          "box0_1721815443829",
          "box0_1727948724833",
          "box0_1727950351451",
          "box0_17218154429",
          "box0_1727953252765",
          "box1_1727953468615",
          "box0_17254429",
          "box0_1727955568380"
        ];

        flexBoxIds.forEach((flexBoxId) => {
          var flexBox = this.getView().byId(flexBoxId);
          if (flexBox) {
            flexBox.setWidth(diffMonths > 3 ? "3000px" : "100%");
          }
        });

        var tableIds = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
          "idOtroserConsu",
          "idGastoViajeConsu",
          "idServiExterno",
          "idGastoRecuExter",
          "table0_1724413700665",
          "table0_1727955577124",
          "table0_1727879576857",
          "table0_1727879940116"
        ];

        tableIds.forEach((tableId) => {
          var oTable = this.getView().byId(tableId);
          if (!oTable) {
            console.error("Error: No se pudo obtener la tabla con ID " + tableId);
            return;
          }

          // Eliminar columnas anteriores que fueron añadidas dinámicamente
          var columnCount = oTable.getColumns().length;
          for (var j = columnCount - 1; j >= 0; j--) {
            var columnHeader = oTable.getColumns()[j].getHeader();

            // Verificar si el header existe y si sigue el formato "año-mes" (2024-Enero, etc.)
            if (columnHeader && /\d{4}-\w+/.test(columnHeader.getText())) {
              oTable.removeColumn(oTable.getColumns()[j]);
            }
          }

          var totalColumnIndex = this.findTotalColumnIndex(oTable);

          // Añadir nuevas columnas dinámicas
          for (var i = 0; i <= diffMonths; i++) {
            var columnDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            var year = columnDate.getFullYear();
            var month = columnDate.toLocaleString("default", { month: "long" });
            var columnHeaderText = year + "-" + month;

            var oColumn = new sap.m.Column({
              header: new sap.m.Label({ text: columnHeaderText }),
              width: "100px"
            });

            oTable.insertColumn(oColumn, totalColumnIndex + 1 + i);

            for (var rowIndex = 0; rowIndex < oTable.getItems().length; rowIndex++) {
              var oRow = oTable.getItems()[rowIndex];

              // Crear el Input dinámicamente en cada celda
              var oInput = new sap.m.Input({
                placeholder: "0.00",
                // Evento de cambio (change) para capturar el valor ingresado
                change: this.handleInputChange.bind(this, tableId, rowIndex, i, year)
              });

              oRow.addCell(oInput); // Añadir el Input a la celda
            }
          }

          var oScrollContainer = this.getView().byId("scroll_container_" + tableId);
          if (oScrollContainer) {
            oScrollContainer.setHorizontal(true);
            oScrollContainer.setVertical(false);
            oScrollContainer.setWidth("100%");
          }

          console.log("startDate:", startDate);
          console.log("endDate:", endDate);
        });
      },

      resetYearlySums: function () {
        // Reinicia todas las sumas a 0
        this._yearlySums = {};
      },

      // Función manejadora para los cambios en el Input, específica para cada tabla
      handleInputChange: function (tableId, rowIndex, columnIndex, year, oEvent) {
        var newValue = parseFloat(oEvent.getParameter("value")) || 0;



        console.log(`Nuevo valor ingresado en la tabla ${tableId}, fila ${rowIndex}, columna ${columnIndex}: ${newValue}`);

        if (!this._tableValues) {
          this._tableValues = {};
        }

        if (!this._tableValues[tableId]) {
          this._tableValues[tableId] = {};
        }

        // Inicializar si la fila no existe
        if (!this._tableValues[tableId][rowIndex]) {
          this._tableValues[tableId][rowIndex] = {};
        }

        // Guardar el nuevo valor
        this._tableValues[tableId][rowIndex][columnIndex] = newValue;

        // Marcar la fila como editada
        if (!this._editedRows[tableId]) {
          this._editedRows[tableId] = new Set();
        }
        this._editedRows[tableId].add(rowIndex);


        // Actualizar las sumas por año
        if (!this._yearlySums) {
          this._yearlySums = {}; // Asegúrate de que este objeto esté inicializado
        }

        if (!this._yearlySums[year]) {
          this._yearlySums[year] = 0; // Inicializa si no existe
        }


        // Acumular el nuevo valor
        this._yearlySums[year] += newValue;

        // Aquí obtén el valor total acumulado para el año
        var totalForYear = this._yearlySums[year];

        this.updateTotalField(tableId, rowIndex, newValue);


        console.log(`Nuevo valor ingresado en la tabla 3  ${tableId}, fila ${rowIndex}, columna ${columnIndex}: ${newValue}`);

        // Otras operaciones que quieras hacer con el valor capturado
        this.setNewValueToField(newValue, tableId, totalForYear);

        console.log(`Suma total para el año ${year}: ${this._yearlySums[year]}`);
        //    this.resetYearlySums();
      },





      updateTotalField: function (tableId, rowIndex, newValue) {

        console.log("---->>> " + rowIndex);
        // Obtener el total acumulado para cada año
        var PMJCos = 0; 
        var totalFor2024 = this.getTotalForYear(2024, rowIndex);
        var totalFor2025 = this.getTotalForYear(2025, rowIndex);
        var totalFor2026 = this.getTotalForYear(2026, rowIndex);
        var totalFor2027 = this.getTotalForYear(2027, rowIndex);
        var totalFor2028 = this.getTotalForYear(2028, rowIndex);
        var totalFor2029 = this.getTotalForYear(2029, rowIndex);

        // Lógica para cada tabla según la tabla seleccionada (tableId)
        if (tableId === "tablaConsuExter") {
          // Obtener la tabla "tablaConsuExter"
          var oTable = this.byId("tablaConsuExter");

          if (!oTable) {
            console.error("La tabla 'tablaConsuExter' no fue encontrada.");
            return;
          }
          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas
                PMJCos =   aCells[4].getText(); // Celda para PMJ
                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                var resulCon = PMJCos * newValue

                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
               aCells[12].setText(resulCon + "€"); // Celda para Total 
              }
            }
          });

        } else if (tableId === "table_dimicFecha") {

          
          var totalSum =0;
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table_dimicFecha");

          if (!oTable) {
            console.error("La tabla 'table_dimicFecha' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                var PMJDi = aCells[4].getText();
                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                 totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                var resulDina = PMJDi * newValue


                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(resulDina + "€"); // Celda para Total 


              }
            }
          });
          var tae3 =  this.byId("inputReInter").setValue(totalSum.toFixed(2));

        } else if (tableId === "tablaRecExterno") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("tablaRecExterno");

          if (!oTable) {
            console.error("La tabla 'tablaRecExterno' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas
                var PMJRe = aCells[4].getValue();

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                var resulRec = PMJRe * newValue


                aCells[12].setText(resulRec + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "idOtroserConsu") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("idOtroserConsu");

          if (!oTable) {
            console.error("La tabla 'idOtroserConsu' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "idGastoViajeConsu") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("idGastoViajeConsu");

          if (!oTable) {
            console.error("La tabla 'idGastoViajeConsu' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "idServiExterno") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("idServiExterno");

          if (!oTable) {
            console.error("La tabla 'idServiExterno' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "idGastoRecuExter") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("idGastoRecuExter");

          if (!oTable) {
            console.error("La tabla 'idGastoRecuExter' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "table0_1724413700665") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table0_1724413700665");

          if (!oTable) {
            console.error("La tabla 'table0_1724413700665' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "table0_1727955577124") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table0_1727955577124");

          if (!oTable) {
            console.error("La tabla 'table0_1727955577124' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "table0_1727879576857") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table0_1727879576857");

          if (!oTable) {
            console.error("La tabla 'table0_1727879576857' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }else if (tableId === "table0_1727879940116") {
          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table0_1727879940116");

          if (!oTable) {
            console.error("La tabla 'table0_1727879940116' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

        }
        
        
        
        
        
        else {
          console.error("Tabla no reconocida: " + tableId);
        }

        // Limpiar las filas editadas para que no se actualicen más de una vez
        this._editedRows[tableId].clear();
      },


      getTotalForYear: function (year, rowIndex) {
        // Llama a resetYearlySums si estás cambiando de fila
        
        if (rowIndex !== this.currentRow) { // Verifica si la fila actual ha cambiado
          this.resetYearlySums(); // Reinicia los totales
          this.currentRow = rowIndex; // Actualiza la fila actual
        }

        // Verifica si hay datos para el año y devuelve la suma
        if (this._yearlySums && this._yearlySums[year] !== undefined) {
          return this._yearlySums[year];
        } else {
          console.warn(`No se encontró datos para el año ${year}`);
          return 0; // Devuelve 0 si no hay datos para el año
        }
      },



        enviarDatos: function(){

          this.byId("input0_1724751475780").setValue();

        },

      /* updateTotalField: function (tableId) {
         // Obtener el total acumulado para cada año
         var totalFor2024 = this.getTotalForYear(2024);
         var totalFor2025 = this.getTotalForYear(2025);
         var totalFor2026 = this.getTotalForYear(2026);
         var totalFor2027 = this.getTotalForYear(2027);
         var totalFor2028 = this.getTotalForYear(2028);
         var totalFor2029 = this.getTotalForYear(2029);
     
         // Lógica para cada tabla según la tabla seleccionada (tableId)
         if (tableId === "tablaConsuExter") {
             // Obtener la tabla "tablaConsuExter"
             var oTable = this.byId("tablaConsuExter");
     
             if (!oTable) {
                 console.error("La tabla 'tablaConsuExter' no fue encontrada.");
                 return;
             }
     
             // Obtener los índices de las filas editadas
             this._editedRows[tableId].forEach(function (rowIndex) {
                 var oItem = oTable.getItems()[rowIndex];
                 if (oItem) {
                     var aCells = oItem.getCells(); // Obtener las celdas de la fila
     
                     if (aCells && aCells.length >= 6) {
                         // Aquí puedes actualizar las celdas de acuerdo a la tabla seleccionada
                         aCells[4].setText(totalFor2024.toFixed(2) + "€"); // Actualiza PMJ o el valor que necesites
                         aCells[5].setText(totalFor2025.toFixed(2) + "€"); // Actualiza para 2025
                     }
                 }
             });
     
         } else if (tableId === "table_dimicFecha") {
             // Obtener la tabla "table_dimicFecha"
             var oTable = this.byId("table_dimicFecha");
     
             if (!oTable) {
                 console.error("La tabla 'table_dimicFecha' no fue encontrada.");
                 return;
             }
     
             // Obtener los índices de las filas editadas
             this._editedRows[tableId].forEach(function (rowIndex) {
                 var oItem = oTable.getItems()[rowIndex];
                 if (oItem) {
                     var aCells = oItem.getCells(); // Obtener las celdas de la fila
     
                     if (aCells && aCells.length >= 11) {
                         // Actualizar las celdas con los valores específicos de las fechas
                         aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                         aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                         aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                         aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                         aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                         aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029
                     }
                 }
             });
     
         } else {
             console.error("Tabla no reconocida: " + tableId);
         }
     
         // Limpiar las filas editadas para que no se actualicen más de una vez
         this._editedRows[tableId].clear();
     },
 
 
         getTotalForYear: function (year) {
         if (this._yearlySums && this._yearlySums[year] !== undefined) {
 
 
           console.log("Totales por año ----> "+ this._yearlySums[year]);
 
             return this._yearlySums[year];
 
         } else {
             console.warn(`No se encontró datos para el año ${year}`);
             return 0; // Devuelve 0 si no hay datos para el año
         }
     },*/



      /*   updateTotalField: function (tableId, rowIndex) {
           // Obtener el total acumulado para cada año
           var totalFor2024 = this.getTotalForYear(2024);
           var totalFor2025 = this.getTotalForYear(2025);
           var totalFor2026 = this.getTotalForYear(2026);
           var totalFor2027 = this.getTotalForYear(2027);
           var totalFor2028 = this.getTotalForYear(2028);
           var totalFor2029 = this.getTotalForYear(2029);
       
           // Lógica para cada tabla según la tabla seleccionada (tableId)
           if (tableId === "tablaConsuExter") {
               // Obtener la tabla "tablaConsuExter"
               var oTable = this.byId("tablaConsuExter");
       
               if (!oTable) {
                   console.error("La tabla 'tablaConsuExter' no fue encontrada.");
                   return;
               }
       
               // Obtener los índices de las filas editadas
               this._editedRows[tableId].forEach(function (rowIndex) {
                   var oItem = oTable.getItems()[rowIndex];
                   if (oItem) {
                       var aCells = oItem.getCells(); // Obtener las celdas de la fila
       
                       if (aCells && aCells.length >= 6) {
                           // Aquí puedes actualizar las celdas de acuerdo a la tabla seleccionada
                           aCells[4].setText(totalFor2024.toFixed(2) + "€"); // Actualiza PMJ o el valor que necesites
                           aCells[5].setText(totalFor2025.toFixed(2) + "€"); // Actualiza para 2025
                       }
                   }
               });
       
           } else if (tableId === "table_dimicFecha") {
               // Obtener la tabla "table_dimicFecha"
               var oTable = this.byId("table_dimicFecha");
       
               if (!oTable) {
                   console.error("La tabla 'table_dimicFecha' no fue encontrada.");
                   return;
               }
       
               // Obtener los índices de las filas editadas
               this._editedRows[tableId].forEach(function (rowIndex) {
                   var oItem = oTable.getItems()[rowIndex];
                   if (oItem) {
                       var aCells = oItem.getCells(); // Obtener las celdas de la fila
       
                       if (aCells && aCells.length >= 11) {
                           // Actualizar las celdas con los valores específicos de las fechas
                           aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                           aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                           aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                           aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                           aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                           aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029
                       }
                   }
               });
       
           } else {
               console.error("Tabla no reconocida: " + tableId);
           }
       
           // Limpiar las filas editadas para que no se actualicen más de una vez
           this._editedRows[tableId].clear();
       },
           getTotalForYear: function (year) {
           if (this._yearlySums && this._yearlySums[year] !== undefined) {
               return this._yearlySums[year];
           } else {
               console.warn(`No se encontró datos para el año ${year}`);
               return 0; // Devuelve 0 si no hay datos para el año
           }
       },*/

      /* updateTotalField: function () {
         // Obtener el total acumulado para 2024 y 2025
         var totalFor2024 = this.getTotalForYear(2024);
         var totalFor2025 = this.getTotalForYear(2025);
         var totalFor2026 = this.getTotalForYear(2026);
         var totalFor2027 = this.getTotalForYear(2027);
         var totalFor2028 = this.getTotalForYear(2028);
         var totalFor2029 = this.getTotalForYear(2029);
 
 
         // Actualizar el control de texto para 2024
         var totalTextField2024 = this.getView().byId("text26");
         if (totalTextField2024) {
             totalTextField2024.setText(`${totalFor2024.toFixed(2)}`);
         }
 
         // Actualizar el control de texto para 2025
         var totalTextField2025 = this.getView().byId("idtest5");
         if (totalTextField2025) {
             totalTextField2025.setText(`${totalFor2025.toFixed(2)}`);
         }
 
 
         var totalTextField2026 = this.getView().byId("txt2026r");
         if (totalTextField2026) {
             totalTextField2026.setText(`${totalFor2026.toFixed(2)}`);
         }
 
         
         var totalTextField2027 = this.getView().byId("migt5");
         if (totalTextField2027) {
           totalTextField2027.setText(`${totalFor2027.toFixed(2)}`);
         }
 
 
         var totalTextField2028 = this.getView().byId("text30");
         if (totalTextField2028) {
           totalTextField2028.setText(`${totalFor2028.toFixed(2)}`);
         }
 
         var totalTextField2029 = this.getView().byId("text31");
         if (totalTextField2029) {
           totalTextField2029.setText(`${totalFor2029.toFixed(2)}`);
         }
 
 
     },*/




      // Función para hacer lo que quieras con el valor ingresado
      setNewValueToField: function (oEvent, newValue, tableId) {


        // 1. **Asignar el valor a un campo específico de la vista según la tabla:**
        if (tableId === "tablaConsuExter") {
          var oTextField = this.getView().byId("campoTextoConsuExter"); // Reemplaza con el ID del campo específico
          if (oTextField) {
            oTextField.setValue(newValue); // Asignar el valor al campo
          }
        } else if (tableId === "table_dimicFecha") {
          var oTextField = this.getView().byId("campoTextoDimicFecha"); // Reemplaza con el ID del campo específico
          if (oTextField) {
            oTextField.setValue(newValue); // Asignar el valor al campo
          }
        }

        // 3. **Usar el valor en un cálculo o lógica adicional según la tabla:**

        var sPMJ = this.byId("pmj2").getText();

        if (tableId === "tablaConsuExter") {
          //    var resultado = newValue * sPMJ; // Ejemplo de cálculo


          console.log("Resultado del cálculo para tablaConsuExter: ", resultado);
        } else if (tableId === "table_dimicFecha") {





          var resultado = newValue * sPMJ; // Otro ejemplo de cálculo
          var total1prime = this.byId("text33").setText(resultado + "€");
          console.log("Resultado del cálculo para table_dimicFecha: ", resultado);
        }


      },


      findTotalColumnIndex: function (oTable) {
        var columns = oTable.getColumns();
        var lastColumnIndex = columns.length - 1;

        for (var i = 0; i < columns.length; i++) {
          var headerLabel = columns[i].getHeader();
          if (headerLabel && (headerLabel.getText() === "Total1" || headerLabel.getText() === "")) {
            return i;
          }
        }

        console.warn("Advertencia: No se encontró la columna 'Total1'. Se usará la última columna.");
        return lastColumnIndex + 1;
      },

      getMonthsDifference: function (startDate, endDate) {
        var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        diffMonths -= startDate.getMonth();
        diffMonths += endDate.getMonth();
        return diffMonths < 0 ? 0 : diffMonths;
      },



      /*  fechasDinamicas: function (oEvent) {
  
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
  
  
  
          var flexBoxIds = [
            "box0_1714747137718",
            "box0_1727879568594",
            "box0_1727879817594",
            "box0_1721815443829",
            "box0_1727948724833",
            "box0_1727950351451",
            "box0_17218154429",
            "box0_1727953252765",
            "box1_1727953468615",
            "box0_17254429",
            "box0_1727955568380"
            // Añadir más IDs de FlexBox según sea necesario
          ];
  
  
  
  
          flexBoxIds.forEach((flexBoxId) => {
            var flexBox = this.getView().byId(flexBoxId);
            if (flexBox) {
              flexBox.setWidth(diffMonths > 3 ? "3000px" : "100%");
            }
          });
  
  
          // Definir las IDs de las tablas
          var tableIds = [
            "tablaConsuExter",
            "table_dimicFecha",
            "tablaRecExterno",
            "idOtroserConsu",
            "idGastoViajeConsu",
            "idServiExterno",
            "idGastoRecuExter",
            "table0_1724413700665",
            "table0_1727955577124",
            "table0_1727879576857",
            "table0_1727879940116"
          ];
  
          // Iterar sobre cada tabla
          tableIds.forEach((tableId) => { // Usar función de flecha para el contexto
            var oTable = this.getView().byId(tableId);
            if (!oTable) {
              console.error("Error: No se pudo obtener la tabla con ID " + tableId);
              return;
            }
  
            var totalColumnIndex = this.findTotalColumnIndex(oTable);
            var existingColumns = oTable.getColumns().map(col => col.getHeader().getText());
  
            // Eliminar las columnas dinámicas existentes después de la columna encontrada
            var columnCount = oTable.getColumns().length;
            for (var j = columnCount - 1; j > totalColumnIndex; j--) {
              oTable.removeColumn(j);
            }
  
            // Agregar nuevas columnas
            for (var i = 0; i <= diffMonths; i++) {
              var columnDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
              var year = columnDate.getFullYear();
              var month = columnDate.toLocaleString("default", { month: "long" });
              var columnHeaderText = year + "-" + month;
  
              // Crear la columna
  
              var oColumn = new sap.m.Column({
                header: new sap.m.Label({ text: columnHeaderText }),
                width: "100px"
              });
  
          
  
              // Agregar la columna a la tabla
              oTable.insertColumn(oColumn, totalColumnIndex + 1 + i);
  
              // Crear un input para cada celda de la nueva columna
              for (var rowIndex = 0; rowIndex < oTable.getItems().length; rowIndex++) {
                var oRow = oTable.getItems()[rowIndex];
                var oCell = oRow.getCells()[totalColumnIndex + 1 + i]; // Obtiene la celda correspondiente
  
                // Si la celda es null, creamos un nuevo Input
                if (!oCell) {
                  var oInput = new sap.m.Input({
                    placeholder: "0.00"
                  });
  
                  oRow.addCell(oInput); // Agregar el Input a la fila
                }
              }
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
          });
        },
  
        // Método para encontrar el índice de la columna 'Total1'
        findTotalColumnIndex: function (oTable) {
          var columns = oTable.getColumns();
          var lastColumnIndex = columns.length - 1; // Índice de la última columna
  
          // Buscar la columna 'Total1'
          for (var i = 0; i < columns.length; i++) {
            var headerLabel = columns[i].getHeader();
            if (headerLabel && headerLabel.getText() === "Total1" || headerLabel && headerLabel.getText() === "") { //NUEVO
              return i; // Devuelve el índice de la columna 'Total1'
            }
          }
  
          // Si no encuentra 'Total1', devolver el índice de la última columna
          console.warn("Advertencia: No se encontró la columna 'Total1'. Se usará la última columna.");
          return lastColumnIndex + 1; // Devuelve el índice justo después de la última columna
        },
  
        // Método para calcular la diferencia en meses entre dos fechas
        getMonthsDifference: function (startDate, endDate) {
          var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
          diffMonths -= startDate.getMonth();
          diffMonths += endDate.getMonth();
          return diffMonths < 0 ? 0 : diffMonths; // Devuelve 0 si es negativo
        },*/


      // Método para manejar las dinámicas de fechas
      /*     fechasDinamicas: function (oEvent) {
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
             var tableIds = ["tablaConsuExter", "table_dimicFecha", "tablaRecExterno", "idOtroserConsu" , "idGastoViajeConsu" , "idServiExterno" , "idGastoRecuExter" , "table0_1724413700665" , "table0_1727955577124"];
   
             // Iterar sobre cada tabla
             tableIds.forEach(function (tableId) {
                 var oTable = this.getView().byId(tableId);
                 if (!oTable) {
                     console.error("Error: No se pudo obtener la tabla con ID " + tableId);
                     return;
                 }
   
                 var totalColumnIndex = this.findTotalColumnIndex(oTable);
   
                 // Eliminar las columnas dinámicas existentes después de la columna encontrada
                 var columnCount = oTable.getColumns().length;
                 for (var j = columnCount - 1; j > totalColumnIndex; j--) {
                     oTable.removeColumn(j);
                 }
   
                 // Agregar nuevas columnas
                 for (var i = 0; i <= diffMonths; i++) {
                     var columnDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
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
   
         // Método para encontrar el índice de la columna 'Total1'
         findTotalColumnIndex: function (oTable) {
             var columns = oTable.getColumns();
             var lastColumnIndex = columns.length - 1;  // Índice de la última columna
   
             // Buscar la columna 'Total1'
             for (var i = 0; i < columns.length; i++) {
                 var headerLabel = columns[i].getHeader();
                 if (headerLabel && headerLabel.getText() === "Total1") {
                     return i;  // Devuelve el índice de la columna 'Total1'
                 }
             }
   
             // Si no encuentra 'Total1', devolver el índice de la última columna
             console.warn("Advertencia: No se encontró la columna 'Total1'. Se usará la última columna.");
             return lastColumnIndex + 1; // Devuelve el índice justo después de la última columna
         },
   
         // Método para calcular la diferencia en meses entre dos fechas
         getMonthsDifference: function (startDate, endDate) {
             var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
             diffMonths -= startDate.getMonth();
             diffMonths += endDate.getMonth();
             return diffMonths;
         },*/



      /*  fechasDinamicas: function (oEvent) {
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
          var tableIds = ["tablaConsuExter", "table_dimicFecha", "tablaRecExterno"];
  
          // Iterar sobre cada tabla
          tableIds.forEach(function (tableId) {
            var oTable = this.getView().byId(tableId);
            if (!oTable) {
              console.error("Error: No se pudo obtener la tabla con ID " + tableId);
              return;
            }
  
            var totalColumnIndex = this.findTotalColumnIndex(oTable);
  
            // Eliminar las columnas dinámicas existentes después de la columna encontrada
            var columnCount = oTable.getColumns().length;
            for (var j = columnCount - 1; j > totalColumnIndex; j--) {
              oTable.removeColumn(j);
            }
  
            // Agregar nuevas columnas
            for (var i = 0; i <= diffMonths; i++) {
              var columnDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
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
          var lastColumnIndex = columns.length - 1;  // Índice de la última columna
  
          // Buscar la columna 'Total1'
          for (var i = 0; i < columns.length; i++) {
            var headerLabel = columns[i].getHeader();
            if (headerLabel && headerLabel.getText() === "Total1" ) {
              return i;  // Devuelve el índice de la columna 'Total1'
            }
          }
  
          // Si no encuentra 'Total1', devuelve el índice de la última columna
          console.warn("Advertencia: No se encontró la columna 'Total1'. Se usará la última columna.");
          return lastColumnIndex;
        },
  
        getMonthsDifference: function (startDate, endDate) {
          var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
          diffMonths -= startDate.getMonth();
          diffMonths += endDate.getMonth();
          return diffMonths;
        },
  */
      //------------------------------------------------------------------------



      //-----------------Metodo navegacion pagina APP---------
      onNavToView1: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
        console.log("Navigating to View1");

        oRouter.navTo("appNoparame");
      },
      //-----------------------------------------------------




      //--------------Visible table Facturacion------------
      onSelectOpx: function (oEvent) {
        var selectedItem = this.byId("slct_inic").getSelectedItem();
        var selectedText = selectedItem.getText();
        console.log(selectedItem);
        var oTable = this.getView().byId("table0");

        if (selectedText === "Opex Servicios") {
          oTable.setVisible(true);
        } else {
          oTable.setVisible(false);
        }
      },
      //------------------------------------------------------






      //Visible Table Muli
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



      //------------Gets de input informacion -------------
      onInputChange: function () {
        var oView = this.getView();

        // Capturar valores de los inputs y selects
        var sCodeValue = this.byId("input0").getValue();
        var sNombrePro = this.byId("input1").getValue();
        var sClienteFact = this.byId("id_Cfactur").getValue();
        var sClienteFuncio = this.byId("int_clienteFun").getValue();

        var oSelect2 = this.byId("slct_area");
        var sSelectValue2 = "";
        var sKey2 = "";

        if (oSelect2 && oSelect2.getSelectedItem()) {
          sSelectValue2 = oSelect2.getSelectedItem().getText();
          sKey2 = oSelect2.getSelectedItem().getKey();
        }

        var oSelect1 = this.byId("slct_Jefe");
        var sSelectValue1 = "";

        if (oSelect1 && oSelect1.getSelectedItem()) {
          sSelectValue1 = oSelect1.getSelectedItem().getText();
        }

        var oSelect3 = this.byId("slct_client");
        var sSelectValue3 = "";

        if (oSelect3 && oSelect3.getSelectedItem()) {
          sSelectValue3 = oSelect3.getSelectedItem().getText();
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
        }


        var oselectPerf5 = this.byId("idNatu");
        var sSelectValue5 = "";

        if (oselectPerf5 && oselectPerf5.getSelectedItem()) {
          sSelectValue5 = oselectPerf5.getSelectedItem().getText();
        }

        var oDatePicker = this.byId("date_fin");
        var sDateValue = oDatePicker ? oDatePicker.getDateValue() : null;
        var sFormattedDate = "";

        if (sDateValue) {
          sFormattedDate = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern: "yyyy-MM-dd"
          }).format(sDateValue);
        }


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


      //------- Metodo select proveedor / condi ------------
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
      //-----------------------------------------




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


      /*   _onObjectMatched: async function (oEvent) {
       
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
         },*/



      //---------------Grafico fechasvizframe para Fases  --------------------------------


      /*   updateVizFrame1: function () {
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
   
   
   
         },*/
      //------------------------------------------------- 









    });
  });
