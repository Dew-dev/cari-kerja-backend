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
  ForbiddenError,
  UnauthorizedError,
  TooManyRequestsError,
} = require("../../../../helpers/errors");
const config = require("../../../../config/global_config");
const { verifyTelegramOidcToken } = require("../../../../helpers/auth/telegram_oidc");
const axios = require("axios");
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

const resetPasswordEmail = require("../../../../helpers/utils/resetPasswordEmail");
const verifyEmailTemplate = require("../../../../helpers/utils/verifyEmail");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const COOLDOWN_SECONDS = 60;
const MAX_PER_HOUR = 5;
const TELEGRAM_PLACEHOLDER_EMAIL_RE = /^telegram_.+@carikerja\.id$/i;

const isTelegramPlaceholderEmail = (email) =>
  typeof email === "string" && TELEGRAM_PLACEHOLDER_EMAIL_RE.test(email);

const needsEmailSetup = (user) => {
  if (!user || user.login_provider !== "telegram") return false;
  if (!user.email || isTelegramPlaceholderEmail(user.email)) return true;
  return !user.email_verified_at;
};

const needsTelegramLink = (user) => {
  if (!user) return false;
  if (user.login_provider !== "local" && user.login_provider !== "google") {
    return false;
  }
  return !user.notification_telegram_id;
};

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
        email_verified_at: 1,
        notification_telegram_id: 1,
      },
      "OR",
    );

    if (user.err) {
      if (user.err) {
        logger.log(`${ctx}:generateCredential`, user.err, "User not found");
        return wrapper.error(new NotFoundError("Wrong username or password"));
      }
    }

    if (user.data.login_provider && user.data.login_provider !== "local") {
      return wrapper.error(
        new ForbiddenError(
          `This account uses ${user.data.login_provider} login. Please sign in with ${user.data.login_provider}.`,
        ),
      );
    }

    // 🔥 BLOK LOGIN JIKA BELUM VERIF
    if (!user.data.email_verified_at) {
      return wrapper.error(new ForbiddenError("Email not verified"));
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
      user.data["avatar_url"] = result.data.avatar_url;
    } else if (user.data.role_id === 2) {
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
      user.data["role"] = "recruiter";
    } else if (user.data.role_id === 3 || user.data.role_id === 4) {
      user.data["user_id"] = user.data.id;
      user.data["name"] = user.data.username || "Super Admin";
      user.data["role"] = user.data.role_id === 3 ? "super_admin" : "admin";
      user.data["avatar_url"] = null;
    }

    const userResponse = {
      id:
        user.data.role_id === 1
          ? user.data["worker_id"]
          : user.data.role_id === 2
          ? user.data["recruiter_id"]
          : user.data.id,
      user_id: user.data["user_id"],
      name: user.data["name"],
      email: user.data.email,
      avatar_url: user.data.avatar_url,
      role: user.data["role"],
    };

    const token = await generateAccessToken({
      ...user.data,
      login_provider: user.data.login_provider || "local",
    });
    const refreshToken = await generateRefreshToken({ id: user.data.id });

    // Insert Audit Log
    await this.command.insertAuditLog({
      user_id: user.data.id,
      action: "LOGIN",
      ip_address: payload.ip_address || "Unknown",
      user_agent: payload.user_agent || "Unknown"
    });

    const requires_telegram_link = needsTelegramLink(user.data);

    return wrapper.data({
      token,
      refreshToken,
      user: {
        ...userResponse,
        login_provider: user.data.login_provider,
        requires_telegram_link,
        requires_email_setup: false,
      },
      requires_telegram_link,
      requires_email_setup: false,
    });
  }

  async loginWithGoogle(payload) {
    const { id, email, role_id, name } = payload;
    const user = await this.query.findOne(
      { email },
      {
        id: 1,
        email: 1,
        login_provider: 1,
        provider_id: 1,
        role_id: 1,
        notification_telegram_id: 1,
        email_verified_at: 1,
      },
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
        data["worker_id"] = dataWorker.id;
      } else if (data.role_id == 2) {
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
        data["recruiter_id"] = dataRecruiter.id;
      }

      if (result.err) {
        return wrapper.error(new InternalServerError("Sign up failed"));
      }
    } else {
      data = user.data;
      if (data.login_provider !== "google") {
        return wrapper.error(
          new ConflictError(
            `This email is already registered with ${data.login_provider} login. Please sign in with that method.`,
          ),
        );
      }
      if (data.role_id === 1) {
        const resultWorker = await this.queryWorker.findOne(
          { user_id: data.id },
          { id: 1, name: 1 },
        );
        data["worker_id"] = resultWorker.data.id;
      } else if (data.role_id === 2) {
        const resultRecruiter = await this.queryRecruiter.findOne(
          { user_id: data.id },
          { id: 1, contact_name: 1 },
        );
        data["recruiter_id"] = resultRecruiter.data.id;
      }
    }

    const token = await generateAccessToken({
      ...data,
      login_provider: data.login_provider || "google",
    });
    const refreshToken = await generateRefreshToken({ id: data.id });
    const requires_telegram_link = needsTelegramLink(data);

    // Insert Audit Log
    await this.command.insertAuditLog({
      user_id: data.id,
      action: "LOGIN_GOOGLE",
      ip_address: payload.ip_address || "Unknown",
      user_agent: payload.user_agent || "Unknown"
    });

    return wrapper.data({
      token,
      refreshToken,
      requires_telegram_link,
      requires_email_setup: false,
    });
  }

  async loginWithTelegram(payload) {
    const { code, role_id } = payload;
    const clientId = config.get("/telegramAuth/clientId");
    const clientSecret = config.get("/telegramAuth/clientSecret");
    const redirectUri = config.get("/telegramAuth/redirectUri");

    if (!clientId || !clientSecret || !redirectUri) {
      return wrapper.error(new InternalServerError("Telegram Authentication is not configured"));
    }

    let tokenResponse;
    try {
      // Exchange code for ID Token
      tokenResponse = await axios.post(
        "https://oauth.telegram.org/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    } catch (error) {
      logger.error(ctx, "Telegram OIDC Token Exchange Failed", "loginWithTelegram", error.response?.data || error.message);
      return wrapper.error(new BadRequestError("Failed to exchange code for token with Telegram"));
    }

    const { id_token } = tokenResponse.data;
    if (!id_token) {
      return wrapper.error(new BadRequestError("Telegram did not return id_token"));
    }

    let oidcClaims;
    try {
      oidcClaims = await verifyTelegramOidcToken(id_token, clientId);
    } catch (error) {
      logger.error(ctx, "Telegram OIDC ID Token Verification Failed", "loginWithTelegram", error);
      return wrapper.error(new ForbiddenError(`Invalid Telegram ID Token: ${error.message}`));
    }

    const provider_id = oidcClaims.sub; // unique telegram user id (string)
    const name = oidcClaims.name || oidcClaims.preferred_username || `Telegram User ${provider_id}`;
    const username = oidcClaims.preferred_username ? oidcClaims.preferred_username.toLowerCase() : `telegram_${provider_id}`;

    // Query user by login_provider and provider_id
    const user = await this.query.findOne(
      { login_provider: "telegram", provider_id },
      {
        id: 1,
        email: 1,
        login_provider: 1,
        provider_id: 1,
        role_id: 1,
        email_verified_at: 1,
        notification_telegram_id: 1,
      }
    );

    let data;
    let dataWorker;
    let dataRecruiter;

    if (user.err) {
      data = {
        id: uuidv4(),
        username,
        email: null,
        hashed_password: null,
        login_provider: "telegram",
        provider_id,
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
        data["worker_id"] = dataWorker.id;
      } else if (data.role_id == 2) {
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
        data["recruiter_id"] = dataRecruiter.id;
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
      } else if (data.role_id === 2) {
        const resultRecruiter = await this.queryRecruiter.findOne(
          { user_id: data.id },
          { id: 1, contact_name: 1 },
        );
        data["recruiter_id"] = resultRecruiter.data.id;
      }
    }

    const token = await generateAccessToken({
      ...data,
      login_provider: data.login_provider || "telegram",
    });
    const refreshToken = await generateRefreshToken({ id: data.id });
    const requires_email_setup = needsEmailSetup(data);

    // Insert Audit Log
    await this.command.insertAuditLog({
      user_id: data.id,
      action: "LOGIN_TELEGRAM",
      ip_address: payload.ip_address || "Unknown",
      user_agent: payload.user_agent || "Unknown",
    });

    return wrapper.data({
      token,
      refreshToken,
      requires_email_setup,
      // alias for older FE contracts; banner only — do not block app entry
      requires_email_update: requires_email_setup,
      requires_telegram_link: false,
    });
  }

  async registerWorker(payload) {
    const { username, password, email, name } = payload;
    const stdUsername = username.toLowerCase().trim();
    const hashPassword = await generateHash(password);

    const user = await this.query.findOne({ username: stdUsername }, { id: 1 });
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

    const userId = data.id;

    // 2. invalidate token verifikasi lama (aman kalau belum ada)
    await this.command.invalidateEmailVerifications(userId);

    // 3. generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 menit

    const saveToken = await this.command.insertEmailVerification({
      user_id: userId,
      token,
      expired_at: expiredAt,
    });

    if (saveToken.err) {
      return wrapper.error(
        new InternalServerError("Failed to send verification email"),
      );
    }

    // 4. send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await addEmailJob({
        to: email,
        subject: "Verify your email",
        html: verifyEmailTemplate({ name, verifyUrl }),
      });
    } catch (e) {
      // jangan gagalkan register kalau email gagal
      logger.error(ctx, "register", "Send verify email failed", e);
    }

    return wrapper.data({ user_id: data.id, worker_id: resultWorker.data.id });
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

    const user = await this.query.findOne({ username: stdUsername }, { id: 1 });
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

    ////console.log(updateData);

    const updateResult = await this.command.updateOneNew({ id }, updateData);
    if (updateResult.err) {
      logger.error(ctx, "Failed to update", "Domain users", updateResult.err);
      return wrapper.error(new InternalServerError("Update User Failed"));
    }
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
      {
        id: 1,
        email: 1,
        login_provider: 1,
        provider_id: 1,
        role_id: 1,
        email_verified_at: 1,
        notification_telegram_id: 1,
        username: 1,
      },
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
    } else if (userData.data.role_id === 2) {
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
    } else if (userData.data.role_id === 3 || userData.data.role_id === 4) {
      userData.data["name"] = userData.data.username || "Super Admin";
      userData.data["role"] = userData.data.role_id === 3 ? "super_admin" : "admin";
    }

    const accessToken = await generateAccessToken({
      ...userData.data,
      login_provider: userData.data.login_provider,
    });
    const requires_email_setup = needsEmailSetup(userData.data);
    const requires_telegram_link = needsTelegramLink(userData.data);

    return wrapper.data({
      token: accessToken,
      user: {
        ...userData.data,
        requires_email_setup,
        requires_email_update: requires_email_setup,
        requires_telegram_link,
      },
      requires_email_setup,
      requires_email_update: requires_email_setup,
      requires_telegram_link,
    });
  }

  async changeEmail(payload) {
    const { user_id, email } = payload;
    const normalizedEmail = String(email).toLowerCase().trim();

    if (isTelegramPlaceholderEmail(normalizedEmail)) {
      return wrapper.error(
        new BadRequestError("Please provide a real email address"),
      );
    }

    const user = await this.query.findOne(
      { id: user_id },
      {
        id: 1,
        email: 1,
        login_provider: 1,
        provider_id: 1,
        role_id: 1,
        username: 1,
        email_verified_at: 1,
        notification_telegram_id: 1,
      },
    );
    if (user.err || !user.data) {
      return wrapper.error(new NotFoundError("User Not Found"));
    }

    if (user.data.login_provider === "google") {
      return wrapper.error(
        new BadRequestError(
          "Google accounts use the email from Google and cannot change it here",
        ),
      );
    }

    if (user.data.email === normalizedEmail) {
      return wrapper.error(
        new BadRequestError("Email is the same as current email"),
      );
    }

    const existing = await this.query.findUserByEmail(normalizedEmail);
    if (existing.data && existing.data.id !== user_id) {
      return wrapper.error(new ConflictError("Email already exist"));
    }

    const updateResult = await this.command.updateOneNew(
      { id: user_id },
      { email: normalizedEmail },
    );
    if (updateResult.err) {
      logger.error(ctx, "changeEmail", "Update email failed", updateResult.err);
      return wrapper.error(new InternalServerError("Failed to update email"));
    }

    await this.command.clearEmailVerified(user_id);
    await this.command.invalidateEmailVerifications(user_id);

    const verifyTokenValue = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);
    const saveToken = await this.command.insertEmailVerification({
      user_id,
      token: verifyTokenValue,
      expired_at: expiredAt,
    });
    if (saveToken.err) {
      return wrapper.error(
        new InternalServerError("Failed to send verification email"),
      );
    }

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyTokenValue}`;
    let displayName = user.data.username || "User";

    const tokenPayload = {
      ...user.data,
      email: normalizedEmail,
      email_verified_at: null,
    };

    if (user.data.role_id === 1) {
      const worker = await this.queryWorker.findOne(
        { user_id },
        { id: 1, name: 1 },
      );
      if (!worker.err && worker.data) {
        tokenPayload.worker_id = worker.data.id;
        tokenPayload.name = worker.data.name;
        tokenPayload.role = "user";
        displayName = worker.data.name || displayName;
      }
    } else if (user.data.role_id === 2) {
      const recruiter = await this.queryRecruiter.findOne(
        { user_id },
        { id: 1, contact_name: 1 },
      );
      if (!recruiter.err && recruiter.data) {
        tokenPayload.recruiter_id = recruiter.data.id;
        tokenPayload.name = recruiter.data.contact_name;
        tokenPayload.role = "recruiter";
        displayName = recruiter.data.contact_name || displayName;
      }
    }

    try {
      await addEmailJob({
        to: normalizedEmail,
        subject: "Verify your email",
        html: verifyEmailTemplate({ name: displayName, verifyUrl }),
      });
    } catch (e) {
      logger.error(ctx, "changeEmail", "Send verify email failed", e);
    }

    const accessToken = await generateAccessToken(tokenPayload);
    const requires_email_setup = needsEmailSetup({
      ...tokenPayload,
      email_verified_at: null,
    });

    return wrapper.data({
      email: normalizedEmail,
      token: accessToken,
      requires_verification: true,
      requires_email_setup,
      requires_email_update: requires_email_setup,
      requires_telegram_link: needsTelegramLink(tokenPayload),
    });
  }

  async linkTelegramNotification(payload) {
    const { user_id, code } = payload;
    const clientId = config.get("/telegramAuth/clientId");
    const clientSecret = config.get("/telegramAuth/clientSecret");
    const redirectUri = config.get("/telegramAuth/redirectUri");

    if (!clientId || !clientSecret || !redirectUri) {
      return wrapper.error(
        new InternalServerError("Telegram Authentication is not configured"),
      );
    }

    const user = await this.query.findOne(
      { id: user_id },
      {
        id: 1,
        email: 1,
        login_provider: 1,
        role_id: 1,
        notification_telegram_id: 1,
        email_verified_at: 1,
      },
    );
    if (user.err || !user.data) {
      return wrapper.error(new NotFoundError("User Not Found"));
    }

    if (user.data.login_provider === "telegram") {
      return wrapper.error(
        new BadRequestError(
          "Telegram is already your login method and cannot be linked again",
        ),
      );
    }

    if (user.data.notification_telegram_id) {
      return wrapper.error(
        new ConflictError("Telegram is already linked for notifications"),
      );
    }

    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        "https://oauth.telegram.org/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
    } catch (error) {
      logger.error(
        ctx,
        "Telegram OIDC Token Exchange Failed",
        "linkTelegramNotification",
        error.response?.data || error.message,
      );
      return wrapper.error(
        new BadRequestError("Failed to exchange code for token with Telegram"),
      );
    }

    const { id_token } = tokenResponse.data;
    if (!id_token) {
      return wrapper.error(
        new BadRequestError("Telegram did not return id_token"),
      );
    }

    let oidcClaims;
    try {
      oidcClaims = await verifyTelegramOidcToken(id_token, clientId);
    } catch (error) {
      logger.error(
        ctx,
        "Telegram OIDC ID Token Verification Failed",
        "linkTelegramNotification",
        error,
      );
      return wrapper.error(
        new ForbiddenError(`Invalid Telegram ID Token: ${error.message}`),
      );
    }

    const telegramId = String(oidcClaims.sub);
    const telegramUsername = oidcClaims.preferred_username || null;

    const existingLogin = await this.query.findOne(
      { login_provider: "telegram", provider_id: telegramId },
      { id: 1 },
    );
    if (!existingLogin.err && existingLogin.data) {
      return wrapper.error(
        new ConflictError(
          "This Telegram account is already used as a login method by another user",
        ),
      );
    }

    const existingNotify = await this.query.findOne(
      { notification_telegram_id: telegramId },
      { id: 1 },
    );
    if (!existingNotify.err && existingNotify.data) {
      return wrapper.error(
        new ConflictError(
          "This Telegram account is already linked for notifications",
        ),
      );
    }

    const updateResult = await this.command.linkTelegramNotification({
      user_id,
      notification_telegram_id: telegramId,
      notification_telegram_username: telegramUsername,
    });
    if (updateResult.err) {
      return wrapper.error(
        new InternalServerError("Failed to link Telegram notifications"),
      );
    }

    return wrapper.data({
      notification_telegram_id: telegramId,
      notification_telegram_username: telegramUsername,
      requires_telegram_link: false,
    });
  }

  async forgotPassword(payload) {
    const { email } = payload;

    const user = await this.query.findUserByEmail(email);
    if (user.err || !user.data) {
      // security: jangan bocorin email exists
      return wrapper.data("If email exists, reset link sent");
    }

    // Password reset only for local login accounts
    const userFull = await this.query.findOne(
      { id: user.data.id },
      { id: 1, login_provider: 1 },
    );
    if (
      !userFull.err &&
      userFull.data &&
      userFull.data.login_provider &&
      userFull.data.login_provider !== "local"
    ) {
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
    //console.log(user.data);
    // TODO: send email
    try {
      await addEmailJob({
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
    // //console.log("updateUser", updateUser)
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

  async changePassword(payload) {
    const { user_id, id, current_password, new_password } = payload;

    const user = await this.query.findUserById(user_id);
    //console.log("user", payload);
    if (user.err || !user.data) {
      return wrapper.error("Unauthorized");
    }
    const isMatch = await bcrypt.compare(
      current_password,
      user.data.hashed_password,
    );

    if (!isMatch) {
      return wrapper.error(
        new BadRequestError("Current password is incorrect"),
      );
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    const update = await this.command.updateUserPassword({
      user_id,
      password: hashedPassword,
    });
    //console.log("update", update);
    if (update.err) {
      logger.error(ctx, "changePassword", "Update password failed", update.err);
      return wrapper.error(
        new InternalServerError("Failed to change password"),
      );
    }

    return wrapper.data("Password changed successfully");
  }

  async sendVerifyEmail({ user_id }) {
    const user = await this.query.findUserById(user_id);
    if (user.err || !user.data) {
      return wrapper.error(new UnauthorizedError("Unauthorized"));
    }

    if (user.data.email_verified_at) {
      return wrapper.data("Email already verified");
    }

    // cooldown sederhana (reuse count logic kalau mau)
    await this.command.invalidateEmailVerifications(user_id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    const save = await this.command.insertEmailVerification({
      user_id,
      token,
      expired_at: expiredAt,
    });
    if (save.err) {
      return wrapper.error(
        new InternalServerError("Failed to send verification"),
      );
    }

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await addEmailJob({
      to: user.data.email,
      subject: "Verify your email",
      html: verifyEmailTemplate({
        name: user.data.name,
        verifyUrl,
      }),
    });

    return wrapper.data("Verification email sent");
  }

  async verifyEmail({ token }) {
    const record = await this.query.findValidEmailVerification(token);
    if (record.err || !record.data) {
      return wrapper.error(new BadRequestError("Invalid or expired token"));
    }

    await this.command.markEmailVerified(record.data.user_id);
    await this.command.invalidateEmailVerifications(record.data.user_id);

    // Fetch user to get role information
    const user = await this.query.findUserByIds(record.data.user_id);
    if (user.err) {
      return wrapper.error(new InternalServerError("Failed to fetch user"));
    }
    const role = user.data?.role_id === 2 ? "recruiter" : "user";

    return wrapper.data({
      message: "Email verified successfully",
      role: role,
    });
  }
  async resendVerifyEmail({ email }) {
    const user = await this.query.findUserByEmail(email);
    if (user.err || !user.data) {
      return wrapper.data("If email exists, verification sent");
    }

    if (user.data.email_verified_at) {
      return wrapper.data("Email already verified");
    }
    const userId = user.data.id;

    // ⏳ COOLDOWN CHECK
    const latest = await this.query.getLatestEmailVerification(userId);
    if (latest.data) {
      const diff =
        (Date.now() - new Date(latest.data.created_at).getTime()) / 1000;

      if (diff < COOLDOWN_SECONDS) {
        return wrapper.error(
          new TooManyRequestsError(
            `Please wait ${Math.ceil(COOLDOWN_SECONDS - diff)} seconds`,
          ),
        );
      }
    }

    // 🚦 RATE LIMIT CHECK
    const count = await this.query.countEmailVerificationsInWindow(userId, 60);

    if (count.data >= MAX_PER_HOUR) {
      return wrapper.error(
        new TooManyRequestsError(
          "Too many verification requests. Please try again later.",
        ),
      );
    }
    await this.command.invalidateEmailVerifications(user.data.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.command.insertEmailVerification({
      user_id: user.data.id,
      token,
      expired_at: expiredAt,
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await addEmailJob({
      to: user.data.email,
      subject: "Verify your email",
      html: verifyEmailTemplate({
        name: user.data.name,
        verifyUrl,
      }),
    });

    return wrapper.data("If email exists, verification sent");
  }
}

module.exports = User;
