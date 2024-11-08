
module.exports = cds.service.impl(async function () {

  const { DatosProyect, ProveedoresC,RecursosExternos,LicenciasCon, otrosConceptos ,ValorMensuReInter, GastoViajeRecExter , serviRecurExter ,planificacion, Facturacion, ClientFactura , RecursosInternos, otrosGastoRecu, otrosRecursos, ConsumoExternos , GastoViajeConsumo , otrosServiciosConsu
    
  } = this.entities;

  this.on('CREATE', 'DatosProyect', async (req) => {

    const { codigoProyect, nameProyect, spluriAnual,funcionalString, sClienteFac, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones, Naturaleza_ID, Iniciativa_ID, Area_ID, jefeProyectID_ID , Seguimiento_ID,EjecucionVia_ID, AmReceptor_ID , Vertical_ID ,clienteFuncional_ID  } = req.data;


    try {

      const result = await INSERT.into(DatosProyect).entries({
        codigoProyect, nameProyect, spluriAnual,datosExtra, funcionalString,  sClienteFac, sMultiJuri, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones,

        Naturaleza: { ID: Naturaleza_ID }, Iniciativa: { ID: Iniciativa_ID }, Area: { ID: Area_ID }, jefeProyectID: { ID: jefeProyectID_ID }, Seguimiento: {ID: Seguimiento_ID }, 
        EjecucionVia: { ID: EjecucionVia_ID }, AmReceptor: {ID: AmReceptor_ID},  Vertical: {ID: Vertical_ID}, clienteFuncional: { ID: clienteFuncional_ID }
      });


      //const datosProyect_ID = result.ID;


      return result;

    } catch (error) {

      req.reject(400, 'Error al insertar los dato');

    }

  });




this.on('planificacion', async (req) => {
  const { chartData, projectId } = req.data;

  if (!projectId) {
    req.error(400, 'projectId is required');
    return;
  }


  // Insertar cada planificación en la base de datos
  for (let data of chartData) {
    await INSERT.into(planificacion).entries({
      ID: cds.utils.uuid(),
      hito: data.hito,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      duracion: data.duracion,
      datosProyect_ID: projectId
    })
  }

  return 'Planificación insertada correctamente'
});

  
this.on('ProveedoresC', async (req) => {
  const { ID, projectId , datosProyect_ID } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!projectId) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(ProveedoresC).entries({

        checkCondi, checkProveedor, valueCondi, valueProvee, datosProyect_ID });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


 
this.on('Facturacion', async (req) => {
  const { ID, datosProyect_ID,  } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(Facturacion).entries({

        descripcionHito, fechaEstimida, facturacion, total, datosProyect_ID });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('ClientFactura', async (req) => {
  const { ID, datosProyect_ID } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(ClientFactura).entries({

        juridica, oferta, total, datosProyect_ID });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('RecursosInternos', async (req) => {
  const { ID, datosProyect_ID,  Vertical_ID, PerfilServicio_ID ,tipoServicio_ID } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(RecursosInternos).entries({

        ConceptoOferta, PMJ, total, mesYear,  total , totalE ,datosProyect_ID,  Vertical: {ID: Vertical_ID}, PerfilServicio :{ID : PerfilServicio_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('ValorMensuReInter', async (req) => {
  const { ID, RecursosInternos_ID, mesAno, valor } = req.data;

  // Verifica que los datos no sean nulos
  console.log("Datos recibidos:", req.data);

  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  if (!RecursosInternos_ID) {
      req.error(400, 'recursosInternos_ID is required');
      return;
  }

  if (!mesAno) {
      req.error(400, 'mesAño is required');
      return;
  }

  if (valor === undefined || valor === null) {
      req.error(400, 'valor is required');
      return;
  }

  try {
    console.log("Intentando insertar:", { mesAno, valor, RecursosInternos_ID });
    await INSERT.into(ValorMensuReInter).entries({
      mesAno, 
      valor, 
      RecursosInternos: { ID: RecursosInternos_ID }
    });

    return { message: "Datos insertados correctamente." };

  } catch (error) {
      console.error('Error en la inserción:', error); // Log del error
      req.error(500, 'Error fetching data: ' + error.message);
  }
});







this.on('otrosGastoRecu', async (req) => {
  const { ID, RecursosInternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(otrosGastoRecu).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,RecursosInternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});



this.on('otrosRecursos', async (req) => {
  const { ID, RecursosInternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(otrosRecursos).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,RecursosInternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('ConsumoExternos', async (req) => {
  const { ID, datosProyect_ID,  Vertical_ID, PerfilConsumo_ID ,tipoServicio_ID } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(ConsumoExternos).entries({

        ConceptoOferta, PMJ, total, mesYear,  total , totalC ,datosProyect_ID,  Vertical: {ID: Vertical_ID}, PerfilServicio :{ID : PerfilServicio_ID} , tipoServicio : {ID: tipoServicio_ID}, PerfilConsumo:{ID: PerfilConsumo_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('otrosServiciosConsu', async (req) => {
  const { ID, ConsumoExternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(otrosServiciosConsu).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,ConsumoExternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('GastoViajeConsumo', async (req) => {
  const { ID, ConsumoExternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(GastoViajeConsumo).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,ConsumoExternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});







this.on('RecursosExternos', async (req) => {
  const { ID, datosProyect_ID,  Vertical_ID, PerfilServicio_ID ,tipoServicio_ID } = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(RecursosExternos).entries({

        ConceptoOferta, PMJ, total, mesYear,  total , totalR ,datosProyect_ID,  Vertical: {ID: Vertical_ID}, PerfilServicio , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('serviRecurExter', async (req) => {
  const { ID, RecursosExternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(serviRecurExter).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,RecursosExternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('GastoViajeRecExter', async (req) => {
  const { ID, RecursosExternos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(GastoViajeRecExter).entries({

        ConceptoOferta, PMJ, total, mesYear , totalE ,RecursosExternos_ID,  Vertical: {ID: Vertical_ID} , tipoServicio : {ID: tipoServicio_ID} });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});



this.on('LicenciasCon', async (req) => {
  const { ID, otrosConceptos_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(LicenciasCon).entries({

        ConceptoOferta, PMJ, total, mesYear , totalC , otrosConceptos_ID ,  Vertical: {ID: Vertical_ID}  });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});


this.on('otrosConceptos', async (req) => {
  const { ID, datosProyect_ID , tipoServicio_ID ,Vertical_ID} = req.data;
  // Verifica que ID no esté vacío o nulo
  if (!ID) {
      req.error(400, 'ID is required');
      return;
  }

  try {
      const result = await INSERT.into(otrosConceptos).entries({

        ConceptoOferta, PMJ, total, mesYear , totalC ,datosProyect_ID,  Vertical: {ID: Vertical_ID}  });
      
      return result;

  } catch (error) {
      req.error(500, 'Error fetching data: ' + error.message);
  }
});





});