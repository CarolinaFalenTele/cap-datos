module.exports = cds.service.impl(async function () {

  const { DatosProyect, Proveedores } = this.entities;

  this.on('CREATE', 'DatosProyect', async (req) => {
    const {
      codigoProyect,
      nameProyect,
      pluriAnual,
      clienteFacturacion,
      multijuridica,
      Fechainicio,
      FechaFin,
      clienteFuncional,
      Naturaleza_ID,
      Iniciativa_ID,
      Area_ID,
      jefeProyectID_ID,
      objetivoAlcance,
      AsuncionesyRestricciones,
      Proveedores: ProveedoresData // Recibe los proveedores como parte de la solicitud
    } = req.data;

    try {
      // 1. Inserción de DatosProyect
      const [datosProyectResult] = await INSERT.into(DatosProyect).entries({
        codigoProyect,
        nameProyect,
        pluriAnual,
        clienteFacturacion,
        multijuridica,
        Fechainicio,
        FechaFin,
        clienteFuncional,
        objetivoAlcance,
        AsuncionesyRestricciones,
        Naturaleza: { ID: Naturaleza_ID },
        Iniciativa: { ID: Iniciativa_ID },
        Area: { ID: Area_ID },
        jefeProyectID: { ID: jefeProyectID_ID }
      }).columns('ID'); // Asegura que recuperamos el ID generado

      if (!datosProyectResult) {
        req.reject(400, 'Error al insertar DatosProyect');
        return;
      }

      const datosProyectID = datosProyectResult.ID;

      // 2. Inserción de Proveedores vinculados al proyecto recién creado
      if (ProveedoresData && ProveedoresData.length > 0) {
        const proveedoresInsert = ProveedoresData.map((proveedor) => ({
          condicionado: proveedor.condicionado,
          proveedor: proveedor.proveedor,
          valorCondicionado: proveedor.valorCondicionado,
          valorProveedor: proveedor.valorProveedor,
          datosProyect_ID: datosProyectID // Vinculamos el proveedor con el proyecto
        }));

        await INSERT.into(Proveedores).entries(proveedoresInsert);
      }

      return datosProyectResult;

    } catch (error) {
      console.error('Error al insertar datos:', error);
      req.reject(400, 'Error al insertar los datos');
    }
  });
});
