const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "Recruiter-Command-Domain";

class Recruiter {
    constructor(db) {
        this.command = new Command(db);
        this.query = new Query(db);
    }

    async updateOneRecruiter(payload) {
        const { id } = payload;
        const recruiter = await this.query.findOne({ id }, { id: 1 });

        if (recruiter.err) {
            return wrapper.error(new NotFoundError("Recruiter Not Found!"));
        }

        const updatableFields = [
            "company_name",
            "avatar_url",
            "company_website",
            "contact_name",
            "contact_phone",
            "address",
            "industry_id",
            "description",
        ];
        let updateData = {};
        for (const field of updatableFields) {
            if (payload[field] !== undefined && payload[field] !== null) {
                updateData[field] = payload[field];
            }
        }

        const updateResult = await this.command.updateOneNew({id}, updateData);
        if (updateResult.err) {
            logger.error(ctx, "Failed to update", "Domain recruiter", updateResult.err);
            return wrapper.error(new InternalServerError("Update Recruiter Failed"));
        }
        logger.info(ctx, "Update Succeed", "Domain Recruiter", wrapper.data({id}));
        return wrapper.data({id});
    }
}

module.exports = Recruiter;

