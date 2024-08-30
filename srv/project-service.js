module.exports = cds.service.impl(async function () {
    const { DatosProyect } = this.entities;
  
    this.on('CREATE', 'DatosProyect', async (req) => {
      const { codigoProyect, nameProyect } = req.data;
      // Aquí podrías hacer validaciones si es necesario
      try {
        const result = await INSERT.into(DatosProyect).entries({ codigoProyect, nameProyect});
        return result;
      } catch (error) {
        req.reject(400, 'Error al insertar los dato');
      }
    });
  });