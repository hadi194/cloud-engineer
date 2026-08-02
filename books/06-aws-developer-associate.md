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

## Step Functions — Workflow Orchestration

Step Functions lets you coordinate multiple Lambda functions (or AWS services) into visual state machines. Instead of writing complex retry and error-handling logic inside one large Lambda, you define each step declaratively.

```
Workflow types:
  Standard Workflow
    → Max duration: 1 year
    → Execution model: exactly-once
    → Billing: per state transition
    → Auditable: full execution history in console
    → Use for: order processing, human approval flows, data pipelines

  Express Workflow
    → Max duration: 5 minutes
    → Execution model: at-least-once (not idempotent)
    → Billing: per execution duration + transitions (cheaper for high volume)
    → Use for: high-volume, short-duration workflows (IoT events, streaming)

State types:
  Task      → do something (call Lambda, call API, run ECS task)
  Wait      → pause for N seconds or until a timestamp
  Choice    → branch logic (if order.total > 100 → apply discount)
  Parallel  → run multiple branches simultaneously, wait for all
  Map       → process each item in an array (like forEach)
  Pass      → pass input to output with optional transformation (no action)
  Fail      → end the execution as failed
  Succeed   → end the execution as succeeded
```

**Error handling in Step Functions:**
```json
{
  "Retry": [
    {
      "ErrorEquals": ["Lambda.ServiceException", "Lambda.TooManyRequestsException"],
      "IntervalSeconds": 2,
      "MaxAttempts": 3,
      "BackoffRate": 2
    }
  ],
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "Next": "NotifyFailure"
    }
  ]
}
```

**Exam scenarios:**
- "Coordinate multiple Lambda functions with retry logic" → Step Functions
- "Process a list of 1000 items in parallel in a workflow" → Map state in Step Functions
- "Wait for human approval before next step" → Step Functions + API Gateway + Task Token

---

## EventBridge — The Event Router

EventBridge is a serverless event bus. Where SNS is about broadcasting to subscribers, EventBridge is about intelligent routing — you define rules that filter events and send them to specific targets.

```
Concepts:
  Event Bus     → receives events
    Default bus: all AWS service events land here automatically
    Custom bus:  your application sends custom events
    Partner bus: SaaS events (Zendesk, PagerDuty, Datadog)

  Event         → JSON document describing what happened
    {
      "source": "myapp.orders",
      "detail-type": "OrderPlaced",
      "detail": {
        "orderId": "123",
        "total": 49.99,
        "status": "new"
      }
    }

  Rule          → pattern match → target
    Pattern: match on source, detail-type, or any field in detail
    Example: "if detail.status = 'failed' → invoke ErrorHandler Lambda"

  Target        → what receives the event (up to 5 per rule)
    Lambda, SQS, SNS, Step Functions, ECS Task, API Gateway, etc.

  Scheduled Rules → cron or rate expression (serverless cron jobs)
    "rate(5 minutes)"    → every 5 minutes
    "cron(0 9 * * ? *)"  → every day at 9am UTC
```

**EventBridge vs SNS vs SQS:**
```
EventBridge: smart routing, filter by content, many sources
SNS: broadcast to many subscribers simultaneously
SQS: reliable queue, consumer works at its own pace

Typical pattern: EventBridge rule → SNS → multiple SQS queues (fan-out)
```

**EventBridge Pipes:**
```
Connect a source to a target with optional:
  Filter → only pass events matching a pattern
  Enrichment → call Lambda/API to enrich data before target
  Transform → modify event shape before target

Source → (filter) → (enrich) → (transform) → Target

Good for: streaming DynamoDB Streams → enriched events → SQS
```

---

## ElastiCache — In-Memory Caching

ElastiCache provides managed Redis or Memcached. Use it to reduce latency and database load for frequently accessed data.

### Redis vs Memcached

```
Redis
  → Persistent (can recover from restart with snapshots or AOF)
  → Data structures: strings, lists, sets, sorted sets, hashes, streams
  → Pub/Sub messaging
  → Multi-AZ with automatic failover
  → Read replicas (up to 5)
  → Supports Lua scripting
  → Best for: session store, leaderboards, rate limiting, pub/sub, distributed locks

Memcached
  → No persistence (data lost on restart)
  → Simple key-value only
  → Multi-threaded (can use all CPU cores)
  → No replication, no failover
  → Best for: pure object caching, horizontal scaling across nodes
```

### Caching Strategies

```
Lazy Loading (Cache-Aside)
  1. Application checks cache for key
  2. Cache HIT: return cached value (fast)
  3. Cache MISS: query database → write to cache → return value

  Pros:
    Only cache data that's actually requested
    Cache failure doesn't break the app (falls back to DB)
  Cons:
    First request after miss is slow (3 trips: cache + DB + cache write)
    Data can be stale if DB updated without cache update

Write-Through
  1. Application writes to database
  2. Immediately write the same data to cache

  Pros:
    Cache always has fresh data
    No stale reads
  Cons:
    Every write hits cache (even for data never read)
    Cache filled with data that may never be requested
    Write penalty (two writes per operation)

TTL (Time to Live)
  → Set expiry on cached items
  → Balance: too short = many cache misses; too long = stale data
  → Use with lazy loading to control staleness

Session Store pattern (common exam scenario):
  → User logs in → store session in Redis (TTL = 30 minutes)
  → Subsequent requests: check Redis → no DB hit
  → Any server in the fleet can serve any user (stateless app servers)
  → Scale horizontally without sticky sessions
```

### ElastiCache Cluster Modes (Redis)

```
Cluster Mode Disabled
  → One shard (primary + up to 5 read replicas)
  → All data on one node
  → Scale up: larger instance type
  → Use for: smaller datasets, simple key-value

Cluster Mode Enabled
  → Multiple shards, data partitioned across shards
  → Each shard has replicas
  → Scale out: add more shards
  → Use for: large datasets, high throughput requirements
```

---

## DynamoDB Advanced

### Capacity Modes

```
Provisioned Mode
  → You set Read Capacity Units (RCUs) and Write Capacity Units (WCUs)
  → You can enable Auto Scaling to adjust automatically
  → Use when: traffic is predictable and steady

On-Demand Mode
  → Pay per request, no capacity planning
  → Scales instantly with traffic
  → More expensive per request than provisioned
  → Use when: traffic is unpredictable or new table with unknown traffic

Read Capacity Unit (RCU):
  1 RCU = 1 strongly consistent read of up to 4KB per second
        = 2 eventually consistent reads of up to 4KB per second

Write Capacity Unit (WCU):
  1 WCU = 1 write of up to 1KB per second
```

### DAX — DynamoDB Accelerator

```
→ In-memory cache purpose-built for DynamoDB
→ Read latency: microseconds (vs milliseconds without DAX)
→ Write-through: writes go DAX → DynamoDB (cache always consistent)
→ No code changes needed: use DAX endpoint instead of DynamoDB endpoint
→ Within VPC only

When to use DAX:
  ✅ Read-heavy workloads with same items accessed repeatedly
  ✅ Need microsecond read latency
  ✅ Don't want to change application caching logic

When NOT to use DAX:
  ✗ Write-heavy workloads (DAX doesn't help writes)
  ✗ Strongly consistent reads required (DAX returns cached values)
  ✗ Large objects (DAX optimized for frequently repeated small reads)

DAX vs ElastiCache for DynamoDB:
  DAX: specifically for DynamoDB, no code changes, write-through
  ElastiCache: works with anything, more caching strategies, more code work
```

### DynamoDB Global Tables

```
→ Multi-region, multi-active replication
→ Any region can handle reads AND writes
→ Replication is asynchronous
→ Conflict resolution: last-writer-wins (based on timestamp)
→ Use for:
  - Global applications needing low latency in multiple regions
  - Disaster recovery (RPO near zero, RTO near zero)
  - Data sovereignty (same data accessible in multiple regions)
```

### DynamoDB Streams + TTL

```
Streams:
  → Ordered log of all item-level changes (INSERT, MODIFY, REMOVE)
  → Retained for 24 hours
  → Trigger Lambda for real-time processing
  → Use for: replication, analytics, notifications on changes

TTL (Time to Live):
  → Add an attribute with a Unix epoch timestamp
  → DynamoDB automatically deletes items past that timestamp
  → Deletion happens within 48 hours (not guaranteed exact time)
  → Deleted items appear in Streams (useful for archiving before deletion)
  → No WCU cost for TTL deletions
  → Use for: session expiry, temporary data, rate limiting records
```

### DynamoDB Design Patterns

```
Single-table design:
  → Put all related entities in one table
  → Use PK + SK combinations to represent different entity types
  → Example:
    PK=USER#123, SK=PROFILE → user profile
    PK=USER#123, SK=ORDER#456 → order for that user
    PK=ORDER#456, SK=ITEM#789 → item in that order
  → Query PK=USER#123 → get all data for user 123

Adjacency list pattern:
  → Model many-to-many relationships
  → Both entities are rows; relationships are also rows
  → Use GSIs to query from either direction

Hot partition problem:
  → High-traffic PK → all requests → single partition → throttling
  → Fix: add random suffix to PK (shard the partition)
  → PK = "USER" + random_number(1..10)
  → Query all 10 shards and merge results
```

---

## Lambda Concurrency — Deep Dive

```
Concurrency = number of requests being handled simultaneously

Account default limit: 1,000 concurrent executions per region
  → shared across ALL Lambda functions in the account
  → can be increased by AWS Support request

Reserved Concurrency
  → Guarantees N concurrent executions for a specific function
  → Also CAPS max concurrency for that function
  → Use for: protect downstream resources (e.g. keep DB connections manageable)
  → Side effect: if N = 0 → function is throttled (useful for disabling)

Provisioned Concurrency
  → Pre-warms N containers BEFORE traffic arrives
  → Eliminates cold starts for those N containers
  → You pay for provisioned capacity whether used or not
  → Can be scheduled: pre-warm before 9am, scale down at 6pm
  → Use for: latency-sensitive APIs, user-facing endpoints

What happens when throttled?
  Synchronous (API Gateway): returns 429 error to caller
  Asynchronous (S3 events, SNS): Lambda retries for up to 6 hours
  Poll-based (SQS): messages stay in queue until processed

Cold start anatomy:
  1. Lambda service receives invocation
  2. Find or create a container (cold = create new, ~100ms-2s)
  3. Download deployment package into container
  4. Run initialization code (outside handler function)
  5. Run handler function
  ← warm invocations skip steps 2-4

Reducing cold starts:
  → Provisioned Concurrency (eliminate them entirely)
  → Lambda SnapStart for Java (snapshot after init, restore from snapshot)
  → Keep deployment package small (less to download)
  → Move initialization code outside handler (runs once per container)
  → Use ARM/Graviton2 (faster cold start for compiled languages)
```

---

## Lambda in VPC

```
Default behavior:
  → Lambda runs in AWS-managed VPC
  → Has internet access, cannot reach your private VPC resources

Lambda in your VPC:
  → Lambda creates an ENI (Elastic Network Interface) in your subnet
  → Can now reach private resources (RDS, ElastiCache, internal services)
  → Loses internet access (your private subnet has no internet gateway)

Giving Lambda internet access from VPC:
  Private subnet → NAT Gateway (in public subnet) → Internet Gateway → Internet
  Cost: NAT Gateway charges per GB

Better approach — VPC Endpoints:
  → Create interface endpoints for S3, DynamoDB, Secrets Manager, etc.
  → Traffic stays on AWS private network (no internet/NAT needed)
  → Faster, cheaper, more secure

When to put Lambda in VPC:
  ✅ Lambda needs RDS (always in VPC)
  ✅ Lambda needs ElastiCache (always in VPC)
  ✅ Lambda needs to call internal microservices (private ALB)
  ✗ Lambda only calls S3, DynamoDB → use VPC endpoints instead
  ✗ Lambda only calls public APIs → don't put in VPC (adds latency)

Cold start note:
  → Old problem: Lambda in VPC had slow cold starts (ENI creation took seconds)
  → Modern solution: AWS Hyperplane pre-allocates ENIs → cold starts similar to non-VPC
```

---

## X-Ray — Distributed Tracing

```
X-Ray traces requests as they flow through your application:
  API Gateway → Lambda → DynamoDB → SNS → Lambda

Concepts:
  Trace     → entire end-to-end request journey
  Segment   → one service's contribution to the trace
  Subsegment → within a segment (e.g., specific DynamoDB call)
  Annotation → key-value pairs indexed for filtering (use for searching)
  Metadata  → key-value pairs NOT indexed (use for debugging details)
  Service Map → visual graph of your architecture with health data

Enabling X-Ray:
  Lambda: enable "Active Tracing" in configuration (no code changes)
  EC2: install X-Ray daemon on the instance
  ECS: run X-Ray daemon as a sidecar container
  API Gateway: enable tracing in stage settings
  SDK: import and use X-Ray SDK in your code for custom segments

Sampling:
  → X-Ray doesn't trace 100% of requests (would be expensive)
  → Default: 1 request/second + 5% of additional requests
  → Custom rules: trace 10% of /checkout requests, 1% of /healthcheck
```

---

## AppSync — GraphQL APIs

```
→ Managed GraphQL service
→ Real-time data with WebSocket subscriptions
→ Offline capability for mobile apps
→ Resolvers connect to: DynamoDB, Lambda, RDS, HTTP endpoints

Use cases:
  → Real-time collaborative apps (shared document editing)
  → Mobile apps that work offline and sync when reconnected
  → Aggregate data from multiple data sources in one query

GraphQL vs REST API Gateway:
  REST: separate endpoints per resource (/users, /orders, /products)
  GraphQL: single endpoint, client specifies exactly what data it needs
  → eliminates over-fetching and under-fetching
```

---

## More Code Examples

### Pattern: SQS → Lambda with Partial Batch Failure

```python
import json

def handler(event, context):
    successful_messages = []
    failed_messages = []

    for record in event['Records']:
        try:
            body = json.loads(record['body'])
            process_message(body)
            successful_messages.append(record['messageId'])
        except Exception as e:
            print(f"Failed to process {record['messageId']}: {e}")
            failed_messages.append({'itemIdentifier': record['messageId']})

    # Return failed message IDs — only these will be retried
    # Successful messages are automatically deleted from the queue
    return {'batchItemFailures': failed_messages}

def process_message(body):
    # your business logic here
    pass
```

*This requires `ReportBatchItemFailures` enabled on the Lambda event source mapping. Without it, if ANY message fails, the entire batch is retried (including already-processed messages).*

---

### Pattern: Lambda Authorizer

```python
import json

def handler(event, context):
    token = event.get('authorizationToken', '')
    method_arn = event['methodArn']

    # Custom validation logic
    if validate_token(token):
        user_id = extract_user_id(token)
        return generate_policy(user_id, 'Allow', method_arn)
    else:
        return generate_policy('user', 'Deny', method_arn)

def generate_policy(principal_id, effect, resource):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }]
        },
        'context': {
            'userId': principal_id  # passed to Lambda as $context.authorizer.userId
        }
    }
```

---

### Pattern: DynamoDB Single-Table Query

```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MyTable')

# Get all orders for a user
def get_user_orders(user_id):
    response = table.query(
        KeyConditionExpression=Key('PK').eq(f'USER#{user_id}') &
                               Key('SK').begins_with('ORDER#'),
        ScanIndexForward=False  # descending (newest first)
    )
    return response['Items']

# Get a specific order
def get_order(order_id):
    response = table.get_item(
        Key={
            'PK': f'ORDER#{order_id}',
            'SK': f'ORDER#{order_id}'
        }
    )
    return response.get('Item')

# Transactional write (create order + decrement inventory atomically)
def place_order(order, product_id, quantity):
    table.meta.client.transact_write(
        TransactItems=[
            {
                'Put': {
                    'TableName': 'MyTable',
                    'Item': order,
                    'ConditionExpression': 'attribute_not_exists(PK)'
                }
            },
            {
                'Update': {
                    'TableName': 'MyTable',
                    'Key': {'PK': f'PRODUCT#{product_id}', 'SK': f'PRODUCT#{product_id}'},
                    'UpdateExpression': 'SET quantity = quantity - :qty',
                    'ConditionExpression': 'quantity >= :qty',
                    'ExpressionAttributeValues': {':qty': quantity}
                }
            }
        ]
    )
```

---

### Pattern: Presigned URL for Direct S3 Upload

```python
import boto3
import json

s3 = boto3.client('s3')
BUCKET = 'my-uploads-bucket'

def handler(event, context):
    params = event.get('queryStringParameters') or {}
    filename = params.get('filename')
    content_type = params.get('contentType', 'application/octet-stream')

    if not filename:
        return {'statusCode': 400, 'body': json.dumps({'error': 'filename required'})}

    # Generate a presigned PUT URL valid for 5 minutes
    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': BUCKET,
            'Key': f'uploads/{filename}',
            'ContentType': content_type
        },
        ExpiresIn=300
    )

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'uploadUrl': presigned_url})
    }

# Client code (JavaScript):
# const { uploadUrl } = await fetch('/get-upload-url?filename=photo.jpg').then(r => r.json())
# await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
```

---

### Pattern: CloudFormation with SAM — Complete Serverless API

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Globals:
  Function:
    Runtime: python3.12
    Timeout: 30
    MemorySize: 256
    Tracing: Active  # X-Ray
    Environment:
      Variables:
        TABLE_NAME: !Ref UsersTable
        ENVIRONMENT: !Ref Environment

Resources:
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Environment
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: users.get_handler
      CodeUri: src/
      Events:
        GetUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users/{id}
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref UsersTable

  UsersTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: id
        Type: String

  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub '${Environment}-users'

Outputs:
  ApiEndpoint:
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'
```

---

## Common Exam Traps (Developer Edition)

### Trap 1 — Lambda Timeout vs SQS Visibility Timeout

```
If Lambda timeout = 60s and SQS visibility timeout = 30s:
  → Lambda takes 60s to process a message
  → After 30s, SQS makes the message visible again
  → Another Lambda (or the same Lambda) picks up the SAME message
  → DUPLICATE PROCESSING

Fix:
  SQS visibility timeout = at least 6 × Lambda timeout
  If Lambda timeout = 60s → visibility timeout ≥ 360s
```

### Trap 2 — DynamoDB Scan vs Query

```
Scan:
  → Reads EVERY item in the table
  → Then filters (filter happens AFTER reading — still consumes RCUs)
  → Very expensive at scale (100GB table = 100GB read every Scan)
  → Never use in production for large tables

Query:
  → Reads only items matching the partition key
  → Optional SK condition further filters
  → Efficient — only reads what you need

Exam question: "A DynamoDB query is running slowly and consuming too many RCUs"
Answer options will include: change Scan to Query, add a GSI, enable DAX
→ First fix: always change Scan to Query
```

### Trap 3 — API Gateway Timeout

```
API Gateway hard limit: 29 seconds maximum integration timeout
  → Your Lambda MUST respond within 29 seconds
  → If Lambda takes longer, API Gateway returns 504 Gateway Timeout
  → The Lambda function keeps running (AWS charges you) but the caller gets an error

Fix for long-running tasks:
  1. Async pattern: API Gateway → Lambda (start job) → return job ID
     → Client polls /status/{job_id} endpoint
  2. WebSocket API: push result to client when ready
  3. Step Functions: manage long workflows outside Lambda
```

### Trap 4 — Cognito User Pools vs Identity Pools

```
User Pools:
  → User directory for your application
  → Handles: sign-up, sign-in, password reset, MFA
  → Returns: JWT tokens (ID token, access token, refresh token)
  → Use for: authenticating users to YOUR application

Identity Pools:
  → Exchange a token (from User Pool, Google, Facebook, etc.) for AWS credentials
  → Returns: temporary IAM credentials (access key, secret key, session token)
  → Use for: letting users access AWS services directly

Real scenario:
  Mobile app → Cognito User Pool login → JWT token
  JWT token → Cognito Identity Pool → temporary IAM role credentials
  IAM credentials → upload photo directly to S3
  (Backend never touches the file — client uploads directly)
```

### Trap 5 — S3 Event vs EventBridge for S3 Events

```
S3 Event Notifications (native):
  → S3 → Lambda/SNS/SQS directly
  → Simpler, less filtering options
  → Slight delay possible

S3 → EventBridge:
  → Enable "Send notifications to EventBridge" on the bucket
  → All S3 events flow to default event bus
  → More filtering (by prefix, suffix, event type in one rule)
  → Archive and replay events
  → Multiple targets per rule

Use EventBridge when you need more sophisticated routing or multiple targets.
```

### Trap 6 — CodeDeploy AllAtOnce vs Canary vs Linear

```
AllAtOnce
  → Deploy to all targets simultaneously
  → Fastest deployment, maximum risk
  → If it fails: entire fleet is down
  → Use for: dev/test environments

Linear (e.g. LambdaLinear10PercentEvery1Minute)
  → Shift 10% traffic to new version every minute
  → Full rollout takes 10 minutes
  → Steady, predictable risk reduction
  → Use for: risk-averse production deployments

Canary (e.g. LambdaCanary10Percent5Minutes)
  → Shift 10% traffic immediately to new version
  → Wait 5 minutes → if healthy, shift remaining 90% all at once
  → Fast rollout with a test window
  → Use for: confident you're probably OK, but want a quick safety window
```

### Trap 7 — When to Use Which Queue/Stream Service

```
Amazon SQS Standard Queue
  ✅ Decouple services
  ✅ Handle traffic spikes (buffer)
  ✅ At-least-once delivery is acceptable
  ✅ Order doesn't matter
  ✗ Not for: exactly-once, strict ordering

Amazon SQS FIFO Queue
  ✅ Strict ordering required
  ✅ Exactly-once processing required
  ✅ Financial transactions, order sequencing
  ✗ Limited to 300 TPS (3000 with batching)

Amazon Kinesis Data Streams
  ✅ Real-time data streaming
  ✅ Multiple consumers reading same data
  ✅ Replay data (up to 365 days)
  ✅ Ordered within a shard
  ✅ High throughput (add shards to scale)
  ✗ More complex to manage than SQS

Amazon Kinesis Firehose
  ✅ Load streaming data into S3/Redshift/OpenSearch
  ✅ No code to write (configuration only)
  ✅ Built-in transformation with Lambda
  ✗ No replay, near-real-time only (60s buffer minimum)

Decision tree:
  Need to decouple services? → SQS
  Need exactly-once + ordering? → SQS FIFO
  Need real-time multi-consumer with replay? → Kinesis Streams
  Need to load data into data warehouse/S3? → Kinesis Firehose
```

---

## Extended Exam Q&A — 55 More Questions

### Domain 1: Development with AWS Services

**Q6:** A DynamoDB table has a partition key of `userId` and a sort key of `timestamp`. A developer needs to retrieve all items for userId "u123" from the past 7 days, sorted newest first. Which operation should they use?

- A) Scan with a FilterExpression on userId and timestamp
- B) Query with KeyConditionExpression on userId and timestamp, ScanIndexForward=False ✅
- C) GetItem with userId and timestamp
- D) BatchGetItem with a list of user IDs

**Q7:** A Lambda function is processing SQS messages. The function processes 8 out of 10 messages successfully. 2 messages fail. What happens if `ReportBatchItemFailures` is NOT enabled?
- A) The 8 successful messages are deleted, the 2 failed messages are retried
- B) All 10 messages are deleted
- C) All 10 messages return to the queue and are retried ✅
- D) The Lambda function is stopped until the 2 failures are resolved

**Q8:** An application needs to retrieve an item from DynamoDB and always read the most recently written data, even under concurrent writes. Which read consistency should be used?
- A) Eventually Consistent Read
- B) Strongly Consistent Read ✅
- C) Transactional Read
- D) DAX Read

*Note: Strongly consistent reads cost 2x more RCUs than eventually consistent.*

**Q9:** A developer is building a chat application where messages must be delivered in order and each message must be processed exactly once. Which SQS queue type is appropriate?
- A) Standard Queue
- B) FIFO Queue ✅
- C) Dead Letter Queue
- D) Priority Queue

**Q10:** A Lambda function that processes S3 upload events is experiencing throttling. The function has 500 concurrent executions and the account limit is 1000. Another critical function is being starved of concurrency. What is the BEST solution?
- A) Increase the account concurrency limit to 2000
- B) Set reserved concurrency of 400 on the S3 processor function ✅
- C) Use provisioned concurrency on the critical function
- D) Reduce the S3 processor Lambda timeout

**Q11:** Which DynamoDB feature allows you to automatically delete expired session records without writing application code for cleanup?
- A) DynamoDB Streams
- B) DynamoDB TTL ✅
- C) DynamoDB Global Tables
- D) DynamoDB Conditional Writes

**Q12:** An API Gateway REST API is returning a CORS error in the browser. The Lambda function returns the correct data when tested directly. What is the most likely fix?
- A) Add the Lambda function to a VPC
- B) Enable CORS on API Gateway and ensure Lambda returns CORS headers ✅
- C) Switch from REST API to HTTP API
- D) Enable API Gateway caching

**Q13:** A developer needs to fan out a single event to 5 different downstream services simultaneously. Each service should receive the full event independently. What is the BEST architecture?
- A) Write to 5 SQS queues from the application
- B) SNS topic with 5 SQS queue subscriptions ✅
- C) Kinesis stream with 5 Lambda consumers
- D) EventBridge with 5 separate rules

**Q14:** A Kinesis stream has 4 shards. What is the maximum write throughput?
- A) 4 MB/s write, 8 MB/s read
- B) 4 MB/s write, 16 MB/s read ✅
- C) 8 MB/s write, 8 MB/s read
- D) 1 MB/s write, 2 MB/s read

*1 shard = 1MB/s write, 2MB/s read → 4 shards = 4MB/s write, 8MB/s read*

**Q15:** A developer wants to give a mobile app user the ability to upload a profile picture directly to S3 without routing the file through the backend API. What is the BEST approach?
- A) Embed AWS credentials in the mobile app
- B) Create a backend endpoint that generates a presigned URL, client uses it to upload directly ✅
- C) Create a public S3 bucket
- D) Use Cognito Identity Pool to give the app IAM credentials

**Q16:** A developer is using API Gateway with Lambda Proxy integration. The Lambda function is returning HTTP 200 but the client is receiving HTTP 502. What is the most likely cause?
- A) API Gateway timeout exceeded
- B) Lambda function threw an exception
- C) Lambda return value is not in the correct format (missing statusCode/body) ✅
- D) CORS is not configured

*Lambda Proxy requires: `{"statusCode": 200, "body": "...", "headers": {...}}`*

**Q17:** Which S3 feature allows a developer to retrieve only specific rows and columns from a CSV file stored in S3, without downloading the entire file?
- A) S3 Transfer Acceleration
- B) S3 Select ✅
- C) S3 Batch Operations
- D) S3 Object Lambda

**Q18:** A developer needs to store the result of a Step Functions workflow in DynamoDB as the final state. Which state type directly calls AWS services (like DynamoDB PutItem) without Lambda?
- A) Pass state
- B) Wait state
- C) Task state with SDK integration ✅
- D) Choice state

---

### Domain 2: Security

**Q19:** A Lambda function needs to read from DynamoDB. What is the MOST secure way to give the function access?
- A) Store AWS access keys in Lambda environment variables
- B) Hardcode credentials in the function code
- C) Attach an IAM role to the Lambda function with a DynamoDB policy ✅
- D) Store credentials in S3 and read at startup

**Q20:** An API Gateway endpoint should only be accessible to authenticated users in a specific Cognito User Pool. What is the simplest way to enforce this?
- A) Lambda Authorizer that validates JWTs
- B) Cognito User Pool Authorizer on API Gateway ✅
- C) AWS WAF with Cognito integration
- D) API Gateway Resource Policy

**Q21:** A developer wants to encrypt an environment variable in Lambda with a customer-managed KMS key. What happens when the Lambda function reads the environment variable at runtime?
- A) The function receives the encrypted ciphertext and must decrypt it manually
- B) Lambda automatically decrypts the variable using the KMS key ✅
- C) The KMS key must be embedded in the function code
- D) Environment variables cannot be encrypted with customer-managed keys

**Q22:** Which of the following correctly describes envelope encryption as used by AWS?
- A) KMS encrypts your data directly using the master key
- B) A data key encrypts your data locally; KMS encrypts the data key ✅
- C) All data is encrypted with the same global KMS key
- D) AWS generates a new master key for every encryption operation

**Q23:** A developer is using AWS Secrets Manager to store a database password. The Lambda function retrieves it at startup. What is a potential issue if this runs in a loop of millions of invocations?
- A) Secrets Manager has no rate limits
- B) The secret will expire after 1000 reads
- C) High Secrets Manager API costs and potential throttling if not caching ✅
- D) Lambda cannot call Secrets Manager during init

*Best practice: cache the secret in memory (global variable), refresh on rotation event.*

**Q24:** Which Cognito component allows a React application to let users log in with their Google account and then upload files to S3 directly?
- A) Cognito User Pool only
- B) Cognito Identity Pool only
- C) Cognito User Pool (authentication) + Cognito Identity Pool (AWS credentials) ✅
- D) IAM with SAML federation

**Q25:** A developer creates a Lambda authorizer for API Gateway. The authorizer validates a token and returns an "Allow" policy. When will the authorization result be cached?
- A) Never — Lambda authorizers are always invoked per request
- B) For up to 5 minutes (configurable, default 300 seconds) ✅
- C) For 24 hours
- D) Only if the caller sends a Cache-Control header

---

### Domain 3: Deployment

**Q26:** A developer needs to update a Lambda function with zero downtime. 10% of traffic should go to the new version for 5 minutes, then the remaining 90% if no errors occur. Which CodeDeploy strategy does this describe?
- A) LambdaAllAtOnce
- B) LambdaLinear10PercentEvery1Minute
- C) LambdaCanary10Percent5Minutes ✅
- D) LambdaLinear10PercentEvery10Minutes

**Q27:** A buildspec.yml for CodeBuild fails at the `build` phase with "npm not found". In which phase should npm be installed?
- A) pre_build
- B) install ✅
- C) build
- D) post_build

**Q28:** An Elastic Beanstalk deployment is causing downtime because it updates all instances at once. The team wants zero downtime with no capacity reduction during deployment. Which policy should they use?
- A) All at once
- B) Rolling
- C) Rolling with additional batch ✅
- D) Immutable

**Q29:** A CloudFormation stack update fails during the creation of a new resource. What happens by default?
- A) The successfully created resources remain and failed resources are skipped
- B) The stack rolls back all changes to the previous known-good state ✅
- C) The stack is deleted entirely
- D) CloudFormation pauses and waits for manual intervention

**Q30:** A developer wants to test an API Gateway + Lambda application locally before deploying. Which command starts a local API?
- A) `aws lambda invoke local`
- B) `sam local start-api` ✅
- C) `cdk local start`
- D) `serverless offline start`

**Q31:** A CloudFormation stack has an S3 bucket. The developer wants the bucket to be preserved (not deleted) when the stack is deleted. Which property should they set?
- A) `RetainPolicy: true`
- B) `DeletionPolicy: Retain` ✅
- C) `UpdateReplacePolicy: Retain`
- D) `ProtectFromDeletion: true`

**Q32:** A team is using CodePipeline. After merging to main, the pipeline runs but the `Build` stage fails with an access denied error when trying to pull a Docker image from ECR. What is the most likely cause?
- A) The CodeBuild service role lacks ECR permissions ✅
- B) The Docker image does not exist
- C) CodePipeline cannot integrate with ECR
- D) The ECR repository is in a different region

**Q33:** Which Elastic Beanstalk deployment policy creates a completely new set of instances before terminating old ones, offering the safest but slowest deployment?
- A) Rolling
- B) Rolling with additional batch
- C) Immutable ✅
- D) Blue/Green

---

### Domain 4: Troubleshooting and Optimization

**Q34:** A Lambda function is invoked by SQS. The function times out at 30 seconds. The SQS visibility timeout is 60 seconds. Describe what happens.
- A) The message is immediately sent to the DLQ
- B) The message becomes visible after 60 seconds and is retried; Lambda runs simultaneously for the same message
- C) Lambda times out, the message remains invisible for the remaining 30s (60-30=30s remaining), then reappears and is retried ✅
- D) Both Lambda and SQS terminate after the timeout

**Q35:** A developer notices Lambda function cold start latency is 3 seconds for a Java function. The function serves user-facing API requests. What is the BEST solution?
- A) Increase Lambda memory to reduce cold start time
- B) Rewrite in Python (interpreted languages start faster)
- C) Enable Lambda Provisioned Concurrency ✅
- D) Enable Lambda SnapStart for Python

*SnapStart is Java-specific. Provisioned Concurrency works for all runtimes.*

**Q36:** An API Gateway endpoint is returning HTTP 504 errors intermittently during heavy load. Lambda logs show functions completing in 28.5 seconds. What should the developer change?
- A) Increase Lambda memory
- B) Increase API Gateway timeout (cannot — it's a hard limit of 29 seconds)
- C) Switch to asynchronous invocation pattern with job ID polling ✅
- D) Enable API Gateway caching

**Q37:** A developer uses X-Ray to trace a request and sees a large gap between segments for API Gateway and Lambda. What does this gap most likely indicate?
- A) Network latency between AWS services
- B) Lambda cold start time ✅
- C) DynamoDB read latency
- D) API Gateway caching delay

**Q38:** A DynamoDB table is experiencing throttling on write operations even though the WCU Auto Scaling is configured. What is the most likely root cause?
- A) DynamoDB Streams consuming WCUs
- B) A hot partition — all writes targeting the same partition key ✅
- C) The table is in On-Demand mode
- D) Auto Scaling cannot scale fast enough for sudden bursts

**Q39:** A Lambda function is logging errors: "ResourceNotFoundException: Requested resource not found". The function calls DynamoDB. What is the most likely cause?
- A) DynamoDB is throttling the request
- B) The table does not exist in the region the Lambda function is running in ✅
- C) The Lambda IAM role has insufficient permissions
- D) The partition key value is null

**Q40:** A developer wants to understand the exact sequence of AWS API calls that led to an EC2 instance being terminated unexpectedly. Which service provides this information?
- A) Amazon CloudWatch Logs
- B) AWS Config
- C) AWS CloudTrail ✅
- D) AWS X-Ray

**Q41:** A developer notices that a Lambda function's CloudWatch Logs show it being invoked twice for the same S3 event. What is the most likely explanation?
- A) S3 sends duplicate events by design
- B) Lambda is configured for asynchronous invocation; S3 events are async and Lambda retries on failure, resulting in at-least-once delivery ✅
- C) The function has two event source mappings for the same bucket
- D) CloudWatch Logs duplicates log entries

**Q42:** Which CloudWatch metric would you check to confirm a Lambda function is being throttled?
- A) Lambda.Errors
- B) Lambda.Duration
- C) Lambda.Throttles ✅
- D) Lambda.ConcurrentExecutions

**Q43:** A developer's CodeDeploy deployment to EC2 instances fails during the `AfterInstall` lifecycle hook. The deployment is rolled back. Where should the developer look for the root cause?
- A) CloudTrail API logs
- B) The deployment logs in the CodeDeploy console, and the `/var/log/aws/codedeploy-agent/` log on the EC2 instance ✅
- C) CloudWatch Metrics for EC2
- D) X-Ray traces

**Q44:** A REST API has a Lambda authorizer with a 300-second cache TTL. After a user's permissions are revoked in the backend system, how long could the user potentially still access the API?
- A) Immediately revoked
- B) Up to 5 minutes (300 seconds) ✅
- C) Up to 24 hours
- D) Until the next Lambda cold start

**Q45:** A developer wants to ensure their CloudFormation stack changes are safe before applying them to production. Which feature allows preview of what will change?
- A) Stack Drift Detection
- B) CloudFormation ChangeSet ✅
- C) CloudFormation Rollback triggers
- D) CloudFormation Stack Policy

---

### Mixed Scenarios

**Q46:** A developer needs to build a system where: (1) a user places an order, (2) the inventory is reserved, (3) payment is processed, (4) a confirmation email is sent. If payment fails, inventory should be released. Which service is BEST for orchestrating this?
- A) SQS with multiple Lambda functions
- B) AWS Step Functions with error handling ✅
- C) Amazon EventBridge with multiple rules
- D) Amazon SNS with Lambda subscribers

**Q47:** A developer stores configuration values in SSM Parameter Store (Standard tier). The Lambda function reads these at every invocation. What improvement would reduce both cost and latency?
- A) Switch to Secrets Manager
- B) Cache parameters in Lambda global scope, refresh on cache miss or TTL ✅
- C) Use DynamoDB to store configuration instead
- D) Hardcode configuration in Lambda environment variables

**Q48:** An application uses DynamoDB with On-Demand mode. Traffic suddenly spikes 10x. What happens?
- A) DynamoDB throttles requests until capacity scales
- B) DynamoDB automatically handles the spike with no throttling ✅
- C) You must manually increase RCU and WCU
- D) DynamoDB fails over to a backup table

**Q49:** A developer needs to run the same Lambda function across 1000 S3 objects to transform and re-upload them. Which approach is MOST efficient?
- A) Write a Lambda function that loops through all 1000 objects
- B) Use S3 Batch Operations to invoke the Lambda function for each object ✅
- C) Use Step Functions Map state to process all objects in parallel
- D) Use SQS to queue each object, Lambda processes one at a time

**Q50:** A developer is building a real-time leaderboard for a gaming app that requires sorted scores and sub-millisecond reads. Which service is BEST?
- A) DynamoDB with a GSI on score
- B) Amazon RDS with an index on score
- C) Redis (ElastiCache) sorted sets ✅
- D) Amazon Kinesis Data Streams

**Q51:** Which of the following CodeDeploy deployment types supports Lambda functions?
- A) In-place deployment
- B) Blue/Green deployment only for Lambda ✅
- C) Rolling deployment
- D) Immutable deployment

**Q52:** An EventBridge rule should trigger a Lambda function every weekday at 8am UTC. Which schedule expression is correct?
- A) `rate(1 day)`
- B) `cron(0 8 * * 1-5 *)`  ✅
- C) `cron(8 0 * * MON-FRI *)`
- D) `rate(8 hours)`

**Q53:** A developer needs to process DynamoDB Streams to build a search index in OpenSearch. They want filtering and transformation before the data reaches OpenSearch. Which service is BEST for this pipeline?
- A) Lambda reading from DynamoDB Streams directly
- B) Kinesis Firehose with Lambda transformation
- C) EventBridge Pipes: DynamoDB Streams → filter → Lambda enrichment → Kinesis Firehose → OpenSearch ✅
- D) Step Functions with DynamoDB Streams trigger

**Q54:** Which statement about DynamoDB DAX is TRUE?
- A) DAX helps with write-heavy workloads more than read-heavy
- B) DAX requires significant application code changes to implement
- C) DAX returns strongly consistent reads by default
- D) DAX reduces DynamoDB read latency from milliseconds to microseconds ✅

**Q55:** A developer wants to send events from their custom application to EventBridge and also receive Zendesk ticket events. How should they configure EventBridge?
- A) Use the default event bus for custom events; create a partner event source for Zendesk ✅
- B) Create a custom bus for all external events
- C) Use Kinesis to ingest Zendesk events and forward to EventBridge
- D) EventBridge cannot receive SaaS events directly

**Q56:** A Lambda function in a VPC needs to call an external payment API over HTTPS. The function is in a private subnet. What infrastructure does the developer need?
- A) Internet Gateway
- B) NAT Gateway in a public subnet ✅
- C) VPC Endpoint for the payment API
- D) AWS Direct Connect

**Q57:** A developer creates an SQS queue and configures a Lambda event source mapping with a batch size of 10. Lambda has reserved concurrency of 5. 100 messages arrive simultaneously. How many Lambda invocations will there be initially?
- A) 10 invocations (100 messages / batch size 10) but capped at 5 ✅
- B) 100 invocations
- C) 5 invocations of batch size 20
- D) 1 invocation of 100 messages

**Q58:** A developer notices a Lambda function is running out of `/tmp` space when processing large files. The function receives 10 large files simultaneously. What is the maximum `/tmp` storage configurable?
- A) 512 MB
- B) 1 GB
- C) 5 GB
- D) 10 GB ✅

**Q59:** A developer needs to migrate a monolithic application to microservices. Services need to communicate asynchronously. Service A sends an order; Service B processes payment; Service C ships the order. Each service must complete before the next starts. Which is the BEST fit?
- A) SNS with all three services subscribed
- B) SQS with Service A → B → C chained
- C) Step Functions orchestrating Lambda functions for each service ✅
- D) EventBridge with three rules

**Q60:** Which Lambda feature pre-snapshots the initialized state of a Java function to eliminate cold start time, without any code changes?
- A) Provisioned Concurrency
- B) Lambda Layers
- C) Lambda SnapStart ✅
- D) Lambda ARM Graviton2

---

## Study Tips

1. **Lambda is 30%+ of the exam** — master cold starts, concurrency, timeouts, layers, destinations
2. **DynamoDB access patterns** — GetItem vs Query vs Scan, when to use GSI/LSI, single-table design
3. **SQS + Lambda integration** — visibility timeout = 6x Lambda timeout, DLQ, batch failures, ReportBatchItemFailures
4. **Know the deployment strategies** — CodeDeploy Linear/Canary, Beanstalk Rolling/Immutable/Blue-Green
5. **X-Ray** — how to enable tracing, what segments/subsegments/annotations mean, service map
6. **CloudFormation basics** — stack, template structure, change sets, deletion policy, nested stacks
7. **Security** — Cognito User Pools vs Identity Pools, Lambda authorizers, envelope encryption
8. **Step Functions** — Standard vs Express, state types, error handling (Retry/Catch)
9. **ElastiCache** — Redis vs Memcached, lazy loading vs write-through, session store pattern
10. **DynamoDB advanced** — DAX, TTL, Global Tables, capacity modes (RCU/WCU math)
11. **Lambda VPC** — when to use, NAT Gateway for internet, VPC Endpoints for AWS services
12. **EventBridge** — event bus types, rule patterns, scheduled rules, pipes

**Day-before checklist:**
- [ ] Can you explain the SQS visibility timeout / Lambda timeout relationship?
- [ ] Do you know all 4 Lambda invocation types and what triggers each?
- [ ] Can you design a fan-out pattern using SNS + SQS?
- [ ] Do you know when to use DynamoDB DAX vs ElastiCache?
- [ ] Can you explain Cognito User Pool + Identity Pool flow for mobile apps?
- [ ] Do you know the 5 Beanstalk deployment policies in order of safety?
- [ ] Can you write a basic buildspec.yml structure from memory?
- [ ] Do you know how to fix Lambda cold starts (provisioned concurrency vs SnapStart)?
- [ ] Can you explain envelope encryption in 3 sentences?
- [ ] Do you know when Lambda needs a VPC and what it loses/gains?
