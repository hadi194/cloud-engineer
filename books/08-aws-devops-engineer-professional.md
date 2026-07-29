# AWS Certified DevOps Engineer — Professional (DOP-C02)
### Level: Professional | Advanced CI/CD, automation, and operations at scale

---

## Exam Facts

| | |
|---|---|
| Code | DOP-C02 |
| Questions | 75 (65 scored + 10 unscored) |
| Duration | 180 minutes |
| Pass score | 750 / 1000 |
| Cost | USD $300 |
| Validity | 3 years |
| Prerequisites | Developer Associate OR CloudOps Engineer Associate (recommended both) |

**Who is this for:** Engineers who build and automate the entire software delivery pipeline — from code commit to production deployment. Deep expertise in CI/CD, infrastructure as code, monitoring, and governance at scale.

**Difficulty:** This is a hard exam. Scenario questions are long and require real-world operational experience, not just book knowledge.

---

## The 6 Exam Domains

| Domain | Weight |
|---|---|
| 1. SDLC Automation | 22% |
| 2. Configuration Management and IaC | 17% |
| 3. Resilient Cloud Solutions | 15% |
| 4. Monitoring and Logging | 15% |
| 5. Incident and Event Response | 14% |
| 6. Security and Compliance Automation | 17% |

---

## Domain 1 — SDLC Automation (22%)

### Advanced CI/CD Patterns

```
Full Pipeline Flow:
  CodeCommit/GitHub
    ↓ push to main
  CodePipeline (orchestrates stages)
    ↓ Source stage
  CodeBuild (build + unit tests)
    ↓ Build stage
  CodeBuild (integration tests)
    ↓ Test stage
  CodeDeploy to staging (ECS/EC2/Lambda)
    ↓ Staging Deploy
  Manual approval (human gate)
    ↓ Approval
  CodeDeploy to production
    ↓ Production Deploy
  CloudWatch Alarms (post-deploy validation)
```

### CodePipeline Advanced

```
Cross-account pipelines:
  Pipeline in Account A → deploy to Account B
  Use: cross-account IAM roles, CodePipeline artifact encryption

Custom actions:
  → Jenkins, TeamCity, or any CI tool as CodePipeline action
  → poll for job, report success/failure

Parallel actions:
  → run integration tests AND security scans simultaneously
  → faster pipelines

EventBridge integration:
  → trigger pipeline on any AWS event (not just code push)
  → e.g. new container image in ECR → trigger pipeline

Variables:
  → pass values between pipeline stages
  → e.g. pass image digest from build to deploy stage
```

### Advanced Deployment Strategies

```
Blue/Green on ECS:
  1. Current (Blue) task set: 100% traffic
  2. New (Green) task set deployed: 0% traffic
  3. Test green on test listener (port 8080)
  4. Shift traffic: 10% green, 90% blue
  5. Monitor for errors during bake time
  6. Shift to 100% green
  7. Terminate blue after configurable delay

Canary Deployments on Lambda:
  CodeDeploy creates alias with weighted routing:
    prod alias → 90% v1, 10% v2
  CloudWatch alarms monitor v2 error rate
  If alarm triggers: CodeDeploy auto-rollback to 100% v1
  If healthy after bake period: 100% v2

Feature Flags (not on exam but industry best practice):
  → deploy code with features disabled
  → enable per user/region/% without new deployment
  → AppConfig (AWS service) manages feature flags
```

### CodeArtifact

```
Private package repository for:
  npm, pip, Maven, Gradle, NuGet, Swift

Use cases:
  → cache public packages (npm, PyPI) internally
  → publish internal packages (company shared libraries)
  → audit/block problematic package versions

Upstream repositories:
  → proxy npm registry → packages cached in CodeArtifact
  → teams can't accidentally pull from internet if registry is down
```

---

## Domain 2 — Configuration Management and IaC (17%)

### CloudFormation Advanced

```
Custom Resources:
  → extend CloudFormation to create non-AWS resources
  → backed by Lambda function
  → use cases: DNS record in external provider, GitHub webhook
  → CloudFormation sends Create/Update/Delete event to Lambda
  → Lambda does the work, reports SUCCESS/FAILED

  Type: Custom::MyResource
  Properties:
    ServiceToken: !GetAtt MyLambda.Arn
    DomainName: example.com

Macros:
  → transform CloudFormation templates (like preprocessor)
  → define once, use in multiple templates
  → e.g. automatically add tags to all resources
  → e.g. expand shorthand notation to full resource definitions

CloudFormation Hooks:
  → validate/inspect resources before they are created/updated
  → fail deployment if hook rejects (e.g. no public S3 buckets)
  → built-in or custom (Lambda)

Dynamic References:
  → reference SSM Parameter Store or Secrets Manager values
  → {{resolve:ssm:/myapp/db-host:1}}
  → {{resolve:secretsmanager:prod/myapp/db:SecretString:password}}
  → secret never appears in template or CloudFormation console

StackSets Advanced:
  → SELF_MANAGED → assume role in target accounts (explicit list)
  → SERVICE_MANAGED → via AWS Organizations (auto-deploy to new accounts)
  → Deployment options: serial (safe) vs parallel (fast)
  → Failure tolerance: max concurrent accounts/percentage
```

### AWS CDK (Cloud Development Kit)

```
Write infrastructure in Python/TypeScript/Java/Go → compiles to CloudFormation

Benefits over raw CloudFormation:
  → real programming language (loops, conditions, abstraction)
  → IDE autocomplete and type safety
  → share infrastructure as npm/pip packages
  → construct library: high-level patterns (e.g. ApplicationLoadBalancedFargateService)

CDK concepts:
  App → Stack → Construct (L1/L2/L3)
  L1 = CloudFormation resource (1:1 mapping)
  L2 = higher-level with sensible defaults
  L3 = patterns (combines multiple L2 constructs)

# Example: L2 ECS pattern
const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
  cluster,
  image: ecs.ContainerImage.fromEcr(repo),
  memoryLimitMiB: 512,
  cpu: 256,
  desiredCount: 2,
});
# Creates: ECS Service + Task Definition + ALB + Target Group + Security Groups + IAM Role
```

### AWS AppConfig

```
Manage application configuration separate from code:
  → feature flags
  → operational parameters (rate limits, timeout values)
  → A/B testing configuration

Deployment strategies:
  → linear: roll out to 10% of instances every 5 minutes
  → canary: 10% first, rest after bake period

Validators:
  → JSON Schema validator (prevent invalid config)
  → Lambda validator (custom validation logic)

Rollback:
  → CloudWatch alarms → automatic rollback if errors spike
```

---

## Domain 3 — Resilient Cloud Solutions (15%)

### Multi-Region Architecture

```
Active-Active:
  → traffic routed to multiple regions simultaneously
  → Route 53 latency routing or Global Accelerator
  → data replication: Aurora Global, DynamoDB Global Tables
  → challenge: consistency, conflicts, data sovereignty

Active-Passive:
  → primary region handles all traffic
  → secondary region on standby
  → Route 53 failover routing + health checks
  → RPO: depends on replication lag
  → RTO: minutes (Route 53 TTL + health check interval)

Multi-Region Data Replication:
  S3 CRR → Cross-Region Replication (async)
  RDS Read Replica → cross-region (async, ~seconds lag)
  Aurora Global → cross-region (async, <1s lag)
  DynamoDB Global Tables → multi-master, active-active
  ElastiCache → no native cross-region replication
```

### Chaos Engineering

```
AWS Fault Injection Service (FIS):
  → inject failures to test resilience
  → experiments: terminate EC2, add network latency, fail AZ
  → run in staging or controlled production windows
  → stop conditions: CloudWatch alarm → stop experiment if things get bad

Example experiment:
  → inject 100ms network latency on all EC2 in AZ-a for 5 minutes
  → observe: does ALB route traffic to AZ-b?
  → observe: do CloudWatch alarms trigger?
  → measure: what is the user-visible impact?
```

### Resilient Deployment Patterns

```
Immutable Infrastructure:
  → never patch running servers
  → always deploy new AMI/container image
  → blue/green or rolling with launch templates
  → benefits: reproducible, no config drift, easy rollback

Health Checks at Every Layer:
  ALB health checks → remove unhealthy targets
  EC2 Auto Scaling health checks → replace unhealthy instances
  CloudWatch alarms → trigger scaling or remediation
  Route 53 health checks → failover to healthy region
  CodeDeploy rollback → revert if post-deploy alarms fire
```

---

## Domain 4 — Monitoring and Logging (15%)

### Centralized Logging Architecture

```
Multi-account log aggregation:

Account A (prod)    Account B (staging)    Account C (dev)
     |                     |                      |
     └──────────────────────┴──────────────────────┘
                           |
               CloudWatch Logs (per account)
                           |
                    Log subscriptions
                           |
               Kinesis Data Firehose
                           |
                    S3 (central log archive)
                    OpenSearch / Athena (query)
```

### CloudWatch Advanced

```
Anomaly Detection:
  → ML-based expected value bands for metrics
  → alarm when metric goes outside normal band
  → adapts to time-of-day and day-of-week patterns
  → use instead of static thresholds for variable metrics

Container Insights:
  → enhanced monitoring for ECS and EKS
  → pod-level, task-level, service-level metrics
  → performance logs for containers
  → enable per cluster, uses CloudWatch agent as DaemonSet

Lambda Insights:
  → enhanced monitoring for Lambda
  → cold starts, memory usage, init duration
  → installed as Lambda extension layer

Embedded Metric Format:
  → structured JSON logs that CloudWatch automatically extracts as metrics
  → no separate PutMetricData API call needed
  → emit from Lambda/ECS: {"_aws": {"Timestamp": 1234, "CloudWatchMetrics": [...]}}
```

---

## Domain 5 — Incident and Event Response (14%)

### Automated Incident Response

```
Pattern: Detect → Notify → Contain → Recover

Detect:
  GuardDuty finding → EventBridge → Lambda
  CloudWatch alarm → SNS → Lambda
  Security Hub finding → EventBridge

Contain (examples):
  Compromised EC2 → Lambda adds NACL deny rule for instance IP
  Suspicious IAM → Lambda calls iam:PutUserPolicy (explicit deny all)
  Exposed S3 → Lambda calls s3:PutBucketAcl (make private)

Recover:
  Lambda triggers CodePipeline to redeploy clean version
  Lambda calls autoscaling:TerminateInstanceInAutoScalingGroup
  Lambda creates snapshot before termination

SNS + OpsCenter:
  → create SSM OpsItems for incidents
  → track, manage, and resolve operational issues
  → link to runbooks
```

### EventBridge Patterns

```
Event routing:
  → filter events by pattern (service, event type, resource)
  → route to multiple targets (Lambda, SQS, Step Functions, another EventBridge)

Event Replay:
  → archive events for up to 5 years
  → replay to debug issues or reprocess after bug fix

Schema Registry:
  → discover and catalog event schemas
  → generate code bindings (TypeScript, Java, Python)

Cross-account events:
  → send events to another account's event bus
  → central security account can receive all events
```

### Step Functions

```
Coordinate complex workflows:
  → retry logic with exponential backoff
  → parallel branches
  → human approval steps
  → error handling and fallback

Use cases:
  → long-running orders processing (not Lambda, Lambda max 15min)
  → data processing pipeline with error handling
  → human approval workflows
  → microservice orchestration

Types:
  Standard → exactly-once, up to 1 year, audit trail
  Express  → at-least-once, up to 5 minutes, high volume (IoT/streaming)
```

---

## Domain 6 — Security and Compliance Automation (17%)

### Security Automation Patterns

```
Pattern 1: Enforce MFA everywhere
  AWS Organizations SCP:
    Deny: all actions
    Condition: MultiFactorAuthPresent = false
    Exception: iam:CreateVirtualMFADevice, iam:EnableMFADevice
  → forces MFA before any action in member accounts

Pattern 2: Prevent public S3 buckets org-wide
  AWS Config Rule: s3-bucket-public-read-prohibited
  Auto-remediation: SSM Automation document → PutBucketAcl (private)
  SCP: Deny s3:PutBucketAcl with PublicAccessBlockConfiguration: false

Pattern 3: Auto-rotate IAM access keys
  Lambda function (runs on schedule):
    → list all IAM users
    → find keys older than 90 days
    → create new key, store in Secrets Manager
    → send notification to user via SNS
    → deactivate old key (not delete — give grace period)
    → after 7 days: delete old key

Pattern 4: Detect and remediate drift
  CloudFormation Drift Detection → EventBridge → Lambda → CloudFormation update-stack
```

### AWS Organizations Advanced

```
Account structure:
  Root
  ├── Security OU
  │   ├── Audit account (CloudTrail, Config aggregator)
  │   └── Log archive account (centralized S3 logs)
  ├── Infrastructure OU
  │   ├── Network account (Transit Gateway, shared VPCs)
  │   └── Tooling account (CI/CD, CodePipeline, ECR)
  ├── Workloads OU
  │   ├── Production OU
  │   │   └── Prod account(s)
  │   └── Non-Production OU
  │       ├── Staging account
  │       └── Dev account(s)
  └── Sandbox OU (developers, no SCPs except billing limit)

SCPs (Service Control Policies):
  → permission guardrails (max permissions allowed in account)
  → explicit Deny wins over any IAM Allow in account
  → attach to OU or account
  → root account not affected by SCPs

Control Tower:
  → automated multi-account setup following AWS best practices
  → Account Factory: provision new accounts with baseline config
  → Landing Zone: pre-configured account structure
  → Guardrails: pre-built SCPs and Config rules
```

---

## Practice Exercises

### Exercise 1 — Design a CI/CD Pipeline

Requirements:
- Developers push to feature branches
- PR merge to main triggers pipeline
- Deploy to staging automatically, production requires manual approval
- Automatic rollback if error rate > 1% after production deploy
- All pipeline artifacts encrypted at rest

**Solution:**
```
GitHub → CodePipeline (source stage)
  ↓
CodeBuild (build stage):
  → npm test, npm run build
  → docker build + push to ECR
  → scan image with ECR enhanced scanning
  ↓
CodeBuild (integration tests against staging)
  ↓
CodeDeploy → ECS Staging (blue/green)
  ↓
Manual Approval (SNS notification to team)
  ↓
CodeDeploy → ECS Production (blue/green canary)
  → 10% traffic for 10 minutes
  → CloudWatch alarm: errors > 1% → auto-rollback
  → healthy → 100%

Security: KMS key encrypts all S3 artifacts, cross-account role for staging/prod
```

---

### Exercise 2 — Incident Response Runbook

Design automated response for: EC2 instance flagged by GuardDuty as CryptoCurrency:EC2/BitcoinTool.B (crypto mining)

**Solution:**
```
GuardDuty finding → EventBridge → Step Functions workflow:

Step 1: Tag instance (Quarantine: true)
Step 2: Modify Security Group → remove all rules, add deny all
Step 3: Create EBS snapshot (preserve evidence)
Step 4: Notify security team via SNS (Slack via Lambda)
Step 5: Wait for human review (24 hours)
Step 6 (on approve): Terminate instance, Auto Scaling launches clean replacement
Step 6 (on deny): Remove quarantine, restore SG rules

All steps logged to CloudTrail + OpsCenter incident ticket created
```

---

## Sample Exam Questions

**Q1:** A company's CodeDeploy deployment to Lambda is failing because 15% of users are experiencing errors after the canary phase. The team needs to minimize impact. What should be configured?
- A) Increase the canary percentage
- B) Configure a CloudWatch alarm that triggers automatic rollback when error rate exceeds threshold ✅
- C) Deploy to all instances at once
- D) Add a manual approval step between canary and full deployment

**Q2:** A CloudFormation stack needs to create a DNS record in an external DNS provider (not Route 53). What should the team use?
- A) AWS Config Custom Rule
- B) CloudFormation CloudFormation Custom Resource backed by Lambda ✅
- C) AWS Systems Manager Automation
- D) AWS Step Functions

**Q3:** A company needs to ensure no AWS account in their organization can disable CloudTrail, even if an administrator in that account tries. What is the solution?
- A) Enable CloudTrail in all accounts with MFA delete
- B) Create an SCP that denies cloudtrail:StopLogging and attach it to the root ✅
- C) Create an IAM policy that denies cloudtrail:StopLogging in each account
- D) Enable CloudTrail with log file integrity validation

**Q4:** A development team wants to safely test how their application behaves when an entire Availability Zone fails. Which service should they use?
- A) CloudWatch Synthetics
- B) AWS X-Ray
- C) AWS Fault Injection Service (FIS) ✅
- D) Route 53 health checks

---

## Study Tips

1. **This is the hardest associate/professional crossover** — you need breadth (like SA-Pro) + ops depth
2. **CI/CD pipeline design** — know every CodePipeline/CodeBuild/CodeDeploy option
3. **Advanced CloudFormation** — Custom Resources, Macros, StackSets, Hooks
4. **Automation patterns** — EventBridge + Lambda + SSM is the backbone of AWS automation
5. **AWS Organizations + SCPs** — critical for multi-account governance questions
6. **Incident response automation** — GuardDuty/Security Hub → EventBridge → automated response
7. **Write runbooks in your head** — exam gives you incidents and asks which combination of services fixes it
8. **Know the WHY** — why use Step Functions instead of Lambda chains? Why StackSets instead of multiple stacks?
