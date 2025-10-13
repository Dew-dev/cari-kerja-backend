const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

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
    const payload = {recruiter_id, sort_by, sort_order, limit, page};
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
    return sendResponse(result, res);

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
    const payload = {...req.body, recruiter_id: req.userMeta.id};
    const validatePayload = validator.isValidPayload(payload, commandModel.createJobPostParamType);
    if (validatePayload.err) {
        return sendResponse(validatePayload, res);
    }
    const result = await commandHandler.createJobPost(validatePayload.data);
    return sendResponse(result, res, 201);
}

module.exports = {
    getJobpostsByRecruiterId,
    getJobpostById,
    createJobPost
}