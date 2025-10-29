import dotenv from "dotenv";
import path from "path";

dotenv.config();

const application = {
    NAME : process.env.APP_NAME || "evaluate-application",
    ENV : process.env.NODE_ENV || "local",
    URL : process.env.APP_URL || "http://127.0.0.1",
    DATABASE : process.env.DB_PATH,
    PORT : process.env.PORT || 5050,
    OPENAI_API_KEY : process.env.OPENAI_API_KEY,
    DOCUMENT_PATH : path.join(process.cwd(), "src/assets/documents"),
    CHROMA_HOST : process.env.CHROMA_HOST || "127.0.0.1",
    CHROMA_PORT : process.env.CHROMA_PORT || 9000,
    REDIS_HOST : process.env.REDIS_HOST || "127.0.0.1",
    REDIS_PORT : process.env.REDIS_PORT || 6379,
    REDIS_USERNAME : process.env.REDIS_USERNAME,
    REDIS_PASSWORD : process.env.REDIS_PASSWORD,
}

export default application;