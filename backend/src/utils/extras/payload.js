// pg connection pool
const pool = require("../config/database");
// uuid
const { v4: uuidV4 } = require("uuid");

/**
 *
 * @param {string} table_name an existing table name in rock_paper_scissors database
 * @param {string} _id_column_name an existing column name in the table above that is an _id
 */
exports.generateUniqueID = async (table_name, _id_column_name) => {
    let generated_id, results;
    try {
        generated_id = uuidV4();
        results = await pool.query(
            `SELECT ${_id_column_name} FROM ${table_name} WHERE ${_id_column_name} = $1;`,
            [generated_id]
        );
    } catch (error) {
        console.log("Something went wrong");
        console.log(error);
    } finally {
        if (results.rowCount) {
            return generateUniqueID(table_name, _id_column_name);
        }
        return generated_id;
    }
};

exports.invalidSocketPayload = (payloadObject) =>
    `Should contain payloads ${JSON.stringify(payloadObject)}`;
