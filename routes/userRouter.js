const express = require("express");
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const router = express.Router();

router.route("/login").post(authController.login);
router.route("/profile").get(authController.protect, userController.getme);
router
  .route("/signup")
  .post(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    authController.signup
  );
// log is get not post
router.route("/logout").post(authController.logout);
router.route("/resetpassword/:token").post(authController.resetPassword);
router.route("/forgetpassword").post(authController.forgotPassword);
// router
//   .route("/protect")
//   .get(authController.protect, weddinghallController.selectAll);
router
  .route("/:id")
  .get(userController.selectoneByIduser)
  .delete(userController.deleteOneById);
// .patch(
//   authController.protect,
//   userController.uploadUserPhoto,
//   userController.resizeUserPhoto,
//   userController.updateoneByToken
// );

router
  .route("/me")
  .patch(
    authController.protect,
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateoneByToken
  );

module.exports = router;
