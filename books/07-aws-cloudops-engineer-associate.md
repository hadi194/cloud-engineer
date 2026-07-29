# AWS Certified CloudOps Engineer — Associate (formerly SysOps) (SOA-C02)
### Level: Associate | Deploy, manage, and operate workloads on AWS

---

## Exam Facts

| | |
|---|---|
| Code | SOA-C02 |
| Questions | 65 multiple choice + exam lab (hands-on) |
| Duration | 180 minutes |
| Pass score | 720 / 1000 |
| Cost | USD $150 |
| Validity | 3 years |
| Prerequisites | Cloud Practitioner + some hands-on AWS experience |

**Who is this for:** System administrators, operations engineers, DevOps engineers who manage and maintain AWS infrastructure day-to-day. More ops-focused than developer or architect certs — you need to actually know how to do things, not just design them.

**⚠️ Unique feature:** This exam includes a **hands-on exam lab** where you perform real tasks in the AWS console. You must actually know how to do things, not just recognise answers.

---

## The 6 Exam Domains

| Domain | Weight |
|---|---|
| 1. Monitoring, Logging and Remediation | 20% |
| 2. Reliability and Business Continuity | 16% |
| 3. Deployment, Provisioning and Automation | 18% |
| 4. Security and Compliance | 16% |
| 5. Networking and Content Delivery | 18% |
| 6. Cost and Performance Optimization | 12% |

---

## Domain 1 — Monitoring, Logging and Remediation (20%)

### CloudWatch Deep Dive

```
Metrics:
  Namespace    → logical grouping (AWS/EC2, AWS/RDS, Custom/MyApp)
  Metric       → the measured value (CPUUtilization)
  Dimension    → filter/segment (InstanceId, AutoScalingGroupName)
  Resolution   → standard (1 minute) or high resolution (1 second, extra cost)
  Statistics   → Average, Min, Max, Sum, p90, p95, p99

Custom Metrics (push from your app):
  aws cloudwatch put-metric-data \
    --namespace MyApp/Performance \
    --metric-name RequestLatency \
    --value 52.5 \
    --unit Milliseconds

Metric Math:
  → combine metrics into formulas
  → e.g. error rate = errors / total_requests * 100
  → create alarms on the calculated metric

Composite Alarms:
  → combine multiple alarms with AND/OR logic
  → alarm only when CPU > 90% AND connections > 1000
  → reduces alarm noise
```

### CloudWatch Logs Deep Dive

```
Log Groups  → one per application (retention: 1 day to 10 years or never)
Log Streams → one per instance/container/Lambda invocation

CloudWatch Logs Insights:
  → SQL-like query language for log analysis
  → example:
    fields @timestamp, @message
    | filter @message like /ERROR/
    | stats count() as errors by bin(5m)
    | sort errors desc

Metric Filters:
  → extract metrics from logs
  → e.g. count ERROR occurrences → create CloudWatch metric → create alarm

Log Subscriptions:
  → stream logs to Lambda (real-time processing)
  → stream to Kinesis (aggregate from multiple accounts)
  → cross-account log aggregation (central security account)

CloudWatch Agent:
  → install on EC2 to push OS metrics and logs
  → metrics not available by default: memory, disk usage, process count
  → configure via SSM (no SSH needed)
```

### Automated Remediation Patterns

```
Pattern 1: CloudWatch Alarm → SNS → Lambda → fix
  Example: EC2 CPU > 90% → Lambda terminates and replaces instance

Pattern 2: EventBridge → Lambda → fix
  Example: S3 bucket becomes public → EventBridge rule → Lambda makes it private

Pattern 3: AWS Config Rule → Remediation Action (SSM)
  Example: EC2 without required tag → auto-tag via SSM Automation document

Pattern 4: Systems Manager Automation
  → pre-built runbooks for common remediation
  → AWSSupport-RestartEC2Instance
  → AWS-StopEC2Instance
  → custom automation documents (YAML)
```

### AWS Config

```
What it does:
  → records configuration of every AWS resource over time
  → detects drift from desired configuration
  → evaluates compliance against rules

Config Rules:
  AWS Managed Rules (pre-built):
    → s3-bucket-public-read-prohibited
    → ec2-instances-in-vpc
    → restricted-ssh (no port 22 open to 0.0.0.0/0)
    → rds-storage-encrypted
    → required-tags

  Custom Rules → Lambda function evaluates compliance

Remediation:
  → auto-remediation via SSM Automation
  → e.g. non-compliant resource → trigger SSM document to fix it

Config Aggregator:
  → collect Config data from multiple accounts/regions
  → central compliance dashboard
```

---

## Domain 2 — Reliability and Business Continuity (16%)

### Backup Strategies

```
AWS Backup:
  → centralized backup management across services
  → EC2, RDS, DynamoDB, EFS, S3, FSx, Storage Gateway
  → backup plans: frequency, retention, cold storage transition
  → cross-region and cross-account backup copy
  → vault lock: WORM (Write Once Read Many) compliance

EBS Snapshots:
  → point-in-time backup, stored in S3 (managed by AWS)
  → incremental (only changed blocks after first snapshot)
  → can copy to another region
  → create from running instance (application consistent if using VSS on Windows)

RDS Automated Backups:
  → daily backup during maintenance window
  → transaction logs every 5 minutes → point-in-time recovery
  → retention: 0-35 days
  → free storage up to DB instance size

Data Lifecycle Manager (DLM):
  → automate EBS snapshot creation and deletion
  → define policies: every 12 hours, keep 7 days
  → removes need to manually manage snapshots
```

### High Availability Patterns

```
EC2:
  → Auto Scaling across 2+ AZs
  → use ALB with health checks
  → set min=2 so one AZ failure doesn't take down the app

RDS:
  → Multi-AZ for automatic failover (~60 seconds)
  → Read Replicas for read scaling (not HA — manual failover needed)

ElastiCache:
  → Redis with Multi-AZ and automatic failover
  → Redis Cluster mode: shard data across multiple nodes

Route 53 Health Checks:
  → check endpoint health every 10-30 seconds
  → failover routing → switch to secondary if primary fails
  → calculated health checks → combine multiple checks (AND/OR)

Elastic IP:
  → static public IP that you remap instantly to a new instance
  → use for single-instance apps that need a fixed IP
```

### EC2 Instance Recovery

```
CloudWatch Alarm → EC2 Status Check Failed → Recover Instance
  → moves instance to new hardware
  → keeps same instance ID, private IP, Elastic IP, EBS volumes
  → data in instance store LOST (instance store is ephemeral)

EC2 Auto Recovery:
  → set alarm on StatusCheckFailed_System metric
  → action: Recover this instance
```

---

## Domain 3 — Deployment, Provisioning and Automation (18%)

### Systems Manager (SSM) ← KEY SERVICE FOR THIS EXAM

SSM is the Swiss Army knife for managing EC2 at scale — no SSH needed.

```
SSM Agent:
  → pre-installed on Amazon Linux 2/2023, Windows Server
  → communicates with SSM service via HTTPS (outbound 443)
  → instance needs IAM role with AmazonSSMManagedInstanceCore

Key SSM Features:

Session Manager:
  → browser-based shell into EC2 without SSH/bastion
  → no inbound ports needed
  → audit trail in CloudTrail

Run Command:
  → run shell/PowerShell commands on 1 to 1000s of instances
  → target by tag, resource group, or instance ID
  → no SSH, no bastion, results in CloudWatch Logs

Patch Manager:
  → define patch baselines (approved patches)
  → schedule patching via Maintenance Windows
  → scan instances for missing patches
  → auto-patch based on severity

State Manager:
  → keep instances in a defined state
  → e.g. always have CloudWatch agent installed

Automation:
  → multi-step workflows (runbooks)
  → built-in: restart EC2, create AMI, update CloudFormation
  → custom: define your own automation document
  → run on schedule or triggered by events

Inventory:
  → collect OS, application, network config from all instances
  → query: which instances have Python 3.9 installed?

Parameter Store:
  → store config and secrets
  → Standard tier: free, 4KB limit
  → Advanced tier: paid, 8KB limit, parameter policies (expiry, notification)
```

### CloudFormation Operations

```
Stack operations:
  Create → provision new resources
  Update → change stack (creates ChangeSet first)
  Delete → remove all resources in stack
  Drift Detection → find manual changes

Stack Sets:
  → deploy same template to multiple accounts/regions
  → useful for org-wide baseline (CloudTrail, Config, IAM roles)
  → managed by org master account or delegated admin

Rollback:
  → failed create → rollback, delete all created resources
  → failed update → rollback to previous state
  → manual rollback trigger: if you spot an issue mid-deployment

Stack Policies:
  → prevent accidental updates to specific resources
  → e.g. prevent deletion of RDS instance during stack update
```

### EC2 Image Builder

```
Automates creation and maintenance of EC2 AMIs:
  1. Define base image (Amazon Linux 2023)
  2. Define components (install packages, harden OS, run tests)
  3. Schedule builds (e.g. every week to pick up security patches)
  4. Test the new AMI automatically
  5. Distribute to target regions
  6. Auto Scaling uses new AMI on next refresh
```

---

## Domain 4 — Security and Compliance (16%)

### GuardDuty — Threat Detection

```
Analyses:
  CloudTrail logs  → unusual API calls (e.g. crypto mining APIs)
  VPC Flow Logs    → unusual network traffic
  DNS logs         → communication with known malicious domains
  S3 access logs   → unusual access patterns

Findings severity: Low / Medium / High / Critical
Auto-remediation: EventBridge → Lambda → block IP (WAF, NACL)

Enable with one click per account/region
Suppression rules → ignore known false positives
Multi-account: GuardDuty administrator + member accounts
```

### AWS Security Hub

```
Aggregates findings from:
  GuardDuty, Inspector, Macie, IAM Access Analyzer, Config
  Plus third-party tools (CrowdStrike, Palo Alto, etc.)

Standards compliance checks:
  AWS Foundational Security Best Practices
  CIS AWS Foundations Benchmark
  PCI DSS

Central dashboard → security posture across all accounts
Automated response → EventBridge integration
```

### IAM Operations

```
IAM Access Analyzer:
  → find resources shared with external accounts/internet
  → e.g. S3 bucket publicly accessible, cross-account role

IAM Credential Report:
  → CSV of all users: last login, MFA status, key rotation date
  → audit users who haven't rotated keys in 90+ days
  → generate: aws iam generate-credential-report

Password Policy:
  → minimum length, require symbols/numbers, prevent reuse
  → force rotation (e.g. every 90 days)

Service Control Policies (SCPs):
  → org-level guardrails that override IAM
  → e.g. nobody can disable CloudTrail regardless of IAM permissions
  → e.g. all resources must be in ap-southeast-2 only
```

---

## Domain 5 — Networking and Content Delivery (18%)

### VPC Advanced Operations

```
VPC Flow Logs:
  → capture IP traffic metadata (not content)
  → publish to CloudWatch Logs or S3
  → analyze with Athena or CloudWatch Logs Insights
  → troubleshoot connectivity: ACCEPT/REJECT per flow

Example flow log:
  2 123456789 eni-abc123 10.0.1.5 10.0.2.3 80 54321 6 10 840 ACCEPT

  Fields: version, account, eni, src-ip, dst-ip, dst-port, src-port, protocol, packets, bytes, action

Reachability Analyzer:
  → test if path exists between two resources (without sending traffic)
  → diagnose: "why can't my EC2 reach this RDS?"
  → shows where the path breaks (SG, NACL, route table, etc.)

Network Access Analyzer:
  → find unintended network access
  → e.g. which EC2 instances are reachable from internet?
```

### Route 53 Routing Policies

```
Simple          → one record, one value — basic DNS
Weighted        → split traffic by percentage (A/B testing)
Latency         → route to lowest-latency region for the user
Failover        → primary/secondary, switch if primary health check fails
Geolocation     → route based on user's country/continent
Geoproximity    → route based on distance (with bias adjustment)
Multivalue      → up to 8 healthy records returned (basic load balancing)
IP-based        → route based on client's IP CIDR block

Health Checks:
  → HTTP/HTTPS/TCP checks every 10-30 seconds
  → from 15 global health checkers
  → string matching (check response body contains "healthy")
  → calculated: combine multiple checks (AND/OR)
```

### CloudFront Operations

```
Origins:
  S3 bucket         → static files
  ALB               → dynamic content
  EC2               → direct to instance (not recommended)
  Custom HTTP       → any HTTP server

Origin Access Control (OAC):
  → restrict S3 access so only CloudFront can read objects
  → S3 bucket policy allows CloudFront service principal only
  → users cannot bypass CloudFront and access S3 directly

Cache Behaviors:
  → path patterns with different cache settings
  → /api/* → no cache, forward to ALB
  → /static/* → cache 1 year, compress

Invalidations:
  → /images/* → invalidate all cached images
  → /* → invalidate everything (use after deployment)
  → Free: 1,000 paths/month. $0.005/path after.

CloudFront Functions vs Lambda@Edge:
  CloudFront Functions → lightweight JS, runs at edge, microseconds, cheaper
                         use for: URL rewriting, header manipulation, auth
  Lambda@Edge          → full Lambda, runs at regional edge, milliseconds, expensive
                         use for: complex auth, A/B testing, dynamic content
```

### Load Balancer Operations

```
ALB (Application) → HTTP/HTTPS, Layer 7, path/host routing
NLB (Network)     → TCP/UDP, Layer 4, ultra-low latency, static IP
GLB (Gateway)     → GENEVE protocol, route traffic to appliances

ALB Access Logs:
  → enable to log all requests to S3
  → troubleshoot: 5xx errors, slow requests, client IPs

Connection Draining (Deregistration Delay):
  → wait for in-flight requests to complete before removing instance from ALB
  → default: 300 seconds
  → reduce for fast deployments (set to 30s for stateless apps)

Target Group health checks:
  → check /health endpoint, expect 200 response
  → healthy threshold: 3 checks, unhealthy: 2 checks
  → customize for your app's startup time (HealthCheckGracePeriodSeconds)
```

---

## Domain 6 — Cost and Performance Optimization (12%)

### Cost Tools

```
Cost Explorer:
  → visualize spending by service, region, tag, account
  → forecast next 12 months based on historical patterns
  → Reserved Instance recommendations

Budgets:
  → set spending limits and get alerted when exceeded
  → budget types: cost, usage, RI/Savings Plans coverage
  → alert at 80%, 100%, forecasted 100%

Cost Allocation Tags:
  → tag resources: Project, Environment, Team
  → see spending broken down by tag in Cost Explorer
  → activate tags: AWS console → Billing → Cost Allocation Tags

Trusted Advisor Cost Checks:
  → idle EC2 instances (< 10% CPU for 14 days)
  → unassociated Elastic IPs ($0.005/hour when unattached)
  → underutilized EBS volumes
  → unattached load balancers
```

### Compute Optimizer

```
Analyses CloudWatch metrics and recommends right-sizing:
  EC2 instances → downsize or change family
  Lambda functions → increase memory (may be cheaper due to shorter duration)
  EBS volumes → reduce provisioned IOPS if underutilized
  ECS on Fargate → right-size CPU and memory

Findings:
  Over-provisioned → downsize to save cost
  Under-provisioned → upsize to fix performance
  Optimized → already right-sized
```

---

## Hands-On Lab Preparation

The SOA-C02 exam includes a real AWS console lab. Practice these tasks:

### Lab 1 — EC2 Operations
```bash
# Launch EC2 with SSM role (no SSH key)
# Connect via Session Manager
# Install CloudWatch agent
# Create CloudWatch alarm on memory usage
# Create Auto Scaling policy based on alarm
```

### Lab 2 — Monitoring Setup
```bash
# Create CloudWatch dashboard with key metrics
# Create metric filter on Lambda error logs
# Create alarm → SNS topic → email notification
# Enable AWS Config rule: restricted-ssh
# Configure auto-remediation for non-compliant resources
```

### Lab 3 — Backup and Recovery
```bash
# Create RDS snapshot manually
# Restore RDS from snapshot to new instance
# Create DLM policy for EBS snapshots every 12 hours
# Test EC2 instance recovery (simulate failure)
```

### Lab 4 — Networking
```bash
# Enable VPC Flow Logs → CloudWatch Logs
# Query flow logs with CloudWatch Logs Insights
# Use Reachability Analyzer to test EC2 → RDS connectivity
# Add NACL rule to block specific IP
# Configure Route 53 health check + failover
```

---

## Sample Exam Questions

**Q1:** A systems administrator needs to run a patch command on 500 EC2 instances across multiple regions without using SSH. Which service should they use?
- A) AWS Config
- B) EC2 Instance Connect
- C) AWS Systems Manager Run Command ✅
- D) AWS CloudShell

**Q2:** An operations team wants to automatically quarantine EC2 instances that GuardDuty flags as compromised. What is the best approach?
- A) Check GuardDuty findings daily and manually quarantine instances
- B) Create an EventBridge rule that triggers a Lambda function to isolate the instance ✅
- C) Set up a CloudWatch alarm on GuardDuty metrics
- D) Use AWS Config to detect and remediate

**Q3:** A CloudFormation stack update is failing, and the team wants to inspect the partially-created resources to debug. What should they do?
- A) Nothing — CloudFormation automatically logs all resources to S3
- B) Use the --disable-rollback flag and inspect resources before they're deleted ✅
- C) Enable Stack Drift Detection
- D) Check CloudTrail for the failure reason

**Q4:** A company needs to ensure all EC2 instances in their organization are using approved AMIs. Which combination of services should they use?
- A) AWS Config rule + SSM Automation remediation ✅
- B) GuardDuty + Lambda
- C) CloudTrail + CloudWatch Alarms
- D) Security Hub + Inspector

**Q5:** A web application's ALB is returning 504 errors for some requests. What is the most likely cause?
- A) Security Group is blocking port 443
- B) EC2 instances are not registered with the target group
- C) The target instances are taking longer to respond than the ALB timeout ✅
- D) The ALB SSL certificate has expired

---

## Study Tips

1. **Practice in the console** — this exam has a lab, you can't guess your way through
2. **Systems Manager is huge** — master Run Command, Session Manager, Patch Manager, Automation
3. **Monitoring is 20% of the exam** — know CloudWatch metrics, logs, alarms, X-Ray
4. **AWS Config + remediation** — know the pattern: Config Rule → non-compliant → SSM Automation
5. **Networking troubleshooting** — VPC Flow Logs, Reachability Analyzer, ALB access logs
6. **Cost tools** — Cost Explorer, Budgets, Trusted Advisor, Compute Optimizer
7. **Read the CloudWatch docs** carefully — metric resolution, dimensions, metric math
