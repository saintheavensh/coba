import { db } from "../../../db";
import { roles } from "../../../db/schema";
import { IRoleRepository, Role } from "../domain";
import { DBContext } from "../../../shared/types/db-context";

export class RoleRepositoryAdapter implements IRoleRepository {
    async findAll(dbOrTx: any = db): Promise<Role[]> {
        return await dbOrTx.select().from(roles);
    }
}
