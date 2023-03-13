// env
const {
    env: { BCRYPT_SALT },
} = process;
// error
const {
    emailPasswordDontMatchError,
    userNotFoundError,
} = require("../config/error");
// utils
const {
    createUser,
    findOneUser,
    comparePassword,
    hashPassword,
    signToken,
} = require("../utils/models/user");

exports.signUpController = async (req, res) => {
    let {
        input_email: email,
        input_password,
        input_username: username,
    } = req.body;

    let hashedPassword = await hashPassword(
        input_password,
        Number(BCRYPT_SALT)
    );

    let payload = {
        email,
        password: hashedPassword,
        username,
    };

    let { data, error, success } = await createUser(payload);

    console.log(payload);

    if (!success) {
        throw new Error(error);
    }

    return res.status(201).json({ success, data });
};

exports.signInController = async (req, res) => {
    let { input_email: email, input_password } = req.body;

    let { data, error, success } = await findOneUser({ email });

    if (!success) {
        console.log("-----");
        console.error(error);
        console.log("---------");
        throw new Error(userNotFoundError(email));
    }

    let { _id, username, password: hashedPassword } = data;
    let isPassword = await comparePassword(input_password, hashedPassword);

    if (!isPassword) {
        throw new Error(emailPasswordDontMatchError);
    }

    let token = signToken({ _id, email, username });
    return res.status(200).json({ success, token });
};
