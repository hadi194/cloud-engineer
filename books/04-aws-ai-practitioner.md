# AWS Certified AI Practitioner (AIF-C01)
### Level: Foundational | AI/ML and Generative AI on AWS

---

## Exam Facts

| | |
|---|---|
| Code | AIF-C01 |
| Questions | 85 (65 scored + 20 unscored) |
| Duration | 120 minutes |
| Pass score | 700 / 1000 |
| Cost | USD $100 |
| Validity | 3 years |
| Prerequisites | None (but Cloud Practitioner knowledge helps) |

**Who is this for:** Developers, business analysts, and managers who work with AI/ML teams and want to understand what AI services AWS offers, how to use them responsibly, and what Generative AI means in practice.

---

## The 5 Exam Domains

| Domain | Weight |
|---|---|
| 1. Fundamentals of AI and ML | 20% |
| 2. Fundamentals of Generative AI | 24% |
| 3. Applications of Foundation Models | 28% |
| 4. Guidelines for Responsible AI | 14% |
| 5. Security, Compliance, and Governance for AI | 14% |

---

## Domain 1 — Fundamentals of AI and ML (20%)

### AI vs ML vs Deep Learning vs GenAI

```
AI (Artificial Intelligence)
└── broad concept: machines that mimic human intelligence

  ML (Machine Learning)
  └── AI that learns from data without being explicitly programmed

    Deep Learning
    └── ML using neural networks with many layers
        good for: images, speech, text

      Generative AI
      └── Deep learning that CREATES new content
          (text, images, code, audio)
```

### Types of ML

```
Supervised Learning
  → learns from labelled data (input + correct answer)
  → example: email spam detection (email + label: spam/not spam)
  → used for: classification, regression

Unsupervised Learning
  → finds patterns in unlabelled data
  → example: customer segmentation (group similar customers)
  → used for: clustering, anomaly detection

Reinforcement Learning
  → agent learns by trial and error (reward/punishment)
  → example: game-playing AI, robotics
```

### Key ML Concepts

```
Training data   → data used to teach the model
Validation data → data used to tune the model during training
Test data       → data used to evaluate final model performance
Overfitting     → model memorises training data, fails on new data
Underfitting    → model is too simple, misses patterns
Feature         → an input variable (column) used to make predictions
Label           → the output/answer the model predicts
Inference       → using a trained model to make predictions
```

### AWS ML Services (Task-Specific)

| Service | What it does |
|---|---|
| Amazon Rekognition | Analyse images and video (faces, objects, text, moderation) |
| Amazon Transcribe | Speech → text (transcription) |
| Amazon Polly | Text → speech (text-to-speech) |
| Amazon Translate | Translate between languages |
| Amazon Comprehend | NLP — extract meaning from text (sentiment, entities, topics) |
| Amazon Textract | Extract text and data from documents/forms |
| Amazon Forecast | Time-series forecasting (predict future demand) |
| Amazon Personalize | Real-time personalisation (recommendations like Netflix) |
| Amazon Fraud Detector | Detect fraud in real-time |
| Amazon Lex | Build conversational chatbots (powers Alexa) |
| Amazon Kendra | Intelligent enterprise search |
| Amazon Lookout | Anomaly detection for metrics, equipment, vision |

---

## Domain 2 — Fundamentals of Generative AI (24%)

### What is Generative AI?

AI that creates new content — text, images, code, audio, video — by learning patterns from massive amounts of training data.

```
Traditional AI:   input data → prediction (yes/no, category, number)
Generative AI:    input prompt → generated content (paragraph, image, code)
```

### Foundation Models (FM) and Large Language Models (LLM)

```
Foundation Model (FM)
  → very large AI model trained on massive amounts of data
  → can be adapted for many tasks (general purpose)

Large Language Model (LLM)
  → a Foundation Model specifically for text
  → examples: Claude (Anthropic), GPT-4 (OpenAI), Llama (Meta)
  → AWS: Amazon Titan, Claude via Bedrock

How LLMs work (simplified):
  → trained to predict the next token (word/piece of word)
  → trained on internet-scale text (billions of pages)
  → emerges: reasoning, summarisation, translation, coding
```

### Key GenAI Terms

```
Prompt          → your input/instruction to the model
Token           → a chunk of text (~4 characters or 0.75 words)
Context window  → how much text the model can "see" at once
Temperature     → randomness of output (0=deterministic, 1=creative)
Hallucination   → model generates false/made-up information confidently
RAG             → Retrieval Augmented Generation (fetch real docs, add to prompt)
Fine-tuning     → further train a foundation model on your specific data
Embeddings      → numerical representation of text (used for similarity search)
Vector database → stores embeddings for semantic search
```

### Prompt Engineering Techniques

```
Zero-shot prompting:
  → ask without examples
  → "Summarise this text: ..."

Few-shot prompting:
  → give 2-3 examples first
  → "Q: What is the capital of France? A: Paris
     Q: What is the capital of Germany? A: Berlin
     Q: What is the capital of Australia? A: ?"

Chain-of-thought prompting:
  → ask model to reason step by step
  → "Think step by step: ..."

System prompt:
  → set the model's persona and behaviour
  → "You are a helpful customer service agent for Blink..."
```

---

## Domain 3 — Applications of Foundation Models (28%)

### Amazon Bedrock ← MOST IMPORTANT SERVICE FOR THIS EXAM

Amazon Bedrock is a fully managed service that gives you access to foundation models from AWS and third-party providers via a single API.

```
Available models in Bedrock:
  Amazon Titan   → AWS's own models (text, embeddings, images)
  Claude         → Anthropic (the model powering Claude Code!)
  Llama          → Meta's open-source LLM
  Mistral        → European LLM provider
  Stable Diffusion → image generation

What you can do with Bedrock:
  → Text generation (summarise, translate, answer questions)
  → Image generation
  → Build AI agents
  → Fine-tune models on your data
  → Knowledge bases (RAG) — connect to your S3/documents
```

### Bedrock Knowledge Bases (RAG pattern)

```
Your documents (S3)
        ↓
Bedrock Knowledge Base
  → chunks documents into pieces
  → converts to embeddings (vectors)
  → stores in vector database
        ↓
User asks a question
        ↓
Bedrock searches knowledge base for relevant chunks
        ↓
Chunks + question → Foundation Model
        ↓
Answer grounded in YOUR documents (not hallucinated)
```

**Why RAG matters:** LLMs were trained on old data. RAG lets them answer questions about YOUR documents and YOUR current data without retraining.

### Bedrock Agents

Agents can take actions, not just answer questions:

```
User: "Book a meeting with Alice for tomorrow at 3pm"
        ↓
Bedrock Agent
  → understands intent
  → calls calendar API (action group)
  → confirms with user
  → executes booking
```

Agents use tools/APIs you define. Like giving the LLM hands.

### Amazon SageMaker

For teams that need to build custom ML models (not use pre-built ones):

```
SageMaker covers the full ML lifecycle:
  Data preparation  → SageMaker Data Wrangler
  Training          → managed training jobs (GPU clusters)
  Evaluation        → model metrics, bias detection
  Deployment        → SageMaker Endpoints (real-time inference)
  Monitoring        → detect model drift over time
  MLOps             → SageMaker Pipelines (automate the whole flow)

When to use SageMaker vs Bedrock:
  Bedrock  → use someone else's FM, customise with your data
  SageMaker → build your own model from scratch
```

### Amazon Q

AWS's GenAI-powered assistant:

```
Amazon Q Business → enterprise chatbot over your company's documents
Amazon Q Developer → code generation and explanation (like Copilot)
Amazon Q in AWS console → ask questions about your AWS resources
```

---

## Domain 4 — Guidelines for Responsible AI (14%)

### Key Principles

```
Fairness        → AI should not discriminate based on protected attributes
                  (race, gender, age, religion)
                  Test: does the model perform equally across groups?

Explainability  → can you explain why the model made a decision?
                  Important for high-stakes decisions (loans, hiring)

Privacy         → training data should respect data privacy
                  Anonymise/mask PII before training

Robustness      → model should perform consistently, not fail on edge cases

Transparency    → disclose when users are interacting with AI
                  Watermark AI-generated content where possible

Accountability  → humans remain responsible for AI decisions
                  Don't fully automate high-stakes decisions
```

### AWS Responsible AI Tools

| Tool | Purpose |
|---|---|
| SageMaker Clarify | Detect bias in data and models, explain predictions |
| SageMaker Model Monitor | Detect data drift and quality issues in production |
| Amazon Macie | Detect PII in training data stored in S3 |
| AWS AI Service Cards | AWS publishes responsibility information for each AI service |
| Guardrails for Bedrock | Block harmful content, filter topics, apply safety policies |

### Bias in AI

```
Data bias      → training data doesn't represent all groups equally
                 Example: facial recognition trained mostly on one ethnicity

Label bias     → humans who labelled training data had their own biases

Confirmation bias → model reinforces existing patterns
                   Example: job recommendation always recommends men for senior roles
```

---

## Domain 5 — Security, Compliance & Governance for AI (14%)

### Data Security for AI

```
Training data    → store in S3 with encryption (SSE-S3 or KMS)
Model artifacts  → encrypt model files at rest and in transit
Inference data   → don't log sensitive user inputs unnecessarily
PII handling     → use Amazon Macie to detect, use Comprehend to redact
```

### Governance

```
Model versioning    → track which model version is in production
Model registry      → SageMaker Model Registry — approve models before deployment
Audit trails        → CloudTrail logs all Bedrock/SageMaker API calls
Access control      → IAM controls who can invoke which models
Content filtering   → Bedrock Guardrails block harmful inputs/outputs
```

### Compliance Considerations

- AI systems processing healthcare data must comply with HIPAA
- EU AI Act (2024) classifies AI systems by risk level
- Use Bedrock Guardrails to enforce company-specific content policies

---

## Practice Exercises

### Exercise 1 — Match the AI Service

```
Scenario                                                    Service
------------------------------------------------------------------------
a) Extract names and dates from scanned contracts           ___________
b) Transcribe customer support calls to text               ___________
c) Recommend products based on browsing history            ___________
d) Detect fraudulent transactions in real-time             ___________
e) Build a chatbot for your website                        ___________
f) Translate your app into 10 languages                    ___________
g) Use Claude to answer questions about your PDF docs      ___________
h) Detect spoiled products on an assembly line             ___________
```

**Answers:**
a) Textract, b) Transcribe, c) Personalize, d) Fraud Detector, e) Lex, f) Translate, g) Bedrock Knowledge Base (RAG), h) Rekognition / Lookout for Vision

---

### Exercise 2 — Responsible AI Scenarios

For each scenario, identify the responsible AI principle being violated:

```
a) A loan approval AI denies applications from a specific postcode
   without explaining why

b) A hiring AI was trained only on resumes from male engineers
   and now ranks male candidates higher

c) A medical diagnosis AI's decisions cannot be explained to doctors

d) An AI chatbot doesn't tell users it's not a human

e) An AI system makes final termination decisions without human review
```

**Answers:**
a) Fairness + Explainability, b) Data Bias / Fairness, c) Explainability, d) Transparency, e) Accountability

---

### Exercise 3 — GenAI Concepts

True or False:

```
a) Bedrock requires you to manage the underlying model infrastructure
b) RAG (Retrieval Augmented Generation) helps reduce hallucinations
c) Temperature=0 gives the most creative responses
d) Fine-tuning trains a foundation model on your specific data
e) Amazon Lex is used for building conversational interfaces
f) SageMaker is the best choice if you want to use Claude without customisation
g) Hallucination means the AI made a confident but incorrect statement
```

**Answers:**
a) False (Bedrock is fully managed), b) True, c) False (Temperature=0 = deterministic, not creative), d) True, e) True, f) False (use Bedrock for that), g) True

---

## Sample Exam Questions

**Q1:** A company wants to use an existing foundation model to answer questions about their internal HR policy documents. Which approach should they use?
- A) Train a new LLM from scratch on their HR documents
- B) Use Amazon Bedrock with Knowledge Bases (RAG) ✅
- C) Use Amazon Lex to build a chatbot
- D) Use Amazon Comprehend to analyse the documents

**Q2:** Which AWS service allows you to access multiple foundation models from different providers through a single API?
- A) Amazon SageMaker
- B) Amazon Bedrock ✅
- C) Amazon Rekognition
- D) Amazon Q Business

**Q3:** A data scientist notices their image classification model performs well on the training set but poorly on new images. What is this called?
- A) Underfitting
- B) High bias
- C) Overfitting ✅
- D) Hallucination

**Q4:** Which responsible AI principle requires that AI systems explain their decision-making process?
- A) Fairness
- B) Privacy
- C) Explainability ✅
- D) Robustness

**Q5:** A company's recruitment AI is rejecting qualified female candidates at a higher rate. Which tool should they use to investigate?
- A) Amazon Macie
- B) Amazon GuardDuty
- C) Amazon SageMaker Clarify ✅
- D) AWS Trusted Advisor

**Q6:** What is the purpose of Amazon Bedrock Guardrails?
- A) Protect Bedrock from DDoS attacks
- B) Filter harmful content and enforce topic restrictions on AI responses ✅
- C) Monitor costs of AI model usage
- D) Encrypt model weights at rest

**Q7:** Which technique involves providing 2-3 examples in the prompt to improve model output?
- A) Zero-shot prompting
- B) Few-shot prompting ✅
- C) Chain-of-thought prompting
- D) Fine-tuning

---

## Study Tips

1. **Bedrock is the star** — deeply understand Knowledge Bases, Agents, Guardrails, model selection
2. **Know the pre-built AI services** — Rekognition, Transcribe, Polly, Comprehend, Textract etc.
3. **Responsible AI** — fairness, explainability, privacy, transparency, accountability (memorise these)
4. **SageMaker vs Bedrock** — Bedrock for using FMs, SageMaker for building custom models
5. **Hallucination and RAG** — understand why RAG reduces hallucinations
6. **Prompt engineering basics** — zero-shot, few-shot, chain-of-thought
7. **GenAI vocabulary** — tokens, embeddings, context window, temperature, fine-tuning

**Recommended study path:**
1. Read this book
2. Try Amazon Bedrock free tier (limited free requests)
3. AWS Skill Builder: "AWS Cloud Practitioner Essentials" + "Generative AI for Executives"
4. Practice exams: Tutorials Dojo AIF-C01
