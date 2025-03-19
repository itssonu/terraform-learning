const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
class AppConfig {
    static BaseUrl = process.env.BASE_URL;

    static Db = {
        HostUrl: process.env.DB_HOST_URL
    }
}

module.exports = AppConfig;