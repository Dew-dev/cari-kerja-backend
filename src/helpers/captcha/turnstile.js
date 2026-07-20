const axios = require("axios");
const config = require("../../config/global_config");
const logger = require("../utils/logger");
const wrapper = require("../utils/wrapper");
const { BadRequestError } = require("../errors");

const ctx = "Turnstile-Captcha";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const isCaptchaEnabled = () => Boolean(config.get("/turnstile/secretKey"));

/**
 * Verifikasi Cloudflare Turnstile token.
 * Jika TURNSTILE_SECRET_KEY belum di-set (dev/test), verifikasi di-skip.
 */
const verifyCaptchaToken = async (token, remoteip) => {
  const secretKey = config.get("/turnstile/secretKey");
  if (!secretKey) {
    return wrapper.data({ skipped: true });
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return wrapper.error(new BadRequestError("CAPTCHA_REQUIRED"));
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token.trim(),
    });
    if (remoteip) body.set("remoteip", String(remoteip));

    const response = await axios.post(SITEVERIFY_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 8000,
    });

    if (!response.data?.success) {
      logger.error(ctx, "verifyCaptchaToken", "Turnstile rejected token", response.data);
      return wrapper.error(new BadRequestError("CAPTCHA_INVALID"));
    }

    return wrapper.data({ skipped: false });
  } catch (err) {
    logger.error(ctx, "verifyCaptchaToken", "Turnstile request failed", err.message);
    return wrapper.error(new BadRequestError("CAPTCHA_INVALID"));
  }
};

module.exports = {
  isCaptchaEnabled,
  verifyCaptchaToken,
};
