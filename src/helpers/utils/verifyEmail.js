module.exports = ({ name, verifyUrl }) => `
  <div style="font-family:Arial;line-height:1.6">
    <h2>Verify your email</h2>
    <p>Hi ${name || "there"},</p>
    <p>Please verify your email by clicking the button below:</p>
    <p>
      <a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
        Verify Email
      </a>
    </p>
    <p>This link expires in 30 minutes.</p>
  </div>
`;
