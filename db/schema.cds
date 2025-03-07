namespace db.datos;


entity Jefeproyect {
  key ID        : UUID @cds.auto;
      matricula : Integer;
      name      : String;
      lastname  : String;
      valueJefe : String;
}


entity DatosProyect {
  key ID                       : UUID @cds.auto;
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
      Fechainicio              : DateTime;
      FechaFin                 : DateTime;
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

      RecursosExternos         : Association to many RecursosExternos
                                   on RecursosExternos.datosProyect_ID = ID;

      otrosConceptos           : Association to many otrosConceptos
                                   on otrosConceptos.datosProyect_ID = ID;
      tableProcessFlow         : Association to many tableProcessFlow
                                   on tableProcessFlow.datosProyect_ID = ID;
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
      otrosGastoRecu    : Association to many otrosGastoRecu
                            on otrosGastoRecu.RecursosInternos_ID = ID;
      otrosRecursos     : Association to many otrosGastoRecu
                            on otrosRecursos.RecursosInternos_ID = ID;
      datosProyect_ID   : UUID;
      // Asociación a la tabla ValoresMensuales
      ValorMensuReInter : Association to many ValorMensuReInter
                            on ValorMensuReInter.RecursosInternos_ID = ID;
};

entity ValorMensuReInter {
  key ID                  : UUID @cds.auto;
      RecursosInternos_ID : UUID;
      mesAno              : String;
      valor               : Integer;
};

entity otrosGastoRecu {
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
      totalE              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      RecursosInternos_ID : UUID;
}


entity otrosRecursos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Integer;
      year1               : Integer;
      year2               : Integer;
      year3               : Integer;
      year4               : Integer;
      year5               : Integer;
      year6               : Integer;
      total               : Integer;
      totalE              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      RecursosInternos_ID : UUID;

}


entity ConsumoExternos {
  key ID                  : UUID @cds.auto;
      ConceptoOferta      : String;
      PMJ                 : Integer;
      year1               : Integer;
      year2               : Integer;
      year3               : Integer;
      year4               : Integer;
      year5               : Integer;
      year6               : Integer;
      total               : Integer;
      totalC              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      PerfilConsumo       : Association to PerfilConsumo;
      datosProyect_ID     : UUID;
      otrosServiciosConsu : Association to many otrosServiciosConsu
                              on otrosServiciosConsu.ConsumoExternos_ID = ID;
      GastoViajeConsumo   : Association to many GastoViajeConsumo
                              on GastoViajeConsumo.ConsumoExternos_ID = ID;
};


entity otrosServiciosConsu {
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
      ConsumoExternos_ID : UUID;
};

entity GastoViajeConsumo {
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
      ConsumoExternos_ID : UUID;
}


entity RecursosExternos {
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
      totalR             : Integer;
      tipoServicio       : Association to TipoServicio;
      Vertical           : Association to Vertical;
      PerfilServicio     : String;
      serviRecurExter    : Association to many serviRecurExter
                             on serviRecurExter.RecursosExternos_ID = ID;
      GastoViajeRecExter : Association to many GastoViajeRecExter
                             on GastoViajeRecExter.RecursosExternos_ID = ID;
      datosProyect_ID    : UUID;

};


entity serviRecurExter {
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
      totalE              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      RecursosExternos_ID : UUID;
};

entity GastoViajeRecExter {
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
      totalE              : Integer;
      tipoServicio        : Association to TipoServicio;
      Vertical            : Association to Vertical;
      RecursosExternos_ID : UUID;
}


entity otrosConceptos {
  key ID              : UUID @cds.auto;
      ConceptoOferta  : String;
      PMJ             : Integer;
      mesYear         : Date;
      year1           : Integer;
      year2           : Integer;
      year3           : Integer;
      year4           : Integer;
      year5           : Integer;
      year6           : Integer;
      total           : Integer;
      totalC          : Integer;
      Vertical        : Association to Vertical;
      datosProyect_ID : UUID;
      LicenciasCon    : Association to many LicenciasCon
                          on LicenciasCon.otrosConceptos_ID = ID;

};


entity LicenciasCon {
  key ID                : UUID @cds.auto;
      ConceptoOferta    : String;
      PMJ               : Integer;
      mesYear           : Date;
      year1             : Integer;
      year2             : Integer;
      year3             : Integer;
      year4             : Integer;
      year5             : Integer;
      year6             : Integer;
      total             : Integer;
      totalC            : Integer;
      Vertical          : Association to Vertical;
      otrosConceptos_ID : UUID;
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
    totalJorRI : Integer;
    totalJorCE : Integer;
    totalJorRE : Integer;
      Total : Integer;

};

entity  RecurInterTotal {
  key ID              : UUID @cds.auto;
  servicios              : Integer;
  OtrosServicios    : Integer;
  GastosdeViaje : Integer;
  Total : Integer;

};

entity ConsuExterTotal {
  key ID : UUID @cds.auto;
  servicios              : Integer;
  OtrosServicios    : Integer;
  GastosdeViaje : Integer;
  Total : Integer;
};


entity  RecuExterTotal {
  key ID              : UUID @cds.auto;
  servicios              : Integer;
  OtrosServicios    : Integer;
  GastosdeViaje : Integer;
  Total : Integer;

};

entity InfraestrLicencia{
    key ID : UUID @cds.auto;
    totalInfraestruc : Integer;
    totalLicencia : Integer; 
}


entity ResumenCostesTotal{
  key ID : UUID @cds.auto;
    Subtotal: Integer;
    CosteEstruPorce : Integer;
    totalLicencias : Integer;
    Costeestructura  : Integer;
    Margeingresos  : Integer;


}