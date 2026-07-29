# AWS Certified Developer — Associate (DVA-C02)
### Level: Associate | Build, deploy, and debug cloud-native applications

---

## Exam Facts

| | |
|---|---|
| Code | DVA-C02 |
| Questions | 65 (50 scored + 15 unscored) |
| Duration | 130 minutes |
| Pass score | 720 / 1000 |
| Cost | USD $150 |
| Validity | 3 years |
| Prerequisites | Cloud Practitioner + basic programming knowledge |

**Who is this for:** Software developers who build and deploy applications on AWS. More code-focused than SAA. Tests actual SDK usage, deployment strategies, and debugging.

---

## The 5 Exam Domains

| Domain | Weight |
|---|---|
| 1. Development with AWS Services | 32% |
| 2. Security | 26% |
| 3. Deployment | 24% |
| 4. Troubleshooting and Optimization | 18% |

---

## Domain 1 — Development with AWS Services (32%)

### Lambda Deep Dive ← MOST TESTED SERVICE

```
Lambda execution model:
  1. Event triggers Lambda (API Gateway, S3, SQS, EventBridge, etc.)
  2. Lambda service finds a container to run your code
  3. If no warm container: cold start (100ms-2s extra latency)
  4. Container stays warm for ~15 minutes after last invocation
  5. Your function runs, returns result

Key limits:
  Max execution time: 15 minutes
  Max memory:         10,240 MB
  Max deployment package: 50MB (zipped), 250MB (unzipped)
  Concurrent executions: 1,000 default (can increase)
  /tmp storage:       512MB - 10GB

Lambda environment variables:
  → store config values (DB URLs, feature flags)
  → encrypt with KMS for sensitive values
  → access in code: process.env.MY_VAR (Node.js), os.environ['MY_VAR'] (Python)

Lambda layers:
  → shared code/libraries packaged separately
  → reuse across multiple Lambda functions
  → max 5 layers per function

Lambda destinations:
  → on success: send result to SQS/SNS/EventBridge/Lambda
  → on failure: send to DLQ (Dead Letter Queue) for retry
```

**Lambda invocation types:**
```
Synchronous  → caller waits for result (API Gateway, ALB)
Asynchronous → caller doesn't wait (S3 events, SNS) — events queued
Poll-based   → Lambda polls the source (SQS, Kinesis, DynamoDB Streams)
```

### API Gateway

```
Types:
  REST API        → full-featured, regional/edge/private
  HTTP API        → simpler, faster, cheaper — use for most cases
  WebSocket API   → bidirectional real-time communication

Integration types:
  Lambda Proxy    → API Gateway passes raw request to Lambda
  Lambda Custom   → API Gateway transforms request before Lambda
  HTTP            → proxy to any HTTP endpoint
  Mock            → return a fixed response (testing)
  AWS Service     → call AWS services directly (SQS, DynamoDB)

Key features:
  Throttling      → rate limit per client (prevent abuse)
  API Keys        → identify callers, apply usage plans
  Authorizers     → Cognito User Pools or Lambda authorizer (custom auth)
  Caching         → cache responses up to 1 hour (TTL configurable)
  Stages          → dev/staging/prod with separate settings
  CORS            → must configure for browser access
```

### DynamoDB Deep Dive

```
Table design:
  Partition key (PK) → determines which partition stores the item
                       must be unique if no sort key
  Sort key (SK)      → optional, allows multiple items per PK
                       PK + SK together must be unique

  Good PK: high cardinality (many unique values), even distribution
  Bad PK: low cardinality (e.g. gender: M/F) → hot partition problem

Access patterns:
  GetItem     → single item by PK (+ SK if exists)
  Query       → all items with same PK, filter by SK
  Scan        → reads ENTIRE table (avoid in production — expensive)
  BatchGetItem → up to 100 items in one request
  TransactWrite → atomic write across multiple items

Secondary indexes:
  GSI (Global Secondary Index)  → different PK and SK, eventual consistency
  LSI (Local Secondary Index)   → same PK, different SK, strong consistency

Read consistency:
  Eventually consistent → reads may return slightly stale data (default)
  Strongly consistent   → always latest data (2x read cost)

DynamoDB Streams:
  → captures item-level changes (INSERT, MODIFY, REMOVE)
  → triggers Lambda for real-time processing
  → retained for 24 hours
```

### SQS — Simple Queue Service

```
Queue types:
  Standard → at-least-once delivery, best-effort ordering, nearly unlimited TPS
  FIFO     → exactly-once delivery, strict ordering, 300 TPS (3000 with batching)

Key concepts:
  Message retention:    1 minute – 14 days (default: 4 days)
  Visibility timeout:   time a consumer has to process before message reappears
                        (default 30s, set to at least 6x your Lambda timeout)
  Long polling:         wait up to 20s for messages (reduces empty responses/cost)
  Dead Letter Queue:    after maxReceiveCount failures → send to DLQ
  Message size:         up to 256KB

Lambda + SQS:
  Lambda polls SQS automatically (event source mapping)
  Batch size: 1-10,000 messages per batch
  On partial failure: failed messages stay in queue, successful ones deleted
```

### Kinesis — Real-Time Data Streaming

```
Kinesis Data Streams:
  → ingest real-time data from many producers
  → shards: unit of capacity (1MB/s write, 2MB/s read per shard)
  → retention: 24h (default) to 365 days
  → ordered within a shard, guaranteed delivery
  → use for: real-time analytics, clickstreams, log aggregation

Kinesis Firehose:
  → simpler, no shards to manage
  → buffers and delivers to S3/Redshift/OpenSearch automatically
  → no replay, near-real-time (60s minimum buffer)
  → use for: ETL pipeline, loading data into S3/Redshift

Kinesis vs SQS:
  SQS     → decoupling, async communication, at-least-once, no replay
  Kinesis → real-time processing, ordered within shard, replay up to 365 days
```

### S3 Advanced for Developers

```
Event notifications:
  → trigger Lambda, SQS, SNS when objects are created/deleted
  → configure which prefixes/suffixes to watch

Presigned URLs:
  → allow temporary access to private objects without sharing credentials
  → generated by your backend, given to client
  → client uploads/downloads directly to S3 (no backend proxy)
  → expiry: set at generation time

S3 Multipart Upload:
  → recommended for files > 100MB
  → parallel upload of parts
  → automatic via SDK for files > 5GB

S3 Select:
  → SQL to query inside a CSV/JSON/Parquet object
  → retrieve only the rows/columns you need
  → cheaper than downloading the whole file

CORS:
  → must configure on S3 if browser uploads directly to S3
  → AllowedOrigins, AllowedMethods, AllowedHeaders
```

---

## Domain 2 — Security (26%)

### Cognito — User Authentication

```
User Pools:
  → user directory for your app
  → sign-up, sign-in, password reset
  → returns JWT tokens (access, id, refresh)
  → integrates with API Gateway as an authorizer
  → supports social login (Google, Facebook) and SAML

Identity Pools (Federated Identities):
  → exchange any token for temporary AWS credentials
  → lets users access AWS services directly (S3, DynamoDB)
  → use case: mobile app that uploads directly to S3

Flow:
  User logs in → User Pool → JWT token
  JWT token → Identity Pool → IAM role → temporary AWS credentials
```

### Authentication Patterns

```
API Gateway Authorizers:
  1. Cognito Authorizer → validate Cognito JWT automatically
  2. Lambda Authorizer  → custom validation (check your own DB, third-party auth)
     → returns IAM policy: ALLOW or DENY
     → result cached for up to 5 minutes

Secrets Manager vs Parameter Store:
  Secrets Manager   → built for credentials, auto-rotation, $0.40/secret/month
  Parameter Store   → config + secrets, free tier (Standard tier), no auto-rotation
  Use Secrets Manager for DB passwords and API keys
  Use Parameter Store for config values that don't need rotation
```

### Encryption in SDK

```
Envelope Encryption (how AWS does it):
  1. KMS generates a Data Encryption Key (DEK)
  2. DEK encrypts your data locally (fast)
  3. KMS encrypts the DEK (KMS key never leaves KMS)
  4. Store encrypted data + encrypted DEK together

Why not encrypt everything with KMS directly?
  → KMS has a 4KB limit per API call
  → Large files need envelope encryption
  → Local encryption is faster than KMS API calls

SSM Parameter Store integration:
  aws ssm get-parameter --name /myapp/db-password --with-decryption
  → returns decrypted value, KMS handles decryption automatically
```

---

## Domain 3 — Deployment (24%)

### Elastic Beanstalk

PaaS — upload your code, Beanstalk handles the rest (EC2, ALB, Auto Scaling, RDS).

```
Supported platforms: Node.js, Python, Go, Java, .NET, PHP, Ruby, Docker

Deployment policies:
  All at once    → fastest, causes downtime (dev only)
  Rolling        → update in batches, reduced capacity during update
  Rolling + batch → add extra instances first, then roll, no capacity loss
  Immutable      → new ASG, all new instances, swap if healthy (safest)
  Blue/Green     → new environment, swap CNAMEs (instant rollback)

.ebextensions:
  → configure Beanstalk environment via YAML files in .ebextensions/ folder
  → install packages, create files, run commands during deployment
```

### CodeDeploy

Deploy to EC2, Lambda, ECS without manual steps.

```
Deployment strategies:
  EC2/On-premise:
    In-place         → stop app, deploy, restart (downtime)
    Blue/Green       → new instances, switch traffic, terminate old

  Lambda:
    AllAtOnce        → immediate switch (risky)
    Linear           → shift X% every N minutes (e.g. 10% every minute)
    Canary           → shift X% immediately, then rest after N minutes

  ECS:
    Blue/Green       → new task set, gradual traffic shift

AppSpec.yml → defines deployment hooks (lifecycle events):
  BeforeInstall / AfterInstall / BeforeAllowTraffic / AfterAllowTraffic
```

### CodePipeline + CodeBuild

```
Pipeline stages:
  Source  → CodeCommit / GitHub / S3
  Build   → CodeBuild (run tests, build Docker image)
  Test    → run integration tests
  Deploy  → CodeDeploy / Beanstalk / ECS / CloudFormation

buildspec.yml (CodeBuild):
  version: 0.2
  phases:
    install:
      commands: [npm install]
    build:
      commands: [npm test, npm run build]
    post_build:
      commands: [docker build, docker push]
  artifacts:
    files: [dist/**]
```

### CloudFormation

```
Template structure:
  AWSTemplateFormatVersion: "2010-09-09"
  Parameters:     → input values
  Mappings:       → static lookup tables
  Conditions:     → conditional resource creation
  Resources:      → the actual AWS resources (required)
  Outputs:        → values to export

Key concepts:
  Stack         → a deployed set of resources from one template
  ChangeSet     → preview changes before applying
  Stack Drift   → detect manual changes outside CloudFormation
  Nested Stacks → reference other stacks (modularity)
  Cross-stack ref → export/import values between stacks
  DeletionPolicy → retain/snapshot/delete resource when stack deleted

Rollback:
  → if any resource creation fails, entire stack rolls back
  → use --disable-rollback flag for debugging (leaves failed resources)
```

### SAM — Serverless Application Model

```
Extension of CloudFormation for serverless:
  AWS::Serverless::Function  → Lambda function
  AWS::Serverless::Api       → API Gateway
  AWS::Serverless::Table     → DynamoDB table

sam build   → builds deployment package
sam local invoke → test Lambda locally
sam local start-api → test API Gateway + Lambda locally
sam deploy  → deploys via CloudFormation
```

---

## Domain 4 — Troubleshooting and Optimization (18%)

### CloudWatch for Developers

```
Metrics:
  → EC2: CPUUtilization, NetworkIn, NetworkOut, DiskRead/Write
  → Lambda: Invocations, Duration, Errors, Throttles, ConcurrentExecutions
  → API Gateway: Count, 4XXError, 5XXError, Latency
  → Custom metrics: push from your code via SDK

Logs:
  → Lambda automatically logs to CloudWatch Logs
  → EC2: install CloudWatch Agent to push OS/app logs
  → Log groups: one per application component
  → Log streams: one per Lambda container or EC2 instance
  → Metric filters: create metrics from log patterns (e.g. count ERROR lines)

Alarms:
  → trigger on metric threshold
  → notify via SNS, trigger Auto Scaling, trigger Systems Manager

X-Ray:
  → trace requests across Lambda, API Gateway, DynamoDB, etc.
  → add @xray_recorder decorator to Lambda functions (Python)
  → or use AWS X-Ray SDK in your code
  → sampling: don't trace every request (configurable)
  → Service Map: visual diagram of your architecture
```

### Lambda Optimization

```
Cold start reduction:
  → Provisioned Concurrency: pre-warm N containers
  → Lambda SnapStart (Java): snapshot initialized state
  → Minimize deployment package size (smaller = faster cold start)
  → Avoid global DB connections in handler body (put in init code)

Memory vs CPU:
  → Lambda CPU is proportional to memory
  → More memory = more CPU = faster execution = potentially cheaper
  → Use Lambda Power Tuning to find optimal memory

Timeout:
  → set to at least 3x your average execution time
  → if Lambda times out: function killed, no response to API Gateway
```

### Common Developer Mistakes

```
Mistake 1: Using Scan on DynamoDB
  → Scan reads EVERY item, very expensive at scale
  → Fix: redesign table to support Query access pattern

Mistake 2: Lambda timeout shorter than SQS visibility timeout
  → Lambda times out, message becomes visible again, processed again
  → Fix: SQS visibility timeout = 6x Lambda timeout

Mistake 3: Not handling partial batch failures in SQS + Lambda
  → if one message in a batch fails, entire batch reprocessed
  → Fix: enable ReportBatchItemFailures in Lambda

Mistake 4: Synchronous Lambda invocations for heavy processing
  → API Gateway times out at 29 seconds
  → Fix: use async invocation + polling pattern for long jobs

Mistake 5: Forgetting CORS on API Gateway
  → browser gets CORS error even though backend works
  → Fix: enable CORS on API Gateway + Lambda must return CORS headers
```

---

## Practice Exercises

### Exercise 1 — Lambda Architecture Design

Design a serverless image processing pipeline:
- User uploads image to S3
- System automatically resizes to 3 sizes (thumbnail, medium, large)
- Store resized images back to S3
- Notify user via email when done

**Answer:**
```
User → S3 upload (bucket: originals)
  ↓ S3 Event (ObjectCreated)
SQS Queue (buffer + retry handling)
  ↓ Event Source Mapping
Lambda (image processor)
  → download from S3 originals
  → resize to 3 sizes (use Pillow/Sharp layer)
  → upload to S3 (bucket: resized)
  ↓
SNS → send email to user
```

---

### Exercise 2 — Debug This Lambda

```python
import boto3
import json

def handler(event, context):
    db = boto3.resource('dynamodb')  # BAD: creates new connection every invocation
    table = db.Table('users')

    user_id = event['queryStringParameters']['id']  # BAD: no null check
    response = table.scan(  # BAD: scan is expensive
        FilterExpression='id = :id',
        ExpressionAttributeValues={':id': user_id}
    )
    return response['Items'][0]  # BAD: no error handling, KeyError if empty
```

**Issues:**
1. `boto3.resource` inside handler = new connection per invocation → move to module level
2. No null check on `event['queryStringParameters']` → KeyError if no query params
3. `scan` with filter → use `get_item` or `query` instead
4. No error handling if item not found → IndexError

**Fixed:**
```python
import boto3
import json

# Initialize outside handler = reused across warm invocations
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('users')

def handler(event, context):
    params = event.get('queryStringParameters') or {}
    user_id = params.get('id')
    if not user_id:
        return {'statusCode': 400, 'body': json.dumps({'error': 'id required'})}

    response = table.get_item(Key={'id': user_id})
    item = response.get('Item')
    if not item:
        return {'statusCode': 404, 'body': json.dumps({'error': 'not found'})}

    return {'statusCode': 200, 'body': json.dumps(item)}
```

---

## Sample Exam Questions

**Q1:** A Lambda function is failing because it exceeds the database connection limit. The function is triggered by API Gateway and handles thousands of concurrent requests. What is the best solution?
- A) Increase the RDS instance size
- B) Add a Read Replica
- C) Use RDS Proxy to pool connections ✅
- D) Increase Lambda concurrency limit

**Q2:** A developer needs to store a database password that automatically rotates every 30 days. Which service should they use?
- A) AWS Systems Manager Parameter Store
- B) AWS Secrets Manager ✅
- C) AWS KMS
- D) AWS IAM

**Q3:** An SQS queue has a visibility timeout of 30 seconds. A Lambda function takes 45 seconds to process one message. What will happen?
- A) Lambda will be terminated after 30 seconds
- B) The message will be processed successfully
- C) The message will become visible and be processed again while Lambda is still processing it ✅
- D) The message will be sent to the DLQ

**Q4:** A developer wants to test a Lambda function locally before deploying. Which tool should they use?
- A) AWS CloudShell
- B) AWS SAM CLI ✅
- C) AWS CodeBuild
- D) AWS Cloud9

**Q5:** An application needs to fan out a message to 5 different SQS queues simultaneously. What is the best architecture?
- A) Write to each SQS queue from the application code
- B) Use SQS FIFO queues with message groups
- C) Use SNS to publish and SQS queues as subscribers ✅
- D) Use EventBridge with SQS targets

---

## Study Tips

1. **Lambda is 30%+ of the exam** — master cold starts, concurrency, timeouts, layers, destinations
2. **DynamoDB access patterns** — GetItem vs Query vs Scan, when to use GSI/LSI
3. **SQS + Lambda integration** — visibility timeout = 6x Lambda timeout, DLQ, batch failures
4. **Know the deployment strategies** — CodeDeploy Linear/Canary, Beanstalk Rolling/Blue-Green
5. **X-Ray** — how to add tracing, what the service map shows
6. **CloudFormation basics** — stack, template structure, change sets
7. **Security** — Cognito User Pools vs Identity Pools, Lambda authorizers, encryption
