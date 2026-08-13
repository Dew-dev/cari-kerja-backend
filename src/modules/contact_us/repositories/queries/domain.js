const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");
const ctx = "ContactUs-Query-Domain";

const CONTACT_MESSAGE_PROJECTION = {
  id: 1,
  name: 1,
  email: 1,
  subject: 1,
  message: 1,
  phone: 1,
  created_at: 1,
};

class ContactUsQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async getContactMessages(payload) {
    const { page = 1, limit = 10, search = null } = payload;

    const result = await this.query.findAll(page, limit, search);
    if (result.err) {
      logger.error(ctx, "getContactMessages", "Failed get contact messages", result.err);
      return wrapper.error(new InternalServerError(result.err));
    }

    const countResult = await this.query.countAll(search);
    if (countResult.err) {
      logger.error(ctx, "getContactMessages", "Failed count contact messages", countResult.err);
      return wrapper.error(new InternalServerError(countResult.err));
    }

    const meta = wrapper.buildPaginationMeta(page, limit, countResult.data);

    return wrapper.paginationData(result.data, meta);
  }

  async getContactMessageById(payload) {
    const { id } = payload;

    const result = await this.query.findOne({ id }, CONTACT_MESSAGE_PROJECTION);
    if (result.err) {
      logger.error(ctx, "getContactMessageById", "Contact message not found", result.err);
      return wrapper.error(new NotFoundError("Contact message not found"));
    }

    return wrapper.data(result.data);
  }
}

module.exports = ContactUsQueryDomain;
