// bcrypt, jwt
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// extras
const {
    throwError,
    userEmailUpdateError,
    userNotFoundError,
} = require("../extras/error");
const { generateUniqueID } = require("../extras/payload");
// pg connection pool
const pool = require("../config/database.js");

const { BCRYPT_SALT: bcryptSalt, JWT_SECRET_KEY } = process.env;
const BCRYPT_SALT = Number(bcryptSalt);

/* --- user related --- */

/**
 * {_email, _password, _provider, _username}
 * @param {object} payload payload required to create user
 */
exports.createUser = async (payload = {}) => {
    /**
     * payload must contain the following: {
     * 		_email, _password, _username
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        if (
            (payload._email == null || payload._username == null) &&
            (payload._password == null || payload._provider)
        ) {
            throwError(
                "Object `payload` must contain `_email`, `_password` or `_provider` and `_username`. "
            );
        }
        const { _email, _password, _provider, _username } = payload;
        let _id = await generateUniqueID("users", "_id");
        let result = await pool.query(
            "INSERT INTO users(_id, _date_created, _email, _password, _provider, _username) VALUES($1, now(), $2, $3, $4, $5)",
            [_id, _email, _password, _provider, _username]
        );

        /**
         * in result object, `rows` property is an empty array
         */

        response = {
            ...response,
            data: {
                _id,
                _email,
                _provider,
                _username,
            },
            success: true,
        };
    } catch (error) {
        response = { ...response, error };
    } finally {
        console.log("from ./utils/models/users.js [createUser]", { response });
        return response;
    }
};

/**
 * this retrieves a single user column from database
 * @param {string} _email valid string
 * @returns user Object
 */
exports.findOneUser = async (_email) => {
    let response = { data: null, error: "", success: false };
    try {
        if (typeof _email !== "string") {
            throwError("Email should be provided as <type> 'string'");
        }

        const {
            rowCount,
            rows: [data],
        } = await pool.query("SELECT * FROM users WHERE _email = $1 LIMIT 1;", [
            _email,
        ]);

        if (rowCount === 0) {
            userNotFoundError(`'_email'`);
        }

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

/**
 * this queries the database and checks for rows that meet the column specified criteria
 * @param {Object} payload users table column(s) to use to get users by certain degrees
 * @returns Object - response
 */
exports.findUsers = async (payload) => {
    let response = { data: null, error: "", success: false };
    try {
        let payloadKeys = Object.keys(payload);
        let payloadLength = payloadKeys.length;
        if (!payloadKeys) {
            throwError(
                "Object `payload` must contain at least `_email` property to identify users uniquely"
            );
        }

        // handle error were user is not found

        let queryText = "WHERE";
        payloadKeys.forEach((key, index) => {
            queryText = `${queryText} ${key} = '${payload[key]}'${
                index < payloadLength - 1 ? " AND " : ";"
            }`;
        });

        console.log({ queryText });

        const { rowCount, rows: data } = await pool.query(
            `SELECT _id, _available_status, _email, _online_status, _provider, _total_losses, _total_wins, _username FROM users ${queryText}`
        );

        if (rowCount === 0) {
            let errorText = "";

            payloadKeys.forEach((key, index) => {
                errorText = `${errorText}'${key}'${
                    index < payloadLength - 2
                        ? ", "
                        : index === payloadLength - 1
                        ? ""
                        : " and "
                }`;
            });
            // return custom user not found error
            userNotFoundError(errorText);
        }

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        console.log("./utils/models/users.js [findOneUser]", response);
        return response;
    }
};

/**
 *
 * @param {object} payload an optional object {
 * 		_available_status: ['_available_status', 'TRUE'],
 * 		_online_status: ['_online_status', 'TRUE'],
 * 		_provider: ['_provider', 'google']
 * }
 * @returns all users in the database based on `_available_status`, `_online_status` and `_provider`
 */
exports.getUsers = async (payload = {}) => {
    /**
     * payload: {
     *			_available_status, _online_status, _provider
     * }
     */
    let response = { data: null, error: "", success: false };

    try {
        let query_where_conditional = "WHERE";
        let payloadLength = Object.keys(payload).length;
        if (payloadLength) {
            Object.keys(payload).forEach((column, index) => {
                query_where_conditional = `${query_where_conditional} ${
                    payload[column][0]
                } = ${payload[column][1]} ${
                    index < payloadLength - 1 ? "AND" : ";"
                }`;
            });
        } else {
            query_where_conditional = "";
        }

        console.log({ query_where_conditional });
        const result = await pool.query(
            `SELECT * FROM users ${query_where_conditional}`
        );

        // console.log(result)
        response = { ...response, data: result.rows, success: true };
    } catch (error) {
        console.log("-----");
        console.log(error);
        console.log("------");

        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.updateUser = async (_email, payload) => {
    let response = { data: null, error: "", success: false };
    try {
        const payloadKeys = Object.keys(payload);
        const payloadLength = payloadKeys.length;

        // user is not allowed to change _email
        if (payloadKeys.includes("_email")) {
            userEmailUpdateError();
        }

        // create query text using payload key-value pairs
        let queryText = "";

        payloadKeys.forEach((key, index) => {
            queryText = `${queryText}${key} = '${payload[key]}'${
                index !== payloadLength - 1 ? ", " : ""
            }`;
        });

        const result = await pool.query(
            `UPDATE users SET ${queryText} WHERE _email = $1;`,
            [_email]
        );

        response = {
            ...response,
            data: { rowCount: result.rowCount, rows: result.rows },
            success: true,
        };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

/* --- jwt related --- */

/**
 * synchronously signs the given payload into a JSON Web Token string
 * @param {Object} payload an object containing data to be signed and verified using a token
 * @returns string
 */
exports.generateToken = (payload) => {
    // recreate user table in rock_paper_scissors database
    const jwtSecretkey =
        "$2a$20$nDDnZRuZwHiRDg3FjBX43O2QHLCaVUkY5zH1PILmpDxaz8FWC.qxm";
    return jwt.sign(payload, jwtSecretkey, { expiresIn: "2hr" });
};

/**
 * synchronously verifies given token
 * @param {string} token valid JSON Web Token to be verified
 * @returns Object: signed payload
 */
exports.verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET_KEY);
};

/* --- password related --- */

/**
 * generates a hash for the given string
 * @param {string} password string
 * @returns `string` hash
 */
exports.hashPassword = async (password) => {
    return await bcrypt.hash(password, BCRYPT_SALT);
};

/**
 * compares the string and the `hashed` string to see if they match
 * @param {string} password string
 * @param {*} hashedPassword `hashed` string
 * @returns boolean
 */
exports.verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
