const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const adminHandler = require("../modules/admin/handlers/api_handler");

// super_admin (3) and admin (4)
const allowedRoles = [3, 4];
const superAdminOnly = [3];

module.exports = (server) => {
  server.get("/api/v1/admin/stats", verifyToken, verifyRole(allowedRoles), adminHandler.getDashboardStats);
  server.get("/api/v1/admin/dashboard/growth", verifyToken, verifyRole(allowedRoles), adminHandler.getDashboardGrowth);
  server.get("/api/v1/admin/dashboard/job-distribution", verifyToken, verifyRole(allowedRoles), adminHandler.getDashboardJobDistribution);
  server.get("/api/v1/admin/dashboard/activities", verifyToken, verifyRole(allowedRoles), adminHandler.getDashboardActivities);
  
  // Settings endpoints (Super Admin Only)
  server.get("/api/v1/admin/settings", verifyToken, verifyRole(superAdminOnly), adminHandler.getSystemSettings);
  server.put("/api/v1/admin/settings", verifyToken, verifyRole(superAdminOnly), adminHandler.updateSystemSettings);
  
  // Audit Logs (Super Admin Only)
  server.get("/api/v1/admin/audit-logs", verifyToken, verifyRole(superAdminOnly), adminHandler.getAuditLogs);

  // Generic Lookups
  server.get("/api/v1/admin/lookups/:table", verifyToken, verifyRole(allowedRoles), adminHandler.getLookupTable);
  server.post("/api/v1/admin/lookups/:table", verifyToken, verifyRole(allowedRoles), adminHandler.insertLookupTable);
  server.put("/api/v1/admin/lookups/:table/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateLookupTable);
  server.delete("/api/v1/admin/lookups/:table/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteLookupTable);
  
  server.get("/api/v1/admin/users", verifyToken, verifyRole(allowedRoles), adminHandler.getUsers);
  server.get("/api/v1/admin/users/:id", verifyToken, verifyRole(allowedRoles), adminHandler.getUserById);
  server.post("/api/v1/admin/users", verifyToken, verifyRole(allowedRoles), adminHandler.insertUser);
  server.put("/api/v1/admin/users/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateUser);
  server.delete("/api/v1/admin/users/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteUser);
  
  server.put("/api/v1/admin/users/:id/status", verifyToken, verifyRole(allowedRoles), adminHandler.updateUserStatus);
  server.get("/api/v1/admin/workers", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkers);
  server.get("/api/v1/admin/workers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerById);
  server.put("/api/v1/admin/workers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorker);
  server.delete("/api/v1/admin/workers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorker);

  // Worker sub-resources (worker_id dari path, bukan JWT)
  server.get("/api/v1/admin/workers/:worker_id/work-experiences", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerWorkExperiences);
  server.post("/api/v1/admin/workers/:worker_id/work-experiences", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerWorkExperience);
  server.put("/api/v1/admin/workers/:worker_id/work-experiences/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerWorkExperience);
  server.delete("/api/v1/admin/workers/:worker_id/work-experiences/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerWorkExperience);

  server.get("/api/v1/admin/workers/:worker_id/educations", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerEducations);
  server.post("/api/v1/admin/workers/:worker_id/educations", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerEducation);
  server.put("/api/v1/admin/workers/:worker_id/educations/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerEducation);
  server.delete("/api/v1/admin/workers/:worker_id/educations/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerEducation);

  server.get("/api/v1/admin/workers/:worker_id/certifications", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerCertifications);
  server.post("/api/v1/admin/workers/:worker_id/certifications", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerCertification);
  server.put("/api/v1/admin/workers/:worker_id/certifications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerCertification);
  server.delete("/api/v1/admin/workers/:worker_id/certifications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerCertification);

  server.get("/api/v1/admin/workers/:worker_id/portfolios", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerPortfolios);
  server.post("/api/v1/admin/workers/:worker_id/portfolios", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerPortfolio);
  server.put("/api/v1/admin/workers/:worker_id/portfolios/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerPortfolio);
  server.delete("/api/v1/admin/workers/:worker_id/portfolios/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerPortfolio);

  server.get("/api/v1/admin/workers/:worker_id/languages", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerLanguages);
  server.post("/api/v1/admin/workers/:worker_id/languages", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerLanguage);
  server.put("/api/v1/admin/workers/:worker_id/languages/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerLanguage);
  server.delete("/api/v1/admin/workers/:worker_id/languages/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerLanguage);

  server.get("/api/v1/admin/workers/:worker_id/resumes", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerResumes);
  server.put("/api/v1/admin/workers/:worker_id/resumes/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerResume);
  server.delete("/api/v1/admin/workers/:worker_id/resumes/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerResume);

  server.get("/api/v1/admin/workers/:worker_id/skills", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerSkills);
  server.post("/api/v1/admin/workers/:worker_id/skills", verifyToken, verifyRole(allowedRoles), adminHandler.insertWorkerSkill);
  server.delete("/api/v1/admin/workers/:worker_id/skills/:skill_id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerSkill);

  server.get("/api/v1/admin/workers/:worker_id/applications", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerApplications);
  server.put("/api/v1/admin/workers/:worker_id/applications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerApplication);
  server.delete("/api/v1/admin/workers/:worker_id/applications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerApplication);

  server.get("/api/v1/admin/workers/:worker_id/job-post-answers", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerJobPostAnswers);
  server.put("/api/v1/admin/workers/:worker_id/job-post-answers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateWorkerJobPostAnswer);
  server.delete("/api/v1/admin/workers/:worker_id/job-post-answers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerJobPostAnswer);

  server.get("/api/v1/admin/workers/:worker_id/saved-jobs", verifyToken, verifyRole(allowedRoles), adminHandler.getWorkerSavedJobs);
  server.delete("/api/v1/admin/workers/:worker_id/saved-jobs/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteWorkerSavedJob);

  server.get("/api/v1/admin/employers", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployers);
  server.get("/api/v1/admin/employers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployerById);
  server.put("/api/v1/admin/employers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateEmployer);
  server.delete("/api/v1/admin/employers/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteEmployer);
  server.put("/api/v1/admin/employers/:id/verify", verifyToken, verifyRole(allowedRoles), adminHandler.verifyEmployer);

  // Employer sub-resources
  server.get("/api/v1/admin/employers/:employer_id/job-posts", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployerJobPosts);
  server.delete("/api/v1/admin/employers/:employer_id/job-posts/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteEmployerJobPost);
  server.get("/api/v1/admin/employers/:employer_id/subscriptions", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployerSubscriptions);
  server.put("/api/v1/admin/employers/:employer_id/subscriptions/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateEmployerSubscription);
  server.delete("/api/v1/admin/employers/:employer_id/subscriptions/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteEmployerSubscription);
  server.get("/api/v1/admin/employers/:employer_id/payment-orders", verifyToken, verifyRole(allowedRoles), adminHandler.getEmployerPaymentOrders);
  
  server.get("/api/v1/admin/jobs", verifyToken, verifyRole(allowedRoles), adminHandler.getJobs);
  server.get("/api/v1/admin/jobs/:id", verifyToken, verifyRole(allowedRoles), adminHandler.getJobById);
  server.put("/api/v1/admin/jobs/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateJob);
  server.delete("/api/v1/admin/jobs/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteJob);
  server.put("/api/v1/admin/jobs/:id/status", verifyToken, verifyRole(allowedRoles), adminHandler.updateJobStatus);
  
  // Payment Orders
  server.get("/api/v1/admin/payment-orders", verifyToken, verifyRole(allowedRoles), adminHandler.getPaymentOrders);
  server.get("/api/v1/admin/payment-orders/:id", verifyToken, verifyRole(allowedRoles), adminHandler.getPaymentOrderById);
  server.put("/api/v1/admin/payment-orders/:id/status", verifyToken, verifyRole(allowedRoles), adminHandler.updatePaymentOrderStatus);

  // Plans CRUD (:type = subscription | single_post | boost)
  server.get("/api/v1/admin/plans", verifyToken, verifyRole(allowedRoles), adminHandler.getAllPlans);
  server.get("/api/v1/admin/plans/:type", verifyToken, verifyRole(allowedRoles), adminHandler.getPlansByType);
  server.post("/api/v1/admin/plans/:type", verifyToken, verifyRole(allowedRoles), adminHandler.insertPlan);
  server.put("/api/v1/admin/plans/:type/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updatePlan);
  server.delete("/api/v1/admin/plans/:type/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deletePlan);

  // Locations CRUD (read tetap via /api/v1/locations/*)
  server.post("/api/v1/admin/locations/provinces", verifyToken, verifyRole(allowedRoles), adminHandler.insertProvince);
  server.put("/api/v1/admin/locations/provinces/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateProvince);
  server.delete("/api/v1/admin/locations/provinces/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteProvince);
  server.post("/api/v1/admin/locations/cities", verifyToken, verifyRole(allowedRoles), adminHandler.insertCity);
  server.put("/api/v1/admin/locations/cities/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateCity);
  server.delete("/api/v1/admin/locations/cities/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteCity);

  server.get("/api/v1/admin/applications", verifyToken, verifyRole(allowedRoles), adminHandler.getApplications);
  server.put("/api/v1/admin/applications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.updateApplication);
  server.delete("/api/v1/admin/applications/:id", verifyToken, verifyRole(allowedRoles), adminHandler.deleteApplication);
};
