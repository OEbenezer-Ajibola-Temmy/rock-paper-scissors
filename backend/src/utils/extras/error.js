class ApplicationError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

class RoomNotFoundError extends Error {
    constructor(message, status = 404) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

class UserAccountError extends ApplicationError {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

class UserNotFoundError extends ApplicationError {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

class UserUpdateError extends ApplicationError {
    constructor(message, status = 403) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

module.exports = {
    emailPasswordDontMatchError: () => {
        throw new ApplicationError(`Provided credentials don't match`);
    },
    roomNotFoundError: (message, status) => {
        throw new RoomNotFoundError(message, status);
    },
    throwError: (message, status) => {
        throw new ApplicationError(message, status);
    },
    userAccountError: (message, status) => {
        throw new UserAccountError(message, status);
    },
    userEmailUpdateError: () => {
        throw new UserUpdateError("Cannot update `_email` of an existing user");
    },
    userNotFoundError: (payload) => {
        throw new UserNotFoundError(`User with ${payload} was not found`);
    },
    RoomNotFoundError,
};
