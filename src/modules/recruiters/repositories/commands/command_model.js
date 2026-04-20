const joi = require("joi");

const wordCount = (str) => str.trim().split(/\s+/).filter(Boolean).length;

const descriptionValidator = joi.string().optional().custom((value, helpers) => {
    const count = wordCount(value);
    if (count < 80) return helpers.error('any.invalid', { message: `Deskripsi minimal 80 kata (saat ini ${count} kata)` });
    if (count > 130) return helpers.error('any.invalid', { message: `Deskripsi maksimal 130 kata (saat ini ${count} kata)` });
    return value;
}).messages({
    'any.invalid': '{{#message}}',
});

const addRecruiterParamType = joi.object({
    user_id: joi.string().required(),
    company_name: joi.string().required(),
    avatar_url: joi.string().optional(),
    company_website: joi.string().uri().optional().allow('', null),
    contact_name: joi.string().required(),
    contact_phone: joi.string().required(),
    address: joi.string().optional(),
    industry_id: joi.string().optional(),
    description: descriptionValidator,
    employee_count: joi.string().optional().allow('', null),
    instagram_url: joi.string().uri().optional().allow('', null),
    tiktok_url: joi.string().uri().optional().allow('', null),
});

const updateRecruiterParamType = joi.object({
    id: joi.string().required(),
    user_id: joi.string().required(),
    company_name: joi.string().optional(),
    avatar_url: joi.string().optional(),
    company_website: joi.string().uri().optional().allow('', null),
    contact_name: joi.string().optional(),
    contact_phone: joi.string().optional(),
    address: joi.string().optional(),
    industry_id: joi.number().optional(),
    description: descriptionValidator,
    employee_count: joi.string().optional().allow('', null),
    instagram_url: joi.string().uri().optional().allow('', null),
    tiktok_url: joi.string().uri().optional().allow('', null),
});

const updateRecruiterVipParamType = joi.object({
    id: joi.string().required(),
    user_id: joi.string().required(),
    is_vip: joi.boolean().required(),
    vip_start_at: joi.date().optional().allow(null),
    vip_end_at: joi.date().optional().allow(null),
});

module.exports = {
    addRecruiterParamType,
    updateRecruiterParamType,
    updateRecruiterVipParamType,
};