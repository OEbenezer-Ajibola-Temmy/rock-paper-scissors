// app imports
const { getUsers } = require("../utils/models");

exports.getUsersControllers = async (req, res) => {
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
