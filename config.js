require('dotenv').config();

module.exports = {
    MONGODB_URL: process.env.MONGODB_URL,
    CUSTOMER_LOGIN_SECRET: process.env.CUSTOMER_LOGIN_SECRET,
}