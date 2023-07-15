const { Sequelize } = require("sequelize");
// const WeddingHall = require("./models/weddingHall");

const sequelize = new Sequelize("hall_starts", "mahmoud", "12345678", {
  host: "192.168.1.55",
  port: 3306,
  dialect: "mysql",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.error("Error: " + err));

module.exports = sequelize;
