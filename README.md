# 🤖 AI CV Evaluator

![Status](https://img.shields.io/badge/status-prototype-yellow)
![LLM](https://img.shields.io/badge/Powered_by-OpenAI_API-ff69b4)
![License](https://img.shields.io/badge/license-MIT-blue)

---

### 🧠 Introduction

**AI CV Evaluator** is a Node.js prototype integrating **OpenAI’s LLM APIs** to automatically process and evaluate candidate submissions.  
It parses resume content, interprets project descriptions or code samples, and produces structured feedback and scoring metrics.

This prototype demonstrates how **Large Language Models (LLMs)** and **RAG (Retrieval-Augmented Generation)** can be applied in automated recruitment — combining natural language understanding with contextual reasoning to assess candidate qualifications efficiently and consistently.

---

### ⚙️ Dependencies

- **Node.js** v20.19.5  
- **express** v5.1.0  
- **Chroma DB** v3.0.17  
- **Chroma-core/default-embed** v0.1  
- **Redis** v8  
- **OpenAI** v6.6.0  
- **onnxruntime-node** v1.23  
- **xenova/transformers** v2.17  
- **@langchain/text-splitters**  
- **@langchain/core** v1.0.2  
- **BullMQ** v5.62.0  
- **unpdf** v1.3.2  
- **better-sqlite3** v12.4.1  
- **gpt3-tokenizer** v1.1.5  

---

### 🧩 Setup & Run (All-in-One)

Run these commands step by step in your terminal to set up and start all services and please make sure to using and register api key for openrouter and set your .env base from env-example
1.  **Setup**
    ```bash
    # 1. Install dependencies
    npm install  
    # 2. Run database migrations
    npm run migrate  
    # 3. Start ChromaDB service (in a separate terminal)
    #    Keep this running while the app is active
    npx chroma run --host 0.0.0.0 --port 9000  
    # 4. Initialize ground-truth data for testing
    npm run init-ground-truth  
    # 5. Start Redis server (if not already running)
    #    For Linux/macOS
    sudo systemctl start redis-server
    #    For Windows (if installed as service)
    #    net start redis  
    # 6. Start background worker (in another terminal)
    npm run start-worker  
    # 7. Start the main server (development or production)
    npm run dev
    # or
    npm run start  
    # The API will be available at:
    # http://127.0.0.1:5000

2.  **Resource API**
    1.  `/upload`
        - request : multipart/form-data
          ```bash
          # File size must be under 5MB 
          {
              "cv_doc" : "example file.pdf",
              "project_dov" ": example file.pdf"
          }
        - response
          ```bash
          {
            "message": "Successful upload document",
            "data": {
                "id": 1
            }
          }
    2. `evaluate/:id`
       - request : application/json or raw
         ```bash
         {
            "id" : "1",
            "job_title" : "Backend Engineer"
         }
       - response
         ```bash
         {
            "message": "evaluation running successful",
            "record": {
                "id": 1,
                "status": "processing"
            }
         }

    3. `result/:id`
        - response
          ```bash
          {
            "id": 1,
            "status": "completed",
            "result": {
                "cv_match_rate": 0.72,
                "cv_feedback": "The candidate has strong technical skills in backend development and databases, but lacks direct AI/LLM experience. They have a solid track record and significant achievements in past roles, demonstrating good collaboration and communication skills.",
                "project_score": 1,
                "project_feedback": "The project submission is invalid or unrelated as it does not contain relevant backend project content.",
                "summary": "The candidate demonstrates strong technical skills in backend development and databases, with a proven track record of significant achievements and effective collaboration and communication abilities. However, they lack direct experience in AI/LLM, which may limit their ability to contribute to projects requiring such expertise. Additionally, the project submission was invalid or unrelated, indicating a potential gap in aligning with project requirements. While their technical background is solid, it is recommended to explore candidates with more relevant project experience and AI/LLM exposure for roles specifically requiring these skills."
            }
          }
---

### 🙌🏻 Conclusion
In this prototype, **RAG (Retrieval-Augmented Generation)** is used to limit the number of tokens processed per request base from context document instead of passing all the resource text to LLM.  
This helps **control hosting costs** when interacting with LLMs like OpenAI.  

You can fine-tune this limit in the **`llmService`** configuration.  
Note that **OpenRouter** can only handle up to **3,000 tokens per request**, so keeping your input concise is both efficient and necessary.  

With this setup, AI CV Evaluator strikes a balance between **smart candidate evaluation** and **cost-effective LLM usage**—all while keeping your server from crying under the weight of too many tokens. 🚀

Happy evaluating, and may your candidate scoring be ever accurate (and your token bills modest)! 😎

> **Note:**  
> If you have sufficient resources, it is recommended to use **OpenAI Embeddings : "text-embedding-3-small"** for generating vector representations.  
> The default Node.js Chroma embedding function or **all-MiniLM-L6** from Xenova may sometimes fail or produce results this things only happening in nodejs.  
> Using OpenAI Embeddings ensures more reliable semantic search results.
