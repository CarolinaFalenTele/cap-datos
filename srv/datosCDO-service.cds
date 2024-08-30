using {db.datos as datos} from '../db/schema';

service DatosCDOService {
@requires: 'authenticated-user'
@cds.redirection.target
@odata.draft.enabled: true
    entity DatosProyect as projection on datos.DatosProyect;
    entity Jefeproyect as projection on datos.Jefeproyect;
    entity Area as projection on datos.Area;
    entity clienteFuncional as projection on datos.clienteFuncional;
    entity AMreceptor as projection on datos.AMreceptor;
    entity Vertical as projection on datos.Vertical;
    entity TipoIniciativa as projection on datos.TipoIniciativa;
    entity planificacion as projection on datos.planificacion;
    entity Naturaleza as projection on datos.Naturaleza;
    entity Seguimiento as projection on datos.Seguimiento;
    entity TipoServicio as projection on datos.TipoServicio;
    entity EjecucionVia as projection on datos.EjecucionVia;
    entity Facturacion as projection on datos.Facturacion;
    entity Proveedores as projection on datos.Proveedores;
    entity RecursosInternos as projection on datos.RecursosInternos;
    entity ConsumoExternos as projection on datos.ConsumoExternos;
    entity RecursosExternos as projection on datos.RecursosExternos;
    entity otrosConceptos as projection on datos.otrosConceptos;
    entity PerfilServicio   as projection on datos.PerfilServicio;
}
