
module.exports = cds.service.impl(async function () {

  const { DatosProyect, ProveedoresC ,planificacion } = this.entities;

  this.on('CREATE', 'DatosProyect', async (req) => {

    const { codigoProyect, nameProyect, spluriAnual, sClienteFac, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones, Naturaleza_ID, Iniciativa_ID, Area_ID, jefeProyectID_ID , Seguimiento_ID,EjecucionVia_ID, AmReceptor_ID , Vertical_ID  } = req.data;

    // Aquí podrías hacer validaciones si es necesario

    try {

      const result = await INSERT.into(DatosProyect).entries({
        codigoProyect, nameProyect, spluriAnual, sClienteFac, sMultiJuri, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones,

        Naturaleza: { ID: Naturaleza_ID }, Iniciativa: { ID: Iniciativa_ID }, Area: { ID: Area_ID }, jefeProyectID: { ID: jefeProyectID_ID }, Seguimiento: {ID: Seguimiento_ID }, 
        EjecucionVia: { ID: EjecucionVia_ID }, AmReceptor: {ID: AmReceptor_ID},  Vertical: {ID: Vertical_ID}
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


});