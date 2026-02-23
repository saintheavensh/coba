import { Hono } from "hono";
import { UploadsController } from "./uploads.controller";

const app = new Hono();
const controller = new UploadsController();

app.post("/", (c) => controller.upload(c));

export default app;
