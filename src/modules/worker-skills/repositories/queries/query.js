const collection = "worker_skills"; //nama tabel
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "WorkerSkills-Query";

class Query {
    constructor(db) {
        this.db = db;
    }

    // parameter: nyari berdasarkan apa
    // projection: kolom apa aja yang mau diambil

    async findOne(parameter, projection) {
        return this.db.findOne(parameter, projection, collection);
    }

    // Get All Skills by Worker ID
    async getAllByWorkerId(worker_id) {
        try {
            const query = `
            SELECT 
                s.id AS skill_id,
                s.skill_name,
                s.created_at AS skill_created_at,
                ws.created_at AS linked_at
            FROM worker_skills ws
            JOIN skills s ON ws.skill_id = s.id
            WHERE ws.worker_id = $1
            ORDER BY s.skill_name ASC;
            `;

            const result = await this.db.executeQuery(query, [worker_id]);

            if (!result || result.rows.length === 0) {
                return wrapper.error(errorEmptyMessage);
            }

            return wrapper.data(result.rows);
        } catch (error) {
            logger.error(ctx, errorQueryMessage, "getAllByWorkerId", error);
            return wrapper.error(errorQueryMessage);
        }
    }
}

module.exports = Query;
