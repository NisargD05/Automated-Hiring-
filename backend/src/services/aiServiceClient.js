const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const logger = require("../utils/logger");

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || "http://localhost:8001";

const extractAiError = (error, fallbackMessage) => {
  const responseData = error.response?.data;
  const message =
    responseData?.message ||
    responseData?.detail?.message ||
    responseData?.detail ||
    error.message ||
    fallbackMessage;

  const wrappedError = new Error(
    typeof message === "string" ? message : JSON.stringify(message)
  );
  wrappedError.status = error.response?.status || 502;
  wrappedError.details = responseData;
  return wrappedError;
};

const generateJobDescription = async ({ jobDetails, knowledgeContext }) => {
  const aiServiceUrl = getAiServiceUrl();
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
    const wrappedError = extractAiError(error, "AI service JD generation request failed");

    logger.error("AI service JD generation failed", {
      endpoint,
      status: error.response?.status,
      message: wrappedError.message,
      responseData: error.response?.data
    });

    throw wrappedError;
  }
};

const parseCandidateResume = async ({ filePath, originalFileName }) => {
  const endpoint = `${getAiServiceUrl()}/candidates/parse-resume`;
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: originalFileName,
    contentType: "application/pdf"
  });

  try {
    const { data } = await axios.post(endpoint, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    });
    return data;
  } catch (error) {
    const wrappedError = extractAiError(error, "AI service resume parsing request failed");
    logger.error("AI service resume parsing failed", {
      endpoint,
      status: error.response?.status,
      message: wrappedError.message,
      responseData: error.response?.data
    });
    throw wrappedError;
  }
};

const rankCandidate = async ({ candidate, resume, job }) => {
  const endpoint = `${getAiServiceUrl()}/ranking/candidate`;

  try {
    const { data } = await axios.post(
      endpoint,
      {
        candidate,
        resume,
        job
      },
      {
        timeout: 120000
      }
    );
    return data;
  } catch (error) {
    const wrappedError = extractAiError(error, "AI service candidate ranking request failed");
    logger.error("AI service candidate ranking failed", {
      endpoint,
      candidateId: candidate?._id,
      jobId: job?._id,
      status: error.response?.status,
      message: wrappedError.message,
      responseData: error.response?.data
    });
    throw wrappedError;
  }
};

module.exports = {
  generateJobDescription,
  parseCandidateResume,
  rankCandidate
};
