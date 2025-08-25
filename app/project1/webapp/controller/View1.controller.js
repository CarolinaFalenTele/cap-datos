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
  "sap/m/MessageBox"

],

  function (Controller, DateFormat, VizFrame, ODataModel, MessageToast, Sorter, Filter, FilterOperator, FilterType, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
      recursoID: null,

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

        var scales = [{
          'feed': 'color',
          'palette': ["#f7f7ff", "#0066ff", "#c5f8f9", "#75c0c7", "#f3e996", "#d6786b", "#e1c3f4"]
        }];
        var vizScalesOption = { replace: true };
        oVizframe1.setVizScales(scales, vizScalesOption)

        this._tableValues = {
          "tablaConsuExter": {},
          "table_dimicFecha": {},
          "tablaRecExterno": {},
          "idOtroserConsu": {},
          "idGastoViajeConsu": {},
          "idServiExterno": {},
          "idGastoRecuExter": {},
          "tablaInfrestuctura": {},
          "tablaLicencia": {},
          "tableServicioInterno": {},
          "tablGastoViajeInterno": {},
        };

        this._editedRows = this._editedRows || {};

        this._rowYearlySums = this._rowYearlySums || {}; // Asegúrate de que esté inicializado

        this.currentRow = 0; // Fila actualmente seleccionada

        this.currentTable = 0; // Para la tabla actual (esto es lo que faltaba definir)


        var oFechasModel = new sap.ui.model.json.JSONModel({
          fechas: [
            {
              fase: "Plan",
              fechaInicioConstruccion: "2024-09-01",
              fechaFinPruebasTQ: "2024-09-30"
            }
            // Agrega más datos según sea necesario
          ]
        });


        this.getView().setModel(oFechasModel, "fechasModel");
        

       var oVizframe2 = this.byId("idVizFrame2");
        oVizframe2.setVizProperties({ "title": { "text": "Plan de Servicio" } })

        // Inicializar el gráfico con los datos actuales
        this.updateVizFrame1();
        this.updateVizFrame3();


        this.updateVizFrame2();

        this._yearlySums = {
          2024: 0,
          2025: 0,
          2026: 0,
          2027: 0,
          2028: 0,
          2029: 0,
        };

        this.token();
        this.getUserInfo();

        this.onColumnTotales();

        /*  var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
  
          oRouter.getRoute("viewWithMode").attachPatternMatched(this._onObjectMatched, this);*/

        //   this._anioActual = new Date().getFullYear();



        this._mode = ""; // fallback local

        const oViewModel = new sap.ui.model.json.JSONModel({ mode: "" });
        this.getView().setModel(oViewModel, "viewModel");

        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Conecta TODAS las rutas que pueden traer mode
        ["viewWithMode", "viewNoParam", "view", "viewWithAprobacion"].forEach(function (routeName) {
          oRouter.getRoute(routeName).attachPatternMatched(this._onObjectMatched, this);
        }, this);



        this.enviarID();



        this.byId("coste6552").setVisible(false);


        this._handleInputChangeCounter = 0;



        this.filtertables();

      },





      //Actualizar las tablas con años  
      actualizarHeadersAnios: function () {
        // IDs de las tablas a actualizar
        const idsTablas = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
          "tablaInfrestuctura"
        ];

        const anioHoy = new Date().getFullYear();

        // Si no cambio el año, no hacemos nada
        if (anioHoy === this._anioActual) {
          console.log("Año sin cambios, no actualizo headers.");
          return;
        }

        // Actualizamos la variable del año guardado
        this._anioActual = anioHoy;

        idsTablas.forEach(tablaId => {
          const oTabla = this.byId(tablaId);
          if (!oTabla) {
            console.warn(`No se encontró tabla con id: ${tablaId}`);
            return;
          }

          const aColumnas = oTabla.getColumns();
          let offset = 0;

          aColumnas.forEach(col => {
            const headerControl = col.getHeader();
            if (headerControl && headerControl.isA("sap.m.Label")) {
              const textoOriginal = headerControl.getText();
              const texto = textoOriginal.trim();

              // Solo si el texto es un año válido (4 dígitos)
              if (/^\d{4}$/.test(texto)) {
                const anioOriginal = parseInt(texto, 10);
                const nuevoAnio = anioHoy + offset;

                headerControl.setText(nuevoAnio.toString());

                console.log(`Tabla: ${tablaId} - Header "${textoOriginal}" actualizado a "${nuevoAnio}"`);
                offset++;
              }
            }
          });
        });

        //  MessageToast.show("Headers con años actualizados al año " + anioHoy);
      },





      //   -------- FILTROS INACTIVOS O ACTIVOS ----------      
      filterAreaFalse: async function (ID) {
        var oSelect = this.byId("slct_area");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Area",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreArea}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Area('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreArea + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el área:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },


      filterJefe: async function (ID) {
        var oSelect = this.byId("slct_Jefe");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Jefeproyect",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{name}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Jefeproyect('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.name + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el JefeProyecto:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },



      filterVertical: async function (ID) {
        var oSelect = this.byId("slct_verti");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Vertical",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreVertical}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Vertical('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreVertical + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el Vertical:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },





      filterClienteNuevo: async function (ID) {
        var oSelect = this.byId("slct_client");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/ClienteNuevo",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreClienteNuevo}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/ClienteNuevo('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreClienteNuevo + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el ClienteNuevo:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },

      filterTipoIniciativa: async function (ID) {
        var oSelect = this.byId("slct_inic");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/TipoIniciativa",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreIniciativa}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/TipoIniciativa('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreIniciativa + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el TipoIniciativa:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },



      filterNaturaleza: async function (ID) {
        var oSelect = this.byId("idNatu");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Naturaleza",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreNaturaleza}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Naturaleza('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreNaturaleza + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el Naturaleza:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },


      filterSeguimiento: async function (ID) {
        var oSelect = this.byId("selc_Segui");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Seguimiento",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreSeguimiento}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Seguimiento('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreSeguimiento + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el Seguimiento:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },



      filterEjecucionVia: async function (ID) {
        var oSelect = this.byId("selc_ejcu");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/EjecucionVia",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreEjecuVia}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/EjecucionVia('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreEjecuVia + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el EjecucionVia:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },



      filterAMreceptor: async function (ID) {
        var oSelect = this.byId("selct_Amrecp");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/AMreceptor",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreAMreceptor}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/AMreceptor('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreAMreceptor + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el AMreceptor:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },





      filtertables: async function () {
        const aTableIds = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
          "idOtroserConsu",
          "idGastoViajeConsu",
          "idServiExterno",
          "idGastoRecuExter",
          "tablaInfrestuctura",
          "tablaLicencia",
          "tableServicioInterno",
          "tablGastoViajeInterno"
        ];

        for (let sTableId of aTableIds) {
          await this.filterSelectsFromTable(sTableId);

        }
      },



      filterSelectsFromTable: async function (sTableId) {
        //console.log("tablas recbidas " + sTableId);   
        var oTable = this.byId(sTableId);
        var aItems = oTable.getItems();

        for (let i = 0; i < aItems.length; i++) {
          let oRow = aItems[i];
          let oSelect = oRow.getCells()[0]; // Cambia [1] si el Select está en otra columna

          if (!oSelect) continue;

          //console.log("LOS oselect"   +  oSelect );


          let sSelectedKey = oSelect.getSelectedKey(); // o desde el bindingContext si lo prefieres

          //console.log("LOS IDS DEL SELECT"   +  sSelectedKey );
          await this.filterVerticaltablasDinamicas(sSelectedKey, oSelect);

          //   await   this.filterTipoServicioDinamicas( oSelect );

        }
      },


      filterVerticaltablasDinamicas: async function (ID, oSelect) {
        // var oSelect = this.byId("selct_Amrecp");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/Vertical",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreVertical}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/Vertical('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreVertical + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el Vertical:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },




      filterTipoServicioDinamicas: async function (ID, oSelect) {
        // var oSelect = this.byId("selct_Amrecp");
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/TipoServicio",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombreTipoServ}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/TipoServicio('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreTipoServ + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el TipoServicio:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },

      filterPerfilServiDinamicas: async function (ID, oSelect) {
        var oModel = this.getOwnerComponent().getModel();

        // 1. BindItems solo con áreas activas
        oSelect.bindItems({
          path: "/PerfilServicio",
          filters: [
            new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
          ],
          template: new sap.ui.core.Item({
            key: "{ID}",
            text: "{NombrePerfil}"
          })
        });

        // Esperar que termine el binding para poder agregar ítems
        await new Promise((resolve) => {
          var oBinding = oSelect.getBinding("items");
          if (!oBinding) {
            resolve();
            return;
          }
          oBinding.attachEventOnce("dataReceived", function () {
            resolve();
          });
        });

        // 2. Si hay ID recibido, comprobar si está inactivo y agregar manualmente
        if (ID) {
          var sUrl = oModel.sServiceUrl + "/PerfilServicio('" + ID + "')";
          try {
            var response = await fetch(sUrl);
            if (!response.ok) {
              throw new Error("No se pudo obtener el registro");
            }
            var data = await response.json();

            if (data && data.Activo === false) {
              // Crear ítem para área inactiva (deshabilitado y con texto marcado)
              var oInactiveItem = new sap.ui.core.Item({
                key: data.ID,
                text: data.NombreTipoServ + " (inactiva)",
                enabled: false
              });

              // Agregar el item manualmente
              oSelect.addItem(oInactiveItem);

              // Seleccionar la clave
              oSelect.setSelectedKey(data.ID);
            } else {
              // Si está activo, seleccionar el ID normalmente
              oSelect.setSelectedKey(ID);
            }
          } catch (error) {
            console.error("Error al obtener el PerfilServicio:", error);
            oSelect.setSelectedKey(ID);
          }
        }
      },


      /* filterAreaFalse: async function (ID) {
         console.log("datos traidos " + ID);
     
         var oModel = this.getOwnerComponent().getModel();
   
   
         var sServiceUrl = oModel.sServiceUrl; // por ejemplo: "/odata/v4/datos-cdo/"
         var sUrl = sServiceUrl + "/odata/v4/datos-cdo/Area(" + "'" + ID + "'" + ")";
     
         fetch("/odata/v4/datos-cdo/Area('123e4567-e89b-12d3-a456-426614174002')")
             .then(response => {
                 if (!response.ok) {
                     throw new Error("No se pudo obtener el registro");
                 }
   
                 console.log("lo que trae " + JSON.stringify(response));
                 return response.json();
             })
             .then(data => {
                 if (data && data.Activo === false) {
   
                       console.log("DATOS" + JSON.stringify(data));
                       console.log("Seteando área inactiva: ", ID);
   
                     // Establece el ID como seleccionado aunque no esté en el dropdown
                     oSelect.setSelectedKey(ID);
                     console.log("oSelect:", oSelect);
   
                 }
             })
             .catch(error => {
                 console.error("Error al obtener el área:", error);
             });
   
   
   
         var oSelect = this.byId("slct_area");
     
         // 1. Hacemos el bindItems como siempre (solo los activos)
         oSelect.bindItems({
             path: "/Area",
             filters: [
                 new sap.ui.model.Filter("Activo", sap.ui.model.FilterOperator.EQ, true)
             ],
             template: new sap.ui.core.Item({
                 key: "{ID}",
                 text: "{NombreArea}"
             })
         });
     
       
     },*/



      refreshODataModel: function () {
        const oModel = this.getOwnerComponent().getModel(); // Modelo por defecto ("mainService")

        if (oModel && typeof oModel.refresh === "function") {
          oModel.refresh(); // Esto recarga los datos desde el backend si están en uso
          //   console.log("Modelo OData V4 refrescado desde el servidor.");
        }

        const oView = this.getView();
        if (oView.getElementBinding()) {
          oView.getElementBinding().refresh(true); // Refresca el binding de la vista (por si tiene contexto)
          // console.log("Binding de la vista refrescado.");
        }
      },





      onInfoPress: function (oEvent) {
        // Cargar el popover si no está aún
        if (!this._oPopover) {
          this._oPopover = this.byId("infoPopover");
        }
        this._oPopover.openBy(oEvent.getSource());
      },



      onInfoPressRecursos: function (oEvent) {
        // Cargar el popover si no está aún
        if (!this._oPopover) {
          this._oPopover = this.byId("infoPopoverRecursos");
        }
        this._oPopover.openBy(oEvent.getSource());
      },

      onInfoGeneralPress: function (oEvent) {
        if (!this._oPopoverGeneral) {
          this._oPopoverGeneral = this.byId("infoPopoverGeneral");
        }
        this._oPopoverGeneral.openBy(oEvent.getSource());
      },

      onTipoCambioLive: function (oEvent) {
        var oInput = oEvent.getSource();
        var sValue = oInput.getValue().trim();

        // Permitir que el usuario borre el campo sin forzar nada aún
        if (sValue === "") {
          return;
        }

        // Solo intentar formatear si es un número válido
        var fValue = parseFloat(sValue);
        if (!isNaN(fValue)) {
          // Actualizar el campo con el valor formateado a 4 decimales
          oInput.setValue(fValue.toFixed(4));
        }
      },



      highlightControls: function () {
        //    console.log("Se cambiaron las pestañas debido a campos vacíos.");

        const controlsToHighlight = [
          this.byId("input0"),
          this.byId("input1"),
          this.byId("idDescripcion"),
          this.byId("int_clienteFun"),
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
          this.byId("date_fin")
        ];

        // Aplicar el highlight con un pequeño delay para que el renderizado pueda ocurrir
        setTimeout(() => {
          controlsToHighlight.forEach(control => {
            if (control && control.setValueState) {
              control.setValueState("Information");
            }
          });

          // Luego de 2 segundos, revertir el highlight
          setTimeout(() => {
            controlsToHighlight.forEach(control => {
              if (control && control.setValueState) {
                control.setValueState("None");
              }
            });

            // Aquí podrías llamar a la función que muestra el diálogo si quieres que espere el highlight
            // this.showSuccessDialog(); 

          }, 2000);
        }, 50); // 50 ms suele ser suficiente para que la UI se refresque
      },


      getUserInfo: async function () {
        fetch('/odata/v4/datos-cdo/getUserInfo')
          .then(response => {
            if (!response.ok) {
              throw new Error("No se pudo obtener la información del usuario.");
            }
            return response.json();
          })
          .then(data => {
            //  console.log("Respuesta completa:", data); // Para debug
            const userInfo = data.value;
            const token = data.token || (userInfo && userInfo.token);

            if (userInfo) {
              const oEmailAttr = this.byId("dddtg");
              oEmailAttr?.setText(userInfo.email);
              oEmailAttr?.setTooltip(userInfo.email);
              this.byId("23d3")?.setText(userInfo.fullName);


              this._user = userInfo.email;

              const rolesObject = userInfo.roles || {};
              const roleKeys = Object.keys(rolesObject);

              console.log("Roles del usuario  View:", roleKeys);
              //  Guardar los roles y si puede aprobar
              this._userRoles = roleKeys; // <-- Aquí guardas los roles completos
              const rolesParaMostrarTab = ["Control", "Direccion", "BasisTQFac", "PMO"];
              this._userPuedeAprobar = rolesParaMostrarTab.some(role => roleKeys.includes(role)); // <-- Aquí la bandera



              this.getUsuario();
              if (token) {
                this._startSessionWatcher(token);
                //    console.log("Token recibido y watcher iniciado.");
              } else {
                console.warn("Token no recibido en la respuesta.");
              }

            } else {
              console.error("No se encontró la información del usuario.");
            }
          })
          .catch(error => {
            console.error("Error obteniendo datos del usuario:", error);
          });
      },





      _startSessionWatcher: function (token) {
        const decoded = this._parseJwt(token);
        const expiresAt = decoded.exp * 1000; // Expiración en milisegundos
        const now = Date.now();
        const timeUntilWarning = expiresAt - now - (1 * 60 * 1000); // 1 minuto antes

        if (timeUntilWarning > 0) {
          setTimeout(() => {
            this._showSessionWarning(expiresAt);
          }, timeUntilWarning);
        } else {
          this._showSessionWarning(expiresAt);
        }
      },


      _showSessionWarning: function (expiresAt) {
        let secondsLeft = Math.floor((expiresAt - Date.now()) / 1000);

        const interval = setInterval(() => {
          if (secondsLeft <= 0) {
            clearInterval(interval);
            MessageBox.error("⛔ Tu sesión ha expirado. (En pruebas: no se cerrará la sesión)");
            return;
          }

          // Actualiza el texto del diálogo dinámicamente
          if (dialog && dialog.getContent && dialog.getContent()[0]) {
            dialog.getContent()[0].setText(`Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?`);
          }

          secondsLeft--;
        }, 1000);

        const dialog = new sap.m.Dialog({
          title: "    Sesión a punto de expirar",
          content: [new sap.m.Text({ text: `Tu sesión expirará en ${secondsLeft} segundos. ¿Deseas continuar?` })],
          beginButton: new sap.m.Button({
            text: "Sí, mantener sesión",
            press: () => {
              clearInterval(interval);
              dialog.close();
              this._refreshToken(); //  Simula renovación de sesión
            }
          }),
          endButton: new sap.m.Button({
            text: "No",
            press: () => {
              clearInterval(interval);
              dialog.close();
              //  No hay logout en pruebas
            }
          }),
          afterClose: () => {
            dialog.destroy();
          }
        });

        dialog.open();
      },



      _parseJwt: function (token) {
        const base64Url = token.split('.')[1];
        const base64 = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodeURIComponent(escape(base64)));
      },

      _refreshToken: async function () {
        try {
          const response = await fetch("/odata/v4/datos-cdo/getUserInfo", {
            method: "GET"
          });
          const data = await response.json();

          //  console.log("Respuesta refresco token:", data); // <<<<<< Aquí para debug

          const token = data.token || (data.value && data.value.token);

          if (token) {
            this._startSessionWatcher(token);
            MessageBox.success("Sesión renovada.");
          } else {
            throw new Error("Token no recibido.");
          }
        } catch (err) {
          MessageBox.error("No se pudo renovar la sesión: " + err.message);
        }
      },



      onEmailPress: function (oEvent) {
        const sEmail = oEvent.getSource().getText();
        window.location.href = "mailto:" + sEmail;
      },

      _resetButtonHandlers: function () {
        const btn1 = this.byId("btnAceptar");
        const btn2 = this.byId("btnBorrado");

        if (btn1) {
          btn1.detachPress(this._onDecisionPress, this);
          btn1.detachPress(this.onSave, this);
          btn1.detachPress(this.onClearFields, this);
          btn1.detachPress(this.onBorrador, this);
        }

        if (btn2) {
          btn2.detachPress(this._onDecisionPress, this);
          btn2.detachPress(this.onSave, this);
          btn2.detachPress(this.onClearFields, this);
          btn2.detachPress(this.onBorrador, this);
        }
      },



      resetFormUI: function () {
        var aControls = this.getView().findAggregatedObjects(true, function (oControl) {
          return (
            oControl.isA("sap.m.Input") ||
            oControl.isA("sap.m.TextArea") ||
            oControl.isA("sap.m.CheckBox") ||
            oControl.isA("sap.m.ComboBox") ||
            oControl.isA("sap.m.DatePicker")
          );
        });

        aControls.forEach(function (oControl) {
          if (oControl.setEnabled) {
            oControl.setEnabled(true); // Vuelve a habilitar
          }
          if (oControl.setEditable) {
            oControl.setEditable(true); // Vuelve a editable
          }
          if (oControl.setValue) {
            oControl.setValue(""); // Por si hay texto suelto aún
          }
        });
      },



      _onObjectMatched: async function (oEvent) {
        this._resetButtonHandlers();

        const oArgs = oEvent.getParameter("arguments");
        let sProjectID = oArgs.sProjectID;
        let sSourceModel = oArgs.sourceModel || "modelPendientes";
        const sMode = oArgs.mode || "display";



        //  Parseamos el flag de aprobación
        let aprobacionFlag = this._parseAprobacionFlag(oArgs, sSourceModel);

        // LIMPIAMOS el sSourceModel si viene con sufijos tipo ";aprobacion=true"
        if (sSourceModel.includes(";")) {
          sSourceModel = sSourceModel.split(";")[0];
        }

        const btnAceptar = this.byId("btnAceptar");
        const btnBorrado = this.byId("btnBorrado");

        this._mode = sMode;

        this.getView().getModel("viewModel").setProperty("/mode", sMode);

        // console.log("MODELO GUARDADO (onObjectMatched):", sMode);
        //    console.log("MODELO TRAIDO " + this._mode);

        if (sMode === "create") {
          await this._clearAllInputs();
        } else if ((sMode === "edit")) {
          //  console.log("Entrando a clearTableTextsOnly");
          this._clearAllInputsEdit();
        }

        btnAceptar.setEnabled(true);
        btnAceptar.setText("Enviar");
        btnAceptar.setType(sap.m.ButtonType.Accept);
        btnAceptar.attachPress(this.onSave, this);

        btnBorrado.setEnabled(true);
        btnBorrado.setText("Guardar como borrador");
        btnBorrado.setType(sap.m.ButtonType.Emphasized);
        btnBorrado.attachPress(this.onBorrador, this);
        if (
          sMode === "display" &&
          (sSourceModel === "modelAprobados" || sSourceModel === "modelEtapasAsignadas" || sSourceModel === "modelRechazados")
        ) {

          this._Visualizar(sProjectID, sSourceModel);
          return;
        }

        //     Llamamos con el source limpio
        await this._configureButtons(sSourceModel, aprobacionFlag, sMode);

        this._sProjectID = sProjectID;

        if (sProjectID) {
          try {
            const oData = await this._fetchProjectData(sProjectID);
            await this._populateViewWithData(oData, sMode);
            await this._configureButtons(sSourceModel, aprobacionFlag, sMode);

          } catch (error) {
            console.error("Error al obtener los datos del proyecto:", error);
            sap.m.MessageToast.show("Error al cargar los datos del proyecto");
          }
        }
      },


      _parseAprobacionFlag: function (oArgs, sSourceModel) {
        let flag = false;
        if (sSourceModel.includes(";")) {
          const parts = sSourceModel.split(";");
          sSourceModel = parts[0];
          parts.slice(1).forEach(part => {
            const [key, value] = part.split("=");
            if (key === "aprobacion") {
              flag = (value === "true");
            }
          });
        } else {
          flag = (oArgs.aprobacion === "true");
        }
        return flag;
      },

      _configureButtons: function (sSourceModel, aprobacionFlag, sMode) {
        const btnAceptar = this.byId("btnAceptar");
        const btnBorrado = this.byId("btnBorrado");

        if (!btnAceptar || !btnBorrado) return;

        // Limpieza completa de eventos anteriores (clave para evitar dobles llamadas)
        btnAceptar.detachPress(this.onSave, this);
        btnAceptar.removeAllCustomData(); // Limpia valores previos
        btnBorrado.detachPress(this.onBorrador, this);
        btnBorrado.removeAllCustomData();

        // 2️ MODO DISPLAY → botones deshabilitados
        if (sMode === "display") {
          btnAceptar.setEnabled(false);
          btnAceptar.setText("Enviar");
          btnAceptar.setType(sap.m.ButtonType.Accept);

          btnBorrado.setEnabled(false);
          btnBorrado.setText("Guardar como borrador");
          btnBorrado.setType(sap.m.ButtonType.Emphasized);
          return;
        }

        // 3️ MODO CREATE o EDIT con borrador
        if (sSourceModel === "modelBorrador" || sMode === "create") {
          this._isAprobacion = false;

          btnAceptar.setEnabled(true);
          btnAceptar.setText("Enviar");
          btnAceptar.setType(sap.m.ButtonType.Accept);
          btnBorrado.setIcon("sap-icon://save"); //  icono de guardar
          btnAceptar.attachPress(this.onSave, this);

          btnBorrado.setEnabled(true);
          btnBorrado.setText("Guardar como borrador");
          btnBorrado.setType(sap.m.ButtonType.Emphasized);
          btnAceptar.setIcon(""); //  sin icono
          btnBorrado.attachPress(this.onBorrador, this);

          var oToday = new Date();  // Fecha y hora real

          // var oToday = new Date("2025-07-09T13:00:00");  // Fecha y hora real actual

          var iDay = oToday.getDay();    // Día de la semana (0-6)
          var iHours = oToday.getHours(); // Hora actual (0-23)

          if (iDay === 3 && iHours >= 20) {

            var oEnviarBtn = this.byId("btnAceptar");

            oEnviarBtn.setEnabled(false);

            MessageBox.error(
              "El envío está deshabilitado los miércoles por revisión interna. Intenta mañana.",
              { title: "Envío bloqueado" }
            );
            return;
          }
          return;
        }

        if (sSourceModel === "modelPendientes" && sMode === "edit") {
          this._isAprobacion = false;


          btnAceptar.setEnabled(true);
          btnAceptar.setText("Enviar");
          btnAceptar.setType(sap.m.ButtonType.Accept);
          btnAceptar.attachPress(this.onSave, this);


          btnBorrado.setEnabled(true); // primero habilita para asegurarte que se renderiza
          btnBorrado.setText("Guardar como borrador");
          btnBorrado.setType(sap.m.ButtonType.Transparent);
          btnBorrado.attachPress(this.onBorrador, this);

          btnBorrado.setEnabled(false); // y luego fuerza deshabilitar

          return;
        }

        // 4️ MODO DEFAULT: asegurar botones habilitados con acción segura
        btnAceptar.setEnabled(true);
        btnAceptar.setText("Enviar");
        btnAceptar.setType(sap.m.ButtonType.Accept);
        btnAceptar.attachPress(this.onSave, this);

        btnBorrado.setEnabled(true);
        btnBorrado.setText("Guardar como borrador");
        btnBorrado.setType(sap.m.ButtonType.Transparent);
        btnBorrado.attachPress(this.onBorrador, this);
        console.log("¿Botón deshabilitado3", btnBorrado.getEnabled());
      },



      _fetchProjectData: async function (sProjectID) {
        const Token = this._sCsrfToken;
        const sUrl = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})`;

        const response = await fetch(sUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-csrf-token': Token
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Network response was not ok: ' + errorText);
        }

        return await response.json();
      },


      _populateViewWithData: async function (oData, sMode) {

        //  console.log(sMode);
        const btnBorrado = this.byId("btnBorrado");

        //console.log("¿Al trae la informacion   inciio   ", btnBorrado.getEnabled()); 

        if (!oData) return;
        var oStatus = this.byId("23437");

        // Poblar controles básicos
        this.byId("input0").setValue(oData.codigoProyect || "");
        this.byId("input1").setValue(oData.nameProyect || "");
        this.byId("area0").setValue(oData.datosExtra || "");
        this._setEstadoVisual(oStatus, oData.Estado);

        this.byId("inputCambioEu").setValue(oData.CambioEuRUSD || "");
        this.byId("23d3").setText(oData.Empleado || "");
        this.byId("ofertaCheckBox").setSelected(oData.Oferta === true || oData.Oferta === "true");
        this.byId("idComentariosFac").setValue(oData.comentarioFacturacion || "");
        this.byId("idComentarioTipo").setValue(oData.comentarioTipoCompra || "");
        this.byId("idCheckMensual").setSelected(!!oData.mensual);
        this.byId("idTextComProve").setValue(oData.comentarioProveedor || "");
        this.byId("idComenpVd").setValue(oData.comentarioPvD || "");
        this.byId("dddtg").setText(oData.Email || "");
        this.byId("int_clienteFun").setValue(oData.funcionalString || "");
        this.byId("id_Cfactur").setValue(oData.clienteFacturacion || "");
        this.byId("idObje").setValue(oData.objetivoAlcance || "");
        this.byId("idDescripcion").setValue(oData.descripcion || "");
        this.byId("input0_1725625161348").setValue(oData.Total || "");
        this.byId("idAsunyRestri").setValue(oData.AsuncionesyRestricciones || "");
        this.byId("box_multiJuridica").setSelected(!!oData.multijuridica);
        this.byId("box_pluriAnual").setSelected(!!oData.pluriAnual);
        //        this.byId("slct_area").setSelectedKey(oData.Area_ID || "");
        await this.filterAreaFalse(oData.Area_ID);

        //  this.byId("slct_Jefe").setSelectedKey(oData.jefeProyectID_ID || "");

        await this.filterJefe(oData.jefeProyectID_ID);

        this.byId("selectMotivo").setSelectedKey(oData.MotivoCondi_ID || "");
        this.byId("select_tipoCom").setSelectedKey(oData.TipoCompra_ID || "");
        // this.byId("slct_verti").setSelectedKey(oData.Vertical_ID || "");
        this.filterVertical(oData.Vertical_ID);

        //  this.byId("slct_inic").setSelectedKey(oData.Iniciativa_ID || "");

        await this.filterTipoIniciativa(oData.Iniciativa_ID);
        // this.byId("idNatu").setSelectedKey(oData.Naturaleza_ID || "");
        await this.filterNaturaleza(oData.Naturaleza_ID);

        //this.byId("selct_Amrecp").setSelectedKey(oData.AmReceptor_ID || "");
        //this.byId("selc_ejcu").setSelectedKey(oData.EjecucionVia_ID || "");
        //  this.byId("selc_Segui").setSelectedKey(oData.Seguimiento_ID || "");
        // this.byId("slct_client").setSelectedKey(oData.ClienteNuevo_ID || "");
        await this.filterAMreceptor(oData.AmReceptor_ID);
        await this.filterEjecucionVia(oData.EjecucionVia_ID);
        await this.filterSeguimiento(oData.Seguimiento_ID);
        await this.filterClienteNuevo(oData.ClienteNuevo_ID);
        this.byId("date_inico").setDateValue(oData.Fechainicio ? new Date(oData.Fechainicio) : null);
        this.byId("date_fin").setDateValue(oData.FechaFin ? new Date(oData.FechaFin) : null);
        this.byId("box_pluriAnual").setSelected(oData.pluriAnual);
        this.byId("id_Cfactur").setValue(oData.clienteFacturacion);
        this.byId("box_multiJuridica").setSelected(oData.multijuridica);

        // Mostrar u ocultar tabla y campos según lógica
        const iniciativaId = oData.Iniciativa_ID;
        this.byId("table0").setVisible(iniciativaId === "323e4567-e89b-12d3-a456-426614174002");
        this.byId("idCheckMensual").setVisible(iniciativaId === "323e4567-e89b-12d3-a456-426614174002");
        this.byId("idComentarioTipo").setVisible(iniciativaId === "323e4567-e89b-12d3-a456-426614174002");
        this.byId("idComenpVd").setEditable(iniciativaId === "223e4567-e89b-12d3-a456-426614174001");

        this.onInputChange();


        // Carga de datos adicionales (en paralelo)
        await Promise.all([
          this.fetchMilestones(this._sProjectID),
          this.leerProveedor(this._sProjectID),
          this.leerFacturacion(this._sProjectID),
          this.leerClientFactura(this._sProjectID),
          this.leerRecursos(this._sProjectID),
          this.leerConsumoExterno(this._sProjectID),
          this.leerGastoViajeConsu(this._sProjectID),
          this.leerRecursoExterno(this._sProjectID),
          this.leerOtrosServiExter(this._sProjectID),
          this.leerOtrosConcepto(this._sProjectID),
          this.leerSerivioInterno(this._sProjectID),
          this.leerGastoviajeInterno(this._sProjectID),
          this.leerConsuOtroServi(this._sProjectID),
          this.leerGastoViaExter(this._sProjectID),
          this.leerLicencias(this._sProjectID),
          this.leerPerfilJornadas(this._sProjectID),
          this.leerTotalRecursoInterno(this._sProjectID),
          this.leerTotalConsumoExter(this._sProjectID),
          this.leerTotalRecuExterTotal(this._sProjectID),
          this.leerWorkflowInstancias(this._sProjectID),
          this.leerTotalInfraestrLicencia(this._sProjectID),
          this.leerTotalResumenCostesTotal(this._sProjectID),
          this.getArchivosByProjectId(this._sProjectID)
        ]);

        this.highlightControls();

        const btnAceptar = this.byId("btnAceptar");
        //   const btnBorrar = this.byId("btnBorrado");




        new sap.m.Dialog({
          title: "Información",
          type: "Message",
          state: "Success",
          content: new sap.m.Text({ text: "Datos cargados correctamente" }),
          beginButton: new sap.m.Button({
            text: "OK",
            press: function () {
              this.getParent().close();
            }
          }),
          afterClose: function () {
            this.destroy();
          }
        }).open();
      },


      onVerArchivo: function (oEvent) {
        const oItem = oEvent.getSource();
        const oContext = oItem.getBindingContext("archivosModel");

        if (!oContext) {
          sap.m.MessageToast.show("    No se pudo obtener el contexto del archivo.");
          return;
        }

        const archivoID = oContext.getProperty("ID");
        const fileName = oContext.getProperty("nombre");
        const mimeType = oContext.getProperty("tipoMime");

        if (!archivoID || !fileName || !mimeType) {
          sap.m.MessageToast.show("    Faltan datos para abrir o descargar el archivo.");
          return;
        }

        //  console.log("    ID recibido para ver archivo:", archivoID);
        this._descargarArchivo(archivoID, fileName, mimeType);
      },




      _descargarArchivo: async function (archivoId, fileName, mimeType) {

        try {
          const res = await fetch(`/odata/v4/datos-cdo/Archivos('${archivoId}')/contenido/$value`, {
            method: "GET"
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error("    Error al descargar archivo: " + errorText);
          }

          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));

          // Mostrar una vista previa si es imagen, texto o PDF
          if (mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType.startsWith("text/")) {
            const newWindow = window.open();
            newWindow.document.write(
              `<title>${fileName}</title><iframe src="${blobUrl}" width="100%" height="100%"></iframe>`
            );
          }

          // Siempre descargar con el nombre original
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileName || "archivo";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          //      sap.m.MessageToast.show("    Archivo descargado: " + fileName);
        } catch (err) {
          console.error("    Error en descarga:", err);
          //   sap.m.MessageToast.show(err.message);
        }
      },

      getArchivosByProjectId: async function (projectId) {
        //    console.log(" Entrando a getArchivosByProjectId con ID:", projectId);

        try {
          const sUrl = `/odata/v4/datos-cdo/Archivos?$filter=datosProyect_ID eq '${projectId}'`;

          const response = await fetch(sUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error en la respuesta de la API: ' + errorText);
          }

          const data = await response.json();
          const archivos = data.value || [];
          const archivoIds = archivos.map(archivo => archivo.ID); // Extraer los IDs
          //          console.log("🆔 IDs de los archivos:", archivoIds);

          this._archivoIds = archivoIds; // Guardar en el controlador


          const oModel = new sap.ui.model.json.JSONModel({ archivos });
          this.getView().setModel(oModel, "archivosModel");

          //  console.log("    Modelo cargado en la vista con archivos:", archivos.length);
        } catch (err) {
          console.error("    Error al cargar archivos:", err);
          console.log(err.message);
        }
      },





      _clearAllInputs: async function () {
        const oView = this.getView();
        const controls = oView.findElements(true);
        const oModel = oView.getModel("planning");
        const oModelDynamic = oView.getModel("dynamicInputs");

        this._idWorkflowInstancias = null; // o undefined
        this._idWorkIniciado = null;

        this._clearTableTextsOnly();
        // Lista de campos que deben quedarse como no editables


        this._IdFechasPorMesLicencia = null;
        this._IdFechasPorMesOtConp = null;
        this._IdFechasPorMesReEx = null;
        this._IdFechasPorMesSerReEx = null;
        this._IdFechasPorMesREExt = null;
        this._IdFechasPorMesGasViaConsuEx = null;
        this._IdFechasPorMesServiConsu = null;
        this._IdFechasPorMesConsuEx = null;
        this._IdFechasPorMesGVinter = null;
        this._IdFechasPorMesServInt = null;
        this._IdFechasPorMesGasViaConsuEx = [];
        this._IdFechasPorMes = [];
        this._RecursoInt = [];
        this._FacturacionID = null;
        this._aChartData = [];
        this._proveedoresIDs = [];
        this._recursosIDs = [];
        this._consumoExternosIDs = [];
        this._RecursoExterno = null;
        this._OtrosConceptos = null;
        this._idServiInterno = null;
        this._IdGastoViajInter = null;
        this._idConsuOtrser = null;
        this._idGastoViajeCOnsu = null;
        this._idOtroSerEx = null;
        this._idGasViaReEx = null;
        this._idLicencia = null;
        this._idJornadas = null;
        this._idTotalRecInter = null;
        this._selectedFile = null;




        const aTableIdsConColumnasDinamicas = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
          "idOtroserConsu",
          "idGastoViajeConsu",
          "idServiExterno",
          "idGastoRecuExter",
          "tablaInfrestuctura",
          "tablaLicencia",
          "tableServicioInterno",
          "tablGastoViajeInterno"
        ];

        aTableIdsConColumnasDinamicas.forEach((tableId) => {
          const oTable = this.byId(tableId);
          if (oTable) {
            const aColumns = oTable.getColumns();
            for (let i = aColumns.length - 1; i >= 0; i--) {
              const oHeader = aColumns[i].getHeader();
              if (oHeader && /\d{4}-\w+/.test(oHeader.getText())) {
                oTable.removeColumn(aColumns[i]);
              }
            }

            // Además, limpiar los inputs dinámicos en cada fila
            oTable.getItems().forEach((oRow) => {
              const aCells = oRow.getCells();
              // Remover las celdas con inputs dinámicos (puedes ajustar la lógica si tienes columnas fijas)
              for (let i = aCells.length - 1; i >= 0; i--) {
                const oCell = aCells[i];
                const oBinding = aColumns[i] && aColumns[i].getHeader()?.getText();
                if (/\d{4}-\w+/.test(oBinding)) {
                  oRow.removeCell(oCell);
                }
              }
            });
          }
        });

        // Limpiar textos visibles (txt_... y text...)
        const aTextFieldsToClear = [
          "txt_codig", "txt_nomPro", "txt_area", "txt_NomJefe", "txt_funcio",
          "txt_feIni", "txt_feFin", "txt_ini", "text72_1731325324246", "text73_1731325328049",
          "txt_client", "txt_cFactura", "txt_Codi2", "txt_Nombre2", "txt_area2",
          "txt_Fe_ini2", "txt_Fe_fin2", "textClitFu3", "textCliFac3", "textCodigo3",
          "textNatural3", "txtNombre3", "txtAre3", "txtFechInici3", "txtFechFin3"
        ];

        aTextFieldsToClear.forEach(sId => {
          const oText = this.byId(sId);
          if (oText && typeof oText.setText === "function") {
            oText.setText("");
          }
        });


        const aAlwaysReadOnlyIds = [
          "inputReInter", "inputConsuEx", "inputRcurExtern", "inputTotalJor", "inputServi1",
          "inputOtrosServi1", "inputGastoVia1", "totalRecuInter", "inputServi2", "inputOtroSer2", "input2_1756121205",
          "inptGastoVi2", "inputServi", "input10_1724757017406", "input9_1724757015442", "totalInfraestruc", "input0_1724758359", "input0_1725625161348", "input0_1725625132423424361348",
          "totaRecurExterno", "input0", "totalConsuExternot", "idComenpVd", "idTextComProve", "input0_1724758359", "totalSubtotal", "input2_1724756105"
        ];

        // Limpieza general de campos
        controls.forEach(control => {
          // Vaciar valores
          if (control instanceof sap.m.Input || control instanceof sap.m.TextArea) {
            control.setValue("");
          } else if (control instanceof sap.m.Select) {
            control.setSelectedKey("");
          } else if (control instanceof sap.m.DatePicker) {
            control.setDateValue(null);
            control.setValue("");
          } else if (control instanceof sap.m.CheckBox) {
            control.setSelected(false);
          }



          // Restaurar editable y enabled solo si NO está en la lista de campos bloqueados
          const sId = control.getId().split("--").pop(); // Extrae solo el ID puro
          const isReadOnly = aAlwaysReadOnlyIds.includes(sId);

          if (!isReadOnly) {
            if (typeof control.setEditable === "function") {
              control.setEditable(true);
            }
            if (typeof control.setEnabled === "function") {
              control.setEnabled(true);
            }
          }
        });

        // Ocultar elementos específicos
        const aElementsToHide = [
          "table0", "idCheckMensual", "idComentarioTipo", "table_clienteFac"
        ];
        aElementsToHide.forEach(sId => {
          const control = this.byId(sId);
          if (control) {
            control.setVisible(false);
          }
        });

        // Limpiar textos específicos
        this.byId("text73_172746565340567").setText("");
        this.byId("text73_172746565340569997").setText("");

        // Limpiar datos de los gráficos
        if (oModel) {
          oModel.setProperty("/chartData", []);
          oModel.setProperty("/chartModel", []);
        }

        // Limpiar el modelo dynamicInputs completamente
        if (oModelDynamic) {
          oModelDynamic.setData({}); // <<< esta línea limpia todo el contenido del modelo
          oModelDynamic.refresh(true); // <<< refresca el modelo si es necesario
        }


        const oArchivosModel = this.getView().getModel("archivosModel");
        if (oArchivosModel) {
          oArchivosModel.setProperty("/archivos", []);
        }




        this.refreshODataModel();




        aTableIdsConColumnasDinamicas.forEach((tableId) => {
          const oTable = this.byId(tableId);
          if (oTable) {
            const aColumns = oTable.getColumns();
            for (let i = aColumns.length - 1; i >= 0; i--) {
              const oHeader = aColumns[i].getHeader();
              if (oHeader && /\d{4}-\w+/.test(oHeader.getText())) {
                oTable.removeColumn(aColumns[i]);
              }
            }

            // Además, limpiar los inputs dinámicos en cada fila
            oTable.getItems().forEach((oRow) => {
              const aCells = oRow.getCells();
              for (let i = aCells.length - 1; i >= 0; i--) {
                const oCell = aCells[i];
                const oBinding = aColumns[i] && aColumns[i].getHeader()?.getText();
                if (/\d{4}-\w+/.test(oBinding)) {
                  oRow.removeCell(oCell);
                }
              }
            });

            // 🔧 Nuevo agregado: volver al tamaño original configurado
            // Forzar invalidation para que la tabla re-renderice su layout
            oTable.invalidate();
          }
        });

        //     console.log("Todos los campos, textos y gráficos han sido limpiados.");
      },


      _clearAllInputsEdit: async function () {
        await this._clearTableTextsOnly();
        const oView = this.getView();
        const controls = oView.findElements(true);
        const oModel = oView.getModel("planning");
        const oModelDynamic = oView.getModel("dynamicInputs");


        if (oModelDynamic) {
          oModelDynamic.setData({});
          oModelDynamic.refresh(true);
        }

        this._IdFechasPorMesGasViaConsuEx = [];
        this._IdFechasPorMes = [];
        this._RecursoInt = [];
        this._FacturacionID = null;
        this._aChartData = [];
        this._proveedoresIDs = [];
        this._recursosIDs = [];
        this._consumoExternosIDs = [];
        this._RecursoExterno = null;
        this._OtrosConceptos = null;
        this._idServiInterno = null;
        this._IdGastoViajInter = null;
        this._idConsuOtrser = null;
        this._idGastoViajeCOnsu = null;
        this._idOtroSerEx = null;
        this._idGasViaReEx = null;
        this._idLicencia = null;
        this._idJornadas = null;
        this._idTotalRecInter = null;
        this._selectedFile = null;


        const aAlwaysReadOnlyIds = [
          "inputReInter", "inputConsuEx", "inputRcurExtern", "inputTotalJor", "inputServi1",
          "inputOtrosServi1", "inputGastoVia1", "totalRecuInter", "inputServi2", "inputOtroSer2",
          "inptGastoVi2", "inputServi", "input10_1724757017406", "input9_1724757015442", "totalSubtotal", "input2_1724756105", "input0_1724758359", "totalInfraestruc",
          "totaRecurExterno", "input0", "totalConsuExternot", "idComenpVd", "idTextComProve , input0_1724758359", "input2_1756121205", "input0_1725625161348", "input0_1725625132423424361348"
        ];

        // Limpieza general de campos
        controls.forEach(control => {
          // Vaciar valores
          // Restaurar editable y enabled solo si NO está en la lista de campos bloqueados
          const sId = control.getId().split("--").pop(); // Extrae solo el ID puro
          const isReadOnly = aAlwaysReadOnlyIds.includes(sId);

          if (!isReadOnly) {
            if (typeof control.setEditable === "function") {
              control.setEditable(true);
            }
            if (typeof control.setEnabled === "function") {
              control.setEnabled(true);
            }
          }
        });


      },


      _clearTableTextsOnly: function () {

        //     console.log("Entre a este metodo --->ZZZ    ")
        const oView = this.getView();
        const aTableIds = [
          "tablaConsuExter",
          "table_dimicFecha",
          "tablaRecExterno",
          "idOtroserConsu",
          "idGastoViajeConsu",
          "idServiExterno",
          "idGastoRecuExter",
          "tablaInfrestuctura",
          "tablaLicencia",
          "tableServicioInterno",
          "tablGastoViajeInterno"
        ];

        aTableIds.forEach(sTableId => {
          const oTable = this.byId(sTableId);
          if (!oTable) {
            console.warn(`Tabla no encontrada: ${sTableId}`);
            return;
          }

          const aColumns = oTable.getColumns();
          const aItems = oTable.getItems();

          aItems.forEach(oItem => {
            const aCells = oItem.getCells();

            aCells.forEach((oCell, index) => {
              // Opcional: verifica si quieres limpiar solo columnas dinámicas (YYYY-Month)
              const sHeaderText = aColumns[index] && aColumns[index].getHeader()?.getText();
              const isDynamicColumn = /\d{4}-\w+/.test(sHeaderText);

              // Si quieres limpiar solo columnas dinámicas, activa esta condición:
              // if (!isDynamicColumn) return;

              // Limpiar Input
              if (typeof oCell.setValue === "function") {
                oCell.setValue("");
              }

              // Limpiar Text
              if (typeof oCell.setText === "function") {
                oCell.setText("");
              }

              // Limpiar Select
              if (typeof oCell.setSelectedKey === "function") {
                oCell.setSelectedKey(""); // O setSelectedKey("defaultKey") si lo necesitas
              }

            });
          });
        });





        //console.log("Limpieza de textos, selects y fechas completada en tablas dinámicas.");
      },







      //      ENVIOOOOO  CON COMENTARIOOOOOOOOOOOOOO       

      _onDecisionPress: function (oEvent) {
        const decision = oEvent.getSource().data("valor");
        const textoAccion = decision === "approve" ? "aprobar" : "rechazar";
        const decisionTitulo = decision === "approve" ? "Aprobación" : "Rechazo";

        console.log("DECISIÓN:", decision);

        // Crear campo de texto para comentarios
        const oTextArea = new sap.m.TextArea({
          width: "100%",
          placeholder: "Puede escribir un comentario (opcional)...",
          rows: 4
        });

        // Crear el diálogo
        const oDialog = new sap.m.Dialog({
          title: "Confirmar " + decisionTitulo,
          type: "Message",
          content: [
            new sap.m.Text({ text: `¿Está seguro de que desea ${textoAccion} este proyecto?` }),
            new sap.m.Label({ text: "Comentario:", labelFor: oTextArea }),
            oTextArea
          ],
          beginButton: new sap.m.Button({
            text: " Confirmar",
            type: sap.m.ButtonType.Emphasized,
            press: function () {
              const comentario = oTextArea.getValue();
              console.log(" Comentario ingresado: ", comentario);

              oDialog.close();

              // Configuración del BusyDialog
              const sTituloBusy = decision === "approve" ? "Enviando aprobación" : "Enviando rechazo";
              const sTextoBusy = decision === "approve"
                ? "Enviando su aprobación, por favor espere..."
                : "Enviando su rechazo, por favor espere...";

              if (!this._oBusyDialog) {
                this._oBusyDialog = new sap.m.BusyDialog({
                  title: sTituloBusy,
                  text: sTextoBusy
                });
              } else {
                this._oBusyDialog.setTitle(sTituloBusy);
                this._oBusyDialog.setText(sTextoBusy);
              }

              // Abrir BusyDialog
              this._oBusyDialog.open();

              // Ejecutar el proceso de workflow
              this._completarWorkflow(decision, comentario)
                .then(() => {
                  this._oBusyDialog.close();
                  sap.m.MessageBox.information(
                    "La decisión fue enviada correctamente. Puede ir a la aplicación para ver el estado del proceso.",
                    {
                      title: "Proceso enviado",
                      onClose: function () {
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("appNoparame");
                      }.bind(this)
                    }
                  );
                })
                .catch(err => {
                  this._oBusyDialog.close();
                  console.error("Error completando workflow:", err);
                  sap.m.MessageBox.error("Hubo un error procesando la aprobación.");
                });

            }.bind(this)
          }),
          endButton: new sap.m.Button({
            text: "Cancelar",
            press: function () {
              oDialog.close();
            }
          }),
          afterClose: function () {
            oDialog.destroy();
          }
        });

        oDialog.open();
      },




      ///   este funciona       
      /* _onDecisionPress: function (oEvent) {
         const decision = oEvent.getSource().data("valor");
 
         //console.log("DECISIÓN:", decision);
 
         if (!decision) {
           sap.m.MessageBox.warning("No se pudo determinar la decisión.");
           return;
         }
 
         const sTextoConfirmacion = decision === "approve"
           ? "¿Está seguro de que desea aprobar este proyecto?"
           : "¿Está seguro de que desea rechazar este proyecto?";
 
         sap.m.MessageBox.confirm(sTextoConfirmacion, {
           title: "Confirmar decisión",
           actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
           emphasizedAction: sap.m.MessageBox.Action.YES,
           onClose: function (sAction) {
             if (sAction === sap.m.MessageBox.Action.YES) {
               // Lanzar proceso async, no bloquear UI
               this._completarWorkflow(decision)
                 .catch(err => {
                   console.error("Error completando workflow:", err);
                   sap.m.MessageBox.error("Hubo un error procesando la aprobación.");
                 });
 
               // Mostrar mensaje informativo y navegar
               sap.m.MessageBox.information(
                 "La aprobación se envió correctamente. Puede ir a la aplicación para ver el estado del proceso de aprobación.",
                 {
                   title: "Aprobación enviada",
                   onClose: function () {
                     var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                     oRouter.navTo("appNoparame");
                   }.bind(this)
                 }
               );
             } else {
               //console.log("Usuario canceló la acción.");
             }
           }.bind(this)
         });
       },
 */




      _Visualizar: async function (sProjectID, sSourceModel) {
        //console.log("ENTRE A VISUALIZAR con ID:", sSourceModel);


        const btnAceptar = this.byId("btnAceptar");
        const btnBorrado = this.byId("btnBorrado");

        // Siempre limpiar eventos y custom data para evitar duplicados
        btnAceptar.detachPress(this.onSave, this);
        btnAceptar.setIcon(""); //  sin icono
        btnAceptar.removeAllCustomData();
        btnBorrado.detachPress(this.onBorrador, this);
        btnAceptar.setIcon(""); //  sin icono

        btnBorrado.removeAllCustomData();
        const btnDelete = this.byId("idDelete");


        // Solo si viene del modelo 'modelEtapasAsignadas'
        if (sSourceModel === "modelEtapasAsignadas") {


          /*if (!this._userPuedeAprobar) {
            sap.m.MessageBox.warning(
              "No tiene permisos para aprobar o rechazar esta solicitud.",
              { title: "Acceso denegado" }
            );
            return;
          }*/


          this._isAprobacion = true; // << ACTIVAR BANDERA

          // Configurar botones para modo aprobación
          btnDelete.setVisible(false); // Ocultar el botón en modo aprobación
          btnAceptar.detachPress(this._onDecisionPress, this);
          btnAceptar.setText("Aprobar");
          btnAceptar.setType(sap.m.ButtonType.Accept);
          btnAceptar.setIcon("sap-icon://accept"); //  Ícono de check verde
          btnAceptar.data("valor", "approve");
          btnAceptar.attachPress(this._onDecisionPress, this);

          btnBorrado.detachPress(this._onDecisionPress, this);
          btnBorrado.setText("Rechazar");
          btnBorrado.setType(sap.m.ButtonType.Reject);
          btnBorrado.setIcon("sap-icon://decline"); //  Ícono de cruz roja
          btnBorrado.data("valor", "reject");
          btnBorrado.attachPress(this._onDecisionPress, this);
        } else {
          // Si no es modelEtapasAsignadas, puedes dejar los botones deshabilitados o como estaban
          btnAceptar.setEnabled(false);
          btnBorrado.setEnabled(false);
        }


        //console.log("ENTRE A VISUALIZAR con ID:", sProjectID);

        this._configureButtonsForView();

        const Token = this._sCsrfToken;
        const oModel = this.getView().getModel("mainService");

        if (oModel) {
          oModel.setData({});
          oModel.refresh(true);
        }

        this._sProjectID = sProjectID;

        // Construir URL, asumiendo que sProjectID es string. Si es numérico, elimina las comillas.
        const sUrl = `/odata/v4/datos-cdo/DatosProyect('${sProjectID}')`;

        try {
          const response = await fetch(sUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-csrf-token': Token
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Network response was not ok: ' + errorText);
          }

          const oData = await response.json();

          if (oData) {
            this._fillControlsWithData(oData);

            // Carga paralela de datos relacionados
            await Promise.all([
              this.fetchMilestones(sProjectID),
              this.leerProveedor(sProjectID),
              this.leerFacturacion(sProjectID),
              this.leerClientFactura(sProjectID),
              this.leerRecursos(sProjectID),
              this.leerConsumoExterno(sProjectID),
              this.leerGastoViajeConsu(sProjectID),
              this.leerRecursoExterno(sProjectID),
              this.leerOtrosServiExter(sProjectID),
              this.leerOtrosConcepto(sProjectID),
              this.leerSerivioInterno(sProjectID),
              this.leerGastoviajeInterno(sProjectID),
              this.leerConsuOtroServi(sProjectID),
              this.leerGastoViaExter(sProjectID),
              this.leerLicencias(sProjectID),
              this.leerPerfilJornadas(sProjectID),
              this.leerTotalRecursoInterno(sProjectID),
              this.leerTotalConsumoExter(sProjectID),
              this.leerTotalRecuExterTotal(sProjectID),
              this.leerWorkflowInstancias(sProjectID),
              this.leerTotalInfraestrLicencia(sProjectID),
              this.leerTotalResumenCostesTotal(sProjectID)
            ]);

            this.highlightControls();
            this._setAllControlsEditable(false);

            this._showSuccessDialog("Datos cargados correctamente");
          }
        } catch (error) {
          console.error("Error al obtener los datos del proyecto:", error);
          sap.m.MessageToast.show("Error al cargar los datos del proyecto");
        }
      },





      // Función para configurar los botones en modo visualización (deshabilitados y texto original)
      _configureButtonsForView: function () {
        if (this._isAprobacion) {
          return;
        }


        const btnAceptar = this.byId("btnAceptar");
        const btnBorrado = this.byId("btnBorrado");
        const btnButon = this.byId("idDelete");

        btnAceptar.setEnabled(false);
        btnBorrado.setEnabled(false);
        btnButon.setEnabled(false);

        btnAceptar.setText("Enviar");
        btnAceptar.setType(sap.m.ButtonType.Accept);

        btnBorrado.setText("Guardar como borrador");
        btnBorrado.setType(sap.m.ButtonType.Emphasized);
      },

      // Función para llenar controles con datos recibidos
      _fillControlsWithData: async function (oData) {

        var oStatus = this.byId("23437");

        // Inputs y TextAreas
        this.byId("input0").setValue(oData.codigoProyect || "");
        this.byId("input1").setValue(oData.nameProyect || "");
        this.byId("area0").setValue(oData.datosExtra || "");
        this.byId("inputCambioEu").setValue(oData.CambioEuRUSD || "");
        this._setEstadoVisual(oStatus, oData.Estado);

        this.byId("ofertaCheckBox").setSelected(oData.Oferta === true || oData.Oferta === "true");
        this.byId("23d3").setText(oData.Empleado || "");
        this.byId("idComentariosFac").setValue(oData.comentarioFacturacion || "");
        this.byId("idComentarioTipo").setValue(oData.comentarioTipoCompra || "");
        this.byId("idCheckMensual").setSelected(!!oData.mensual);
        this.byId("idTextComProve").setValue(oData.comentarioProveedor || "");
        this.byId("idComenpVd").setValue(oData.comentarioPvD || "");
        this.byId("dddtg").setText(oData.Email || "");
        this.byId("int_clienteFun").setValue(oData.funcionalString || "");
        this.byId("id_Cfactur").setValue(oData.clienteFacturacion || "");
        this.byId("idObje").setValue(oData.objetivoAlcance || "");
        this.byId("idDescripcion").setValue(oData.descripcion || "");
        this.byId("input0_1725625161348").setValue(oData.Total || "");
        this.byId("idAsunyRestri").setValue(oData.AsuncionesyRestricciones || "");
        this.byId("box_multiJuridica").setSelected(!!oData.multijuridica);
        this.byId("box_pluriAnual").setSelected(!!oData.pluriAnual);

        // Selects
        this.byId("slct_area").setSelectedKey(oData.Area_ID || "");
        this.byId("slct_Jefe").setSelectedKey(oData.jefeProyectID_ID || "");
        this.byId("selectMotivo").setSelectedKey(oData.MotivoCondi_ID || "");
        this.byId("select_tipoCom").setSelectedKey(oData.TipoCompra_ID || "");
        this.byId("slct_verti").setSelectedKey(oData.Vertical_ID || "");
        this.byId("slct_inic").setSelectedKey(oData.Iniciativa_ID || "");
        this.byId("idNatu").setSelectedKey(oData.Naturaleza_ID || "");
        this.byId("selct_Amrecp").setSelectedKey(oData.AmReceptor_ID || "");
        this.byId("selc_ejcu").setSelectedKey(oData.EjecucionVia_ID || "");
        this.byId("selc_Segui").setSelectedKey(oData.Seguimiento_ID || "");
        this.byId("slct_client").setSelectedKey(oData.ClienteNuevo_ID || "");

        // Dates
        this.byId("date_inico").setDateValue(oData.Fechainicio ? new Date(oData.Fechainicio) : null);
        this.byId("date_fin").setDateValue(oData.FechaFin ? new Date(oData.FechaFin) : null);

        await this.onInputChange();
        // Mostrar u ocultar controles según Iniciativa_ID
        if (oData.Iniciativa_ID === "323e4567-e89b-12d3-a456-426614174002") {
          this.byId("table0").setVisible(true);
          this.byId("idCheckMensual").setVisible(true);
          this.byId("idComentarioTipo").setVisible(true);
        } else {
          this.byId("table0").setVisible(false);
          this.byId("idCheckMensual").setVisible(false);
          this.byId("idComentarioTipo").setVisible(false);
        }

        // Editable para comentario PvD según Iniciativa_ID
        this.byId("idComenpVd").setEditable(oData.Iniciativa_ID === "223e4567-e89b-12d3-a456-426614174001");
      },

      // Función para mostrar un diálogo de éxito
      _showSuccessDialog: function (message) {
        var oDialog = new sap.m.Dialog({
          title: "Información",
          type: "Message",
          state: "Success",
          content: new sap.m.Text({ text: message }),
          beginButton: new sap.m.Button({
            text: "OK",
            press: function () {
              oDialog.close();
            }
          }),
          afterClose: function () {
            oDialog.destroy();
          }
        });

        oDialog.open();
      },





      _setEstadoVisual: function (oStatusControl, sEstado) {
        oStatusControl.setText(sEstado || "");

        switch ((sEstado || "").toLowerCase()) {
          case "aprobado":
            oStatusControl.setState(sap.ui.core.ValueState.Success); // verde
            break;
          case "rechazado":
            oStatusControl.setState(sap.ui.core.ValueState.Error); // rojo
            break;
          case "borrador":
            oStatusControl.setState(sap.ui.core.ValueState.None); // gris neutro
            break;
          case "pendiente":
          default:
            oStatusControl.setState(sap.ui.core.ValueState.Warning); // amarillo
            break;
        }
      },
















      _setAllControlsEditable: function (bEditable) {
        const oView = this.getView();

        // Lista de tipos de controles editables más comunes
        const editableControls = ["sap.m.Input", "sap.m.TextArea", "sap.m.Select", "sap.m.CheckBox", "sap.m.DatePicker"];

        editableControls.forEach(sControlType => {
          oView.findAggregatedObjects(true, function (oControl) {
            return oControl.isA && oControl.isA(sControlType);
          }).forEach(function (oControl) {
            // Cambiar la propiedad editable o enabled según el control
            if (oControl.setEditable) {
              oControl.setEditable(bEditable);
            } else if (oControl.setEnabled) {
              oControl.setEnabled(bEditable);
            }
          });
        });
      },


      enviarID: async function (workflowInstanceId) {
        const workflowInstanceId2 = workflowInstanceId;

        if (!workflowInstanceId2) {
          MessageBox.error("No se ha definido el ID del workflow.");
          return;
        }

        const oModel = this.getOwnerComponent().getModel();

        // Aquí defines el parámetro directamente en el binding
        const oContext = oModel.bindContext(
          `/registrarTareasWorkflow(workflowInstanceId='${workflowInstanceId}')`
        );

        try {
          await oContext.execute();
          const result = oContext.getBoundContext().getObject();

          //      MessageToast.show("Tareas registradas correctamente");
          //console.log("Resultado:", result);

        } catch (error) {
          MessageBox.error("Error al registrar tareas:\n" + error.message);
        }
      },






      _completarWorkflow: async function (decision, comentario) {
        const workflowInstanceId = this._idWorkIniciado;
        const idProject = this._sProjectID;
        //console.log("ID" + idProject);
        const usuario = "Carolina Falen";

        //console.log("ID DEL PROYECTO " + idProject);

        if (!workflowInstanceId) {
          sap.m.MessageBox.error("No se encontró el ID del flujo de trabajo.");
          return;
        }

        const oModel = this.getOwnerComponent().getModel();
        const oContext = oModel.bindContext("/completeWorkflow(...)");

        oContext.setParameter("workflowInstanceId", workflowInstanceId);
        oContext.setParameter("decision", decision);
        oContext.setParameter("usuario", usuario);
        oContext.setParameter("idProject", idProject);
        oContext.setParameter("comentario", comentario);
        oContext.setParameter("comentariopmo", comentario);




        try {
          await oContext.execute();

          const idWOrk = this._idWorkflowInstancias;

          if (!idWOrk) {
            sap.m.MessageBox.error("No se encontró el ID de la instancia de workflow para actualizar el estado.");
            return;
          }

          const sUrl = `/odata/v4/datos-cdo/WorkflowInstancias(${idWOrk})`;

          // Traducir decisión a estado en español
          let updatedEstado;
          if (decision === "approve") {
            updatedEstado = "Aprobado";
          } else if (decision === "reject") {
            updatedEstado = "Rechazado";
          } else {
            updatedEstado = "Desconocido";
          }

          const updatedDate = new Date().toISOString();

          const patchResponse = await fetch(sUrl, {
            method: "PATCH",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-csrf-token": this._sCsrfToken
            },
            body: JSON.stringify({
              estado: updatedEstado,
              actualizadoEn: updatedDate
            })
          });

          if (!patchResponse.ok) {
            const errorText = await patchResponse.text();
            throw new Error("Error actualizando el estado del proyecto: " + errorText);
          }

          // sap.m.MessageToast.show("Decisión enviada: " + decision);
          // sap.m.MessageToast.show("Proyecto actualizado a estado: " + updatedEstado);

        } catch (err) {
          sap.m.MessageBox.error("Error al completar el workflow: " + err.message);
        }
      },





      //----------Traer informacion de tabla Planificacion--------


      fetchMilestones: async function (projectID) {
        if (!projectID) {
          console.error("Error: projectID es inválido o indefinido:", projectID);
          //     sap.m.MessageToast.show("Error: ID del proyecto no válido.");
          return;
        }

        var sUrl = `/odata/v4/datos-cdo/planificacion?$filter=datosProyect_ID eq '${projectID}'`;

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
            throw new Error('Error en la respuesta de la API: ' + errorText);
          }

          const oData = await response.json();

          if (!oData || !oData.value || !Array.isArray(oData.value) || oData.value.length === 0) {
            //   console.warn("No se encontraron datos de planificación para el proyecto:", projectID);
            //         sap.m.MessageToast.show("No hay datos de planificación disponibles.");
            return;
          }

          // Ordenar los hitos por fecha de inicio
          oData.value.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

          var oPlanningModel = this.getView().getModel("planning");

          // Crear un objeto para mapear los hitos correctamente
          let milestoneMap = {};

          oData.value.forEach((item) => {
            let formattedFechaInicio = item.fecha_inicio ? new Date(item.fecha_inicio).toISOString().split('T')[0] : null;
            let formattedFechaFin = item.fecha_fin ? new Date(item.fecha_fin).toISOString().split('T')[0] : null;

            // Guardamos la información en un objeto con la clave del hito
            milestoneMap[item.hito] = {
              fechaInicio: formattedFechaInicio,
              fechaFin: formattedFechaFin
            };
          });

          // Ahora actualizamos el modelo según los hitos esperados
          const expectedMilestones = ["Kick off", "Diseño", "Construcción", "Pruebas TQ", "Go live", "Paso AM", "Server post/prod"];

          expectedMilestones.forEach((hito, index) => {
            let sPath = `/milestones/${index}`;
            if (milestoneMap[hito]) {
              oPlanningModel.setProperty(sPath + "/fechaInicio", milestoneMap[hito].fechaInicio);
              oPlanningModel.setProperty(sPath + "/fechaFin", milestoneMap[hito].fechaFin);
            } else {
              // Si no hay datos para ese hito, dejamos los valores como null o vacíos
              oPlanningModel.setProperty(sPath + "/fechaInicio", null);
              oPlanningModel.setProperty(sPath + "/fechaFin", null);
            }
          });

          this._idPlani = oData.value[0].ID; // Tomamos el primer ID recuperado
          this.updateVizFrame1(oData);

          //    console.log("ID de planificación recuperado:", this._idPlani);

        } catch (error) {
          console.error("Error al obtener los datos de planificación:", error);
          ///      sap.m.MessageToast.show("Error al cargar los datos de planificación.");
        }
      },





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
          var oTable = this.byId("table2");
          var aItems = oTable.getItems();

          //  Guardamos todos los IDs aquí
          this._proveedoresIDs = [];

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((proveedorData, index) => {
              var oItem = aItems[index];
              if (oItem) {
                var aCells = oItem.getCells();
                if (aCells.length > 1) {
                  aCells[0].setValue(proveedorData.valueCondi || "");
                  aCells[1].setValue(proveedorData.valueProvee || "");
                }

                // Guardar el ID en la lista global
                this._proveedoresIDs[index] = proveedorData.ID;
              }
            });

            // Guardar checkboxes generales
            this.byId("box_condi").setSelected(oData.value[0].checkCondi || false);
            this.byId("box_prove").setSelected(oData.value[0].checkProveedor || false);

            //    //console.log("IDs cargados:", this._proveedoresIDs);

          } else {
            //console.log("No hay datos de proveedores disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de proveedor:", error);
          //    sap.m.MessageToast.show("Error al cargar los datos de proveedor");
        }
      },


      leerFacturacion: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/Facturacion?$filter=datosProyect_ID eq ${projectID}`;

        try {
          // Realizar la petición al servidor
          const response = await fetch(sUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          // Verificar si la respuesta fue exitosa
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Network response was not ok: ' + errorText);
          }

          // Parsear la respuesta JSON
          const oData = await response.json();
          //  console.log("Datos de Facturación:", oData);  // Verificar la estructura de la respuesta

          // Obtener la tabla
          var oTable = this.byId("table0");
          var aItems = oTable.getItems();

          // Verificar si hay datos en la respuesta
          if (oData.value && oData.value.length > 0) {
            // Recorrer los datos de facturación
            oData.value.forEach(function (Facturacion, index) {

              var oItem = aItems[index];  // Usar el índice en lugar de i
              var aCells = oItem.getCells();

              // Verificar si hay una fila disponible para actualizar
              if (aItems[index]) {
                var aCells = aItems[index].getCells();

                // Asegúrate de que el índice es correcto para cada input
                if (aCells.length > 1) {
                  // Actualizar DatePicker (asumiendo que la fecha está en la primera celda)
                  if (aCells[0] instanceof sap.m.DatePicker) {
                    //console.log("Tipo de celda:", aCells[0].constructor.name); // Verifica el tipo de celda
                    // Si hay fecha estimada, se asigna al DatePicker
                    aCells[0].setDateValue(Facturacion.fechaEstimida ? new Date(Facturacion.fechaEstimida) : null);
                  }

                  // Actualizar Input para descripción del hito
                  if (aCells[1] instanceof sap.m.Input) {
                    aCells[1].setValue(Facturacion.descripcionHito || ""); // Si no hay valor, asigna un string vacío
                  }

                  // Actualizar Input para la facturación
                  if (aCells[2] instanceof sap.m.Input) {
                    aCells[2].setValue(Math.round(Facturacion.facturacion));

                  }
                }
              }
            });

            // Guardar solo el ID de facturación en lugar de todo el objeto
            if (oData.value[0] && oData.value[0].ID) {
              this._FacturacionID = oData.value[0].ID;  // Almacena el ID
            }

            this.metodoSumarFac();

          } else {
            //     console.log("No hay datos de Facturación disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de Facturación:", error);
          //     sap.m.MessageToast.show("Error al cargar los datos de Facturación");
        }
      },



      leerClientFactura: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ClientFactura?$filter=datosProyect_ID eq ${projectID}&$orderby=ID asc`;
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
          var oTable = this.byId("table_clienteFac");
          var aItems = oTable.getItems();

          if (oData.value && oData.value.length > 0) {
            let facturasOrdenadas = oData.value.sort((a, b) => a.ID - b.ID);

            for (let i = 0; i < facturasOrdenadas.length; i++) {
              let Facturacion = facturasOrdenadas[i];

              // Si hay menos filas en la tabla, agregar nuevas filas
              if (i >= aItems.length) {
                let newRow = new sap.m.ColumnListItem({
                  cells: [
                    new sap.m.Input({ value: Facturacion.juridica || "" }),
                    new sap.m.Input({ value: Facturacion.oferta ? `${Facturacion.oferta}%` : "" }) // Agregar el %
                  ]
                });
                oTable.addItem(newRow);
                aItems.push(newRow);
              }

              var oItem = aItems[i];
              var aCells = oItem.getCells();

              if (aCells[0].getMetadata().getName() === "sap.m.Input") {
                aCells[0].setValue(Facturacion.juridica || "");
              } else if (aCells[0].getMetadata().getName() === "sap.m.Text") {
                aCells[0].setText(Facturacion.juridica || "");
              }

              if (aCells[1].getMetadata().getName() === "sap.m.Input") {
                let ofertaVal = Facturacion.oferta ? Facturacion.oferta.toString() : "";
                // Quitar % si existe (por si acaso)
                ofertaVal = ofertaVal.replace('%', '');
                // Luego añadir % solo una vez
                aCells[1].setValue(ofertaVal ? `${ofertaVal}%` : "");
              } else if (aCells[1].getMetadata().getName() === "sap.m.Text") {
                aCells[1].setText(Facturacion.oferta ? `${Facturacion.oferta}%` : ""); // Agregar el %
              }
            }
          }

          this.metodoSumar();

          var oCheckBox = this.byId("box_multiJuridica");
          var bSelected = oCheckBox.getSelected();
          this.onCheckBoxSelectMulti({
            getSource: () => oCheckBox,
            getSelected: () => bSelected
          });

        } catch (error) {
          console.error("Error al obtener los datos de cliente Facturación:", error);
          //      sap.m.MessageToast.show("Error al cargar los datos de cliente Facturación");
        }
      },




      leerWorkflowInstancias: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/WorkflowInstancias?$filter=datosProyect_ID eq ${projectID}`;

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
          //  console.log("Datos de WorkflowInstancias:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idWorkflowInstancias = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso

            var idWorkIniciado = Recurso.workflowId;

            this._idWorkIniciado = idWorkIniciado;

            //     this.byId("inputReInter").setValue(Recurso.totalJorRI ? parseFloat(Recurso.totalJorRI).toFixed(2) : "0.00");



            this._idWorkflowInstancias = idWorkflowInstancias;

            //     console.log("idWorkflowInstancias ID " + this._idWorkflowInstancias + "--> " + this._idWorkIniciado);

          } else {
            //        console.log("NO SE ENCONTRARON DATOS WorkflowInstancias");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //  sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },

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

          var oTable = this.byId("table_dimicFecha");
          var aItems = oTable.getItems();

          // Guardamos los IDs de recursos en un array para tener uno por fila
          this._recursosIDs = [];

          if (oData.value && oData.value.length > 0) {
            // Recorrer todos los recursos que llegan
            oData.value.forEach((Recurso, index) => {
              this._recursosIDs[index] = Recurso.ID; // Guardar ID por posición

              if (index < aItems.length) {
                var oItem = aItems[index];

                var aCells = oItem.getCells();

                aCells[0].setSelectedKey(Recurso.Vertical_ID || "");

                this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                aCells[1].setSelectedKey(Recurso.tipoServicio_ID || "");
                this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                this.filterPerfilServiDinamicas(Recurso.PerfilServicio_ID, aCells[2]);
                aCells[3].setValue(Recurso.ConceptoOferta || "");
                aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00");
                aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00");
                aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00");
                aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00");
                aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00");
                aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00");
                aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00");
                aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                aCells[12].setText(Recurso.totalE ? parseFloat(Recurso.totalE).toFixed(2) : "0.00");
              }
            });
          }


          await this.fechasDinamicas();
          await this.leerFechas();


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },




      leerPerfilJornadas: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/PerfilTotal?$filter=datosProyect_ID eq ${projectID}`;

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
          //  console.log("Datos de DATOS RECURSOS TRAIDO:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idJornadas = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso


            this.byId("inputReInter").setValue(Recurso.totalJorRI ? parseFloat(Recurso.totalJorRI).toFixed(2) : "0.00");
            this.byId("inputConsuEx").setValue(Recurso.totalJorCE ? parseFloat(Recurso.totalJorCE).toFixed(2) : "0.00");
            this.byId("inputRcurExtern").setValue(Recurso.totalJorRE ? parseFloat(Recurso.totalJorRE).toFixed(2) : "0.00");
            this.byId("inputTotalJor").setValue(Recurso.Total ? parseFloat(Recurso.Total).toFixed(2) : "0.00");


            this._idJornadas = idJornadas;

            //      console.log("JORNADAS ID " + this._idJornadas);

          } else {
            //console.log("NO SE ENCONTRARON DATOS PARA PERFIL JORNADAS");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },



      leerTotalRecursoInterno: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/RecurInterTotal?$filter=datosProyect_ID eq ${projectID}`;

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
          //       console.log("Datos de DATOS TOTAL RECURSOS  TRAIDO:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idTotalRecInter = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso


            this.byId("inputServi1").setValue(Recurso.servicios ? parseFloat(Recurso.servicios).toFixed(2) : "0.00");
            this.byId("inputOtrosServi1").setValue(Recurso.OtrosServicios ? parseFloat(Recurso.OtrosServicios).toFixed(2) : "0.00");
            this.byId("inputGastoVia1").setValue(Recurso.GastosdeViaje ? parseFloat(Recurso.GastosdeViaje).toFixed(2) : "0.00");
            this.byId("totalRecuInter").setValue(Recurso.Total ? parseFloat(Recurso.Total).toFixed(2) : "0.00");




            this._idTotalRecInter = idTotalRecInter;

            //    console.log("JORNADAS ID " + this._idTotalRecInter);

          } else {
            //    console.log("NO SE ENCONTRARON DATOS PARA PERFIL JORNADAS");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },






      leerTotalConsumoExter: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ConsuExterTotal?$filter=datosProyect_ID eq ${projectID}`;

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
          //   console.log("Datos de DATOS TOTAL total Consumo Externo  TRAIDO:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idTotalConsuEx = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso



            this.byId("inputServi2").setValue(Recurso.servicios ? parseFloat(Recurso.servicios).toFixed(2) : "0.00");
            this.byId("inputOtroSer2").setValue(Recurso.OtrosServicios ? parseFloat(Recurso.OtrosServicios).toFixed(2) : "0.00");
            this.byId("inptGastoVi2").setValue(Recurso.GastosdeViaje ? parseFloat(Recurso.GastosdeViaje).toFixed(2) : "0.00");
            this.byId("totalConsuExternot").setValue(Recurso.Total ? parseFloat(Recurso.Total).toFixed(2) : "0.00");



            this._idTotalConsuEx = idTotalConsuEx;

            //  console.log("JORNADAS ID " + this._idTotalConsuEx);

          } else {
            // console.log("NO SE ENCONTRARON DATOS PARA PERFIL JORNADAS");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //     //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },



      leerTotalRecuExterTotal: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/RecuExterTotal?$filter=datosProyect_ID eq ${projectID}`;

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
          //console.log("Datos de DATOS TOTAL   Recurso Externo   TRAIDO:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idtotalRecurExter = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso


            this.byId("inputServi").setValue(Recurso.servicios ? parseFloat(Recurso.servicios).toFixed(2) : "0.00");
            this.byId("input10_1724757017406").setValue(Recurso.OtrosServicios ? parseFloat(Recurso.OtrosServicios).toFixed(2) : "0.00");
            this.byId("input9_1724757015442").setValue(Recurso.GastosdeViaje ? parseFloat(Recurso.GastosdeViaje).toFixed(2) : "0.00");
            this.byId("totaRecurExterno").setValue(Recurso.Total ? parseFloat(Recurso.Total).toFixed(2) : "0.00");




            this._idtotalRecurExter = idtotalRecurExter;

            //     console.log("JORNADAS ID " + this._idtotalRecurExter);

          } else {
            //        console.log("NO SE ENCONTRARON DATOS PARA PERFIL JORNADAS");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          ////sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },




      leerTotalInfraestrLicencia: async function (projectID) {

        var sUrl = `/odata/v4/datos-cdo/InfraestrLicencia?$filter=datosProyect_ID eq ${projectID}`;

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

          // console.log("Llamando a URL:", sUrl);
          // console.log("Project ID recibido:", projectID);




          const oData = await response.json();
          /*console.log("Datos de DATOS TOTAL   InfraestrLicencia   TRAIDO:", oData);
          console.log("Respuesta completa:", oData);

          console.log("Cantidad de registros recibidos:", oData.value.length);*/

          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idTotalInfrLicen = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso


            this.byId("totalInfraestruc").setValue(Recurso.totalInfraestruc ? parseFloat(Recurso.totalInfraestruc).toFixed(2) : "0.00");
            this.byId("input0_1724758359").setValue(Recurso.totalLicencia ? parseFloat(Recurso.totalLicencia).toFixed(2) : "0.00");




            this._idInfraLicencia = idTotalInfrLicen;

            //    console.log("JORNADAS ID " + this._idInfraLicencia);

          } else {
            // console.log("NO SE ENCONTRARON DATOS PARA InfraestrLicencia");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          ////sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },




      leerTotalResumenCostesTotal: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ResumenCostesTotal?$filter=datosProyect_ID eq ${projectID}`;

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
          //  console.log("Datos de DATOS TOTAL   coste total   TRAIDO:", oData);


          // Verificar si hay datos en oData.value
          if (oData.value && oData.value.length > 0) {
            var Recurso = oData.value[0]; // Toma solo el primer recurso
            var idResumenCoste = Recurso.ID; // Obtén el ID del recurso
            ///  console.log("ID del recurso:", recursoID); // Imprime el ID del recurso


            this.byId("totalSubtotal").setValue(Recurso.Subtotal ? parseFloat(Recurso.Subtotal).toFixed(2) : "0.00");
            this.byId("input2_172475612").setValue(Recurso.CosteEstruPorce ? parseFloat(Recurso.CosteEstruPorce).toFixed(2) : "0.00");
            this.byId("input2_1724756105").setValue(Recurso.Costeestructura ? parseFloat(Recurso.Costeestructura).toFixed(2) : "0.00");
            this.byId("input2_17221205").setValue(Recurso.totalLicencias ? parseFloat(Recurso.totalLicencias).toFixed(2) : "0.00");
            this.byId("input2_1756121205").setValue(Recurso.Margeingresos ? parseFloat(Recurso.Margeingresos).toFixed(2) : "0.00");




            this._ResumenTotal = idResumenCoste;

            //            console.log("JORNADAS ID " + this._ResumenTotal);


            this.onColumnTotales();


          } else {
            // console.log("NO SE ENCONTRARON DATOS PARA _ResumenTotal");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          ////sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },



      /// >>>>>>> LEER FECHAS  RECURSO  INTERNO  <<<<<<<<<<+



      leerFechas: async function () {
        const recursos = this._recursosIDs;

        //  console.log("🔎 IDs recibidos para consultar:", recursos);


        const valoresPorFecha = {};
        const idPorFecha = {};

        // Creamos un array de promesas fetch para cada recursoID
        const promesas = recursos.map(async (recursoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuReInter?$filter=RecursosInternos_ID eq '${recursoID}'`;

          //   console.log(`  Consultando URL para recursoID: ${recursoID}`);

          try {
            const response = await fetch(sUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
            const data = await response.json();


            // Verificamos si hay resultados o no
            if (data.value && data.value.length > 0) {
              //      console.log(`    Resultado para recursoID ${recursoID}:`, data.value);
            } else {
              console.warn(`    Sin resultados para recursoID ${recursoID}`);
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno; // Formato: "2024-Enero"
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;  // Guardamos el ID para ese mesAno



            });
            this._IdFechasPorMes = idPorFecha;


            //   console.log("FECHAS TRAIDAS "  +  JSON.stringify(this._IdFechasPorMes));
            //   console.log("VALORES POR FECHAS " + JSON.stringify(valoresPorFecha));



            this.rellenarInputsConFechas("table_dimicFecha", index, valoresPorFecha);

            return { recursoID, data: data.value || [] };
          } catch (error) {
            console.error(`    Error en consulta para recursoID ${recursoID}:`, error);
            return { recursoID, error };
          }
        });

        // Esperamos todas las promesas y tenemos los resultados
        const resultados = await Promise.all(promesas);

        //  console.log("  Resultados completos:", resultados);
      },

      /*    leerFechas: async function () {
            const recursos = this._recursosIDs;
    
          //  console.log("🔎 IDs recibidos para consultar:", recursos);
    
            const idPorFecha = this._IdFechasPorMes || {}; // Inicializa acumulador
            const valoresPorFecha = {};
    
            // Creamos un array de promesas fetch para cada recursoID
            const promesas = recursos.map(async (recursoID, index) => {
              const sUrl = `/odata/v4/datos-cdo/ValorMensuReInter?$filter=RecursosInternos_ID eq '${recursoID}'`;
    
           //   console.log(`  Consultando URL para recursoID: ${recursoID}`);
    
              try {
                const response = await fetch(sUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
                const data = await response.json();
    
    
                // Verificamos si hay resultados o no
                if (data.value && data.value.length > 0) {
            //      console.log(`    Resultado para recursoID ${recursoID}:`, data.value);
                } else {
                  console.warn(`    Sin resultados para recursoID ${recursoID}`);
                }
    
                const valoresPorFecha = {};
                data.value.forEach(item => {
                  const key = item.mesAno; // Formato: "2024-Enero"
                  valoresPorFecha[key] = item.valor;
                  idPorFecha[key] = item.ID;  // Guardamos el ID para ese mesAno
                });
      
    
                console.log("IdSSS de las fechas " + JSON.stringify(this._IdFechasPorMes));
    
             //   console.log("VALORES POR FECHAS " + JSON.stringify(valoresPorFecha));
    
    
    
                this.rellenarInputsConFechas("table_dimicFecha", index, valoresPorFecha);
    
                return { recursoID, data: data.value || [] };
              } catch (error) {
                console.error(`    Error en consulta para recursoID ${recursoID}:`, error);
                return { recursoID, error };
              }
            });
    
            // Esperamos todas las promesas y tenemos los resultados
            const resultados = await Promise.all(promesas);
    
            this._IdFechasPorMes = idPorFecha; 
    
    
            console.log("FECHAS TRAIDAS "  + this._IdFechasPorMes);
    
          //  console.log("  Resultados completos:", resultados);
          },*/




      rellenarInputsConFechas: function (tableId, rowIndex, valoresPorFecha) {
        //  console.log(`Intentando rellenar inputs para tabla: ${tableId}, fila: ${rowIndex}`);

        const inputsFila = this._inputsDinamicos?.[tableId]?.[rowIndex];
        if (!inputsFila) {
          console.warn(`No existen inputs dinámicos para tabla ${tableId} fila ${rowIndex}`);
          return;
        }

        for (const [mesAno, valor] of Object.entries(valoresPorFecha)) {
          const oInput = inputsFila[mesAno];
          if (oInput) {
            const valorFormateado = Number(valor).toFixed(2);
            //  console.log(`Seteando valor ${valorFormateado} en input de fecha ${mesAno}`);
            oInput.setValue(valorFormateado);
            oInput.fireChange({ value: valorFormateado });
          } else {
            console.warn(`No se encontró input para la fecha ${mesAno} en tabla ${tableId}, fila ${rowIndex}`);
          }
        }
      },



      leerFechasServiRecInter: async function () {
        const servicios = this._idServiInterno;

        //  console.log("🔎 IDs de servicios internos para consultar:", servicios);

        const valoresPorFecha = {};
        const idPorFecha = {};

        const promesas = servicios.map(async (servicioID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuServReInter?$filter=otrosGastoRecu_ID eq '${servicioID}'`;

          // console.log(`  Consultando URL para servicioID: ${servicioID}`);

          try {
            const response = await fetch(sUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (data.value && data.value.length > 0) {
              //    console.log(`    Resultado para servicioID ${servicioID}:`, data.value);
            } else {
              console.warn(`    Sin resultados para servicioID ${servicioID}`);
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno; // Ejemplo: "2024-Enero"
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;  // Guardamos el ID para ese mesAno
            });

            this._IdFechasPorMesServInt = idPorFecha;

            //  console.log("VALORES POR FECHAS " + JSON.stringify(valoresPorFecha));

            this.rellenarInputsConFechas("tableServicioInterno", index, valoresPorFecha);

            return { servicioID, data: data.value || [] };
          } catch (error) {
            console.error(`    Error en consulta para servicioID ${servicioID}:`, error);
            return { servicioID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //console.log("  Resultados completos:", resultados);
      },




      leerFechasGastoViajeRecInter: async function () {
        const recursos = this._IdGastoViajInter

        //  console.log("🔎 ID de gasto de viaje interno para consultar:", recursos);

        const valoresPorFecha = {};
        const idPorFecha = {};

        // Si solo es un ID (no un array), lo transformamos a array para mantener la estructura como en leerFechas
        const recursosArray = Array.isArray(recursos) ? recursos : [recursos];

        const promesas = recursosArray.map(async (recursoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuGastViaReInter?$filter=otrosRecursos_ID eq '${recursoID}'`;

          //  console.log(`  Consultando URL para recursoID: ${recursoID}`);

          try {
            const response = await fetch(sUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (data.value && data.value.length > 0) {
              //       console.log(`    Resultado para recursoID ${recursoID}:`, data.value);
            } else {
              console.warn(`    Sin resultados para recursoID ${recursoID}`);
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesGVinter = idPorFecha;
            this._idGastInterno = data.value[0]?.ID || null;

            //    console.log("VALORES POR FECHAS " + JSON.stringify(valoresPorFecha));

            this.rellenarInputsConFechas("tablGastoViajeInterno", index, valoresPorFecha);

            return { recursoID, data: data.value || [] };
          } catch (error) {
            console.error(`    Error en consulta para recursoID ${recursoID}:`, error);
            return { recursoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //    console.log("  Resultados completos:", resultados);
      },

      //---------------------------------------------------------------------------------




      // -------------- LEER FECHAS CONSUMO EXTERNO -----------------------


      leerFechasConsumoExterno: async function () {
        const consumos = this._consumoExternosIDs;

        // console.log("🔎 IDs de Consumo Externo para consultar:", consumos);

        const valoresPorFecha = {};
        const idPorFecha = {};

        const promesas = consumos.map(async (consumoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuConsuEx?$filter=ConsumoExternos_ID eq '${consumoID}'`;

          //   console.log(`  Consultando URL para consumoID: ${consumoID}`);

          try {
            const response = await fetch(sUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();

            if (data.value && data.value.length > 0) {
              //   console.log(`    Resultado para consumoID ${consumoID}:`, data.value);
            } else {
              console.warn(`    Sin resultados para consumoID ${consumoID}`);
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesConsuEx = idPorFecha;

            // console.log("VALORES POR FECHAS CONSUMO EXTERNO:", JSON.stringify(valoresPorFecha));

            this.rellenarInputsConFechas("tablaConsuExter", index, valoresPorFecha);

            return { consumoID, data: data.value || [] };
          } catch (error) {
            console.error(`    Error en consulta para consumoID ${consumoID}:`, error);
            return { consumoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //    console.log("  Resultados completos consumo externo:", resultados);
      },






      leerFechasServConsumoExterno: async function () {
        const otrosServiciosIDs = this._idConsuOtrser; // Debe ser un array

        // console.log("🔎 IDs de Servicios de Consumo Externo para consultar:", otrosServiciosIDs);

        const valoresPorFecha = {};
        const idPorFecha = {};

        const promesas = otrosServiciosIDs.map(async (servicioID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuServConsuEx?$filter=otrosServiciosConsu_ID eq '${servicioID}'`;

          console.log(`  Consultando URL para servicioID: ${servicioID}`);

          try {
            const response = await fetch(sUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error('    Error al consultar el servicio: ' + errorText);
            }

            const data = await response.json();

            if (data.value && data.value.length > 0) {
              //    console.log(`    Resultado para servicioID ${servicioID}:`, data.value);
            } else {
              console.warn(`    Sin resultados para servicioID ${servicioID}`);
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno; // Formato: "2024-Enero"
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesServiConsu = idPorFecha;

            // console.log("  Valores por fecha para servicio consumo externo:", JSON.stringify(valoresPorFecha));

            this.rellenarInputsConFechas("idOtroserConsu", index, valoresPorFecha);

            return { servicioID, data: data.value || [] };
          } catch (error) {
            console.error(`    Error en consulta para servicioID ${servicioID}:`, error);
            return { servicioID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        // console.log("  Resultados completos de servicios consumo externo:", resultados);
      },





      leerFechasGastoConsumoExterno: async function () {
        const gastosIDs = this._idGastoViajeCOnsu; // Asegúrate de que sea un array

        //console.log("🔎 IDs de Gasto de Viaje Consumo Externo a consultar:", gastosIDs);

        const valoresPorFecha = {};
        const idPorFecha = {};

        const promesas = gastosIDs.map(async (gastoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuGastoViaConsuEx?$filter=GastoViajeConsumo_ID eq '${gastoID}'`;

          console.log(`  Consultando URL para gastoID: ${gastoID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const data = await response.json();
            //    console.log("    Respuesta JSON completa:", data);

            if (!data.value || data.value.length === 0) {
              console.warn(`    Sin datos encontrados para gastoID: ${gastoID}`);
              return { gastoID, data: [] };
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno; // Ejemplo: "2024-Enero"
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesGasViaConsuEx = idPorFecha;

            //console.log("  Valores por fecha para gastoID:", gastoID, valoresPorFecha);

            this.rellenarInputsConFechas("idGastoViajeConsu", index, valoresPorFecha);

            return { gastoID, data: data.value };
          } catch (error) {
            console.error(`    Error al consultar gastoID ${gastoID}:`, error);
            return { gastoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //   console.log("  Resultados completos de Gasto Consumo Externo:", resultados);
      },



      //---------------------------------------------------------------------------






      leerFechasRecursoExterno: async function () {
        const recursosExternosIDs = this._RecursoExterno; // Debe ser un array de IDs

        //  console.log("🔎 IDs de Recursos Externos a consultar:", recursosExternosIDs);

        const idPorFecha = {};

        const promesas = recursosExternosIDs.map(async (recursoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuRecuExter?$filter=RecursosExternos_ID eq ${recursoID}`;

          //   console.log(`  Consultando URL para recursoID: ${recursoID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const data = await response.json();
            //    console.log("    Respuesta JSON completa:", data);

            if (!data.value || data.value.length === 0) {
              console.warn(`    Sin datos encontrados para recurso externo ID: ${recursoID}`);
              return { recursoID, data: [] };
            }

            const valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno; // Ejemplo: "2024-Enero"
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            // Guardar IDs por fecha si se requiere luego
            this._IdFechasPorMesREExt = idPorFecha;

            //  console.log("  Valores por fecha para recurso externo ID:", recursoID, valoresPorFecha);

            this.rellenarInputsConFechas("tablaRecExterno", index, valoresPorFecha);

            return { recursoID, data: data.value };
          } catch (error) {
            console.error(`    Error al consultar recurso externo ID ${recursoID}:`, error);
            return { recursoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //  console.log("  Resultados completos de Recursos Externos:", resultados);
      },




      leerFechasServRecursoExterno: async function () {
        const serviciosExternosIDs = this._idOtroSerEx; // Asegúrate que sea un array
        //    console.log("    IDs de Servicios Recurso Externo a consultar:", serviciosExternosIDs);

        const idPorFecha = {};

        const promesas = serviciosExternosIDs.map(async (servID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuSerExter?$filter=ServiRecurExterno_ID eq ${servID}`;
          console.log(`  URL consultada para ServiRecurExterno_ID: ${servID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const data = await response.json();
            //            console.log("    Respuesta JSON completa:", data);

            if (!data.value || data.value.length === 0) {
              console.warn(`    No hay datos de ValorMensuSerExter para el ID: ${servID}`);
              return { servID, data: [] };
            }

            let valoresPorFecha = {};
            data.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesSerReEx = idPorFecha; // Si necesitas los IDs luego

            //console.log("  Valores por fecha para servicio externo:", servID, valoresPorFecha);

            this.rellenarInputsConFechas("idServiExterno", index, valoresPorFecha);

            return { servID, data: data.value };
          } catch (error) {
            console.error(`    Error al consultar ServiRecurExterno_ID ${servID}:`, error);
            return { servID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //    console.log("  Resultados completos de Servicios Recurso Externo:", resultados);
      },





      leerFechasGastoRecursoExterno: async function () {
        const gastosExternosIDs = this._idGasViaReEx; // Asegúrate que sea un array
        //    console.log("    IDs de Gastos de Viaje Recurso Externo a consultar:", gastosExternosIDs);

        const idPorFecha = {};

        const promesas = gastosExternosIDs.map(async (gastoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuGastoViExter?$filter=GastoViajeRecExter_ID eq ${gastoID}`;
          console.log(`  URL consultada para GastoViajeRecExter_ID: ${gastoID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const oData = await response.json();
            //    console.log("    Respuesta JSON completa:", oData);

            if (!oData.value || oData.value.length === 0) {
              console.warn(`    No hay datos de ValorMensuGastoViExter para el ID: ${gastoID}`);
              return { gastoID, data: [] };
            }

            let valoresPorFecha = {};
            oData.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesReEx = idPorFecha;

            //console.log("  Valores por fecha para gasto externo:", gastoID, valoresPorFecha);

            this.rellenarInputsConFechas("idGastoRecuExter", index, valoresPorFecha);

            return { gastoID, data: oData.value };
          } catch (error) {
            console.error(`    Error al consultar GastoViajeRecExter_ID ${gastoID}:`, error);
            return { gastoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //   console.log("  Resultados completos de Gastos Recurso Externo:", resultados);
      },




      //--------------------------------------------------------------------------------




      leerGastoviajeInterno: async function (sProjectID) {
        var sUrl = `/odata/v4/datos-cdo/otrosRecursos?$filter=datosProyect_ID eq ${sProjectID}`;
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
          // console.log("Datos de DATOS GASTO VIAJE INTERNO TRAIDO: -----> ", oData);

          var oTable = this.byId("tablGastoViajeInterno");
          var aItems = oTable.getItems();

          this._IdGastoViajInter = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._IdGastoViajInter[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)
                  aCells[12].setText(Recurso.totalE ? parseFloat(Recurso.totalE).toFixed(2) : "0.00"); // Para el Input (Cantidad)


                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:


            await this.leerFechasGastoViajeRecInter();


          } else {
            // console.log("No hay datos de recursos internos disponibles.");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },




      //  leer servicio  interno 
      leerSerivioInterno: async function (sProjectID) {

        var sUrl = `/odata/v4/datos-cdo/otrosGastoRecu?$filter=datosProyect_ID eq ${sProjectID}`;
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
          //    console.log("Datos de DATOS Servicio interno : -----> ", oData);

          var oTable = this.byId("tableServicioInterno");
          var aItems = oTable.getItems();

          this._idServiInterno = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idServiInterno[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)
                  aCells[12].setText(Recurso.totalE ? parseFloat(Recurso.totalE).toFixed(2) : "0.00"); // Para el Input (Cantidad)

                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:
            //   this.fechasDinamicas();

            await this.leerFechasServiRecInter();

          } else {
            // console.log("No hay datos de recursos internos disponibles.");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }


      },




      //------ LEER CONSUMO EXTERNO ---------

      leerConsumoExterno: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/ConsumoExternos?$filter=datosProyect_ID eq ${projectID}`;

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

          // console.log("DATOS PARA CONSUMO exteRNOS  " + JSON.stringify(oData));

          var oTable = this.byId("tablaConsuExter");
          var aItems = oTable.getItems();

          // Limpio array para IDs si usas
          this._consumoExternosIDs = [];

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._consumoExternosIDs[index] = Recurso.ID; // Guardar ID por posición

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();


                //console.log("Número de filas visibles en la tabla: ", aItems.length);



                if (aCells.length > 1) {


                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || "");
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  //   console.log("RECURSO PERFOL " + Recurso.tipoServicio_ID);
                  aCells[2].setSelectedKey(Recurso.PerfilConsumo_ID || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || "");
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00");
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00");
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00");
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00");
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00");
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00");
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00");
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.totalC).toFixed(2) : "0.00");
                }
              }
            });

            // Si quieres llamar a leerFechasConsumoExterno para el primero, por ejemplo:

            //     this.fechasDinamicas();
            for (let i = 0; i < this._consumoExternosIDs.length; i++) {
              const ConsumoRecuID = this._consumoExternosIDs[i];
              await this.leerFechasConsumoExterno(ConsumoRecuID);
            }



          } else {
            //   console.log("No hay datos de Consumo Externo disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de Consumo Externo:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Consumo Externo");
        }
      },



      leerConsuOtroServi: async function (sProjectID) {
        var sUrl = `/odata/v4/datos-cdo/otrosServiciosConsu?$filter=datosProyect_ID eq ${sProjectID}`;

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
          //   console.log("Datos de DATOS otrosServiciosConsu TRAIDO:", oData);

          var oTable = this.byId("idOtroserConsu");
          var aItems = oTable.getItems();

          this._idConsuOtrser = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idConsuOtrser[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  //  aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)
                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:

            //     this.fechasDinamicas();
            for (let id of this._idConsuOtrser) {
              await this.leerFechasServConsumoExterno(id);

            }
          } else {
            //   console.log("No hay datos de recursos internos disponibles.");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },

      leerGastoViajeConsu: async function (sProjectID) {
        var sUrl = `/odata/v4/datos-cdo/GastoViajeConsumo?$filter=datosProyect_ID eq ${sProjectID}`;

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
          // console.log("Datos de DATOS idGastoViajeConsu TRAIDO:", oData);

          var oTable = this.byId("idGastoViajeConsu");
          var aItems = oTable.getItems();

          this._idGastoViajeCOnsu = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idGastoViajeCOnsu[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);

                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  //      aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)

                }
              }
            });

            this.leerFechasGastoConsumoExterno();


          } else {
            //  console.log("No hay datos de recursos internos disponibles.");
          }


        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }

      },
      //----------------------------------------------------------




      //------------------- Leer RECURSO EXTERNO --------------------

      leerRecursoExterno: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/RecursosExternos?$filter=datosProyect_ID eq ${projectID}`;
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
          this._RecursoExterno = []; // Asegurarte de inicializar el array

          const oData = await response.json();
          //   console.log("Datos traidos RecursosExternos TRAIDO:", oData);

          var oTable = this.byId("tablaRecExterno");
          var aItems = oTable.getItems();

          //    this._recursosIDs = []; // Reiniciar array para guardar los IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._RecursoExterno[index] = Recurso.ID; // Guardar ID por posición

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  aCells[2].setValue(Recurso.PerfilServicio || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setValue(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00");
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00");
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00");
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00");
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00");
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00");
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00");
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.totalC).toFixed(2) : "0.00");
                }
              }
            });

            // Por ejemplo, si quieres usar el ID del primer recurso para llamar otra función:

            // this.fechasDinamicas();
            var primerRecursoID = oData.value[0].ID;
            await this.leerFechasRecursoExterno(primerRecursoID);

          } else {
            // console.log("No hay datos de recursos externos disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de Recursos Externos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Externos");
        }
      },








      leerOtrosServiExter: async function (sProjectID) {

        var sUrl = `/odata/v4/datos-cdo/serviRecurExter?$filter=datosProyect_ID eq ${sProjectID}`;
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

          var oTable = this.byId("idServiExterno");
          var aItems = oTable.getItems();

          this._idOtroSerEx = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idOtroSerEx[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {
                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);
                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  //      aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)

                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:

            await this.leerFechasServRecursoExterno();

          } else {
            //     console.log("No hay datos de servi Externos disponibles.");
          }

        } catch (error) {
          console.error("Error al obtener los datos de serviRecurExter:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de serviRecurExter");
        }
      },






      leerGastoViaExter: async function (sProjectID) {
        var sUrl = `/odata/v4/datos-cdo/GastoViajeRecExter?$filter=datosProyect_ID eq ${sProjectID}`;
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
          //  console.log("Datos traidos GastoViajeRecExter TRAIDO:", oData);

          var oTable = this.byId("idGastoRecuExter");
          var aItems = oTable.getItems();

          this._idGasViaReEx = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idGasViaReEx[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {

                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);

                  aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  this.filterTipoServicioDinamicas(Recurso.tipoServicio_ID, aCells[1]);
                  //      aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[3].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[5].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[11].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[12].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)

                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:

            //     this.fechasDinamicas();
            for (let id of this._idGasViaReEx) {

              await this.leerFechasGastoRecursoExterno(id);
            }

          } else {
            //     console.log("No hay datos de servi Externos disponibles.");
          }


        } catch (error) {
          console.error("Error al obtener los datos de GastoViajeRecExter:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de GastoViajeRecExter");
        }
      },
      //-------------------------------------------------------------



      // ------------------------- Leer Otros Conceptos -----
      leerOtrosConcepto: async function (projectID) {
        var sUrl = `/odata/v4/datos-cdo/otrosConceptos?$filter=datosProyect_ID eq ${projectID}`;
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
          //   console.log("Datos traidos otrosConceptos TRAIDO:", oData);

          var oTable = this.byId("tablaInfrestuctura");
          var aItems = oTable.getItems();

          this._OtrosConceptos = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._OtrosConceptos[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {

                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);

                  //     aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  //      aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[2].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[3].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[5].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[11].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)
                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:


            //  this.fechasDinamicas();
            for (let id of this._OtrosConceptos) {
              await this.leerFechasOtrosConcetos(id);

            }
          } else {
            //    console.log("No hay datos de recursos internos disponibles.");
          }
        } catch (error) {
          console.error("Error al obtener los datos de Recursos Internos:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de Recursos Internos");
        }
      },



      leerFechasOtrosConcetos: async function () {
        const otrosConceptosIDs = this._OtrosConceptos; // Asegúrate que sea un array de IDs
        //  console.log("    IDs de Otros Conceptos a consultar:", otrosConceptosIDs);

        const idPorFecha = {};

        const promesas = otrosConceptosIDs.map(async (conceptoID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensuOtrConcep?$filter=otrosConceptos_ID eq ${conceptoID}`;
          //  console.log(`  URL consultada para otrosConceptos_ID: ${conceptoID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const oData = await response.json();
            //  console.log("    Respuesta JSON completa:", oData);

            if (!oData.value || oData.value.length === 0) {
              console.warn(`    No hay datos de ValorMensuOtrConcep para el ID: ${conceptoID}`);
              return { conceptoID, data: [] };
            }

            let valoresPorFecha = {};
            oData.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesOtConp = idPorFecha;

            //  console.log("  Valores por fecha para concepto:", conceptoID, valoresPorFecha);

            this.rellenarInputsConFechas("tablaInfrestuctura", index, valoresPorFecha);

            return { conceptoID, data: oData.value };
          } catch (error) {
            console.error(`    Error al consultar otrosConceptos_ID ${conceptoID}:`, error);
            return { conceptoID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        //console.log("  Resultados completos de Otros Conceptos:", resultados);
      },




      leerFechasLicencia: async function () {
        const licenciasIDs = this._idLicencia; // Esperamos un array de IDs
        // console.log("    IDs de Licencias a consultar:", licenciasIDs);

        const idPorFecha = {};

        const promesas = licenciasIDs.map(async (licenciaID, index) => {
          const sUrl = `/odata/v4/datos-cdo/ValorMensulicencia?$filter=licencia_ID eq ${licenciaID}`;
          console.log(`  URL consultada para licencia_ID: ${licenciaID}`);

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
              throw new Error('    Error en respuesta de red: ' + errorText);
            }

            const oData = await response.json();
            console.log("    Respuesta JSON completa:", oData);

            if (!oData.value || oData.value.length === 0) {
              console.warn(`    No hay datos de ValorMensulicencia para el ID: ${licenciaID}`);
              return { licenciaID, data: [] };
            }

            let valoresPorFecha = {};
            oData.value.forEach(item => {
              const key = item.mesAno;
              valoresPorFecha[key] = item.valor;
              idPorFecha[key] = item.ID;
            });

            this._IdFechasPorMesLicencia = idPorFecha;

            //console.log("  Valores por fecha para licencia:", licenciaID, valoresPorFecha);

            this.rellenarInputsConFechas("tablaLicencia", index, valoresPorFecha);

            return { licenciaID, data: oData.value };
          } catch (error) {
            console.error(`    Error al consultar licencia_ID ${licenciaID}:`, error);
            return { licenciaID, error };
          }
        });

        const resultados = await Promise.all(promesas);

        // console.log("  Resultados completos de Licencias:", resultados);
      },




      leerLicencias: async function (sProjectID) {

        var sUrl = `/odata/v4/datos-cdo/LicenciasCon?$filter=datosProyect_ID eq ${sProjectID}`;
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
          //  console.log("Datos traidos LicenciasCon TRAIDO:", oData);

          var oTable = this.byId("tablaLicencia");
          var aItems = oTable.getItems();

          this._idLicencia = []; // Inicializamos el array de IDs

          if (oData.value && oData.value.length > 0) {
            oData.value.forEach((Recurso, index) => {
              this._idLicencia[index] = Recurso.ID;

              if (index < aItems.length) {
                var oItem = aItems[index];
                var aCells = oItem.getCells();

                if (aCells.length > 1) {

                  aCells[0].setSelectedKey(Recurso.Vertical_ID || "");  // Para el Select (Vertical)
                  this.filterVerticaltablasDinamicas(Recurso.Vertical_ID, aCells[0]);

                  //     aCells[1].setSelectedKey(Recurso.tipoServicio_ID || ""); // Para el Select (TipoServicio)
                  //      aCells[2].setSelectedKey(Recurso.PerfilServicio_ID || "");
                  aCells[2].setValue(Recurso.ConceptoOferta || ""); // Para el Input (ConceptoOferta)
                  aCells[3].setText(Recurso.PMJ ? parseFloat(Recurso.PMJ).toFixed(2) : "0.00"); // Para el Input (ConceptoOferta)
                  aCells[4].setText(Recurso.year1 ? parseFloat(Recurso.year1).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[5].setText(Recurso.year2 ? parseFloat(Recurso.year2).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[6].setText(Recurso.year3 ? parseFloat(Recurso.year3).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[7].setText(Recurso.year4 ? parseFloat(Recurso.year4).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[8].setText(Recurso.year5 ? parseFloat(Recurso.year5).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[9].setText(Recurso.year6 ? parseFloat(Recurso.year6).toFixed(2) : "0.00"); // Para el Input (PMJ)
                  aCells[10].setText(Recurso.total ? parseFloat(Recurso.total).toFixed(2) : "0.00");
                  aCells[11].setText(Recurso.totalC ? parseFloat(Recurso.total).toFixed(2) : "0.00"); // Para el Input (Cantidad)

                }
              }
            });

            // Si quieres leer fechas por cada recurso insertado:
            // Puedes hacerlo aquí si necesitas, por ejemplo:

            //   this.fechasDinamicas();

            await this.leerFechasLicencia();


          } else {
            //   console.log("No hay datos de LicenciasCon disponibles.");
          }
        } catch (error) {
          console.error("Error al obtener los datos de LicenciasCon:", error);
          //sap.m.MessageToast.show("Error al cargar los datos de LicenciasCon");
        }

      },
      // --------------------------------------------------------------





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
          //    console.log("Los datos del modelo son inválidos o no contienen 'value'.", oData);
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
      /*  aChartData.forEach(function (oHito) {
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

        this.updateVizFrame2(oFechasModel);*/
      },
      //----------------------------------------------------------



      //------ Meotdo updateVizframe2 recoge fechas importantes y hace un grafico 


   updateVizFrame2: function(oArg) {
    var oView = this.getView();
    var oPlanning = oView.getModel("planning");

    // Intentamos tomar el modelo de fechas
    var oFechasModel = oArg instanceof sap.ui.model.json.JSONModel ? oArg : oView.getModel("fechasModel");

    var fechasData = oFechasModel ? oFechasModel.getProperty("/fechas") : null;

    // Si no hay modelo, tomamos los valores directamente de los DatePicker
    if (!fechasData) {
        fechasData = [{
            fase: "Plan",
            fechaInicioConstruccion: this.byId("text11") ? this.byId("text11").getDateValue() : null,
            fechaFinPruebasTQ: this.byId("text100052881") ? this.byId("text100052881").getDateValue() : null
        }];
    }

    var oDateFormat = sap.ui.core.format.DateFormat.getInstance({ pattern: "yyyy-MM-dd" });

    var aChartData2 = fechasData.map(function(fecha) {
        var startDate = fecha.fechaInicioConstruccion ? new Date(fecha.fechaInicioConstruccion) : null;
        var endDate = fecha.fechaFinPruebasTQ ? new Date(fecha.fechaFinPruebasTQ) : null;

        if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
            var duration = Math.round((endDate - startDate) / (1000*60*60*24));
            return {
                fase: fecha.fase || "Plan",
                fechaInicio: oDateFormat.format(startDate),
                fechaFin: oDateFormat.format(endDate),
                duracion: duration,
                label: `Inicio: ${oDateFormat.format(startDate)}, Fin: ${oDateFormat.format(endDate)}, Duración: ${duration} días`
            };
        }
        return null;
    }).filter(Boolean);

    oPlanning.setProperty("/chartModel", aChartData2);
    console.log("Modelo/Valores manuales", aChartData2);
},



onFechaManualChange: function(oEvent) {
    var oView = this.getView();
    var oPlanning = oView.getModel("planning");
    var oDateFormat = sap.ui.core.format.DateFormat.getInstance({ pattern: "yyyy-MM-dd" });

    // Usar el valor que viene en el evento
    var startVal = this.byId("text11").getValue() || oEvent.getSource().getValue();
    var endVal   = this.byId("text100052881").getValue() || oEvent.getSource().getValue();

    console.log("Valores obtenidos del DatePicker:", startVal, endVal);

    if (!startVal || !endVal) {
        console.warn("Alguna de las fechas está vacía. No se actualizará el gráfico.");
        return;
    }

    // Convertir a Date
    var startDate = new Date(startVal);
    var endDate   = new Date(endVal);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn("Fechas inválidas. No se actualizará el gráfico.");
        return;
    }

    var duration = Math.round((endDate - startDate) / (1000*60*60*24));

    // Actualizar el modelo planning
    oPlanning.setProperty("/chartModel", [{
        fase: "Plan",
        fechaInicio: oDateFormat.format(startDate),
        fechaFin: oDateFormat.format(endDate),
        duracion: duration,
        label: `Inicio: ${oDateFormat.format(startDate)}, Fin: ${oDateFormat.format(endDate)}, Duración: ${duration} días`
    }]);

    console.log("Modelo planning actualizado manualmente:", oPlanning.getProperty("/chartModel"));

    // Actualizar VizFrame
    if (this.updateVizFrame2) {
        this.updateVizFrame2();
    }
},


      /// original 
 /*     updateVizFrame2: function (oFechasModel) {
        var oView = this.getView();
        var oModel = oView.getModel("planning"); // Obtén el modelo 'planning' si es necesario

        if (!(oFechasModel instanceof sap.ui.model.json.JSONModel) || !oFechasModel.getData) {
          //  console.log("El modelo 'fechasModel' no está definido.");
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
            //   console.log("Fechas no válidas para la fase:", fechas);
            return null; // Devuelve null si las fechas no son válidas
          }
        }).filter(Boolean); // Filtra los elementos nulos

        // Asegúrate de que aChartData2 tenga la estructura adecuada
        oModel.setProperty("/chartModel", aChartData2); // Cambia esto a la propiedad que estás usando en tu modelo
        //   console.log("Datos del gráfico:", aChartData2);


      },*/
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

        //  console.log(aChartData);


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
              fase: "Plan",
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
          // console.log("Encontrada");
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
            PMJ: 1370.88


          },
          "CG4.C": {
            PMJ: 179.46


          },
          "CG4.A": {
            PMJ: 347.37

          },
          "CG4.B": {
            PMJ: 223.59
          },
          "CG3": {
            PMJ: 424.15
          },
          "CG2": {
            PMJ: 529.92
          },
          "CG1": {
            PMJ: 670.46
          }


        };

        // Lógica para actualizar datos basados en la selección del Select
        var oUpdate = oConfig[sSelectedText];

        if (oUpdate) {
          oRowData[4].setText(oUpdate.PMJ); // Ajusta según la celda específica para PMJ


          // 🔥 Asegura que _editedRows tenga el índice actualizado
          var tableId = "table_dimicFecha";
          if (!this._editedRows[tableId]) {
            this._editedRows[tableId] = new Set();
          }
          if (!this._editedRows[tableId].has(iIndex)) {
            this._editedRows[tableId].add(iIndex);
          }

          //  Llama a updateTotalField inmediatamente
          this.updateTotalField(tableId, iIndex, oUpdate.PMJ, oEvent, 4);
          /*oRowData[5].setText(oUpdate["2024"]);   // Ajusta según la celda específica para el año 2024
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
             oRowData[12].setText(total1); */ // Coloca la suma en 'Total1'



          //console.log(total1);




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
            PMJ: 216.18



          },
          "Equipo Argentina - Asistente": {
            PMJ: 190.74

          },
          "Equipo Argentina - Jefe": {
            PMJ: 296.13

          },
          "Equipo Argentina - Gerente": {
            PMJ: 478.34

          },
          "Basis - Consultor Junior": {
            PMJ: 207.19

          },
          "Basis - Consultor Senior": {
            PMJ: 356.21

          },
          "Basis - Arquitecto": {
            PMJ: 356.21

          },
          "QA - Análisis Funcional": {
            PMJ: 278.00

          },
          "QA - Jefe Proyecto": {
            PMJ: 320.00

          },
          "Testing - Análisis Funcional": {
            PMJ: 180.00

          },
          "TA - Consultor Senior 1-2": {
            PMJ: 379.17

          },
          "TA - Consultor Senior 3": {
            PMJ: 455.40

          },
        };

        // Lógica para actualizar datos basados en la selección del Select
        var oUpdate = oConfig[sSelectedText];

        if (oUpdate) {

          oRowData[4].setText(oUpdate.PMJ); // Ajusta según la celda específica para PMJ
          /* oRowData[5].setText(oUpdate["2024"]);   // Ajusta según la celda específica para el año 2024
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
           console.log(total1);*/



          var tableId = "tablaConsuExter";
          if (!this._editedRows[tableId]) {
            this._editedRows[tableId] = new Set();
          }
          if (!this._editedRows[tableId].has(iIndex)) {
            this._editedRows[tableId].add(iIndex);
          }

          // Llama a updateTotalField inmediatamente
          this.updateTotalField(tableId, iIndex, oUpdate.PMJ, oEvent, 4);
        } else {
          console.error(`No hay configuración definida para el valor seleccionado: ${sSelectedText}`);
        }

      },





      token: async function () {
        try {
          let oTokenResponse = await fetch("/odata/v4/datos-cdo", {
            method: "GET",
            headers: { "x-csrf-token": "Fetch" }
          });

          if (!oTokenResponse.ok) {
            throw new Error("Error al obtener el CSRF Token");
          }

          let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
          if (!sCsrfToken) {
            throw new Error("No se recibió un CSRF Token");
          }

          //   console.log("CSRF Token obtenido:", sCsrfToken);
          // Guardar el token en localStorage
          localStorage.setItem('csrfToken', sCsrfToken);

          this._sCsrfToken = sCsrfToken;

        } catch (error) {
          console.error("Error en la llamada al servicio:", error);
          //sap.m.MessageToast.show("Error al procesar el proyecto: " + error.message);
        }
      },


      getCsrfToken: function () {
        // Recuperar el token almacenado
        return localStorage.getItem('csrfToken');
      },

      sendRequest: async function () {
        const sCsrfToken = this.getCsrfToken();

        if (!sCsrfToken) {
          //console.log("No hay CSRF Token disponible, obteniendo uno...");
          await this.token(); // Si no hay token, obtén uno nuevo
        }

        // Realizar la solicitud con el token CSRF
        const response = await fetch("/odata/v4/datos-cdo", {
          method: "GET",
          headers: { "x-csrf-token": sCsrfToken }
        });

        // Manejo de la respuesta
        if (response.ok) {
          const result = await response.json();
          console.log(result);
        } else {
          console.error("Error en la solicitud:", response.status);
        }
      },



      /*  token: async function () {
  
          try {
  
            //  let oModel = this.getView().getModel();
  
  
  
            // Obtener el CSRF Token
            let oTokenResponse = await fetch("/odata/v4/datos-cdo", {
              method: "GET",
              headers: { "x-csrf-token": "Fetch" }
            }); if (!oTokenResponse.ok) {
              throw new Error("Error al obtener el CSRF Token");
            }
  
            let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
            if (!sCsrfToken) {
              throw new Error("No se recibió un CSRF Token");
            }
  
  
            //console.log(" CSRF Token obtenido desde el metodo :", sCsrfToken);
            this._sCsrfToken = sCsrfToken;
  
          } catch (error) {
            console.error("Error en la llamada al servicio:", error);
            //sap.m.MessageToast.show("Error al procesar el proyecto: " + error.message);
          }
  
  
  
        },
  */


      //-------------------------- METODO INSERTAR ----------------------



      onSave: async function () {

        //console.log("Entre al ONSAVE ");
        const usuarioOn = this._usuarioActual;

        let sMode = this.getView().getModel("viewModel").getProperty("/mode");


        if (!this._oBusyDialog) {
          this._oBusyDialog = new sap.m.BusyDialog({
            title: "Procesando",
            text: "Procesando su solicitud, por favor espere un momento...",
          });
        }


        // Si no está en el modelo, usa la propiedad interna
        if (!sMode) {
          sMode = this._mode || "";
        }

        // Último recurso: deduce por lógica
        if (!sMode) {
          sMode = this._sProjectID ? "edit" : "create";
        }

        //console.log("MODO FINAL USADO EN onSave:", sMode);


        let errorCount = 0;
        let errorMessages = [];

        const incompleteFields = [];

        const sProjectID = this._sProjectID; // ID del proyecto
        const scodigoProyect = parseFloat(this.byId("input0").getValue(), 10);
        const sEmail = this.byId("dddtg").getText();
        const sEmpleado = this.byId("23d3").getText();
        const sCambioEurUsd = parseFloat(this.byId("inputCambioEu").getValue());
        const snameProyect = this.byId("input1").getValue();
        const sdescripcion = this.byId("idDescripcion").getValue();
        const sTotal = parseFloat(this.byId("input0_1725625161348").getValue());
        const spluriAnual = this.byId("box_pluriAnual").getSelected();
        const sClienteFac = this.byId("id_Cfactur").getValue();
        const sMultiJuri = this.byId("box_multiJuridica").getSelected();
        const sOferta = this.byId("ofertaCheckBox").getSelected();
        const sMensual = this.byId("idCheckMensual").getSelected();
        const sClienteFunc = this.byId("int_clienteFun").getValue();
        const sObjetivoAlcance = this.byId("idObje").getValue();
        const sAsunyRestric = this.byId("idAsunyRestri").getValue();
        const sDatosExtra = this.byId("area0").getValue();
        const sFechaIni = this.byId("date_inico").getDateValue();
        const sFechaFin = this.byId("date_fin").getDateValue();
        const sIPC = this.byId("input_ipc").getValue();


        const sComentarioProvee = this.byId("idTextComProve").getValue();



        const sComentarioPVd = this.byId("idComenpVd").getValue();

        // Quitar el símbolo % y reemplazar coma por punto para poder parsear
        let numIPC = sIPC.replace("%", "").replace(",", ".");

        // Convertir a número (float)
        let ipcNumber = parseFloat(numIPC);



        const sComentarioTipCompra = this.byId("idComentarioTipo").getValue();
        const sComentarioFacturacion = this.byId("idComentariosFac").getValue();


        var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss" });

        const sFechaIniFormatted = sFechaIni ? oDateFormat.format(sFechaIni) : null;
        const sFechaFinFormatted = sFechaFin ? oDateFormat.format(sFechaFin) : null;

        const sSelectedKey = this.byId("idNatu").getSelectedKey();


        const oAreaSelect = this.byId("slct_area");
        const sSelecKeyA = oAreaSelect.getSelectedKey();
        const sSelecTextA = oAreaSelect.getSelectedItem() ? oAreaSelect.getSelectedItem().getText() : "";

        const oJefeSelect = this.byId("slct_Jefe");
        const sSelecKeyJe = oJefeSelect.getSelectedKey();
        const sSelecTextJe = oJefeSelect.getSelectedItem() ? oJefeSelect.getSelectedItem().getText() : "";


        //     console.log("JEFE SELECCIONADO " + sSelecTextJe    +  " "   + sSelecTextA);   
        const sSelecKeyTipoCompra = this.byId("select_tipoCom").getSelectedKey();
        const sSelecKeyMotivoCondi = this.byId("selectMotivo").getSelectedKey();
        const sSelectKeyIni = this.byId("slct_inic").getSelectedKey();
        const sSelectKeySegui = this.byId("selc_Segui").getSelectedKey();
        const sSelectKeyEjcu = this.byId("selc_ejcu").getSelectedKey();
        const sSelectKeyClienNuevo = this.byId("slct_client").getSelectedKey();
        const sSelectKeyVerti = this.byId("slct_verti").getSelectedKey();
        const sSelectKeyAmrep = this.byId("selct_Amrecp").getSelectedKey();

        function validateField(oField, value, fieldName, type = "text") {
          if (type === "boolean") {
            if (!value) {
              errorCount++;
              incompleteFields.push(fieldName);
            }
          } else if (type === "date") {
            if (!value) {
              if (oField.setValueState) {
                oField.setValueState("Error");
              }
              errorCount++;
              incompleteFields.push(fieldName);
            } else {
              if (oField.setValueState) {
                oField.setValueState("None");
              }
            }
          } else {
            if (!value) {
              if (oField.setValueState) {
                oField.setValueState("Error");
              }
              errorCount++;
              incompleteFields.push(fieldName);
            } else {
              if (oField.setValueState) {
                oField.setValueState("None");
              }
            }
          }
        }





        const recursosValidation = this.validateRecursosInternos();
        const ServInternoValidation = this.validateServicioInterno();
        const gastoInternoValidation = this.validateGastoViajeInterno();
        const chartValidation = this.validateChartData();
        const consumoValidation = this.validateConsumoExterno();
        const ServiConsuValidation = this.validateServiConsu();
        const GastoViConsValidation = this.validateGastoConsu();
        const recurExterValidation = this.validateRecursoExterno();
        const serviRecExValidation = this.validateServicioRecuExter();
        const gastoviajeReExValidation = this.validateGastoViajeExterno();
        const otroConcepValidation = this.validateOtrosConceptos();
        const LicenciaValidation = this.validateLicencia();
        const MultijuridaCheck = this.validateClienteFacturacion();
        const SeguimientValidation = this.validatePlanning();
        const validationObjAlcan = this.validateTextAreas();

        if (!chartValidation.success) {
          errorMessages.push(...chartValidation.errors);
        }

        if (!recursosValidation.success) {
          errorMessages.push(...recursosValidation.errors);
        }



        if (!ServInternoValidation.success) {
          errorMessages.push(...ServInternoValidation.errors);
        }

        if (!gastoInternoValidation.success) {
          errorMessages.push(...gastoInternoValidation.errors);
        }

        if (!consumoValidation.success) {
          errorMessages.push(...consumoValidation.errors);
        }


        if (!ServiConsuValidation.success) {
          errorMessages.push(...ServiConsuValidation.errors);
        }

        if (!GastoViConsValidation.success) {
          errorMessages.push(...GastoViConsValidation.errors);
        }


        if (!recurExterValidation.success) {
          errorMessages.push(...recurExterValidation.errors);
        }


        if (!serviRecExValidation.success) {
          errorMessages.push(...serviRecExValidation.errors);
        }


        if (!gastoviajeReExValidation.success) {
          errorMessages.push(...gastoviajeReExValidation.errors);
        }

        if (!otroConcepValidation.success) {
          errorMessages.push(...otroConcepValidation.errors);
        }

        if (!LicenciaValidation.success) {
          errorMessages.push(...LicenciaValidation.errors);
        }

        if (!MultijuridaCheck.success) {
          errorMessages.push(...MultijuridaCheck.errors);
        }


        if (!SeguimientValidation.success) {
          errorMessages.push(...SeguimientValidation.errors);
        }



        if (!validationObjAlcan.success) {
          errorMessages.push(...validationObjAlcan.errors);
        }

        validateField(this.byId("input1"), snameProyect, "Nombre del Proyecto");
        validateField(this.byId("idDescripcion"), sdescripcion, "Descripcion");
        //  validateField(this.byId("box_multiJuridica"), sMultiJuri, "Multijuridica");
        validateField(this.byId("date_inico"), sFechaIni, "Inicio", "date");
        validateField(this.byId("date_fin"), sFechaFin, "Fin", "date");
        validateField(this.byId("idObje"), sdescripcion, "Objectivo y Alcance");
        validateField(this.byId("idAsunyRestri"), sdescripcion, "Objectivo y Alcance");

        if (errorCount > 0 || errorMessages.length > 0) {
          let message = "";

          if (incompleteFields.length > 0) {
            message += "Por favor, complete los siguientes campos:\n- " + incompleteFields.join("\n- ");
          }

          if (errorMessages.length > 0) {
            if (message.length > 0) {
              message += "\n\n";
            }
            message += "Errores en los datos ingresados:\n- " + errorMessages.join("\n- ");
          }

          sap.m.MessageBox.warning(message, { title: "Advertencia" });
          return;
        }



        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

        //  console.log(localDate);

        const resultadoDialogo = await this.mostrarDialogoModalidad();


        let sModalidad = "Offline";
        let sFechaComite = null;

        if (resultadoDialogo.modalidad === "Comité") {
          sModalidad = "Comité";
          sFechaComite = resultadoDialogo.fechaComite ? resultadoDialogo.fechaComite.toISOString().split("T")[0] : null;
        }


        const payload = {
          codigoProyect: "1",
          nameProyect: snameProyect,
          Email: sEmail,
          Empleado: sEmpleado,
          pluriAnual: spluriAnual,
          Total: sTotal,
          Oferta: sOferta,
          descripcion: sdescripcion,
          mensual: sMensual,
          comentarioTipoCompra: sComentarioTipCompra,
          comentarioFacturacion: sComentarioFacturacion,
          comentarioProveedor: sComentarioProvee,
          comentarioPvD: sComentarioPVd,
          funcionalString: sClienteFunc,
          clienteFacturacion: sClienteFac,
          multijuridica: sMultiJuri,
          Naturaleza_ID: sSelectedKey,
          TipoCompra_ID: sSelecKeyTipoCompra,
          TipoCompra: { ID: sSelecKeyTipoCompra },
          MotivoCondi: { ID: sSelecKeyMotivoCondi },
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
          ClienteNuevo_ID: sSelectKeyClienNuevo,
          Estado: "Pendiente",
          modalidad: sModalidad,
          fechaComite: sFechaComite,
          Usuarios_ID: usuarioOn,
          datosExtra: sDatosExtra,
          IPC_apli: ipcNumber,
          CambioEuRUSD: sCambioEurUsd
        };



        if (!sProjectID) {
          payload.fechaCreacion = localDate;
        }




        // Crear la fecha de modificación (formato yyyy-MM-dd)
        let oDateFormat1 = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "yyyy-MM-dd"
        });
        const fechaModificacion = new Date();
        const formattedFechaModificacion = oDateFormat1.format(fechaModificacion);

        // Agregar FechaModificacion solo si es PATCH
        if (sProjectID) {
          payload.FechaModificacion = formattedFechaModificacion;
        }

        // Validar campos antes de hacer la llamada
        if (!payload.descripcion || !payload.nameProyect) {
          //sap.m.MessageToast.show("Error: Código y nombre del proyecto son obligatorios.");
          console.error("Validación fallida: Falta código o nombre del proyecto", payload);
          return;
        }

        // Log del payload antes de enviarlo
        //console.log("Payload a enviar:", JSON.stringify(payload, null, 2));



        try {



          let oModel = this.getView().getModel();
          let sServiceUrl = oModel.sServiceUrl;

          let response;
          let url = "/odata/v4/datos-cdo/DatosProyect";
          let method = "POST";

          this._oBusyDialog.open(); // Mostrar cargando


          if (this._mode === "edit") {

            // Si estás en modo editar, asumes que sProjectID es válido
            if (!sProjectID) {
              sap.m.MessageBox.error("Error: No hay ProjectID para editar.");
              return;
            }

            //console.log("ID DEL WORK " + this._idWorkIniciado);

            if (this._idWorkIniciado) {
              try {
                // Llamada a backend para cancelar el workflow anterior
                const oModel = this.getView().getModel();
                const oContextCancel = oModel.bindContext("/cancelWorkflow(...)");
                oContextCancel.setParameter("workflowInstanceId", this._idWorkIniciado);
                await oContextCancel.execute();
                //sap.m.MessageToast.show("Workflow anterior cancelado correctamente");
              } catch (error) {
                sap.m.MessageBox.error("Error al cancelar workflow anterior: " + error.message);
                return;
              }
            }

            // Actualización (PATCH)
            url = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})`;
            method = "PATCH";



          } else if (this._mode === "create") {
            // En modo create o sin sProjectID --> creación (POST)
            method = "POST";
            url = "/odata/v4/datos-cdo/DatosProyect";
          }

          // 1️ Obtener el CSRF Token
          let oTokenResponse = await fetch(sServiceUrl, {
            method: "GET",
            headers: { "x-csrf-token": "Fetch" }
          });
          if (!oTokenResponse.ok) {
            throw new Error("Error al obtener el CSRF Token");
          }

          let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
          if (!sCsrfToken) {
            throw new Error("No se recibió un CSRF Token");
          }

          //  //console.log(" CSRF Token obtenido:", sCsrfToken);

          // Realizamos la llamada al servicio con el método y URL adecuados
          response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": sCsrfToken
            },
            body: JSON.stringify(payload),
          });

          // Verificar respuesta
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error en ${method} (${response.status}):`, errorText);

            if (response.status === 400) {
              sap.m.MessageToast.show("Error 400: Datos incorrectos o incompletos.");
            } else if (response.status === 404) {
              sap.m.MessageToast.show("Error 404: Endpoint no encontrado.");
            } else if (response.status === 500) {
              sap.m.MessageToast.show("Error 500: Problema en el servidor o base de datos.");
            } else {
              sap.m.MessageToast.show(`Error ${response.status}: ${errorText}`);
            }

            throw new Error(`HTTP ${response.status} - ${errorText}`);
          }

          // Procesar respuesta si es exitosa
          if (response.ok) {
            const result = await response.json();
            //console.log("Respuesta completa de la API:", result);

            // Verifica si la respuesta contiene un campo 'ID' o si está anidado dentro de otro objeto
            const generatedId = result.ID || result.data?.ID; // Si el ID está dentro de un objeto 'data'
            //  console.log("ID generado:", generatedId);

            if (generatedId) {



              //    this.getOwnerComponent().getRouter().navTo("app", { newId: generatedId });

              // Llamadas en paralelo para mejorar rendimiento
              const insertAllResults = await Promise.all([
                this.insertFacturacion(generatedId),
                this.inserChart(generatedId, sCsrfToken),
                this.insertarProveedor(generatedId),
                this.insertClientFactura(generatedId),
                this.insertRecursosInternos(generatedId),
                this.insertCosumoExterno(generatedId),
                this.insertRecursoExterno(generatedId),
                this.insertarOtrosConceptos(generatedId),
                this.insertServicioInterno(generatedId),
                this.insertGastoViajeInterno(generatedId),
                this.insertServiConsu(generatedId),
                this.insertGastoConsu(generatedId),
                this.insertServicioRecuExter(generatedId),
                this.insertGastoViajeExterno(generatedId),
                this.insertarLicencia(generatedId),
                this.insertPerfilJornadas(generatedId, sCsrfToken),
                this.insertTotalRecuInterno(generatedId, sCsrfToken),
                this.insertTotalConsuExt(generatedId, sCsrfToken),
                this.insertTotalRecuExterTotal(generatedId, sCsrfToken),
                this.insertTotalInfraestrLicencia(generatedId, sCsrfToken),
                this.insertResumenCostesTotal(generatedId, sCsrfToken),
                this.onUploadFile(generatedId, sCsrfToken),


              ]);



              const hostname = window.location.hostname;
              //console.log(" Hostname detectado:", hostname);

              // 1 Payload para iniciar workflow de aprobación

              // const urlAPP = "https://telefonica-global-technology--s-a--j8z80lwx-sp-shc-dev-16bb931b.cfapps.eu20-001.hana.ondemand.com/project1/index.html#/app/";
              let urlAPP = "";
              if (hostname.includes("localhost") ||
                hostname.includes("dev") ||
                hostname.includes("test") ||
                hostname.includes("applicationstudio")) {
                urlAPP = "https://telefonica-global-technology--s-a--j8z80lwx-sp-shc-dev-16bb931b.cfapps.eu20-001.hana.ondemand.com/project1/index.html#/app/";
              } else {
                urlAPP = "https://telefonica-global-technology--s-a--zagvian4-sp-shc-qa-d6cf78b85.cfapps.eu20-001.hana.ondemand.com/project1/index.html#/app/";
              }




              /* const fullUrl = window.location.href;
                   console.log(" URL completa detectada:", fullUrl);
 
                   if (fullUrl === "https://miapp--s-a--z123456shc-qa-d6cf78b85.cfapps.eu20-001.hana.ondemand.com/project1/index.html#/app/") {
                     console.log(" Entorno QA detectado por URL exacta");
                     urlAPP = "https://URL-especial-para-QA/index.html#/app/";
                   }*/




              const oModel = this.getView().getModel();

              const oContext = oModel.bindContext("/startWorkflow(...)");

              const workflowPayload = {
                codigoproyect: 0,
                nameproyect: snameProyect,
                generatedid: generatedId,
                urlapp: urlAPP,
                descripcion: sdescripcion,
                jefeProyecto: sSelecTextJe,
                area: sSelecTextA,
                usuario: sEmpleado,
                Modalidad: sModalidad
              };

              //  Agrega fechaComite solo si es Comité
              if (sModalidad === "Comité" && sFechaComite) {
                workflowPayload.fechaComite = sFechaComite;
              }

              oContext.setParameter("payload", JSON.stringify(workflowPayload));


              //  Agrega fechaComite SOLO si es Comité

              try {

                await oContext.execute();
                const result = oContext.getBoundContext().getObject();
                this.workflowInstanceId = result.workflowInstanceId; // Guardamos esto

                //console.log("Resultado del flujo de trabajo:", result);

                if (result && result.workflowInstanceId) {
                  const workflowInstanceId = result.workflowInstanceId;

                  this.insertWorkflow(workflowInstanceId, sEmpleado, generatedId, sCsrfToken);
                  //  sap.m.MessageToast.show("Workflow iniciado correctamente con ID: " + workflowInstanceId);
                  this._oBusyDialog.close();


                } else {
                  sap.m.MessageBox.error("No se recibió el ID del flujo de trabajo.");
                }

                this.getOwnerComponent().getRouter().navTo("app", { newId: generatedId });


              } catch (err) {
                sap.m.MessageBox.error("Error al iniciar el workflow: " + err.message);
              }
              // Navegar a la vista 'app' con el nuevo ID
            } else {
              console.error("No se generó un ID válido.");
              //sap.m.MessageToast.show("Error: No se generó un ID válido.");
            }
          }
        } catch (error) {
          console.error("Error en la llamada al servicio:", error);
          //sap.m.MessageToast.show("Error al procesar el proyecto: " + error.message);
        }
      },






      /////----------------------------- VALIDACIONES ANTES DE ENVIAR  --------------------------------    


      validateTextAreas: function () {
        const errors = [];

        // Lista de TextAreas a validar
        const aTextAreas = [
          { id: "idObje", nombre: "Objetivo y Alcance" },
          { id: "idAsunyRestri", nombre: "Asunciones y Restricciones" }
        ];

        aTextAreas.forEach(item => {
          const oTextArea = this.byId(item.id);
          if (oTextArea) {
            const sValue = oTextArea.getValue().trim();
            if (!sValue) {
              errors.push(`El campo "${item.nombre}" es obligatorio.`);
              oTextArea.addStyleClass("fieldError"); // Clase CSS para marcar en rojo
            } else {
              oTextArea.removeStyleClass("fieldError");
            }
          }
        });

        return {
          success: errors.length === 0,
          errors
        };
      },



      // Validacion select  seguimiento 
      validatePlanning: function () {
        const errors = [];

        // Obtenemos el valor seleccionado en el select de seguimiento 
        const oSelectMet = this.byId("selc_Segui"); // Ajusta el ID
        const sMetValue = oSelectMet && oSelectMet.getSelectedItem()
          ? oSelectMet.getSelectedItem().getText().trim()
          : "";

        console.log("Método seleccionado: " + sMetValue);

        // Metodologías que requieren planificación obligatoria
        const aMetPlanningRequired = ["Agile", "Mixto", "Waterfall"];

        // Obtenemos la planificación del modelo
        const oModel = this.getView().getModel("planning");
        const oPlanningData = oModel.getProperty("/milestones");
        const oPlanningTable = this.byId("planningTable");
        const aItems = oPlanningTable ? oPlanningTable.getItems() : [];

        if (aMetPlanningRequired.includes(sMetValue)) {
          if (!oPlanningData || oPlanningData.length === 0) {
            errors.push(`Rellenar Planificación es obligatoria cuando se selecciona la metodología "${sMetValue}".`);
            if (oPlanningTable) oPlanningTable.addStyleClass("tableError");
          } else {
            oPlanningData.forEach((row, index) => {
              const oItem = aItems[index]; // ColumnListItem correspondiente
              if (!row.fechaInicio || !row.fechaFin) {
                errors.push(`La fase "${row.fase}" está incompleta.`);
                if (oItem) oItem.addStyleClass("rowError"); // Resalta la fila
              } else {
                if (oItem) oItem.removeStyleClass("rowError");
              }
            });
            if (oPlanningTable) oPlanningTable.removeStyleClass("tableError");
          }
        } else {
          // Si la metodología no requiere planificación, quitamos todos los estilos
          aItems.forEach(oItem => oItem.removeStyleClass("rowError"));
          if (oPlanningTable) oPlanningTable.removeStyleClass("tableError");
        }

        return {
          success: errors.length === 0,
          errors
        };
      },







      validateChartData: function () {
        const errors = [];

        // Función para resetear la hora a 00:00:00
        function resetTime(date) {
          if (!date) return null;
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d;
        }

        const sFechaIniForm = resetTime(this.byId("date_inico").getDateValue());
        const sFechaFinForm = resetTime(this.byId("date_fin").getDateValue());

        if (!sFechaIniForm || !sFechaFinForm) {
          errors.push("Debes seleccionar las fechas Inicio y Fin en el formulario.");
        }

        let minFechaInicio = null;
        let maxFechaFin = null;

        if (this._aChartData && this._aChartData.length > 0) {
          this._aChartData.forEach(chart => {
            const fechaInicio = chart.fechaInicio ? resetTime(new Date(chart.fechaInicio)) : null;
            const fechaFin = chart.fechaFin ? resetTime(new Date(chart.fechaFin)) : null;

            if (fechaInicio) {
              if (!minFechaInicio || fechaInicio < minFechaInicio) {
                minFechaInicio = fechaInicio;
              }
            }

            if (fechaFin) {
              if (!maxFechaFin || fechaFin > maxFechaFin) {
                maxFechaFin = fechaFin;
              }
            }
          });
        } else {
          errors.push("El gráfico está vacío. Debes ingresar al menos un hito.");
        }

        if (minFechaInicio && sFechaIniForm) {
          if (minFechaInicio.getTime() !== sFechaIniForm.getTime()) {
            errors.push(`La fecha de inicio más temprana (${minFechaInicio.toLocaleDateString()}) no coincide con la fecha seleccionada en el formulario (${sFechaIniForm.toLocaleDateString()}).`);
          }
        }

        if (maxFechaFin && sFechaFinForm) {
          if (maxFechaFin.getTime() !== sFechaFinForm.getTime()) {
            errors.push(`La fecha de fin más tardía (${maxFechaFin.toLocaleDateString()}) no coincide con la fecha seleccionada en el formulario (${sFechaFinForm.toLocaleDateString()}).`);
          }
        }

        return {
          success: errors.length === 0,
          errors
        };
      },



      validateClienteFacturacion: function () {
        //   console.log("He entrado al log ");

        const oCheckBox = this.byId("box_multiJuridica");
        const isMultiJuridicaChecked = oCheckBox.getSelected();

        const oTable = this.byId("table_clienteFac");
        const aItems = oTable.getItems();
        const errors = [];
        let hasFilledRow = false;
        let atLeastOneValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];
          const aCells = oItem.getCells();

          // Evitar validar filas de Total
          if (aCells[0].getMetadata().getName() === "sap.m.Title") {
            continue;
          }

          const oJuridica = aCells[0];
          const oPorcentaje = aCells[1];

          const sJuridica = oJuridica.getValue().trim();
          const sPorcentaje = oPorcentaje.getValue().trim();

          const isEmptyRow = !sJuridica && !sPorcentaje;

          // Limpiar estados anteriores
          oJuridica.setValueState("None");
          oPorcentaje.setValueState("None");

          if (!isEmptyRow) {
            hasFilledRow = true;
            const rowErrors = [];

            if (!sJuridica) {
              rowErrors.push("Debe ingresar la Jurídica");
              oJuridica.setValueState("Error");
              oJuridica.setValueStateText("Campo obligatorio");
            }

            if (!sPorcentaje) {
              rowErrors.push("Debe ingresar el % Oferta");
              oPorcentaje.setValueState("Error");
              oPorcentaje.setValueStateText("Campo obligatorio");
            } else if (isNaN(sPorcentaje) || Number(sPorcentaje) < 0 || Number(sPorcentaje) > 100) {
              rowErrors.push("El % Oferta debe ser un número entre 0 y 100");
              oPorcentaje.setValueState("Error");
              oPorcentaje.setValueStateText("Valor inválido");
            }

            if (rowErrors.length > 0) {
              errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
            } else {
              atLeastOneValidRow = true;
            }
          }
        }

        // Si el checkbox está seleccionado y no hay ninguna fila rellenada => marcar primera fila en rojo
        if (isMultiJuridicaChecked && !hasFilledRow) {
          const oFirstItem = aItems[0];
          const aFirstCells = oFirstItem.getCells();
          const oFirstJuridica = aFirstCells[0];
          const oFirstPorcentaje = aFirstCells[1];

          oFirstJuridica.setValueState("Error");
          oFirstJuridica.setValueStateText("Campo obligatorio");
          oFirstPorcentaje.setValueState("Error");
          oFirstPorcentaje.setValueStateText("Campo obligatorio");

          errors.push("Debe completar al menos una fila de Cliente Facturación cuando Multi Jurídica está seleccionado.");
        }
        // Si el checkbox está seleccionado y hay filas rellenadas pero ninguna válida => error
        else if (isMultiJuridicaChecked && hasFilledRow && !atLeastOneValidRow) {
          errors.push("Debe completar correctamente al menos una fila de Cliente Facturación.");
        }

        return {
          success: errors.length === 0,
          errors
        };
      },




      validateRecursosInternos: function () {
        const oTable = this.byId("table_dimicFecha");
        const aItems = oTable.getItems();
        const errors = [];
        let hasFilledRow = false;
        let atLeastOneValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];
          const oVertical = oItem.getCells()[0];
          const oTipoServi = oItem.getCells()[1];
          const oPerfil = oItem.getCells()[2];
          const oConcepto = oItem.getCells()[3];

          const sVertical = oVertical?.getSelectedKey() || "";
          const stipoServi = oTipoServi?.getSelectedKey() || "";
          const sPerfil = oPerfil?.getSelectedKey() || "";
          const sConcepto = oConcepto?.getValue()?.trim() || "";

          const isEmptyRow = !sVertical && !stipoServi && !sPerfil && !sConcepto;

          // Limpiar estados anteriores
          oVertical?.setValueState("None");
          oTipoServi?.setValueState("None");
          oPerfil?.setValueState("None");
          oConcepto?.setValueState("None");

          // Solo validar si la fila tiene algún valor
          if (!isEmptyRow) {
            hasFilledRow = true;
            const rowErrors = [];

            if (!sVertical) {
              rowErrors.push("Debe seleccionar la Vertical");
              oVertical?.setValueState("Error");
              oVertical?.setValueStateText("Campo obligatorio");
            }
            if (!stipoServi) {
              rowErrors.push("Debe seleccionar el Tipo de Servicio");
              oTipoServi?.setValueState("Error");
              oTipoServi?.setValueStateText("Campo obligatorio");
            }
            if (!sPerfil) {
              rowErrors.push("Debe seleccionar el Perfil");
              oPerfil?.setValueState("Error");
              oPerfil?.setValueStateText("Campo obligatorio");
            }
            if (!sConcepto) {
              rowErrors.push("El campo Concepto es obligatorio");
              oConcepto?.setValueState("Error");
              oConcepto?.setValueStateText("Campo obligatorio");
            }

            if (rowErrors.length > 0) {
              errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
            } else {
              atLeastOneValidRow = true;
            }
          }
        }

        // Si hay filas rellenas y alguna está incompleta => mostrar errores
        if (hasFilledRow && !atLeastOneValidRow) {
          errors.push("Debe completar correctamente al menos una fila de Recursos Internos.");
        }

        return {
          success: errors.length === 0,
          errors
        };
      },


      validateServicioInterno: function () {
        const oTable = this.byId("tableServicioInterno");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          // Obtener controles de la fila
          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");
          // No hay valueState para Text, si quieres puedes indicar error con estilos

          // Detectar si la fila está vacía: no tiene datos clave (vertical, tipo, concepto, PMJ y Total)
          const isEmptyRow = (!sVertical && !sTipoServi && !sConcepto && isNaN(sPMJ) && isNaN(sTotal));

          if (isEmptyRow) {
            // Ignorar esta fila
            continue;
          }

          const rowErrors = [];

          // Validar campos obligatorios si la fila tiene datos
          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }


          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        // Si quieres forzar al menos una fila válida:
        /*
        if (!hasValidRow && aItems.length > 0) {
          errors.push("Debe completar correctamente al menos una fila de Servicio Interno.");
        }
        */

        return {
          success: errors.length === 0,
          errors
        };
      },


      validateGastoViajeInterno: function () {
        const oTable = this.byId("tablGastoViajeInterno");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          // Obtener controles de la fila
          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];
          const oTextTotalE = oItem.getCells()[12];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);
          const sTotalE = parseInt(oTextTotalE.getText(), 10);

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");
          // Los textos no tienen ValueState, si quieres puedes usar CSS para marcar errores

          // Detectar si la fila está vacía (ningún dato clave)
          const isEmptyRow = (!sVertical && !sTipoServi && !sConcepto && isNaN(sPMJ) && isNaN(sTotal) && isNaN(sTotalE));

          if (isEmptyRow) {
            continue; // Ignorar filas vacías
          }

          const rowErrors = [];

          // Validar campos obligatorios
          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }

          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        // Si quieres forzar que haya al menos una fila válida, descomenta:
        /*
        if (!hasValidRow && aItems.length > 0) {
          errors.push("Debe completar correctamente al menos una fila de Gasto Viaje Interno.");
        }
        */

        return {
          success: errors.length === 0,
          errors
        };
      },




      validateConsumoExterno: function () {
        const oTable = this.byId("tablaConsuExter");
        const aItems = oTable.getItems();
        const errors = [];
        let hasFilledRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oVertical = oItem.getCells()[0];
          const oTipoServi = oItem.getCells()[1];
          const oPerfil = oItem.getCells()[2];
          const oConcepto = oItem.getCells()[3];
          const oPMJ = oItem.getCells()[4];

          const sVertical = oVertical?.getSelectedKey() || "";
          const stipoServi = oTipoServi?.getSelectedKey() || "";
          const sPerfil = oPerfil?.getSelectedKey() || "";
          const sConcepto = oConcepto?.getValue()?.trim() || "";
          const sPMJ = parseFloat(oPMJ?.getText()) || 0; // ojo que antes tenías getText() que da string no editable
          const sTotal = parseFloat(oItem.getCells()[11]?.getText()) || 0;
          const stotalRe = parseFloat(oItem.getCells()[12]?.getText()) || 0;

          const isRowWithData = sVertical || stipoServi || sPerfil || sConcepto || sPMJ > 0 || sTotal > 0 || stotalRe > 0;

          // Limpiar estados anteriores
          oVertical?.setValueState("None");
          oTipoServi?.setValueState("None");
          oPerfil?.setValueState("None");
          oConcepto?.setValueState("None");

          if (isRowWithData) {
            hasFilledRow = true;
            const rowErrors = [];

            if (!sVertical) {
              rowErrors.push("Debe seleccionar la Vertical");
              oVertical?.setValueState("Error");
              oVertical?.setValueStateText("Campo obligatorio");
            }
            if (!stipoServi) {
              rowErrors.push("Debe seleccionar el Tipo de Servicio");
              oTipoServi?.setValueState("Error");
              oTipoServi?.setValueStateText("Campo obligatorio");
            }
            if (!sPerfil) {
              rowErrors.push("Debe seleccionar el Perfil");
              oPerfil?.setValueState("Error");
              oPerfil?.setValueStateText("Campo obligatorio");
            }
            if (!sConcepto) {
              rowErrors.push("El campo Concepto es obligatorio");
              oConcepto?.setValueState("Error");
              oConcepto?.setValueStateText("Campo obligatorio");
            }


            if (rowErrors.length > 0) {
              errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
            }
          }
        }

        if (hasFilledRow && errors.length > 0) {
          return { success: false, errors };
        }

        return { success: true, errors: [] };
      },


      validateServiConsu: function () {
        const oTable = this.byId("idOtroserConsu");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];
          const oTextTotalE = oItem.getCells()[12];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);
          const sTotalE = parseInt(oTextTotalE.getText(), 10);

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");

          // Detectar fila vacía
          const isEmptyRow = (!sVertical && !sTipoServi && !sConcepto && isNaN(sPMJ) && isNaN(sTotal) && isNaN(sTotalE));

          if (isEmptyRow) {
            continue; // Ignorar fila vacía
          }

          const rowErrors = [];

          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }

          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        return {
          success: errors.length === 0,
          errors
        };
      },


      validateGastoConsu: function () {
        const oTable = this.byId("idGastoViajeConsu");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];
          const oTextTotalE = oItem.getCells()[12];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);
          const sTotalE = parseInt(oTextTotalE.getText(), 10);

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");

          // Detectar fila vacía
          const isEmptyRow = (!sVertical && !sTipoServi && !sConcepto && isNaN(sPMJ) && isNaN(sTotal) && isNaN(sTotalE));

          if (isEmptyRow) {
            continue; // Ignorar fila vacía
          }

          const rowErrors = [];

          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }


          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        return {
          success: errors.length === 0,
          errors
        };
      },




      validateRecursoExterno: function () {
        const oTable = this.byId("tablaRecExterno");
        const aItems = oTable.getItems();
        const errors = [];

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oVertical = oItem.getCells()[0];
          const oTipoServi = oItem.getCells()[1];
          const oPerfil = oItem.getCells()[2];
          const oConcepto = oItem.getCells()[3];
          const oPMJ = oItem.getCells()[4]; // control Input real

          const sVertical = oVertical.getSelectedKey() || "";
          const stipoServi = oTipoServi.getSelectedKey() || "";
          const sPerfil = oPerfil.getValue() || "";
          const sConcepto = oConcepto.getValue() || "";
          const sPMJ = parseFloat(oPMJ.getValue());
          const sTotal = parseFloat(oItem.getCells()[11].getText());
          const stotalRe = parseFloat(oItem.getCells()[12].getText());

          const isRowWithData =
            sVertical || stipoServi || sPerfil || sConcepto ||
            !isNaN(sPMJ) || !isNaN(sTotal) || !isNaN(stotalRe);

          // Limpiar estados anteriores
          oVertical.setValueState("None");
          oTipoServi.setValueState("None");
          oPerfil.setValueState("None");
          oConcepto.setValueState("None");
          oPMJ.setValueState("None");  // Aquí el control, no el valor

          if (isRowWithData) {
            const rowErrors = [];

            if (!sVertical) {
              rowErrors.push("Debe seleccionar la Vertical");
              oVertical.setValueState("Error");
              oVertical.setValueStateText("Campo obligatorio");
            }
            if (!stipoServi) {
              rowErrors.push("Debe seleccionar el Tipo de Servicio");
              oTipoServi.setValueState("Error");
              oTipoServi.setValueStateText("Campo obligatorio");
            }
            if (!sPerfil) {
              rowErrors.push("Debe seleccionar el Perfil");
              oPerfil.setValueState("Error");
              oPerfil.setValueStateText("Campo obligatorio");
            }
            if (!sConcepto) {
              rowErrors.push("El campo Concepto es obligatorio");
              oConcepto.setValueState("Error");
              oConcepto.setValueStateText("Campo obligatorio");
            }

            if (isNaN(sPMJ)) {
              rowErrors.push("El campo PMJ no es válido");
              oPMJ.setValueState("Error");
              oPMJ.setValueStateText("Debe ser un número válido");
            }

            if (rowErrors.length > 0) {
              errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
            }
          }
        }

        if (errors.length > 0) {
          return {
            success: false,
            errors
          };
        }

        return {
          success: true,
          errors: []
        };
      },


      validateServicioRecuExter: function () {
        const oTable = this.byId("idServiExterno");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];
          const oTextTotalE = oItem.getCells()[12];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);
          const sTotalE = parseInt(oTextTotalE.getText(), 10);

          // Limpiar estados de error antes de validar
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");

          // Verificar si la fila está "vacía": todos los campos relevantes vacíos o cero
          const isEmptyRow =
            !sVertical &&
            !sTipoServi &&
            !sConcepto &&
            (isNaN(sPMJ) || sPMJ === 0) &&
            (isNaN(sTotal) || sTotal === 0) &&
            (isNaN(sTotalE) || sTotalE === 0);

          // Si fila vacía, saltar validación
          if (isEmptyRow) {
            continue;
          }

          const rowErrors = [];

          // Validar solo filas con algún dato
          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }


          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        return {
          success: errors.length === 0,
          errors,
          hasValidRow
        };
      },

      validateGastoViajeExterno: function () {
        const oTable = this.byId("idGastoRecuExter");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          const oSelectVertical = oItem.getCells()[0];
          const oSelectTipoServi = oItem.getCells()[1];
          const oInputConcepto = oItem.getCells()[3];
          const oTextPMJ = oItem.getCells()[4];
          const oTextTotal = oItem.getCells()[11];
          const oTextTotalE = oItem.getCells()[12];

          const sVertical = oSelectVertical.getSelectedKey();
          const sTipoServi = oSelectTipoServi.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();
          const sPMJ = parseInt(oTextPMJ.getText(), 10);
          const sTotal = parseInt(oTextTotal.getText(), 10);
          const sTotalE = parseInt(oTextTotalE.getText(), 10);

          // Limpiar estados de error antes de validar
          oSelectVertical.setValueState("None");
          oSelectTipoServi.setValueState("None");
          oInputConcepto.setValueState("None");

          // Verificar si la fila está vacía
          const isEmptyRow =
            !sVertical &&
            !sTipoServi &&
            !sConcepto &&
            (isNaN(sPMJ) || sPMJ === 0) &&
            (isNaN(sTotal) || sTotal === 0) &&
            (isNaN(sTotalE) || sTotalE === 0);

          if (isEmptyRow) {
            continue;
          }

          const rowErrors = [];

          // Validaciones
          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sTipoServi) {
            rowErrors.push("Debe seleccionar el Tipo de Servicio");
            oSelectTipoServi.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }


          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        return {
          success: errors.length === 0,
          errors,
          hasValidRow
        };
      },



      validateLicencia: function () {
        const oTable = this.byId("tablaLicencia");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false;

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          // Obtener controles de la fila
          const oSelectVertical = oItem.getCells()[0];
          const oInputConcepto = oItem.getCells()[2];
          // Aquí solo validamos vertical y concepto, que son obligatorios
          const sVertical = oSelectVertical.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oInputConcepto.setValueState("None");

          // Detectar si la fila está vacía: ni vertical ni concepto tiene dato
          const isEmptyRow = (!sVertical && !sConcepto);

          if (isEmptyRow) {
            // Ignorar esta fila
            continue;
          }

          // La fila tiene datos, validar obligatorios
          const rowErrors = [];

          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }

          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        // Si quieres forzar que al menos una fila esté completa, puedes activar esta validación:
        /*
        if (!hasValidRow && aItems.length > 0) {
          errors.push("Debe completar correctamente al menos una fila de Licencia.");
        }
        */

        return {
          success: errors.length === 0,
          errors
        };
      },



      validateOtrosConceptos: function () {
        const oTable = this.byId("tablaInfrestuctura");
        const aItems = oTable.getItems();
        const errors = [];
        let hasValidRow = false; // Hay al menos una fila con datos completos

        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];

          // Obtengo controles de la fila
          const oSelectVertical = oItem.getCells()[0];
          const oInputConcepto = oItem.getCells()[2];
          // Más campos si quieres validar, pero los obligatorios son esos dos
          const sVertical = oSelectVertical.getSelectedKey();
          const sConcepto = oInputConcepto.getValue()?.trim();

          // Limpiar estados de error
          oSelectVertical.setValueState("None");
          oInputConcepto.setValueState("None");

          // Detectar si la fila está "vacía": ni vertical ni concepto tiene dato
          const isEmptyRow = (!sVertical && !sConcepto);

          if (isEmptyRow) {
            // Ignorar esta fila, no validar nada
            continue;
          }

          // La fila tiene datos en al menos un campo, validar obligatorios
          const rowErrors = [];

          if (!sVertical) {
            rowErrors.push("Debe seleccionar la Vertical");
            oSelectVertical.setValueState("Error");
          }
          if (!sConcepto) {
            rowErrors.push("El campo Concepto es obligatorio");
            oInputConcepto.setValueState("Error");
          }

          if (rowErrors.length > 0) {
            errors.push(`Fila ${i + 1}: ${rowErrors.join(", ")}`);
          } else {
            hasValidRow = true;
          }
        }

        // Si no hay filas con datos válidos pero hay filas en la tabla, puede que esté bien (no obligatorio)
        // Si quieres forzar que al menos una fila esté completa, activa esta validación, sino elimínala:
        /*
        if (!hasValidRow && aItems.length > 0) {
          errors.push("Debe completar correctamente al menos una fila de Otros Conceptos.");
        }
        */

        return {
          success: errors.length === 0,
          errors
        };
      },












      mostrarDialogoModalidad: function () {
        return new Promise((resolve, reject) => {
          if (!this._oComiteDialog) {
            this._oComiteDialog = sap.ui.xmlfragment("project1.view.ComiteDialog", this);
            this.getView().addDependent(this._oComiteDialog);
          }

          // Reset selección y visibilidad si es necesario
          var oRadioGroup = sap.ui.getCore().byId("radioGroupModalidad");
          oRadioGroup.setSelectedIndex(0); // Por defecto "Online"

          var oDatePicker = sap.ui.getCore().byId("datePickerComite");
          var oInfoText = sap.ui.getCore().byId("infoText");
          oDatePicker.setVisible(false);
          oInfoText.setVisible(false);
          oDatePicker.setDateValue(null); // Limpia fecha anterior

          this._modalidadResolve = resolve;
          this._modalidadReject = reject;
          this._oComiteDialog.open();
        });
      },

      onCancelarComiteDialog: function () {
        if (this._oComiteDialog) {
          this._oComiteDialog.close();
        }

        if (this._modalidadReject) {
          this._modalidadReject("cancelado");
          this._modalidadReject = null;
          this._modalidadResolve = null;
        }
      },



      onConfirmModalidad: function () {
        const iSelectedIndex = sap.ui.getCore().byId("radioGroupModalidad").getSelectedIndex();
        const modalidad = iSelectedIndex === 0 ? "Offline" : "Comité";

        const oDatePicker = sap.ui.getCore().byId("datePickerComite");
        const selectedDate = oDatePicker.getDateValue();

        if (modalidad === "Comité" && !selectedDate) {
          sap.m.MessageToast.show("Por favor, selecciona una fecha para Comité.");
          return;
        }

        this._oComiteDialog.close();

        if (this._modalidadResolve) {
          this._modalidadResolve({
            modalidad,
            fechaComite: selectedDate || null
          });
        }
      },


      onSelectModalidad: function (oEvent) {
        // Obtiene el índice del botón seleccionado
        var iSelectedIndex = oEvent.getParameter("selectedIndex");

        // Obtiene el fragmento
        var oDialog = this._oComiteDialog;

        // Accede al DatePicker y al Text
        var oDatePicker = sap.ui.getCore().byId("datePickerComite");
        var oInfoText = sap.ui.getCore().byId("infoText");

        if (iSelectedIndex === 1) { // 0 = Online, 1 = En Comité
          oDatePicker.setVisible(true);
          oInfoText.setVisible(true);
        } else {
          oDatePicker.setVisible(false);
          oInfoText.setVisible(false);
        }
      },




      getUsuario: async function () {
        try {
          const sCurrentEmail = this._user;

          if (!sCurrentEmail) {
            throw new Error("El email del usuario no está disponible. Asegúrate de haber ejecutado getUserInfo primero.");
          }

          const sUrl = `/odata/v4/datos-cdo/Usuarios`;
          const response = await fetch(sUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error en la respuesta de la red: ' + errorText);
          }

          const data = await response.json();

          //  Buscamos coincidencia exacta de email (ignorando mayúsculas)
          const usuarioActual = data.value.find(
            u => u.email?.toLowerCase() === sCurrentEmail.toLowerCase()
          );

          if (usuarioActual) {
            //
            this._usuarioActual = usuarioActual.ID;



            return usuarioActual.ID;

          } else {
            throw new Error("    No se encontró el usuario con el email logueado.");
          }

        } catch (error) {
          console.error("Error al obtener el usuario:", error);
          return null;
        }
      },









      onBorrador: async function () {

        //console.log("ENTRANDO A onBorrador");
        //console.log("ENTRANDO A onBorrador");

        const usuario = this._usuarioActual;
        let sMode = this.getView().getModel("viewModel").getProperty("/mode");



        if (!this._oBusyDialog) {
          this._oBusyDialog = new sap.m.BusyDialog({
            title: "Procesando",
            text: "Guardando, por favor espere",
          });
        }


        // Si no está en el modelo, usa la propiedad interna
        if (!sMode) {
          sMode = this._mode || "";
        }

        // Último recurso: deduce por lógica
        if (!sMode) {
          sMode = this._sProjectID ? "edit" : "create";
        }

        //console.log("MODO FINAL USADO EN onSave:", sMode);

        let errorCount = 0;
        const incompleteFields = [];
        let errorMessages = [];


        const sProjectID = this._sProjectID; // ID del proyecto
        const scodigoProyect = parseFloat(this.byId("input0").getValue(), 10);
        const sOferta = this.byId("ofertaCheckBox").getSelected();

        const sEmail = this.byId("dddtg").getText();
        const sEmpleado = this.byId("23d3").getText();
        const sCambioEurUsd = parseFloat(this.byId("inputCambioEu").getValue());
        const snameProyect = this.byId("input1").getValue();
        const sdescripcion = this.byId("idDescripcion").getValue();
        const sTotal = parseFloat(this.byId("input0_1725625161348").getValue());
        const spluriAnual = this.byId("box_pluriAnual").getSelected();
        const sClienteFac = this.byId("id_Cfactur").getValue();
        const sMultiJuri = this.byId("box_multiJuridica").getSelected();
        const sMensual = this.byId("idCheckMensual").getSelected();
        const sClienteFunc = this.byId("int_clienteFun").getValue();
        const sObjetivoAlcance = this.byId("idObje").getValue();
        const sAsunyRestric = this.byId("idAsunyRestri").getValue();
        const sDatosExtra = this.byId("area0").getValue();
        const sFechaIni = this.byId("date_inico").getDateValue();
        const sFechaFin = this.byId("date_fin").getDateValue();
        const sIPC = this.byId("input_ipc").getValue();




        // Quitar el símbolo % y reemplazar coma por punto para poder parsear
        let numIPC = sIPC.replace("%", "").replace(",", ".");

        // Convertir a número (float)
        let ipcNumber = parseFloat(numIPC);




        const sComentarioProvee = this.byId("idTextComProve").getValue();
        const sComentarioPVd = this.byId("idComenpVd").getValue();

        const sComentarioTipCompra = this.byId("idComentarioTipo").getValue();
        const sComentarioFacturacion = this.byId("idComentariosFac").getValue();

        //console.log("Objeto comentarioProveedor:", sComentarioProvee);
        //console.log("Objeto comentarioPvD:", sComentarioPVd);


        var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss" });

        const sFechaIniFormatted = sFechaIni ? oDateFormat.format(sFechaIni) : null;
        const sFechaFinFormatted = sFechaFin ? oDateFormat.format(sFechaFin) : null;

        const sSelectedKey = this.byId("idNatu").getSelectedKey();
        const sSelecKeyA = this.byId("slct_area").getSelectedKey();
        const sSelecKeyJe = this.byId("slct_Jefe").getSelectedKey();
        const sSelecKeyTipoCompra = this.byId("select_tipoCom").getSelectedKey();
        const sSelecKeyMotivoCondi = this.byId("selectMotivo").getSelectedKey();
        const sSelectKeyIni = this.byId("slct_inic").getSelectedKey();
        const sSelectKeySegui = this.byId("selc_Segui").getSelectedKey();
        const sSelectKeyEjcu = this.byId("selc_ejcu").getSelectedKey();
        const sSelectKeyClienNuevo = this.byId("slct_client").getSelectedKey();
        const sSelectKeyVerti = this.byId("slct_verti").getSelectedKey();
        const sSelectKeyAmrep = this.byId("selct_Amrecp").getSelectedKey();

        const validateField = (control, value, fieldName) => {
          if (!value || (typeof value === 'string' && value.trim() === "")) {
            control.setValueState("Error");
            control.setValueStateText("Este campo es obligatorio");
            errorCount++;
            if (!incompleteFields.includes(fieldName)) {
              incompleteFields.push(fieldName);
            }
          } else {
            control.setValueState("None");
          }
        };

        // Validar campos antes de hacer la llamada
        validateField(this.byId("input1"), snameProyect, "Nombre del Proyecto");
        validateField(this.byId("idDescripcion"), sdescripcion, "Descripcion");




        const recursosValidation = this.validateRecursosInternos();
        const ServInternoValidation = this.validateServicioInterno();
        const gastoInternoValidation = this.validateGastoViajeInterno();
        const chartValidation = this.validateChartData();
        const consumoValidation = this.validateConsumoExterno();
        const ServiConsuValidation = this.validateServiConsu();
        const GastoViConsValidation = this.validateGastoConsu();
        const recurExterValidation = this.validateRecursoExterno();
        const serviRecExValidation = this.validateServicioRecuExter();
        const gastoviajeReExValidation = this.validateGastoViajeExterno();
        const otroConcepValidation = this.validateOtrosConceptos();
        const LicenciaValidation = this.validateLicencia();

        if (!recursosValidation.success) {
          errorMessages.push(...recursosValidation.errors);
        }


        if (!ServInternoValidation.success) {
          errorMessages.push(...ServInternoValidation.errors);
        }

        if (!gastoInternoValidation.success) {
          errorMessages.push(...gastoInternoValidation.errors);
        }

        if (!consumoValidation.success) {
          errorMessages.push(...consumoValidation.errors);
        }


        if (!ServiConsuValidation.success) {
          errorMessages.push(...ServiConsuValidation.errors);
        }

        if (!GastoViConsValidation.success) {
          errorMessages.push(...GastoViConsValidation.errors);
        }


        if (!recurExterValidation.success) {
          errorMessages.push(...recurExterValidation.errors);
        }


        if (!serviRecExValidation.success) {
          errorMessages.push(...serviRecExValidation.errors);
        }


        if (!gastoviajeReExValidation.success) {
          errorMessages.push(...gastoviajeReExValidation.errors);
        }

        if (!otroConcepValidation.success) {
          errorMessages.push(...otroConcepValidation.errors);
        }

        if (!LicenciaValidation.success) {
          errorMessages.push(...LicenciaValidation.errors);
        }



        if (errorCount > 0 || errorMessages.length > 0) {
          let message = "";

          if (incompleteFields.length > 0) {
            message += "Por favor, complete los siguientes campos:\n- " + incompleteFields.join("\n- ");
          }

          if (errorMessages.length > 0) {
            if (message.length > 0) {
              message += "\n\n";
            }
            message += "Errores en los datos ingresados:\n- " + errorMessages.join("\n- ");
          }

          sap.m.MessageBox.warning(message, { title: "Advertencia" });
          return;
        }



        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

        //console.log(localDate);


        const payload = {
          codigoProyect: "1",
          nameProyect: snameProyect,
          Email: sEmail,
          Empleado: sEmpleado,
          Oferta: sOferta,
          pluriAnual: spluriAnual,
          Total: sTotal,
          descripcion: sdescripcion,
          mensual: sMensual,
          comentarioTipoCompra: sComentarioTipCompra,
          comentarioFacturacion: sComentarioFacturacion,
          comentarioProveedor: sComentarioProvee,
          comentarioPvD: sComentarioPVd,
          funcionalString: sClienteFunc,
          clienteFacturacion: sClienteFac,
          multijuridica: sMultiJuri,
          Naturaleza_ID: sSelectedKey,
          TipoCompra_ID: sSelecKeyTipoCompra,
          TipoCompra: { ID: sSelecKeyTipoCompra },
          MotivoCondi: { ID: sSelecKeyMotivoCondi },
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
          ClienteNuevo_ID: sSelectKeyClienNuevo,
          Estado: "Borrador",
          datosExtra: sDatosExtra,
          IPC_apli: ipcNumber,
          Usuarios_ID: usuario,
          CambioEuRUSD: sCambioEurUsd
        };

        // Agregar fechaCreacion solo si es nuevo (POST)
        if (!sProjectID) {
          payload.fechaCreacion = localDate;
        }

        // Crear la fecha de modificación (formato yyyy-MM-dd)
        let oDateFormat1 = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "yyyy-MM-dd"
        });
        const fechaModificacion = new Date();
        const formattedFechaModificacion = oDateFormat1.format(fechaModificacion);

        // Agregar FechaModificacion solo si es PATCH
        if (sProjectID) {
          payload.FechaModificacion = formattedFechaModificacion;
        }

        // Validar campos antes de hacer la llamada
        if (!payload.descripcion || !payload.nameProyect) {
          //sap.m.MessageToast.show("Error: Código y nombre del proyecto son obligatorios.");
          console.error("Validación fallida: Falta código o nombre del proyecto", payload);
          return;
        }

        // Log del payload antes de enviarlo
        //console.log("Payload a enviar:", JSON.stringify(payload, null, 2));




        try {
          let oModel = this.getView().getModel();
          let sServiceUrl = oModel.sServiceUrl;

          let response;
          let url = "/odata/v4/datos-cdo/DatosProyect";
          let method = "POST";

          this._oBusyDialog.open();

          if (this._mode === "edit") {

            // Si estás en modo editar, asumes que sProjectID es válido
            if (!sProjectID) {
              sap.m.MessageBox.error("Error: No hay ProjectID para editar.");
              return;
            }

            // Actualización (PATCH)
            url = `/odata/v4/datos-cdo/DatosProyect(${sProjectID})`;
            method = "PATCH";

          } else if (this._mode === "create") {
            // En modo create o sin sProjectID --> creación (POST)
            method = "POST";
            url = "/odata/v4/datos-cdo/DatosProyect";
          }

          // 1️ Obtener el CSRF Token
          let oTokenResponse = await fetch(sServiceUrl, {
            method: "GET",
            headers: { "x-csrf-token": "Fetch" }
          });
          if (!oTokenResponse.ok) {
            throw new Error("Error al obtener el CSRF Token");
          }

          let sCsrfToken = oTokenResponse.headers.get("x-csrf-token");
          if (!sCsrfToken) {
            throw new Error("No se recibió un CSRF Token");
          }

          //console.log(" CSRF Token obtenido:", sCsrfToken);

          // Realizamos la llamada al servicio con el método y URL adecuados
          response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": sCsrfToken
            },
            body: JSON.stringify(payload),
          });



          // Verificar respuesta
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error en ${method} (${response.status}):`, errorText);

            if (response.status === 400) {
              sap.m.MessageToast.show("Error 400: Datos incorrectos o incompletos.");
            } else if (response.status === 404) {
              sap.m.MessageToast.show("Error 404: Endpoint no encontrado.");
            } else if (response.status === 500) {
              sap.m.MessageToast.show("Error 500: Problema en el servidor o base de datos.");
            } else {
              sap.m.MessageToast.show(`Error ${response.status}: ${errorText}`);
            }

            throw new Error(`HTTP ${response.status} - ${errorText}`);
          }


          // Procesar respuesta si es exitosa
          if (response.ok) {
            const result = await response.json();
            //console.log("Respuesta completa de la API:", result);

            // Verifica si la respuesta contiene un campo 'ID' o si está anidado dentro de otro objeto
            const generatedId = result.ID || result.data?.ID; // Si el ID está dentro de un objeto 'data'
            // console.log("ID generado:", generatedId);

            if (generatedId) {


              // Llamadas en paralelo para mejorar rendimiento
              await Promise.all([
                this.insertFacturacion(generatedId),
                this.inserChart(generatedId, sCsrfToken),
                this.insertarProveedor(generatedId),
                this.insertClientFactura(generatedId),
                this.insertRecursosInternos(generatedId),
                this.insertCosumoExterno(generatedId),
                this.insertRecursoExterno(generatedId),
                this.insertarOtrosConceptos(generatedId),
                this.insertServicioInterno(generatedId),
                this.insertGastoViajeInterno(generatedId),
                this.insertServiConsu(generatedId),
                this.insertGastoConsu(generatedId),
                this.insertServicioRecuExter(generatedId),
                this.insertGastoViajeExterno(generatedId),
                this.insertarLicencia(generatedId),
                this.insertPerfilJornadas(generatedId, sCsrfToken),
                this.insertTotalRecuInterno(generatedId, sCsrfToken),
                this.insertTotalConsuExt(generatedId, sCsrfToken),
                this.onUploadFile(generatedId, sCsrfToken),
              ]);
              this._oBusyDialog.close();


              this.getOwnerComponent().getRouter().navTo("app", { newId: generatedId });


            } else {
              console.error("No se generó un ID válido.");
              //sap.m.MessageToast.show("Error: No se generó un ID válido.");
            }
          }
        } catch (error) {
          console.error("Error en la llamada al servicio:", error);
          //sap.m.MessageToast.show("Error al procesar el proyecto: " + error.message);
        }
      },


      onFileSelected: function (oEvent) {
        const file = oEvent.getParameter("files")[0];
        if (file) {
          this._selectedFile = file; // Guardamos el archivo seleccionado
          //console.log("Archivo seleccionado:", file.name);
        }
      },






      onUploadFile: async function (generatedId, sCsrfToken) {

        const existeArchivo = this._archivoIds;
        const file = this._selectedFile;
        if (!file) {
          // sap.m.MessageToast.show("    No se ha seleccionado ningún archivo.");
          return;
        }

        const archivoId = crypto.randomUUID(); // Nuevo UUID
        const fileName = file.name;
        const mimeType = file.type || "application/octet-stream"; // genérico por defecto

        /*console.log(" Archivo seleccionado:");
        console.log(" ID:", archivoId);
        console.log(" Nombre:", fileName);
        console.log(" Tipo MIME:", mimeType);
        console.log(" Tamaño:", file.size, "bytes");
        console.log(" Contenido (Blob):", file);
      */
        try {
          let putRes; //  Declarar aquí para evitar error de "not defined"

          // Paso 1: Enviar metadata
          const metadataPayload = {
            ID: archivoId,
            nombre: fileName,
            tipoMime: mimeType,
            datosProyect_ID: generatedId
          };

          if (existeArchivo) {
            // El archivo ya existe → solo actualizas metadata si cambió
            const putRes = await fetch(`/odata/v4/datos-cdo/Archivos('${existeArchivo}')`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": sCsrfToken
              },
              body: JSON.stringify(metadataPayload)
            });

            //     Subes (reemplazas) el archivo
            putRes = await fetch(`/odata/v4/datos-cdo/Archivos('${existeArchivo}')/contenido/$value`, {
              method: "PUT",
              headers: {
                "X-CSRF-Token": sCsrfToken,
                "Content-Type": mimeType
              },
              body: file
            });
          } else {
            // No existe → creas metadata
            putRes = await fetch(`/odata/v4/datos-cdo/Archivos`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": sCsrfToken
              },
              body: JSON.stringify(metadataPayload)
            });

            //     Subes archivo
            putRes = await fetch(`/odata/v4/datos-cdo/Archivos('${archivoId}')/contenido/$value`, {
              method: "PUT",
              headers: {
                "X-CSRF-Token": sCsrfToken,
                "Content-Type": mimeType
              },
              body: file
            });
          }

          if (!putRes.ok) {
            const putText = await putRes.text();
            throw new Error("    Error subiendo archivo: " + putText);
          }

          //    sap.m.MessageToast.show("    Archivo subido con éxito.");
        } catch (err) {
          console.error("    Error total en upload:", err);
          console.log(err.message);
        }
      },







      insertWorkflow: async function (workflowInstanceId, sEmpleado, generatedId, sCsrfToken) {

        var idWork = this._idWorkflowInstancias;

        //console.log("ID ANTES DE ACTUALIZAR" + idWork);

        var payload = {
          workflowId: workflowInstanceId,
          estado: "Pendiente",
          creadoEn: new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
          creadoPor: sEmpleado,
          datosProyect_ID: generatedId
        };


        let sUrl = "/odata/v4/datos-cdo/WorkflowInstancias";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idWork) {
          sUrl += `(${idWork})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //       MessageToast.show(idWork ? "WorkflowInstancias Actualizado correctamente" : "WorkflowInstancias insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //     MessageToast.show("Error al guardar WorkflowInstancias");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          // MessageToast.show("Error de conexión al guardar WorkflowInstancias");
        }

      },






      insertPerfilJornadas: async function (generatedId, sCsrfToken) {

        var idjornadas = this._idJornadas;
        var sJornadaRecInter = parseFloat(this.byId("inputReInter").getValue());
        var sJornadaConsuEx = parseFloat(this.byId("inputConsuEx").getValue());
        var sJornadaRecurEx = parseFloat(this.byId("inputRcurExtern").getValue());
        var sTotaleJor = parseFloat(this.byId("inputTotalJor").getValue());




        var payload = {
          totalJorRI: sJornadaRecInter,
          totalJorCE: sJornadaConsuEx,
          totalJorRE: sJornadaRecurEx,
          Total: sTotaleJor,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/PerfilTotal";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idjornadas) {
          sUrl += `(${idjornadas})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //          MessageToast.show(idjornadas ? "Perfil actualizado correctamente" : "Perfil insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //          MessageToast.show("Error al guardar el perfil");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          //      MessageToast.show("Error de conexión al guardar perfil");
        }
      },

      insertTotalRecuInterno: async function (generatedId, sCsrfToken) {

        var idtotalRecur = this._idTotalRecInter;
        var sServicios = parseFloat(this.byId("inputServi1").getValue(), 10);
        var sOtroServi = parseFloat(this.byId("inputOtrosServi1").getValue(), 10);
        var sGastoVia = parseFloat(this.byId("inputGastoVia1").getValue(), 10);
        var sTotaleJor = parseFloat(this.byId("totalRecuInter").getValue(), 10);


        //  console.log("ID RECIBIDO DEL INSERT " + idtotalRecur);


        var payload = {
          servicios: sServicios,
          OtrosServicios: sOtroServi,
          GastosdeViaje: sGastoVia,
          Total: sTotaleJor,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/RecurInterTotal";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idtotalRecur) {
          sUrl += `(${idtotalRecur})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //  MessageToast.show(idjornadas ? "Total Recursos Internos  actualizado correctamente" : "Recursos Internos  insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //          MessageToast.show("Error al guardar el Total Recursos internos ");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          //      MessageToast.show("Error de conexión al guardar Total Recursos internos ");
        }
      },


      insertTotalConsuExt: async function (generatedId, sCsrfToken) {

        var idtotalConsuEx = this._idTotalRecInter;
        var sServiciosC = parseFloat(this.byId("inputServi2").getValue());
        var sOtroServiC = parseFloat(this.byId("inputOtroSer2").getValue());
        var sGastoViaC = parseFloat(this.byId("inptGastoVi2").getValue());
        var sTotaleJorC = parseFloat(this.byId("totalConsuExternot").getValue());


        //        console.log("ID RECIBIDO DEL INSERT " + idtotalConsuEx);


        var payload = {
          servicios: sServiciosC,
          OtrosServicios: sOtroServiC,
          GastosdeViaje: sGastoViaC,
          Total: sTotaleJorC,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/ConsuExterTotal";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idtotalConsuEx) {
          sUrl += `(${idtotalConsuEx})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //          MessageToast.show(idtotalConsuEx ? "Total Cosumo Externo   actualizado correctamente" : "Recursos Internos  insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //        MessageToast.show("Error al guardar el Total Cosumo Externo ");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          //       MessageToast.show("Error de conexión al guardar Total Cosumo Externo  ");
        }
      },


      insertTotalRecuExterTotal: async function (generatedId, sCsrfToken) {

        var idRecurExterTotal = this._idtotalRecurExter;
        var sServiciosC = parseFloat(this.byId("inputServi").getValue(), 10);
        var sOtroServiC = parseFloat(this.byId("input10_1724757017406").getValue(), 10);
        var sGastoViaC = parseFloat(this.byId("input9_1724757015442").getValue(), 10);
        var sTotaleJorC = parseFloat(this.byId("totaRecurExterno").getValue(), 10);


        //console.log("ID RECIBIDO DEL INSERT " + idRecurExterTotal);


        var payload = {
          servicios: sServiciosC,
          OtrosServicios: sOtroServiC,
          GastosdeViaje: sGastoViaC,
          Total: sTotaleJorC,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/RecuExterTotal";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idRecurExterTotal) {
          sUrl += `(${idRecurExterTotal})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //       MessageToast.show(idRecurExterTotal ? "Total Cosumo Externo   actualizado correctamente" : "Recursos Internos  insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //     MessageToast.show("Error al guardar el Total Cosumo Externo ");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          // MessageToast.show("Error de conexión al guardar Total Cosumo Externo  ");
        }
      },




      insertTotalInfraestrLicencia: async function (generatedId, sCsrfToken) {

        var idInfraLicencia = this._idInfraLicencia;

        var sTotalInfraEstruc = parseFloat(this.byId("totalInfraestruc").getValue());
        var sTotalLicencia = parseFloat(this.byId("input0_1724758359").getValue(),);


        //console.log("ID RECIBIDO DEL INSERT " + idInfraLicencia);


        var payload = {
          totalInfraestruc: sTotalInfraEstruc,
          totalLicencia: sTotalLicencia,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/InfraestrLicencia";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idInfraLicencia) {
          sUrl += `(${idInfraLicencia})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //       MessageToast.show(idInfraLicencia ? "Total InfraEstructura y Licencia   actualizado correctamente" : "Recursos Internos  insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //       MessageToast.show("Error al guardar el Total InfraEstructura y Licencia ");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          //      MessageToast.show("Error de conexión al guardar InfraEstructura y Licencia  ");
        }
      },







      insertResumenCostesTotal: async function (generatedId, sCsrfToken) {

        var idResumenCostetotal = this._ResumenTotal;


        var sSubtotal = parseFloat(this.byId("totalSubtotal").getValue());
        var sCosteEstrucPorcen = parseFloat(this.byId("input2_172475612").getValue());
        var sCosteEs = parseFloat(this.byId("input2_1724756105").getValue());
        var sMargenPorce = parseFloat(this.byId("input2_17221205").getValue());
        var sMargenIngreso = parseFloat(this.byId("input2_1756121205").getValue());
        var Total = parseFloat(this.byId("input0_1725625161348").getValue());

        //console.log("ID RECIBIDO DEL INSERT " + idResumenCostetotal);


        var payload = {
          Subtotal: sSubtotal,
          CosteEstruPorce: sCosteEstrucPorcen,
          Costeestructura: sCosteEs,
          MargenPorce: sMargenPorce,
          Margeingresos: sMargenIngreso,
          total: Total,
          datosProyect_ID: generatedId
        };

        let sUrl = "/odata/v4/datos-cdo/ResumenCostesTotal";
        let sMethod = "POST";

        //     Aquí decides si haces POST o PATCH
        if (idResumenCostetotal) {
          sUrl += `(${idResumenCostetotal})`;  // Construyes la URL con ID si vas a hacer UPDATE
          sMethod = "PATCH";          // PATCH para actualizar
        }

        try {
          const response = await fetch(sUrl, {
            method: sMethod,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": sCsrfToken
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            //          MessageToast.show(idResumenCostetotal ? "Total idResumenCostetotal   actualizado correctamente" : "Recursos Internos  insertado correctamente");
          } else {
            const error = await response.json();
            console.error("Error:", error);
            //        MessageToast.show("Error al guardar el Total idResumenCostetotal ");
          }
        } catch (err) {
          console.error("Error en fetch:", err);
          //        MessageToast.show("Error de conexión al guardar idResumenCostetotal  ");
        }
      },

















      inserChart: async function (generatedId, sCsrfToken) {

        const saChartdata = this._aChartData;
        const idPlan = this._idPlani; // Asegúrate de que esta variable está correctamente asignada

        //  Nueva función para convertir duración a formato ISO 8601 (Edm.Duration)
        const formatDuration = function (minutes) {
          const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
          const mins = String(minutes % 60).padStart(2, '0');
          return `${hours}:${mins}:00`; // Ejemplo: "06:00:00"
        };

        // Preparamos el array de payload con la estructura adecuada
        const payload2Array = saChartdata.map(chart => ({
          hito: chart.fase,
          fecha_inicio: chart.fechaInicio,
          fecha_fin: chart.fechaFin,
          duracion: formatDuration(chart.duracion), //  nuevo formato correcto
          datosProyect_ID: generatedId
        }));

        try {
          // Obtenemos los registros existentes en la base de datos por 'datosProyect_ID'
          const existingRecordsResponse = await fetch(`/odata/v4/datos-cdo/planificacion?$filter=datosProyect_ID eq '${generatedId}'`, {
            headers: {
              "x-csrf-token": sCsrfToken
            }
          });

          const existingRecords = await existingRecordsResponse.json();
          const existingHitos = existingRecords.value.map(record => record.hito);

          for (const payload2 of payload2Array) {
            if (existingHitos.includes(payload2.hito)) {
              const recordToUpdate = existingRecords.value.find(record => record.hito === payload2.hito);

              if (recordToUpdate && recordToUpdate.id) {
                const response = await fetch(`/odata/v4/datos-cdo/planificacion(${recordToUpdate.id})`, {
                  method: 'PATCH',
                  headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": sCsrfToken
                  },
                  body: JSON.stringify(payload2)
                });

                if (response.ok) {
                  const result = await response.json();
                  //console.log("Planificación actualizada con éxito:", result);
                } else {
                  const errorMessage = await response.text();
                  //console.log("Error al actualizar la planificación:", errorMessage);
                  //sap.m.MessageToast.show("Error al actualizar la planificación: " + errorMessage);
                }
              } else {
                //console.log("ID no válido para el registro a actualizar:", recordToUpdate);
                //sap.m.MessageToast.show("Error al actualizar: ID no válido.");
              }
            } else {
              const response2 = await fetch("/odata/v4/datos-cdo/planificacion", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sCsrfToken
                },
                body: JSON.stringify(payload2)
              });

              if (response2.ok) {
                const result2 = await response2.json();
                //console.log("Planificación guardada con éxito:", result2);
              } else {
                const errorMessage = await response2.text();
                //console.log("Error al guardar la planificación:", errorMessage);
                //sap.m.MessageToast.show("Error al guardar la planificación: " + errorMessage);
              }
            }
          }

        } catch (error) {
          console.error("Error en la operación:", error);
          //sap.m.MessageToast.show("Ocurrió un error durante la operación.");
        }
      },




      ///MEJORA DE PLANIFICACION CON VERIFICACION DE FECHAS 
      /*  inserChart: async function (generatedId, sCsrfToken) {
  
          // 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹
          //     1. Validar fechas antes de insertar
          const sFechaIniForm = this.byId("date_inico").getDateValue();
          const sFechaFinForm = this.byId("date_fin").getDateValue();
        
          if (!sFechaIniForm || !sFechaFinForm) {
            sap.m.MessageToast.show("Debes seleccionar las fechas Inicio y Fin en el formulario antes de guardar.");
            return;
          }
        
          let minFechaInicio = null;
          let maxFechaFin = null;
        
          if (this._aChartData && this._aChartData.length > 0) {
            this._aChartData.forEach(chart => {
              const fechaInicio = chart.fechaInicio ? new Date(chart.fechaInicio) : null;
              const fechaFin = chart.fechaFin ? new Date(chart.fechaFin) : null;
        
              if (fechaInicio) {
                if (!minFechaInicio || fechaInicio < minFechaInicio) {
                  minFechaInicio = fechaInicio;
                }
              }
        
              if (fechaFin) {
                if (!maxFechaFin || fechaFin > maxFechaFin) {
                  maxFechaFin = fechaFin;
                }
              }
            });
          }
        
          let errorFechas = [];
        
          if (minFechaInicio && sFechaIniForm) {
            if (minFechaInicio.getTime() !== sFechaIniForm.getTime()) {
              errorFechas.push(`La fecha de inicio más temprana (${minFechaInicio.toLocaleDateString()}) no coincide con la fecha seleccionada (${sFechaIniForm.toLocaleDateString()}).`);
            }
          }
        
          if (maxFechaFin && sFechaFinForm) {
            if (maxFechaFin.getTime() !== sFechaFinForm.getTime()) {
              errorFechas.push(`La fecha de fin más tardía (${maxFechaFin.toLocaleDateString()}) no coincide con la fecha seleccionada (${sFechaFinForm.toLocaleDateString()}).`);
            }
          }
        
          if (errorFechas.length > 0) {
            sap.m.MessageBox.warning(
              errorFechas.join("\n"),
              { title: "Fechas no coinciden" }
            );
            return;
          }
          // 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹
        
          //     2. Luego continuas con tu lógica de insert
        
          const saChartdata = this._aChartData;
          const idPlan = this._idPlani;
        
          const formatDuration = function (minutes) {
            const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
            const mins = String(minutes % 60).padStart(2, '0');
            return `${hours}:${mins}:00`;
          };
        
          const payload2Array = saChartdata.map(chart => ({
            hito: chart.fase,
            fecha_inicio: chart.fechaInicio,
            fecha_fin: chart.fechaFin,
            duracion: formatDuration(chart.duracion),
            datosProyect_ID: generatedId
          }));
        
          try {
            // Tu lógica de fetch existente aquí
            // ...
          } catch (error) {
            console.error("Error en la operación:", error);
          }
        
        },*/






      insertFacturacion: async function (generatedId) {
        //console.log("ID RECIBIDOOO   " + generatedId); // Este es el ID que debe estar recibiendo la función

        const sTokenG = this._sCsrfToken;
        const oTablaFac = this.byId("table0");
        const itemsF = oTablaFac.getItems();
        const DataFac = [];
        const totalFacturacion = parseFloat(this.byId("text73_172746565340569997").getText());

        const existingFacturacionID = this._FacturacionID; // El ID de la facturación existente (si hay uno)

        //  console.log("Total facturación:", totalFacturacion);

        itemsF.forEach(function (oItem) {
          const aCells = oItem.getCells();
          let fechaEstimida = "";

          // Obtener fecha de DatePicker o Input manual
          if (aCells[0]) {
            if (typeof aCells[0].getDateValue === "function") {
              const oDate = aCells[0].getDateValue();
              if (oDate && !isNaN(oDate.getTime())) {
                fechaEstimida = oDate.toISOString().split("T")[0];
              }
            } else if (typeof aCells[0].getValue === "function") {
              const sValue = aCells[0].getValue();
              const parts = sValue.split("/");
              if (parts.length === 3) {
                const oDate = new Date(parts[2], parts[1] - 1, parts[0]);
                if (!isNaN(oDate.getTime())) {
                  fechaEstimida = oDate.toISOString().split("T")[0];
                }
              }
            }
          }

          const descripcionHito = (aCells[1] && aCells[1].getValue) ? aCells[1].getValue() : "";
          const facturacion = (aCells[2] && aCells[2].getValue) ? parseFloat(aCells[2].getValue(), 10) : 0;

          if (fechaEstimida) {
            DataFac.push({
              fechaEstimida: fechaEstimida,
              descripcionHito: descripcionHito,
              facturacion: facturacion,
              total: totalFacturacion,
              datosProyect_ID: generatedId // Asegúrate de pasar el generatedId aquí
            });
          }
        });

        // Procesar cada registro (POST o PATCH)
        for (let data of DataFac) {
          let method = "POST";
          let url = "/odata/v4/datos-cdo/Facturacion";
          let sBody = { ...data };

          //console.log("Enviando datos: ", JSON.stringify(sBody));

          // Si ya existe un ID de facturación, actualizamos (PATCH)
          if (existingFacturacionID) {
            // Verificar que el ID esté correctamente definido
            if (existingFacturacionID && typeof existingFacturacionID === "string") {
              method = "PATCH";
              url = `/odata/v4/datos-cdo/Facturacion(${existingFacturacionID})`;
            } else {
              console.error("ID de facturación no válido:", existingFacturacionID);
              //sap.m.MessageToast.show("Error: ID de facturación no válido");
              return; // Salir de la función si el ID es inválido
            }
          }

          const response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": sTokenG
            },
            body: JSON.stringify(sBody)
          });

          if (response.ok) {
            const json = await response.json();
            //console.log("Facturación guardada/actualizada:", json);
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar la Facturación:", errorMessage);
            //sap.m.MessageToast.show("Error al guardar la Facturación: " + errorMessage);
          }
        }
      },


      insertarProveedor: async function (generatedId, sProjectID) {

        const stoken = this._sCsrfToken;
        var oTable = this.byId("table2");
        var aItems = oTable.getItems();

        for (let i = 0; i < aItems.length; i++) {
          var oItem = aItems[i];
          var aCells = oItem.getCells();


          var checkCondi = this.byId("box_condi").getSelected(); // Checkbox Condicionado
          var checkProveedor = this.byId("box_prove").getSelected(); // Checkbox Proveedores

          var datos = {
            checkCondi: checkCondi,
            checkProveedor: checkProveedor,
            valueCondi: aCells[0].getValue(),
            valueProvee: aCells[1].getValue(),
            datosProyect_ID: generatedId  // asegúrate de tener esta variable
          };

          // Si ya hay un ID para este índice, hacemos PATCH
          if (this._proveedoresIDs && this._proveedoresIDs[i]) {
            var id = this._proveedoresIDs[i];
            await fetch(`/odata/v4/datos-cdo/ProveedoresC(${id})`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                "x-csrf-token": stoken
              },
              body: JSON.stringify(datos)
            });
          } else {
            // Si no hay ID, es un nuevo registro
            await fetch(`/odata/v4/datos-cdo/ProveedoresC`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                "x-csrf-token": stoken
              },
              body: JSON.stringify(datos)
            });
          }
        }

        //sap.m.MessageToast.show("Proveedores guardados correctamente");
      },








      /*   insertarProveedor: async function (generatedId, sProjectID) {
   
           const stoken = this._sCsrfToken;
           console.log("TOKEN RECIBIDO EN PROVEEDOR:", stoken);
   
   
   
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
   
           let response;
   
   
           // 6. Guardar ProveedoresC (POST o PATCH)
           for (let data of aData) {
             if (sProjectID) {
               // Verificar si el ID ya existe en la base de datos
               let checkResponse = await fetch(`/odata/v4/datos-cdo/ProveedoresC?$filter=datosProyect_ID eq '${sProjectID}'`);
               let checkData = await checkResponse.json();
   
               if (checkData.value && checkData.value.length > 0) {
                 // Si el ID ya existe, hacemos PATCH
                 let existingID = checkData.value[0].ID; // Suponiendo que hay un campo ID único
                 response = await fetch(`/odata/v4/datos-cdo/ProveedoresC(${existingID})`, {
                   method: "PATCH",
                   headers: {
                     "Content-Type": "application/json",
                     "x-csrf-token": stoken
                   },
                   body: JSON.stringify(data)
                 });
               } else {
                 // Si no existe, hacemos POST
                 data.datosProyect_ID = generatedId;
                 response = await fetch("/odata/v4/datos-cdo/ProveedoresC", {
                   method: "POST",
                   headers: {
                     "Content-Type": "application/json",
                     "x-csrf-token": stoken
                   },
                   body: JSON.stringify(data)
                 });
               }
             } else {
               // Si no hay sProjectID, hacer POST directamente
               data.datosProyect_ID = generatedId;
               response = await fetch("/odata/v4/datos-cdo/ProveedoresC", {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   "x-csrf-token": stoken
                 },
                 body: JSON.stringify(data)
               });
             }
   
             let result = await response.json();
             //  console.log("Resultado:", result);
           }
         },*/


      //--- INSERTAR RECURSOS INTERNOS -----





















      insertRecursosInternos: async function (generatedId) {

        const stokenr = this._sCsrfToken;


        // Obtener la tabla por su ID
        const oTable = this.byId("table_dimicFecha");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual


          // Ahora sí puedes obtener recursoID para la fila i
          const recursoID = this._recursosIDs && this._recursosIDs[i] ? this._recursosIDs[i] : null;

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0]?.getSelectedKey() || "";
          const stipoServi = oItem.getCells()[1]?.getSelectedKey() || "";
          const sPerfil = oItem.getCells()[2]?.getSelectedKey() || "";
          const sConcepto = oItem.getCells()[3]?.getValue() || "";
          const sPMJ = parseFloat(oItem.getCells()[4]?.getText() || "0");
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0", 10);
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0", 10);
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0", 10);
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0", 10);
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0", 10);
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0", 10);
          const sTotal = parseFloat(oItem.getCells()[11]?.getText() || "0");
          const stotalRe = parseFloat(oItem.getCells()[12]?.getText() || "0");

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sPerfil) {
            //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            continue; // SALTA A LA SIGUIENTE ITERACIÓN
          }


          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: Number(sTotal.toFixed(2)),
            totalE: Number(stotalRe.toFixed(2)),
            tipoServicio_ID: stipoServi,
            PerfilServicio_ID: sPerfil,
            datosProyect_ID: generatedId,
          };

          // Verificar si existe el ID de recurso para hacer actualización o inserción
          //      const recursoID = oItem.getBindingContext()?.getProperty("ID"); // Obtiene el ID del recurso, si existe

          //console.log("ID DE ACTUALIZACION ----->>>>>", recursoID);
          let response;
          if (recursoID) {
            // Si el ID existe, hacemos PATCH para actualizar
            response = await fetch(`/odata/v4/datos-cdo/RecursosInternos(${recursoID})`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": stokenr

              },
              body: JSON.stringify(payload)
            });



          } else {
            // Si no existe el ID, hacemos POST para insertar
            response = await fetch("/odata/v4/datos-cdo/RecursosInternos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": stokenr
              },
              body: JSON.stringify(payload)
            });
          }

          // Manejo de la respuesta
          if (response.ok) {
            const result = await response.json();
            //console.log("    Respuesta completa de la API:", result);

            const idRecursos = result.ID; // Verificar si `ID` realmente existe en la respuesta
            //console.log("    ID de Recurso obtenido:", idRecursos);

            if (!idRecursos) {
              console.error("    La API no devolvió un ID válido.");
              return;
            }

            this._RecursoInt = idRecursos;


            await this.InsertMesAñoRecurInterno(oItem);

            //console.log("TERMINANDO  RECURSOS------");
            //console.log("Fila " + (i + 1) + " guardada con éxito: RECURSOS INTERNOS", result);
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
            //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
          }
        }
      },




      /*  insertRecursosInternos: async function (generatedId) {
  
          const stokenr = this._sCsrfToken;
  
          const sRecursoID = this._recurso_ID; // ID del proyecto
  
          console.log("ENTRANDO A RECURSO INTERNO ----->>>> " + sRecursoID)
          // Obtener la tabla por su ID
          const oTable = this.byId("table_dimicFecha");
  
          // Obtener todos los elementos del tipo ColumnListItem
          const aItems = oTable.getItems();
  
          // Iterar sobre cada fila
          for (let i = 0; i < aItems.length; i++) {
            const oItem = aItems[i];  // Obtener la fila actual
  
            // Obtener los controles dentro de cada celda
            const sVertical = oItem.getCells()[0]?.getSelectedKey() || "";
            const stipoServi = oItem.getCells()[1]?.getSelectedKey() || "";
            const sPerfil = oItem.getCells()[2]?.getSelectedKey() || "";
            const sConcepto = oItem.getCells()[3]?.getValue() || "";
            const sPMJ = parseFloat(oItem.getCells()[4]?.getText() || "0");
            const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0", 10);
            const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0", 10);
            const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0", 10);
            const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0", 10);
            const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0", 10);
            const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0", 10);
            const sTotal = parseFloat(oItem.getCells()[11]?.getText() || "0");
            const stotalRe = parseFloat(oItem.getCells()[12]?.getText() || "0");
  
            // Validar si todos los datos son válidos
            if (!sVertical || !stipoServi || !sPerfil || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
              //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
              return; // Si hay un error, no se envía la solicitud
            }
            
  
            // Construir el payload para cada fila
            const payload = {
              Vertical_ID: sVertical,
              ConceptoOferta: sConcepto,
              PMJ: sPMJ,
              year1: Number(syear1.toFixed(2)),
              year2: Number(syear2.toFixed(2)),
              year3: Number(syear3.toFixed(2)),
              year4: Number(syear4.toFixed(2)),
              year5: Number(syear5.toFixed(2)),
              year6: Number(syear6.toFixed(2)),
              total: Number(sTotal.toFixed(2)),
              totalE: Number(stotalRe.toFixed(2)),
              tipoServicio_ID: stipoServi,
              PerfilServicio_ID: sPerfil,
              datosProyect_ID: generatedId,
            };
  
            // Verificar si existe el ID de recurso para hacer actualización o inserción
            //      const recursoID = oItem.getBindingContext()?.getProperty("ID"); // Obtiene el ID del recurso, si existe
  
            console.log("ID DE ACTUALIZACION ----->>>>>", sRecursoID);
            let response;
            if (sRecursoID) {
              // Si el ID existe, hacemos PATCH para actualizar
              response = await fetch(`/odata/v4/datos-cdo/RecursosInternos(${sRecursoID})`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": stokenr
  
                },
                body: JSON.stringify(payload)
              });
  
  
  
            } else {
              // Si no existe el ID, hacemos POST para insertar
              response = await fetch("/odata/v4/datos-cdo/RecursosInternos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": stokenr
                },
                body: JSON.stringify(payload)
              });
            }
  
            // Manejo de la respuesta
            if (response.ok) {
              const result = await response.json();
              console.log("    Respuesta completa de la API:", result);
  
              const idRecursos = result.ID; // Verificar si `ID` realmente existe en la respuesta
              console.log("    ID de Recurso obtenido:", idRecursos);
  
              if (!idRecursos) {
                console.error("    La API no devolvió un ID válido.");
                return;
              }
  
              this._RecursoInt = idRecursos;
         
              await this.InsertMesAñoRecurInterno(oItem, idRecursos);
  
              console.log("TERMINANDO  RECURSOS------");
              console.log("Fila " + (i + 1) + " guardada con éxito: RECURSOS INTERNOS", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          }
        },*/
















      //-------------- INSERTAR  RECURSO INTERNO Y MES AÑO ----------------------------------





      InsertMesAñoRecurInterno: async function (oItem) {


        //console.log("ids recibidos  " + JSON.stringify(this._IdFechasPorMes));
        const idRecursos = this._RecursoInt;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(` Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(` Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn(" No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(` No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            //   console.warn(` Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //   console.log(` Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log( Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }


          const claveCompuesta = `${mes}_${idRecursos}`;
          let idFecha = null;

          //  Paso 1: Verificar si ya existe el registro para este mes y recurso
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuReInter?$filter=mesAno eq '${mes}' and RecursosInternos_ID eq '${idRecursos}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMes[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(` No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error(" Error al verificar existencia del registro:", e);
          }

          //  Paso 2: Armar payload
          const payload = {
            RecursosInternos_ID: idRecursos,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`Procesando mes '${mes}' con idFecha: ${idFecha}`);
          ////console.log("(" Payload a enviar:", payload);

          //  Paso 3: Enviar PATCH o POST según si existe o no
          let response;
          try {
            if (idFecha) {
              //console.log(` Haciendo PATCH a ValorMensuReInter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuReInter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log(" Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuReInter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(` Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            }

          } catch (error) {
            console.error(" Error durante envío de datos:", error);
          }

        }
      },





      InsertMesAñoServRecurInterno: async function (oItem) {
        const idRecursos = this._idOtrosGastos;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 13; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(` Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn(" No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(` No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(` Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(` Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("(" Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(` Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idRecursos}`;
          let idFecha = null;

          //  Verificar si ya existe un registro
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuServReInter?$filter=mesAno eq '${mes}' and otrosGastoRecu_ID eq '${idRecursos}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesServInt = this._IdFechasPorMesServInt || {};
                this._IdFechasPorMesServInt[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(` Error al verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error(" Error al verificar existencia del registro:", e);
          }

          //  Armar payload
          const payload = {
            otrosGastoRecu_ID: idRecursos,
            mesAno: mes,
            valor: valor
          };

          //console.log("(` Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("(" Payload a enviar:", payload);

          //  Enviar PATCH o POST
          try {
            let response;
            if (idFecha) {
              //console.log("(` Haciendo PATCH a ValorMensuServReInter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuServReInter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("(" Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuServReInter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(` Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("(" Datos enviados correctamente para el mes:", mes);
            }
          } catch (error) {
            console.error(" Error durante envío de datos:", error);
          }
        }
      },



      InsertMesAñoGastoViajRecuInterno: async function (oItem) {

        const idRecursos = this._idOtrosRecu;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 13; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(` Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(` Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn(" No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(` No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(` Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(` Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("(" Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(` Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idRecursos}`;
          let idFecha = null;

          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuGastViaReInter?$filter=mesAno eq '${mes}' and otrosRecursos_ID eq '${idRecursos}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesGVinter[claveCompuesta] = idFecha; // opcional: almacenar en caché
              }
            } else {
              console.warn(` No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error(" Error al verificar existencia del registro:", e);
          }

          const payload = {
            otrosRecursos_ID: idRecursos,
            mesAno: mes,
            valor: valor
          };

          //console.log("(` Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("(" Payload a enviar:", payload);

          let response;
          try {
            if (idFecha) {
              //console.log("(` Haciendo PATCH a ValorMensuGastViaReInter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuGastViaReInter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("(" Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuGastViaReInter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(` Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            }

          } catch (error) {
            console.error(" Error durante envío de datos:", error);
          }
        }
      },







      convertToInt: function (value) {
        const parsedValue = parseFloat(value, 10);
        return isNaN(parsedValue) ? 0 : parsedValue;
      },









      // ------------ INSERTAR MES AÑO CONSUMO EXTERNO ---------------

      InsertmesAñoConsumoExterno: async function (oItem) {

        const idRecursos = this._ConsuExt;
        const sTokenMe = this._sCsrfToken;
        const idMesañoConsu = this._idleeConsu;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`Tipo de celda inesperado en la columna dinámica (índice ${j}):`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`Celda vacía o nula en columna ${j}, se omite el envío para esta columna.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;

          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("No se pudo obtener el texto del encabezado en la columna", j);
            }
          } else {
            console.warn(`No se puede acceder a la columna en índice ${j}`);
          }

          // Filtro para evitar enviar la columna 'Total'
          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`Se omite la columna ${columnHeader} porque es un total.`);
            continue;
          }

          //console.log("(`Encabezado obtenido (columnHeader) para columna ${j}:`, columnHeader);
          //console.log("(`Valor de la celda (dynamicValue) para columna ${j}:`, dynamicValue);

          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("Datos a enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`No se puede enviar un valor nulo para mes ${mes}.`);
            continue;
          }

          // Verificar si ya existe registro para mes y recurso, para obtener ID y decidir PATCH o POST
          const claveCompuesta = `${mes}_${idRecursos}`;

          let idFecha = null;
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuConsuEx?$filter=mesAno eq '${mes}' and ConsumoExternos_ID eq '${idRecursos}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesConsuEx[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(`No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("Error al verificar existencia del registro:", e);
          }

          // Payload con los nombres y IDs correctos
          const payload = {
            ConsumoExternos_ID: idRecursos,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`Payload preparado para enviar para mes '${mes}' con idFecha: ${idFecha}`, payload);

          try {
            let response;
            if (idFecha) {
              //console.log("(`Haciendo PATCH a ValorMensuConsuEx(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuConsuEx(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuConsuEx", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              throw new Error(`Error en la llamada al servicio: ${response.statusText}, Detalles: ${errorDetails}`);
            } else {
              //console.log("("Datos enviados con éxito para el mes:", mes);
            }
          } catch (error) {
            console.error("Error al enviar los datos:", error);
          }
        }
      },

      InsertmesAñoServConExterno: async function (oItem) {
        const idSerConsu = this._idSerConsu;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 13; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(` Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mesAno, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mesAno}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mesAno}_${idSerConsu}`;

          let idFecha = null;

          //     Verificar si ya existe el registro para este mesAño y servicio consumo externo
          try {
            const filterQuery = `/odata/v4/datos-cdo/ValorMensuServConsuEx?$filter=mesAno eq '${mesAno}' and otrosServiciosConsu_ID eq '${idSerConsu}'`;
            const checkResponse = await fetch(filterQuery, {
              headers: {
                "Accept": "application/json",
                "x-csrf-token": sTokenMe
              }
            });

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              if (data.value.length > 0) {
                idFecha = data.value[0].ID;
                this._IdFechasPorMesServiConsu = this._IdFechasPorMesServiConsu || {};
                this._IdFechasPorMesServiConsu[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          //     Construir payload
          const payload = {
            otrosServiciosConsu_ID: idSerConsu,
            mesAno: mesAno,
            valor: valor
          };

          //console.log("(`    Procesando mesAño '${mesAno}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuServConsuEx(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuServConsuEx(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mesAño:", mesAno);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuServConsuEx", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("(`    Datos enviados con éxito para el mesAño: ${mesAno}`);
            }
          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },






      InsertmesAñoGViajeConExterno: async function (oItem) {
        const idGasViaConsu = this._idGasViaConsu;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 13; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en la columna dinámica (índice ${j}):`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, se omite el envío para esta columna.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;

          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en la columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Se omite la columna ${columnHeader} porque es un total.`);
            continue;
          }

          //console.log("(`    Encabezado obtenido (columnHeader) para columna ${j}:`, columnHeader);
          //console.log("(`    Valor de la celda (dynamicValue) para columna ${j}:`, dynamicValue);

          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos a enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    No se puede enviar un valor nulo para mes ${mes}.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idGasViaConsu}`;
          let idFecha = null;

          // Paso 1: Verificar si ya existe registro para mes y gasto viaje
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuGastoViaConsuEx?$filter=mesAno eq '${mes}' and GastoViajeConsumo_ID eq '${idGasViaConsu}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesGasViaConsuEx = this._IdFechasPorMesGasViaConsuEx || {};
                this._IdFechasPorMesGasViaConsuEx[claveCompuesta] = idFecha; // almacenar en caché si quieres
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          // Paso 2: Armar payload
          const payload = {
            GastoViajeConsumo_ID: idGasViaConsu,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          // Paso 3: Enviar PATCH o POST según si existe o no
          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuGastoViaConsuEx(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuGastoViaConsuEx(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuGastoViaConsuEx", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("("    Datos enviados con éxito para el mes:", mes);
            }
          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },


      //-----------------------------------------------------------------------------------




      //--------------------- INSERT MES AÑO RECURSO EXTERNO -------------------


      //ERROR DE  UPDATE 
      InsertMesAñoRecursoExterno: async function (oItem) {
        const idRecursos = this._idRecursoEx;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, se omite.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idRecursos}`;
          let idFecha = null;

          //     Verificar si ya existe un registro para este mes y recurso externo
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuRecuExter?$filter=mesAno eq '${mes}' and RecursosExternos_ID eq '${idRecursos}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesREExt[claveCompuesta] = idFecha; // guardar id para futuras operaciones si quieres
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          //     Armar payload
          const payload = {
            RecursosExternos_ID: idRecursos,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          //     PATCH o POST según si existe
          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuRecuExter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuRecuExter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuRecuExter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("(`    Datos enviados correctamente para el mes: ${mes}`);
            }
          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },



      InsertMesAñosSerRecursoExterno: async function (oItem) {
        //console.log("("ids recibidos  " + JSON.stringify(this._idleeSerRExt));
        const idServiExterno = this._idServiExterno;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 13; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idServiExterno}`;
          let idFecha = null;

          //     Verificar si ya existe el registro
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuSerExter?$filter=mesAno eq '${mes}' and ServiRecurExterno_ID eq '${idServiExterno}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesSerReEx[claveCompuesta] = idFecha; // Cache opcional
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          const payload = {
            ServiRecurExterno_ID: idServiExterno,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuSerExter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuSerExter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuSerExter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("("    Datos enviados con éxito para el mes:", mes);
            }

          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },


      InsertMesAñosGastoRecursoExterno: async function (oItem) {
        //    //console.log("("IDs recibidos para gasto recurso externo:", JSON.stringify(this._idleeGasRExt));

        const idGasRecuExter = this._idGastoRecuExter;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idGasRecuExter}`;
          let idFecha = null;

          //     Verificar si ya existe el registro para este mes y gasto externo
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuGastoViExter?$filter=mesAno eq '${mes}' and GastoViajeRecExter_ID eq '${idGasRecuExter}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesReEx[claveCompuesta] = idFecha; // opcional: guardar en caché
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          //     Armar payload
          const payload = {
            GastoViajeRecExter_ID: idGasRecuExter,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          //     Enviar PATCH o POST según si existe o no
          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuGastoViExter(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuGastoViExter(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuGastoViExter", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("(`    Datos enviados con éxito para '${mes}'`);
            }

          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },


      //------------------------------------------------------------------------------------






      //---------------------- INSERT MES AÑO OTROS CONCEPTOS ---------


      InsertMesAñosOtrosConceptos: async function (oItem) {

        const idOtrosConcep = this._idOtrosConcep;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar:", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idOtrosConcep}`;
          let idFecha = null;

          //     Paso 1: Verificar si ya existe el registro para este mes y concepto
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensuOtrConcep?$filter=mesAno eq '${mes}' and otrosConceptos_ID eq '${idOtrosConcep}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesOtConp = this._IdFechasPorMesOtConp || {};
                this._IdFechasPorMesOtConp[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          //     Paso 2: Preparar payload
          const payload = {
            otrosConceptos_ID: idOtrosConcep,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar:", payload);

          //     Paso 3: Enviar PATCH o POST
          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensuOtrConcep(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensuOtrConcep(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensuOtrConcep", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            }

            //console.log("(`    Enviado con éxito para mes: ${mes}`);
          } catch (error) {
            console.error("    Error durante envío de datos:", error);
          }
        }
      },





      //---------------------------INSERTAR MES AÑO LICENCIA ----------

      InsertMesAñosLicencia: async function (oItem) {
        const idLicencia = this._idLicencia;
        const sTokenMe = this._sCsrfToken;
        const dynamicColumnsData = {};
        const columns = oItem.getParent().getColumns();

        for (let j = 12; j < oItem.getCells().length; j++) {
          const cell = oItem.getCells()[j];
          let dynamicValue;

          if (typeof cell.getValue === "function") {
            dynamicValue = cell.getValue();
          } else if (typeof cell.getText === "function") {
            dynamicValue = cell.getText();
          } else {
            console.warn(`    Tipo de celda inesperado en columna ${j}:`, cell);
            continue;
          }

          if (dynamicValue === null || dynamicValue === undefined || dynamicValue === "") {
            console.warn(`    Celda vacía o nula en columna ${j}, omitida.`);
            continue;
          }

          let columnHeader = `Columna_${j}`;
          if (columns[j]) {
            const header = columns[j].getHeader();
            if (header && typeof header.getText === "function") {
              columnHeader = header.getText() || columnHeader;
            } else {
              console.warn("    No se pudo obtener el texto del encabezado en columna", j);
            }
          } else {
            console.warn(`    No se puede acceder a la columna en índice ${j}`);
          }

          if (columnHeader.toLowerCase().includes("total")) {
            console.warn(`    Columna ${columnHeader} omitida por ser TOTAL.`);
            continue;
          }

          //console.log("(`    Columna dinámica: '${columnHeader}' con valor: ${dynamicValue}`);
          dynamicColumnsData[columnHeader] = this.convertToInt(dynamicValue);
        }

        //console.log("("    Datos recolectados para enviar (Licencias):", dynamicColumnsData);

        for (const [mes, valor] of Object.entries(dynamicColumnsData)) {
          if (valor === null || valor === undefined) {
            console.warn(`    Valor nulo/undefined para '${mes}', se omite.`);
            continue;
          }

          const claveCompuesta = `${mes}_${idLicencia}`;
          let idFecha = null;

          //     Verificar si ya existe el registro
          try {
            const checkResponse = await fetch(
              `/odata/v4/datos-cdo/ValorMensulicencia?$filter=mesAno eq '${mes}' and licencia_ID eq '${idLicencia}'`,
              {
                headers: {
                  "Accept": "application/json",
                  "x-csrf-token": sTokenMe
                }
              }
            );

            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const results = data.value;

              if (results.length > 0) {
                idFecha = results[0].ID;
                this._IdFechasPorMesLicencia = this._IdFechasPorMesLicencia || {};
                this._IdFechasPorMesLicencia[claveCompuesta] = idFecha;
              }
            } else {
              console.warn(`    No se pudo verificar existencia. Código: ${checkResponse.status}`);
            }
          } catch (e) {
            console.error("    Error al verificar existencia del registro:", e);
          }

          const payload = {
            licencia_ID: idLicencia,
            mesAno: mes,
            valor: valor
          };

          //console.log("(`    Procesando mes '${mes}' con idFecha: ${idFecha}`);
          //console.log("("    Payload a enviar (Licencia):", payload);

          let response;
          try {
            if (idFecha) {
              //console.log("(`    Haciendo PATCH a ValorMensulicencia(${idFecha})`);
              response = await fetch(`/odata/v4/datos-cdo/ValorMensulicencia(${idFecha})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            } else {
              //console.log("("    Haciendo POST para nuevo mes:", mes);
              response = await fetch("/odata/v4/datos-cdo/ValorMensulicencia", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenMe
                },
                body: JSON.stringify(payload)
              });
            }

            if (!response.ok) {
              const errorDetails = await response.text();
              console.error(`    Error ${response.status} - ${response.statusText}:`, errorDetails);
              throw new Error(`Error al enviar: ${response.statusText}`);
            } else {
              //console.log("("    Datos enviados con éxito para el mes:", mes);
            }
          } catch (error) {
            console.error("    Error durante envío de datos (Licencia):", error);
          }
        }
      },




      insertServicioInterno: async function (generatedId) {


        const sTokenG = this._sCsrfToken;

        let response;

        // Obtener la tabla por su ID
        const oTable = this.byId("tableServicioInterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const idOtrGRI = this._idServiInterno && this._idServiInterno[i] ? this._idServiInterno[i] : null;

          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            //  //console.log("("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: Number(sTotal),
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };



          try {
            if (idOtrGRI) {

              response = await fetch(`/odata/v4/datos-cdo/otrosGastoRecu(${idOtrGRI})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });

            } else {
              response = await fetch("/odata/v4/datos-cdo/otrosGastoRecu", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });

            }

            if (response.ok) {
              const result = await response.json();
              const idOtrosGastos = result.ID;


              this._idOtrosGastos = idOtrosGastos;
              await this.InsertMesAñoServRecurInterno(oItem, idOtrosGastos);


              //console.log("("Fila " + (i + 1) + " guardada con éxito: INSERT OTROS GASTOS ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },



      // ------------- SERVICIO DE RECURSO INTERNO 
      /*    insertServicioInterno: async function (generatedId) {
    
            const sTokenG = this._sCsrfToken;
    
            let response;
            const idOtrGRI = this._idlSErvi;
    
            // Obtener la tabla por su ID
            const oTable = this.byId("tableServicioInterno");
    
            // Obtener todos los elementos del tipo ColumnListItem
            const aItems = oTable.getItems();
    
            // Iterar sobre cada fila
            for (let i = 0; i < aItems.length; i++) {
              const oItem = aItems[i];  // Obtener la fila actual
    
              // Obtener los controles dentro de cada celda
              const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
              const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
              const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
              const sPMJ = parseFloat(oItem.getCells()[4].getText()); // Text de PMJ
              const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
              const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
              const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
              const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
              const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
              const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
              const sTotal = parseFloat(oItem.getCells()[11].getText()); // Text de Total
              const stotalRe = parseFloat(oItem.getCells()[12].getText()); // Text de TotalE
    
              // Validar si todos los datos son válidos
              if (!sVertical || !stipoServi || !sConcepto || isNaN(sPMJ) || isNaN(sTotal) || isNaN(stotalRe)) {
                //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
                return; // Si hay un error, no se envía la solicitud
              }
    
              // Construir el payload para cada fila
              const payload = {
                Vertical_ID: sVertical,
                ConceptoOferta: sConcepto,
                PMJ: sPMJ,
                year1: Number(syear1.toFixed(2)),
                year2: Number(syear2.toFixed(2)),
                year3: Number(syear3.toFixed(2)),
                year4: Number(syear4.toFixed(2)),
                year5: Number(syear5.toFixed(2)),
                year6: Number(syear6.toFixed(2)),
                total: Number(sTotal),
                totalE: stotalRe,
                tipoServicio_ID: stipoServi,
                datosProyect_ID: generatedId
              };
    
    
    
              try {
                if (idOtrGRI) {
    
                  response = await fetch(`/odata/v4/datos-cdo/otrosGastoRecu(${idOtrGRI})`, {
                    method: 'PATCH',
                    headers: {
                      "Content-Type": "application/json",
                      "x-csrf-token": sTokenG
                    },
                    body: JSON.stringify(payload)
                  });
    
                } else {
                  response = await fetch("/odata/v4/datos-cdo/otrosGastoRecu", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-csrf-token": sTokenG
                    },
                    body: JSON.stringify(payload)
                  });
    
                }
    
                if (response.ok) {
                  const result = await response.json();
                  const idOtrosGastos = result.ID;
    
    
                  this._idOtrosGastos = idOtrosGastos;
                  await this.InsertMesAñoServRecurInterno(oItem, idOtrosGastos);
    
    
                  //console.log("("Fila " + (i + 1) + " guardada con éxito: INSERT OTROS GASTOS ", result);
                } else {
                  const errorMessage = await response.text();
                  console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
                  //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
                }
              } catch (error) {
                console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
                //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
              }
            }
    
          },
    */



      // ------------ GASTOS DE VIAJE RECURSO INTERNO 
      insertGastoViajeInterno: async function (generatedId) {
        const sTokenor = this._sCsrfToken;


        // Obtener la tabla por su ID
        const oTable = this.byId("tablGastoViajeInterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const sidOtrR = this._IdGastoViajInter && this._IdGastoViajInter[i] ? this._IdGastoViajInter[i] : null;

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            //  //console.log("("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }


          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: Number(sTotal.toFixed(2)),
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };



          let response;

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            if (sidOtrR) {

              response = await fetch(`/odata/v4/datos-cdo/otrosRecursos(${sidOtrR})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenor
                },
                body: JSON.stringify(payload)
              });

            } else {
              response = await fetch("/odata/v4/datos-cdo/otrosRecursos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenor
                },
                body: JSON.stringify(payload)
              });
            }

            if (response.ok) {
              const result = await response.json();
              const idOtrosRecu = result.ID;

              this._idOtrosRecu = idOtrosRecu;

              await this.InsertMesAñoGastoViajRecuInterno(oItem);


              //console.log("("Fila " + (i + 1) + " guardada con éxito: OTROS RECURSOS ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },
      //----------------------------




      // --------------CONSUMO EXTERNO ------------------
      insertCosumoExterno: async function (generatedId) {
        const sTokenG = this._sCsrfToken;


        // Obtener la tabla por su ID
        const oTable = this.byId("tablaConsuExter");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual

          const consuID = this._consumoExternosIDs && this._consumoExternosIDs[i] ? this._consumoExternosIDs[i] : null;
          //   console.log("filA" + JSON.stringify(consuID));

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey() || "ValorPorDefecto"; // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey() || "ValorPorDefecto"; // Select de TipoServicio
          const sPerfil = oItem.getCells()[2].getSelectedKey() || "ValorPorDefecto"; // Select de PerfilServicio
          const sConcepto = oItem.getCells()[3].getValue() || ""; // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()) || 0; // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = parseFloat(oItem.getCells()[11].getText()) || 0; // Text de Total
          const stotalRe = parseFloat(oItem.getCells()[12].getText()) || 0; // Text de TotalE

          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sPerfil || !sConcepto) {
            //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalC: stotalRe,
            tipoServicio_ID: stipoServi,
            PerfilConsumo_ID: sPerfil,
            datosProyect_ID: generatedId
          };

          // Log the payload data being sent for the external consumption
          //console.log("("----->>>>> DATOS TRAIDOS CONSUMO EXTERNO ----- ", payload);

          let response;

          // Lógica de PATCH o POST dependiendo si existe idConst
          if (consuID) {
            //console.log("("Entrando a PATCH");
            response = await fetch(`/odata/v4/datos-cdo/ConsumoExternos(${consuID})`, {
              method: 'PATCH',
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG,
              },
              body: JSON.stringify(payload)
            });
          } else {
            response = await fetch("/odata/v4/datos-cdo/ConsumoExternos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG
              },
              body: JSON.stringify(payload)
            });
          }

          if (response.ok) {
            const result = await response.json();
            const idRecursos = result.ID; // Obtener el ID generado


            this._ConsuExt = idRecursos;

            await this.InsertmesAñoConsumoExterno(oItem);


            //console.log("("Fila " + (i + 1) + " guardada con éxito: CONSUMO EXTERNO", result);
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
            //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
          }
        }
      },




      insertServiConsu: async function (generatedId) {

        const sTokenG = this._sCsrfToken;
        const idSerCon = this._idConOS;

        // Obtener la tabla por su ID
        const oTable = this.byId("idOtroserConsu");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const idSerCon = this._idConsuOtrser && this._idConsuOtrser[i] ? this._idConsuOtrser[i] : null;

          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            //   console.log("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: Number(sTotal.toFixed(2)),
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };

          let response;
          try {


            if (idSerCon) {

              response = await fetch(`/odata/v4/datos-cdo/otrosServiciosConsu(${idSerCon})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG

                },
                body: JSON.stringify(payload)
              });

            } else {
              response = await fetch("/odata/v4/datos-cdo/otrosServiciosConsu", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });

            }


            if (response.ok) {
              const result = await response.json();
              const idSerConsu = result.ID;


              this._idSerConsu = idSerConsu;


              await this.InsertmesAñoServConExterno(oItem);


              //console.log("("Fila " + (i + 1) + " guardada con éxito: INSERT SERVI ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },



      insertGastoConsu: async function (generatedId) {

        const sTokenG = this._sCsrfToken;



        // Obtener la tabla por su ID
        const oTable = this.byId("idGastoViajeConsu");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const idviGas = this._idGastoViajeCOnsu && this._idGastoViajeCOnsu[i] ? this._idGastoViajeCOnsu[i] : null;

          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            // console.log("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };



          let response;

          try {
            // Hacer el fetch de manera asincrónica para cada fila
            if (idviGas) {

              response = await fetch(`/odata/v4/datos-cdo/GastoViajeConsumo(${idviGas})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG

                }, body: JSON.stringify(payload)
              });

            } else {
              response = await fetch("/odata/v4/datos-cdo/GastoViajeConsumo", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });

            }


            if (response.ok) {
              const result = await response.json();
              const idGasViaConsu = result.ID;


              this._idGasViaConsu = idGasViaConsu;

              await this.InsertmesAñoGViajeConExterno(oItem);


              console.log("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES CONSUMO ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },
      //-----------------------------------------------------------

      // Definir el mapa de tablas e IDs en el controlador



      //------------RECURSO EXTERNO ------------------------

      insertRecursoExterno: async function (generatedId) {


        // console.log("ENTRANDO A RECURSOS EXTERNOS ");
        const sTokenG = this._sCsrfToken;

        // Obtener la tabla por su ID
        const oTable = this.byId("tablaRecExterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const recursoID = this._RecursoExterno && this._RecursoExterno[i] ? this._RecursoExterno[i] : null;



          const sVertical = oItem.getCells()[0].getSelectedKey() || "";
          const stipoServi = oItem.getCells()[1].getSelectedKey() || "";
          const sPerfil = oItem.getCells()[2].getValue() || "";
          const sConcepto = oItem.getCells()[3].getValue() || "";
          const sPMJ = parseFloat(oItem.getCells()[4].getValue()) || 0;
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = parseFloat(oItem.getCells()[11].getText()) || 0;
          const stotalRe = parseFloat(oItem.getCells()[12].getText()) || 0;

          // Evitar insertar filas vacías
          if (!sVertical && !stipoServi && !sPerfil && !sConcepto) {
            console.warn("Fila", i + 1, "está vacía, se omite.");
            continue;
          }

          // Construcción del payload
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalR: stotalRe,
            tipoServicio_ID: stipoServi,
            PerfilServicio: sPerfil,
            datosProyect_ID: generatedId
          };

          //console.log(("Payload enviado:", JSON.stringify(payload, null, 2));


          //console.log(("DATOS RECU EXTRA  " + JSON.stringify(payload, null, 2));

          let response;

          try {

            if (recursoID) {

              response = await fetch(`/odata/v4/datos-cdo/RecursosExternos(${recursoID})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG

                },
                body: JSON.stringify(payload)
              });

            } else {
              response = await fetch("/odata/v4/datos-cdo/RecursosExternos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)



              });

            }


            if (response.ok) {
              const result = await response.json();
              const idRecursos = result.ID; // Obtener el ID generado


              //      await this.insertServicioRecuExter(idRecursos);

              this._idRecursoEx = idRecursos
              await this.InsertMesAñoRecursoExterno(oItem);


              //console.log(("Fila " + (i + 1) + " guardada con éxito:RECURSO EXTERNO", result);





            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }

      },



      insertServicioRecuExter: async function (generatedId) {


        const sTokenG = this._sCsrfToken;

        // Obtener la tabla por su ID
        const oTable = this.byId("idServiExterno");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual



          const sidServiRE = this._idOtroSerEx && this._idOtroSerEx[i] ? this._idOtroSerEx[i] : null;



          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            //  //console.log(("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };


          let response;


          // Hacer el fetch de manera asincrónica para cada fila
          if (sidServiRE) {
            response = await fetch(`/odata/v4/datos-cdo/serviRecurExter(${sidServiRE})`, {
              method: 'PATCH',
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG
              },
              body: JSON.stringify(payload)
            });
          } else {
            response = await fetch("/odata/v4/datos-cdo/serviRecurExter", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG
              },
              body: JSON.stringify(payload)
            });
          }

          if (response.ok) {
            const result = await response.json();
            const idServiExterno = result.ID;

            this._idServiExterno = idServiExterno;


            await this.InsertMesAñosSerRecursoExterno(oItem);

            //console.log(("Fila " + (i + 1) + " guardada con éxito: SERVICIO EXTERNO  ", result);
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
            //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
          }

        }
      },






      insertGastoViajeExterno: async function (generatedId) {


        const sTokenG = this._sCsrfToken;
        const sIdGastoEx = this._idReExGas;



        // Obtener la tabla por su ID
        const oTable = this.byId("idGastoRecuExter");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual


          const sIdGastoEx = this._idGasViaReEx && this._idGasViaReEx[i] ? this._idGasViaReEx[i] : null;

          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const stipoServi = oItem.getCells()[1].getSelectedKey(); // Select de TipoServicio
          const sConcepto = oItem.getCells()[3].getValue(); // Input de Concepto Oferta
          const sPMJ = this.convertToInt(oItem.getCells()[4].getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = this.convertToInt(oItem.getCells()[11].getText()); // Text de Total
          const stotalRe = this.convertToInt(oItem.getCells()[12].getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !stipoServi || !sConcepto) {
            //  //console.log(("Por favor, rellena todos los campos en la fila  SERVICIO INTERNO" + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }
          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalE: stotalRe,
            tipoServicio_ID: stipoServi,
            datosProyect_ID: generatedId
          };

          //console.log(("Payload de Gasto Externo:", payload);

          //console.log(("PAYLOAD DE GASTO EXTERNO " + JSON.stringify(payload, null, 2));

          let response;

          if (sIdGastoEx) {
            response = await fetch(`/odata/v4/datos-cdo/GastoViajeRecExter(${sIdGastoEx})`, {
              method: 'PATCH',
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG
              },
              body: JSON.stringify(payload)
            });
          } else {
            response = await fetch("/odata/v4/datos-cdo/GastoViajeRecExter", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": sTokenG
              },
              body: JSON.stringify(payload)
            });
          }

          if (response.ok) {
            const result = await response.json();
            const idGasRecuExter = result.ID;


            this._idGastoRecuExter = idGasRecuExter;

            await this.InsertMesAñosGastoRecursoExterno(oItem);

            //console.log(("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES RECURSO EXTERNO  ", result);
          } else {
            const errorMessage = await response.text();
            console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
            //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
          }
        }
      },



      insertarOtrosConceptos: async function (generatedId) {
        const sTokenG = this._sCsrfToken;

        // Obtener la tabla por su ID
        const oTable = this.byId("tablaInfrestuctura");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual


          const idOtroC = this._OtrosConceptos && this._OtrosConceptos[i] ? this._OtrosConceptos[i] : null;

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const sConcepto = oItem.getCells()[2].getValue(); // Input de Concepto Oferta
          const sPMJ = parseFloat(oItem.getCells()[3]?.getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[4]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const sTotal = parseFloat(oItem.getCells()[10]?.getText()); // Text de Total
          const stotalRe = parseFloat(oItem.getCells()[11]?.getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !sConcepto) {
            //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalC: stotalRe,
            datosProyect_ID: generatedId
          };



          let response;
          try {



            if (idOtroC) {

              response = await fetch(`/odata/v4/datos-cdo/otrosConceptos(${idOtroC})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG,
                },
                body: JSON.stringify(payload)
              });
            } else {
              response = await fetch("/odata/v4/datos-cdo/otrosConceptos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });
            }

            if (response.ok) {
              const result = await response.json();
              const idOtrosConcep = result.ID;


              this._idOtrosConcep = idOtrosConcep;


              await this.InsertMesAñosOtrosConceptos(oItem);

              //console.log(("Fila " + (i + 1) + " guardada con éxito: INSERTVIAJES RECURSO EXTERNO  ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }
      },















      insertarLicencia: async function (generatedId) {

        const sTokenG = this._sCsrfToken;

        // Obtener la tabla por su ID
        const oTable = this.byId("tablaLicencia");

        // Obtener todos los elementos del tipo ColumnListItem
        const aItems = oTable.getItems();

        // Iterar sobre cada fila
        for (let i = 0; i < aItems.length; i++) {
          const oItem = aItems[i];  // Obtener la fila actual
          const sidLinc = this._idLicencia && this._idLicencia[i] ? this._idLicencia[i] : null;

          // Obtener los controles dentro de cada celda
          const sVertical = oItem.getCells()[0].getSelectedKey(); // Select de Vertical
          const sConcepto = oItem.getCells()[2].getValue(); // Input de Concepto Oferta 
          const sPMJ = parseFloat(oItem.getCells()[3]?.getText()); // Text de PMJ
          const syear1 = parseFloat(oItem.getCells()[5]?.getText() || "0");
          const syear2 = parseFloat(oItem.getCells()[6]?.getText() || "0");
          const syear3 = parseFloat(oItem.getCells()[7]?.getText() || "0");
          const syear4 = parseFloat(oItem.getCells()[8]?.getText() || "0");
          const syear5 = parseFloat(oItem.getCells()[9]?.getText() || "0");
          const syear6 = parseFloat(oItem.getCells()[10]?.getText() || "0");
          const sTotal = parseFloat(oItem.getCells()[4]?.getText()); // Text de Total
          const stotalRe = parseFloat(oItem.getCells()[5]?.getText()); // Text de TotalE


          // Validar si todos los datos son válidos
          if (!sVertical || !sConcepto) {
            //sap.m.MessageToast.show("Por favor, rellena todos los campos en la fila " + (i + 1) + " correctamente.");
            continue; // Si hay un error, no se envía la solicitud
          }

          // Construir el payload para cada fila
          const payload = {
            Vertical_ID: sVertical,
            ConceptoOferta: sConcepto,
            PMJ: sPMJ,
            year1: Number(syear1.toFixed(2)),
            year2: Number(syear2.toFixed(2)),
            year3: Number(syear3.toFixed(2)),
            year4: Number(syear4.toFixed(2)),
            year5: Number(syear5.toFixed(2)),
            year6: Number(syear6.toFixed(2)),
            total: sTotal,
            totalC: stotalRe,
            datosProyect_ID: generatedId
          };

          let response;


          try {
            // Hacer el fetch de manera asincrónica para cada fila
            if (sidLinc) {

              response = await fetch(`/odata/v4/datos-cdo/LicenciasCon(${sidLinc})`, {
                method: 'PATCH',
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG,
                },
                body: JSON.stringify(payload)
              });
            } else {
              response = await fetch("/odata/v4/datos-cdo/LicenciasCon", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(payload)
              });
            }

            if (response.ok) {
              const result = await response.json();
              const idLicencia = result.ID;

              this._idLicencia = idLicencia;

              //  this._idLicencia = idLicencia;


              await this.InsertMesAñosLicencia(oItem);

              //console.log(("Fila " + (i + 1) + " guardada con éxito: INSERTAR LICENCIA ", result);
            } else {
              const errorMessage = await response.text();
              console.error("Error al guardar la fila " + (i + 1) + ":", errorMessage);
              //sap.m.MessageToast.show("Error al guardar la fila " + (i + 1) + ": " + errorMessage);
            }
          } catch (error) {
            console.error("Error en la llamada al servicio para la fila " + (i + 1) + ":", error);
            //sap.m.MessageToast.show("Error en la llamada al servicio para la fila " + (i + 1) + ": " + error.message);
          }
        }


      },
      //----------------------------------------------------


      //--------------------METODO ACTUALIZAR  ------------------------------------

      // Función para convertir texto a entero con manejo de errores
      convertToInt: function (text) {
        const parsed = parseFloat(text, 10);
        return isNaN(parsed) ? null : parsed;
      },

      insertClientFactura: async function (generatedId) {
        const sTokenG = this._sCsrfToken;
        var oTablaFac = this.byId("table_clienteFac");
        var aItems = oTablaFac.getItems();
        var aData = [];
        var totalOferta = 0;

        aItems.forEach(function (oItem) {
          var aCells = oItem.getCells();
          var valueJudi = aCells[0] ? (aCells[0].getMetadata().getName() === "sap.m.Input" ? aCells[0].getValue() : aCells[0].getText()) : "";
          var valueOferta = aCells[1] ? (aCells[1].getMetadata().getName() === "sap.m.Input" ? aCells[1].getValue() : aCells[1].getText()) : "";

          // Saltar fila de Total
          if (valueJudi.trim() === "Total") {
            return;
          }

          var totalOfer = this.byId("text73_172746565340567").getText();
          var totalOfer = parseFloat(totalOfer.replace('%', '').replace(',', '.')) || 0;

          if (valueJudi === "" && valueOferta === "") {
            return; // Omitir filas vacías
          }

          aData.push({
            juridica: valueJudi,
            oferta: valueOferta,
            total: totalOfer,
            datosProyect_ID: generatedId
          });

          totalOferta += parseFloat(valueOferta) || 0;

        }.bind(this));

        try {
          const checkResponse = await fetch(`/odata/v4/datos-cdo/ClientFactura?$filter=datosProyect_ID eq '${generatedId}'`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "x-csrf-token": sTokenG
            }
          });

          if (!checkResponse.ok) throw new Error("Error al verificar existencia de las Facturas");

          const existingData = await checkResponse.json();
          const existingRecords = existingData.value || [];

          for (let data of aData) {
            let recordToUpdate = existingRecords.find(record => record.juridica === data.juridica);

            if (recordToUpdate) {
              const updateResponse = await fetch(`/odata/v4/datos-cdo/ClientFactura(${recordToUpdate.ID})`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(data)
              });

              if (updateResponse.ok) {
                //console.log((`Factura actualizada:`, await updateResponse.json());
              } else {
                //console.log(("Error al actualizar Factura:", await updateResponse.text());
                //sap.m.MessageToast.show("Error al actualizar Factura.");
              }
            } else {
              const insertResponse = await fetch("/odata/v4/datos-cdo/ClientFactura", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-csrf-token": sTokenG
                },
                body: JSON.stringify(data)
              });

              if (insertResponse.ok) {
                //console.log(("Factura insertada:", await insertResponse.json());
              } else {
                //console.log(("Error al insertar Factura:", await insertResponse.text());
                //sap.m.MessageToast.show("Error al insertar Factura.");
              }
            }
          }

        } catch (error) {
          console.error("Error en la operación:", error);
          //sap.m.MessageToast.show("Ocurrió un error en la operación.");
        }

        //sap.m.MessageToast.show("Total de oferta: " + totalOferta);
      },


      /* insertClientFactura: async function (generatedId) {
         const sTokenG = this._sCsrfToken;
         var oTablaFac = this.byId("table_clienteFac");
         var aItems = oTablaFac.getItems();
         var aData = [];
         var totalOferta = 0; // Variable para acumular la suma de "oferta"
 
         // --- Recopilar datos de la tabla ---
         aItems.forEach(function (oItem, index) {
           if (index === aItems.length - 1) {
             return; // Omitir la última fila
           }
 
           var aCells = oItem.getCells();
           var valueJudi = aCells[0] ? (aCells[0].getMetadata().getName() === "sap.m.Input" ? aCells[0].getValue() : aCells[0].getText()) : "";
           var valueOferta = aCells[1] ? (aCells[1].getMetadata().getName() === "sap.m.Input" ? aCells[1].getValue() : aCells[1].getText()) : "";
           var totalOfer = this.byId("text73_172746565340567").getText();
 
           if (valueJudi !== "" || valueOferta !== "") {
             aData.push({
               juridica: valueJudi,
               oferta: valueOferta,
               total: totalOfer,
               datosProyect_ID: generatedId
             });
           }
         }.bind(this));
 
         //console.log(("Total de la columna oferta: ", totalOferta);
 
         try {
           // --- 1. Obtener TODAS las facturas existentes con este projectID ---
           const checkResponse = await fetch(`/odata/v4/datos-cdo/ClientFactura?$filter=datosProyect_ID eq '${generatedId}'`, {
             method: "GET",
             headers: {
               "Accept": "application/json",
               "x-csrf-token": sTokenG
             }
           });
 
           if (!checkResponse.ok) {
             throw new Error("Error al verificar existencia de las Facturas");
           }
 
           const existingData = await checkResponse.json();
           const existingRecords = existingData.value || []; 
 
           // --- 2. Procesar cada entrada en aData ---
           for (let data of aData) {
             let recordToUpdate = existingRecords.find(record => record.juridica === data.juridica);
 
             if (recordToUpdate) {
               // **Si existe, hacer PATCH usando el ID de ClientFactura**
               const updateResponse = await fetch(`/odata/v4/datos-cdo/ClientFactura(${recordToUpdate.ID})`, {
                 method: "PATCH",
                 headers: {
                   "Content-Type": "application/json",
                   "x-csrf-token": sTokenG
                 },
                 body: JSON.stringify(data)
               });
 
               if (updateResponse.ok) {
                 console.log(`Factura con ID ${recordToUpdate.ID} actualizada con éxito:`, await updateResponse.json());
               } else {
                 console.log("Error al actualizar la Factura:", await updateResponse.text());
                 //sap.m.MessageToast.show("Error al actualizar la Factura.");
               }
             } else {
               // **Si NO existe, hacer POST**
               const insertResponse = await fetch("/odata/v4/datos-cdo/ClientFactura", {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   "x-csrf-token": sTokenG
                 },
                 body: JSON.stringify(data)
               });
 
               if (insertResponse.ok) {
                 console.log("Factura guardada con éxito:", await insertResponse.json());
               } else {
                 console.log("Error al guardar la Factura:", await insertResponse.text());
                 //sap.m.MessageToast.show("Error al guardar la Factura.");
               }
             }
           }
         } catch (error) {
           console.error("Error en la operación:", error);
           //sap.m.MessageToast.show("Ocurrió un error en la operación.");
         }
 
         // --- Mostrar el total acumulado ---
         //sap.m.MessageToast.show("El total de la columna oferta es: " + totalOferta);
       },*/



      /*   insertClientFactura: async function (generatedId) {
   
           const sTokenG = this._sCsrfToken;
   
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
               headers: {
                 "Content-Type": "application/json",
                 "x-csrf-token": sTokenG
   
               },
               body: JSON.stringify(data)
             });
   
             if (insert4.ok) {
               const errorInfo = await insert4.json();
             } else {
               const errorMessage = await insert4.text();
               console.log("Error al guardar la Facturacion:", errorMessage);
               //sap.m.MessageToast.show("Error al guardar la Facturacion: " + errorMessage);
             }
           }
   
           // También puedes mostrar el total usando un mensaje SAPUI5
           //sap.m.MessageToast.show("El total de la columna oferta es: " + totalOferta);
         },*/




      metodoSumar: function () {


        var oTablaFac = this.byId("table_clienteFac");
        var aItems = oTablaFac.getItems();
        var totalOferta = 0;

        //      console.log("Cantidad de filas en la tabla:", aItems.length);

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
            // console.log("Fila:", index, "Valor de la celda:", valueOferta, "-> Valor numérico:", numericValue);

            // Solo sumar si valueOferta es un número válido
            if (!isNaN(numericValue)) {
              totalOferta += numericValue; // Solo sumar si es un número
              //console.log(("Total acumulado hasta ahora:", totalOferta); // Imprimir el total acumulado
            }
          }
        });

        // Actualiza el control Text con el total de la oferta
        this.byId("text73_172746565340567").setText(totalOferta.toFixed(2) + "%");


        //   console.log("Total de la columna oferta:", totalOferta);


        this._totalOferta = totalOferta;

      },


      metodoSumarFac: function () {
        var oTablaFac = this.byId("table0");
        var aItems = oTablaFac.getItems();
        var totalOferta = 0;

        //console.log(("Cantidad de filas en la tabla:", aItems.length);

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
            //console.log(("Fila:", index, "Valor de la celda:", valueOferta, "-> Valor numérico:", numericValue);

            // Solo sumar si valueOferta es un número válido
            if (!isNaN(numericValue)) {
              totalOferta += numericValue; // Solo sumar si es un número
              //console.log(("Total acumulado hasta ahora:", totalOferta); // Imprimir el total acumulado
            }
          }
        });

        // Actualiza el control Text con el total de la oferta
        this.byId("text73_172746565340569997").setText(totalOferta.toFixed(2));

        ////console.log(("Total de la columna oferta:", totalOferta);
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
        this.CaseAno();
      },



      CaseAno: function (tableId) {
        //  //console.log("TABLA RECIBIDA  : " + tableId);

        var oDatePickerInicio = this.getView().byId("date_inico");
        var oDatePickerFin = this.getView().byId("date_fin");



        var sFechaInicio = oDatePickerInicio.getDateValue();
        var sFechaFin = oDatePickerFin.getDateValue();

        if (sFechaInicio && sFechaFin) {
          var anioInicio = sFechaInicio.getFullYear();
          var anioFin = sFechaFin.getFullYear();

          if (anioInicio > anioFin) {
            sap.m.MessageToast.show("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
          }

          var aniosEnRango = [];
          for (var i = anioInicio; i <= anioFin; i++) {
            aniosEnRango.push(i);
          }


          let resultado = this.calcularDistribucionInput();
          if (!resultado || !resultado.valoresDistribuidos) return;

          let valoresDistribuidos = resultado.valoresDistribuidos;
          let acumulado = resultado.acumuladoTextPorTablaYAnio;

          if (!valoresDistribuidos || Object.keys(valoresDistribuidos).length === 0) {
            //         sap.m.MessageToast.show("No se pudo calcular la distribución.");
            return;
          }

          //   //console.log("Distribución de fechas para las tablas:", valoresDistribuidos);

          var that = this;
          var Totalporcentaje = 0;
          var valoresPorAno = {};
          var valoresPorAnoPorInput = {};
          var totalesPorInput = {};

          aniosEnRango.forEach(anio => {
            valoresPorAno[anio] = 0;
            valoresPorAnoPorInput[anio] = {};
          });

          Object.keys(valoresDistribuidos).forEach(function (table) {
            aniosEnRango.forEach(function (anio) {
              if (valoresDistribuidos[table] && valoresDistribuidos[table][anio]) {
                valoresDistribuidos[table][anio].forEach(distribucion => {
                  var inputName = distribucion.elemento;
                  var vValor = parseFloat(distribucion.valor) || 0;

                  valoresPorAno[anio] += vValor;
                  Totalporcentaje += vValor;

                  if (!valoresPorAnoPorInput[anio][inputName]) {
                    valoresPorAnoPorInput[anio][inputName] = 0;
                  }
                  valoresPorAnoPorInput[anio][inputName] += vValor;

                  // Acumular total general por input
                  if (!totalesPorInput[inputName]) {
                    totalesPorInput[inputName] = 0;
                  }
                  totalesPorInput[inputName] += vValor;
                });
              }
            });
          });

          aniosEnRango.forEach(anio => {
            switch (anio) {
              case 2025:
                that.getView().byId("tipoS2025").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteT2025").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("cellCostesTotales_1_1").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TRecurso2025").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteD2025").setText((valoresPorAnoPorInput[anio]["Input2"] || 0).toFixed(2) + "€");
                that.getView().byId("costes_indirectos2025").setText((valoresPorAnoPorInput[anio]["Input3"] || 0).toFixed(2) + "€");



                this.getView().byId("text129CosteDi").setText((acumulado[anio]?.table_dimicFecha ?? 0).toFixed(2) + "€"); // Coste directo 2025 
                this.getView().byId("text130CosteDi").setText((acumulado[anio]?.tablaConsuExter ?? 0).toFixed(2) + "€");
                this.getView().byId("text210").setText((acumulado[anio]?.tablGastoViajeInterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text400").setText((acumulado[anio]?.tablaRecExterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text133").setText((acumulado[anio]?.tablaLicencia ?? 0).toFixed(2) + "€");
                this.getView().byId("text200").setText((acumulado[anio]?.tablaInfrestuctura ?? 0).toFixed(2) + "€");


                let total2025 =
                  (acumulado[2025]?.table_dimicFecha || 0) +
                  (acumulado[2025]?.tablaConsuExter || 0) +
                  (acumulado[2025]?.tablGastoViajeInterno || 0) +
                  (acumulado[2025]?.tablaRecExterno || 0) +
                  (acumulado[2025]?.tablaLicencia || 0) +
                  (acumulado[2025]?.tablaInfrestuctura || 0);


                that.getView().byId("text75_1729073618729").setText(total2025.toFixed(2) + "€");


                break;


              case 2026:
                that.getView().byId("tipoS2026").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TRecurso2026").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteT2026").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("cellCostesTotales_1_2").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteD2026").setText((valoresPorAnoPorInput[anio]["Input2"] || 0).toFixed(2) + "€");
                that.getView().byId("costes_indirectos2026").setText((valoresPorAnoPorInput[anio]["Input3"] || 0).toFixed(2) + "€");




                that.getView().byId("text128CosteDi").setText((acumulado[anio]?.table_dimicFecha ?? 0).toFixed(2) + "€");
                that.getView().byId("text134CosteDi").setText((acumulado[anio]?.tablaConsuExter ?? 0).toFixed(2) + "€");
                this.getView().byId("text211").setText((acumulado[anio]?.tablGastoViajeInterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text401").setText((acumulado[anio]?.tablaRecExterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text1341").setText((acumulado[anio]?.tablaLicencia ?? 0).toFixed(2) + "€");
                this.getView().byId("text201").setText((acumulado[anio]?.tablaInfrestuctura ?? 0).toFixed(2) + "€");


                let total2026 =
                  (acumulado[2026]?.table_dimicFecha || 0) +
                  (acumulado[2026]?.tablaConsuExter || 0) +
                  (acumulado[2026]?.tablGastoViajeInterno || 0) +
                  (acumulado[2026]?.tablaRecExterno || 0) +
                  (acumulado[2026]?.tablaLicencia || 0) +
                  (acumulado[2026]?.tablaInfrestuctura || 0);


                that.getView().byId("text76_1729073618732").setText(total2026.toFixed(2) + "€");


                //   that.getView().byId("text128CosteDi").setText((acumulado[anio]["table_dimicFecha"] || 0).toFixed(2) + "€"); //coste directo 2026 


                break;


              case 2027:
                that.getView().byId("tipoS2027").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");

                that.getView().byId("TRecurso2027").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteT2027").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteD2027").setText((valoresPorAnoPorInput[anio]["Input2"] || 0).toFixed(2) + "€");
                that.getView().byId("costes_indirectos2027").setText((valoresPorAnoPorInput[anio]["Input3"] || 0).toFixed(2) + "€");

                that.getView().byId("text135").setText((acumulado[anio]?.tablaConsuExter ?? 0).toFixed(2) + "€");
                that.getView().byId("text140CosteDi").setText((acumulado[anio]?.table_dimicFecha ?? 0).toFixed(2) + "€");
                this.getView().byId("text212").setText((acumulado[anio]?.tablGastoViajeInterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text402").setText((acumulado[anio]?.tablaRecExterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text1352").setText((acumulado[anio]?.tablaLicencia ?? 0).toFixed(2) + "€");
                this.getView().byId("text202").setText((acumulado[anio]?.tablaInfrestuctura ?? 0).toFixed(2) + "€");




                let total2027 =
                  (acumulado[2027]?.table_dimicFecha || 0) +
                  (acumulado[2027]?.tablaConsuExter || 0) +
                  (acumulado[2027]?.tablGastoViajeInterno || 0) +
                  (acumulado[2027]?.tablaRecExterno || 0) +
                  (acumulado[2027]?.tablaLicencia || 0) +
                  (acumulado[2027]?.tablaInfrestuctura || 0);


                that.getView().byId("text77_1729073618734").setText(total2027.toFixed(2) + "€");


                break;

              case 2028:
                that.getView().byId("tipoS2028").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TRecurso2027").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteT2028").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");


                that.getView().byId("text141CosteDi").setText((acumulado[anio]?.table_dimicFecha ?? 0).toFixed(2) + "€");
                that.getView().byId("text136").setText((acumulado[anio]?.tablaConsuExter ?? 0).toFixed(2) + "€");
                this.getView().byId("text213").setText((acumulado[anio]?.tablGastoViajeInterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text403").setText((acumulado[anio]?.tablaRecExterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text1363").setText((acumulado[anio]?.tablaLicencia ?? 0).toFixed(2) + "€");
                this.getView().byId("text203").setText((acumulado[anio]?.tablaInfrestuctura ?? 0).toFixed(2) + "€");




                let total2028 =
                  (acumulado[2028]?.table_dimicFecha || 0) +
                  (acumulado[2028]?.tablaConsuExter || 0) +
                  (acumulado[2028]?.tablGastoViajeInterno || 0) +
                  (acumulado[2028]?.tablaRecExterno || 0) +
                  (acumulado[2028]?.tablaLicencia || 0) +
                  (acumulado[2028]?.tablaInfrestuctura || 0);


                that.getView().byId("text300").setText(total2028.toFixed(2) + "€");


                break;

              case 2029:
                that.getView().byId("tipoS2029").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TRecurso2027").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");
                that.getView().byId("TSCosteT2029").setText((valoresPorAnoPorInput[anio]["Input1"] || 0).toFixed(2) + "€");


                that.getView().byId("text143CosteDi").setText((acumulado[anio]?.table_dimicFecha ?? 0).toFixed(2) + "€");
                this.getView().byId("text214").setText((acumulado[anio]?.tablGastoViajeInterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text138").setText((acumulado[anio]?.tablaConsuExter ?? 0).toFixed(2) + "€");
                this.getView().byId("text404").setText((acumulado[anio]?.tablaRecExterno ?? 0).toFixed(2) + "€");
                this.getView().byId("text1374").setText((acumulado[anio]?.tablaLicencia ?? 0).toFixed(2) + "€");
                this.getView().byId("text204").setText((acumulado[anio]?.tablaInfrestuctura ?? 0).toFixed(2) + "€");




                let total2029 =
                  (acumulado[2029]?.table_dimicFecha || 0) +
                  (acumulado[2029]?.tablaConsuExter || 0) +
                  (acumulado[2029]?.tablGastoViajeInterno || 0) +
                  (acumulado[2029]?.tablaRecExterno || 0) +
                  (acumulado[2029]?.tablaLicencia || 0) +
                  (acumulado[2029]?.tablaInfrestuctura || 0);


                that.getView().byId("text301").setText(total2029.toFixed(2) + "€");

                break;
            }
          });

          // Mostrar los totales generales
          that.getView().byId("tipoSTotal").setText((totalesPorInput["Input1"] || 0).toFixed(2) + "€");
          that.getView().byId("TRecursoTotal").setText((totalesPorInput["Input1"] || 0).toFixed(2) + "€");
          that.getView().byId("TSCosteTotalD").setText((totalesPorInput["Input2"] || 0).toFixed(2) + "€");
          that.getView().byId("TSCosteTotal").setText((totalesPorInput["Input1"] || 0).toFixed(2) + "€");
          that.getView().byId("cellCostesTotales_1_7").setText((totalesPorInput["Input1"] || 0).toFixed(2) + "€");

          that.getView().byId("costes_indirectosTotal").setText((totalesPorInput["Input3"] || 0).toFixed(2) + "€");


          that.getView().byId("text70_1729079344938").setText((totalesPorInput["Text1"] || 0).toFixed(2) + "€"); // 2025 
          that.getView().byId("text137").setText((totalesPorInput["Text4"] || 0).toFixed(2) + "€");

          //  //console.log("TOTALES DE CASE AÑO : " + Totalporcentaje);
        } else {
          //    sap.m.MessageToast.show("Por favor, seleccione ambas fechas.");
        }
      },

      // Fechas dinamicas y tabla dinamica---------  
      onDateChange: function () {
        this.updateVizFrame();
      },
      //-------------------------------------------






      fechasDinamicas: function () {
        var oModelDynamic = this.getView().getModel("dynamicInputs");
        var oPreviousData = null;

        if (!oModelDynamic) {
          oModelDynamic = new sap.ui.model.json.JSONModel();
          this.getView().setModel(oModelDynamic, "dynamicInputs");
        } else {
          oPreviousData = oModelDynamic.getData();
        }


        this._inputsDinamicos = {};
        this._tableValues = {};
        this._yearlySums = {};
        this._monthlySums = {};

        var startDatePicker = this.getView().byId("date_inico");
        var endDatePicker = this.getView().byId("date_fin");

        if (!startDatePicker || !endDatePicker) {
          console.error("Error: No se pudieron obtener los DatePickers.");
          return;
        }

        var startDate = startDatePicker.getDateValue();
        var endDate = endDatePicker.getDateValue();

        if (!startDate || !endDate) {
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
          "tablaInfrestuctura",
          "tablaLicencia",
          "tableServicioInterno",
          "tablGastoViajeInterno"
        ];

        var oDynamicData = {};

        tableIds.forEach((tableId) => {
          var oTable = this.getView().byId(tableId);
          if (!oTable) {
            console.error("Error: No se pudo obtener la tabla con ID " + tableId);
            return;
          }

          // Eliminar columnas dinámicas previas
          var columnCount = oTable.getColumns().length;
          for (var j = columnCount - 1; j >= 0; j--) {
            var columnHeader = oTable.getColumns()[j].getHeader();
            if (columnHeader && /\d{4}-\w+/.test(columnHeader.getText())) {
              oTable.removeColumn(oTable.getColumns()[j]);
            }
          }
          oTable.getItems().forEach((oRow) => {
            var currentCells = oRow.getCells();
            var staticCellCount = oTable.getColumns().filter(col => {
              var header = col.getHeader();
              return !(header && /\d{4}-\w+/.test(header.getText()));
            }).length;

            while (oRow.getCells().length > staticCellCount) {
              oRow.removeCell(oRow.getCells().length - 1);
            }
          });
          var totalColumnIndex = this.findTotalColumnIndex(oTable);

          oDynamicData[tableId] = {};

          for (var i = 0; i <= diffMonths; i++) {
            var dateCol = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            var year = dateCol.getFullYear();
            var monthName = dateCol.toLocaleString("default", { month: "long" });
            var keyCol = year + "-" + monthName;

            // Insertar columna
            var oColumn = new sap.m.Column({
              header: new sap.m.Label({ text: keyCol }),
              width: "100px"
            });
            oTable.insertColumn(oColumn, totalColumnIndex + 1 + i);

            oTable.getItems().forEach((oRow, rowIndex) => {
              oDynamicData[tableId][rowIndex] = oDynamicData[tableId][rowIndex] || {};

              // Valor previo: intentamos obtener de oPreviousData si existe
              var prevVal = "";
              if (oPreviousData && oPreviousData[tableId] && oPreviousData[tableId][rowIndex]) {
                prevVal = oPreviousData[tableId][rowIndex][keyCol] || "";
              }

              var oInput = new sap.m.Input({
                placeholder: "0.00",
                value: prevVal,
                change: this.handleInputChange.bind(this, tableId, rowIndex, i, year)
              });
              oInput.attachBrowserEvent("paste", this._onPasteValues.bind(this));

              oRow.addCell(oInput);

              // Guardar referencia opcional
              this._inputsDinamicos = this._inputsDinamicos || {};
              this._inputsDinamicos[tableId] = this._inputsDinamicos[tableId] || {};
              this._inputsDinamicos[tableId][rowIndex] = this._inputsDinamicos[tableId][rowIndex] || {};
              this._inputsDinamicos[tableId][rowIndex][keyCol] = oInput;

              oDynamicData[tableId][rowIndex][keyCol] = prevVal;

              // Disparar handleInputChange manualmente si hay valor previo
              if (prevVal !== "") {
                this.handleInputChange(
                  tableId,
                  rowIndex,
                  i,
                  year,
                  { getParameter: () => prevVal }
                );
              }
            });
          }

          // Ajustes de scroll si tienes scroll_container
          var sc = this.getView().byId("scroll_container_" + tableId);
          if (sc) {
            sc.setHorizontal(true);
            sc.setVertical(false);
            sc.setWidth("100%");
          }
        });

        oModelDynamic.setData(oDynamicData);
        // //console.log("Modelo dynamicInputs actualizado tras regenerar:", oModelDynamic.getData());
      },




      /* fechasDinamicas: function () { 
 
 
         this._tableValues = {};
 this._yearlySums = {};
 this._monthlySums = {};  
 
 
         var startDatePicker = this.getView().byId("date_inico");
         var endDatePicker = this.getView().byId("date_fin");
     
         if (!startDatePicker || !endDatePicker) {
           console.error("Error: No se pudieron obtener los DatePickers.");
           return;
         }
     
         var startDate = startDatePicker.getDateValue();
         var endDate = endDatePicker.getDateValue();
     
         if (!startDate || !endDate) {
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
           "tablaInfrestuctura",
           "tablaLicencia",
           "tableServicioInterno",
           "tablGastoViajeInterno"
         ];
     
         var oModelDynamic = this.getView().getModel("dynamicInputs");
         var oDataPrev = oModelDynamic ? oModelDynamic.getData() : {};
       
         var oDynamicData = {};
     
         tableIds.forEach((tableId) => {
           var oTable = this.getView().byId(tableId);
           if (!oTable) {
             console.error("Error: No se pudo obtener la tabla con ID " + tableId);
             return;
           }
     
           // Eliminar columnas dinámicas previas
           var columnCount = oTable.getColumns().length;
           for (var j = columnCount - 1; j >= 0; j--) {
             var columnHeader = oTable.getColumns()[j].getHeader();
             if (columnHeader && /\d{4}-\w+/.test(columnHeader.getText())) {
               oTable.removeColumn(oTable.getColumns()[j]);
             }
           }
     
           var totalColumnIndex = this.findTotalColumnIndex(oTable);
     
       
           // Inicializamos la estructura para esta tabla en el objeto dinámico
           oDynamicData[tableId] = {};
     
           for (var i = 0; i <= diffMonths; i++) {
             var dateCol = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
             var year = dateCol.getFullYear();
             var monthName = dateCol.toLocaleString("default", { month: "long" });
             var keyCol = year + "-" + monthName;
             var totalIndex = this.findTotalColumnIndex(oTable);
       
             // Insertar columna
             var oColumn = new sap.m.Column({
               header: new sap.m.Label({ text: keyCol }),
               width: "100px"
             });
             oTable.insertColumn(oColumn, totalIndex + 1 + i);
       
             oDynamicData[tableId] = oDynamicData[tableId] || {};
       
             oTable.getItems().forEach((oRow, rowIndex) => {
               oDynamicData[tableId][rowIndex] = oDynamicData[tableId][rowIndex] || {};
       
               var prevVal = "";
               if (oDataPrev && oDataPrev[tableId] && oDataPrev[tableId][rowIndex]) {
                 prevVal = oDataPrev[tableId][rowIndex][keyCol] || "";
               }
       
               var oInput = new sap.m.Input({
                 placeholder: "0.00",
                 value: prevVal,
                 change: this.handleInputChange.bind(this, tableId, rowIndex, i, year)
               });
               oInput.attachBrowserEvent("paste", this._onPasteValues.bind(this));
       
               oRow.addCell(oInput);
       
               // Guardar referencia opcional
               this._inputsDinamicos = this._inputsDinamicos || {};
               this._inputsDinamicos[tableId] = this._inputsDinamicos[tableId] || {};
               this._inputsDinamicos[tableId][rowIndex] = this._inputsDinamicos[tableId][rowIndex] || {};
               this._inputsDinamicos[tableId][rowIndex][keyCol] = oInput;
       
               oDynamicData[tableId][rowIndex][keyCol] = prevVal;
       
 
               //console.log("Valores " + prevVal);
               //     Disparar handleInputChange manualmente si hay valor previo
               if (prevVal !== "") {
 
                 //console.log("Estoy entrando a metodo del handle por segunda vez "); 
                 this.handleInputChange(
                   tableId, 
                   rowIndex, 
                   i, 
                   year, 
                   { getParameter: () => prevVal }
                 );
               }
             });
           }
       
           // Ajustes de scroll si tienes scroll_container
           var sc = this.getView().byId("scroll_container_" + tableId);
           if (sc) {
             sc.setHorizontal(true);
             sc.setVertical(false);
             sc.setWidth("100%");
           }
         });
       
         // Guardar modelo
         if (!oModelDynamic) {
           oModelDynamic = new sap.ui.model.json.JSONModel();
           this.getView().setModel(oModelDynamic, "dynamicInputs");
         }
         oModelDynamic.setData(oDynamicData);
         //console.log("Modelo dynamicInputs actualizado tras regenerar:", oModelDynamic.getData());
         
       },*/









      /*   fechasDinamicas: function () {
           var startDatePicker = this.getView().byId("date_inico");
           var endDatePicker = this.getView().byId("date_fin");
       
           if (!startDatePicker || !endDatePicker) {
             console.error("Error: No se pudieron obtener los DatePickers.");
             return;
           }
       
           var startDate = startDatePicker.getDateValue();
           var endDate = endDatePicker.getDateValue();
       
           if (!startDate || !endDate) {
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
             "tablaInfrestuctura",
             "tablaLicencia",
             "tableServicioInterno",
             "tablGastoViajeInterno"
           ];
       
           tableIds.forEach((tableId) => {
             var oTable = this.getView().byId(tableId);
             if (!oTable) {
               console.error("Error: No se pudo obtener la tabla con ID " + tableId);
               return;
             }
       
             // Eliminar columnas dinámicas previas
             var columnCount = oTable.getColumns().length;
             for (var j = columnCount - 1; j >= 0; j--) {
               var columnHeader = oTable.getColumns()[j].getHeader();
               if (columnHeader && /\d{4}-\w+/.test(columnHeader.getText())) {
                 oTable.removeColumn(oTable.getColumns()[j]);
               }
             } 
             
       
             var totalColumnIndex = this.findTotalColumnIndex(oTable);
       
   
             // Construir los nuevos nombres de columnas válidas (por ejemplo, 2024-Julio)
   var newColumnHeaders = [];
   for (var i = 0; i <= diffMonths; i++) {
     var columnDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
     var year = columnDate.getFullYear();
     var month = columnDate.toLocaleString("default", { month: "long" });
     newColumnHeaders.push(year + "-" + month);
   }
   
   // Limpiar inputs dinámicos obsoletos
   if (this._inputsDinamicos && this._inputsDinamicos[tableId]) {
     Object.keys(this._inputsDinamicos[tableId]).forEach((rowIndex) => {
       var rowInputs = this._inputsDinamicos[tableId][rowIndex];
       Object.keys(rowInputs).forEach((columnKey) => {
         if (!newColumnHeaders.includes(columnKey)) {
           delete this._inputsDinamicos[tableId][rowIndex][columnKey];
         }
       });
     });
   }
   
   
   
   
   
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
       
               // Agregar inputs dinámicos en cada fila para esta columna
               for (var rowIndex = 0; rowIndex < oTable.getItems().length; rowIndex++) {
                 var oRow = oTable.getItems()[rowIndex];
       
                 // Antes de añadir inputs nuevos, eliminar celdas extras para evitar acumulación
                 var fixedCellsCount = totalColumnIndex + 1; // número de columnas fijas antes de las dinámicas
                 while (oRow.getCells().length > fixedCellsCount + diffMonths + 1) {
                   oRow.removeCell(oRow.getCells().length - 1);
                 }
       
                 this._inputsDinamicos = this._inputsDinamicos || {};
                 this._inputsDinamicos[tableId] = this._inputsDinamicos[tableId] || {};
                 this._inputsDinamicos[tableId][rowIndex] = this._inputsDinamicos[tableId][rowIndex] || {};
       
                 var oInput = new sap.m.Input({
                   placeholder: "0.00",
                   change: this.handleInputChange.bind(this, tableId, rowIndex, i, year),
                   liveChange: function(oEvent) {
                     var sValue = oEvent.getParameter("value");
                     // Puedes agregar aquí lógica adicional si quieres
                   }
                 });
       
                 oInput.attachBrowserEvent("paste", this._onPasteValues.bind(this));
       
                 // Inicializar valor vacío para evitar reaparecer valores viejos
                 oInput.setValue("");
       
                 oRow.addCell(oInput);
       
                 this._inputsDinamicos[tableId][rowIndex][columnHeaderText] = oInput;
               }
             }
       
             var oScrollContainer = this.getView().byId("scroll_container_" + tableId);
             if (oScrollContainer) {
               oScrollContainer.setHorizontal(true);
               oScrollContainer.setVertical(false);
               oScrollContainer.setWidth("100%");
             }
           });
         },*/



      _onPasteValues: function (oEvent) {
        oEvent.preventDefault(); // Evita el pegado por defecto
        var oClipboardData = oEvent.originalEvent.clipboardData;
        if (!oClipboardData) return;

        var sPastedData = oClipboardData.getData("text"); // Datos copiados, por ejemplo: "62,00\t50,00\t62,00\t62,00"
        //console.log(" Datos pegados:", sPastedData);

        var aValues = sPastedData.split(/\t/); // ['62,00', '50,00', ...]

        var inputDOM = oEvent.target;
        //console.log(" DOM del input donde se pegó:", inputDOM);

        var encontrado = false;

        // Recorrer los inputs dinámicos para encontrar el que coincide con el evento
        for (var tableId in this._inputsDinamicos) {
          //console.log(" Explorando _inputsDinamicos...");

          var table = this._inputsDinamicos[tableId];
          for (var rowIndex in table) {
            for (var columnKey in table[rowIndex]) {
              var input = table[rowIndex][columnKey];

              if (!input || typeof input.getDomRef !== "function") continue;

              var inputRef = input.getDomRef();
              if (!inputRef) continue;

              //  Aquí la comparación corregida:
              if (inputRef.contains(inputDOM)) {
                //console.log(" Input encontrado:", { tableId, rowIndex, columnKey });

                // Obtener la fila y todas sus celdas
                var oCell = jQuery(inputDOM).closest("td");
                var oRow = jQuery(inputDOM).closest("tr");
                if (!oCell.length || !oRow.length) return;

                var aCells = oRow.find("td");
                var iStartIndex = aCells.index(oCell);

                for (var i = 0; i < aValues.length; i++) {
                  var iCellIndex = iStartIndex + i;
                  var oTargetCell = aCells[iCellIndex];
                  if (!oTargetCell) continue;

                  var oTargetInputDOM = jQuery(oTargetCell).find("input")[0];
                  if (oTargetInputDOM) {
                    oTargetInputDOM.value = aValues[i].trim();
                    oTargetInputDOM.dispatchEvent(new Event("input", { bubbles: true }));
                    oTargetInputDOM.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }

                encontrado = true;
                break;
              }
            }
            if (encontrado) break;
          }
          if (encontrado) break;
        }

        if (!encontrado) {
          console.warn("    No se pudo identificar el input en _inputsDinamicos.");
        }
      },






      resetTableAccumulations: function (tableId) {
        //   console.log(` Reiniciando acumulación para la tabla ${tableId}`);

        // Si la tabla no existe, la creamos
        if (!this._yearlySums[tableId]) {
          this._yearlySums[tableId] = {};
        }

        // Reiniciar solo las acumulaciones de las filas, no de las tablas
        if (!this._yearlySums[tableId][this.currentRow]) {
          this._yearlySums[tableId][this.currentRow] = {};  // Crear fila si no existe
        }

      },



      handleInputChange: function (tableId, rowIndex, columnIndex, year, oEvent) {

        this._handleInputChangeCounter = (this._handleInputChangeCounter || 0) + 1;
        //  //console.log("handleInputChange disparado", tableId, rowIndex, columnIndex, year);
        // //console.log("Estoy entrando al HANDLE - llamada número:", this._handleInputChangeCounter);

        var newValue = parseFloat(oEvent.getParameter("value")) || 0;

        if (!this._tableValues) this._tableValues = {};
        if (!this._tableValues[tableId]) this._tableValues[tableId] = {};
        if (!this._tableValues[tableId][rowIndex]) this._tableValues[tableId][rowIndex] = {};

        var oldValue = this._tableValues[tableId][rowIndex][columnIndex] || 0;

        //  console.log(`Valores actuales para tabla ${tableId}, fila ${rowIndex}, columna ${columnIndex}: oldValue=${oldValue}, newValue=${newValue}`);

        if (newValue !== oldValue) {
          //    console.log(`Valor cambiado en tabla ${tableId}, fila ${rowIndex}, columna ${columnIndex}: de ${oldValue} a ${newValue}`);

          // Guarda el nuevo valor en la estructura interna
          this._tableValues[tableId][rowIndex][columnIndex] = newValue;

          if (!this._editedRows) this._editedRows = {};
          if (!this._editedRows[tableId]) this._editedRows[tableId] = new Set();
          this._editedRows[tableId].add(rowIndex);

          this._tableChanged = true;

          if (!this._yearlySums) this._yearlySums = {};
          if (!this._yearlySums[rowIndex]) this._yearlySums[rowIndex] = {};
          if (this._yearlySums[rowIndex][year] !== undefined) {
            this._yearlySums[rowIndex][year] -= oldValue;
          }
          this._yearlySums[rowIndex][year] = (this._yearlySums[rowIndex][year] || 0) + newValue;

          if (!this._yearlySums[tableId]) this._yearlySums[tableId] = {};
          if (!this._yearlySums[tableId][rowIndex]) this._yearlySums[tableId][rowIndex] = {};
          if (!this._yearlySums[tableId][rowIndex][year]) this._yearlySums[tableId][rowIndex][year] = 0;

          this._yearlySums[tableId][rowIndex][year] -= oldValue;
          this._yearlySums[tableId][rowIndex][year] += newValue;


          //console.log("TOTAL YEAR JSON", JSON.stringify(this._yearlySums));
          this.updateTotalField(tableId, rowIndex, newValue);

          if (!this._insercionesPorAnoYTabla) this._insercionesPorAnoYTabla = {};
          if (!this._insercionesPorAnoYTabla[year]) this._insercionesPorAnoYTabla[year] = {};
          if (!this._insercionesPorAnoYTabla[year][tableId]) this._insercionesPorAnoYTabla[year][tableId] = 0;

          this._insercionesPorAnoYTabla[year][tableId]++;

          //  console.log(`Reclutado hasta ahora en año ${year} para tabla ${tableId}:`, this._insercionesPorAnoYTabla[year][tableId]);

          if (!this._insercionesPorTabla) this._insercionesPorTabla = {};
          if (!this._insercionesPorTabla[tableId]) this._insercionesPorTabla[tableId] = 0;

          this._insercionesPorTabla[tableId]++;

          //console.log("TOTAL YEAR JSON", JSON.stringify(this._insercionesPorTabla));


          this.calcularPorcentajeInserciones();

          this.CaseAno(tableId);

          // ——— Actualización del modelo "dynamicInputs" ———
          var oModelDynamic = this.getView().getModel("dynamicInputs");
          var oData = oModelDynamic.getData();

          if (!oData[tableId]) {
            oData[tableId] = {};
          }
          if (!oData[tableId][rowIndex]) {
            oData[tableId][rowIndex] = {};
          }

          var columnDate = new Date(this.getView().byId("date_inico").getDateValue().getFullYear(), this.getView().byId("date_inico").getDateValue().getMonth() + columnIndex, 1);
          var yearText = columnDate.getFullYear();
          var monthText = columnDate.toLocaleString("default", { month: "long" });
          var columnKey = yearText + "-" + monthText;

          oData[tableId][rowIndex][columnKey] = newValue;

          oModelDynamic.setData(oData);
          oModelDynamic.refresh();

          //console.log("Modelo dynamicInputs actualizado: ", oModelDynamic.getData());

        } else {
          //console.log("No hay cambio de valor, no actualizo nada.");
        }
      },





      /* handleInputChange: function (tableId, rowIndex, columnIndex, year, oEvent) {
         var newValue = parseFloat(oEvent.getParameter("value")) || 0;
         // console.log(`1. Nuevo valor ingresado en la tabla ${tableId}, fila ${rowIndex}, columna ${columnIndex}: ${newValue}`);
 
         if (this.currentTable !== tableId) {
           //  console.log(`Cambio de tabla detectado. Reiniciando acumulación para la tabla ${tableId}.`);
           this.resetTableAccumulations(tableId);
           this.currentTable = tableId;
         }
 
         if (!this._tableValues) this._tableValues = {};
         if (!this._tableValues[tableId]) this._tableValues[tableId] = {};
         if (!this._tableValues[tableId][rowIndex]) this._tableValues[tableId][rowIndex] = {};
 
         // Obtener el valor anterior
         var oldValue = this._tableValues[tableId][rowIndex][columnIndex] || 0;
 
         // Guarda el nuevo valor en _tableValues
         this._tableValues[tableId][rowIndex][columnIndex] = newValue;
 
         if (!this._editedRows) this._editedRows = {};
         if (!this._editedRows[tableId]) this._editedRows[tableId] = new Set();
         this._editedRows[tableId].add(rowIndex);
 
         this._tableChanged = true;
 
         //   //console.log("Verificando _yearlySums antes de asignar:", JSON.stringify(this._yearlySums));
 
         if (!this._yearlySums[rowIndex]) this._yearlySums[rowIndex] = {};
 
         // Restar el valor anterior antes de sumar el nuevo
         if (this._yearlySums[rowIndex][year] !== undefined) {
           this._yearlySums[rowIndex][year] -= oldValue;
         }
 
         this._yearlySums[rowIndex][year] = (this._yearlySums[rowIndex][year] || 0) + newValue;
 
         //  console.log(`Valor actualizado en _yearlySums[${rowIndex}][${year}]:`, this._yearlySums[rowIndex][year]);
 
         if (!this._yearlySums[tableId]) this._yearlySums[tableId] = {};
         if (!this._yearlySums[tableId][rowIndex]) this._yearlySums[tableId][rowIndex] = {};
         if (!this._yearlySums[tableId][rowIndex][year]) this._yearlySums[tableId][rowIndex][year] = 0;
 
         this._yearlySums[tableId][rowIndex][year] -= oldValue;
         this._yearlySums[tableId][rowIndex][year] += newValue;
 
         //console.log(`Suma acumulada para el año ${year} en fila ${rowIndex}:`, this._yearlySums[tableId][rowIndex][year]);
 
         this.updateTotalField(tableId, rowIndex, newValue);
 
 
         //    console.log(`Suma total para el año ${year} en fila ${rowIndex}:`, this._yearlySums[tableId][rowIndex][year]);
 
         if (!this._insercionesPorAnoYTabla) this._insercionesPorAnoYTabla = {};
         if (!this._insercionesPorAnoYTabla[year]) this._insercionesPorAnoYTabla[year] = {};
         if (!this._insercionesPorAnoYTabla[year][tableId]) this._insercionesPorAnoYTabla[year][tableId] = 0;
 
         this._insercionesPorAnoYTabla[year][tableId]++;
 
 
         //console.log("ME AÑO RECOGIDO" + JSON.stringify(this._insercionesPorAnoYTabla));
 
         if (!this._insercionesPorTabla) this._insercionesPorTabla = {};
         if (!this._insercionesPorTabla[tableId]) this._insercionesPorTabla[tableId] = 0;
 
         this._insercionesPorTabla[tableId]++;
 
 
         //  //console.log("PORCEM RECOGIDO" + JSON.stringify(this._insercionesPorAnoYTabla));
         //  //console.log("PORCEM RECOGIDO:", this._insercionesPorAnoYTabla);
         // //console.log("PORCENTAJE POR TABLA  RECOGIDO" + JSON.stringify(this._insercionesPorTabla));
 
 
 
 
 
         this.calcularPorcentajeInserciones();
 
         this.CaseAno(tableId);
       },*/




      calcularPorcentajeInserciones: function () {
        let totalInserciones = 0;

        // Sumamos todas las inserciones de todas las tablas
        for (let table in this._insercionesPorTabla) {
          totalInserciones += this._insercionesPorTabla[table];
        }

        // //console.log(" **Distribución de Inserciones por Tabla** ");
        // console.log(` Total de inserciones en todas las tablas: ${totalInserciones}`);

        // Verificamos que haya inserciones antes de calcular porcentajes
        if (totalInserciones === 0) {
          //  //console.log(" No hay inserciones registradas.");
          return;
        }

        // **Guardamos los porcentajes**
        this._porcentajesPorTabla = {};

        // Calculamos el porcentaje por tabla asegurando que la suma total sea 100%
        for (let table in this._insercionesPorTabla) {
          let porcentaje = (this._insercionesPorTabla[table] / totalInserciones) * 100;
          this._porcentajesPorTabla[table] = porcentaje;
          //   console.log(` Tabla ${table}: ${this._insercionesPorTabla[table]} inserciones ➝ ${porcentaje.toFixed(2)}%`);
        }

        if (this._insercionesPorAnoYTabla) {
          for (let year in this._insercionesPorAnoYTabla) {
            //   //console.log("tablaaaaaa  PRIMERA " + JSON.stringify(this._insercionesPorAnoYTabla));

            for (let table in this._insercionesPorAnoYTabla[year]) {
              const insercionesEnAno = this._insercionesPorAnoYTabla[year][table] || 0;

              //    console.log("tablaaaaaa " + JSON.stringify(insercionesEnAno));
              let porcentaje = (insercionesEnAno / totalInserciones) * 100;
              //         console.log(` Tabla con resultado ${table}: ${insercionesEnAno} inserciones ➝ ${porcentaje.toFixed(2)}% AÑO ${year}`);
            }
          }
        }
      },



      calcularDistribucionInput: function () {
        let elementos = [
          { id: "input0_1725625161348", nombre: "Input1", tipo: "input" },
          { id: "totalSubtotal", nombre: "Input2", tipo: "input" },
          { id: "input2_1724756105", nombre: "Input3", tipo: "input" },

          { id: "text33", nombre: "Text1", tipo: "text", tabla: "table_dimicFecha" },
          { id: "text32_1723542481599", nombre: "Text2", tipo: "text", tabla: "table_dimicFecha" },
          { id: "text32_172341599", nombre: "Text3", tipo: "text", tabla: "table_dimicFecha" },

          { id: "text560", nombre: "Text4", tipo: "text", tabla: "tablaConsuExter" },
          { id: "text56", nombre: "Text5", tipo: "text", tabla: "tablaConsuExter" },
          { id: "text50006", nombre: "Text6", tipo: "text", tabla: "tablaConsuExter" },

          { id: "text32_172354299", nombre: "Text7", tipo: "text", tabla: "tableServicioInterno" },

          { id: "text3888", nombre: "Text8", tipo: "text", tabla: "tablGastoViajeInterno" },
          { id: "text32_172354299", nombre: "text40", tipo: "text", tabla: "tablGastoViajeInterno" },


          { id: "text56000", nombre: "Text8", tipo: "text", tabla: "tablaRecExterno" },
          { id: "text5644", nombre: "text9", tipo: "text", tabla: "tablaRecExterno" },
          { id: "text500406", nombre: "text10", tipo: "text", tabla: "tablaRecExterno" },

          { id: "text90_1729173466313", nombre: "text11", tipo: "text", tabla: "tablaLicencia" },
          { id: "text75_1729177384465", nombre: "text12", tipo: "text", tabla: "tablaLicencia" },



          { id: "text78_1729173199360", nombre: "t ext13", tipo: "text", tabla: "tablaInfrestuctura" },
          { id: "text32_171145299", nombre: "text14", tipo: "text", tabla: "tablaInfrestuctura" },


        ];

        let valoresDistribuidos = {};
        let acumuladoTextPorTablaYAnio = {};

        elementos.forEach(elemento => {
          let oElemento = this.byId(elemento.id);
          if (!oElemento) {
            console.error(`    No se encontró el elemento con ID '${elemento.id}'`);
            return;
          }

          let valor = elemento.tipo === "input" ? parseFloat(oElemento.getValue()) || 0 : parseFloat(oElemento.getText()) || 0;
          if (valor === 0) {
            return;
          }

          for (let table in this._porcentajesPorTabla) {
            if (elemento.tipo === "text" && table !== elemento.tabla) {
              continue; // Solo distribuir "text" en su tabla específica
            }

            let porcentaje = this._porcentajesPorTabla[table];
            let valorDistribuido = elemento.tipo === "text" ? valor : (valor * porcentaje) / 100;

            if (!valoresDistribuidos[table]) {
              valoresDistribuidos[table] = {};
            }

            // Obtener los años válidos para esa tabla
            let aniosParaTabla = Object.entries(this._insercionesPorAnoYTabla)
              .filter(([anio, tablas]) => tablas[table])
              .map(([anio]) => anio);

            aniosParaTabla.forEach(year => {
              let insercionesEnAno = this._insercionesPorAnoYTabla[year][table];
              if (!this._insercionesPorTabla[table] || this._insercionesPorTabla[table] === 0) {
                return;
              }

              if (!valoresDistribuidos[table][year]) {
                valoresDistribuidos[table][year] = [];
              }

              if (!acumuladoTextPorTablaYAnio[year]) {
                acumuladoTextPorTablaYAnio[year] = {};
              }
              if (!acumuladoTextPorTablaYAnio[year][table]) {
                acumuladoTextPorTablaYAnio[year][table] = 0;
              }

              if (elemento.tipo === "text") {
                let numAnios = aniosParaTabla.length;

                if (numAnios > 1) {
                  // Distribuir el valor equitativamente
                  let porcentajePorAno = 100 / numAnios;
                  let valorPorAno = (valor * porcentajePorAno) / 100;

                  valoresDistribuidos[table][year].push({
                    elemento: elemento.nombre,
                    porcentaje: porcentajePorAno.toFixed(2),
                    valor: valorPorAno.toFixed(2)
                  });

                  acumuladoTextPorTablaYAnio[year][table] += parseFloat(valorPorAno.toFixed(2));
                } else {

                  // Solo un año, se va todo ahí
                  // Solo un año, se va todo ahí
                  valoresDistribuidos[table][year].push({
                    elemento: elemento.nombre,
                    porcentaje: 100,
                    valor: valor.toFixed(2)
                  });

                  acumuladoTextPorTablaYAnio[year][table] += parseFloat(valor.toFixed(2));
                }
              } else {
                // Distribuir inputs proporcionales al porcentaje de inserciones en ese año
                let porcentajeEnAno = (insercionesEnAno / this._insercionesPorTabla[table]) * 100;
                let valorAno = (valor * porcentajeEnAno) / 100;

                valoresDistribuidos[table][year].push({
                  elemento: elemento.nombre,
                  porcentaje: porcentajeEnAno.toFixed(2),
                  valor: valorAno.toFixed(2)
                });
              }
            });
          }
        });

        // Para fines de prueba puedes imprimir los resultados
        // console.log("  Valores distribuidos por tabla y año:");
        //console.log(JSON.stringify(valoresDistribuidos, null, 2));

        //console.log("🔢 Acumulado de textos distribuidos por tabla y año:");
        //console.log(JSON.stringify(acumuladoTextPorTablaYAnio, null, 2));


        return {
          valoresDistribuidos,
          acumuladoTextPorTablaYAnio
        };
      },



















      updateTotalField: function (tableId, rowIndex, newValue, oEvent, colIndex) {

        //  console.log("ESTOY ENTRANDO AL  updateTotalField "  );   

        //    console.log("1. updateTotal ---->>> " + rowIndex + newValue);
        // Obtener el total acumulado para cada año
        var PMJCos = 0;
        var totalSum1 = 0;
        var totalSum2 = 0;
        var totalSum3 = 0;
        var totalJornada = 0;
        let suma = 0;
        var totalRecurExter, totalRecurIn, totalCons;

        var totalFor2024 = this.getTotalForYear(2025, rowIndex, tableId);
        var totalFor2025 = this.getTotalForYear(2026, rowIndex, tableId);
        var totalFor2026 = this.getTotalForYear(2027, rowIndex, tableId);
        var totalFor2027 = this.getTotalForYear(2028, rowIndex, tableId);
        var totalFor2028 = this.getTotalForYear(2029, rowIndex, tableId);
        var totalFor2029 = this.getTotalForYear(2030, rowIndex, tableId);


        //    console.log("TRAIDO DEL 2025 ---->>>>>> <3 : " + totalFor2024);
        // Lógica para cada tabla según la tabla seleccionada (tableId)
        if (tableId === "tablaConsuExter") {
          // Obtener la tabla "tablaConsuExter"
          var oTable = this.byId("tablaConsuExter");

          if (!oTable) {
            console.error(" 2. La tabla 'tablaConsuExter' no fue encontrada.");
            return;
          }
          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas
                PMJCos = aCells[4].getText(); // Celda para PMJ
                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                totalSum1 = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                var resulCon = PMJCos * totalSum1;

                aCells[11].setText(totalSum1.toFixed(2) + "€"); // Celda para Total 
                aCells[12].setText(resulCon.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });
          // totalCons =  this.byId("inputConsuEx").setValue(totalSum1.toFixed(2));
          this.onSumarColumna(tableId);

        } else if (tableId === "table_dimicFecha") {

          //      console.log("ESTOY ENTRANDO AL  updateTotalField   PERO DE TABLAS DINAMICAS   "  );   

          // Obtener la tabla "table_dimicFecha"
          var oTable = this.byId("table_dimicFecha");

          if (!oTable) {
            console.error("3. La tabla 'table_dimicFecha' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las s

                var PMJDi = aCells[4].getText();
                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                totalSum2 = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                var resulDina = PMJDi * totalSum2;

                aCells[11].setText(totalSum2.toFixed(2)); // Celda para Total 
                aCells[12].setText(resulDina.toFixed(2) + "€"); // Celda para Total   

              }
            }
          });

          //      totalRecurIn = this.byId("inputReInter").setValue(totalSum2.toFixed(2));
          this.onSumarColumna(tableId);

        } else if (tableId === "tablaRecExterno") {
          var oTable = this.byId("tablaRecExterno");

          if (!oTable) {
            console.error("4. La tabla 'tablaRecExterno' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells();

              if (aCells && aCells.length >= 13) {
                // Obtener valor actual inicialmente
                var PMJReValue = parseFloat(aCells[4].getValue().replace(",", "."));
                if (isNaN(PMJReValue)) {
                  PMJReValue = 0;
                }

                aCells[5].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[6].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[7].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[8].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[9].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[10].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum3 = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[11].setText(totalSum3.toFixed(2) + "€"); // Celda para Total 

                // Calcular resultado inicial para celda 12
                var initialResult = PMJReValue * totalSum3;
                aCells[12].setText(initialResult.toFixed(2) + "€");

                // Agregar listener para recalcular si cambia el valor de la celda 4
                aCells[4].attachLiveChange(function (oEvent) {
                  var newValue = parseFloat(oEvent.getSource().getValue().replace(",", "."));
                  if (!isNaN(newValue)) {
                    var newResult = newValue * totalSum3;
                    aCells[12].setText(newResult.toFixed(2) + "€");
                  } else {
                    aCells[12].setText("0.00€");
                  }

                  // Actualizar suma general en inputs relacionados
                  this.onSumarColumna(tableId);

                }.bind(this));  // importante bind para usar "this" correcto
              }
            }
          }.bind(this));  // bind para que 'this' funcione en el forEach también

          // Sumar inicial al terminar el bucle
          this.onSumarColumna(tableId);
        }



        else if (tableId === "idOtroserConsu") {
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
          this.onSumarColumna(tableId);

        } else if (tableId === "idGastoViajeConsu") {

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
          this.onSumarColumna(tableId);

        } else if (tableId === "idServiExterno") {

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
          this.onSumarColumna(tableId);

        } else if (tableId === "idGastoRecuExter") {

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
          this.onSumarColumna(tableId);

        } else if (tableId === "tablaInfrestuctura") {

          var oTable = this.byId("tablaInfrestuctura");

          if (!oTable) {
            console.error("La tabla 'tablaInfrestuctura' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 11) {
                // Actualizar las celdas con los valores específicos de las fechas

                aCells[4].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[5].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[6].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[7].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[8].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[9].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029

                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[10].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });
          this.onSumarColumna(tableId);

        } else if (tableId === "tablaLicencia") {

          var oTable = this.byId("tablaLicencia");

          if (!oTable) {
            console.error("La tabla 'tablaLicencia' no fue encontrada.");
            return;
          }

          // Obtener los índices de las filas editadas
          this._editedRows[tableId].forEach(function (rowIndex) {
            var oItem = oTable.getItems()[rowIndex];
            if (oItem) {
              var aCells = oItem.getCells(); // Obtener las celdas de la fila

              if (aCells && aCells.length >= 12) {
                // Actualizar las celdas con los valores específicos de las fechas
                aCells[4].setText(totalFor2024.toFixed(2) + "€"); // Celda para 2024
                aCells[5].setText(totalFor2025.toFixed(2) + "€"); // Celda para 2025
                aCells[6].setText(totalFor2026.toFixed(2) + "€"); // Celda para 2026
                aCells[7].setText(totalFor2027.toFixed(2) + "€"); // Celda para 2027
                aCells[8].setText(totalFor2028.toFixed(2) + "€"); // Celda para 2028
                aCells[9].setText(totalFor2029.toFixed(2) + "€"); // Celda para 2029


                var totalSum = totalFor2024 + totalFor2025 + totalFor2026 + totalFor2027 + totalFor2028 + totalFor2029;
                aCells[10].setText(totalSum.toFixed(2) + "€"); // Celda para Total 

                aCells[11].setText(totalSum.toFixed(2) + "€"); // Celda para Total 
              }
            }
          });

          this.onSumarColumna(tableId);
        } else if (tableId === "tableServicioInterno") {

          var oTable = this.byId("tableServicioInterno");

          if (!oTable) {
            console.error("La tabla 'tableServicioInterno' no fue encontrada.");
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
          this.onSumarColumna(tableId);

        } else if (tableId === "tablGastoViajeInterno") {

          var oTable = this.byId("tablGastoViajeInterno");

          if (!oTable) {
            console.error("La tabla 'tablGastoViajeInterno' no fue encontrada.");
            return;
          }

          // console.log("tabla encontrada ", tableId);
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


                aCells[12].setText(totalSum.toFixed(2) + "€"); // Celda para Total1

              }
            }
          });
          this.onSumarColumna(tableId);

        }
        else {
          console.error("Tabla no reconocida: " + tableId);
        }

        //this.onSumarColumna();

        // Limpiar las filas editadas para que no se actualicen más de una vez
        //   this._editedRows[tableId].clear();
        if (this._editedRows && this._editedRows[tableId] && typeof this._editedRows[tableId].clear === 'function') {
          this._editedRows[tableId].clear();
        } else {
          console.warn("No es un Set, se reinicia correctamente");
          this._editedRows[tableId] = new Set();
        }



      },

      getTotalForYear: function (year, rowIndex, tableId) {
        //  console.log("1. AÑO GETTOTAL ----->>>", year, "Fila actual:", rowIndex, "Tabla actual:", tableId, "Datos actuales:", JSON.stringify(this._yearlySums, null, 2));

        if (Number(rowIndex) !== Number(this.currentRow) || tableId !== this.currentTableId) {
          //  console.log("    Cambiando de fila de " + this.currentRow + " a " + rowIndex + " y/o cambiando de tabla a " + tableId);
          this.resetTableAccumulations(tableId);
          this.currentRow = Number(rowIndex);
          this.currentTableId = tableId;
          //       console.log(" CURRENTROW actualizada a:", this.currentRow, "CURRENTTABLEID actualizada a:", this.currentTableId);
        }

        //     console.log(" Datos disponibles en _yearlySums después del reset:", JSON.stringify(this._yearlySums, null, 2));

        // Asegúrate de que la tabla y la fila existan
        if (!this._yearlySums[tableId]) {
          console.warn(`    No hay datos para la tabla ${tableId}. Creando estructura.`);
          this._yearlySums[tableId] = {};
        }
        if (!this._yearlySums[tableId][rowIndex]) {
          console.warn(`    No hay datos para la fila ${rowIndex} en la tabla ${tableId}. Creando estructura.`);
          this._yearlySums[tableId][rowIndex] = {};
        }

        // Si el valor de año aún no existe, inicialízalo en 0
        if (this._yearlySums[tableId][rowIndex][year] === undefined) {
          //   console.warn(`    No hay datos para el año ${year} en la fila ${rowIndex} de la tabla ${tableId}. Inicializando en 0.`);
          this._yearlySums[tableId][rowIndex][year] = 0;
        }

        //console.log(` Buscando valor en _yearlySums[${tableId}][${rowIndex}][${year}]`);
        // console.log(` Valor encontrado: ${this._yearlySums[tableId][rowIndex][year]}`);
        return this._yearlySums[tableId][rowIndex][year];
      },







      onSumarColumna: function (tableId) {

        var oTable = this.byId(tableId);
        var aItems = oTable.getItems();
        var suma = 0;
        var Total1 = 0;
        var totalSer = 0;
        var totaOtrose = 0;
        var otrosGasto = 0;

        // Recorre cada fila de la tabla
        aItems.forEach(function (oItem) {
          var aCells = oItem.getCells();
          // Verifica que aCells tenga al menos 13 elementos antes de acceder
          var sPrecio = aCells.length > 11 && aCells[11].getText ? aCells[11].getText() : "0"; // Celda 12 (índice 11)
          var sTotal1 = aCells.length > 12 && aCells[12].getText ? aCells[12].getText() : "0"; // Celda 13 (índice 12)


          suma += parseFloat(sPrecio) || 0;
          Total1 += parseFloat(sTotal1) || 0;
          totalSer += parseFloat(sPrecio) || 0;
          totaOtrose += parseFloat(sPrecio) || 0;
          otrosGasto += parseFloat(sPrecio) || 0;
        });

        // Recurso Interno 
        if (tableId === "table_dimicFecha") {
          this.byId("inputReInter").setValue(suma.toFixed(2));
          this.byId("inputServi1").setValue(Total1.toFixed(2) + "€");

        } else if (tableId === "tableServicioInterno") {
          this.byId("inputOtrosServi1").setValue(totalSer.toFixed(2) + "€");

        } else if (tableId === "tablGastoViajeInterno") {
          this.byId("inputGastoVia1").setValue(totaOtrose.toFixed(2) + "€");

        } else if (tableId === "tablaLicencia") {  //if para Licencia 
          this.byId("input0_1724758359").setValue(totalSer.toFixed(2) + "€");

        }

        // If Recurso Externo 
        else if (tableId === "tablaRecExterno") {
          this.byId("inputRcurExtern").setValue(suma.toFixed(2) + "€");
          this.byId("inputServi").setValue(Total1.toFixed(2) + "€");

        } else if (tableId === "idServiExterno") {
          this.byId("input10_1724757017406").setValue(suma.toFixed(2) + "€");

        } else if (tableId === "idGastoRecuExter") {
          this.byId("input9_1724757015442").setValue(suma.toFixed(2) + "€");

        }


        // if Consumo Externo 
        else if (tableId === "tablaConsuExter") {
          this.byId("inputServi2").setValue(Total1.toFixed(2));
          this.byId("inputConsuEx").setValue(suma.toFixed(2));

        } else if (tableId === "idOtroserConsu") {
          this.byId("inputOtroSer2").setValue(totalSer.toFixed(2) + "€");

        } else if (tableId === "idGastoViajeConsu") {
          this.byId("inptGastoVi2").setValue(totalSer.toFixed(2) + "€");

        }

        else if (tableId === "tablaInfrestuctura") {
          this.byId("totalInfraestruc").setValue(suma.toFixed(2) + "€");

        }

        this.onColumnTotales();
        //  console.log("Suma total de la columna Precio:", suma);
        //  console.log("Suma total de la columna Precio:", Total1);
        //  this.onColumnTotales();
        return suma;
      },



      onColumnTotales: function () {

        var totalJorn = 0;
        var totalReinter = 0;
        var totalconsuExter = 0;
        var recursosExternos = 0;
        var totalEntero = 0;

        var totR = parseFloat(this.byId("inputReInter").getValue()) || 0;
        var totC = parseFloat(this.byId("inputConsuEx").getValue()) || 0;
        var totRE = parseFloat(this.byId("inputRcurExtern").getValue()) || 0;
        totalJorn = totR + totC + totRE;
        this.byId("inputTotalJor").setValue(totalJorn.toFixed(2));



        var totRei = parseFloat(this.byId("inputServi1").getValue()) || 0;
        var totSeR = parseFloat(this.byId("inputOtrosServi1").getValue()) || 0;
        var totGaR = parseFloat(this.byId("inputGastoVia1").getValue()) || 0;
        totalReinter = totRei + totSeR + totGaR;
        this.byId("totalRecuInter").setValue(totalReinter.toFixed(2));



        var totCEx = parseFloat(this.byId("inputServi2").getValue()) || 0;
        var totSerC = parseFloat(this.byId("inputOtroSer2").getValue()) || 0;
        var totOtgaC = parseFloat(this.byId("inptGastoVi2").getValue()) || 0;
        totalconsuExter = totCEx + totSerC + totOtgaC;
        this.byId("totalConsuExternot").setValue(totalconsuExter.toFixed(2));


        var totRcEx = parseFloat(this.byId("inputServi").getValue()) || 0;
        var totSerRx = parseFloat(this.byId("input10_1724757017406").getValue()) || 0;
        var totOtgaRx = parseFloat(this.byId("input9_1724757015442").getValue()) || 0;
        recursosExternos = totRcEx + totSerRx + totOtgaRx;
        this.byId("totaRecurExterno").setValue(recursosExternos.toFixed(2));

        var totaInfra = parseFloat(this.byId("totalInfraestruc").getValue()) || 0;
        var totalLicencia = parseFloat(this.byId("input0_1724758359").getValue()) || 0;

        totalEntero = totalReinter + totalconsuExter + recursosExternos + totaInfra + totalLicencia;


        var formattesubtotal = new Intl.NumberFormat('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(totalEntero);


        this.byId("totalSubtotal").setValue(formattesubtotal);
        var sMargen = parseFloat(this.byId("input2_172475612").getValue()) || 0;
        var totaCosteEstruc = totalEntero * (sMargen / 100);
        this.byId("input2_1724756105").setValue(totaCosteEstruc.toFixed(2));


        //total MArgen 

        // Obtener el margen ingresado y convertirlo a decimal (Ej: 10% → 0.10)
        var getMargen = parseFloat(this.byId("input2_17221205").getValue()) / 100 || 0;

        // Sumar los valores de totalEntero y totaCosteEstruc
        var totalSumaMar = totalEntero + totaCosteEstruc;
        // console.log("TOTAL SUMA MAR: " + totalSumaMar.toFixed(2));

        // Aplicar la fórmula de Excel en JavaScript
        var totalMargeSobreIn = (totalSumaMar / (1 - getMargen)) - totalSumaMar;
        // console.log("TOTAL MARGEN SOBRE INGRESOS: " + totalMargeSobreIn.toFixed(2));

        // Establecer el valor en la vista
        this.byId("input2_1756121205").setValue(totalMargeSobreIn.toFixed(2));

        // Calcular el total final con margen incluido
        var TotalSumas = totalSumaMar + totalMargeSobreIn;
        //  console.log("TOTAL SUMAS FINAL: " + TotalSumas.toFixed(2));

        // Redondear y darle formato de miles
        var formattedTotal = new Intl.NumberFormat('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(TotalSumas);

        // Agregar el símbolo de euro al final
        var formattedTotalWithEuro = formattedTotal + ' €';

        this.byId("input0_1725625161348").setValue(formattedTotalWithEuro);


        //  this.calcularDistribucionInput();
        this.CaseAno();
        // Call CaseAno only if necessary
        if (this._insercionesPorAnoYTabla) {
          this.CaseAno();
        }





        var conversionInput = this.byId("inputCambioEu").getValue().trim();



        // Obtener referencia al input donde mostrar el total convertido
        var inputTotalUSD = this.byId("input0_1725625132423424361348");

        if (conversionInput !== "") {
          // Convertir a número con 4 decimales
          var conversionRate = parseFloat(parseFloat(conversionInput).toFixed(4));



          // Multiplicar por tasa de conversión
          var totalDolares = TotalSumas * conversionRate;

          // Formatear con separador de miles y 2 decimales
          var formattedTotal = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(totalDolares);

          // Mostrar el input y poner el valor con símbolo $
          inputTotalUSD.setVisible(true);
          inputTotalUSD.setValue(formattedTotal + ' $');

        } else {
          // Si no hay tasa de conversión, esconder input y limpiar valor
          inputTotalUSD.setVisible(false);
          inputTotalUSD.setValue("");
        }


        // Establecer el valor formateado en el input

        /*  var getMargen = parseFloat(this.byId("input2_17221205").getValue());
          var totalSumaMar = totalEntero + totaCosteEstruc;
          console.log("TOTAL SUMAMAR : " + totalSumaMar);
          var total2 = totalSumaMar * (getMargen / 100);
          console.log("TOTAL2  : " + total2);
  
  
  
          var totalMargeSobreIn = total2 - totalSumaMar;
          this.byId("input2_1756121205").setValue(totalMargeSobreIn.toFixed(2));
  
          var TotalSumas = totalEntero + totaCosteEstruc + totalMargeSobreIn
          this.byId("input0_1725625161348").setValue(TotalSumas.toFixed(2));*/

      },









      // Función para hacer lo que quieras con el valor ingresado
      findTotalColumnIndex: function (oTable) {
        var columns = oTable.getColumns();
        var lastColumnIndex = columns.length - 1;

        for (var i = 0; i < columns.length; i++) {
          var headerLabel = columns[i].getHeader();
          if (headerLabel && (headerLabel.getText() === "Total €" || headerLabel.getText() === "")) {
            return i;
          }
        }

        // console.warn("Advertencia: No se encontró la columna 'Total €'. Se usará la última columna.");
        return lastColumnIndex + 1;
      },

      getMonthsDifference: function (startDate, endDate) {
        var diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        diffMonths -= startDate.getMonth();
        diffMonths += endDate.getMonth();
        return diffMonths < 0 ? 0 : diffMonths;
      },



      //------------------------------------------------------------------------



      //-----------------Metodo navegacion pagina APP---------
      onNavToView1: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);



        // Agrega un punto de interrupción aquí para verificar que oRouter y this estén definidos correctamente
        // console.log("Navigating to View1");

        oRouter.navTo("appNoparame");
      },
      //-----------------------------------------------------




      //--------------Visible table Facturacion------------
      onSelectOpx: function (oEvent) {
        var selectedItem = this.byId("slct_inic").getSelectedItem();

        if (!selectedItem) {
          console.warn("No se ha seleccionado ningún item en slct_inic");
          return;
        }

        var selectedText = selectedItem.getText();
        //  console.log("Valor seleccionado:", selectedText);

        var oTable = this.getView().byId("table0");

        if (selectedText === "Opex Servicios" || selectedText === "Proyecto/Servicio de Inversión") {
          this.byId("input2_172475612").setValue("0.00");
          this.byId("text67_1728582763477").setText("Opex Servicios  - El Margen debe ser establecido al 0%");
        } else {
          this.byId("input2_172475612").setValue("0.00");
          this.byId("text67_1728582763477").setText("0.00");
        }

        if (selectedText === "Proyecto/Servicio a Cliente Externo") {
          oTable.setVisible(true);
          this.byId("idCheckMensual").setVisible(true);
          this.byId("idComentarioTipo").setVisible(true);
          this.byId("TextoCon").setVisible(true);
          this.byId("input2_17221205").setValue("20.00");
          this.byId("text67_1728582763477").setText("Margen por defecto 20%, si es inferior al 14,29% la propuesta debe pasar por comité");

        } else if (selectedText === "Proyecto/Servicio Interno PdV") {
          this.byId("idComenpVd").setEditable(true);
          this.byId("input2_17221205").setValue("10.00");
          this.byId("text67_1728582763477").setText("Margen por defecto 10%, si el Margen es inferior al 5% la propuesta debe pasar por comité");

        } else if (selectedText === "Proyecto/Servicio de Inversión") {
          this.byId("input2_17221205").setValue("0.00");
          this.byId("text67_1728582763477").setText("Proyecto/Servicio de Inversión - El Margen debe ser establecido al 0%");

        } else if (selectedText === "Opex Servicios") {
          this.byId("input2_17221205").setValue("0.00");
          this.byId("text67_1728582763477").setText("Opex Servicios - El Margen debe ser establecido al 0%");

        } else {
          oTable.setVisible(false);
          this.byId("idComenpVd").setEditable(false);
          this.byId("idComentarioTipo").setVisible(false);
          this.byId("TextoCon").setVisible(false);
          this.byId("idCheckMensual").setVisible(false);
          this.byId("input2_17221205").setValue("");
        }
      },





      //------------------------------------------------------






      //Visible Table Muli
      onCheckBoxSelectMulti: function (oEvent) {

        var oCheckBox = oEvent.getSource();
        var bSelected = oCheckBox.getSelected();
        // console.log("Checkbox selected: ", bSelected);

        var oTable = this.byId("table_clienteFac");
        //    console.log("Table found: ", !!oTable);

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


        // -----    Seleccion Capex o Opex 
        var oSelectNatu = this.byId("idNatu");

        // Los textos que fuerzan CAPEX
        var aCapexOptions = [
          "Proyecto/Servicio Inversión",
          "Proyecto/Servicio Interno PdV",
          "Proyecto/Servicio a Cliente Externo"
        ];

        // 1 Determinar CAPEX u OPEX
        var sTargetText = aCapexOptions.includes(sSelectValue4) ? "CAPEX" : "OPEX";
        oSelectNatu.getItems().forEach(function (oItem) {
          if (oItem.getText().trim() === sTargetText) {
            oSelectNatu.setSelectedKey(oItem.getKey());
          }
        });


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
        this.byId("text72_1731325324246").setText(sSelectValue4);
        this.byId("text73_1731325328049").setText(sSelectValue5);
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



          if (sOtherCheckboxId === "box_condi") {

            this.byId("idTextComProve").setEditable(true);

          } else {

            this.byId("idTextComProve").setEditable(false);

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



    });


    function generateUUID() {
      // Generador simple de UUID v4
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },
  function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
  }

);
