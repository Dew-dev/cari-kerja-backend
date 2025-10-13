const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const WorkerCommand = require("../../../workers/repositories/commands/command");
const RecruiterCommand = require("../../../recruiters/repositories/commands/command");
const Query = require("../queries/query");
const QueryWorker = require("../../../workers/repositories/queries/query");
const QueryRecruiter = require("../../../recruiters/repositories/queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, ConflictError, InternalServerError, BadRequestError } = require("../../../../helpers/errors");
const { compareHash, generateHash } = require("../../../../helpers/utils/hash_helper");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../../../helpers/auth/jwt_helper");
const ctx = "User-Command-Domain";

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
    const { username, password } = payload;
    const user = await this.query.findOne({ username }, { id: 1, hashed_password: 1, email: 1, login_provider: 1, provider_id: 1, role_id: 1 });

    if (user.err) {
      logger.log(`${ctx}:generateCredential`, user.err, "User not found");
      return wrapper.error(new NotFoundError("Wrong username or password"));
    }

    const passwordMatch = await compareHash(password, user.data.hashed_password);
    if (!passwordMatch) {
      return wrapper.error(new BadRequestError("Wrong username or password"));
    }
    delete user.data.hashed_password;

    if (user.data.role_id === 1) {
      const result = await this.queryWorker.findOne({ user_id: user.data.id }, { id: 1 });
      if (result.err) {
        return wrapper.error(new NotFoundError("Worker not found"));
      }
      user.data["worker_id"] = result.data.id;
    } else {
      const result = await this.queryRecruiter.findOne({ user_id: user.data.id }, { id: 1 });
      if (result.err) {
        return wrapper.error(new NotFoundError("Recruiter Not Found!"));
      }
      user.data["recruiter_id"] = result.data.id;
    }

    const token = await generateAccessToken(user.data);
    const refreshToken = await generateRefreshToken({ id: user.data.id });

    return wrapper.data({ token, refreshToken });
  }

  async loginWithGoogle(payload) {
    const { id, email, role_id, name } = payload;
    const user = await this.query.findOne({ email }, { id: 1, email: 1, login_provider: 1, provider_id: 1, role_id: 1 });
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
          return wrapper.error(new InternalServerError("Sign up worker failed"));
        }
      } else {
        dataRecruiter = {
          id: uuidv4(),
          user_id: data.id,
          company_name: name,
          contact_name: name,
          contact_phone: "NULL",
        }
        const resultRecruiter = await this.recruiterCommand.insertOne(dataRecruiter);
        if (resultRecruiter.err) {
          return wrapper.error(new InternalServerError("Sign up recruiter failed"));
        }
      }

      if (result.err) {
        return wrapper.error(new InternalServerError("Sign up failed"));
      }
    } else {
      data = user.data;
      if (data.role_id === 1) {
        const resultWorker = await this.queryWorker.findOne({ user_id: data.id }, { id: 1 });
        data["worker_id"] = resultWorker.data.id;
      } else {
        const resultRecruiter = await this.queryRecruiter.findOne({ user_id: data.id }, { id: 1 });
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
      logger.error(ctx, "register worker", "Register Worker Failed", resultWorker.err);
      return wrapper.error(new InternalServerError("Register Worker Failed"));
    }

    return wrapper.data({ user_id: data.id, worker_id: resultWorker.id });
  }

  async registerRecruiter(payload) {
    const { username, password, email, company_name, contact_name, contact_phone } = payload;
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
      contact_phone
    };

    const result = await this.command.insertOne(data);
    if (result.err) {
      logger.error(ctx, "register", "Register Failed", result.err);
      return wrapper.error(new InternalServerError("Register Failed"));
    }
    delete data.hashed_password;

    const resultRecruiter = await this.recruiterCommand.insertOne(dataRecruiter);
    if (resultRecruiter.err) {
      logger.error(ctx, "register recruiter", "Register Recruiter Failed", resultRecruiter.err);
      return wrapper.error(new InternalServerError("Register Recruiter Failed"));
    }    

    return wrapper.data({ id: data.id });
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
      return wrapper.error(new ConflictError("Not allowed to delete your own account"));
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

    const userData = await this.query.findOneById(checkedToken.data.id);
    if (userData.err) {
      logger.error(ctx, "findUser", "User not found", userData.err);
      return wrapper.error(new NotFoundError("User Not Found"));
    }

    const accessToken = await generateAccessToken(userData.data);
    return wrapper.data({
      token: accessToken,
    });
  }

  // async updateUser(payload){}
}

module.exports = User;
