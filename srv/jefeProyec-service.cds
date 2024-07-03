using { db.datos as datos } from '../db/schema';

service JefeproyecService {

    entity JefeproyectSrv as projection on datos.Jefeproyect;
}