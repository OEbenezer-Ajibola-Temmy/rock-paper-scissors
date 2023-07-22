/**
 * contains event listeners and emitters helper variables
 * @eventEmitters : these are camel-cased variables that emit events to any io connection
 */
module.exports = {
    displayError: "display_error",
    displayPayloadError: "display_payload_error",
    roomCreated: "room_created",
    roomFound: "room_found",
    roomMemberJoined: "room_member_joined",
    roomNewMemberJoined: "room_new_member_joined",
    roomNotFound: "room_not_found",
    roomResult: "room_result",
    userDisconnected: "user_disconnected",
    userIsOffline: "user_is_offline",
    userIsOnline: "user_is_online",
};
