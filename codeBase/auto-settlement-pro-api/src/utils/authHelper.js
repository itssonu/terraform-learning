const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { saltRound } = require("./config");

const createHashPassword = async (plainPassword) => {
  const hashedPassword = await bcrypt.hash(
    plainPassword,
    saltRound
  );
  return hashedPassword;
};

const verifyHashPassword = async (plainPassword, dbPassword) => {
  const isPasswordValid = await bcrypt.compare(plainPassword, dbPassword);
  return isPasswordValid
};

const createJwtToken = ({ payload, secretKey = process.env.JWT_PRIVATEKEY, expiresIn = process.env.JWT_EXPIRES_IN }) => {
    return jwt.sign(payload, secretKey, { expiresIn });
};

const verifyToken = (token, secretKey = process.env.JWT_ACCESS_TOKEN_SECRET) => {
  return jwt.verify(token, secretKey);
};


module.exports = {
  createHashPassword,
  verifyHashPassword,
  createJwtToken,
  verifyToken,
};
