const verifyToken = require("../middlewares/verifyToken");
const pipelineHandler = require("../modules/candidate_pipeline/handlers/api_handler");

module.exports = (server) => {
  // Stages (scoped per job post)
  server.get(
    "/api/v1/job-posts/:id/stages",
    verifyToken,
    pipelineHandler.getStages,
  );
  server.post(
    "/api/v1/job-posts/:id/stages",
    verifyToken,
    pipelineHandler.createStage,
  );
  server.put(
    "/api/v1/job-posts/:id/stages/reorder",
    verifyToken,
    pipelineHandler.reorderStages,
  );
  server.put(
    "/api/v1/job-posts/:id/stages/:stageId",
    verifyToken,
    pipelineHandler.updateStage,
  );
  server.delete(
    "/api/v1/job-posts/:id/stages/:stageId",
    verifyToken,
    pipelineHandler.deleteStage,
  );

  // Recruiter pipeline overview
  server.get(
    "/api/v1/recruiter/pipeline/candidates",
    verifyToken,
    pipelineHandler.getPipelineCandidates,
  );
  server.get(
    "/api/v1/recruiter/pipeline/analytics",
    verifyToken,
    pipelineHandler.getPipelineAnalytics,
  );

  // Application timeline
  server.get(
    "/api/v1/job-applications/:id/timeline",
    verifyToken,
    pipelineHandler.getApplicationTimeline,
  );
};
