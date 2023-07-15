const sequelize = require("./database");
const dotenv = require("dotenv");
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

sequelize
  .sync()
  .then(() => {
    console.log("Done successfully.");
  })
  .catch((error) => {
    console.error("Error creating tables:", error);
  });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}... in BH`);
});

// Handle server close event
server.on("close", () => {
  console.log("reached");
  // Close the database connection
  connection.end((err) => {
    if (err) {
      console.error("Error closing the database connection: ", err);
      return;
    }
    console.log("Database connection closed.");
  });
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message, err);
  // restart the server when error
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
