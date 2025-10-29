import logger from "../utils/logger.js";
import status from "../utils/status.js";

export const notFound = (req, res, next) => {
  logger.error("Request not found");
  res.status(status.HTTP_NOT_FOUND).json({ error: "Not Found" });
};

export const badRequest = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === status.HTTP_BAD_REQUEST && "body" in err) {
    logger.error("Bad request from client");
    return res.status(status.HTTP_BAD_REQUEST).json({ error: "Bad Request" });
  }
  logger.error("Bad request from client");
  res.status(status.HTTP_BAD_REQUEST).json({ error: "Bad Request" });
};
