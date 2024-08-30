
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/format/DateFormat",
  "sap/viz/ui5/controls/VizFrame",
  "sap/ui/model/odata/v4/ODataModel",
  "sap/m/MessageToast",
  "sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
  "sap/ui/model/json/JSONModel"

],
  function (Controller, VizFrame, MessageToast,ODataModel , Sorter, Filter, FilterOperator , JSONModel, FilterType,) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
      onInit: function () {
    /*    var oModel = new sap.ui.model.odata.v4.ODataModel({
          serviceUrl: "/odata/v4/datos-cdo/",
          synchronizationMode: "None", // O "Queued" dependiendo de tus necesidades
          autoExpandSelect: true,       // Expande automáticamente los campos seleccionados (opcional)
          operationMode: "Server",      // Define cómo se manejan las operaciones (opcional)
          groupId: "$auto",             // Define el grupo de envío (opcional)
          updateGroupId: "$auto"        // Grupo de actualización (opcional)
      });
      
      console.log("Modelo OData en onInit:", oModel);
      
*/
var sServiceUrl = "/odata/v4/datos-cdo/";
//var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);


      },

      onSave: async function () {
        const scodigoProyect = this.byId("input0").getValue();
        const snameProyect = this.byId("input1").getValue();
      
        // Prepara el payload
        const payload = {
          codigoProyect: scodigoProyect,
          nameProyect: snameProyect
        };
      
        try {
          // Obtén el token de autenticación (asegúrate de que el usuario esté autenticado)
          const token = await this._getAuthToken();
      
          // Realiza la llamada POST al servicio CAP
          const response = await fetch("odata/v4/datos-cdo/DatosProyect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` // Añade el token de autenticación
            },
            body: JSON.stringify(payload)
          });
      
          if (response.ok) {
            console.log("Producto guardado con éxito.");
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar el producto:", errorMessage);
          }
        } catch (error) {
          console.error("Error en la llamada al servicio:", error);
          console.error("Error al guardar el producto.");
        }
      },
            _getAuthToken: async function () {
        // Implementa la lógica para obtener el token, ya sea desde XSUAA o SAP UI5
        // Por ejemplo, puede ser desde `sap-ushell` en SAP Fiori Launchpad
        // Aquí un ejemplo simplificado, revisa cómo está configurada tu aplicación:
        const token = "TOKEN_DE_EJEMPLO"; // Aquí obtendrás el token real en tu aplicación
        return token;
      },
      
      



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

      onselectFun: function (oEvent) {
        var oSelect = this.byId("slct_client");
        var oSelectedItem = oSelect.getSelectedItem();

        if (oSelectedItem) {
          var sSelectedKey = oSelectedItem.getKey();
          var sSelectedText = oSelectedItem.getText();

          console.log("Selected Key:", sSelectedKey);
          console.log("Selected Text:", sSelectedText);

          // Aquí puedes realizar cualquier otra operación que necesites con sSelectedKey o sSelectedText
        } else {
          console.log("No item selected");
        }
      },




      onSelectIniMethod: function (oEvent) {
        this.onInputChange(oEvent);
        this.onSelectOpx(oEvent);
      },





      onselectmethodsetinfo: function (oEvent) {
        this.onInputChange(oEvent);
        this.fechasDinamicas(oEvent);
      },


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


      //---------------Grafico fechasvizframe --------------------------------

      updateVizFrame: function () {
        var oData = this.oModel.getData();
        console.log(oData);
        var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
          pattern: "yyyy-MM-dd",
        });
        var aChartData = oData.milestones.map(function (milestone) {
          var startDate = oDateFormat.parse(milestone.fechaInicio);
          var endDate = oDateFormat.parse(milestone.fechaFin);
          var duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // Convert to days
          return {
            hito: milestone.hito,
            fechaInicio: oDateFormat.format(startDate),
            duracion: duration,
          };
        });

        this.oModel.setProperty("/chartData", aChartData);
        console.log("aChartData");
      },
      //------------------------------------------------- 


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
        var oTable = this.byId("table2");
        var aColumns = oTable.getColumns();
        var aItems = oTable.getItems();
        var bSelected = oEvent.getSource().getSelected();
        var iSelectedColumnIndex = oEvent
          .getSource()
          .getParent()
          .getParent()
          .indexOfColumn(oEvent.getSource().getParent());

        // IDs of the checkboxes
        var sOtherCheckboxId =
          iSelectedColumnIndex === 0 ? "box_prove" : "box_condi";
        var oOtherCheckbox = this.byId(sOtherCheckboxId);

        // Disable the other checkbox if this one is selected, enable if deselected
        oOtherCheckbox.setEnabled(!bSelected);

        // Loop through each column and set the editable state of inputs in that column
        aColumns.forEach(function (oColumn, iColumnIndex) {
          aItems.forEach(function (oItem) {
            var oInput = oItem.getCells()[iColumnIndex];
            // Set editable state to true only for the selected column
            oInput.setEditable(
              iColumnIndex === iSelectedColumnIndex ? bSelected : !bSelected
            );
          });
        });
      },
      //--------------------------------------------------------------------------------




    });
  });
