const pool = require("../config/database.js");

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
