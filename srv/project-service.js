module.exports = cds.service.impl(async function () {

  const { DatosProyect } = this.entities;

  this.on('CREATE', 'DatosProyect', async (req) => {

    const { codigoProyect, nameProyect, spluriAnual, sClienteFac, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones, Naturaleza_ID, Iniciativa_ID, Area_ID, jefeProyectID_ID , Seguimiento_ID,EjecucionVia_ID, AmReceptor_ID , Vertical_ID} = req.data;

    // Aquí podrías hacer validaciones si es necesario

    try {

      const result = await INSERT.into(DatosProyect).entries({
        codigoProyect, nameProyect, spluriAnual, sClienteFac, sMultiJuri, sMultiJuri,objetivoAlcance,AsuncionesyRestricciones,

        Naturaleza: { ID: Naturaleza_ID }, Iniciativa: { ID: Iniciativa_ID }, Area: { ID: Area_ID }, jefeProyectID: { ID: jefeProyectID_ID }, Seguimiento: {ID: Seguimiento_ID }, 
        EjecucionVia: { ID: EjecucionVia_ID }, AmReceptor: {ID: AmReceptor_ID},  Vertical: {ID: Vertical_ID}
      });

      return result;

    } catch (error) {

      req.reject(400, 'Error al insertar los dato');

    }

  });


this.on('READ', 'DatosProyect', async (req) => {
    const { ID } = req.data;
    // Verifica que ID no esté vacío o nulo
    if (!ID) {
        req.error(400, 'ID is required');
        return;
    }

    try {
        const result = await SELECT.from(DatosProyect).where({ ID });
        return result;
    } catch (error) {
        req.error(500, 'Error fetching data: ' + error.message);
    }
});


  

});