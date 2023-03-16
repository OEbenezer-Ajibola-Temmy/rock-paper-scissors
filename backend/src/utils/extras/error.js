class ApplicationError extends Error {
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

module.exports = {
    userNotFoundError: (payload) => {
        throw new UserNotFoundError(`User with ${payload} was not found`);
    },
    emailPasswordDontMatchError: () => {
        throw new ApplicationError(`Provided credentials don't match`);
    },
    throwError: (message, status) => {
        throw new ApplicationError(message, status);
    },
};
