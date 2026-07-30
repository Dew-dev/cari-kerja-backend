const { encrypt, decrypt, decryptRows } = require("../../src/helpers/utils/crypto_helper");

describe("crypto_helper decrypt for notification fields", () => {
  it("decrypts worker name aliased as user_name", () => {
    const plain = "Muaz Bachtiar";
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);

    const row = decryptRows({
      user_name: cipher,
      worker_name: cipher,
      company_name: encrypt("EGI Resources"),
    });

    expect(row.user_name).toBe(plain);
    expect(row.worker_name).toBe(plain);
    expect(row.company_name).toBe("EGI Resources");
  });

  it("strips whitespace inside base64 ciphertext before decrypt", () => {
    const plain = "Andika Prasetyo";
    const cipher = encrypt(plain);
    const spaced = `${cipher.slice(0, 10)} ${cipher.slice(10)}`;
    expect(decrypt(spaced)).toBe(plain);
  });

  it("decrypts chat recruiter aliases (recruiter_company / recruiter_name)", () => {
    const company = "EGI Resources";
    const contact = "Budi Santoso";
    const row = decryptRows({
      recruiter_company: encrypt(company),
      recruiter_name: encrypt(contact),
      recruiter_username: encrypt("budi.hr"),
      worker_username: encrypt("andi.worker"),
      sender_company: encrypt(company),
    });

    expect(row.recruiter_company).toBe(company);
    expect(row.recruiter_name).toBe(contact);
    expect(row.recruiter_username).toBe("budi.hr");
    expect(row.worker_username).toBe("andi.worker");
    expect(row.sender_company).toBe(company);
  });
});
