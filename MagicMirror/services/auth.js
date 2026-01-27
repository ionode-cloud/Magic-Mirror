const JWT = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const secret = process.env.JWT_SECRET;

function createTokens(user) {
    const payload = {
        _id : user._id,
        email : user.email,
        profImg : user.profImg,
        role : user.role,
        fullName : user.fullName
    };

    const token = JWT.sign(payload,secret);
    return token;
}

function validateUser(token) {
    const payload = JWT.verify(token,secret);
    return payload;
}

module.exports = {
    createTokens,
    validateUser,
}