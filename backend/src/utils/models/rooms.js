const pool = require("../config/database");
// error, generateUniqueId & other utils
const { roomNotFoundError, throwError } = require("../extras/error");
const { generateUniqueID } = require("../extras/payload");

/**
 * create findRoom, createRoom, deleteRoom, updateRoom functions
 */

/**
 * this uses a valid user `userId` column to create a room.
 * @param {object} payload this should contain `userId` of the user that wants to create room
 * @returns response Object
 */
exports.createRoom = async (payload) => {
    let response = { data: null, error: "", success: false };
    try {
        if (payload.userId == undefined) {
            throwError("Object `payload` must contain `_id` property");
        }
        const { userId } = payload;
        const roomId = await generateUniqueID("rooms", "_id");
        await pool.query(
            "INSERT INTO rooms(_id, _players, _games) VALUES($1, $2, $3)",
            [roomId, [userId], []]
        );

        let { data, error, success } = await this.findRoomById(roomId);

        if (!success) {
            console.log(error);
            throwError(
                `Create room operation was performed partially. Navigate to [GET] /api/v1/room/get and send the '_id' value as ${userId}`,
                500
            );
        }

        response = { ...response, data, success };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

/**
 * queries database to find a room with the provided `_id`
 * @param {string} _id - valid room `_id` to be used to query database
 * @returns response Object
 */
exports.findRoomById = async (_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let result = await pool.query(`SELECT * FROM rooms WHERE _id='${_id}'`);

        console.log(result);
        if (!result.rowCount) {
            roomNotFoundError("No room was found with the provided `_id`");
        }
        response = { ...response, data: result.rows, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

exports.findRoomByPlayers = async (_players) => {
    let response = { data: null, error: "", success: false };
    try {
        let result = await pool.query(
            "SELECT * FROM rooms WHERE $1=ANY(_players) AND $2=ANY(_players);",
            _players
        );

        if (!result.rowCount) {
            roomNotFoundError(
                "No room with `_players` array provided were found"
            );
        }

        response = { ...response, data: result.rows, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

/**
 *  queries the database using the provided `_player_id` to find player's rooms
 * @param {string} _player_id - a valid `_player_id` is used to query the database to get their rooms
 * @returns response Object
 */
exports.findRoomsByPlayer = async (_player_id) => {
    let response = { data: null, error: "", success: false };
    try {
        if (typeof _player_id !== "string") {
            throwError(
                "Object `payload` must contain valid `_player_id` property"
            );
        }

        let result = await pool.query(
            "SELECT * FROM rooms WHERE $1=ANY(_players);",
            [_player_id]
        );

        if (!result.rowCount) {
            roomNotFoundError(
                "No rooms containing `_player_id` provided were found"
            );
        }

        response = { ...response, data: result.rows, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};

/**
 * queries the database using the provided `_player_id` to find rooms containing just a single player with the provided `_player_id`
 * @param {string} _player_id - a valid `_player_id` is used to query the database to get rooms containing just a single player with the provided `_player_id`
 * @returns response Object
 */
exports.findRoomsBySinglePlayer = async (_player_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let result = await pool.query(
            "SELECT * FROM rooms WHERE $1=ANY(_players) AND ARRAY_LENGTH(_players,1)=1",
            [_player_id]
        );

        if (!result.rowCount) {
            roomNotFoundError(
                "No rooms with single player containing `_player_id` provided were found"
            );
        }

        response = { ...response, data: result.rows, success: true };
    } catch (error) {
        response = { ...response, error };
    } finally {
        return response;
    }
};
