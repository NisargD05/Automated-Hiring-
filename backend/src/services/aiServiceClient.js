const axios = require("axios");
const logger = require("../utils/logger");

const generateJobDescription = async ({ jobDetails, knowledgeContext }) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
  const endpoint = `${aiServiceUrl}/generate-jd`;

  logger.info("Requesting JD generation from AI service", {
    endpoint,
    roleName: jobDetails.roleName,
    knowledgeContextCount: knowledgeContext.length
  });

  try {
    const { data } = await axios.post(
      endpoint,
      {
        jobDetails,
        knowledgeContext
      },
      {
        timeout: 120000
      }
    );

    logger.info("AI service returned generated JD", {
      roleName: jobDetails.roleName,
      agentStepCount: data.agentSteps?.length || 0
    });

    return data;
  } catch (error) {
    const responseData = error.response?.data;
    const message =
      responseData?.message ||
      responseData?.detail?.message ||
      responseData?.detail ||
      error.message ||
      "AI service JD generation request failed";

    logger.error("AI service JD generation failed", {
      endpoint,
      status: error.response?.status,
      message,
      responseData
    });

    const wrappedError = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
    wrappedError.status = error.response?.status || 502;
    wrappedError.details = responseData;
    throw wrappedError;
  }
};

module.exports = {
  generateJobDescription
};
