import prepareDocument from "./preprocessing/prepare-document.js";
import ingestToVector from "./preprocessing/ingest-to-vector-db.js";

(async () => {
    await prepareDocument();
    await ingestToVector();
})();