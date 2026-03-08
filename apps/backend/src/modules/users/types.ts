export const TYPES = {
    // Domain/Ports
    IUserRepository: Symbol.for("IUserRepository"),

    // Application/UseCases
    GetUsersUseCase: Symbol.for("GetUsersUseCase"),
    GetUserByIdUseCase: Symbol.for("GetUserByIdUseCase"),
    CreateUserUseCase: Symbol.for("CreateUserUseCase"),
    UpdateUserUseCase: Symbol.for("UpdateUserUseCase"),
    DeleteUserUseCase: Symbol.for("DeleteUserUseCase"),

    // Facade/Service
    UsersService: Symbol.for("UsersService"),

    // Shared (re-exported or referenced)
    DrizzleClient: Symbol.for("DrizzleClient"),
    LoggerFactory: Symbol.for("LoggerFactory")
};
