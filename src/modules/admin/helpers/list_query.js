// Kontrak query seragam untuk list admin berpaginasi:
// search (multi kolom), filter typed, sort_by/sort_order whitelist + secondary sort id.
//
// Catatan enkripsi: kolom sensitif (name, email, username, telephone, company_name,
// contact_name, contact_phone) tersimpan terenkripsi deterministik (AES-CBC, IV tetap).
// ILIKE parsial tidak bisa menembus ciphertext, jadi search pada kolom terenkripsi
// dilakukan dua arah: ILIKE (menangkap baris legacy yang masih plaintext) + exact match
// terhadap hasil enkripsi keyword (menangkap baris terenkripsi bila keyword persis sama).
const { encrypt } = require("../../../helpers/utils/crypto_helper");

class ListQueryBuilder {
  constructor() {
    this.conditions = [];
    this.values = [];
  }

  get nextIdx() {
    return this.values.length + 1;
  }

  // plainColumns: ILIKE parsial biasa. encryptedColumns: ILIKE (legacy) + exact ciphertext.
  addSearch(search, plainColumns = [], encryptedColumns = []) {
    if (!search) return;
    const parts = [];

    const likeIdx = this.nextIdx;
    this.values.push(`%${search}%`);
    for (const col of [...plainColumns, ...encryptedColumns]) {
      parts.push(`${col} ILIKE $${likeIdx}`);
    }

    if (encryptedColumns.length > 0) {
      const encrypted = encrypt(search);
      if (encrypted && encrypted !== search) {
        const encIdx = this.nextIdx;
        this.values.push(encrypted);
        for (const col of encryptedColumns) {
          parts.push(`${col} = $${encIdx}`);
        }
      }
    }

    if (parts.length > 0) this.conditions.push(`(${parts.join(" OR ")})`);
  }

  addEquals(column, value) {
    if (value === undefined || value === null || value === "") return;
    this.conditions.push(`${column} = $${this.nextIdx}`);
    this.values.push(value);
  }

  addEqualsInsensitive(column, value) {
    if (value === undefined || value === null || value === "") return;
    this.conditions.push(`LOWER(${column}) = LOWER($${this.nextIdx})`);
    this.values.push(value);
  }

  // deleted_state: active -> IS NULL, deleted -> IS NOT NULL, all -> tanpa filter
  addDeletedState(column, state) {
    if (!state || state === "all") return;
    this.conditions.push(state === "deleted" ? `${column} IS NOT NULL` : `${column} IS NULL`);
  }

  // Rentang tanggal inklusif berbasis tanggal kalender
  addDateRange(column, dateFrom, dateTo) {
    if (dateFrom) {
      this.conditions.push(`${column}::date >= $${this.nextIdx}::date`);
      this.values.push(dateFrom);
    }
    if (dateTo) {
      this.conditions.push(`${column}::date <= $${this.nextIdx}::date`);
      this.values.push(dateTo);
    }
  }

  // EXISTS / NOT EXISTS tanpa parameter tambahan
  addExists(sqlFragment, shouldExist = true) {
    if (shouldExist === undefined || shouldExist === null || shouldExist === "") return;
    const exists = shouldExist === true || shouldExist === "true";
    this.conditions.push(`${exists ? "EXISTS" : "NOT EXISTS"} (${sqlFragment})`);
  }

  whereClause() {
    return this.conditions.length ? `WHERE ${this.conditions.join(" AND ")}` : "";
  }
}

// sortMap: whitelist { api_key: "ekspresi SQL" }. Key di luar whitelist ditolak di Joi,
// ini hanya lapis kedua. Secondary sort id agar pagination stabil.
const buildOrderClause = (sortMap, sortBy, sortOrder, defaultKey, idColumn) => {
  const key = sortBy && sortMap[sortBy] ? sortBy : defaultKey;
  const direction = String(sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  return `ORDER BY ${sortMap[key]} ${direction}, ${idColumn} ASC`;
};

module.exports = { ListQueryBuilder, buildOrderClause };
