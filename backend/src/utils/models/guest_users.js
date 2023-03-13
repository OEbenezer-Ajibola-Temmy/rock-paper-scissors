// pg connection pool
const pool = require("../config/database");
// utility functions
const { generateUniqueID } = require("../extras/payload");

/**
 *
 * @param {object} payload should container _room_id and _username (optional)
 */
exports.createGuestUser = async (payload) => {
    /**
     * payload: {
     *      _room_id: string (valid room_id)
     *      _username: string (optional)
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let _id = await generateUniqueID("guest_users", "_id");
        let { _room_id, _username } = payload;

        if (!_username) {
            _username = `@guest-${_id.substring(0, 8)}`;
        }
        let data = await pool.query(
            "INSERT INTO guest_users(_id, _date_created, _room_id, _username) VALUES ($1, current_timestamp, $2, $3)",
            [_id, _room_id, _username]
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
