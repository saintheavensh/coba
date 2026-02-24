import { ContainerModule } from "inversify";
import { TYPES } from "./types";
import { DeviceApiAdapter, DrizzleStoreDeviceRepository } from "./infrastructure/index";
import { RegisterStoreDeviceUseCase, GetStoreDeviceStatusUseCase, PingStoreDeviceUseCase, StoreDeviceFacade } from "./application/index";
import { IStoreDeviceRepository, IDeviceApiGateway } from "./domain";

export const deviceContainer = new ContainerModule(({ bind }) => {
    // Ports
    bind<IDeviceApiGateway>(TYPES.IDeviceApiGateway).to(DeviceApiAdapter).inSingletonScope();
    bind<IStoreDeviceRepository>(TYPES.IStoreDeviceRepository).to(DrizzleStoreDeviceRepository).inSingletonScope();

    // Use Cases
    bind<RegisterStoreDeviceUseCase>(RegisterStoreDeviceUseCase).toSelf().inSingletonScope();
    bind<GetStoreDeviceStatusUseCase>(GetStoreDeviceStatusUseCase).toSelf().inSingletonScope();
    bind<PingStoreDeviceUseCase>(PingStoreDeviceUseCase).toSelf().inSingletonScope();

    // Facade
    bind<StoreDeviceFacade>(TYPES.StoreDeviceFacade).to(StoreDeviceFacade).inSingletonScope();
});
