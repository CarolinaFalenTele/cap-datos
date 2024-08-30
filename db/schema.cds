namespace db.datos;

type projectVertical : String enum {
    Appian;
    O365;
    RPAS;
    BMC;
    CELONIS;
    SAP;
    SAP_G2C;
    SSFF;
    SFDC;
    Otros;
};

type projectClientNuevo : String enum {
    Si_en_TGT;
    Si_en_Vertical;
    No;
};

type ProyectNaturaleza : String enum {
    CAPEX;
    OPEX;
    Proyecto_Servicio_a_Cliente_Externo;
    Opex_Servicios;
};

type proyectSeguimiento : String enum {
    Agile;
    Mixto;
    Waterfall;
    Sin_Seguimiento;
    Servicio;
};

type proyectEjecucionVia : String enum {
    Si;
    No;
    Mixto;
};

type proyectAMreceptor : String enum {
    No_Aplica;
    AM_TSA;
    AM_BI;
    COE_Salesforce;
    RoD;
    Telesap;
    Vicky;
    GlobalSAP_AM_TSA;
    Otros;
};

type proyecTipoCompra : String enum {
    General;
    Ordinaria;
    Complementaria_compra_general;
    Derivada_Compra_General;
    NO_MCT;
    Otros;
};

type proyectTipoServ : String enum {
    Proyecto_Implementacion;
    Soporte_y_mantenimiento;
    Consultoria;
};

type otrosServicios : array of {
    Vertical       : projectVertical;
    TipoServicio   : proyectTipoServ;
    ConceptoOferta : String;
};

type arrGastosdeViaje : array of {
    Vertical       : projectVertical;
    TipoServicio   : proyectTipoServ;
    ConceptoOferta : String;
};

type infrestructura : array of {
    Vertical       : projectVertical;
    ConceptoOferta : String;
};

type licencias : array of {
    Vertical       : projectVertical;
    ConceptoOferta : String;
};

entity Jefeproyect {
    key ID        : UUID @cds.auto;
        matricula : Integer;
        name      : String;
        lastname  : String;
        valueJefe: String;
}

entity DatosProyect {
    key ID                       : UUID  @cds.auto;
        codigoProyect            : Integer;
        nameProyect              : String;
        pluriAnual               : Boolean;
        clienteFacturacion       : String;
        multijuridica            : Boolean;
        IPC_apli                 : Integer;
        costeEstructura          : Integer;
        objetivoAlcance          : LargeString;
        AsuncionesyRestricciones : LargeString;
        CambioEuRUSD             : Integer;
        Estado                   : String; 
        Fechainicio              : DateTime;
        FechaFin              : DateTime;
        Proveedores              :  Association to Proveedores;
        clienteFuncional         : Association to clienteFuncional;
        TipoServicio             : Association to TipoServicio;
        Vertical                 : Association to  Vertical;
        Naturaleza               : Association to Naturaleza;
        Seguimiento              : Association to Seguimiento;
        EjecucionVia             : Association to EjecucionVia;
        AmReceptor               :  Association to AMreceptor;
        Iniciativa               : Association to TipoIniciativa;  
        Area                     : Association to Area;
        jefeProyectID            : Association to Jefeproyect;
};

entity Area {
    key ID         : UUID @cds.auto;
    valueArea      : String; 
        NombreArea : String;
};



entity Vertical {
       key ID         : UUID @cds.auto;
       valueVertical   : String; 
       NombreVertical: String;       
};  

entity clienteFuncional {
       key ID         : UUID @cds.auto;
       valueClienteFun   : String; 
       NombreClienteFun: String;       
};  


entity Naturaleza {
       key ID         : UUID @cds.auto;
       valueNaturaleza   : String; 
       NombreNaturaleza: String;       
};

entity Seguimiento {
       key ID         : UUID @cds.auto;
       valueSeguimiento  : String; 
       NombreSeguimiento: String;       
}; 

entity AMreceptor {
       key ID         : UUID @cds.auto;
       valueAMreceptor : String; 
       NombreAMreceptor: String;       
}; 


entity EjecucionVia {
       key ID         : UUID @cds.auto;
       valueEjecuVia  : String; 
       NombreEjecuVia: String;       
};    


entity TipoServicio  {
    key ID               : UUID @cds.auto;
        valueTipoServ    : String;
        NombreTipoServ : String;
};


entity TipoIniciativa {
    key ID               : UUID @cds.auto;
        valueinicia      : String;
        NombreIniciativa : String;
};


entity planificacion {
    key ID           : UUID @cds.auto;
        hito         : String;
        fecha_inicio : Date;  
        fecha_fin    : Date;
        DatosProyect : Association to DatosProyect;
};

entity Facturacion {
    key ID              : UUID @cds.auto;
        descripcionHito : String;
        fechaEstimida   : Date;
        facturacion     : Integer;
        total           : Integer;
        tipoCompra      : proyecTipoCompra;
        DatosProyect    : Association to one DatosProyect;
};

entity RecursosInternos {
    key ID             : UUID @cds.auto;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear        : Date;
        total          : Integer;
        GastosdeViaje  : arrGastosdeViaje;
        tipoServicio   : Association to TipoServicio;
        Vertical       : Association to Vertical;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;
};

entity ConsumoExternos {
    key ID             : UUID @cds.auto;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear        : Date;
        total          : Integer;
        GastosdeViaje  : arrGastosdeViaje;
        tipoServicio   : Association to TipoServicio;
        Vertical       : Association to Vertical;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;
};

entity RecursosExternos {
    key ID             : UUID @cds.auto;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear        : Date;
        total          : Integer;
        GastosdeViaje  : arrGastosdeViaje;
        tipoServicio   : Association to TipoServicio;
        Vertical       : Association to Vertical;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;
};

entity otrosConceptos {
    key ID          : UUID @cds.auto;
    Infrestructura  : infrestructura;
    Licencias       : licencias;
};

entity PerfilServicio {
    key ID           : UUID @cds.auto;
        valuePerfil  : String;
        NombrePerfil : String;
};

entity Proveedores{
   key ID           : UUID @cds.auto;
   selectCondi      : Boolean;
   selectProvee     : Boolean;
   Condicionado     : String;
   Proveedor        : String; 

}
