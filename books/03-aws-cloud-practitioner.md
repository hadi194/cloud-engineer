# AWS Certified Cloud Practitioner (CLF-C02)
### Level: Foundational | Your first AWS certification

---

## Exam Facts

| | |
|---|---|
| Code | CLF-C02 |
| Questions | 65 (50 scored + 15 unscored) |
| Duration | 90 minutes |
| Pass score | 700 / 1000 |
| Cost | USD $100 |
| Validity | 3 years |
| Prerequisites | None |

**Who is this for:** Anyone who wants to prove they understand what AWS is and how it works — developers, managers, sales, support. You don't need to be technical to pass, but technical people should find it easy.

---

## The 4 Exam Domains

| Domain | Weight | What it covers |
|---|---|---|
| 1. Cloud Concepts | 24% | What is cloud, why AWS, global infrastructure |
| 2. Security & Compliance | 30% | IAM, shared responsibility, compliance programs |
| 3. Cloud Technology & Services | 34% | Core AWS services overview |
| 4. Billing, Pricing & Support | 12% | How AWS charges you, support plans |

---

## Domain 1 — Cloud Concepts (24%)

### What is Cloud Computing?

Instead of buying and maintaining physical servers, you rent computing resources on demand over the internet and pay only for what you use.

**The 6 advantages of cloud (AWS loves to test these):**
```
1. Trade capital expense for variable expense
   → Don't buy servers upfront. Pay per use.

2. Benefit from massive economies of scale
   → AWS buys hardware in bulk. You get cheaper prices.

3. Stop guessing capacity
   → Scale up or down in minutes. No over-provisioning.

4. Increase speed and agility
   → Deploy in minutes, not weeks.

5. Stop spending money on data centers
   → Focus on your product, not your infrastructure.

6. Go global in minutes
   → Deploy to Sydney, London, Tokyo simultaneously.
```

### Cloud Deployment Models

```
Public Cloud   → everything on AWS (most common)
Private Cloud  → your own data center (like AWS but yours)
Hybrid Cloud   → mix of public + private
               → e.g. sensitive data on-premise, web app on AWS
```

### Cloud Service Models

```
IaaS — Infrastructure as a Service
  → You manage: OS, runtime, app, data
  → AWS manages: hardware, networking, virtualization
  → Example: EC2

PaaS — Platform as a Service
  → You manage: app, data
  → AWS manages: everything else including OS
  → Example: Elastic Beanstalk, RDS

SaaS — Software as a Service
  → You manage: nothing (just use it)
  → AWS manages: everything
  → Example: Gmail, Salesforce (not AWS-specific but concept applies)
```

### AWS Global Infrastructure

```
Regions         → 30+ geographic locations (ap-southeast-2 = Sydney)
                  Choose based on: latency, compliance, cost

Availability Zones → 2-6 data centers per region
                     Physical separation, connected by private fiber
                     Deploy across 2+ AZs for high availability

Edge Locations  → 400+ points of presence worldwide
                  Used by CloudFront (CDN) and Route 53 (DNS)
                  More locations than regions — serve users faster

Local Zones     → AWS infrastructure closer to specific cities
                  Low-latency for specific metro areas
```

**Key rule:** Region > AZ > Edge Location (from largest to most numerous)

---

## Domain 2 — Security & Compliance (30%)

### Shared Responsibility Model ← MOST TESTED TOPIC

```
AWS is responsible for:          You are responsible for:
"Security OF the cloud"          "Security IN the cloud"

✅ Physical data centers         ✅ Your data
✅ Hardware                      ✅ Your application code
✅ Network infrastructure        ✅ IAM users and permissions
✅ Hypervisor                    ✅ OS patching (on EC2)
✅ Managed service security      ✅ Firewall configuration
                                 ✅ Encryption settings
```

**Analogy:** AWS builds the apartment building (structure, locks, security). You are responsible for what's inside your apartment and who has your key.

**Managed vs Unmanaged:**
- **RDS (managed):** AWS patches the database engine. You manage data and access.
- **EC2 (unmanaged):** You patch the OS yourself.

### IAM — Identity and Access Management

```
Users    → individual people or applications
Groups   → collection of users (e.g. "developers" group)
Roles    → assumed by services (EC2, Lambda) or other accounts
Policies → JSON documents that define permissions

Best practices:
  ✅ Root account: use ONLY to create first IAM user, then lock away
  ✅ MFA on root account always
  ✅ Principle of least privilege (minimum permissions needed)
  ✅ Use roles for services, never embed access keys in code
  ✅ Rotate access keys regularly
```

### Security Services to Know

| Service | What it does |
|---|---|
| IAM | Identity and access management |
| AWS Shield | DDoS protection (Standard = free, Advanced = paid) |
| AWS WAF | Web Application Firewall (blocks SQL injection, XSS) |
| Amazon GuardDuty | Threat detection (analyzes logs for suspicious activity) |
| AWS Inspector | Automated security scanning of EC2 and containers |
| AWS Macie | Finds sensitive data (PII) in S3 buckets |
| AWS KMS | Encryption key management |
| AWS CloudTrail | Logs every API call (who did what, when) |
| AWS Config | Tracks configuration changes over time |
| AWS Artifact | Access compliance reports and agreements |
| Amazon Cognito | User authentication for your apps |
| AWS Secrets Manager | Store and rotate secrets (passwords, API keys) |

### Compliance Programs

AWS holds certifications for many compliance standards. You inherit these when you use AWS:
- **SOC 1, 2, 3** — security controls audit
- **ISO 27001** — information security management
- **PCI DSS** — payment card industry
- **HIPAA** — US healthcare data
- **GDPR** — EU data privacy

---

## Domain 3 — Cloud Technology & Services (34%)

### Compute

| Service | Simple definition |
|---|---|
| EC2 | Virtual machine — you choose the OS and size |
| Lambda | Run code without servers — pay per invocation |
| ECS | Run Docker containers — AWS manages the cluster |
| EKS | Managed Kubernetes — run K8s without managing masters |
| Elastic Beanstalk | PaaS — upload your code, AWS handles everything |
| AWS Batch | Run batch computing jobs at any scale |
| Lightsail | Simplified VPS — simple pricing, good for beginners |

### Storage

| Service | Simple definition |
|---|---|
| S3 | Object storage for any file — infinitely scalable |
| EBS | Block storage for EC2 — like a hard drive |
| EFS | Shared file system — multiple EC2s can mount it |
| S3 Glacier | Archive storage — very cheap, slow retrieval |
| Storage Gateway | Connect on-premise to AWS storage |
| AWS Backup | Centralized backup across AWS services |

### Databases

| Service | Simple definition |
|---|---|
| RDS | Managed relational DB (PostgreSQL, MySQL, etc.) |
| Aurora | AWS-enhanced PostgreSQL/MySQL — faster, more resilient |
| DynamoDB | Managed NoSQL — key-value at massive scale |
| ElastiCache | Managed Redis/Memcached — in-memory caching |
| Redshift | Data warehouse — query petabytes with SQL |
| DocumentDB | Managed MongoDB-compatible database |
| Neptune | Graph database |

### Networking

| Service | Simple definition |
|---|---|
| VPC | Your private network in AWS |
| Route 53 | DNS — map domains to IPs |
| CloudFront | CDN — serve content from edge locations |
| ALB / NLB | Load balancers — distribute traffic |
| API Gateway | Create, publish, manage APIs |
| Direct Connect | Dedicated private connection from your office to AWS |
| VPN | Encrypted tunnel from your network to AWS |
| Transit Gateway | Connect multiple VPCs together |

### Developer & Management Tools

| Service | Simple definition |
|---|---|
| CloudFormation | Infrastructure as code — define AWS resources in YAML/JSON |
| CloudWatch | Monitoring — metrics, logs, alarms |
| CloudTrail | Audit log — who did what on AWS |
| AWS Config | Track configuration changes |
| Systems Manager | Manage EC2 fleet — run commands, patch, inventory |
| Trusted Advisor | Best practice recommendations (cost, security, performance) |
| AWS Organizations | Manage multiple AWS accounts |

### Application Integration

| Service | Simple definition |
|---|---|
| SQS | Message queue — decouple services |
| SNS | Pub/sub notifications — send to many subscribers |
| EventBridge | Event bus — react to events across AWS services |
| Step Functions | Coordinate workflows between services |

---

## Domain 4 — Billing, Pricing & Support (12%)

### AWS Pricing Models

```
On-Demand    → pay per hour/second, no commitment, most expensive
              → use for: unpredictable workloads, short-term

Reserved     → 1 or 3-year commitment, up to 72% cheaper
              → use for: steady, predictable workloads

Spot         → bid on unused AWS capacity, up to 90% cheaper
              → can be interrupted with 2-min notice
              → use for: batch jobs, fault-tolerant workloads

Savings Plans → commit to $/hour spend, flexible (EC2, Fargate, Lambda)
              → similar discount to Reserved but more flexible
```

### Free Tier

3 types of free offers:
```
Always free:    Lambda (1M requests/month), DynamoDB (25GB), CloudWatch (basic)
12 months free: EC2 t2/t3.micro (750hrs), S3 (5GB), RDS t2/t3.micro (750hrs)
Trials:         Short-term free trials for specific services
```

### Total Cost of Ownership (TCO)

AWS helps calculate TCO — comparing on-premise cost vs AWS:
- On-premise: hardware, power, cooling, staff, facility, maintenance
- AWS: pay per use, no upfront hardware

Use **AWS Pricing Calculator** to estimate costs before deploying.

### Support Plans

| Plan | Cost | Response time | Who to use |
|---|---|---|---|
| Basic | Free | Community forums only | Personal projects |
| Developer | $29/month | 12-24 hours | Development/testing |
| Business | $100/month | 1 hour (production) | Production workloads |
| Enterprise On-Ramp | $5,500/month | 30 minutes (critical) | Large business |
| Enterprise | $15,000/month | 15 minutes (critical) | Mission-critical |

Enterprise plans include a **Technical Account Manager (TAM)** — a dedicated AWS expert assigned to your account.

**Trusted Advisor** — automated recommendations for:
- Cost optimization (unused resources)
- Security (open ports, MFA not enabled)
- Performance (underutilized EC2)
- Fault tolerance (no backups, single AZ)
- Service limits (approaching quotas)

Basic plan: 6 core checks. Business+: all checks.

### AWS Well-Architected Framework — 6 Pillars

```
1. Operational Excellence  → run and monitor systems, improve processes
2. Security                → protect data, systems, assets
3. Reliability             → recover from failure, meet demand
4. Performance Efficiency  → use resources efficiently
5. Cost Optimization       → avoid unnecessary costs
6. Sustainability          → minimize environmental impact
```

---

## Practice Exercises

### Exercise 1 — Shared Responsibility

For each item, mark whether AWS or YOU are responsible:

```
a) Patching the Linux OS on an EC2 instance
b) Physical security of the data center
c) Encrypting data stored in S3
d) Replacing failed hard drives in servers
e) Managing IAM user passwords
f) Patching the PostgreSQL engine on RDS
g) Configuring Security Group firewall rules
h) Ensuring the network cable doesn't get cut
```

**Answers:**
- a) YOU (EC2 = unmanaged compute)
- b) AWS
- c) YOU (you choose to enable encryption)
- d) AWS
- e) YOU
- f) AWS (RDS = managed service)
- g) YOU
- h) AWS

---

### Exercise 2 — Choose the Right Service

Match the scenario to the AWS service:

```
Scenario                                          Service
----------------------------------------------------------------------
a) Store user profile pictures                    ___________
b) Run a Python script every time a file uploads  ___________
c) Map yourapp.com to your EC2 IP                ___________
d) Send an email notification when CPU > 80%      ___________
e) Log every API call made in your account        ___________
f) Store database passwords securely              ___________
g) Cache database query results for 5 minutes     ___________
h) Run a batch job processing 1 million records   ___________
```

**Answers:** a) S3, b) Lambda, c) Route 53, d) CloudWatch + SNS, e) CloudTrail, f) Secrets Manager, g) ElastiCache, h) AWS Batch

---

### Exercise 3 — Pricing Scenarios

Which pricing model should each use?

```
a) A startup with unpredictable traffic that spikes occasionally
b) A bank's core database that runs 24/7 for 3 years
c) A video rendering farm that runs overnight jobs and can be interrupted
d) A development environment used only during business hours
```

**Answers:**
- a) On-Demand (unpredictable)
- b) Reserved 3-year (stable, predictable)
- c) Spot (fault-tolerant, can be interrupted)
- d) On-Demand or Spot (only used part-time)

---

## Sample Exam Questions

**Q1:** A company wants to migrate to AWS and needs to understand who is responsible for patching the operating system on EC2 instances. Who is responsible?
- A) AWS, because they manage the cloud infrastructure
- B) The customer, because EC2 is an unmanaged compute service ✅
- C) Both AWS and the customer share this responsibility equally
- D) A third-party security firm

**Q2:** Which AWS service provides a managed NoSQL database?
- A) Amazon RDS
- B) Amazon Aurora
- C) Amazon DynamoDB ✅
- D) Amazon Redshift

**Q3:** A company needs to run a batch processing job that can be interrupted. Which EC2 pricing model offers the lowest cost?
- A) On-Demand
- B) Reserved
- C) Dedicated Hosts
- D) Spot ✅

**Q4:** Which of the following is an advantage of using AWS over on-premises infrastructure? (Select TWO)
- A) Fixed monthly costs regardless of usage
- B) Trade capital expense for variable expense ✅
- C) Physical access to hardware
- D) Go global in minutes ✅
- E) No need to think about security

**Q5:** What does the AWS Shared Responsibility Model state AWS is responsible for?
- A) Customer data
- B) IAM user permissions
- C) Security of the cloud infrastructure ✅
- D) Application-level encryption

**Q6:** Which support plan includes a Technical Account Manager (TAM)?
- A) Basic
- B) Developer
- C) Business
- D) Enterprise ✅

**Q7:** A company wants to run a web application without managing servers. Which service should they use?
- A) EC2
- B) AWS Lambda ✅
- C) Amazon EBS
- D) AWS Direct Connect

**Q8:** Which AWS service would you use to audit all API activity across your account?
- A) Amazon CloudWatch
- B) AWS Config
- C) AWS CloudTrail ✅
- D) AWS Trusted Advisor

---

## Study Tips

1. **Memorise the 6 cloud advantages** — they appear repeatedly
2. **Shared Responsibility Model** — the #1 tested topic, know it cold
3. **Know what each service does** at a high level — don't need deep technical knowledge
4. **Understand pricing models** — On-Demand vs Reserved vs Spot scenarios
5. **Well-Architected Framework 6 pillars** — usually 2-3 questions
6. **Support plans** — know Basic vs Developer vs Business vs Enterprise
7. **Free tier** — know which services are always-free vs 12-month

**Recommended study path:**
1. Read this book (done ✅)
2. Take AWS free digital training: `explore.skillbuilder.aws`
3. Do 2-3 practice exam sets (Tutorials Dojo, Whizlabs)
4. Review wrong answers — understand WHY, not just WHAT
5. Book exam when scoring 80%+ on practice tests consistently

---

## Services Deep Dive

### S3 Storage Classes — Know These Cold

S3 has multiple storage tiers. AWS charges less for tiers you access less often, but adds retrieval fees. All tiers share the same 11-nines durability (99.999999999%).

```
Tier                        Access frequency   Retrieval   Cost
─────────────────────────────────────────────────────────────────
Standard                    Frequent           Instant     $$$
Standard-IA                 Infrequent         Instant     $$  (+ retrieval fee)
One Zone-IA                 Infrequent         Instant     $   (single AZ — data loss risk)
Glacier Instant Retrieval   Archive            Millisecond $
Glacier Flexible Retrieval  Archive            Minutes–hrs $
Glacier Deep Archive        Long-term archive  12+ hours   $ (cheapest)
Intelligent-Tiering         Unknown/variable   Instant     $$  (auto-moves between tiers)
```

**Key rules the exam loves:**
- One Zone-IA: only 1 AZ → acceptable to lose if AZ fails (secondary backups, derived data)
- Intelligent-Tiering: small monitoring fee per object, no retrieval fee, best for unpredictable access
- Glacier Flexible Retrieval has 3 speed options: Expedited (1–5 min), Standard (3–5 hrs), Bulk (5–12 hrs)
- S3 Lifecycle Policies: automatically move objects between tiers after N days

**Exam trick:** The exam will describe a scenario (e.g., "medical records accessed twice a year") and ask which storage class to use. Match access frequency to the tier.

---

### EC2 Instance Families

Instance names follow a pattern: `{family}{generation}.{size}` → `t3.medium`, `c5.xlarge`

```
Family  Optimized for          Examples of use
──────────────────────────────────────────────────────────────
T       Burstable CPU          Dev environments, low-traffic web
M       General purpose        Application servers, small databases
C       Compute (CPU)          Batch processing, gaming, ML inference
R       Memory                 In-memory databases, SAP, large caches
X       Extreme memory         SAP HANA, real-time big data
I       Storage (NVMe SSD)     NoSQL databases (Cassandra, MongoDB)
D       Dense storage (HDD)    Data warehousing, Hadoop
P       GPU (ML training)      Deep learning training
G       GPU (graphics)         Video encoding, 3D rendering
```

**Sizes:** nano < micro < small < medium < large < xlarge < 2xlarge < ... < 48xlarge

**Exam trick:** "What instance type for a memory-intensive database?" → R family. "CPU-heavy batch jobs?" → C family.

---

### EC2 Purchase Options — Full Detail

```
On-Demand
  → Pay per second (Linux) or per hour (Windows)
  → No commitment, most expensive
  → Best for: unpredictable workloads, first-time testing

Reserved Instances (RI)
  → 1-year or 3-year commitment
  → Up to 72% discount vs On-Demand
  → Payment options: All Upfront (best discount), Partial Upfront, No Upfront
  → Standard RI: fixed instance type and region
  → Convertible RI: can change instance family, size, OS — smaller discount
  → Best for: steady 24/7 workloads (production databases, app servers)

Spot Instances
  → Use unused AWS capacity
  → Up to 90% discount vs On-Demand
  → AWS can reclaim with 2-minute warning
  → Best for: batch jobs, data analysis, fault-tolerant workloads
  → NOT for: databases, critical apps that can't be interrupted

Savings Plans
  → Commit to $/hour spend for 1 or 3 years
  → Applies across EC2, Lambda, Fargate
  → More flexible than Reserved Instances
  → Compute Savings Plan: any region, any family → highest flexibility
  → EC2 Savings Plan: specific region/family → higher discount than Compute SP

Dedicated Hosts
  → Physical server reserved for you
  → Most expensive
  → Required for: BYOL (bring your own license), compliance requirements

Dedicated Instances
  → Your instances run on hardware dedicated to you (but AWS may move between their dedicated hardware)
  → Cheaper than Dedicated Hosts
```

---

### VPC — Virtual Private Cloud

Think of a VPC as your own walled-off section of the AWS data center — a private network you fully control.

```
VPC
  └── Region: ap-southeast-1 (Singapore)
       ├── Availability Zone A
       │    ├── Public Subnet (10.0.1.0/24)  ← has route to internet
       │    │    └── EC2 (web server, load balancer)
       │    └── Private Subnet (10.0.2.0/24) ← no direct internet
       │         └── RDS (database)
       └── Availability Zone B
            ├── Public Subnet (10.0.3.0/24)
            └── Private Subnet (10.0.4.0/24)
```

**Key VPC components:**
```
Internet Gateway (IGW)
  → attached to VPC, allows outbound + inbound internet for public subnets

NAT Gateway
  → in a public subnet, allows private subnet instances to reach internet
  → one-way: private instances can call the internet, internet cannot reach them
  → managed by AWS (highly available within AZ)

Route Table
  → rules for where traffic goes
  → public subnet route table: 0.0.0.0/0 → Internet Gateway
  → private subnet route table: 0.0.0.0/0 → NAT Gateway

Security Group (SG)
  → stateful firewall at the instance level
  → you define: allow port 80 from anywhere, allow port 5432 from app-server SG
  → stateful: if you allow inbound port 80, return traffic is automatically allowed
  → default: deny all inbound, allow all outbound

Network ACL (NACL)
  → stateless firewall at the subnet level
  → you define: allow and deny rules, numbered in order
  → stateless: must explicitly allow both inbound AND outbound traffic
  → default NACL: allow all in both directions
```

**Security Group vs NACL — the exam's favourite comparison:**
| | Security Group | NACL |
|---|---|---|
| Level | Instance/ENI | Subnet |
| Stateful? | Yes (return auto-allowed) | No (must allow both ways) |
| Rules | Allow only | Allow AND Deny |
| Evaluation | All rules evaluated | Rules evaluated in number order |
| Default | Deny all inbound | Allow all |

**When to use NACL:** Block a specific IP range at the subnet level (e.g., block an attacker's IP).

---

### Route 53 Routing Policies

Route 53 is AWS's DNS service. Beyond mapping domain → IP, it can make intelligent routing decisions.

```
Simple
  → domain → single IP or multiple IPs returned in random order
  → no health checks
  → use for: single server, no failover needed

Weighted
  → split traffic by percentage (70% to v1, 30% to v2)
  → use for: A/B testing, gradual migration between regions

Latency
  → route user to the AWS region with lowest latency for them
  → use for: global applications that need performance

Failover
  → primary + secondary record
  → health check on primary → if unhealthy, Route 53 sends traffic to secondary
  → use for: disaster recovery, active-passive setup

Geolocation
  → route based on user's country or continent
  → use for: content localization, compliance (EU data stays in EU)

Geoproximity
  → route based on physical distance, with optional bias
  → bias: expand or shrink a region's traffic area
  → use for: shift traffic from one region to another gradually

Multi-Value Answer
  → returns up to 8 healthy records (random selection)
  → like Simple but with health checks
  → NOT a substitute for a proper load balancer — just DNS-level
```

---

### Auto Scaling

Auto Scaling automatically adjusts EC2 capacity to match demand. Never over-pay for idle servers; never run out of capacity during a spike.

```
Components:
  Launch Template   → blueprint for new instances (AMI, instance type, SG, user data)
  Auto Scaling Group (ASG) → the collection of instances
    Min capacity: never scale below this
    Max capacity: never scale above this
    Desired capacity: current target

Scaling policies:
  Manual      → you set desired capacity yourself
  Scheduled   → scale at a specific time (9am weekdays, 6pm weekdays)
  Dynamic     → respond to metrics
    Simple/Step: "if CPU > 70%, add 2 instances"
    Target tracking: "keep CPUUtilization at 50%" (recommended)
  Predictive  → ML-based forecast from historical data → pre-scale before expected spike

Scale-out: add instances
Scale-in:  remove instances (terminates oldest first by default)

Cooldown period: after a scale event, wait N seconds before next event
  → prevents thrashing (adding and removing in rapid succession)
```

**Exam trick:** Question asks about handling traffic spikes automatically → Auto Scaling. Question about distributing traffic across multiple instances → Elastic Load Balancer. Usually both are used together.

---

### Load Balancers — ALB vs NLB vs CLB

```
Classic Load Balancer (CLB)
  → legacy, supports HTTP/HTTPS and TCP
  → do not use for new applications

Application Load Balancer (ALB)
  → Layer 7 (HTTP/HTTPS)
  → route by: URL path (/api/* → backend, /images/* → S3), host header, query params
  → support for: WebSockets, HTTP/2, gRPC
  → ideal for: microservices, containers, REST APIs
  → integrates with: Cognito, WAF, Lambda

Network Load Balancer (NLB)
  → Layer 4 (TCP/UDP/TLS)
  → extremely high performance: millions of requests per second, ultra-low latency
  → static IP address per AZ (useful for whitelisting)
  → ideal for: gaming, IoT, financial trading

Gateway Load Balancer (GWLB)
  → Layer 3/4
  → deploy network appliances (firewalls, intrusion detection)
  → traffic goes: GWLB → appliance → GWLB → destination
```

---

### Cost Management Tools

```
AWS Pricing Calculator
  → estimate cost BEFORE you deploy
  → build a config (EC2 instance type, storage, transfer) → monthly estimate

AWS Cost Explorer
  → analyze PAST spending
  → filter by service, account, tag, region
  → forecast future spend
  → right-sizing recommendations (e.g. "this EC2 is underutilized, downgrade it")

AWS Budgets
  → set a spending limit or usage limit
  → get alerts when you approach or exceed
  → can trigger actions (e.g. apply an SCP to stop new resource creation)
  → types: Cost budget, Usage budget, Savings Plans budget, RI coverage budget

AWS Cost and Usage Report (CUR)
  → most detailed billing data
  → line-item breakdown of every resource, every hour
  → delivered to S3, query with Athena
  → used by FinOps teams, cost allocation reports

AWS Compute Optimizer
  → analyzes EC2, Lambda, ECS utilization
  → recommends right-sized instance types
  → uses ML on 14 days of CloudWatch metrics

AWS Savings Plans (pricing)
  → covered in Pricing Models section above
```

**Exam trick:** "How do I get alerted if my AWS bill exceeds $500?" → AWS Budgets (not Cost Explorer — that's for analysis, not alerts).

---

### AWS Organizations

When a company has multiple teams or projects, they create separate AWS accounts for isolation. AWS Organizations manages them centrally.

```
Root account
  └── Management (master) account
       ├── Dev OU
       │    ├── Dev account 1
       │    └── Dev account 2
       ├── Prod OU
       │    ├── Prod account 1
       │    └── Prod account 2
       └── Security OU
            └── Audit account

Benefits:
  Consolidated billing  → one bill for all accounts, volume discounts shared
  SCPs                  → Service Control Policies — set guardrails across accounts
  Centralized logging   → aggregate CloudTrail, Config across all accounts
  Account isolation     → if one account is compromised, others are safe
```

**Service Control Policies (SCPs):**
```
→ JSON policies attached to OUs or accounts
→ define the MAXIMUM permissions any principal can have
→ even an account's root user is subject to SCPs
→ SCPs do NOT grant permissions — they restrict what can be granted

Example SCP:
  Deny any action NOT in region us-east-1
  → developers can't accidentally deploy to an unauthorized region

Example SCP:
  Deny EC2 instance types larger than t3.medium
  → developers can't spin up expensive GPU instances
```

**AWS Control Tower:**
- Automates setting up a multi-account environment using AWS best practices
- Built on Organizations + Config + IAM + CloudTrail
- Landing Zone: a pre-configured multi-account environment
- Guardrails: preventive (SCPs) or detective (Config rules) controls

---

### Migration Services — Getting to AWS

```
AWS Migration Hub
  → central dashboard to track migrations across services
  → doesn't do the migration itself — just tracks

AWS Application Migration Service (MGN)
  → lift-and-shift (rehost) without changes
  → agent installed on source server → continuous replication → cutover
  → formerly AWS Server Migration Service (SMS)

AWS Database Migration Service (DMS)
  → migrate databases to AWS with minimal downtime
  → supports: Oracle → RDS, MySQL → Aurora, MongoDB → DynamoDB
  → can do homogeneous (MySQL → MySQL) or heterogeneous migrations
  → Schema Conversion Tool (SCT): converts schema for heterogeneous migrations
  → continuous replication mode: ongoing sync (source stays live during migration)
```

**Snow Family — Physical Data Transfer:**

When you have petabytes of data and internet transfer would take months or years, AWS ships physical devices to you.

```
Snowcone
  → smallest device: 8TB usable (HDD) or 14TB (SSD)
  → rugged, portable — fits in a backpack
  → can work offline or online (DataSync)
  → use for: edge computing, remote locations with no internet

Snowball Edge
  → 80TB usable
  → two flavors:
    Compute Optimized: 80TB + 52 vCPUs (run EC2/Lambda at the edge)
    Storage Optimized: 80TB + 40 vCPUs
  → use for: large-scale data collection, edge computing

Snowmobile
  → 100PB — a literal shipping container pulled by a truck
  → AWS sends a truck to your data center
  → use for: exabyte-scale migrations (entire data centers)

Rule of thumb: > 10TB and would take > 1 week via internet → consider Snow family
```

---

### Additional Security Services — Deeper

```
AWS Shield
  Standard (free, automatic):
    → protects all AWS customers from common DDoS attacks
    → Layer 3/4: SYN floods, UDP floods, reflection attacks
    → no configuration needed

  Advanced ($3,000/month):
    → Layer 7 DDoS protection (application layer)
    → DDoS cost protection (AWS reimburses spike in charges from attack)
    → 24/7 AWS Shield Response Team (SRT) access
    → advanced attack forensics
    → use for: high-profile apps, financial services, gaming

AWS WAF (Web Application Firewall)
  → filter HTTP/HTTPS traffic by rules
  → block: SQL injection, XSS, bad bots, specific IPs, rate limiting
  → attaches to: CloudFront, ALB, API Gateway, AppSync
  → Web ACL: collection of rules
  → Managed Rules: pre-built rule sets from AWS or marketplace vendors
  → Rate-based rules: block IPs sending > N requests per 5 minutes

Amazon GuardDuty
  → threat detection service (NOT a firewall — it detects, not blocks)
  → analyzes: CloudTrail events, VPC Flow Logs, DNS logs
  → detects: compromised instances mining crypto, unusual API calls,
             suspicious login locations, port scanning from your instances
  → no agent to install — works automatically once enabled
  → findings: severity Low/Medium/High, with details

AWS Macie
  → uses ML to scan S3 buckets for sensitive data
  → finds: credit card numbers, SSNs, passport numbers, email addresses
  → alerts: sensitive data found in a public bucket (major compliance issue)
  → use for: compliance (GDPR, PCI DSS), data governance

AWS Inspector
  → automated security assessment
  → EC2: scans for CVEs in OS packages and software (requires agent)
  → ECR container images: scans for vulnerabilities before/after push
  → Lambda functions: scans code and layers for vulnerabilities
  → generates findings with severity and remediation guidance

AWS Security Hub
  → centralized security dashboard
  → aggregates findings from GuardDuty, Inspector, Macie, IAM Access Analyzer
  → benchmarks against security standards (CIS, PCI DSS, AWS Foundational)
  → automated remediation via EventBridge rules
```

---

### Additional Networking Services

```
AWS Direct Connect
  → dedicated physical connection between your data center and AWS
  → NOT over the internet → consistent latency, higher bandwidth, more secure
  → takes weeks to provision (physical infrastructure)
  → use for: large data transfers, latency-sensitive apps, compliance
  → expensive: port charges + data transfer

AWS Site-to-Site VPN
  → encrypted tunnel over the public internet
  → much cheaper and faster to set up than Direct Connect
  → variable latency (internet-dependent)
  → two types:
    Site-to-Site VPN: connect your office/data center to AWS VPC
    Client VPN: individual user's laptop → AWS (like a corporate VPN)

AWS Global Accelerator
  → use AWS global backbone network to route traffic
  → gives you 2 static anycast IPs
  → user → nearest AWS edge location → AWS private network → your app
  → improves performance for TCP/UDP by up to 60%
  → NOT the same as CloudFront (which caches static content)
  → use for: gaming, IoT, voice/video apps

CloudFront vs Global Accelerator:
  CloudFront: caches content at edge (HTML, CSS, images, video)
  Global Accelerator: routes all traffic over AWS backbone (no caching)
```

---

## Common Exam Traps

These are the comparisons the exam loves to trick you on. Memorise these.

### Trap 1 — CloudTrail vs CloudWatch vs Config

```
CloudTrail: WHO did WHAT and WHEN
  → "Who deleted my S3 bucket?" → CloudTrail
  → Records every API call: who called it, from where, what parameters

CloudWatch: HOW IS THE SYSTEM PERFORMING
  → "What is the CPU usage of my EC2?" → CloudWatch
  → Metrics, logs, dashboards, alarms

AWS Config: WHAT CHANGED in my AWS resource configuration
  → "Did someone turn off encryption on my S3 bucket?" → AWS Config
  → Tracks configuration state over time, detects drift from desired state
```

### Trap 2 — SNS vs SQS vs EventBridge

```
SNS (Simple Notification Service)
  → Pub/Sub: one publisher → many subscribers simultaneously
  → Push model: subscribers receive messages when published
  → Protocols: email, SMS, HTTP, Lambda, SQS
  → Use for: send same event to multiple systems at once
  → Example: order placed → notify inventory, billing, and shipping simultaneously

SQS (Simple Queue Service)
  → Queue: messages wait until a consumer polls
  → Pull model: consumer checks for messages
  → Decouples producer and consumer
  → Use for: buffer between services, handle traffic spikes
  → Example: user uploads a video → SQS queue → video processing Lambda

EventBridge
  → Event bus: route events based on rules and patterns
  → Sources: 160+ AWS services + custom apps + SaaS
  → Filters: match on event content (only if order.status = "failed")
  → Use for: decoupled microservices reacting to events, scheduled jobs
  → Think of it as a smart router for events

Fan-out pattern (SNS → SQS):
  SNS receives one message → delivers to multiple SQS queues
  Each queue has its own consumer
  → decoupled, each consumer works at its own pace
```

### Trap 3 — GuardDuty vs Inspector vs Macie

```
GuardDuty → Active threats happening RIGHT NOW
  "Someone is mining crypto on my EC2"
  "My Lambda is calling unusual IPs"

Inspector → Known vulnerabilities in my software
  "My EC2 has CVE-2023-1234 in OpenSSL"
  "My container has a critical vulnerability"

Macie → Sensitive data in my S3 buckets
  "S3 bucket in us-east-1 contains 142 credit card numbers"
  "Public bucket has files with SSNs"
```

### Trap 4 — RDS Multi-AZ vs Read Replica

```
Multi-AZ
  → Synchronous replication to standby in another AZ
  → Standby is NOT accessible (no reads/writes to it)
  → Automatic failover if primary fails (60-120 seconds)
  → Purpose: HIGH AVAILABILITY (not performance)
  → Exam: "survive a database failure" → Multi-AZ

Read Replica
  → Asynchronous replication to one or more replicas
  → Replicas ARE accessible (read-only)
  → Can be in different region
  → Purpose: SCALE READS (not HA)
  → Exam: "reduce load on primary database", "handle read-heavy workload" → Read Replica
  → Replicas can be promoted to standalone DB (takes time)
```

### Trap 5 — Dedicated Hosts vs Dedicated Instances

```
Dedicated Instances
  → Your EC2 instances run on hardware used only by your account
  → Hardware may change between starts
  → Per-instance pricing

Dedicated Hosts
  → You rent a SPECIFIC physical server
  → You can see the socket and core count
  → Required for: BYOL (Windows Server, SQL Server, Oracle per-socket/core licenses)
  → More expensive, but amortizes your existing licenses
```

### Trap 6 — S3 vs EBS vs EFS

```
S3 (object storage)
  → Store any file (images, videos, backups, static websites)
  → Access via HTTP REST API or SDK (not a mountable drive)
  → Unlimited capacity
  → Ideal for: backups, media storage, data lakes, static websites

EBS (block storage)
  → "Hard drive" attached to ONE EC2 instance (usually)
  → High performance, low latency
  → Data persists after instance stop (unlike instance store)
  → Ideal for: OS disk, databases on EC2

EFS (elastic file system)
  → Shared NFS file system
  → Multiple EC2 instances can mount it SIMULTANEOUSLY
  → Auto-scales storage capacity
  → More expensive than EBS
  → Ideal for: shared home directories, web content serving across fleet

Instance Store
  → Physically attached to the host — very fast
  → EPHEMERAL: data is LOST when instance stops or terminates
  → Ideal for: temp files, caches, buffers (data you can afford to lose)
```

### Trap 7 — Elastic Beanstalk vs CloudFormation vs OpsWorks

```
CloudFormation
  → Pure infrastructure as code
  → You define every resource in YAML/JSON
  → Maximum control, maximum complexity
  → Use for: complex environments, team with IaC expertise

Elastic Beanstalk
  → PaaS — upload your code, AWS manages the infra
  → EC2, ASG, ALB, RDS provisioned automatically
  → Limited control (can customize with .ebextensions)
  → Use for: developers who want to focus on code, not infra

OpsWorks
  → Managed Chef and Puppet
  → Define server configuration as code (recipes, cookbooks)
  → Use for: teams already using Chef/Puppet

SAM (Serverless Application Model)
  → Extension of CloudFormation for serverless apps
  → Simplified syntax for Lambda, API Gateway, DynamoDB
  → Use for: serverless applications
```

### Trap 8 — What does "High Availability" mean vs "Fault Tolerance"?

```
High Availability (HA)
  → System remains accessible despite failures
  → Brief downtime may occur during failover
  → Example: RDS Multi-AZ (60-120s failover)
  → "99.99% uptime" = about 52 minutes downtime per year

Fault Tolerant
  → System continues operating with ZERO downtime during failure
  → Requires redundant components running simultaneously
  → Example: multi-region active-active with Route 53 failover
  → More complex and expensive than HA

Disaster Recovery (DR)
  → Recovery from a catastrophic event (entire region down)
  → Strategies:
    Backup & Restore: cheapest, slowest (hours)
    Pilot Light: minimal infrastructure always on (minutes)
    Warm Standby: scaled-down version always running (minutes)
    Multi-Site Active/Active: full duplication, instant failover
```

---

## Extended Exam Q&A — 55 More Questions

### Domain 1: Cloud Concepts

**Q9:** Which of the following BEST describes the concept of "elasticity" in cloud computing?
- A) The ability to move workloads between regions
- B) The ability to automatically scale resources up or down based on demand ✅
- C) The durability of stored data across availability zones
- D) The process of encrypting data in transit

**Q10:** A company is concerned about the upfront cost of migrating to AWS. Which cloud advantage directly addresses this concern?
- A) Stop spending money on data centers
- B) Trade capital expense for variable expense ✅
- C) Increase speed and agility
- D) Benefit from massive economies of scale

**Q11:** A retail company deploys their e-commerce platform in AWS us-east-1. They want to serve European customers with low latency. What should they do?
- A) Increase the EC2 instance size in us-east-1
- B) Enable CloudFront caching in us-east-1
- C) Deploy the application in eu-west-1 as well ✅
- D) Use Direct Connect to connect Europe to us-east-1

**Q12:** What is an AWS Availability Zone?
- A) A geographic location where AWS has a presence
- B) One or more discrete data centers with redundant power, networking, and connectivity ✅
- C) A CDN point of presence for CloudFront
- D) A private network within AWS

**Q13:** A company runs all workloads on-premises but wants to use AWS for disaster recovery. Which cloud model does this describe?
- A) Public cloud
- B) Private cloud
- C) Hybrid cloud ✅
- D) Multi-cloud

**Q14:** Which of the following is true about AWS edge locations?
- A) They are the same as Availability Zones
- B) There are fewer edge locations than AWS Regions
- C) They are used primarily by CloudFront and Route 53 ✅
- D) Edge locations run full AWS services like EC2

**Q15:** A startup wants to experiment with AWS services without a long-term commitment. Which EC2 pricing model is most appropriate?
- A) Reserved Instances (3-year)
- B) Spot Instances
- C) On-Demand ✅
- D) Dedicated Hosts

**Q16:** Which of the following is NOT one of the six advantages of cloud computing according to AWS?
- A) Trade capital expense for variable expense
- B) Go global in minutes
- C) Eliminate all security vulnerabilities ✅
- D) Benefit from massive economies of scale

---

### Domain 2: Security & Compliance

**Q17:** Which AWS service helps you identify and remediate security vulnerabilities in your EC2 instances automatically?
- A) Amazon GuardDuty
- B) AWS Inspector ✅
- C) AWS Macie
- D) AWS Config

**Q18:** An IAM policy is attached to a user granting S3 full access. An SCP on the account denies S3 DeleteObject. What can the user do?
- A) Delete S3 objects (IAM policy overrides SCP)
- B) The user cannot delete S3 objects ✅
- C) The user cannot access S3 at all
- D) SCPs only apply to the root user

*Explanation: SCPs set the maximum permission boundary. Even if IAM grants it, the SCP denial wins.*

**Q19:** Which service provides hardware-level DDoS protection for ALL AWS customers automatically at no extra cost?
- A) AWS Shield Advanced
- B) AWS WAF
- C) AWS Shield Standard ✅
- D) Amazon GuardDuty

**Q20:** A company needs to store and automatically rotate database credentials. Which service should they use?
- A) AWS KMS
- B) AWS Systems Manager Parameter Store
- C) AWS Secrets Manager ✅
- D) Amazon Cognito

**Q21:** Which of the following is the customer's responsibility under the Shared Responsibility Model for Amazon RDS?
- A) Patching the database engine
- B) Physical security of servers
- C) Managing the hypervisor
- D) Managing database user access and permissions ✅

**Q22:** What is the AWS principle of least privilege?
- A) Always grant Administrator access to avoid permission errors
- B) Grant only the minimum permissions required to perform a task ✅
- C) Use only AWS managed IAM policies
- D) Rotate IAM access keys every 7 days

**Q23:** Which AWS service provides centralized logging of all API activity across an AWS account?
- A) Amazon CloudWatch
- B) AWS CloudTrail ✅
- C) AWS Config
- D) Amazon GuardDuty

**Q24:** A security auditor needs to prove that AWS data centers meet ISO 27001 standards. Where should they look?
- A) AWS CloudTrail
- B) AWS Security Hub
- C) AWS Artifact ✅
- D) AWS Config

**Q25:** An employee's IAM user has no permissions. They are added to the "developers" group which has S3 read access. What can the employee now do?
- A) Nothing — user-level policies override group policies
- B) Read S3 objects ✅
- C) Full S3 access because they joined a group
- D) The permissions will take 24 hours to activate

**Q26:** Which IAM entity should you use to allow an EC2 instance to call the DynamoDB API without storing credentials?
- A) IAM User with access keys stored in user data
- B) IAM Group
- C) IAM Role attached to the EC2 instance ✅
- D) Root account credentials

**Q27:** Which of the following BEST describes what AWS Macie does?
- A) Detects DDoS attacks in real time
- B) Scans EC2 instances for CVEs
- C) Discovers sensitive data like PII in S3 buckets ✅
- D) Monitors suspicious account activity

---

### Domain 3: Cloud Technology & Services

**Q28:** A company needs to run an application that processes images as soon as they are uploaded to S3, without running servers 24/7. Which service is BEST?
- A) Amazon EC2 Auto Scaling
- B) AWS Lambda ✅
- C) Amazon ECS
- D) AWS Batch

**Q29:** Which storage service is designed to be mounted simultaneously by multiple EC2 instances?
- A) Amazon EBS
- B) Amazon S3
- C) Amazon EFS ✅
- D) Instance Store

**Q30:** A company needs a fully managed relational database that is 5x faster than standard MySQL and automatically replicates 6 copies of data across 3 AZs. Which service is this?
- A) Amazon RDS for MySQL
- B) Amazon Aurora ✅
- C) Amazon DynamoDB
- D) Amazon Redshift

**Q31:** Which AWS service would you use to migrate from an on-premises Oracle database to Amazon Aurora PostgreSQL?
- A) AWS Snow Family
- B) AWS Application Migration Service
- C) AWS Database Migration Service ✅
- D) Amazon Data Pipeline

**Q32:** A company is running a social media platform that needs to handle unpredictable spikes of millions of concurrent users. Which database would handle massive scale automatically without managing servers?
- A) Amazon RDS Multi-AZ
- B) Amazon DynamoDB ✅
- C) Amazon ElastiCache
- D) Amazon Redshift

**Q33:** Which service enables you to run containers without managing the underlying infrastructure (completely serverless containers)?
- A) Amazon ECS on EC2
- B) Amazon EKS
- C) AWS Fargate ✅
- D) AWS Lambda

**Q34:** A company wants to cache frequently accessed database query results in memory to reduce database load. Which service should they use?
- A) Amazon DynamoDB DAX
- B) Amazon ElastiCache ✅
- C) Amazon CloudFront
- D) AWS Global Accelerator

*Explanation: ElastiCache for general DB caching. DAX is specifically for DynamoDB.*

**Q35:** Which of the following correctly describes the difference between CloudFront and Global Accelerator?
- A) CloudFront is faster because it uses edge locations
- B) CloudFront caches content at edge locations; Global Accelerator routes traffic over the AWS backbone without caching ✅
- C) Global Accelerator is only for static content
- D) CloudFront works with TCP/UDP; Global Accelerator is HTTP only

**Q36:** A company has sensitive data that must stay within Australia due to regulatory requirements. Which AWS infrastructure concept directly supports this?
- A) Availability Zones
- B) Edge Locations
- C) AWS Regions ✅
- D) AWS Local Zones

**Q37:** Which AWS service tracks configuration changes to your AWS resources over time and can alert when a resource drifts from a desired state?
- A) AWS CloudTrail
- B) Amazon CloudWatch
- C) AWS Config ✅
- D) AWS Systems Manager

**Q38:** A small startup wants the simplest possible way to deploy a Node.js web application to AWS, without learning infrastructure concepts. Which service is BEST?
- A) Amazon EC2
- B) AWS CloudFormation
- C) AWS Elastic Beanstalk ✅
- D) Amazon EKS

**Q39:** Which AWS service allows you to define your entire AWS infrastructure using YAML or JSON code?
- A) AWS Systems Manager
- B) AWS CloudFormation ✅
- C) AWS OpsWorks
- D) AWS Config

**Q40:** A company receives 10,000 orders per second at peak time. They want to decouple the order-taking service from the fulfillment service to prevent overload. Which service should they use?
- A) Amazon SNS
- B) Amazon SQS ✅
- C) Amazon EventBridge
- D) AWS Step Functions

**Q41:** A news website needs to deliver the same article to millions of readers worldwide with very low latency. Which service should they use?
- A) AWS Global Accelerator
- B) Amazon Route 53 with latency routing
- C) Amazon CloudFront ✅
- D) AWS Direct Connect

**Q42:** Which of the following is TRUE about AWS Lambda?
- A) Lambda requires you to configure an EC2 instance to run your code
- B) Lambda functions can run for a maximum of 15 minutes ✅
- C) Lambda is only available in us-east-1
- D) Lambda does not support Python

**Q43:** A company needs to connect their on-premises data center to AWS with a consistent 10 Gbps private connection (not over the internet). Which service should they use?
- A) AWS Site-to-Site VPN
- B) AWS Direct Connect ✅
- C) Amazon CloudFront
- D) AWS Transit Gateway

---

### Domain 4: Billing, Pricing & Support

**Q44:** A company needs to receive an email when their AWS spending exceeds $1,000 in a month. Which service should they use?
- A) AWS Cost Explorer
- B) AWS Pricing Calculator
- C) AWS Budgets ✅
- D) AWS Trusted Advisor

**Q45:** Which AWS support plan is the MINIMUM required to get 24/7 phone and chat access to Cloud Support Engineers?
- A) Developer
- B) Business ✅
- C) Enterprise On-Ramp
- D) Enterprise

**Q46:** A company has a 3-year contract with AWS for a specific EC2 instance type that they use 24/7. Which pricing model gives the MOST savings?
- A) On-Demand
- B) Spot Instances
- C) Reserved Instances (3-year, All Upfront) ✅
- D) Savings Plans

**Q47:** Which of the following is NOT included in the AWS Free Tier's "Always Free" category?
- A) 1 million Lambda requests per month
- B) 25GB DynamoDB storage
- C) 750 hours of EC2 t2.micro per month ✅
- D) Basic CloudWatch monitoring

*Explanation: EC2 t2.micro 750 hours is 12-month free tier, not always free.*

**Q48:** A company uses many different AWS services across 5 separate AWS accounts. They want one consolidated bill. What should they set up?
- A) AWS IAM Identity Center
- B) AWS Organizations with consolidated billing ✅
- C) AWS Cost Explorer
- D) AWS Billing Dashboard

**Q49:** Which pillar of the Well-Architected Framework focuses on the ability to recover from infrastructure failures?
- A) Security
- B) Performance Efficiency
- C) Reliability ✅
- D) Operational Excellence

**Q50:** An EC2 instance is idle 70% of the time but is still incurring charges. Which Trusted Advisor category would flag this?
- A) Security
- B) Fault Tolerance
- C) Cost Optimization ✅
- D) Service Limits

**Q51:** Which of the following correctly describes Spot Instances?
- A) Reserved capacity with 72% discount for 1-year commitment
- B) Unused EC2 capacity sold at up to 90% discount, can be reclaimed with 2-minute notice ✅
- C) Dedicated physical hardware exclusively for your account
- D) EC2 instances that automatically scale based on CPU usage

**Q52:** A company wants AWS's expert recommendations on how to improve security, performance, and reduce costs automatically. Which service provides this?
- A) AWS Security Hub
- B) AWS Trusted Advisor ✅
- C) AWS Config
- D) Amazon Inspector

**Q53:** How does AWS calculate the "Total Cost of Ownership" benefit when migrating from on-premises?
- A) Only compares hardware costs
- B) Compares hardware, software licenses, facilities, power, cooling, and staffing costs ✅
- C) Only includes the cost of the AWS services used
- D) Calculates the cost over a 10-year period only

**Q54:** Which of the following support plans includes access to a Technical Account Manager (TAM)?
- A) Basic and Developer
- B) Business only
- C) Enterprise On-Ramp and Enterprise ✅
- D) All paid plans

**Q55:** A company is in the process of migrating to AWS and wants to estimate how much their new architecture will cost before committing. Which tool should they use?
- A) AWS Cost Explorer
- B) AWS Budgets
- C) AWS Pricing Calculator ✅
- D) AWS Compute Optimizer

**Q56:** Which of the following statements about Savings Plans is TRUE?
- A) Savings Plans only apply to EC2
- B) Savings Plans require you to specify the instance type and region upfront
- C) Compute Savings Plans apply to EC2, Fargate, and Lambda ✅
- D) Savings Plans are more expensive than On-Demand instances

**Q57:** What is the maximum response time for a production system outage under the AWS Business support plan?
- A) 12–24 hours
- B) 4 hours
- C) 1 hour ✅
- D) 15 minutes

**Q58:** A developer accidentally deleted all objects in an S3 bucket. Which feature should have been enabled to prevent permanent data loss?
- A) S3 Transfer Acceleration
- B) S3 Versioning ✅
- C) S3 Intelligent-Tiering
- D) S3 Cross-Region Replication

**Q59:** A media company stores 500TB of archival footage that is accessed approximately once per year. Which S3 storage class offers the lowest cost for this use case?
- A) S3 Standard
- B) S3 Standard-IA
- C) S3 Glacier Flexible Retrieval
- D) S3 Glacier Deep Archive ✅

**Q60:** Which AWS service provides automated recommendations for right-sizing EC2 instances based on actual CloudWatch utilization data?
- A) AWS Trusted Advisor
- B) AWS Compute Optimizer ✅
- C) AWS Cost Explorer
- D) AWS Config

**Q61:** A bank running workloads on AWS needs to demonstrate compliance with PCI DSS. Which service lets them download compliance reports and sign Business Associate Agreements?
- A) AWS Security Hub
- B) AWS Audit Manager
- C) AWS Artifact ✅
- D) Amazon GuardDuty

**Q62:** An e-commerce company wants to send promotional emails to 2 million customers when a sale event starts. Which service is BEST for this?
- A) Amazon SQS
- B) Amazon SNS ✅
- C) Amazon EventBridge
- D) AWS Step Functions

**Q63:** A company runs a machine learning training job that takes 12 hours and can be restarted if interrupted. Which pricing model offers the BEST cost savings?
- A) On-Demand
- B) Reserved Instances
- C) Spot Instances ✅
- D) Savings Plans

---

## Study Tips

1. **Memorise the 6 cloud advantages** — they appear repeatedly
2. **Shared Responsibility Model** — the #1 tested topic, know it cold
3. **Know what each service does** at a high level — don't need deep technical knowledge
4. **Understand pricing models** — On-Demand vs Reserved vs Spot scenarios
5. **Well-Architected Framework 6 pillars** — usually 2-3 questions
6. **Support plans** — know Basic vs Developer vs Business vs Enterprise
7. **Free tier** — know which services are always-free vs 12-month
8. **Service comparison traps** — CloudTrail vs CloudWatch, SNS vs SQS, Multi-AZ vs Read Replica
9. **Storage class selection** — match access frequency to S3 tier
10. **Migration services** — Snow family for physical; DMS for databases; MGN for servers

**Recommended study path:**
1. Read this guide completely
2. Take AWS free digital training: `explore.skillbuilder.aws`
3. Do 2-3 practice exam sets (Tutorials Dojo, Whizlabs)
4. Review wrong answers — understand WHY, not just WHAT
5. Book exam when scoring 80%+ on practice tests consistently

**Day-before checklist:**
- [ ] Can you explain the Shared Responsibility Model with 3 examples?
- [ ] Do you know all 6 cloud advantages?
- [ ] Can you pick the right pricing model for any scenario?
- [ ] Do you know the 6 Well-Architected pillars?
- [ ] Can you name the 5 support plans and their response times?
- [ ] Do you know when to use S3 vs EBS vs EFS?
- [ ] Can you explain Multi-AZ vs Read Replica?
- [ ] Do you know what GuardDuty, Inspector, and Macie each do?
