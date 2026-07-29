# AWS Certified Solutions Architect — Professional (SAP-C02)
### Level: Professional | The hardest AWS certification — complex, large-scale architectures

---

## Exam Facts

| | |
|---|---|
| Code | SAP-C02 |
| Questions | 75 (65 scored + 10 unscored) |
| Duration | 180 minutes |
| Pass score | 750 / 1000 |
| Cost | USD $300 |
| Validity | 3 years |
| Prerequisites | Solutions Architect Associate (strongly recommended) |

**Who is this for:** Senior architects who design complex, large-scale, multi-account, multi-region AWS environments. This tests your ability to make architectural trade-offs under real-world constraints (cost, compliance, migration, legacy systems).

**Difficulty:** The hardest AWS certification. Questions are long (200+ word scenarios), answers are all plausible, and you must pick the BEST option — not just a correct one.

---

## The 4 Exam Domains

| Domain | Weight |
|---|---|
| 1. Design for Organizational Complexity | 26% |
| 2. Design for New Solutions | 29% |
| 3. Continuous Improvement for Existing Solutions | 25% |
| 4. Accelerate Workload Migration and Modernization | 20% |

---

## Domain 1 — Design for Organizational Complexity (26%)

### Multi-Account Strategy

```
Why multiple accounts?
  → Blast radius isolation (breach in dev doesn't affect prod)
  → Billing separation by team/project
  → Service limit isolation
  → Security boundary enforcement via SCPs

AWS Landing Zone / Control Tower structure:

Management (Root) Account
  → billing, organizations, SCP management only
  → NO workloads here

Security OU
  ├── Audit account → Config, CloudTrail aggregation, Security Hub
  └── Log Archive  → centralized S3 log storage (immutable)

Infrastructure OU
  ├── Network account → Transit Gateway, Direct Connect, shared VPCs
  └── Tooling account → ECR, CodePipeline, shared services

Workloads OU
  ├── Production OU → prod workload accounts
  └── Development OU → dev/test accounts

Sandbox OU → developer experimentation (limited SCPs, billing alerts)
```

### Network Architecture at Scale

```
Transit Gateway (TGW):
  → hub-and-spoke network topology
  → connect 1000s of VPCs and on-premise networks
  → route tables control which VPCs can talk to each other
  → share TGW across accounts via Resource Access Manager (RAM)

  Account A VPC ──┐
  Account B VPC ──┤──► Transit Gateway ──► On-Premise (Direct Connect / VPN)
  Account C VPC ──┘

VPC Sharing (RAM):
  → share subnets from one account to multiple accounts
  → resources in shared subnets → in account's VPC but centrally managed
  → simpler than VPC peering for many accounts

PrivateLink:
  → expose your service privately to other VPCs/accounts
  → no VPC peering, no internet, no CIDR overlap issues
  → service consumer → Interface Endpoint → PrivateLink → service provider

Direct Connect:
  → dedicated private connection from data center to AWS (1/10/100Gbps)
  → consistent latency, not internet dependent
  → Direct Connect Gateway → connect to multiple regions
  → Virtual Interfaces: Private VIF (VPC), Public VIF (AWS public services), Transit VIF (TGW)
  → Resilience: 2 connections from different providers/locations for HA
```

### Identity Federation at Scale

```
AWS SSO / IAM Identity Center:
  → single sign-on across all AWS accounts
  → integrate with Azure AD, Okta, or internal LDAP
  → assign permission sets (like IAM roles) to users/groups
  → users get temporary credentials per account

Cross-account role assumption:
  Account A user → AssumeRole → Account B role
  → no separate credentials needed in Account B
  → use for: developers accessing multiple accounts, CI/CD cross-account

Directory Service:
  AWS Managed AD → full Active Directory in AWS
  AD Connector  → proxy to on-premise AD (no data in AWS)
  Simple AD     → basic Samba-based, no trust relationships
```

---

## Domain 2 — Design for New Solutions (29%)

### Designing for Scale

```
Web Application Scaling Progression:
  Tier 1: Single EC2 → add RDS, ElastiCache
  Tier 2: ALB + Auto Scaling → distribute load
  Tier 3: Read Replicas → scale reads
  Tier 4: Global distribution → CloudFront, Route 53 latency
  Tier 5: Microservices → decouple into independent services
  Tier 6: Event-driven → async processing, decouple further
  Tier 7: Multi-region active-active → global scale

Database Scaling Decision Tree:
  Reads overwhelming DB?
    → Add ElastiCache (cache frequent queries)
    → Add RDS Read Replicas
    → Use Aurora with up to 15 replicas
  Writes overwhelming DB?
    → Vertical scaling (bigger instance) — easy but has ceiling
    → Application-level sharding
    → Switch to DynamoDB (scales writes massively)
  Mixed read/write at massive scale?
    → DynamoDB Global Tables (active-active multi-region)
```

### Data Architecture

```
Data Lake Architecture:
  Raw zone (S3)         → ingest raw data as-is, never modify
  Cleaned zone (S3)     → validated, standardised format
  Curated zone (S3)     → aggregated, business-ready
  Analytics (Redshift/Athena) → query curated data

Lake Formation:
  → governance layer over S3 data lake
  → fine-grained access control (row/column level)
  → catalog data (Glue Data Catalog)
  → blueprint for ingestion from RDS/CloudTrail/CloudFront

Streaming vs Batch:
  Batch    → process data in scheduled windows (hourly, daily)
             Glue ETL, EMR, Lambda
  Streaming → process data as it arrives (milliseconds to seconds)
             Kinesis Data Streams + Lambda
             Kafka (MSK) + Flink

Lambda Architecture (pattern, not the service):
  Batch layer → process all historical data (high latency, high accuracy)
  Speed layer → process recent data (low latency, approximate)
  Serving layer → merge both → answer any query
```

### High-Performance Computing (HPC)

```
Use cases: genomics, weather simulation, financial modeling, rendering

EC2 for HPC:
  → Compute: c5n, hpc6a (high CPU, high network)
  → GPU: p4d (A100), trn1 (Trainium for ML)
  → Cluster Placement Group → lowest latency between instances
  → EFA (Elastic Fabric Adapter) → high-bandwidth, low-latency network for MPI

Storage for HPC:
  → FSx for Lustre → high-performance parallel file system
  → integrates with S3 → import data, export results
  → millions of IOPS at microsecond latency

Batch:
  → managed job scheduler for HPC workloads
  → multiple compute environments (Spot + On-Demand mix)
  → automatic scaling based on queue depth
  → Fargate for containerized batch jobs
```

### Serverless at Scale

```
API Gateway + Lambda limitations at scale:
  → Lambda burst limit: 3,000 requests/second (varies by region)
  → API Gateway: 10,000 RPS default (can increase)
  → Lambda cold starts at massive scale → use Provisioned Concurrency

Solutions for massive scale:
  → Provisioned Concurrency → pre-warm Lambda (eliminates cold starts, costs more)
  → Application Load Balancer → can replace API Gateway for high TPS at lower cost
  → Lambda + SQS → absorb traffic spikes (SQS is a buffer)

Event-driven at scale:
  → EventBridge → route events to 20+ targets
  → Kinesis → ordered stream, replay, multiple consumers
  → SQS → decoupling, at-least-once, dead-letter queues
  → SNS → fan-out to multiple SQS queues/Lambda/HTTP endpoints

Amazon SQS Extended Client Library:
  → SQS messages > 256KB → store payload in S3, reference in SQS message
  → for large event payloads (images, documents)
```

---

## Domain 3 — Continuous Improvement for Existing Solutions (25%)

### Migration Decision Framework

```
6 Rs of Migration:
  Retire    → decommission (no longer needed)
  Retain    → keep on-premise (compliance, too complex, not worth migrating)
  Rehost    → lift and shift to EC2 (fast, low risk, no cloud benefit)
  Replatform → small optimisations (EC2 → RDS, no code changes)
  Repurchase → move to SaaS (Salesforce, ServiceNow)
  Refactor  → re-architect for cloud-native (biggest benefit, most effort)

When to Rehost vs Refactor:
  Rehost:   tight deadline, large migration, technical debt to clean up later
  Refactor: long-term maintenance, cloud-native benefits needed, green-field
```

### Cost Optimisation at Scale

```
Compute Savings Plans vs EC2 Reserved Instances:
  RI:            specific instance family, region, OS (e.g. m5.large Linux us-east-1)
  EC2 SP:        flexible within instance family (m5.large → m5.xlarge)
  Compute SP:    flexible across family, region, OS (most flexible)
  Choose based on workload stability and flexibility needs

Spot Fleet Strategies:
  lowestPrice   → cheapest pool, risk of interruption
  diversified   → spread across pools, lower interruption risk
  capacityOptimized → least-likely-to-be-interrupted pool
  priceCapacityOptimized → best of both

Graviton (ARM-based) instances:
  → 20-40% cheaper than equivalent x86 for same performance
  → r8g, m8g, c8g families
  → most managed AWS services run on Graviton natively
```

### Architectural Trade-offs

```
Consistency vs Availability (CAP Theorem):
  CP (Consistent + Partition tolerant): DynamoDB strongly consistent mode
  AP (Available + Partition tolerant): DynamoDB eventually consistent mode, S3

  In practice: choose eventual consistency for availability,
               strong consistency when data accuracy is critical

Coupling vs Independence:
  Tight coupling:  direct API calls between services (faster, simpler, brittle)
  Loose coupling:  events/queues between services (resilient, more complex)

  Rule: services that MUST succeed together → synchronous
        services that can succeed independently → asynchronous

Latency vs Cost trade-off:
  ElastiCache → fast (sub-ms), costs money, complex invalidation
  Read Replica → slower (ms), cheaper, simpler
  Direct DB query → slowest, free (no extra cost), simplest
  Choose based on: query frequency × latency requirement
```

---

## Domain 4 — Accelerate Workload Migration and Modernization (20%)

### Migration Services

```
AWS Migration Hub:
  → central tracking for all migrations
  → integrates with: DMS, SMS, MGN, CloudEndure

Application Migration Service (MGN):
  → replicate on-premise servers to AWS (lift-and-shift)
  → continuous block-level replication
  → minimal downtime cutover
  → test migrations without impacting source

Database Migration Service (DMS):
  → migrate databases with minimal downtime
  → supports: Oracle, SQL Server, MySQL, PostgreSQL, MongoDB
  → homogeneous: same engine (MySQL → RDS MySQL) — simple
  → heterogeneous: different engine (Oracle → Aurora) — needs Schema Conversion Tool (SCT)
  → continuous replication (CDC) → near-zero downtime

Storage Migration:
  → DataSync → online transfer (NFS/SMB to S3/EFS/FSx)
  → Snowball Edge → offline (physical device, 80TB per device)
  → Snowmobile → 100PB+ migration (shipping container)
  → S3 Transfer Acceleration → fast upload over internet (CloudFront edge)
```

### Modernization Patterns

```
Strangler Fig Pattern:
  → gradually replace monolith with microservices
  → API Gateway in front → route /users → new service, /orders → old monolith
  → move one feature at a time, old service shrinks
  → low risk, incremental migration

Event Sourcing:
  → store all changes as a sequence of events, not current state
  → event store → reconstruct state by replaying events
  → enables: audit trail, time travel, event-driven architecture
  → tools: DynamoDB Streams + Lambda, Kinesis, EventBridge

CQRS (Command Query Responsibility Segregation):
  → separate read model from write model
  → writes → DynamoDB (optimised for writes)
  → reads → ElasticSearch/OpenSearch (optimised for search)
  → synchronise via DynamoDB Streams → Lambda → OpenSearch

Containerisation:
  → move from VMs to containers (ECS or EKS)
  → ECR stores images
  → App2Container (AWS tool) → analyzes Java/.NET apps → generates Dockerfiles/K8s manifests
```

### VMware to AWS Migration

```
VMware Cloud on AWS:
  → run VMware workloads natively on AWS hardware
  → no refactoring needed
  → migrate VMs without changing anything
  → bridge to AWS native services (RDS, S3, Lambda)
  → gradual migration: run on VMware, access AWS services, migrate at own pace
```

---

## Architecture Patterns — Professional Level

### Pattern 1 — Multi-Region Active-Active

```
Global application requirement:
  → latency < 100ms worldwide
  → 99.99% availability
  → no single point of failure

Architecture:
  Route 53 (latency routing) → ap-southeast-2 or us-east-1
  CloudFront → static assets from S3
  ALB → ECS tasks (auto-scaled per region)
  Aurora Global Database → primary in us-east-1, readers in other regions
  DynamoDB Global Tables → user sessions, real-time data
  ElastiCache (Redis) → per-region cache (not replicated across regions)
  S3 CRR → user uploads replicated to all regions

Trade-offs:
  ✅ Ultra-low latency, ultra-high availability
  ❌ Data consistency challenges, complex conflict resolution
  ❌ Much higher cost (~3x single-region)
  ❌ Complex operational model
```

### Pattern 2 — Event-Driven Microservices (Blink-scale)

```
Services communicate via events, not direct calls:

Booking Service → creates booking → publishes "BookingCreated" event → EventBridge
  → Notification Service subscribes → sends push notification
  → Billing Service subscribes → creates invoice
  → Analytics Service subscribes → records in data warehouse
  → Search Service subscribes → indexes booking

Benefits:
  ✅ Services fully decoupled — Notification Service can fail without affecting Booking
  ✅ Easy to add new consumers (Compliance service) without changing Booking
  ✅ Natural audit trail (all events stored)
  ✅ Easy replay (reprocess events after bug fix)

Challenges:
  ❌ Eventual consistency — Notification may be slightly delayed
  ❌ Harder to trace (need distributed tracing — X-Ray)
  ❌ Idempotency required — event may be delivered twice, must handle gracefully
```

### Pattern 3 — Data Mesh Architecture

```
Each domain team owns their data:
  Booking team → S3 + Glue → publish "Booking" dataset
  User team → S3 + Glue → publish "User" dataset
  Analytics team → subscribes to datasets via Lake Formation → queries via Athena

Governed data sharing without centralized data team bottleneck:
  Lake Formation → column/row-level access control
  RAM → share Glue Data Catalog across accounts
  EventBridge → notify consumers when new data is available
```

---

## Practice Architecture Challenge

### Challenge: Design Blink at AWS Scale

**Requirements:**
- 500 carriers, 5,000 drivers, 50,000 daily bookings
- Mobile app for drivers (React Native) must work offline
- Notifications within 1 second of booking state change
- Data must stay in Australia (compliance)
- 99.99% uptime SLA
- Cost-conscious (startup, Series B)
- GDPR-equivalent compliance

**Architecture Decision Points:**

1. **Region:** `ap-southeast-2` only (Australian data sovereignty)

2. **Multi-AZ:** Yes (3 AZs in Sydney) — use 2 AZs for cost, 3 for higher availability

3. **Compute:** EKS (Fargate for ops simplicity) — matches current Blink stack

4. **Database:** 
   - Aurora PostgreSQL (relational bookings, users, runs) — managed, auto-scaling storage
   - DynamoDB (notifications, sessions — simple access patterns at high rate)
   - ElastiCache Redis (API caching, real-time driver locations)

5. **Mobile offline:** AppSync (GraphQL) with offline sync + DynamoDB

6. **Notifications:** SNS → Pinpoint (push) + SES (email)

7. **API layer:** ALB → EKS (go-micro) → not API Gateway (too expensive at scale, go-micro handles routing)

8. **CDN:** CloudFront → S3 (web app) — not needed for mobile API (latency is already low in-region)

9. **Observability:** 
   - CloudWatch Container Insights (EKS)
   - X-Ray (distributed tracing)
   - CloudWatch Logs → S3 (Athena for log analysis)

10. **Security:**
    - WAF on ALB (protect against SQLi, XSS)
    - GuardDuty (threat detection)
    - Secrets Manager (all credentials)
    - KMS (data at rest encryption)
    - VPC with private subnets for all services

---

## Sample Exam Questions

**Q1:** A company needs to migrate an on-premises Oracle database (10TB) to AWS with less than 1 hour of downtime. Which approach should they use?
- A) Use AWS Snowball to transfer data, then switch connection
- B) Use AWS DMS with Change Data Capture (CDC) to replicate continuously, then cut over during a maintenance window ✅
- C) Use AWS DataSync to transfer the database files
- D) Create an Aurora replica of the Oracle database and promote it

**Q2:** A startup's API handles 100 requests/second normally but spikes to 50,000 requests/second during flash sales lasting 30 minutes. They want to minimize cost during normal operation. What architecture should they use?
- A) Provision EC2 instances for peak capacity
- B) SQS queue + Lambda consumers with reserved concurrency ✅
- C) ALB + EC2 Auto Scaling with 5-minute scale-out cooldown
- D) API Gateway with throttling set to 50,000 RPS

**Q3:** A financial company must ensure that all data remains in Australia and no AWS employee can access their encryption keys. Which solution meets these requirements?
- A) Use SSE-S3 encryption in ap-southeast-2
- B) Use AWS KMS with AWS-managed keys in ap-southeast-2
- C) Use AWS KMS with customer-managed keys and key material imported from on-premise (CloudHSM) ✅
- D) Use SSE-C with client-side encryption

**Q4:** A company is migrating 2,000 VMs from VMware on-premises to AWS. They need to minimize disruption and reuse existing VMware expertise. Which service should they primarily use?
- A) AWS Application Migration Service (MGN) for lift-and-shift
- B) AWS Database Migration Service
- C) VMware Cloud on AWS ✅
- D) AWS Elastic Beanstalk

---

## Study Tips

1. **This exam tests judgement, not memorisation** — know WHY one architecture is better than another
2. **Cost is always a constraint** — every question has a "cost-effective" angle
3. **Multi-account and multi-region** — deeply understand TGW, RAM, VPC Peering, PrivateLink
4. **Migration scenarios** — 6 Rs, DMS, MGN, DataSync, Snowball — know when each applies
5. **Read long questions carefully** — the constraint buried at the end often rules out most answers
6. **Elimination strategy** — usually 2 wrong answers are obvious, then pick best of remaining 2
7. **Data architecture** — data lake, streaming, Lake Formation, Redshift vs Athena
8. **The Well-Architected Framework** — every question can be mapped to one of its 6 pillars
9. **Practice with Tutorials Dojo SAP-C02** — best practice questions on the market
10. **Time management** — 75 questions in 180 minutes = 2.4 minutes/question. Flag hard ones and return.

---

## Your 10-Year AWS Certification Roadmap

```
Year 1 (Now):
  ✅ AWS Cloud Practitioner     (foundation — understand the landscape)
  ✅ AWS AI Practitioner        (GenAI is the future — get ahead now)

Year 2:
  🎯 Solutions Architect Associate  (most valuable for your career)
  🎯 Developer Associate            (code-heavy, directly applicable to Blink work)

Year 3:
  🎯 CloudOps Engineer Associate    (operations skills, hands-on console depth)

Year 4-5:
  🎯 DevOps Engineer Professional   (CI/CD mastery, automation at scale)
  🎯 Solutions Architect Professional (the pinnacle — complex architectures)

Each cert builds on the previous. By year 5, you will be one of the most
well-rounded AWS engineers in the Australia market.
```
