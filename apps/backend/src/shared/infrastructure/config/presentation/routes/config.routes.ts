import { Hono } from 'hono';
import { container } from "../../../../../container";
import { TYPES } from "../../../../../types";
import { ConfigController } from '../controllers/ConfigController';

export const configRoutes = new Hono();

const getController = () => container.get<ConfigController>(TYPES.ConfigController);

// System settings
configRoutes.get('/system/:key', (c) => getController().getSystemConfig(c));
configRoutes.put('/system/:key', (c) => getController().updateConfig(c));

// If we need other scopes later, we can add them here
