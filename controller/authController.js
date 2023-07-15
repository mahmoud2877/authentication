const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Users = require("../models/userModel");
const Email = require("../utils/email");
// const Users = require("../models/userModel");
// const Permission = require("../models/permessions");
// const requestIp = require("request-ip");
// const { parse } = require("ip");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (users, statusCode, req, res) => {
  console.log(users.dataValues.id, "id");
  const token = signToken(users.dataValues.id);
  console.log(token);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    credentials: true,
  });
  // httpOnly: true,
  // sameSite: "lax",
  // secure: true,
  // httpOnly: true,
  // secure: req.secure || req.headers["x-forwarded-proto"] === "https",

  // Remove password from output
  users.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      users,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  console.log(req.body, "fffffffffffffffffsignup");
  // console.log(req.file.filename, "filename");
  // try {

  newUser = await Users.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    photo: req.body.photoName,
  });
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  console.log(req.body, "request body");
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const users = await Users.findOne({ where: { email: email } });
  console.log(users);
  //.select("+password"); ...to get password

  const result = await users?.correctPassword(password, users.password);
  console.log(result);
  if (!users || !(await users.correctPassword(password, users.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //  3) If everything ok, send token to client
  createSendToken(users, 200, req, res);
});

exports.logout = (req, res) => {
  res.clearCookie("jwt", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  console.log(req.body, "protect res");
  console.log("protect");
  console.log("1");
  console.log(req.cookies?.jwt, "tokens");
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    console.log("2");
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    console.log(req.cookies.jwt);
    token = req.cookies.jwt;
  } else if (req.headers.cookie) {
    const headersApp = req.headers;
    tokenArr = headersApp.cookie.split("=");
    tokenn = tokenArr[1];
    // const kets = Object.keys(headersApp);
    // const result = kets.filter((el) => el.endsWith("token"));
    // const tokenn = headersApp[result[0]];
    // console.log(req.headers, kets, result, tokenn);
    if (tokenn) {
      token = tokenn;
    }
  }

  console.log(token, "hhhhhhhhhhhhhhhhhhhh");
  // token = req.headers.authorization;

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded, "decode id");
  // 3) Check if user still exists
  const currentUser = await Users.findOne({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently changed password! Please log in again.", 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // res.locals.user = currentUser;
  // res.status(200).json({ status: "success", user: "done" });
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await Users.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = catchAsync(async (req, res, next) => {
  console.log(req.user, "hhhhhhhhhhhhhhhhh");
  console.log(req.query, req.query.feature);
  try {
    const allowed = await Permission.findOne({
      where: {
        powers: req.user.ID,
        tag: req.query.feature,
      },
    });
    const res = allowed.dataValues;
    console.log(res, "ressssssssssssssssssssss");

    if (allowed.can === 2) {
      console.log("1");
      next(new AppError("you are not allowed... permission not found"));
    }
    console.log(allowed, "allowedbbbbbbbbbbbbb restrict");
  } catch (err) {
    console.log("2");

    next(new AppError("error allowed permission "));
  }
  if (allowed.can === 1) {
    next();
  } else {
    next(new AppError("error allowed permission "));
  }
});

exports.restrictToHallAdmin = catchAsync(async (req, res, next) => {
  //   console.log(req.user, "hhhhhhhhhhhhhhhhh");
  //   console.log(req.query, req.query.feature);
  //   console.log(req.body, req.user.halls, "result in restrict");
  //   const hallsId = req.user.halls.map((el) => el.id);
  //   console.log(hallsId, "hhhhhhhhhhhhhalls");
  //   console.log(req.body);
  //   console.log(hallsId.includes(req.body.id_hall));
  //   if (!hallsId.map(String).includes(String(req.body.id_hall))) {
  //     next(new AppError("this hall is not your hall permission error"));
  //   }
  next();
});
// (...roles) => {
//   return (req, res, next) => {
//     // roles ['admin', 'lead-guide']. role='user'

//     if (!roles.includes(req.user.role)) {
//       return next(
//         new AppError("You do not have permission to perform this action", 403)
//       );
//     }

//     next();
//   };
// };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await Users.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }
  console.log(user);
  // // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  console.log(resetToken);
  await user.save({ validate: false });
  // { validate: false }
  // 3) Send it to user's email
  try {
    const resetURL = `http://192.168.1.52:3000/ResetPassword/${resetToken}`;
    // `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/users/resetPassword/${resetToken}`;
    console.log(user.dataValues, resetURL);
    await new Email(user.dataValues, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: resetURL,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // await user.save({ validate: false });
    console.log(err);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  console.log(req.body);
  console.log(req.params.token, "crypto");
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await Users.findOne({
    where: { passwordResetToken: hashedToken },
  });
  // passwordResetExpires: { $gt: Date.now() },
  console.log(user);
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  // user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  /// { validate :true }
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await Users.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
