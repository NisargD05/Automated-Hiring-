const KnowledgeBaseChunk = require("../models/KnowledgeBaseChunk");

const tokenize = (value) => {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
};

const buildSearchQuery = (jobDetails) => {
  return [
    jobDetails.roleName,
    jobDetails.department,
    jobDetails.skills,
    jobDetails.seniorityLevel,
    jobDetails.mandatoryRequirements
  ]
    .filter(Boolean)
    .join(" ");
};

const scoreChunk = (chunkText, queryTokens) => {
  const lowerChunk = chunkText.toLowerCase();

  return queryTokens.reduce((score, token) => {
    return lowerChunk.includes(token) ? score + 1 : score;
  }, 0);
};

const retrieveRelevantKnowledge = async (jobDetails, limit = 6) => {
  const searchQuery = buildSearchQuery(jobDetails);
  const queryTokens = tokenize(searchQuery);

  if (queryTokens.length === 0) {
    return [];
  }

  const chunks = await KnowledgeBaseChunk.find({
    $text: { $search: searchQuery }
  })
    .populate("document", "originalFileName")
    .limit(30);

  return chunks
    .map((chunk) => ({
      document: chunk.document?._id,
      sourceFileName: chunk.sourceFileName,
      chunkText: chunk.text,
      score: scoreChunk(chunk.text, queryTokens)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

module.exports = {
  retrieveRelevantKnowledge
};
