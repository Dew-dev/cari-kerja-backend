const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const WorkerCommand = require("../../../workers/repositories/commands/command");
const RecruiterCommand = require("../../../recruiters/repositories/commands/command");
const Query = require("../queries/query");
const QueryWorker = require("../../../workers/repositories/queries/query");
const QueryRecruiter = require("../../../recruiters/repositories/queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  ConflictError,
  InternalServerError,
  BadRequestError,
} = require("../../../../helpers/errors");
const {
  compareHash,
  generateHash,
} = require("../../../../helpers/utils/hash_helper");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../../../helpers/auth/jwt_helper");
const { result } = require("validate.js");
const { use } = require("passport");
const ctx = "User-Command-Domain";
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { sendMail } = require("../../../../helpers/utils/mailer");
const resetPasswordEmail = require("../../../../helpers/utils/resetPasswordEmail");

class User {
  constructor(db) {
    this.command = new Command(db);
    this.workerCommand = new WorkerCommand(db);
    this.recruiterCommand = new RecruiterCommand(db);
    this.query = new Query(db);
    this.queryWorker = new QueryWorker(db);
    this.queryRecruiter = new QueryRecruiter(db);
  }

  async login(payload) {
    // const { username, password } = payload;
    const { email, password } = payload;

    const user = await this.query.findOne(
      { email, username: email },
      {
        id: 1,
        hashed_password: 1,
        email: 1,
        username: 1,
        login_provider: 1,
        provider_id: 1,
        role_id: 1,
      },
      "OR",
    );

    if (user.err) {
      if (user.err) {
        logger.log(`${ctx}:generateCredential`, user.err, "User not found");
        return wrapper.error(new NotFoundError("Wrong username or password"));
      }
    }

    const passwordMatch = await compareHash(
      password,
      user.data.hashed_password,
    );
    if (!passwordMatch) {
      return wrapper.error(new BadRequestError("Wrong username or password"));
    }
    delete user.data.hashed_password;

    if (user.data.role_id === 1) {
      const result = await this.queryWorker.findOne(
        { user_id: user.data.id },
        { id: 1, name: 1, avatar_url: 1, user_id: 1 },
      );
      if (result.err) {
        return wrapper.error(new NotFoundError("Worker not found"));
      }
      user.data["worker_id"] = result.data.id;
      user.data["user_id"] = result.data.user_id;
      user.data["name"] = result.data.name;
      user.data["role"] = "user";
      user.data["user_id"] = result.data.id;
      user.data["avatar_url"] = result.data.avatar_url;
    } else {
      const result = await this.queryRecruiter.findOne(
        { user_id: user.data.id },
        { id: 1, contact_name: 1, avatar_url: 1, user_id: 1 },
      );
      if (result.err) {
        return wrapper.error(new NotFoundError("Recruiter Not Found!"));
      }
      user.data["recruiter_id"] = result.data.id;
      user.data["user_id"] = result.data.user_id;
      user.data["name"] = result.data.contact_name;
      user.data["avatar_url"] = result.data.avatar_url;
      user.data["user_id"] = result.data.id;
      user.data["role"] = "recruiter";
    }

    const userResponse = {
      id:
        user.data.role_id === 1
          ? user.data["worker_id"]
          : user.data["recruiter_id"],
      user_id: user.data["user_id"],
      name: user.data["name"], // sekarang ada
      email: user.data.email,
      avatar_url: user.data.avatar_url,
      role: user.data.role_id === 1 ? "user" : "recruiter",
    };

    const token = await generateAccessToken(user.data);
    const refreshToken = await generateRefreshToken({ id: user.data.id });

    return wrapper.data({ token, refreshToken, user: userResponse });
  }

  async loginWithGoogle(payload) {
    const { id, email, role_id, name } = payload;
    const user = await this.query.findOne(
      { email },
      { id: 1, email: 1, login_provider: 1, provider_id: 1, role_id: 1 },
    );
    let data;
    let dataWorker;
    let dataRecruiter;

    if (user.err) {
      data = {
        id: uuidv4(),
        username: null,
        email,
        hashed_password: null,
        login_provider: "google",
        provider_id: id,
        role_id: role_id || 1,
      };
      const result = await this.command.insertOne(data);

      if (data.role_id == 1) {
        dataWorker = {
          id: uuidv4(),
          user_id: data.id,
          name: name,
        };
        const resultWorker = await this.workerCommand.insertOne(dataWorker);
        if (resultWorker.err) {
          return wrapper.error(
            new InternalServerError("Sign up worker failed"),
          );
        }
      } else {
        dataRecruiter = {
          id: uuidv4(),
          user_id: data.id,
          company_name: name,
          contact_name: name,
          contact_phone: "NULL",
        };
        const resultRecruiter =
          await this.recruiterCommand.insertOne(dataRecruiter);
        if (resultRecruiter.err) {
          return wrapper.error(
            new InternalServerError("Sign up recruiter failed"),
          );
        }
      }

      if (result.err) {
        return wrapper.error(new InternalServerError("Sign up failed"));
      }
    } else {
      data = user.data;
      if (data.role_id === 1) {
        const resultWorker = await this.queryWorker.findOne(
          { user_id: data.id },
          { id: 1, name: 1 },
        );
        data["worker_id"] = resultWorker.data.id;
      } else {
        const resultRecruiter = await this.queryRecruiter.findOne(
          { user_id: data.id },
          { id: 1, contact_name: 1 },
        );
        data["recruiter_id"] = resultRecruiter.data.id;
      }
    }

    const token = await generateAccessToken(data);
    const refreshToken = await generateRefreshToken({ id: data.id });

    logger.info(ctx, "Success login by google", "Users auth", "Success");
    return wrapper.data({ token, refreshToken });
  }

  async registerWorker(payload) {
    const { username, password, email, name } = payload;
    const stdUsername = username.toLowerCase().trim();
    const hashPassword = await generateHash(password);

    const user = await this.query.findOne({ username }, { id: 1 });
    if (user.data) {
      return wrapper.error(new ConflictError("Username is already exist"));
    }

    const user2 = await this.query.findOne({ email }, { id: 1 });

    if (user2.data) {
      return wrapper.error(new ConflictError("Email alredy exist"));
    }

    const data = {
      id: uuidv4(),
      username: stdUsername,
      email: email,
      hashed_password: hashPassword,
      login_provider: "local",
      provider_id: null,
      role_id: 1,
    };

    const dataWorker = {
      id: uuidv4(),
      user_id: data.id,
      name: name,
    };

    const result = await this.command.insertOne(data);
    if (result.err) {
      logger.error(ctx, "register", "Register Failed", result.err);
      return wrapper.error(new InternalServerError("Register Failed"));
    }
    delete data.hashed_password;

    const resultWorker = await this.workerCommand.insertOne(dataWorker);
    if (resultWorker.err) {
      logger.error(
        ctx,
        "register worker",
        "Register Worker Failed",
        resultWorker.err,
      );
      return wrapper.error(new InternalServerError("Register Worker Failed"));
    }

    return wrapper.data({ user_id: data.id, worker_id: resultWorker.id });
  }

  async registerRecruiter(payload) {
    const {
      username,
      password,
      email,
      company_name,
      contact_name,
      contact_phone,
    } = payload;
    const stdUsername = username.toLowerCase().trim();
    const hashPassword = await generateHash(password);

    const user = await this.query.findOne({ username }, { id: 1 });
    if (user.data) {
      return wrapper.error(new ConflictError("Username already exist"));
    }

    const user2 = await this.query.findOne({ email }, { id: 1 });

    if (user2.data) {
      return wrapper.error(new ConflictError("Email alredy exist"));
    }

    const data = {
      id: uuidv4(),
      username: stdUsername,
      email: email,
      hashed_password: hashPassword,
      login_provider: "local",
      provider_id: null,
      role_id: 2,
    };

    const dataRecruiter = {
      id: uuidv4(),
      user_id: data.id,
      company_name,
      contact_name,
      contact_phone,
    };

    const result = await this.command.insertOne(data);
    if (result.err) {
      logger.error(ctx, "register", "Register Failed", result.err);
      return wrapper.error(new InternalServerError("Register Failed"));
    }
    delete data.hashed_password;

    const resultRecruiter =
      await this.recruiterCommand.insertOne(dataRecruiter);
    if (resultRecruiter.err) {
      logger.error(
        ctx,
        "register recruiter",
        "Register Recruiter Failed",
        resultRecruiter.err,
      );
      return wrapper.error(
        new InternalServerError("Register Recruiter Failed"),
      );
    }

    return wrapper.data({ id: data.id });
  }

  async updateOneUser(payload) {
    const { id } = payload;
    const user = await this.query.findOne({ id }, { id: 1 });

    if (user.err) {
      return wrapper.error(new NotFoundError("User Not Found!"));
    }

    const updatableFields = [
      "username",
      "email",
      "password",
      "login_provider",
      "provider_id",
    ];
    let updateData = {};
    for (const field of updatableFields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        if (field == "password") {
          updateData["hashed_password"] = await generateHash(payload[field]);
        } else {
          updateData[field] = payload[field];
        }
      }
    }

    //console.log(updateData);

    const updateResult = await this.command.updateOneNew({ id }, updateData);
    if (updateResult.err) {
      logger.error(ctx, "Failed to update", "Domain users", updateResult.err);
      return wrapper.error(new InternalServerError("Update User Failed"));
    }
    logger.info(ctx, "Update Succeed", "Domain Users", wrapper.data({ id }));
    return wrapper.data({ id });
  }

  async logout(payload) {
    const { token } = payload;
    const checkedToken = await verifyRefreshToken(token);
    if (checkedToken.err) {
      logger.log(ctx, checkedToken.err, checkedToken.err.message);
      return wrapper.error(checkedToken.err);
    }

    return wrapper.data("Logout Success");
  }

  async deleteUser(payload) {
    const { id, user_online_id } = payload;

    const user = await this.query.findOne({ id }, { id: 1 });
    if (user.err) {
      return wrapper.error(new NotFoundError("User not found"));
    }

    if (user.data.id === user_online_id) {
      return wrapper.error(
        new ConflictError("Not allowed to delete your own account"),
      );
    }

    const result = await this.command.deleteOne({ id });
    if (result.err) {
      logger.error(ctx, "deleteUser", "can not delete user", result.err);
      return wrapper.error(new InternalServerError("Can not delete user"));
    }
    return wrapper.data("User successfully deleted");
  }

  async refreshToken(payload) {
    const { token } = payload;
    const checkedToken = await verifyRefreshToken(token);
    if (checkedToken.err) {
      logger.log(ctx, checkedToken.err, checkedToken.err.message);
      return wrapper.error(checkedToken.err);
    }

    const userData = await this.query.findOne(
      { id: checkedToken.data.id },
      { id: 1, email: 1, login_provider: 1, provider_id: 1, role_id: 1 },
    );
    if (userData.err) {
      logger.error(ctx, "findUser", "User not found", userData.err);
      return wrapper.error(new NotFoundError("User Not Found"));
    }

    if (userData.data.role_id === 1) {
      const result = await this.queryWorker.findOne(
        { user_id: userData.data.id },
        { id: 1, name: 1, avatar_url: 1, user_id: 1 },
      );
      if (result.err) {
        return wrapper.error(new NotFoundError("Worker not found"));
      }
      userData.data["worker_id"] = result.data.id;
      userData.data["name"] = result.data.name;
      userData.data["role"] = "user";
    } else {
      const result = await this.queryRecruiter.findOne(
        { user_id: userData.data.id },
        { id: 1, contact_name: 1, avatar_url: 1, user_id: 1 },
      );
      if (result.err) {
        return wrapper.error(new NotFoundError("Recruiter Not Found!"));
      }
      userData.data["recruiter_id"] = result.data.id;
      userData.data["name"] = result.data.contact_name;
      userData.data["role"] = "recruiter";
    }

    const accessToken = await generateAccessToken(userData.data);
    return wrapper.data({
      token: accessToken,
      user: userData.data,
    });
  }

  async forgotPassword(payload) {
    const { email } = payload;

    const user = await this.query.findUserByEmail(email);
    if (user.err || !user.data) {
      // security: jangan bocorin email exists
      return wrapper.data("If email exists, reset link sent");
    }

    // 🔒 RATE LIMIT PER USER
    const recentCount = await this.query.countRecentPasswordResets(
      user.data.id,
    );

    if (!recentCount.err && recentCount.data >= 3) {
      // jangan bocorin
      return wrapper.data("If email exists, reset link sent");
    }

    // ⏱️ COOLDOWN (2 menit)
    const lastReset = await this.query.getLastPasswordReset(user.data.id);

    if (
      lastReset.data &&
      Date.now() - new Date(lastReset.data.created_at).getTime() < 2 * 60 * 1000
    ) {
      return wrapper.data("If email exists, reset link sent");
    }

    // ❌ invalidate token lama
    await this.command.invalidatePasswordResets(user.data.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 1000 * 60 * 30); // 30 menit

    const saveToken = await this.command.insertPasswordReset({
      user_id: user.data.id,
      token,
      expired_at: expiredAt,
    });

    if (saveToken.err) {
      logger.error(ctx, "forgotPassword", "Failed save token", saveToken.err);
      return wrapper.error(
        new InternalServerError("Failed to process request"),
      );
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log(user.data);
    // TODO: send email
    try {
      await sendMail({
        to: user.data.email,
        subject: "Reset your password",
        html: resetPasswordEmail({
          name: user.data.name,
          resetUrl,
        }),
      });
    } catch (err) {
      logger.error(ctx, "forgotPassword", "Send email failed", err.message);
      return wrapper.error(
        new InternalServerError("Failed to send reset email"),
      );
    }

    return wrapper.data("If email exists, reset link sent");
  }

  async resetPassword(payload) {
    const { token, password } = payload;

    const reset = await this.query.findValidPasswordReset(token);
    if (reset.err || !reset.data) {
      return wrapper.error(
        new BadRequestError("Invalid or expired reset token"),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateUser = await this.command.updateUserPassword({
      user_id: reset.data.user_id,
      password: hashedPassword,
    });
    // console.log("updateUser", updateUser)
    if (updateUser.err) {
      logger.error(
        ctx,
        "resetPassword",
        "Update password failed",
        updateUser.err,
      );
      return wrapper.error(new InternalServerError("Failed to reset password"));
    }

    await this.command.markPasswordResetUsed(reset.data.id);

    return wrapper.data("Password reset successfully");
  }
}

module.exports = User;
