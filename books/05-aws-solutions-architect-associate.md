# AWS Certified Solutions Architect — Associate (SAA-C03)
### Level: Associate | Design resilient, cost-effective cloud architectures

---

## Exam Facts

| | |
|---|---|
| Code | SAA-C03 |
| Questions | 65 (50 scored + 15 unscored) |
| Duration | 130 minutes |
| Pass score | 720 / 1000 |
| Cost | USD $150 |
| Validity | 3 years |
| Prerequisites | Cloud Practitioner knowledge recommended |

**Who is this for:** Developers and engineers who design systems on AWS. This is the most popular AWS certification. It proves you can design architectures that are secure, resilient, high-performing, and cost-optimised.

---

## The 4 Exam Domains

| Domain | Weight |
|---|---|
| 1. Design Secure Architectures | 30% |
| 2. Design Resilient Architectures | 26% |
| 3. Design High-Performing Architectures | 24% |
| 4. Design Cost-Optimized Architectures | 20% |

---

## Domain 1 — Design Secure Architectures (30%)

### VPC Design Patterns

```
3-Tier Architecture (standard production setup):

Internet
  ↓
Internet Gateway
  ↓
Public Subnet          → ALB, NAT Gateway, Bastion Host
  ↓ (private routing)
Private Subnet (App)   → EC2, ECS, EKS (your application)
  ↓ (private routing)
Private Subnet (DB)    → RDS, ElastiCache (your databases)
```

**Key rules:**
- Databases NEVER in public subnets
- Application servers in private subnets, reached only via ALB
- NAT Gateway in public subnet — lets private resources reach internet (outbound only)
- Bastion Host (jump box) — the only way to SSH into private EC2 instances

### Security Groups vs NACLs

| | Security Groups | Network ACLs |
|---|---|---|
| Level | Instance level | Subnet level |
| State | Stateful (return traffic auto-allowed) | Stateless (must define both directions) |
| Rules | Allow only | Allow and Deny |
| Default | Deny all inbound, allow all outbound | Allow all |
| Use case | Fine-grained per-instance rules | Subnet-level blocklist |

**Analogy:**
- Security Group = door lock on your apartment (stateful — if you open the door, you can come back in)
- NACL = the building's front door policy (stateless — separate in/out rules)

### IAM Deep Dive

```
Policy types:
  Identity-based  → attached to user/group/role (what they can do)
  Resource-based  → attached to S3/SQS/etc (who can access this resource)
  Permission boundary → max permissions a role can have (safety ceiling)
  SCPs (Service Control Policies) → org-wide guardrails via AWS Organizations

Policy evaluation logic:
  1. Explicit DENY → always wins
  2. Explicit ALLOW → allowed if no deny
  3. Implicit DENY → default if no allow statement

Cross-account access:
  Account A wants to access Account B's S3:
  → Account B creates a role with S3 access
  → Account A assumes that role (STS AssumeRole)
  → No need to share credentials
```

### Encryption

```
At rest:
  S3     → SSE-S3 (AWS manages keys), SSE-KMS (you manage keys), SSE-C (you provide key)
  EBS    → encrypted at creation using KMS
  RDS    → enable encryption at creation (cannot enable on existing unencrypted DB)

In transit:
  Always use HTTPS/TLS
  ALB → EC2: use HTTPS on the backend too, not just frontend
  RDS → SSL/TLS connection strings

KMS key types:
  AWS managed key     → free, AWS creates/rotates, you can't control rotation
  Customer managed key → $1/month, you control rotation, more flexibility
  Data key            → KMS generates, you use to encrypt your data (envelope encryption)
```

---

## Domain 2 — Design Resilient Architectures (26%)

### High Availability Patterns

**Multi-AZ:**
```
Deploy across 2+ AZs for fault tolerance:
  RDS Multi-AZ → primary in AZ-a, standby in AZ-b, automatic failover ~60s
  ALB          → spans multiple AZs automatically
  EC2 Auto Scaling → distribute instances across AZs
  ECS/EKS      → schedule tasks across multiple AZs
```

**Multi-Region:**
```
For disaster recovery (DR) or global low-latency:
  S3          → Cross-Region Replication (CRR) — replicate objects to another region
  RDS         → Read Replica in another region
  Route 53    → health checks + failover routing → redirect to DR region if primary fails
  Global Accelerator → route users to nearest healthy region
```

### Disaster Recovery Strategies (know the RTO/RPO tradeoffs)

```
RPO = Recovery Point Objective  → how much data loss is acceptable?
RTO = Recovery Time Objective   → how long can you be down?

Strategy        Cost    RPO      RTO      Description
───────────────────────────────────────────────────────────────
Backup/Restore  $       Hours    Hours    Backup to S3, restore when needed
Pilot Light     $$      Minutes  Hours    Core infra running, scale up on disaster
Warm Standby    $$$     Seconds  Minutes  Scaled-down version always running
Multi-Site      $$$$    ~0       ~0       Full duplicate running in another region
```

### Auto Scaling

```
EC2 Auto Scaling:
  Scaling policies:
    Target tracking  → maintain a metric at a target (e.g. CPU at 70%)
    Step scaling     → scale by set amount when threshold crossed
    Scheduled        → scale at specific times (e.g. every day at 9am)
    Predictive       → ML-based, anticipate traffic patterns

  Components:
    Launch Template  → what to launch (AMI, instance type, user data)
    ASG              → how many (min/max/desired) and where (VPCs/AZs)

ECS Service Auto Scaling → scale tasks based on CloudWatch metrics
Application Auto Scaling → scale DynamoDB, Aurora, ECS, Lambda concurrency
```

### S3 Durability and Availability

```
Durability: 99.999999999% (11 nines) — data won't be lost
Availability varies by storage class:
  S3 Standard        → 99.99% availability
  S3 Standard-IA     → 99.9% availability, lower storage cost, retrieval fee
  S3 One Zone-IA     → 99.5% availability, single AZ only — risky
  S3 Glacier Instant → 99.9%, milliseconds retrieval
  S3 Glacier Flexible → hours retrieval
  S3 Glacier Deep    → 12 hours retrieval, lowest cost

S3 Lifecycle Policies:
  → automatically move objects between storage classes based on age
  → example: Standard → Standard-IA after 30 days → Glacier after 90 days → delete after 365 days
```

---

## Domain 3 — Design High-Performing Architectures (24%)

### Compute Performance

```
EC2 instance families:
  t-family  → burstable (T3, T4g) — cheap, good for dev/small apps
  c-family  → compute optimised (C6i, C7g) — CPU-intensive
  r-family  → memory optimised (R6g, R7g) — in-memory DBs, big data
  p/g-family → GPU (P4, G5) — ML training, graphics
  i-family  → storage optimised (I4i) — high IOPS, NVMe SSDs
  inf-family → inference (Inf2) — ML inference at low cost

Placement Groups:
  Cluster   → all instances in same AZ, same rack → lowest latency, highest throughput
  Spread    → each instance on different hardware → max availability (max 7 per AZ)
  Partition → groups of instances on separate hardware → Hadoop, Cassandra
```

### Database Performance

```
RDS:
  Read Replicas → offload read traffic (up to 5 replicas)
  Multi-AZ      → high availability (not performance — standby is passive)
  RDS Proxy     → pool connections, reduce DB load (important for Lambda)

Aurora:
  Up to 15 read replicas with <10ms replication lag
  Aurora Serverless v2 → scales in 0.5 ACU increments within seconds
  Aurora Global Database → cross-region, <1s replication

DynamoDB:
  On-demand mode      → no capacity planning, pay per request
  Provisioned mode    → set read/write capacity units (cheaper if predictable)
  DynamoDB Accelerator (DAX) → in-memory cache, microsecond response
  Global Tables       → multi-region, active-active replication
```

### Caching Strategies

```
CloudFront → cache at edge (CDN) — static assets, API responses
ElastiCache → cache within your VPC — database query results, sessions
  Redis   → supports complex data structures, persistence, replication
  Memcached → simple key-value, multi-threaded, no persistence
DAX        → cache specifically for DynamoDB

Cache-Aside pattern (most common):
  1. App checks cache
  2. Cache hit → return cached result
  3. Cache miss → query DB, store in cache, return result
```

### Networking Performance

```
Enhanced Networking:
  ENA (Elastic Network Adapter) → up to 100Gbps, lower latency, modern instances
  SR-IOV → direct network card access, less CPU overhead

VPC Endpoints:
  Gateway endpoint → S3 and DynamoDB — free, no NAT needed
  Interface endpoint → all other services — uses PrivateLink, has cost
  → traffic stays on AWS network, doesn't leave to internet

AWS Global Accelerator:
  → routes users to nearest AWS region via AWS backbone network
  → reduces hops, faster than public internet routing
  → health checks → automatic failover to healthy region
```

---

## Domain 4 — Design Cost-Optimized Architectures (20%)

### Compute Cost Optimization

```
Right-sizing:
  → use Compute Optimizer to find oversized instances
  → don't run m5.xlarge if you need m5.medium

Pricing models:
  Spot Instances → up to 90% off, use for fault-tolerant workloads
  Reserved → 1-3 year commit, up to 72% off stable workloads
  Savings Plans → flexible (covers EC2, Fargate, Lambda)

Lambda vs EC2 for sporadic workloads:
  Lambda → pay per invocation, no idle cost → cheaper for sporadic traffic
  EC2    → pay by hour, idle cost → cheaper for constant high traffic
```

### Storage Cost Optimization

```
S3 Intelligent-Tiering:
  → automatically moves objects between frequent/infrequent access tiers
  → no retrieval fees, small monitoring fee per object
  → use when access patterns are unknown

S3 Lifecycle Policies:
  → automate tiering and deletion based on object age

EBS:
  → delete unattached volumes (common waste)
  → use gp3 instead of gp2 (20% cheaper, better performance)
  → take snapshots instead of keeping old volumes
```

### Database Cost Optimization

```
Aurora Serverless v2:
  → scales to 0 when idle → no cost when not used
  → good for dev/test environments with variable load

DynamoDB On-Demand:
  → pay per request, no idle cost
  → cheaper than Provisioned for unpredictable or low traffic

Reserved Instances (RDS/ElastiCache):
  → 1-3 year commitment for production databases → big savings
```

### Data Transfer Cost Optimization

```
Common data transfer costs:
  Outbound to internet          → $0.09/GB (expensive)
  Between AZs in same region    → $0.01/GB each way
  Same AZ                       → FREE
  Into AWS                      → FREE

Cost reduction strategies:
  → Use VPC Endpoints → S3/DynamoDB access stays on AWS backbone (free)
  → Put app and DB in same AZ → free transfer
  → Use CloudFront → cache at edge → reduce origin transfer
  → Compress data before transfer
```

---

## Architecture Patterns to Know

### Pattern 1 — Serverless Web Application

```
Users → CloudFront → S3 (static React app)
              ↓ (API calls)
         API Gateway → Lambda → DynamoDB
```
- Zero servers to manage
- Pay per request
- Auto-scales to millions

### Pattern 2 — Traditional 3-Tier Web App

```
Users → Route 53 → CloudFront → ALB
                                  ↓
                         EC2 Auto Scaling Group (private subnet)
                                  ↓
                         RDS Multi-AZ (DB subnet)
                         ElastiCache (private subnet)
```

### Pattern 3 — Event-Driven Microservices

```
User uploads image to S3
  ↓ (S3 Event)
SQS Queue (buffer)
  ↓
Lambda (process image)
  ↓
DynamoDB (store result)
  ↓
SNS (notify user)
```

### Pattern 4 — Data Lake

```
Data sources → Kinesis Data Streams → S3 (raw)
                                         ↓
                                    AWS Glue (transform)
                                         ↓
                                    S3 (processed)
                                         ↓
                                    Athena / Redshift (query)
```

---

## Practice Exercises

### Exercise 1 — Design Scenarios

For each scenario, design the architecture:

**Scenario A:** A startup needs a highly available web application that can handle 1,000 to 100,000 concurrent users. Cost must be minimal when traffic is low.

**Answer:** EC2 Auto Scaling (Target Tracking, min=2) behind ALB across 2 AZs + RDS Multi-AZ + ElastiCache + CloudFront for static assets. Scale down to 2 instances when quiet, scale to 50+ during peak.

---

**Scenario B:** A company stores 500TB of log files in S3. Files are accessed frequently for the first 30 days, rarely from 30-90 days, and never after 90 days.

**Answer:** S3 Lifecycle Policy: Standard (0-30 days) → Standard-IA (30-90 days) → Glacier (90-365 days) → Delete after 365 days.

---

**Scenario C:** A Lambda function needs to query a database but connections keep exhausting the DB's connection limit.

**Answer:** Add RDS Proxy between Lambda and RDS. RDS Proxy pools connections — many Lambda invocations share a small pool of actual DB connections.

---

### Exercise 2 — Security Review

You're reviewing this architecture. Find the security problems:

```
Internet → EC2 (public subnet, Security Group: allow all inbound 0.0.0.0/0)
EC2 has an IAM role with AdministratorAccess
EC2 connects to RDS (public subnet, port 5432 open to 0.0.0.0/0)
Application stores AWS access keys in code
```

**Problems:**
1. EC2 in public subnet — should be in private subnet behind ALB
2. Security Group allows all inbound — should only allow 80/443
3. IAM role has AdministratorAccess — least privilege violation
4. RDS in public subnet — must be in DB subnet (private)
5. RDS port open to 0.0.0.0/0 — should only allow from application SG
6. Access keys in code — use IAM roles instead

---

## Sample Exam Questions

**Q1:** A company needs their RDS database to automatically failover to a standby instance within 60 seconds if the primary fails. What should they configure?
- A) RDS Read Replica
- B) RDS Multi-AZ ✅
- C) Aurora Global Database
- D) ElastiCache

**Q2:** A Lambda function is timing out because it can't connect to an RDS database. The database is running out of connections. What is the recommended solution?
- A) Increase Lambda timeout
- B) Upgrade the RDS instance to a larger size
- C) Use RDS Proxy to pool database connections ✅
- D) Add a Read Replica

**Q3:** An application needs to process messages from multiple producers and ensure each message is processed at least once. The processing order doesn't matter. Which service should they use?
- A) Amazon SQS Standard Queue ✅
- B) Amazon SQS FIFO Queue
- C) Amazon SNS
- D) Amazon Kinesis

**Q4:** A company wants to reduce data transfer costs between their EC2 instances and S3. The EC2 instances are in a VPC. What should they configure?
- A) CloudFront distribution
- B) NAT Gateway
- C) S3 Transfer Acceleration
- D) S3 Gateway VPC Endpoint ✅

**Q5:** A company has an application with unpredictable traffic. It can have zero users for hours then suddenly need to handle thousands. Which compute option minimizes cost?
- A) EC2 Reserved Instances
- B) EC2 On-Demand with Auto Scaling
- C) AWS Lambda ✅
- D) EC2 Spot Instances

**Q6:** Which S3 storage class automatically moves objects between access tiers based on access patterns?
- A) S3 Standard-IA
- B) S3 One Zone-IA
- C) S3 Intelligent-Tiering ✅
- D) S3 Glacier

---

## Study Tips

1. **Practice designing architectures** — draw them out, not just read about them
2. **Understand the why** — WHY Multi-AZ vs Read Replica, WHY SQS vs SNS
3. **Cost tradeoffs** — every scenario asks about the cheapest option that meets requirements
4. **The SAA loves these patterns:** serverless, event-driven, decoupled, multi-AZ
5. **Security is domain 1 (30%)** — master VPC design, IAM, encryption
6. **Know when NOT to use a service** — e.g. Multi-AZ is for HA, not performance
7. **Read every answer carefully** — usually 2 answers are correct but one is more optimal
