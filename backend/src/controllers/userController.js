// utils
const {
    emailPasswordDontMatchError,
    throwError,
    userAccountError,
} = require("../utils/extras/error");
const {
    createUser,
    findOneUser,
    getUsers,
    updateUser,
    hashPassword,
    verifyPassword,
    generateToken,
} = require("../utils/models");
// env
const { CLIENT_ID: clientID, CLIENT_SECRET: clientSecret } = process.env;

// --- normal user configuration ----
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

exports.signInUserController = async (req, res, next) => {
    // for a user to sign-in, {_email, _password}
    const { _email, _password } = req.body;
    try {
        if (_password == undefined || _email == undefined) {
            throwError(
                "Bad request details: `_email` and `_password` must be provided for login"
            );
        }

        // check if user with provided details exist
        const { data, error, success } = await findOneUser(_email);

        if (!success) {
            throwError(error.message, error.status || 400);
        }

        // check if an external provider was used to create this account
        if (data._provider) {
            let provider = data._provider.replace(
                /\w\S*/g,
                (txt) =>
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            userAccountError(
                `Your account was not created with a password. Please use your ${provider} account to sign in.`
            );
        }

        // compare password
        const passwordMatch = await verifyPassword(_password, data._password);

        if (!passwordMatch) {
            console.log("this happend right 😂😂");
            emailPasswordDontMatchError();
        }

        // on success, sign user in and return a signed token
        const { _id, _date_created, _username } = data;
        const userPayload = { _id, _date_created, _email, _username };

        const _signed_token = generateToken(userPayload);

        console.log({ _signed_token });
        // update user table column `_signed_token`
        const updatedUser = await updateUser(_email, { _signed_token });

        if (!updatedUser.success) {
            userAccountError(
                updatedUser.error.message,
                updatedUser.error.status
            );
        }

        return res.status(200).json({
            data: {
                user: {
                    _email,
                    _signed_token,
                    _username,
                },
            },
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

exports.signUpUserController = async (req, res, next) => {
    const { _email, _password: password, _username } = req.body;
    try {
        if (
            _email === undefined ||
            password === undefined ||
            _username === undefined
        ) {
            throwError(
                "Invalid arguments passed to body. Body object must contain `_email`, `_password` and `_username`"
            );
        }
        const { error, success } = await findOneUser(_email);

        // throw error if user exists
        if (success) {
            userAccountError("User with provided email already exists");
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

        if (!newUser.success) {
            userAccountError(newUser.error.message);
        }

        return res.status(201).json({
            data: {
                message: `User '${_email}' was created successfully`,
                payload: newUser.data,
            },
            success: true,
        });
    } catch (error) {
        return next(error);
    }
};

// --- google user configuration ---
const { Strategy: GoogleStrategy } = require("passport-google-oauth2");
exports.signInGoogleInit = (passport) => {
    passport.use(
        new GoogleStrategy(
            {
                clientID,
                clientSecret,
                callbackURL:
                    "http://localhost:3001/api/v1/auth/user/google/callback",
                passReqToCallback: true,
            },
            async (request, accessToken, refreshToken, profile, done) => {
                try {
                    // check if user with email already exists
                    const {
                        email: _email,
                        displayName: _username,
                        provider: _provider,
                    } = profile;
                    const {
                        data: { _id, _date_created },
                        error,
                        success,
                    } = await findOneUser(_email);

                    let userPayload = {
                        _email,
                        _provider,
                        _username,
                    };

                    // if user exists, update user payload
                    if (success) {
                        userPayload = { ...userPayload, _id, _date_created };
                    }

                    // if user does not exist, create user!
                    if (!success) {
                        const {
                            data: { _id, _date_created },
                            error: createUserError,
                            success: createUserSuccess,
                        } = await createUser({
                            _email,
                            _provider,
                            _username,
                        });

                        if (!createUserSuccess) {
                            throwError(
                                createUserError.message,
                                createUserError.status
                            );
                        }

                        userPayload = { ...userPayload, _id, _date_created };
                    }

                    const _signed_token = generateToken(userPayload);

                    // update user with generated `signed_token`
                    await updateUser(_email, { _signed_token });

                    return done(null, { _email, _signed_token, _username });
                } catch (error) {
                    return done(error, false);
                }
            }
        )
    );
};

exports.signInGoogleCallback = (req, res) => {
    console.log("this is callback");
    console.log(req.user);
    console.log(">>>  callback stream... <<<<");
    const {
        user: { signed_token },
    } = req;
    return res
        .status(200)
        .json({ success: true, data: { user: { signed_token } } });
};
