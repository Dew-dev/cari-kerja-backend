const joi = require("joi");

// const loginParamType = joi.object({
//   username: joi
//     .string()
//     .required()
//     .min(5)
//     .max(50)
//     .regex(/^[\w]+$/)
//     .message("Username must be alphanumeric"),
//   password: joi
//     .string()
//     .required()
//     .min(8)
//     .pattern(/[A-Z]/, "uppercase")
//     .pattern(/[a-z]/, "lowercase")
//     .pattern(/[0-9]/, "number")
//     .pattern(/[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|`~]/, "symbol")
//     .messages({
//       "string.empty": "Password must be not empty",
//       "string.min": "Password Minimum: {#limit} character",
//       "string.max": "Password Maksimum: {#limit} character",
//       "string.pattern.name": "Password must has 1 {#name}",
//     }),
// });

const loginParamType = joi.object({
  email: joi
    .string()
    .email({ tlds: { allow: false } }) // validasi format email tanpa batas TLD
    .required()
    .min(5)
    .max(100)
    .messages({
      "string.empty": "Email must not be empty",
      "string.email": "Invalid email format",
      "string.min": "Email must be at least {#limit} characters long",
      "string.max": "Email must be at most {#limit} characters long",
    }),

  password: joi
    .string()
    .required()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|`~]/, "symbol")
    .messages({
      "string.empty": "Password must not be empty",
      "string.min": "Password Minimum: {#limit} character",
      "string.max": "Password Maximum: {#limit} character",
      "string.pattern.name": "Password must contain at least 1 {#name}",
    }),
});

const loginWithGoogleParamType = joi.object({
  id: joi.string().optional(),
  email: joi
    .string()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .message("Email format must be true"),
  name: joi.string().optional(),
  picture: joi.string().optional(),
  role_id: joi.number().required(),
});

const registerParamType = joi.object({
  username: joi
    .string()
    .required()
    .min(5)
    .max(50)
    .regex(/^[\w]+$/)
    .message("Username must be alphanumeric"),
  password: joi
    .string()
    .required()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|`~]/, "symbol")
    .messages({
      "string.empty": "Password must be not empty",
      "string.min": "Password Minimum: {#limit} character",
      "string.max": "Password Maksimum: {#limit} character",
      "string.pattern.name": "Password must has 1 {#name}",
    }),
  email: joi
    .string()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .message("Email format must be true"),
  name: joi.string().required(),
});

const registerRecruiterParamType = joi.object({
  username: joi
    .string()
    .required()
    .min(5)
    .max(50)
    .regex(/^[\w]+$/)
    .message("Username must be alphanumeric"),
  password: joi
    .string()
    .required()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|`~]/, "symbol")
    .messages({
      "string.empty": "Password must be not empty",
      "string.min": "Password Minimum: {#limit} character",
      "string.max": "Password Maksimum: {#limit} character",
      "string.pattern.name": "Password must has 1 {#name}",
    }),
  email: joi
    .string()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .message("Email format must be true"),
  company_name: joi.string().required(),
  contact_name: joi.string().required(),
  contact_phone: joi.string().required(),
});

const deleteParamType = joi.object({
  id: joi.string().required(),
  user_online_id: joi.string().required(),
});

const updateUserParamType = joi.object({
  id: joi.string().required(),
  username: joi
    .string()
    .optional()
    .min(5)
    .max(50)
    .regex(/^[\w]+$/)
    .lowercase()
    .trim()
    .message("Username must be alphanumeric"),
  password: joi
    .string()
    .optional()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|`~]/, "symbol")
    .messages({
      "string.empty": "Password must be not empty",
      "string.min": "Password Minimum: {#limit} character",
      "string.max": "Password Maksimum: {#limit} character",
      "string.pattern.name": "Password must has 1 {#name}",
    }),
  email: joi
    .string()
    .optional()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .message("Email format must be true"),
  login_provider: joi.string().optional(),
  provider_id: joi.string().optional(),
});

const refreshTokenParamType = joi.object({
  token: joi.string().required(),
});

const logoutParamType = joi.object({
  token: joi.string().required(),
});

module.exports = {
  loginParamType,
  loginWithGoogleParamType,
  registerParamType,
  updateUserParamType,
  deleteParamType,
  refreshTokenParamType,
  logoutParamType,
  registerRecruiterParamType,
};
