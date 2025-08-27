namespace db.datos;

using {
  cuid,
  managed
} from '@sap/cds/common';

@cds.persistence.journal
entity Jefeproyect {
  key ID        : UUID @cds.auto;
      matricula : Decimal(20, 4);
      name      : String;
      lastname  : String;
      valueJefe : String;
      Activo    : Boolean;
}
@cds.persistence.journal

entity TipoCompra {
  key ID    : UUID @cds.auto;
      tipo  : String;
      valor : String;
}
@cds.persistence.journal

entity MotivoCondi {
  key ID    : UUID @cds.auto;
      tipo  : String;
      valor : String;
}
@cds.persistence.journal

entity Archivos : cuid, managed {
  key ID              : UUID;
      nombre          : String;
      tipoMime        : String; // sin @Core.IsMediaType aquí

      @Core.MediaType                  : 'tipoMime'
      @Core.ContentDisposition.Filename: 'nombre'
      contenido       : LargeBinary;
      datosProyect_ID : UUID;
}


@cds.persistence.journal
entity DatosProyect {
  key ID                       : UUID @cds.auto;
      codigoProyect            : Integer;
      nameProyect              : String;
      pluriAnual               : Boolean;
      funcionalString          : String;
      clienteFacturacion       : String;
      multijuridica            : Boolean;
      IPC_apli                 : Decimal(20, 4);
      costeEstructura          : Decimal(20, 4);
      objetivoAlcance          : LargeString;
      AsuncionesyRestricciones : LargeString;
      datosExtra               : LargeString;
      Oferta                   : Boolean;
      modalidad                : String;
      fechaComite              : Date;
      CambioEuRUSD             : Decimal(20, 4);
      Estado                   : String;
      Email                    : String;
      Empleado                 : String;
      fechaCreacion            : DateTime;
      descripcion              : String;
      mensual                  : Boolean;
      comentarioTipoCompra     : LargeString;
      comentarioFacturacion    : LargeString;
      comentarioProveedor      : LargeString;
      comentarioPvD            : LargeString;
      Total                    : Decimal(20, 4);
      Fechainicio              : DateTime;
      FechaFin                 : DateTime;
      FechaModificacion        : Date;
      ClienteNuevo             : Association to ClienteNuevo;
      TipoServicio             : Association to TipoServicio;
      Vertical                 : Association to Vertical;
      Naturaleza               : Association to Naturaleza;
      Seguimiento              : Association to Seguimiento;
      EjecucionVia             : Association to EjecucionVia;
      AmReceptor               : Association to AMreceptor;
      Iniciativa               : Association to TipoIniciativa;
      Area                     : Association to Area;
      jefeProyectID            : Association to Jefeproyect;
      TipoCompra               : Association to TipoCompra;
      MotivoCondi              : Association to MotivoCondi;
      Usuarios                 : Association to Usuarios;
      versiones                : Composition of many SolicitudesVersiones
                                   on versiones.datosProyect = $self;
      Archivos                 : Association to Archivos
                                   on Archivos.datosProyect_ID = ID;
      RecursosInternos         : Association to RecursosInternos
                                   on RecursosInternos.datosProyect_ID = ID;
      otrosGastoRecu           : Association to many otrosGastoRecu
                                   on otrosGastoRecu.datosProyect_ID = ID;

      otrosRecursos            : Association to many otrosGastoRecu
                                   on otrosRecursos.datosProyect_ID = ID;
      ProveedoresC             : Association to many ProveedoresC
                                   on ProveedoresC.datosProyect_ID = ID;
      planificacion            : Association to many planificacion
                                   on planificacion.datosProyect_ID = ID; // Asociación a planificaciones
      Facturacion              : Association to many Facturacion
                                   on Facturacion.datosProyect_ID = ID;
      ClientFactura            : Association to many ClientFactura
                                   on ClientFactura.datosProyect_ID = ID;
      ConsumoExternos          : Association to many ConsumoExternos
                                   on ConsumoExternos.datosProyect_ID = ID;
      otrosServiciosConsu      : Association to many otrosServiciosConsu
                                   on otrosServiciosConsu.datosProyect_ID = ID;


      GastoViajeConsumo        : Association to many GastoViajeConsumo
                                   on GastoViajeConsumo.datosProyect_ID = ID;
      RecursosExternos         : Association to many RecursosExternos
                                   on RecursosExternos.datosProyect_ID = ID;

      serviRecurExter          : Association to many serviRecurExter
                                   on serviRecurExter.datosProyect_ID = ID;

      GastoViajeRecExter       : Association to many GastoViajeRecExter
                                   on GastoViajeRecExter.datosProyect_ID = ID;
      otrosConceptos           : Association to many otrosConceptos
                                   on otrosConceptos.datosProyect_ID = ID;

      LicenciasCon             : Association to many LicenciasCon
                                   on LicenciasCon.datosProyect_ID = ID;
      WorkflowInstancias       : Association to many WorkflowInstancias
                                   on WorkflowInstancias.datosProyect_ID = ID;
      PerfilTotal              : Association to many PerfilTotal
                                   on PerfilTotal.datosProyect_ID = ID;
      RecurInterTotal          : Association to RecurInterTotal
                                   on RecurInterTotal.datosProyect_ID = ID;

      ConsuExterTotal          : Association to ConsuExterTotal
                                   on ConsuExterTotal.datosProyect_ID = ID;

      RecuExterTotal           : Association to RecuExterTotal
                                   on RecuExterTotal.datosProyect_ID = ID;

      InfraestrLicencia        : Association to many InfraestrLicencia
                                   on InfraestrLicencia.datosProyect_ID = ID;

      ResumenCostesTotal       : Association to many ResumenCostesTotal
                                   on ResumenCostesTotal.datosProyect_ID = ID;

      planServicio            : Association to many planServicio on planServicio.datosProyect_ID = ID;
};

@cds.persistence.journal

entity SolicitudesVersiones {
  key ID           : UUID;
      datosProyect : Association to DatosProyect;
      version      : Integer;
      nombre       : String;
      estado       : String;
      createdAt    : Timestamp;
}

@cds.persistence.journal

entity Usuarios {
  key ID           : UUID @cds.auto;
      nombre       : String;
      email        : String;
      departamento : String;
      rol          : String;
}

@cds.persistence.journal
entity Area {
  key ID         : UUID @cds.auto;
      valueArea  : String;
      NombreArea : String;
      Activo     : Boolean;

};


@cds.persistence.journal

entity PerfilConsumo {
  key ID            : UUID @cds.auto;
      nombrePerfilC : String;
      valuePerfilC  : String;
};

@cds.persistence.journal

type UserInfo {
  id    : String;
  email : String;
  name  : String;
}

@cds.persistence.journal

entity Vertical {
  key ID             : UUID @cds.auto;
      valueVertical  : String;
      NombreVertical : String;
      Activo         : Boolean;

};


@cds.persistence.journal

entity ClienteNuevo {
  key ID                 : UUID @cds.auto;
      valueClienteNuevo  : String;
      NombreClienteNuevo : String;
      Activo             : Boolean;

};

@cds.persistence.journal

entity Naturaleza {
  key ID               : UUID @cds.auto;
      valueNaturaleza  : String;
      NombreNaturaleza : String;
      Activo           : Boolean;

};


@cds.persistence.journal

entity Seguimiento {
  key ID                : UUID @cds.auto;
      valueSeguimiento  : String;
      NombreSeguimiento : String;
      Activo            : Boolean;

};

@cds.persistence.journal

entity AMreceptor {
  key ID               : UUID @cds.auto;
      valueAMreceptor  : String;
      NombreAMreceptor : String;
      Activo           : Boolean;

};

@cds.persistence.journal

entity EjecucionVia {
  key ID             : UUID @cds.auto;
      valueEjecuVia  : String;
      NombreEjecuVia : String;
      Activo         : Boolean;

};

@cds.persistence.journal

entity TipoServicio {
  key ID             : UUID @cds.auto;
      valueTipoServ  : String;
      NombreTipoServ : String;
      Activo         : Boolean;

};

@cds.persistence.journal

entity TipoIniciativa {
  key ID               : UUID @cds.auto;
      valueinicia      : String;
      NombreIniciativa : String;
      Activo           : Boolean;

};


@cds.persistence.journal


entity planificacion {
  key ID              : UUID @cds.auto;
      hito            : String;
      fecha_inicio    : Date;
      fecha_fin       : Date;
      duracion        : Time;
      datosProyect_ID : UUID; // Clave foránea a DatosProyect
};

@cds.persistence.journal
entity planServicio {
  key ID              : UUID @cds.auto;
      hito            : String;
      fecha_inicio    : Date;
      fecha_fin       : Date;
      duracion : Integer;  
      datosProyect_ID : UUID; // Clave foránea a DatosProyect
};



@cds.persistence.journal

entity Facturacion {
  key ID              : UUID @cds.auto;
      descripcionHito : String;
      fechaEstimida   : Date;
      facturacion     : Decimal(20, 4);
      total           : Decimal(20, 4);
      datosProyect_ID : UUID;
};


// ----- RECURSO INTERNO  ----------------------

@cds.persistence.journal

entity RecursosInternos {
  key ID                : UUID @cds.auto;
      ConceptoOferta    : String;
      PMJ               : Decimal(20, 4);
      year1             : Decimal(20, 4);
      year2             : Decimal(20, 4);
      year3             : Decimal(20, 4);
      year4             : Decimal(20, 4);
      year5             : Decimal(20, 4);
      year6             : Decimal(20, 4);
      total             : Decimal(20, 4);
      totalE            : Decimal(20, 4);
      tipoServicio      : Association to TipoServicio;
      Vertical          : Association to Vertical;
      PerfilServicio    : Association to PerfilServicio;
      datosProyect_ID   : UUID;
      ValorMensuReInter : Association to many ValorMensuReInter
                            on ValorMensuReInter.RecursosInternos_ID = ID;
};


///    SERVICIO DE RECURSO INTERNO

@cds.persistence.journal

entity otrosGastoRecu {
  key ID                    : UUID @cds.auto;
      ConceptoOferta        : String;
      PMJ                   : Decimal(20, 4);
      mesYear               : Date;
      year1                 : Decimal(20, 4);
      year2                 : Decimal(20, 4);
      year3                 : Decimal(20, 4);
      year4                 : Decimal(20, 4);
      year5                 : Decimal(20, 4);
      year6                 : Decimal(20, 4);
      total                 : Decimal(20, 4);
      totalE                : Decimal(20, 4);
      tipoServicio          : Association to TipoServicio;
      Vertical              : Association to Vertical;
      datosProyect_ID       : UUID;

      ValorMensuServReInter : Association to ValorMensuServReInter
                                on ValorMensuServReInter.otrosGastoRecu_ID = ID;

}


// ----- GASTOS DE VIAJEEE
@cds.persistence.journal

entity otrosRecursos {
  key ID                       : UUID @cds.auto;
      ConceptoOferta           : String;
      PMJ                      : Decimal(20, 4);
      year1                    : Decimal(20, 4);
      year2                    : Decimal(20, 4);
      year3                    : Decimal(20, 4);
      year4                    : Decimal(20, 4);
      year5                    : Decimal(20, 4);
      year6                    : Decimal(20, 4);
      total                    : Decimal(20, 4);
      totalE                   : Decimal(20, 4);
      tipoServicio             : Association to TipoServicio;
      Vertical                 : Association to Vertical;
      datosProyect_ID          : UUID;
      ValorMensuGastViaReInter : Association to many ValorMensuGastViaReInter
                                   on ValorMensuGastViaReInter.otrosRecursos_ID = ID;
}

@cds.persistence.journal

entity ValorMensuReInter {
  key ID                  : UUID @cds.auto;
      RecursosInternos_ID : UUID;
      mesAno              : String;
      valor               : Decimal(20, 4);
};

@cds.persistence.journal

entity ValorMensuServReInter {
  key ID                : UUID @cds.auto;
      otrosGastoRecu_ID : UUID;
      mesAno            : String;
      valor             : Decimal(20, 4);
};

@cds.persistence.journal

entity ValorMensuGastViaReInter {
  key ID               : UUID @cds.auto;
      otrosRecursos_ID : UUID;
      mesAno           : String;
      valor            : Decimal(20, 4);
};
//************************************************ */


//--------------- Consumo Externo -------------------------

@cds.persistence.journal

entity ConsumoExternos {

  key ID                : UUID @cds.auto;
      ConceptoOferta    : String;
      PMJ               : Decimal(20, 4);
      year1             : Decimal(20, 4);
      year2             : Decimal(20, 4);
      year3             : Decimal(20, 4);
      year4             : Decimal(20, 4);
      year5             : Decimal(20, 4);
      year6             : Decimal(20, 4);
      total             : Decimal(20, 4);
      totalC            : Decimal(20, 4);
      tipoServicio      : Association to TipoServicio;
      Vertical          : Association to Vertical;
      PerfilConsumo     : Association to PerfilConsumo;
      datosProyect_ID   : UUID;
      ValorMensuConsuEx : Association to many ValorMensuConsuEx
                            on ValorMensuConsuEx.ConsumoExternos_ID = ID;
};

@cds.persistence.journal

entity otrosServiciosConsu {
  key ID                    : UUID @cds.auto;
      ConceptoOferta        : String;
      PMJ                   : Decimal(20, 4);
      mesYear               : Date;
      year1                 : Decimal(20, 4);
      year2                 : Decimal(20, 4);
      year3                 : Decimal(20, 4);
      year4                 : Decimal(20, 4);
      year5                 : Decimal(20, 4);
      year6                 : Decimal(20, 4);
      total                 : Decimal(20, 4);
      totalE                : Decimal(20, 4);
      tipoServicio          : Association to TipoServicio;
      Vertical              : Association to Vertical;
      datosProyect_ID       : UUID;
      ValorMensuServConsuEx : Association to many ValorMensuServConsuEx
                                on ValorMensuServConsuEx.otrosServiciosConsu_ID = ID;
};

@cds.persistence.journal

entity GastoViajeConsumo {
  key ID                        : UUID @cds.auto;
      ConceptoOferta            : String;
      PMJ                       : Decimal(20, 4);
      mesYear                   : Date;
      year1                     : Decimal(20, 4);
      year2                     : Decimal(20, 4);
      year3                     : Decimal(20, 4);
      year4                     : Decimal(20, 4);
      year5                     : Decimal(20, 4);
      year6                     : Decimal(20, 4);
      total                     : Decimal(20, 4);
      totalE                    : Decimal(20, 4);
      tipoServicio              : Association to TipoServicio;
      Vertical                  : Association to Vertical;
      datosProyect_ID           : UUID;
      ValorMensuGastoViaConsuEx : Association to many ValorMensuGastoViaConsuEx
                                    on ValorMensuGastoViaConsuEx.GastoViajeConsumo_ID = ID;
};

@cds.persistence.journal

entity ValorMensuConsuEx {
  key ID                 : UUID @cds.auto;
      ConsumoExternos_ID : UUID;
      mesAno             : String;
      valor              : Decimal(20, 4);
};


@cds.persistence.journal

entity ValorMensuServConsuEx {
  key ID                     : UUID @cds.auto;
      otrosServiciosConsu_ID : UUID;
      mesAno                 : String;
      valor                  : Decimal(20, 4);
};

@cds.persistence.journal

entity ValorMensuGastoViaConsuEx {
  key ID                   : UUID @cds.auto;
      GastoViajeConsumo_ID : UUID;
      mesAno               : String;
      valor                : Decimal(20, 4);
};
//*********************************************** */


//------- RECURSO EXTERNO ----------------

@cds.persistence.journal
entity RecursosExternos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Decimal(20, 4);
      mesYear             : Date;
      year1               : Decimal(20, 4);
      year2               : Decimal(20, 4);
      year3               : Decimal(20, 4);
      year4               : Decimal(20, 4);
      year5               : Decimal(20, 4);
      year6               : Decimal(20, 4);
      total               : Decimal(20, 4);
      totalR              : Decimal(20, 4);
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      PerfilServicio      : String;
      datosProyect_ID     : UUID;
      ValorMensuRecuExter : Association to many ValorMensuRecuExter
                              on ValorMensuRecuExter.RecursosExternos_ID = ID;

};


@cds.persistence.journal
entity serviRecurExter {
  key ID                 : UUID @cds.auto;
      ConceptoOferta     : String;
      PMJ                : Decimal(20, 4);
      mesYear            : Date;
      year1              : Decimal(20, 4);
      year2              : Decimal(20, 4);
      year3              : Decimal(20, 4);
      year4              : Decimal(20, 4);
      year5              : Decimal(20, 4);
      year6              : Decimal(20, 4);
      total              : Decimal(20, 4);
      totalE             : Decimal(20, 4);
      tipoServicio       : Association to TipoServicio;
      Vertical           : Association to Vertical;
      datosProyect_ID    : UUID;
      ValorMensuSerExter : Association to many ValorMensuSerExter
                             on ValorMensuSerExter.ServiRecurExterno_ID = ID;
};

@cds.persistence.journal
entity GastoViajeRecExter {
  key ID                     : UUID @cds.auto;
      ConceptoOferta         : String;
      PMJ                    : Decimal(20, 4);
      mesYear                : Date;
      year1                  : Decimal(20, 4);
      year2                  : Decimal(20, 4);
      year3                  : Decimal(20, 4);
      year4                  : Decimal(20, 4);
      year5                  : Decimal(20, 4);
      year6                  : Decimal(20, 4);
      total                  : Decimal(20, 4);
      totalE                 : Decimal(20, 4);
      tipoServicio           : Association to TipoServicio;
      Vertical               : Association to Vertical;
      datosProyect_ID        : UUID;
      ValorMensuGastoViExter : Association to many ValorMensuGastoViExter
                                 on ValorMensuGastoViExter.GastoViajeRecExter_ID = ID;
}

@cds.persistence.journal
entity ValorMensuRecuExter {
  key ID                  : UUID @cds.auto;
      RecursosExternos_ID : UUID;
      mesAno              : String;
      valor               : Decimal(20, 4);
};

@cds.persistence.journal
entity ValorMensuSerExter {
  key ID                   : UUID @cds.auto;
      ServiRecurExterno_ID : UUID;
      mesAno               : String;
      valor                : Decimal(20, 4);
};

@cds.persistence.journal
entity ValorMensuGastoViExter {
  key ID                    : UUID @cds.auto;
      GastoViajeRecExter_ID : UUID;
      mesAno                : String;
      valor                 : Decimal(20, 4);
};

//************************************** */

@cds.persistence.journal
entity otrosConceptos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Decimal(20, 4);
      mesYear             : Date;
      year1               : Decimal(20, 4);
      year2               : Decimal(20, 4);
      year3               : Decimal(20, 4);
      year4               : Decimal(20, 4);
      year5               : Decimal(20, 4);
      year6               : Decimal(20, 4);
      total               : Decimal(20, 4);
      totalC              : Decimal(20, 4);
      Vertical            : Association to Vertical;
      datosProyect_ID     : UUID;
      ValorMensuOtrConcep : Association to many ValorMensuOtrConcep
                              on ValorMensuOtrConcep.otrosConceptos_ID = ID;

};

@cds.persistence.journal

entity ValorMensuOtrConcep {
  key ID                : UUID @cds.auto;
      otrosConceptos_ID : UUID;
      mesAno            : String;
      valor             : Decimal(20, 4);
};


@cds.persistence.journal
entity LicenciasCon {
  key ID                 : UUID @cds.auto;
      ConceptoOferta     : String;
      PMJ                : Decimal(20, 4);
      mesYear            : Date;
      year1              : Decimal(20, 4);
      year2              : Decimal(20, 4);
      year3              : Decimal(20, 4);
      year4              : Decimal(20, 4);
      year5              : Decimal(20, 4);
      year6              : Decimal(20, 4);
      total              : Decimal(20, 4);
      totalC             : Decimal(20, 4);
      Vertical           : Association to Vertical;
      datosProyect_ID    : UUID;
      ValorMensulicencia : Association to many ValorMensulicencia
                             on ValorMensulicencia.licencia_ID = ID

};

@cds.persistence.journal

entity ValorMensulicencia {
  key ID          : UUID @cds.auto;
      licencia_ID : UUID;
      mesAno      : String;
      valor       : Decimal(20, 4);
};


@cds.persistence.journal
entity PerfilServicio {
  key ID           : UUID @cds.auto;
      valuePerfil  : String;
      NombrePerfil : String;
      Activo         : Boolean;


};

@cds.persistence.journal

entity ProveedoresC {
  key ID              : UUID @cds.auto;
      checkCondi      : Boolean;
      checkProveedor  : Boolean;
      valueCondi      : String;
      valueProvee     : String;
      datosProyect_ID : UUID; // Clave foránea a DatosProyect
};

@cds.persistence.journal

entity ClientFactura {
  key ID              : UUID @cds.auto;
      juridica        : String;
      oferta          : String;
      total           : Decimal(20, 4);
      datosProyect_ID : UUID;

};


@cds.persistence.journal
entity WorkflowInstancias {
  key ID              : UUID @cds.auto;
      workflowId      : String;
      estado          : String;
      creadoEn        : Timestamp;
      actualizadoEn   : Timestamp;
      creadoPor       : String;
      datosProyect_ID : UUID;
      etapas          : Association to many WorkflowEtapas
                          on etapas.workflow_ID = ID
                             @cds.on.delete: 'cascade';


};

@cds.persistence.journal
entity WorkflowEtapas {
  key ID             : UUID @cds.auto;
      workflow_ID    : UUID;
      taskInstanceId : String; // NUEVO: guardar aquí el ID de la tarea activa
      nombreEtapa    : String; // "Control PMO", "Dirección", etc.
      asignadoA      : String; // email del aprobador
      aprobadoPor    : String; // se llena cuando se aprueba
      estado         : String; // "Pendiente", "Aprobado", "Rechazado"
      comentario     : String;
      fechaAprobado  : Timestamp;
};

@cds.persistence.journal

entity PerfilTotal {
  key ID              : UUID @cds.auto;
      totalJorRI      : Decimal(20, 4);
      totalJorCE      : Decimal(20, 4);
      totalJorRE      : Decimal(20, 4);
      Total           : Decimal(20, 4);
      datosProyect_ID : UUID;

};

@cds.persistence.journal
entity RecurInterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Decimal(20, 4);
      OtrosServicios  : Decimal(20, 4);
      GastosdeViaje   : Decimal(20, 4);
      Total           : Decimal(20, 4);

};

@cds.persistence.journal

entity ConsuExterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Decimal(20, 4);
      OtrosServicios  : Decimal(20, 4);
      GastosdeViaje   : Decimal(20, 4);
      Total           : Decimal(20, 4);
};


@cds.persistence.journal
entity RecuExterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Decimal(20, 4);
      OtrosServicios  : Decimal(20, 4);
      GastosdeViaje   : Decimal(20, 4);
      Total           : Decimal(20, 4);

};

@cds.persistence.journal

entity InfraestrLicencia {
  key ID               : UUID @cds.auto;
      datosProyect_ID  : UUID;
      totalInfraestruc : Decimal(20, 4);
      totalLicencia    : Decimal(20, 4);
}

@cds.persistence.journal

entity ResumenCostesTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      Subtotal        : Decimal(20, 4);
      CosteEstruPorce : Decimal(20, 4);
      Costeestructura : Decimal(20, 4);
      MargenPorce     : Decimal(20, 4);
      Margeingresos   : Decimal(20, 4);
      total           : Decimal(20, 4);


}
