const mongoose = require("mongoose");
const config = require("../../AppConfig");
let connectDb = "";
const initDb = () => {
  // const connectionString = props ? `mongodb://localhost:27017/${props}`: config.Db.HostUrl;
  const connectionString = config.Db.HostUrl;
  try {
    mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      // serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    mongoose.connection.on("connected", () => {
      console.log("connected to mongo database");
    });

    mongoose.connection.on("error", (err) => {
      console.log("Error at mongoDB: " + err);
    });
  } catch (e) {
    console.error(e);
  }
}
const  setdb=(props)=>{
  connectDb = props;
}
const dbConnection = () => {
  return connectDb;
}

module.exports = {
  initDb,
  dbConnection,
  setdb
};