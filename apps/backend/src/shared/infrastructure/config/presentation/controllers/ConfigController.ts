import { inject, injectable } from "inversify";
import { Context } from "hono";
import { ConfigFacade } from "../../application/facades/ConfigFacade";
import { TYPES } from "../../../../../types";

@injectable()
export class ConfigController {
    constructor(@inject(TYPES.ConfigFacade) private configFacade: ConfigFacade) { }

    async getSystemConfig(c: Context) {
        const key = c.req.param('key');
        const defaultValue = c.req.query('default');

        const result = await this.configFacade.getSystemConfig(key, defaultValue);

        if (result.isFailure && defaultValue === undefined) {
            return c.json({ error: result.errorValue() }, 404);
        }

        return c.json({ key, value: result.getValue() });
    }

    async updateConfig(c: Context) {
        const key = c.req.param('key');
        const body = await c.req.json();

        const result = await this.configFacade.updateSetting({
            key,
            value: body.value,
            type: body.type,
            scope: body.scope || 'system',
            description: body.description
        });

        if (result.isFailure) {
            return c.json({ error: result.errorValue() }, 400);
        }

        return c.json({ message: "Setting updated successfully" });
    }
}
