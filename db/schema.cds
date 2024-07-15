namespace db.datos;


type projectVertical     : String enum {
    Appian;
    ![O365];
    RPAS;
    BMC;
    CELONIS;
    SAP;
    SAP_G2C;
    SSFF;
    SFDC;
    Otros;
};

type projectClientNuevo  : String enum {
    ![Sí en TGT];
    ![Sí en Vertical];
    ![No];
};


type ProyectNaturaleza   : String enum {
    CAPEX;
    OPEX;
    ![Proyecto/Servicio a Cliente Externo];
    ![Opex Servicios];
};

type proyectSeguimiento  : String enum {
    Agile;
    Mixto;
    Waterfall;
    ![Sin Seguimiento];
    Servicio
}

type proyectEjecucionVia : String enum {
    Si;
    No;
    Mixto;
};

type proyectAMreceptor   : String enum {
    ![No Aplica];
    ![AM TSA];
    ![AM BI];
    ![COE Salesforce];
    RoD;
    Telesap;
    Vicky;
    ![GlobalSAP / AM TSA];
    Otros;
};


type proyecTipoCompra    : String enum {
    General;
    Ordinaria;
    ![Complementaria compra general];
    ![Derivada Compra General];
    ![NO-MCT];
    Otros;

};

type proyectTipoServ     : String enum {
    ![Proyecto Implementacion];
    ![Soporte y mantenimiento];
    Consultoria;

};

type otrosServicios      : array of {
    Vertical       : projectVertical;
    TipoServicio   : proyectTipoServ;
    ConceptoOferta : String;
};

type arrGastosdeViaje    : array of {
    Vertical       : projectVertical;
    TipoServicio   : proyectTipoServ;
    ConceptoOferta : String;
}

type infrestructura      : array of {
    Vertical       : projectVertical;
    ConceptoOferta : String;
};

type licencias           : array of {
    Vertical       : projectVertical;
    ConceptoOferta : String;
}

entity Jefeproyect {
    key ID        : UUID;
        matricula : Integer;
        name      : String;
        lastname  : String;
};

entity DatosProyect {
    key ID                       : UUID;
        codigoProyect            : Integer;
        nameProyect              : String;
        pluriAnual               : Boolean;
        clienteFuncional         : String;
        clienteFacturacion       : String;
        clienteNuevo             : projectClientNuevo;
        multijuridica            : Boolean;
        IPC_apli                 : Integer;
        costeEstructura          : Integer;
        objetivoAlcance          : LargeString;
        AsuncionesyRestricciones : LargeString;
        CambioEuRUSD             : Integer;
        Vertical                 : projectVertical;
        Naturaleza               : ProyectNaturaleza;
        Seguimiento              : proyectSeguimiento;
        EjecucionVia             : proyectEjecucionVia;
        AmReceptor               : proyectAMreceptor;
        Iniciativa               : Association to TipoIniciativa;
        Area                     : Association to Area;
        jefeProyectID            : Association to Jefeproyect;

};

entity Area {
    key ID         : UUID;
        valueArea  : String;
        NombreArea : String;
};

entity TipoIniciativa {
    key ID               : UUID;
        valueinicia      : String;
        NombreIniciativa : String;

}

entity planificacion {
    key ID           : UUID;
        fecha_inicio : Date;
        fecha_fin    : Date;
        DatosProyect : Association to DatosProyect;

};


entity Facturacion {
    key ID              : UUID;
        descripcionHito : String;
        fechaEstimida   : Date;
        facturacion     : Integer;
        total           : Integer;
        tipoCompra      : proyecTipoCompra;
        DatosProyect    : Association to one DatosProyect;
};

entity RecursosInternos {
    key ID             : UUID;
        Vertical       : projectVertical;
        tipoServicio   : proyectTipoServ;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear        : Date;
        total          : Integer;
        otrosServi     : otrosServicios;
        GastosdeViaje  : arrGastosdeViaje;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;


};

entity ConsumoExternos {

    key ID             : UUID;
        Vertical       : projectVertical;
        tipoServicio   : proyectTipoServ;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear         : Date;
        total          : Integer;
        otrosServi     : otrosServicios;
        GastosdeViaje  : arrGastosdeViaje;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;

};


entity RecursosExternos {
    key ID             : UUID;
        Vertical       : projectVertical;
        tipoServicio   : proyectTipoServ;
        ConceptoOferta : String;
        PMJ            : Integer;
        mesYear         : Date;
        total          : Integer;
        otrosServi     : otrosServicios;
        GastosdeViaje  : arrGastosdeViaje;
        PerfilServicio : Association to PerfilServicio;
        DatosProyect   : Association to DatosProyect;

};

entity otrosConceptos {
        key ID        : UUID;
    Infrestructura : infrestructura;
    Licencias      : licencias;
}


entity PerfilServicio {
    key ID           : UUID;
        valuePerfil  : String;
        NombrePerfil : String;
};
