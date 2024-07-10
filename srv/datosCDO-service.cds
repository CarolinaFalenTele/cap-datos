using {db.datos as datos} from '../db/schema';

service DatosCDOService {

    entity DatosProyect     as projection on datos.DatosProyect;
    entity Jefeproyect      as projection on datos.Jefeproyect;
    entity planificacion    as projection on datos.planificacion;
    entity Facturacion      as projection on datos.Facturacion;
    entity Area             as projection on datos.Area;
    entity TipoIniciativa   as projection on datos.TipoIniciativa;
    entity RecursosInternos as projection on datos.RecursosInternos;
    entity RecursosExternos as projection on datos.RecursosExternos;
    entity ConsumoExternos  as projection on datos.ConsumoExternos;
    entity otrosConceptos   as projection on datos.otrosConceptos;
    entity PerfilServicio   as projection on datos.PerfilServicio;
}
