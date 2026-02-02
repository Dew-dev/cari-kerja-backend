module.exports = ({ name, jobTitle, status }) => {
  let message = "";

  switch (status.toLowerCase()) {
    case "IN REVIEW":
      message = "Your application is currently under review.";
      break;
    case "SHORTLISTED":
      message = "Congratulations! You have been shortlisted for an interview.";
      break;
    case "REJECTED":
      message =
        "Thank you for your interest. Unfortunately, you were not selected.";
      break;
    case "HIRED":
      message = "Congratulations! You have been selected for this position.";
      break;
    default:
      message = `Your application status has been updated to "${status}".`;
  }

  return `
    <div style="font-family:Arial;line-height:1.6">
      <h2>Application Update</h2>
      <p>Hi ${name},</p>
      <p>${message}</p>
      <p>
        <strong>Position:</strong> ${jobTitle}<br/>
        <strong>Status:</strong> ${status}
      </p>
      <p>Thank you for using our platform.</p>
    </div>
  `;
};
