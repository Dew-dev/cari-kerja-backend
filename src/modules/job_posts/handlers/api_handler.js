const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");

const getJobpostsByRecruiterId = async(req, res) => {
    const {
        recruiter_id,
    } = req.params;
    const {
        status,
        employment_type,
        experience_level,
        salary_type,
        location,
        salary_min,
        salary_max,
        currency,
        created_after,
        created_before,
        sort_by = 'created_at',
        sort_order = 'desc',
        limit = 10,
        page = 1,
    } = req.query;
    let payload = {recruiter_id, sort_by, sort_order, limit, page};
    const conditions = ['j.recruiter_id = $1']; // $1 is recruiterId
    const values = [recruiter_id];
    let idx = 2; // parameter index tracker

    const addCondition = (cond, val) => {
        if (val !== undefined && val !== null && val !== '') {
          conditions.push(cond.replace('?', `$${idx}`));
          values.push(val);
          payload = {...payload, val};
          idx += 1;
        }
    };
    
    // Optional filters – note: we compare to the column name used in the SELECT query
    addCondition('jps.name = ?', status);
    addCondition('et.name = ?', employment_type);
    addCondition('el.name = ?', experience_level);
    addCondition('st.name = ?', salary_type);
    addCondition('j.location ILIKE ?', location ? `%${location}%` : null);
    addCondition('j.salary_min >= ?', salary_min);
    addCondition('j.salary_max <= ?', salary_max);
    addCondition('c.name = ?', currency);
    addCondition('j.created_at >= ?', created_after);
    addCondition('j.created_at <= ?', created_before);

    payload = {...payload, conditions, values, idx};

    const sortableColumns = {
        title: 'j.title',
        location: 'j.location',
        salary_min: 'j.salary_min',
        salary_max: 'j.salary_max',
        created_at: 'j.created_at',
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    payload = {...payload, orderColumn, orderDirection};
    const validatePayload = validator.isValidPayload(payload, queryModel.getJobpostsByRecruiterIdParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getJobpostsByRecruiterId(validatePayload.data);
    return paginationResponse(result, res);

}

const getJobpostById = async(req, res) => {
    const payload = req.params;
    const validatePayload = validator.isValidPayload(payload, queryModel.getJobpostByIdParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getJobpostById(validatePayload.data);
    return sendResponse(result, res);
}

const createJobPost = async (req, res) => {
    const payload = {...req.body, recruiter_id: req.userMeta.recruiter_id};
    const validatePayload = validator.isValidPayload(payload, commandModel.createJobPostParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.createJobPost(validatePayload.data);
    return sendResponse(result, res, 201);
}

const createJobPostQuestions = async (req, res) => {
    const payload = req.body;
    const {
        id,
    } = req.params;
    // return payload;
    const result = await commandHandler.createJobPostQuestions(payload,id);
    return sendResponse(result, res, 201);
}

const getJobposts = async(req, res) => {
    const {
        status,
        employment_type,
        experience_level,
        salary_type,
        location,
        salary_min,
        salary_max,
        currency,
        created_after,
        created_before,
        search, // Full-text search term
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 10
    } = req.query
    let payload = {sort_by, sort_order, limit, page};
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status !== undefined && status !== null && status !== '') {
        conditions.push(` AND jps.name = $${idx}`);
        values.push(status);
        payload = {...payload, status};
        idx += 1;
    }
  
    if (employment_type !== undefined && status !== null && status !== '') {
        conditions.push(` AND et.name = $${idx}`);
        values.push(employment_type);
        payload = {...payload, employment_type};
        idx += 1;
    }

    if (experience_level !== undefined && experience_level !== null && experience_level !== '') {
        conditions.push(` AND el.name = $${idx}`);
        values.push(experience_level);
        payload = {...payload, experience_level};
        idx += 1;
    }

    if (salary_type !== undefined && salary_type !== null && salary_type !== '') {
        conditions.push(` AND st.name = $${idx}`);
        values.push(salary_type);
        payload = {...payload, salary_type};
        idx += 1;
    }

    if (location !== undefined && location !== null && location !== '') {
        conditions.push(` AND j.location ILIKE $${idx}`);
        values.push(location);
        payload = {...payload, location};
        idx += 1;
    }

    if (salary_min !== undefined && salary_min !== null && salary_min !== '') {
        conditions.push(` AND j.salary_min >= $${idx}`);
        values.push(salary_min);
        payload = {...payload, salary_min};
        idx += 1;
    }

    if (salary_max !== undefined && salary_max !== null && salary_max !== '') {
        conditions.push(` AND j.salary_max <= $${idx}`);
        values.push(salary_max);
        payload = {...payload, salary_max};
        idx += 1;
    }

    if (currency !== undefined && currency !== null && currency !== '') {
        conditions.push(` AND c.name = $${idx}`);
        values.push(currency);
        payload = {...payload, currency};
        idx += 1;
    }

    if (created_after !== undefined && created_after !== null && created_after !== '') {
        conditions.push(` AND j.created_at >= $${idx}`);
        values.push(created_after);
        payload = {...payload, created_after};
        idx += 1;
    }

    if (created_before !== undefined && created_before !== null && created_before !== '') {
        conditions.push(` AND j.created_at <= $${idx}`);
        values.push(created_before);
        payload = {...payload, created_before};
        idx += 1;
    }

    // 🔍 Full-text search on title & description
    if (search !== undefined && search !== null && search !== '') {
        conditions.push(`
            AND (
            to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.description, '')) 
            @@ to_tsquery('english', $${idx})
            )
        `);
        values.push(`${search}:*`);
        payload = {...payload, search: `${search}:*`};
        idx += 1;
    }

    payload = {...payload, conditions, values, idx};

    const sortableColumns = {
        title: 'j.title',
        location: 'j.location',
        salary_min: 'j.salary_min',
        salary_max: 'j.salary_max',
        created_at: 'j.created_at',
    };

    const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
    const orderDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    payload = {...payload, orderColumn, orderDirection};
    const validatePayload = validator.isValidPayload(payload, queryModel.getJobpostsParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await queryHandler.getJobposts(validatePayload.data);
    return paginationResponse(result, res);
}

module.exports = {
    getJobpostsByRecruiterId,
    getJobpostById,
    createJobPost,
    createJobPostQuestions,
    getJobposts,

}