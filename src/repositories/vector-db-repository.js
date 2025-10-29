import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { ChromaClient } from "chromadb";
import logger from "../utils/logger.js";
import application from "../configs/application.js";

class VectorDBRepository {
  client = new ChromaClient({ host: application.CHROMA_HOST, port: application.CHROMA_PORT });
  embeddingFn = new DefaultEmbeddingFunction();

  async reset() {
    const collections = await this.client.listCollections();

    for (const c of collections) {
      logger.info(`Deleting collection: ${c.name}`);
      await this.client.deleteCollection({ name: c.name });
    }
  }

  async store(name, postDocs) {
    const existingCollections = await this.client.listCollections();
    const exists = existingCollections.some((c) => c.name === name);

    if (exists) {
      logger.info(`Collection "${name}" already exists — deleting first...`);
      await this.client.deleteCollection({ name });
    }

    const collection = await this.client.createCollection({
      name: name,
      embeddingFunction: this.embeddingFn,
    });

    await collection.upsert({
      ids: postDocs.map((c, i) => name + "_" + i),
      documents: postDocs.map((c) => c.pageContent),
      metadatas: postDocs.map((c) => c.metadata),
    });
  }

  async query(query, collectionName, resultLength) {
    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFn,
    });

    const results = await collection.query({
      queryTexts: [query],
      nResults: resultLength,
    });

    return results.documents.flat().join("\n");
  }

  async get(collectionName) {
    const collection = await this.client.getCollection({
      name: collectionName,
    });

    return await collection.get();
  }

  async remove(collectionName) {
    const collections = await this.client.listCollections();
    const exists = collections.some((c) => c.name === collectionName);

    if (!exists) {
      return;
    }

    await this.client.deleteCollection({ name: collectionName });
  }
}

export default new VectorDBRepository();
