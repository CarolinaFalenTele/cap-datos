using {db.datos as datos} from '../db/schema';

service DatosCDOService {
/*@requires: 'authenticated-user'
@cds.redirection.target
@odata.draft.enabled: true*/


    entity DatosProyect as projection on datos.DatosProyect;
    // @requires: 'Admin'
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
    entity ProveedoresC as projection on datos.ProveedoresC;
    entity RecursosInternos as projection on datos.RecursosInternos;
    entity ConsumoExternos as projection on datos.ConsumoExternos;
    entity RecursosExternos as projection on datos.RecursosExternos;
    entity GastoViajeRecExter as projection on datos.GastoViajeRecExter;
    entity serviRecurExter as projection on datos.serviRecurExter;
    entity otrosConceptos as projection on datos.otrosConceptos;
    entity PerfilServicio   as projection on datos.PerfilServicio;
    entity ClientFactura  as projection on datos.ClientFactura;
    entity LicenciasCon as projection on datos.LicenciasCon;
    entity otrosGastoRecu as projection on datos.otrosGastoRecu;
    entity otrosRecursos as projection on datos.otrosRecursos;
    entity otrosServiciosConsu as projection on datos.otrosServiciosConsu;
    entity GastoViajeConsumo as projection on datos.GastoViajeConsumo;
    entity tableProcessFlow  as projection on datos.tableProcessFlow;
    entity PerfilConsumo as projection on datos.PerfilConsumo;
    entity ValorMensuReInter as projection on datos.ValorMensuReInter;


}