const mongoose = require("mongoose");
const config = require("../../AppConfig");

const initDb = () => {
  const connectionString = config.Db.HostUrl;
  try {
    mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    mongoose.connection.on("connected", () => {
      console.log("connected to mongo database", process.env.DB_HOST_URL);
    });

    mongoose.connection.on("error", (err) => {
      console.log("Error at mongoDB: " + err);
    });
  } catch (e) {
    console.log("db connection error", process.env.DB_HOST_URL);
    
    console.error(e);
  }
}


module.exports = {
  initDb
};