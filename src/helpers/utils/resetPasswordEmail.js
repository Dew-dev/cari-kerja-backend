module.exports = function resetPasswordEmail({ name, resetUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2>Password Reset Request</h2>
      <p>Hi ${name || "there"},</p>

      <p>
        We received a request to reset your password.
        Click the button below to set a new password.
      </p>

      <p style="margin: 20px 0">
        <a
          href="${resetUrl}"
          style="
            background: #2563eb;
            color: #fff;
            padding: 10px 16px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This link will expire in 30 minutes.
        If you did not request a password reset, please ignore this email.
      </p>

      <p style="margin-top: 30px; font-size: 12px; color: #666">
        © Job Portal
      </p>
    </div>
  `;
};
