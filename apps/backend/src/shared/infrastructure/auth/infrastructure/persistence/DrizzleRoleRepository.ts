import { db } from "../../../../../db";
import { roles } from "../../../../../db/schema";
import { IRoleRepository, Role } from "../../domain";

export class DrizzleRoleRepository implements IRoleRepository {
    async findAll(dbOrTx: any = db): Promise<Role[]> {
        return await dbOrTx.select().from(roles);
    }
}
