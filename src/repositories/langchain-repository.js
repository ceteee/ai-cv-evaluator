import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { cleanserPhaseTwo } from "../utils/cleanser.js";

class langchainRepository {
  splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 150,
  });

  async chunk(collections) {
    const chunks = await this.splitter.splitDocuments(
      collections.map((doc) => ({
        pageContent: cleanserPhaseTwo(doc.content),
        metadata: { title: doc.title, section: doc.section },
      }))
    );
    const cleanedChunks = chunks.map(({ pageContent, metadata }) => ({
      pageContent,
      metadata: Object.fromEntries(
        Object.entries(metadata).filter(([key]) => key !== "loc")
      ),
    }));

    return cleanedChunks;
  }
}

export default new langchainRepository();
