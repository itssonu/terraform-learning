const mongoose = require("mongoose");

const useDB = (dbName= 'master')=>{
    return mongoose.connection.useDb(dbName);
}

module.exports = { useDB }