// bcrypt
const bcrypt = require("bcryptjs");
// extras
const { throwError, userNotFoundError } = require("../extras/error");
const { generateUniqueID } = require("../extras/payload");
// pg connection pool
const pool = require("../config/database.js");

const { BCRYPT_SALT: bcryptSalt } = process.env;
const BCRYPT_SALT = Number(bcryptSalt);

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
            payload._email == null ||
            payload._password == null ||
            payload._username == null
        ) {
            throwError(
                "Object `payload` must contain `_email`, `_password` and `_username`. "
            );
        }
        const { _email, _password, _provider, _username } = payload;
        let _id = await generateUniqueID("users", "_id");
        let results = await pool.query(
            "INSERT INTO users(_id, _date_created, _email, _password, _provider, _username) VALUES($1, now(), $2, $3, $4, $5)",
            [_id, _email, _password, _provider, _username]
        );

        response = { ...response, data: results.rows, success: true };
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
            throwError("Email should be 'string'");
        }

        const {
            rowCount,
            rows: [data],
        } = await pool.query("SELECT * FROM users WHERE _email = $1 LIMIT 1;", [
            _email,
        ]);

        if (rowCount === 0) {
            userNotFoundError(`'email'`);
        }

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

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
        const results = await pool.query(
            `SELECT * FROM users ${query_where_conditional}`
        );

        // console.log(results)
        response = { ...response, data: results.rows, success: true };
    } catch (error) {
        console.log("-----");
        console.log(error);
        console.log("------");

        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

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
 * @returns
 */
exports.verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
