const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

// routes
const userRouter = require("./routes/userRouter");
// const userinfoRouter = require("./routes/userinfoRouter");
// const citiesRouter = require("./routes/citiesRouter");
// const governorateRouter = require("./routes/governorateRouter");
// const languageRouter = require("./routes/languageRouter");

const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");

app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use("/public", express.static(path.join(__dirname, "public")));

// lang -- governorate -- city
// app.use("/api/v1/bh/cities", citiesRouter);
// app.use("/api/v1/bh/governorate", governorateRouter);
// app.use("/api/v1/bh/language", languageRouter);

// user -- userInfo -- weddingHall -- weddingHallInfo -- packagehallinfo
app.use("/api/v1/bh/user", userRouter);
// app.use("/api/v1/bh/userinfo", userinfoRouter);

// app.use("/api/v1/bh/userperm", userpermRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
