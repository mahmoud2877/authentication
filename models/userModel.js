const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Users = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING(255),
      default: "default.jpg",
    },
    role: {
      type: DataTypes.ENUM("user", "guide", "lead-guide", "admin"),
      defaultValue: "user",
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // select false to not appear
      select: false,
    },
    passwordChangedAt: { type: DataTypes.DATE, select: false },
    passwordResetToken: { type: DataTypes.STRING(255), select: false },
    passwordResetExpires: { type: DataTypes.DATE, select: false },
  },
  {
    tableName: "users",
    timestamps: false,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordConfirm = undefined;
        }
        if (!user.isNewRecord) {
          user.passwordChangedAt = Date.now() - 1000;
        }
      },
    },
  }
);

// Users.beforeCreate(async (users) => {
//   // Hash the password with cost of 12
//   users.password = await bcrypt.hash(users.password, 12);
// });
// Users.beforeUpdate(async (users) => {
//   // Hash the password with cost of 12

//   users.password = await bcrypt.hash(users.password, 12);
// });
Users.prototype.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

Users.prototype.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = Users;
