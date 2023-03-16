// utils
const { throwError } = require("../utils/extras/error");
const {
    findOneUser,
    getUsers,
    createUser,
    hashPassword,
} = require("../utils/models");

exports.getUsersController = async (req, res) => {
    /**
     * this is for getting users based on `_available_status`, `_online_status` or `_provider`
     * Note that: for boolean columns, user should enter query as '1' or '0'
     */
    let { query } = req;

    let payload = {};
    Object.keys(query).forEach((key) => {
        payload = { ...payload, [key]: [key, query[key]] };
    });

    let { data, error, success } = await getUsers(payload);

    if (!success) {
        return res.status(400).json({ success, error });
    }

    return res.status(200).json({ success, data });
};

exports.signUpUserController = async (req, res, next) => {
    const { _email, _password: password, _username } = req.body;
    try {
        console.log(password);
        if (
            _email === undefined ||
            password === undefined ||
            _username === undefined
        ) {
            throwError(
                "Invalid arguments passed to body. Body object must contain `_email`, `password` and `username`"
            );
        }
        const { error, success } = await findOneUser(_email);

        // throw error if user exists
        if (success) {
            throwError("User with provided email already exists");
        }

        // throw every other error except UserNotFoundError
        if (!success && error.name !== "UserNotFoundError") {
            throwError(error.message, error.status || 400);
        }

        const _password = await hashPassword(password);

        const newUser = await createUser({
            _email,
            _password,
            _provider: null,
            _username,
        });
        return res.status(201).json({
            data: {
                message: `User with {'_email': '${_email}'} was created successfully`,
            },
            success: true,
        });
    } catch (error) {
        return next(error);
    }
};
