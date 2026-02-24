import { Container } from "inversify";
import { deviceContainer } from "./DeviceContainer";
import { StoreDeviceFacade } from "./application/facades/StoreDeviceFacade";
import { TYPES } from "./types";

const container = new Container();
container.load(deviceContainer);

export const storeDeviceFacade = container.get<StoreDeviceFacade>(TYPES.StoreDeviceFacade);

export * from "./application";
export * from "./domain";
export * from "./infrastructure";
export * from "./presentation";
export * from "./types";
export { deviceContainer };
