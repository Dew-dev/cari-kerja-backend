class Command {
  constructor(db) {
    this.db = db;
  }

  async insertStage({ job_post_id, name, stage_type, position, color }) {
    const res = await this.db.executeQuery(
      `INSERT INTO application_statuses (job_post_id, name, stage_type, position, is_system, color)
       VALUES ($1, $2, $3, $4, false, $5)
       RETURNING id, name, stage_type, position, is_system, color;`,
      [job_post_id, name, stage_type, position, color ?? null],
    );
    return res;
  }

  async updateStage({ stage_id, name, color, position }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx}`);
      values.push(name);
      idx += 1;
    }
    if (color !== undefined) {
      fields.push(`color = $${idx}`);
      values.push(color);
      idx += 1;
    }
    if (position !== undefined) {
      fields.push(`position = $${idx}`);
      values.push(position);
      idx += 1;
    }

    values.push(stage_id);

    const res = await this.db.executeQuery(
      `UPDATE application_statuses
       SET ${fields.join(", ")}
       WHERE id = $${idx}
       RETURNING id, name, stage_type, position, is_system, color;`,
      values,
    );
    return res;
  }

  async updateStagePosition({ stage_id, position }) {
    return this.db.executeQuery(
      `UPDATE application_statuses SET position = $2 WHERE id = $1;`,
      [stage_id, position],
    );
  }

  async deleteStage(stage_id) {
    return this.db.executeQuery(
      `DELETE FROM application_statuses WHERE id = $1;`,
      [stage_id],
    );
  }
}

module.exports = Command;
