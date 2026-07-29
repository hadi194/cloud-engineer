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
