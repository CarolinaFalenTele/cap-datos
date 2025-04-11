namespace db.datos;


entity Jefeproyect {
  key ID        : UUID @cds.auto;
      matricula : Integer;
      name      : String;
      lastname  : String;
      valueJefe : String;
}


entity DatosProyect {
  key ID                       : UUID     @cds.auto;
      codigoProyect            : Integer;
      nameProyect              : String;
      pluriAnual               : Boolean;
      funcionalString          : String;
      clienteFacturacion       : String;
      multijuridica            : Boolean;
      IPC_apli                 : Integer;
      costeEstructura          : Integer;
      objetivoAlcance          : LargeString;
      AsuncionesyRestricciones : LargeString;
      datosExtra               : LargeString;
      CambioEuRUSD             : Integer;
      Estado                   : String;
      Email                    : String;
      Empleado                 : String; 
      fechaCreacion            : DateTime;
      descripcion              : String;
      Total                    : Integer64;
      Fechainicio              : DateTime;
      FechaFin                 : DateTime;
      FechaModificacion        : Date;
      clienteFuncional         : Association to clienteFuncional;
      TipoServicio             : Association to TipoServicio;
      Vertical                 : Association to Vertical;
      Naturaleza               : Association to Naturaleza;
      Seguimiento              : Association to Seguimiento;
      EjecucionVia             : Association to EjecucionVia;
      AmReceptor               : Association to AMreceptor;
      Iniciativa               : Association to TipoIniciativa;
      Area                     : Association to Area;
      jefeProyectID            : Association to Jefeproyect;
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
      tableProcessFlow         : Association to many tableProcessFlow
                                   on tableProcessFlow.datosProyect_ID = ID;
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
};


entity Area {
  key ID         : UUID @cds.auto;
      valueArea  : String;
      NombreArea : String;
};

entity PerfilConsumo {
  key ID            : UUID @cds.auto;
      nombrePerfilC : String;
      valuePerfilC  : String;
};

type UserInfo {
  id    : String;
  email : String;
  name  : String;
}


entity Vertical {
  key ID             : UUID @cds.auto;
      valueVertical  : String;
      NombreVertical : String;
};

entity clienteFuncional {
  key ID               : UUID @cds.auto;
      valueClienteFun  : String;
      NombreClienteFun : String;
};


entity Naturaleza {
  key ID               : UUID @cds.auto;
      valueNaturaleza  : String;
      NombreNaturaleza : String;
};

entity Seguimiento {
  key ID                : UUID @cds.auto;
      valueSeguimiento  : String;
      NombreSeguimiento : String;
};

entity AMreceptor {
  key ID               : UUID @cds.auto;
      valueAMreceptor  : String;
      NombreAMreceptor : String;
};


entity EjecucionVia {
  key ID             : UUID @cds.auto;
      valueEjecuVia  : String;
      NombreEjecuVia : String;
};


entity TipoServicio {
  key ID             : UUID @cds.auto;
      valueTipoServ  : String;
      NombreTipoServ : String;
};


entity TipoIniciativa {
  key ID               : UUID @cds.auto;
      valueinicia      : String;
      NombreIniciativa : String;
};


entity planificacion {
  key ID              : UUID @cds.auto;
      hito            : String;
      fecha_inicio    : Date;
      fecha_fin       : Date;
      duracion        : Time;
      datosProyect_ID : UUID; // Clave foránea a DatosProyect
};

entity Facturacion {
  key ID              : UUID @cds.auto;
      descripcionHito : String;
      fechaEstimida   : Date;
      facturacion     : Integer;
      total           : Integer;
      datosProyect_ID : UUID;
};


// ----- RECURSO INTERNO  ----------------------
entity RecursosInternos {
  key ID                : UUID @cds.auto;
      ConceptoOferta    : String;
      PMJ               : Integer;
      year1             : Integer;
      year2             : Integer;
      year3             : Integer;
      year4             : Integer;
      year5             : Integer;
      year6             : Integer;
      total             : Integer;
      totalE            : Integer;
      tipoServicio      : Association to TipoServicio;
      Vertical          : Association to Vertical;
      PerfilServicio    : Association to PerfilServicio;
      datosProyect_ID   : UUID;
      ValorMensuReInter : Association to many ValorMensuReInter
                            on ValorMensuReInter.RecursosInternos_ID = ID;
};


///    SERVICIO DE RECURSO INTERNO
entity otrosGastoRecu {
  key ID                    : UUID @cds.auto;
      ConceptoOferta        : String;
      PMJ                   : Integer;
      mesYear               : Date;
      year1                 : Integer;
      year2                 : Integer;
      year3                 : Integer;
      year4                 : Integer;
      year5                 : Integer;
      year6                 : Integer;
      total                 : Integer;
      totalE                : Integer;
      tipoServicio          : Association to TipoServicio;
      Vertical              : Association to Vertical;
      datosProyect_ID       : UUID;

      ValorMensuServReInter : Association to ValorMensuServReInter
                                on ValorMensuServReInter.otrosGastoRecu_ID = ID;

}


// ----- GASTOS DE VIAJEEE

entity otrosRecursos {
  key ID                       : UUID @cds.auto;
      ConceptoOferta           : String;
      PMJ                      : Integer;
      year1                    : Integer;
      year2                    : Integer;
      year3                    : Integer;
      year4                    : Integer;
      year5                    : Integer;
      year6                    : Integer;
      total                    : Integer;
      totalE                   : Integer;
      tipoServicio             : Association to TipoServicio;
      Vertical                 : Association to Vertical;
      datosProyect_ID          : UUID;
      ValorMensuGastViaReInter : Association to many ValorMensuGastViaReInter
                                   on ValorMensuGastViaReInter.otrosRecursos_ID = ID;
}


entity ValorMensuReInter {
  key ID                  : UUID @cds.auto;
      RecursosInternos_ID : UUID;
      mesAno              : String;
      valor               : Integer;
};

entity ValorMensuServReInter {
  key ID                : UUID @cds.auto;
      otrosGastoRecu_ID : UUID;
      mesAno            : String;
      valor             : Integer;
};

entity ValorMensuGastViaReInter {
  key ID               : UUID @cds.auto;
      otrosRecursos_ID : UUID;
      mesAno           : String;
      valor            : Integer;
};
//************************************************ */


//--------------- Consumo Externo -------------------------
entity ConsumoExternos {
  key ID                : UUID @cds.auto;
      ConceptoOferta    : String;
      PMJ               : Integer;
      year1             : Integer;
      year2             : Integer;
      year3             : Integer;
      year4             : Integer;
      year5             : Integer;
      year6             : Integer;
      total             : Integer;
      totalC            : Integer;
      tipoServicio      : Association to TipoServicio;
      Vertical          : Association to Vertical;
      PerfilConsumo     : Association to PerfilConsumo;
      datosProyect_ID   : UUID;
      ValorMensuConsuEx : Association to many ValorMensuConsuEx
                            on ValorMensuConsuEx.ConsumoExternos_ID = ID;
};


entity otrosServiciosConsu {
  key ID                    : UUID @cds.auto;
      ConceptoOferta        : String;
      PMJ                   : Integer;
      mesYear               : Date;
      year1                 : Integer;
      year2                 : Integer;
      year3                 : Integer;
      year4                 : Integer;
      year5                 : Integer;
      year6                 : Integer;
      total                 : Integer;
      totalE                : Integer;
      tipoServicio          : Association to TipoServicio;
      Vertical              : Association to Vertical;
      datosProyect_ID       : UUID;
      ValorMensuServConsuEx : Association to many ValorMensuServConsuEx
                                on ValorMensuServConsuEx.otrosServiciosConsu_ID = ID;
};

entity GastoViajeConsumo {
  key ID                        : UUID @cds.auto;
      ConceptoOferta            : String;
      PMJ                       : Integer;
      mesYear                   : Date;
      year1                     : Integer;
      year2                     : Integer;
      year3                     : Integer;
      year4                     : Integer;
      year5                     : Integer;
      year6                     : Integer;
      total                     : Integer;
      totalE                    : Integer;
      tipoServicio              : Association to TipoServicio;
      Vertical                  : Association to Vertical;
      datosProyect_ID           : UUID;
      ValorMensuGastoViaConsuEx : Association to many ValorMensuGastoViaConsuEx
                                    on ValorMensuGastoViaConsuEx.GastoViajeConsumo_ID = ID;
};

entity ValorMensuConsuEx {
  key ID                 : UUID @cds.auto;
      ConsumoExternos_ID : UUID;
      mesAno             : String;
      valor              : Integer;
};

entity ValorMensuServConsuEx {
  key ID                     : UUID @cds.auto;
      otrosServiciosConsu_ID : UUID;
      mesAno                 : String;
      valor                  : Integer;
};

entity ValorMensuGastoViaConsuEx {
  key ID                   : UUID @cds.auto;
      GastoViajeConsumo_ID : UUID;
      mesAno               : String;
      valor                : Integer;
};
//*********************************************** */


//------- RECURSO EXTERNO ----------------

entity RecursosExternos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Integer;
      mesYear             : Date;
      year1               : Integer;
      year2               : Integer;
      year3               : Integer;
      year4               : Integer;
      year5               : Integer;
      year6               : Integer;
      total               : Integer;
      totalR              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      PerfilServicio      : String;
      datosProyect_ID     : UUID;
      ValorMensuRecuExter : Association to many ValorMensuRecuExter
                              on ValorMensuRecuExter.RecursosExternos_ID = ID;

};


entity serviRecurExter {
  key ID                 : UUID @cds.auto;
      ConceptoOferta     : String;
      PMJ                : Integer;
      mesYear            : Date;
      year1              : Integer;
      year2              : Integer;
      year3              : Integer;
      year4              : Integer;
      year5              : Integer;
      year6              : Integer;
      total              : Integer;
      totalE             : Integer;
      tipoServicio       : Association to TipoServicio;
      Vertical           : Association to Vertical;
      datosProyect_ID    : UUID;
      ValorMensuSerExter : Association to many ValorMensuSerExter
                             on ValorMensuSerExter.ServiRecurExterno_ID = ID;
};

entity GastoViajeRecExter {
  key ID                     : UUID @cds.auto;
      ConceptoOferta         : String;
      PMJ                    : Integer;
      mesYear                : Date;
      year1                  : Integer;
      year2                  : Integer;
      year3                  : Integer;
      year4                  : Integer;
      year5                  : Integer;
      year6                  : Integer;
      total                  : Integer;
      totalE                 : Integer;
      tipoServicio           : Association to TipoServicio;
      Vertical               : Association to Vertical;
      datosProyect_ID        : UUID;
      ValorMensuGastoViExter : Association to many ValorMensuGastoViExter
                                 on ValorMensuGastoViExter.GastoViajeRecExter_ID = ID;
}

entity ValorMensuRecuExter {
  key ID                  : UUID @cds.auto;
      RecursosExternos_ID : UUID;
      mesAno              : String;
      valor               : Integer;
};

entity ValorMensuSerExter {
  key ID                   : UUID @cds.auto;
      ServiRecurExterno_ID : UUID;
      mesAno               : String;
      valor                : Integer;
};

entity ValorMensuGastoViExter {
  key ID                    : UUID @cds.auto;
      GastoViajeRecExter_ID : UUID;
      mesAno                : String;
      valor                 : Integer;
};

//************************************** */

entity otrosConceptos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Integer;
      mesYear             : Date;
      year1               : Integer;
      year2               : Integer;
      year3               : Integer;
      year4               : Integer;
      year5               : Integer;
      year6               : Integer;
      total               : Integer;
      totalC              : Integer;
      Vertical            : Association to Vertical;
      datosProyect_ID     : UUID;
      ValorMensuOtrConcep : Association to many ValorMensuOtrConcep
                              on ValorMensuOtrConcep.otrosConceptos_ID = ID;

};


entity ValorMensuOtrConcep {
  key ID                : UUID @cds.auto;
      otrosConceptos_ID : UUID;
      mesAno            : String;
      valor             : Integer;
};


entity LicenciasCon {
  key ID                 : UUID @cds.auto;
      ConceptoOferta     : String;
      PMJ                : Integer;
      mesYear            : Date;
      year1              : Integer;
      year2              : Integer;
      year3              : Integer;
      year4              : Integer;
      year5              : Integer;
      year6              : Integer;
      total              : Integer;
      totalC             : Integer;
      Vertical           : Association to Vertical;
      datosProyect_ID    : UUID;
      ValorMensulicencia : Association to many ValorMensulicencia
                             on ValorMensulicencia.licencia_ID = ID

};


entity ValorMensulicencia {
  key ID          : UUID @cds.auto;
      licencia_ID : UUID;
      mesAno      : String;
      valor       : Integer;
};


entity PerfilServicio {
  key ID           : UUID @cds.auto;
      valuePerfil  : String;
      NombrePerfil : String;
};

entity ProveedoresC {
  key ID              : UUID @cds.auto;
      checkCondi      : Boolean;
      checkProveedor  : Boolean;
      valueCondi      : String;
      valueProvee     : String;
      datosProyect_ID : UUID; // Clave foránea a DatosProyect
};


entity ClientFactura {
  key ID              : UUID @cds.auto;
      juridica        : String;
      oferta          : String;
      total           : Integer;
      datosProyect_ID : UUID;

};


entity tableProcessFlow {
  key ID              : UUID @cds.auto;
      estado          : String;
      datosProyect_ID : UUID;
};

entity PerfilTotal {
  key ID              : UUID @cds.auto;
      totalJorRI      : Integer;
      totalJorCE      : Integer;
      totalJorRE      : Integer;
      Total           : Integer;
      datosProyect_ID : UUID

};

entity RecurInterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Integer;
      OtrosServicios  : Integer;
      GastosdeViaje   : Integer;
      Total           : Integer;

};

entity ConsuExterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Integer;
      OtrosServicios  : Integer;
      GastosdeViaje   : Integer;
      Total           : Integer;
};


entity RecuExterTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      servicios       : Integer;
      OtrosServicios  : Integer;
      GastosdeViaje   : Integer;
      Total           : Integer;

};

entity InfraestrLicencia {
  key ID               : UUID @cds.auto;
      datosProyect_ID  : UUID;
      totalInfraestruc : Integer;
      totalLicencia    : Integer;
}


entity ResumenCostesTotal {
  key ID              : UUID @cds.auto;
      datosProyect_ID : UUID;
      Subtotal        : Integer;
      CosteEstruPorce : Integer;
      totalLicencias  : Integer;
      Costeestructura : Integer;
      Margeingresos   : Integer;


}
