const joi = require("joi");

// Schema untuk membuat Contact Message
const createContactMessageParamType = joi.object({
  name: joi.string().max(100).required(),
  email: joi.string().email().required(),
  subject: joi.string().max(255).required(),
  message: joi.string().required(),
  phone: joi.string().optional().allow(null),
  created_at: joi.date().optional().default(() => new Date()),
});

// Schema untuk menghapus Contact Message
const deleteContactMessageParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createContactMessageParamType,
  deleteContactMessageParamType,
};
