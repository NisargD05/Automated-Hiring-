const createGoogleMeetPlaceholder = (assignmentId) => {
  const suffix = assignmentId.toString().slice(-10);
  return `https://meet.google.com/aih-${suffix.slice(0, 3)}-${suffix.slice(3, 6)}-${suffix.slice(6)}`;
};

module.exports = {
  createGoogleMeetPlaceholder
};
