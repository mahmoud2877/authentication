const catchAsync = require("../utils/catchAsync");
const Users = require("../models/userModel");
const factoryFun = require("./factoryFun");
const multer = require("multer");
const sharp = require("sharp");
const multerStorage = multer.memoryStorage();
const AppError = require("../utils/appError");

//  CREATE / READ / UPDATE / DELETE
exports.selectAll = factoryFun.getAll(Users);
exports.selectoneById = factoryFun.getOne(Users);
exports.selectoneByIduser = factoryFun.getOne(Users);
exports.deleteOneById = factoryFun.OneNotExist(Users);
exports.createone = factoryFun.createOne(Users);
exports.updateoneById = factoryFun.updateOne(Users);
exports.updateoneByToken = factoryFun.updateMe(Users);

const multerFilter = (req, file, cb) => {
  console.log(file.mimetype, "mimeType");
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("image");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${Date.now()}.jpeg`;
  req.body.photoName = req.file.filename;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)
    .then(() => {
      next();
    })
    .catch((err) => {
      next(new AppError("image is not updated", 400));
    });
});

exports.getme = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      data: req.user,
    },
  });
};
