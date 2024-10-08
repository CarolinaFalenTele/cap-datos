using DatosCDOService as service from '../../srv/datosCDO-service';

annotate DatosCDOService.DatosProyect with @(UI: {
    
    
    LineItem: [
    {
        $Type: 'UI.DataField',
        Label: 'Codigo Proyecto',
        Value: codigoProyect
    },
    {
        $Type: 'UI.DataField',
        Label: 'Nombre Proyecto',
        Value: nameProyect
    },
    {
        $Type: 'UI.DataField',
        Label: 'Nombre Proyecto',
        Value: Fechainicio
    },
    {
        $Type: 'UI.DataField',
        Label: 'Área',
        Value: Area.NombreArea
    },
    {
        $Type: 'UI.DataField',
        Label: 'Jefe Proyecto',
        Value: jefeProyectID.name
    }

],
     
});
annotate DatosCDOService.Area with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreArea, Label: 'Nombre de Área' }

    ]
});


annotate DatosCDOService.Jefeproyect with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: name, Label: 'Nombre de JefeProyect' },
        { $Type: 'UI.DataField', Value: lastname, Label: 'Apellido' },
          { $Type: 'UI.DataField', Value: matricula, Label: 'Matricula' }
    ]
});

annotate DatosCDOService.TipoIniciativa with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreIniciativa, Label: 'Nombre de inicitiva' },

    ]
});


annotate DatosCDOService.Vertical with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreVertical, Label: 'Nombre Vertical' },

    ]
});

annotate DatosCDOService.clienteFuncional with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreClienteFun, Label: 'Nombre ClienteFuncional' },

    ]
});
annotate DatosCDOService.Naturaleza with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreNaturaleza, Label: 'Nombre Naturaleza' },

    ]
});

annotate DatosCDOService.Seguimiento with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreSeguimiento, Label: 'Nombre Seguimiento' },

    ]
});


annotate DatosCDOService.EjecucionVia with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreEjecuVia, Label: 'Nombre Seguimiento' },

    ]
});


annotate DatosCDOService.AMreceptor with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: NombreAMreceptor, Label: 'Nombre Seguimiento' },

    ]
});

annotate DatosCDOService.planificacion with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: hito, Label: 'Nombre Hito' },
        { $Type: 'UI.DataField', Value: fecha_inicio, Label: 'fecha Inicio' },
        { $Type: 'UI.DataField', Value: fecha_fin, Label: 'Fecha Fin' },


    ]
});
/*-
annotate DatosCDOService.Proveedores with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: condicionado, Label: 'booleanCondi' },
        { $Type: 'UI.DataField', Value: proveedor, Label: 'booleanProvee' },
        { $Type: 'UI.DataField', Value: valorCondicionado, Label: 'condicionado' },
        { $Type: 'UI.DataField', Value: valorProveedor, Label: 'Proveedor' },

    ]
});*/

annotate DatosCDOService.PerfilServicio with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: valuePerfil, Label: 'Value Perfil' },
        { $Type: 'UI.DataField', Value: NombrePerfil, Label: 'Nombre Perfil' }

    ]
});

annotate DatosCDOService.TipoServicio with @(UI: {
    LineItem: [
       
        { $Type: 'UI.DataField', Value: ID, Label: 'ID' },
        { $Type: 'UI.DataField', Value: valueTipoServ, Label: 'Value Servicio' },
        { $Type: 'UI.DataField', Value: NombreTipoServ, Label: 'Nombre Servicio' },
   

    ]
});