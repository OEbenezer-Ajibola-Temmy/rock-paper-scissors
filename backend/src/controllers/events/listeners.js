// emitters
const {
    displayError,
    displayPayloadError,
    roomCreated,
    roomFound,
    roomMemberJoined,
    roomNewMemberJoined,
    roomNotFound,
    roomResult,
    userDisconnected,
    userIsOffline,
    userIsOnline,
} = require("./emitters");
// utils
const { RoomNotFoundError, throwError } = require("../../utils/extras/error");
const {
    createRoom,
    findRoomById,
    findRoomsByPlayer,
    findRoomsBySinglePlayer,
    findRoomByPlayers,
} = require("../../utils/models");
const { invalidSocketPayload } = require("../../utils/extras/payload");

exports.events = {
    CREATE_ROOM: "create_room",
    JOIN_ROOM: "join_room",
};

exports.functions = {
    createRoomHandler: async (payload, socket) => {
        try {
            // console.log(socket);
            /**
             * No user can create 2 `available` rooms. A room is `available` when there is just one player there
             * check if user has an available room
             * if true,
             *      - emit that user has an available room. payload can include {available_room_id}
             */
            const { _id: userId } = socket.user;

            // find rooms where there is just one room with the current user _id as the only players
            let {
                data: [{ _id: room_id }],
                error,
                success,
            } = await findRoomsBySinglePlayer(userId);

            if (success) {
                // emit tthat user already had an available room, with the available room's _id
                return socket.emit(roomResult, {
                    data: { room_id },
                    message: "User already has an available room",
                });
                return throwError("User already has an available room");
            }

            console.log("[ LINE 48 ]", error, success);
            // if the error is not RoomNotFoundError, raise the error to user
            if (error.name !== RoomNotFoundError.name) {
                console.log(`what is the error's name, ${error.name}`);
                return throwError(error.message, error.status);
            }

            // since room was not found, we continue to creating room
            let newRoom = await createRoom({ userId });

            if (!newRoom.success) {
                throwError(newRoom.error.message, newRoom.error.status);
            }
            console.log("[ LINE 66 ]");

            return socket.emit(roomCreated, {
                data: newRoom.data,
                success: true,
            });
        } catch (error) {
            return socket.emit(displayError, {
                error: error.message,
                success: false,
            });
        }
    },
    joinRoomHandler: async (payload, socket, io) => {
        let { roomId } = payload;
        let { user } = socket;
        try {
            if (!roomId || typeof roomId !== "string") {
                throwError(
                    invalidSocketPayload({
                        roomId: "should be a valid room `_id` string",
                    })
                );
            }

            // find room using roomId. this room must be available else, raise an error to user
            let { data, error, success } = await findRoomById(roomId);

            let thisNamespaceIO = io.of(socket.nsp.name);
            let socketsInRoom = Array.from(thisNamespaceIO.adapter.rooms).find(
                ([_room_id]) => _room_id === roomId
            );

            if (!success) {
                if (error.name === RoomNotFoundError.name) {
                    throw new RoomNotFoundError(error.message);
                }
                throwError(error.message, error.status);
            }

            /**
             * if room exists, let's go ahead to check
             * if current user and other user are already players in that room.
             * if they are:
             *      - put this user into that room (in terms of socket),
             *      - emit to room that some user (_id) joined the room
             * else, check if there is some other room were this two users are the players there
             *      if they are:
             *          - put this user into that room,
             *          - alert the frontend, so that a join room operation is performed so as to put the other user into that room,
             *          - emit to room that some user (_id) joined the room
             *      else, check if the provided roomId is available:
             *          if available:
             *              - update room `_players` column with this user `_id`
             *              - add this user into that room (in terms of socket)
             *              - emit to room that some user (_id) joined the room
             * else:
             *      - emit to user that no rooms, available rooms with provided information was found
             */

            let [{ _players }] = data;
            // check if `_players` does not contain current user
            if (!_players.includes(user._id)) {
                // check if room is unavailable
                if (_players.length == 2) {
                    throwError(
                        "Room with provided `_id` contains maximum players. Try a different room"
                    );
                }

                let [other_player] = _players;

                // check if the players in this room are already same players in some other room, join this socket to that room
                let { data, error, success } = await findRoomByPlayers([
                    user,
                    other_player,
                ]);

                if (success) {
                    socket.join(roomId);

                    socketsInRoom = Array.from(thisNamespaceIO.adapter.rooms);

                    // add the other socket if in room ...

                    socket.emit(roomMemberJoined, {
                        data: null,
                        message:
                            "Player just joined room. Waiting for other player to join room",
                        success: true,
                    });
                }
            }

            // `_players` contains current user. Hence, add user socket to room
            socket.join(roomId);
            // socketsInRoom = await io.in(roomId).fetchSockets();
            console.log("------------");
            console.log(socketsInRoom);
            console.log("*******++++++++++++++++++********");
            console.log(socket);
            console.log("*******+++++22222+++++********");
            console.log(Array.from(socket.adapter.rooms));
            console.log(socketsInRoom);
            socket.to(roomId).emit({
                data: { user: user._username },
                message: `Player '${user._username}' just joined room. If number of players in room == 1, waiting for other player to join room`,
            });

            // emit no available room was found with provided information
            return socket.emit(roomResult, {
                data: null,
                message:
                    "Player could not join room. Provided information does not match with any room",
            });
        } catch (error) {
            if (error.name === RoomNotFoundError.name) {
                return socket.emit(roomNotFound, {
                    data: null,
                    message: error.message,
                    success: false,
                });
            }
            return socket.emit(displayError, {
                data: null,
                message: error.message,
                success: false,
            });
        }
    },
};
