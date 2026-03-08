import { deviceContainer } from "./DeviceContainer";
import { StoreDeviceFacade } from "./application/facades/StoreDeviceFacade";
import { TYPES } from "./types";

import { Container } from "inversify";

const getStoreDeviceFacade = (): StoreDeviceFacade => {
    const { container } = require("../../../../container");
    return (container as Container).get<StoreDeviceFacade>(TYPES.StoreDeviceFacade);
};

export const storeDeviceFacade = new Proxy({} as StoreDeviceFacade, {
    get: (_target, prop) => {
        const facade = getStoreDeviceFacade();
        const value = (facade as any)[prop];
        if (typeof value === 'function') {
            return value.bind(facade);
        }
        return value;
    }
});

export * from "./application";
export * from "./domain";
export * from "./infrastructure";
export * from "./presentation";
export * from "./types";
export { deviceContainer };
