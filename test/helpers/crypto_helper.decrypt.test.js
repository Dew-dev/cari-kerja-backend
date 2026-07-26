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
});
