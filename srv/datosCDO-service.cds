using {db.datos as datos} from '../db/schema';

service DatosCDOService @(path: '/odata/v4/datos-cdo') {
 // @odata.draft.enabled

 @requires: 'authenticated-user'

  entity DatosProyect              as projection on datos.DatosProyect;

  @restrict: [{
    grant: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE'
    ],
    to   : 'authenticated-user'
  }]
  entity Jefeproyect               as projection on datos.Jefeproyect;

  entity Area                      as projection on datos.Area;
  entity clienteFuncional          as projection on datos.clienteFuncional;
  entity AMreceptor                as projection on datos.AMreceptor;
  entity Vertical                  as projection on datos.Vertical;
  entity TipoIniciativa            as projection on datos.TipoIniciativa;
  entity planificacion             as projection on datos.planificacion;
  entity Naturaleza                as projection on datos.Naturaleza;
  entity Seguimiento               as projection on datos.Seguimiento;
  entity TipoServicio              as projection on datos.TipoServicio;
  entity EjecucionVia              as projection on datos.EjecucionVia;
  entity Facturacion               as projection on datos.Facturacion;
  entity ProveedoresC              as projection on datos.ProveedoresC;
  entity RecursosInternos          as projection on datos.RecursosInternos;
  entity ConsumoExternos           as projection on datos.ConsumoExternos;
  entity RecursosExternos          as projection on datos.RecursosExternos;
  entity GastoViajeRecExter        as projection on datos.GastoViajeRecExter;
  entity serviRecurExter           as projection on datos.serviRecurExter;
  entity otrosConceptos            as projection on datos.otrosConceptos;
  entity PerfilServicio            as projection on datos.PerfilServicio;
  entity ClientFactura             as projection on datos.ClientFactura;
  entity LicenciasCon              as projection on datos.LicenciasCon;
  entity otrosGastoRecu            as projection on datos.otrosGastoRecu;
  entity otrosRecursos             as projection on datos.otrosRecursos;
  entity otrosServiciosConsu       as projection on datos.otrosServiciosConsu;
  entity GastoViajeConsumo         as projection on datos.GastoViajeConsumo;
  entity WorkflowInstancias        as projection on datos.WorkflowInstancias;
  entity WorkflowEtapas        as projection on datos.WorkflowEtapas;
  entity PerfilConsumo             as projection on datos.PerfilConsumo;
  entity ValorMensuReInter         as projection on datos.ValorMensuReInter;
  entity ValorMensuGastoViaConsuEx as projection on datos.ValorMensuGastoViaConsuEx;
  entity ValorMensuGastoViExter    as projection on datos.ValorMensuGastoViExter;
  entity ValorMensuGastViaReInter  as projection on datos.ValorMensuGastViaReInter;
  entity ValorMensuSerExter        as projection on datos.ValorMensuSerExter;
  entity ValorMensuConsuEx         as projection on datos.ValorMensuConsuEx;
  entity ValorMensulicencia        as projection on datos.ValorMensulicencia;
  entity ValorMensuOtrConcep       as projection on datos.ValorMensuOtrConcep;
  entity ValorMensuServReInter     as projection on datos.ValorMensuServReInter;
  entity ValorMensuRecuExter       as projection on datos.ValorMensuRecuExter;
  entity ValorMensuServConsuEx     as projection on datos.ValorMensuServConsuEx;
  entity PerfilTotal               as projection on datos.PerfilTotal;
  entity RecurInterTotal           as projection on datos.RecurInterTotal;
  entity ConsuExterTotal           as projection on datos.ConsuExterTotal;
  entity RecuExterTotal            as projection on datos.RecuExterTotal;
  entity InfraestrLicencia         as projection on datos.InfraestrLicencia;
  entity ResumenCostesTotal        as projection on datos.ResumenCostesTotal;
  entity MotivoCondi               as projection on datos.MotivoCondi;
  entity TipoCompra                as projection on datos.TipoCompra;
  entity Usuarios as projection on datos.Usuarios;
  entity Archivos as projection on datos.Archivos;

   entity PendientesUsuario as select from WorkflowEtapas {
    ID,
    nombreEtapa,
    estado,
    asignadoA,
    comentario,
    fechaAprobado,
    workflow_ID
  } where estado = 'Pendiente';


function userdata() returns Usuarios;
  function etapasPendientesParaUsuario(email: String) returns array of WorkflowEtapas;

action GetPendientes(email: String) returns array of PendientesUsuario;



  
  function Action1()                                                        returns String;


 function getTareasPendientes(usuario: String) returns array of WorkflowEtapas;

  action aprobarEtapa(ID: UUID, comentario: String) returns String;

   action registrarTareasWorkflow(workflowInstanceId: String) returns String;


  action   StartProcess(scodigoProyect : Integer,
                        snameProyect : String,
                        generatedId : String,
                        descripcion : String,
                        area : String,
                        jefeProyecto : String,
                        clienteFuncional : String,
                        clinteFacturacion : String,
                        fechaInicio : Date,
                        fechaFin : Date,
                        jornadasTotales : Integer,
                        RecursosInterno : Integer,
                        ConsumoExterno : Integer,
                        RecursoExterno : Integer,
                        Infraestructura : Integer,
                        Licencia : Integer,
                        Subtotal : Integer,
                        CosteEstru : Integer,
                        CosteEstructura : Integer,
                        MargenIn : Integer,
                        MargenSobreIngreso : Integer,
                        Total : Integer,


  )                                                                         returns String;


  action   startWorkflow(payload : LargeString)                             returns {
    workflowInstanceId : String
  };

  action   completeWorkflow(workflowInstanceId : String, decision : String) returns String;


  action   getWorkflowTimeline(ID : String)                                 returns array of {
    step      : String;
    status    : String;
    timestamp : String;
    performer : String;
  };


  function getUserInfo()                                                    returns String;
    action cancelWorkflow(workflowInstanceId: String) returns String;
        action uploadFile() returns String;


}

