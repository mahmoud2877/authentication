const catchAsync = require("../utils/catchAsync");
const { Op, where } = require("sequelize");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const sequelize = require("../database");
const Users = require("../models/userModel");

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

// exports.getAll = (Model, joinsArray) =>
//   catchAsync(async (req, res, next) => {
//     console.log("grtAlllllllll");
//     const queries = req.query;
//     const doc = await Model.findAll({
//       include: joinsArray,
//       attributes: { exclude: ["exist"] },
//       where: queries,
//     });
//     if (!doc) {
//       return next(new AppError("No document found ", 404));
//     }
//     // SEND RESPONSE
//     res.status(200).json({
//       status: "success",
//       results: doc.length,
//       data: {
//         data: doc,
//       },
//     });
//   });

exports.getAll = (Model, joinsArray) =>
  catchAsync(async (req, res, next) => {
    console.log("DDDDDDDDDDDDD");
    // let resQuery = [];
    let query;
    // let queryArr = joinsArray.forEach((element) => {
    //   resQuery = resQuery.push({ model: element, where: { exist: 1 } });
    //   return resQuery;
    // });
    // console.log(queryArr);
    ///  it work for join in one table**************************************

    let {
      minPrice,
      maxPrice,
      page,
      limit,
      sort,
      address,
      name,
      minGuest,
      maxGuest,
    } = req.query;
    let totalPrice = "totalPrice";

    // else if (req.query) {
    //   console.log(req.params, "government id");
    //   query = await Model.findAll({
    //     where: req.query, // Replace with the desired ID
    //     attributes: { exclude: ["exist"] },
    //   });
    // }
    if (minPrice || maxPrice || address || name || minGuest || maxGuest) {
      console.log("req.query---req.query");

      // Construct the filter object
      let filterPrice = {};
      if (minPrice) {
        totalPrice = "totalPrice";
        minPrice = parseInt(minPrice);
      } else {
        minPrice = 0;
      }
      if (maxPrice) {
        totalPrice = "totalPrice";
        minPrice = parseInt(minPrice);
      } else {
        maxPrice = 1000000000;
      }
      // if (minPrice && maxPrice) {
      //   filterPrice = {
      //     [Op.and]: {
      //       tag: "totalPrice",
      //       value: {
      //         [Op.between]: [parseInt(minPrice), parseInt(maxPrice)],
      //       },
      //     },
      //   };
      //   // filterPrice.tag = "totalPrice";
      //   // filterPrice.value ={ [Op.gte]: parseInt(minPrice) }
      // }
      console.log(filterPrice, "totalPricetotalPricetotalPrice");
      const filterHall = {};
      if (!address) address = "";
      if (!name) name = "";
      if (minGuest) {
        minGuest = parseInt(minGuest);
      } else {
        minGuest = 0;
      }
      if (maxGuest) {
        maxGuest = parseInt(maxGuest);
      } else {
        maxGuest = 10000000;
      }
      if (maxGuest) filterHall.max_guest = { [Op.lte]: parseInt(maxGuest) };
      console.log(req.query);
      console.log(filterHall, "hallhall");

      const querySearch =
        "( SELECT wedding_hall.id FROM wedding_hall JOIN wedding_info ON wedding_hall.id = wedding_info.id_hall JOIN package_info ON wedding_info.id = package_info.id_info WHERE wedding_hall.name LIKE '%" +
        name +
        "%' AND wedding_hall.address LIKE '%" +
        address +
        "%' AND wedding_hall.min_guest >= " +
        minGuest +
        " AND wedding_hall.max_guest <= " +
        maxGuest +
        " AND package_info.tag = 'totalPrice'" +
        " AND package_info.value >=" +
        minPrice +
        " AND package_info.value <=" +
        maxPrice +
        ")";

      query = await WeddingHall.findAll({
        //  where: { id: req.params.id }, // Replace with the desired ID
        // attributes: ["id"],
        include: {
          model: WeddingInfo,
          required: true,
          include: {
            model: PackageInfo,
            //in case of name and wedding hall search
            // required: false,
            required: false,
            // where: { exist: 1, ...filterPrice },
          },
        },
        //in case of name and wedding hall search

        where: {
          id: {
            [Op.in]: sequelize.literal(querySearch),
          },
        },
      });

      console.log(query, "false");

      if (!query) {
        return next(new AppError("No document found with that ID", 404));
      }
    } else {
      console.log("without it");
      if (joinsArray?.length === 2) {
        console.log("reaaaaaaaaaaach");
        query = await Model.findAll({
          //  where: { id: req.params.id }, // Replace with the desired ID
          attributes: { exclude: ["exist"] },
          include: [
            {
              model: joinsArray[0],
              include: {
                model: PackageInfo,
                required: false,
                where: { exist: 1 },
              },

              required: false,
              where: { exist: 1 },
            },
            { model: joinsArray[1] },
          ],
        });
      } else if (joinsArray?.length === 1) {
        console.log("reaaaaaaaaaaach");
        query = await Model.findAll({
          //  where: { id: req.params.id }, // Replace with the desired ID
          attributes: { exclude: ["exist"] },
          include: {
            model: joinsArray[0],
            required: false,
            where: { exist: 1 },
          },
        });
      } else {
        query = await Model.findAll({
          where: req.query, // Replace with the desired ID
          attributes: { exclude: ["exist"] },
        });
      }
    }

    // if (popOptions) query = query.populate(popOptions);
    // const doc = await query;
    console.log(query);
    if (!query) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      length: query.length,
      data: {
        data: query,
      },
    });
  });

exports.getAllReservation = (Model, joinsArray) =>
  catchAsync(async (req, res, next) => {
    console.log("DDDDDDDDDDDDD");
    // let resQuery = [];
    let query;

    console.log("without it");
    if (joinsArray?.length === 2) {
      console.log("reaaaaaaaaaaach");
      query = await Model.findAll({
        //  where: { id: req.params.id }, // Replace with the desired ID
        attributes: { exclude: ["exist"] },
        include: [
          {
            model: joinsArray[0],
          },
          { model: joinsArray[1] },
        ],
      });
    } else if (joinsArray?.length === 1) {
      console.log("reaaaaaaaaaaach");
      query = await Model.findAll({
        //  where: { id: req.params.id }, // Replace with the desired ID
        attributes: { exclude: ["exist"] },
        include: {
          model: joinsArray[0],
          required: false,
          where: { exist: 1 },
        },
      });
    } else {
      query = await Model.findAll({
        where: req.query, // Replace with the desired ID
        attributes: { exclude: ["exist"] },
      });
    }

    // if (popOptions) query = query.populate(popOptions);
    // const doc = await query;
    console.log(query);
    if (!query) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      length: query.length,
      data: {
        data: query,
      },
    });
  });

exports.getOne = (Model, joinsArray) =>
  catchAsync(async (req, res, next) => {
    console.log("DDDDDDDDDDDDD");
    console.log(req.params);
    // let resQuery = [];
    let query;
    // let queryArr = joinsArray.forEach((element) => {
    //   resQuery = resQuery.push({ model: element, where: { exist: 1 } });
    //   return resQuery;
    // });
    // console.log(queryArr);
    ///  it work for join in one table**************************************
    if (joinsArray) {
      query = await Model.findOne({
        where: { id: req.params.id }, // Replace with the desired ID
        attributes: { exclude: ["exist"] },
        include: [
          {
            model: joinsArray[0],
            include: {
              model: PackageInfo,
              where: { exist: 1 },
              required: false,
            },
            where: { exist: 1 },
            required: false,
          },
          { model: joinsArray[1], include: Users, where: { exist: 1 } },
        ],
      });
    } else {
      console.log("reached ");
      query = await Model.findOne({
        where: { id: req.params.id }, // Replace with the desired ID
      });
    }
    // if (popOptions) query = query.populate(popOptions);
    // const doc = await query;
    console.log(query);
    if (!query) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: query,
      },
    });
  });

exports.getOneReservation = (Model, joinsArray) =>
  catchAsync(async (req, res, next) => {
    console.log("DDDDDDDDDDDDD");
    console.log(req.params);
    // let resQuery = [];
    let query;
    // let queryArr = joinsArray.forEach((element) => {
    //   resQuery = resQuery.push({ model: element, where: { exist: 1 } });
    //   return resQuery;
    // });
    // console.log(queryArr);
    ///  it work for join in one table**************************************
    if (joinsArray) {
      query = await Model.findOne({
        where: { id: req.params.id }, // Replace with the desired ID
        attributes: { exclude: ["exist"] },
        include: [
          {
            model: joinsArray[0],
          },
          { model: joinsArray[1] },
        ],
      });
    } else {
      console.log("reached ");
      query = await Model.findOne({
        where: { id: req.params.id }, // Replace with the desired ID
      });
    }
    // if (popOptions) query = query.populate(popOptions);
    // const doc = await query;
    console.log(query);
    if (!query) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: query,
      },
    });
  });

exports.getOneByAtt = (Model, joinsArray) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params, req.query);
    let query = await Model.findOne({
      where: { ID: req.params.id, exist: true }, // Replace with the desired ID
      attributes: { exclude: ["exist"] },
      include: joinsArray,
    });
    // if (popOptions) query = query.populate(popOptions);
    // const doc = await query;
    console.log(query);
    if (!query) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: query,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.destroy({
      where: {
        id: req.params.id,
      },
    });
    // await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.OneNotExist = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.update(
      { exist: false },
      {
        where: { id: req.params.id },
      }
    );
    // await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    console.log(req.body);

    const updatedRows = await Model.update(req.body, {
      where: { id: req.params.id },
    });
    console.log(updatedRows);
    if (!updatedRows[0]) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: updatedRows,
      },
    });
  });
exports.updateMe = (Model) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    let updatedRows;
    console.log(req.user, "usersuser");
    if (req.body.password) {
      const user = req.user;
      user.password = req.body.password;
      // user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      createSendToken(user, 200, req, res);
    } else {
      req.body.photo = req.body.photoName;
      updatedRows = await Model.update(req.body, {
        where: { id: req.user.id },
      });
      console.log(updatedRows);
      if (!updatedRows[0]) {
        return next(new AppError("No updaate occur not valid input", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          data: updatedRows,
        },
      });
    }
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.body, "req.body");
    console.log(req.file, "req.file");
    console.log(req.form, req.body.images, "req.form");
    console.log(req.user, "that is the video heerrrrrrrrrreeeeeeeee");
    req.body.user_id = req.user.id;
    req.body.id_user = req.user.id;
    const doc = await Model.create(req.body);

    console.log(doc.id, doc.dataValue);
    res.status(201).json({
      status: "success",
      data: {
        id: doc.id,
        data: doc,
      },
    });
  });

exports.createoneReview = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.body, "req.body");
    console.log(req.file, "req.file");
    console.log(req.form, req.body.images, "req.form");
    console.log(req.user, "that is the video heerrrrrrrrrreeeeeeeee");
    req.body.user_id = req.user.id;
    req.body.id_user = req.user.id;

    if (req.body.tag === "rate" || req.body.tag === "Favourite") {
      await Model.update(
        { exist: 0 },
        {
          where: {
            id_user: req.body.id_user,
            tag: req.body.tag,
            id_hall: req.body.id_hall,
          },
        }
      );
    }
    const doc = await Model.create(req.body);

    // if(doc.)

    const review = await WeddingInfo.update(
      {
        value: sequelize.literal(`
           (
             SELECT SUM(value) / COUNT(value)
             FROM reviews
             WHERE id_hall = "${req.body.id_hall}"
             AND tag = "rate"
             AND exist = "1"
             GROUP BY id_hall, tag
           )
         `),
      },
      {
        where: {
          id_hall: req.body.id_hall,
          tag: "rating",
        },
      }
    )
      .then(() => {
        console.log(doc.id, doc.dataValue);
        res.status(201).json({
          status: "success",
          data: {
            id: doc.id,
            data: { doc },
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

exports.createOneHall = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.body, "req.body");
    console.log(req.file, "req.file");
    console.log(req.form, req.body.images, "req.form");
    console.log(req.user, "that is the video heerrrrrrrrrreeeeeeeee");
    req.body.user_id = req.user.id;
    req.body.address = `${req.body.country} -- ${req.body.governorate} -- ${req.body.city} -- ${req.body.address}`;
    const doc = await Model.create(req.body);
    const weddingInfo = await WeddingInfo.create({
      user_id: req.body.user_id,
      id_hall: doc.id,
      tag: "rating",
      value: 0,
      Date: Date.now(),
      status: "accepted",
    });
    // console.log(doc.id, doc.dataValue);
    res.status(201).json({
      status: "success",
      data: {
        id: doc.id,
        data: doc,
      },
    });
  });
