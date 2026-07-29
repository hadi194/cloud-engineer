# AWS — A Developer's Field Guide

> From zero to understanding how real production systems are built on Amazon Web Services.
> Written for backend developers who want to understand the infrastructure their code runs on.

---

## Table of Contents

1. [What AWS Is and Why It Exists](#1-what-aws-is-and-why-it-exists)
2. [The Mental Model — Regions, AZs, VPCs](#2-the-mental-model)
3. [Compute — Running Your Code](#3-compute)
4. [Storage — Keeping Your Files](#4-storage)
5. [Databases — Keeping Your Data](#5-databases)
6. [Networking — Connecting Everything](#6-networking)
7. [Security and Identity](#7-security-and-identity)
8. [Monitoring and Observability](#8-monitoring-and-observability)
9. [CI/CD and Containers](#9-cicd-and-containers)
10. [Infrastructure as Code](#10-infrastructure-as-code)
11. [Real Architecture Examples](#11-real-architecture-examples)
12. [Cost Model — How You Get Billed](#12-cost-model)
13. [AWS Free Tier — What You Can Use for Free](#13-aws-free-tier)
14. [AWS vs Your Local Stack](#14-aws-vs-your-local-stack)

---

## 1. What AWS Is and Why It Exists

Before AWS (pre-2006), if you wanted to run a web app you had to:

1. Buy physical servers
2. Rent space in a data center
3. Configure networking, cooling, power
4. Wait weeks for hardware to arrive
5. Manage everything yourself

AWS changed this. Jeff Bezos noticed that Amazon's engineering teams spent 70% of their time on undifferentiated heavy lifting — setting up databases, managing servers, configuring networking — instead of building product.

The insight: **infrastructure is a utility, like electricity**. You don't build a power plant to run your laptop. You pay per kilowatt-hour and plug in.

AWS turned infrastructure into an API. Instead of buying a server, you call:
```
POST /ec2/instances
{ "type": "t3.micro", "image": "ami-ubuntu-22.04" }
```
And a virtual machine appears in ~30 seconds.

**Why developers need to understand AWS:**
- Your code runs on AWS infrastructure
- Performance problems are often infrastructure problems
- Cost optimization is a developer responsibility
- Security flaws often come from misconfigured AWS services
- Debugging production requires understanding what's running where

---

## 2. The Mental Model

### Regions

AWS runs data centers in geographic locations called **Regions**. Each region is completely independent.

```
ap-southeast-2  (Sydney)
ap-southeast-1  (Singapore)
us-east-1       (N. Virginia) ← most services launch here first
eu-west-1       (Ireland)
... 30+ regions worldwide
```

**Why it matters:**
- Data sovereignty: Australian regulations may require data to stay in `ap-southeast-2`
- Latency: users in Sydney get faster responses from `ap-southeast-2` than `us-east-1`
- Disaster recovery: replicate to another region if one goes down

### Availability Zones (AZs)

Each region has 2-6 **Availability Zones** — physically separate data centers within the same city, connected by high-speed private fiber.

```
ap-southeast-2
├── ap-southeast-2a  (data center in one part of Sydney)
├── ap-southeast-2b  (data center in another part)
└── ap-southeast-2c  (data center in another part)
```

If one AZ catches fire (it happened — there was a transformer fire in us-east-1), the others keep running.

**Rule of thumb:** Deploy across at least 2 AZs for high availability.

### The Global Network

AWS owns private fiber cables connecting all its data centers globally. Traffic between AWS services in the same region never touches the public internet — it's faster and cheaper.

```
Your EC2 in ap-southeast-2 → S3 in ap-southeast-2
  ← private AWS backbone, extremely fast, no internet transit charges
```

vs

```
Your EC2 in ap-southeast-2 → S3 in us-east-1
  ← crosses regions, costs money per GB transferred
```

### VPC — Your Private Network

A **Virtual Private Cloud (VPC)** is your isolated private network inside AWS. Think of it as your own section of the internet where only your services can talk to each other.

```
Your VPC (10.0.0.0/16)
├── Public Subnet (10.0.1.0/24)   — has internet access
│   ├── Load Balancer
│   └── NAT Gateway
└── Private Subnet (10.0.2.0/24) — no direct internet
    ├── EC2 instances (your app servers)
    ├── RDS database
    └── ElastiCache
```

**Public subnet:** Has a route to the Internet Gateway. Resources can be reached from the internet (with security group rules).

**Private subnet:** No route to the internet. Services here can only be reached from within the VPC or through a NAT Gateway. Your database should NEVER be in a public subnet.

---

## 3. Compute

Compute = "things that run your code."

### EC2 vs ECS vs EKS — The Big Picture First

Think of it as **three levels of abstraction** — each one manages more for you:

**EC2 — A Virtual Machine**
You rent a computer in AWS's data center. That's it.
```
You manage:  OS, runtime, your app, restarts, scaling, patching — everything
AWS manages: The physical hardware only
```
> **Analogy:** Renting an **empty apartment**. You bring all your own furniture, fix your own plumbing.

**ECS — Run Docker Containers, AWS Manages the Machines**
You give AWS a Docker image. AWS runs it, restarts it if it crashes, spreads it across AZs.
```
You manage:  Your Docker image, CPU/memory size, env vars, replica count
AWS manages: The servers underneath, restarting crashed containers
```
> **Analogy:** Renting a **furnished apartment**. You just bring your clothes (the Docker image).

**EKS — Managed Kubernetes**
AWS runs the Kubernetes control plane. You use `kubectl` and YAML — same as minikube, but in the cloud at scale.
```
You manage:  Docker images, Kubernetes YAML manifests, worker nodes
AWS manages: Kubernetes master nodes, API server, etcd, scheduler
```
> **Analogy:** Renting an **apartment complex with a building manager**. You manage your unit, the manager handles the building infrastructure.

| | EC2 | ECS | EKS |
|---|---|---|---|
| What you deploy | Code / scripts | Docker image | Docker image + K8s YAML |
| You manage | Everything | Your containers | Your containers + K8s configs |
| AWS manages | Hardware only | Servers + scheduling | Servers + K8s control plane |
| Complexity | Medium | Low | High |
| Local equivalent | Your laptop | Docker Compose | **Minikube** |

**The progression most engineers take:**
```
Docker Compose (local) → ECS (first cloud job) → EKS (large teams like Blink)
```

---

### EC2 — Elastic Compute Cloud

EC2 gives you a virtual machine (called an **instance**). You choose the size, the operating system, and the region.

```
Instance family → what it's optimized for
  t3.micro     — general purpose, burstable (good for dev, cheap)
  t3.medium    — general purpose, burstable
  c6i.large    — compute optimized (CPU-intensive work)
  r6g.large    — memory optimized (in-memory databases, caches)
  g4dn.xlarge  — GPU (ML training, video encoding)

Name breakdown: c6i.large
  c = compute optimized
  6 = generation 6
  i = Intel processor
  large = size within the family
```

**How EC2 pricing works:**
- **On-Demand:** Pay per hour/second. No commitment. Most expensive.
- **Reserved:** 1 or 3-year commitment. Up to 72% cheaper. Use for stable baseline load.
- **Spot:** Use AWS's spare capacity. Up to 90% cheaper. Can be interrupted with 2-min notice. Good for batch jobs.

**When to use EC2:** When you need full control of the OS, specific software, or GPU access. For most web apps, ECS or EKS is simpler.

**Key concepts:**
- **AMI (Amazon Machine Image):** The OS snapshot your instance boots from. Like a Docker image but for a full VM.
- **Security Group:** A stateful firewall attached to an instance. Rules: "allow TCP port 443 from 0.0.0.0/0" (public HTTPS).
- **Elastic IP:** A static public IP address that survives instance reboots.
- **User Data:** A script that runs when the instance first boots (install dependencies, start services).

```bash
# Connecting to an EC2 instance
ssh -i my-key.pem ubuntu@<public-ip>

# Or with AWS CLI
aws ec2 describe-instances --region ap-southeast-2
```

---

### ECS — Elastic Container Service

ECS runs Docker containers without you managing the underlying EC2 instances.

```
ECS Cluster
└── Service (your-api)
    ├── Task Definition (like a docker-compose entry)
    │   ├── Image: 123456.dkr.ecr.ap-southeast-2.amazonaws.com/my-api:latest
    │   ├── CPU: 256 (0.25 vCPU)
    │   ├── Memory: 512 MB
    │   └── Environment: { DATABASE_URL: "...", JWT_SECRET: "..." }
    └── Tasks (running containers)
        ├── Task 1 (on EC2 instance in AZ-a)
        └── Task 2 (on EC2 instance in AZ-b)
```

**ECS with Fargate:** You don't even manage the EC2 instances. AWS runs your containers on serverless infrastructure. You pay per vCPU-second and GB-second the container uses.

```
Fargate pricing example (ap-southeast-2):
  0.256 vCPU, 0.5 GB RAM, running 24/7 for 1 month
  = ~$8/month
```

**When to use ECS:** Teams that don't want Kubernetes complexity. Simpler than EKS, still production-grade.

---

### EKS — Elastic Kubernetes Service

EKS is managed Kubernetes. AWS runs the Kubernetes control plane (the master nodes) for you. You provide the worker nodes (EC2 instances or Fargate).

#### Two Types of Machines in a K8s Cluster

```
Master Node  →  the BRAIN  (makes decisions)
Worker Node  →  the MUSCLE (actually runs your containers)
```

The master node is a server dedicated to running K8s management software. It **never** runs your app containers — its only job is to manage everything else.

```
Master Node contains:
  ├── API Server      ← the receptionist
  ├── etcd            ← the whiteboard (memory)
  ├── Scheduler       ← decides WHICH worker runs each pod
  └── Controller Mgr  ← watches for problems and fixes them
```

> **Analogy:** The master node is the **manager's office floor** in a building. The workers are on the other floors doing the actual work. The manager floor just coordinates.

#### API Server — The Receptionist

The API server is the **only front door** into Kubernetes. Nothing talks to etcd, the scheduler, or anything else directly — everything goes through the API server first.

```
kubectl apply -f deploy.yaml  →  API Server  →  validates it
                                             →  saves to etcd
                                             →  notifies scheduler

Scheduler                     →  API Server  →  "put pod on node-2"
kubelet (on worker node)      →  API Server  →  "pod is now Running"
You (browser/CLI)             →  API Server  →  everything
```

> **Analogy:** The API server is the **receptionist at the front desk**. You don't walk directly into the manager's office — you always go through reception first. Reception checks your ID (auth), checks if you're allowed (RBAC), then routes your request to the right place.

#### The Full Picture

```
                  ┌─────────────────────────────┐
                  │        MASTER NODE          │
                  │                             │
kubectl ─────────►│  API Server (receptionist)  │
(you)             │       ↓          ↓          │
                  │    etcd      Scheduler      │
                  │  (memory)   (decides where) │
                  │       ↓          ↓          │
                  │   Controller Manager        │
                  │   (fixes problems)          │
                  └─────────────┬───────────────┘
                                │ tells workers what to do
                  ┌─────────────┼───────────────┐
                  │             │               │
           ┌──────▼──┐   ┌──────▼──┐   ┌──────▼──┐
           │ Worker 1 │   │ Worker 2 │   │ Worker 3 │
           │  [pod]   │   │  [pod]   │   │  [pod]   │
           │  [pod]   │   │  [pod]   │   │  [pod]   │
           └─────────┘   └─────────┘   └─────────┘
```

#### EKS Cluster Structure

```
EKS Cluster
└── Node Group (EC2 instances = Worker Nodes)
    ├── Node 1 (t3.medium)
    │   ├── Pod: api-deployment-abc123
    │   └── Pod: worker-deployment-def456
    └── Node 2 (t3.medium)
        ├── Pod: api-deployment-xyz789
        └── Pod: prometheus-0
```

This is what Blink uses in production. The `kustomize-flux` repo you explored — those manifests are deployed to EKS.

**In EKS specifically:**
- AWS manages the **master node** (control plane) for you → you never SSH into it
- You manage the **worker nodes** (EC2 instances where your pods run)
- In minikube, master and worker are the **same single machine** — fine for local learning, separate in production

**EKS control plane cost:** $0.10/hour (~$73/month) regardless of how many nodes you have.
**Node cost:** Normal EC2 pricing for the worker node instances.

**When to use EKS:** Large teams, complex deployments, need Kubernetes features (auto-scaling, rolling deployments, service mesh).

---

### Lambda — Serverless Functions

Lambda runs code without you managing ANY servers. You write a function, upload it, and AWS runs it in response to events.

```python
# A Lambda function
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
```

Triggers:
- HTTP request via API Gateway
- File uploaded to S3
- Message in SQS queue
- Schedule (every 5 minutes)
- DynamoDB change

**Pricing:** You pay per invocation and per GB-second of compute time.
```
First 1 million invocations/month: FREE
After: $0.20 per million invocations
128MB function, 100ms duration: $0.0000002083 per invocation
```

**Cold start:** Lambda functions "sleep" when not used. The first invocation after idle time takes longer (100ms-2s) to wake up. Not suitable for real-time latency-sensitive APIs.

**When to use Lambda:** Event-driven tasks, background jobs, webhooks, image processing, simple APIs with variable traffic.

---

### Comparison

| Need | Use |
|---|---|
| Full VM control, GPU, specific OS | EC2 |
| Run Docker containers, simpler than K8s | ECS + Fargate |
| Run Docker containers, need K8s features | EKS |
| Event-driven, no server management | Lambda |

---

## 4. Storage

### S3 — Simple Storage Service

S3 stores files (called **objects**) in containers called **buckets**. It's infinitely scalable, 99.999999999% (11 nines) durable.

```
Bucket: my-company-uploads
├── images/
│   ├── 2026/01/photo1.jpg
│   └── 2026/01/photo2.jpg
├── documents/
│   └── report.pdf
└── exports/
    └── users-2026-01-01.csv
```

**Key properties:**
- Each object has a unique key (path) within the bucket
- Max object size: 5TB (use multipart upload for >100MB)
- Objects are replicated across at least 3 AZs automatically
- Buckets have global unique names (across all AWS accounts worldwide)

**Access patterns:**
```
# Public URL (if bucket/object is public)
https://my-bucket.s3.ap-southeast-2.amazonaws.com/images/photo1.jpg

# Pre-signed URL (temporary access for private objects)
https://my-bucket.s3.amazonaws.com/private/doc.pdf?X-Amz-Signature=...&X-Amz-Expires=3600

# Private access (from EC2/Lambda with IAM role)
aws s3 cp s3://my-bucket/file.txt ./file.txt
```

**S3 storage classes (cost vs access speed):**
```
S3 Standard         — frequent access, highest cost
S3 Standard-IA      — infrequent access, lower storage cost, retrieval fee
S3 Glacier          — archive, very low cost, hours to retrieve
S3 Glacier Deep     — long-term archive, lowest cost, 12h to retrieve
```

**S3 use cases:**
- Static website hosting (HTML, CSS, JS files)
- Image/file uploads from users
- Database backups
- Log archiving
- Data lake (raw data for analytics)

**S3 vs Databases:** S3 stores files, not rows. You can't query S3 with SQL. Use S3 for unstructured files, databases for structured data.

**Local equivalent: MinIO** — identical S3 API, runs in Docker, free.

---

### EBS — Elastic Block Store

EBS is a virtual hard drive attached to an EC2 instance. Like a USB drive, but in the cloud.

```
EC2 Instance
└── EBS Volume (gp3, 100GB)
    └── /dev/xvda (root volume, OS lives here)
    
EC2 Instance
└── EBS Volume (gp3, 500GB)
    └── /dev/xvdb (mounted at /data, your application data)
```

**Properties:**
- Attached to ONE instance at a time (usually)
- Persists when the instance stops (unlike instance store)
- Can take snapshots (point-in-time backups to S3)
- Types: `gp3` (general SSD), `io2` (high IOPS SSD for databases), `st1` (throughput HDD for big data)

**When to use EBS vs S3:**
- EBS: random read/write, database files, OS disk, anything that needs a filesystem
- S3: storing files for retrieval, sharing across instances, static assets

**Local equivalent: Docker volumes, PersistentVolumeClaims in K8s**

---

### EFS — Elastic File System

EFS is a network filesystem that can be mounted by multiple EC2 instances simultaneously (unlike EBS).

```
EC2 Instance A ──┐
EC2 Instance B ──┤──► EFS (NFS mount, /shared-data)
EC2 Instance C ──┘
```

**When to use:** Shared configuration files, content management systems (WordPress), ML model files accessed by multiple inference servers.

**More expensive than EBS.** Don't use it unless you need the multi-mount capability.

---

## 5. Databases

### RDS — Relational Database Service

RDS manages PostgreSQL, MySQL, MariaDB, Oracle, or SQL Server for you. AWS handles:
- Automated backups (daily snapshots + transaction logs)
- Automated minor version upgrades
- Multi-AZ failover
- Hardware failure replacement

```
RDS PostgreSQL
├── Primary instance (ap-southeast-2a)  ← reads and writes
└── Standby instance (ap-southeast-2b)  ← auto-failover if primary dies
    (Multi-AZ mode)
```

**Instance types:**
```
db.t3.micro     — 2 vCPU, 1GB RAM  — dev/test, cheapest
db.t3.medium    — 2 vCPU, 4GB RAM  — small production
db.r6g.large    — 2 vCPU, 16GB RAM — memory-intensive workloads
db.r6g.4xlarge  — 16 vCPU, 128GB RAM — large databases
```

**Key RDS concepts:**

**Parameter Group:** Configuration for the DB engine. Like `postgresql.conf`. Tweak `max_connections`, `shared_buffers`, `work_mem`.

**Subnet Group:** Which subnets the RDS instance can be placed in. Always use private subnets.

**Security Group:** Firewall. Only allow port 5432 from your application's security group. Never `0.0.0.0/0`.

**Read Replica:** A read-only copy of your database in the same or different region. Routes read traffic there to reduce load on the primary.

```
Primary (writes + reads)
└── Read Replica 1 (reads only) — offload reporting queries
└── Read Replica 2 (reads only) — different region for DR
```

**Connection strings:**
```
postgres://user:password@mydb.abc123.ap-southeast-2.rds.amazonaws.com:5432/mydb
```

**Local equivalent: PostgreSQL in Docker/K8s**

---

### What To Do When the Database Is Full

This is the **hot/warm/cold data problem** — every production system hits it eventually.

```
Hot data   = data on the counter    → instant access, expensive space
Warm data  = data in the fridge     → quick access, moderate space
Cold data  = data in the warehouse  → slow access, very cheap space
```

> **Analogy:** Your database filling up = your kitchen counter is full.
> The fix isn't always buying a bigger counter.

#### Decision Tree

```
DB is full →

Step 1: Can you delete stale / soft-deleted data?
  YES → delete it first. Cheapest fix, do this before anything else.
        SELECT COUNT(*) FROM bookings WHERE deleted_at IS NOT NULL;

Step 2: Is recent data the only data users actually query day-to-day?
  YES → archive old data to S3, set a retention policy.
        Keep last 6 months in PostgreSQL, move older rows to S3.

Step 3: Do you need old + new data queryable in the same SQL queries?
  YES → partition the table by date (PostgreSQL PARTITION BY RANGE).
        App sees one table, data is split into yearly/monthly files.
        Drop old partitions in milliseconds without DELETE overhead.

Step 4: Is write throughput the bottleneck, not storage?
  YES → add Read Replicas first to offload reads.
        Sharding (split across multiple DBs) only if replicas aren't enough.
        Sharding is very complex — avoid until you truly need it.

Step 5: Done all the above and still full?
  → Scale up the RDS disk. On AWS this is a single click, no downtime.
     RDS storage auto-scales if you enable it (set a max limit).
```

#### Archiving Pattern (Step 2)

```sql
-- Nightly job: move old rows to archive table
INSERT INTO bookings_archive
  SELECT * FROM bookings
  WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM bookings
  WHERE created_at < NOW() - INTERVAL '1 year';
```

Then export `bookings_archive` to S3 as JSON/CSV. If someone needs data older than 1 year, it's a slower "archive search" — users accept that.

#### Partitioning Pattern (Step 3)

```sql
-- One logical table, physically split by year
CREATE TABLE bookings (
    id UUID, created_at TIMESTAMPTZ, status TEXT
) PARTITION BY RANGE (created_at);

CREATE TABLE bookings_2024 PARTITION OF bookings
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE bookings_2025 PARTITION OF bookings
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Query works normally — PostgreSQL scans only the relevant partition
SELECT * FROM bookings WHERE created_at > '2026-01-01';

-- Drop 2024 data instantly (even 100M rows = milliseconds)
DROP TABLE bookings_2024;
```

#### What Blink Likely Does

```
Active bookings (last 6 months)  →  PostgreSQL, fast queries
Completed bookings (6m - 2y)     →  PostgreSQL, partitioned, slower OK
Historical (2y+)                  →  S3 archive, queryable via Athena
```

---

### Aurora — AWS's Enhanced PostgreSQL/MySQL

Aurora is AWS's rewrite of PostgreSQL and MySQL, designed for the cloud. It:
- Stores data across 3 AZs in 6 copies automatically
- Separates compute from storage (can scale storage independently)
- Supports up to 15 read replicas with <10ms replica lag
- Aurora Serverless v2: scales compute up/down in seconds to 0.5 ACU increments

**Aurora Serverless** is particularly interesting: you define min/max capacity, and it scales automatically. Pay only for what you use. Minimum: 0.5 ACU (Aurora Capacity Unit) ≈ 1GB RAM.

**When to use Aurora over RDS:**
- You need very high read throughput
- Variable/unpredictable traffic (Serverless)
- You want automatic storage scaling
- Aurora is ~20% more expensive than RDS but worth it at scale

---

### DynamoDB — NoSQL Key-Value / Document Database

DynamoDB is AWS's managed NoSQL database. Fully serverless — no instances to manage.

```
Table: users
  Partition Key: userId  (determines which server stores the data)
  Sort Key: createdAt    (optional, enables range queries)

Item:
{
  "userId": "usr_abc123",
  "createdAt": "2026-01-01T00:00:00Z",
  "name": "Alice",
  "email": "alice@example.com",
  "settings": { "theme": "dark", "notifications": true }
}
```

**Access pattern:** By partition key (exact match) or partition key + sort key (range). You design your table schema around your query patterns.

**When to use DynamoDB:**
- Massive scale (millions of requests/second)
- Simple access patterns (get by ID, list by user)
- Session storage
- Gaming leaderboards
- IoT sensor data

**When NOT to use DynamoDB:**
- Complex queries with multiple filters (use PostgreSQL)
- Joins between tables (use PostgreSQL)
- Ad-hoc analytics (use Athena + S3)

**Pricing:** Pay per read/write unit and storage. First 25GB storage and 25 WCU/RCU free forever.

---

### ElastiCache — Managed Redis / Memcached

ElastiCache runs Redis or Memcached as a managed service. AWS handles replication, backups, failover.

**Redis use cases in production:**
```
# Session storage (fast auth token lookup)
SET session:abc123 '{"userId": "usr_1", "role": "admin"}' EX 86400

# Rate limiting (count requests per user per minute)
INCR ratelimit:usr_1:2026-01-01T12:30
EXPIRE ratelimit:usr_1:2026-01-01T12:30 60

# Cache expensive DB query results
SET cache:booking:list:carrier_1 '[{"id":"..."}]' EX 300

# Pub/Sub for real-time features
SUBSCRIBE booking.updates
PUBLISH booking.updates '{"bookingId":"...", "status":"booked"}'

# Sorted sets for leaderboards
ZADD leaderboard 1500 "player1"
ZREVRANGE leaderboard 0 9  # top 10 players
```

**Local equivalent: Redis in Docker/K8s**

---

### Choosing the Right Database

```
Question 1: Do you need SQL / relational data / joins?
  YES → RDS PostgreSQL or Aurora PostgreSQL
  NO  → go to question 2

Question 2: Do you need massive scale (>100k ops/sec)?
  YES → DynamoDB
  NO  → go to question 3

Question 3: Do you need fast key-value lookups / caching?
  YES → ElastiCache Redis
  NO  → RDS PostgreSQL (still a solid default)
```

---

## 6. Networking

### Subnetting — The Theory You Need First

Before VPC makes sense, you need to understand subnetting. Every IP address and network range you see in AWS (`10.0.0.0/16`, `10.0.1.0/24`) is subnetting notation.

#### What Is an IP Address?

An IP address is a 32-bit number written in 4 groups of 8 bits (called octets):

```
192      .  168    .    1   .    1
11000000   10101000  00000001  00000001
  8 bits    8 bits    8 bits    8 bits
                              = 32 bits total
```

Each octet ranges from `0` to `255` (because 8 bits = 2^8 = 256 possible values).

#### What Is CIDR Notation? (The `/` Number)

`10.0.0.0/16` — the `/16` is called a **CIDR prefix**. It means:

```
"The first 16 bits are the NETWORK part (fixed)"
"The remaining bits are the HOST part (can vary)"
```

```
10.0.0.0/16

10   .   0   .   0   .   0
|------fixed------|----free----|
   16 bits fixed    16 bits free
                    = 2^16 = 65,536 possible addresses
```

#### The CIDR Cheat Sheet

| CIDR | Fixed bits | Free bits | Total IPs | Usable IPs | Common use |
|---|---|---|---|---|---|
| `/8`  | 8  | 24 | 16,777,216 | 16,777,214 | Huge private network |
| `/16` | 16 | 16 | 65,536     | 65,534     | AWS VPC |
| `/24` | 24 | 8  | 256        | 254        | AWS Subnet |
| `/28` | 28 | 4  | 16         | 14         | Small subnet |
| `/32` | 32 | 0  | 1          | 1          | Single IP address |

> **Why usable IPs = total - 2?**
> First IP = network address (identifies the subnet itself)
> Last IP  = broadcast address (send to all devices in subnet)
> Both are reserved, you can't assign them to servers.
> AWS reserves 3 more per subnet (router, DNS, future use) → subtract 5 total.

#### Reading a Subnet Range

`10.0.1.0/24` means:

```
Network:   10.0.1.  (fixed — first 24 bits)
Hosts:            0 to 255  (free — last 8 bits)

First IP:  10.0.1.0    (network address, reserved)
Last IP:   10.0.1.255  (broadcast, reserved)
Usable:    10.0.1.1  →  10.0.1.254  (254 addresses)
```

`10.0.0.0/16` means:

```
Network:   10.0.  (fixed — first 16 bits)
Hosts:         0.0 to 255.255  (free — last 16 bits)

First IP:  10.0.0.0
Last IP:   10.0.255.255
Usable:    65,534 addresses
```

#### Private IP Ranges (Safe to Use Inside Your Network)

The internet agreed these ranges are NEVER routable on the public internet — safe for internal use:

```
10.0.0.0    /8   →  10.0.0.0    – 10.255.255.255   (16M IPs)
172.16.0.0  /12  →  172.16.0.0  – 172.31.255.255   (1M IPs)
192.168.0.0 /16  →  192.168.0.0 – 192.168.255.255  (65K IPs)
```

> Your home router uses `192.168.x.x`. AWS VPCs use `10.x.x.x`. Both are private — they never conflict with public internet IPs.

#### Subnetting — Splitting a Network Into Smaller Pieces

You take a large block and divide it into smaller subnets:

```
VPC:  10.0.0.0/16  (65,536 IPs — your entire private network)
  │
  ├── Public Subnet A:   10.0.1.0/24   (256 IPs — for load balancers)
  ├── Public Subnet B:   10.0.2.0/24   (256 IPs — for load balancers)
  ├── Private Subnet A:  10.0.11.0/24  (256 IPs — for app servers)
  ├── Private Subnet B:  10.0.12.0/24  (256 IPs — for app servers)
  ├── DB Subnet A:       10.0.21.0/24  (256 IPs — for databases)
  └── DB Subnet B:       10.0.22.0/24  (256 IPs — for databases)
```

All subnets live inside the VPC's range (`10.0.x.x`). They don't overlap. Together they use only a small portion of the VPC's 65,536 available IPs — leaving room to add more subnets later.

#### Why Subnetting Matters in AWS

```
Public subnet  (10.0.1.0/24)  →  has route to internet → load balancers go here
Private subnet (10.0.11.0/24) →  no direct internet    → your app servers go here
DB subnet      (10.0.21.0/24) →  no internet at all    → databases go here

Traffic from internet → hits public subnet → goes to private → hits DB subnet
Database is NEVER directly reachable from the internet
```

This layered isolation is the core of AWS network security. Subnetting is the tool that creates those layers.

---

### VPC Deep Dive

Every AWS account gets a default VPC in each region (10.0.0.0/16). For production, create a custom VPC.

```
Custom VPC: 10.0.0.0/16 (65536 IPs)
├── Public Subnets (internet-facing)
│   ├── 10.0.1.0/24 (AZ-a) — 254 IPs
│   └── 10.0.2.0/24 (AZ-b) — 254 IPs
├── Private Subnets (app layer)
│   ├── 10.0.11.0/24 (AZ-a)
│   └── 10.0.12.0/24 (AZ-b)
└── Database Subnets (data layer)
    ├── 10.0.21.0/24 (AZ-a)
    └── 10.0.22.0/24 (AZ-b)
```

**Internet Gateway (IGW):** The door between your VPC and the internet. Attach one to your VPC for public subnets.

**NAT Gateway:** Lets private subnet resources reach the internet (for package downloads, API calls) without being reachable FROM the internet. Costs $0.045/hour + $0.045/GB.

**Route Tables:** Rules that say "traffic destined for X goes via Y."
```
Public subnet route table:
  10.0.0.0/16 → local (stay in VPC)
  0.0.0.0/0   → igw-abc123 (everything else goes to internet)

Private subnet route table:
  10.0.0.0/16 → local
  0.0.0.0/0   → nat-abc123 (outbound only, via NAT)
```

### Security Groups

Security groups are stateful firewalls applied to EC2 instances, RDS, Lambda, etc.

```
Security Group: sg-api
  Inbound rules:
    HTTP  TCP 80   from 0.0.0.0/0          (public web traffic)
    HTTPS TCP 443  from 0.0.0.0/0          (public HTTPS)
    SSH   TCP 22   from 10.0.0.0/8         (only from VPN/bastion)
  Outbound rules:
    All traffic    to 0.0.0.0/0            (allow all outbound)

Security Group: sg-database
  Inbound rules:
    PostgreSQL TCP 5432  from sg-api       (only from API security group)
  Outbound rules:
    All traffic    to 0.0.0.0/0
```

Stateful means: if an outbound connection is allowed, the response is automatically allowed in. You don't need matching inbound/outbound rules for responses.

### ALB — Application Load Balancer

ALB distributes HTTP/HTTPS traffic across multiple targets (EC2, ECS tasks, Lambda).

```
Internet
  ↓
ALB (public, in public subnets)
  ├── Listener: HTTPS 443
  │   └── Rules:
  │       ├── /api/* → Target Group: api-service (3 ECS tasks)
  │       └── /* → Target Group: frontend-service (2 ECS tasks)
  └── Listener: HTTP 80 → redirect to HTTPS
```

**ALB features:**
- SSL termination (handles HTTPS, your app only sees HTTP)
- Health checks (removes unhealthy instances)
- Path-based routing (`/api/*` → backend, `/*` → frontend)
- Host-based routing (`api.example.com` vs `app.example.com`)
- WebSocket support
- Authentication via Cognito or OIDC

**Local equivalent: Nginx Ingress Controller in K8s**

### Route 53 — DNS

Route 53 is AWS's DNS service. It maps domain names to IP addresses.

```
Record types:
  A     example.com   → 1.2.3.4 (IPv4 address)
  AAAA  example.com   → 2001:db8::1 (IPv6)
  CNAME api.example.com → my-alb.ap-southeast-2.elb.amazonaws.com
  MX    example.com   → mail.example.com (email routing)
  TXT   example.com   → "v=spf1 include:sendgrid.net ~all" (email validation)

Routing policies:
  Simple          → always return the same IP
  Weighted        → 80% to v1, 20% to v2 (canary deploy)
  Latency-based   → route to nearest region
  Health check    → failover to secondary if primary is down
  Geolocation     → Australian users → ap-southeast-2
```

### CloudFront — CDN

CloudFront caches your content at 400+ edge locations worldwide. Users download from the nearest location instead of your origin server.

```
User in Tokyo
  ↓ (2ms latency)
CloudFront edge in Tokyo
  ↓ (cache hit? serve immediately)
  ↓ (cache miss? fetch from origin)
Your S3 bucket / ALB in ap-southeast-2
```

**What to cache:** Static assets (images, CSS, JS), API responses that don't change often.

**Use case in Blink-like apps:**
- Put CloudFront in front of S3 for uploaded images
- Users worldwide get fast image loads
- S3 isn't hit for every request (cost savings)
- SSL certificate via ACM (free)

---

## 7. Security and Identity

### IAM — Identity and Access Management

IAM controls WHO can do WHAT to WHICH AWS resources.

**IAM Users:** Human users or programmatic access. Create for each developer or CI system.

**IAM Roles:** Assumed by AWS services (EC2, Lambda, ECS). A role has permissions but no username/password. Best practice: always use roles for services, never embed access keys in code.

**IAM Policies:** JSON documents that define permissions.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-uploads-bucket/*"
    },
    {
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "*"
    }
  ]
}
```

**Principle of Least Privilege:** Give the minimum permissions needed. Your API service should only be able to read/write to its specific S3 bucket, not delete it.

**IRSA (IAM Roles for Service Accounts):** This is what Blink uses in K8s. A Kubernetes ServiceAccount is linked to an IAM role. Pods with that ServiceAccount automatically get AWS credentials via a token — no access keys stored anywhere. This is what the K8s 401 bug in the Slack post was about.

### Secrets Manager

Stores and rotates secrets (database passwords, API keys). Your application fetches the secret at startup.

```bash
# Store a secret
aws secretsmanager create-secret \
  --name prod/myapp/database \
  --secret-string '{"username":"admin","password":"super-secret"}'

# Fetch in your application (Go)
resp, _ := client.GetSecretValue(&secretsmanager.GetSecretValueInput{
    SecretId: aws.String("prod/myapp/database"),
})
var creds DatabaseCreds
json.Unmarshal([]byte(*resp.SecretString), &creds)
```

**Why Secrets Manager instead of environment variables:**
- Secrets are encrypted at rest (KMS)
- Automatic rotation (changes DB password every 30 days)
- Audit trail (CloudTrail logs every access)
- No secrets in code, git history, or environment

**Local equivalent: Kubernetes Secrets, or HashiCorp Vault**

### KMS — Key Management Service

KMS manages encryption keys. AWS services (S3, RDS, EBS, Secrets Manager) use KMS to encrypt data at rest.

```
Your data → KMS encrypts with Customer Master Key (CMK) → stored encrypted
           ← KMS decrypts when your service reads it

Who can decrypt? Only IAM principals with kms:Decrypt permission on that key.
```

You rarely interact with KMS directly. You enable encryption on S3/RDS and choose a KMS key.

### ACM — AWS Certificate Manager

Free SSL/TLS certificates for your domains. Use with ALB or CloudFront.

```
1. Request certificate for api.example.com in ACM
2. Validate domain ownership (add DNS CNAME record)
3. Certificate issued in minutes (valid 13 months, auto-renewed)
4. Attach to ALB listener or CloudFront distribution
```

**Local equivalent: cert-manager in K8s with Let's Encrypt**

---

## 8. Monitoring and Observability

### CloudWatch — Metrics and Logs

CloudWatch is the central monitoring service in AWS.

**Metrics:** Time-series data points (like Prometheus).
```
EC2 CPUUtilization          → how busy is my server?
RDS DatabaseConnections     → how many DB connections?
ALB RequestCount            → how much traffic?
Lambda Duration             → how long do functions take?
Custom metric (your app)    → login_attempts, booking_created_total
```

**Logs:** CloudWatch Logs stores log output from EC2, Lambda, ECS, etc.
```bash
# View logs from an ECS service
aws logs tail /ecs/my-api --follow

# Query logs with CloudWatch Insights
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
```

**Alarms:** Trigger an action when a metric crosses a threshold.
```
Alarm: HighCPU
  Metric: EC2 CPUUtilization
  Threshold: > 80% for 5 minutes
  Action: Send SNS notification → email team, auto-scale EC2
```

**Dashboards:** Like Grafana, but AWS-native. Less flexible but zero setup.

**Local equivalent: Prometheus + Grafana + Loki**

### X-Ray — Distributed Tracing

X-Ray traces requests as they flow through your microservices — like Jaeger or Tempo.

```
HTTP Request: POST /api/booking/create
  │
  ├── service-job (50ms)
  │   ├── PostgreSQL query (10ms)
  │   └── RabbitMQ publish (5ms)
  │
  ├── service-event (20ms)
  │   └── DynamoDB write (8ms)
  │
  └── service-notification (15ms)
      └── Pusher Beams API call (12ms)

Total: 85ms
Slowest segment: service-job → identify for optimization
```

You add the X-Ray SDK to each service. It automatically traces AWS SDK calls (RDS, S3, DynamoDB).

**Local equivalent: Tempo (traces) + Grafana (visualization)**

---

## 9. CI/CD and Containers

### ECR — Elastic Container Registry

ECR stores your Docker images. Like DockerHub but private and inside AWS.

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.ap-southeast-2.amazonaws.com

# Build and push your image
docker build -t my-api .
docker tag my-api:latest 123456789.dkr.ecr.ap-southeast-2.amazonaws.com/my-api:latest
docker push 123456789.dkr.ecr.ap-southeast-2.amazonaws.com/my-api:latest
```

**Local equivalent: minikube's internal Docker registry (with `eval $(minikube docker-env)`)**

### CodeBuild — Build Service

CodeBuild runs build jobs (compile, test, docker build). Like Buildkite or GitHub Actions, but AWS-native.

```yaml
# buildspec.yml
version: 0.2
phases:
  install:
    runtime-versions:
      golang: 1.22
  build:
    commands:
      - go test ./...
      - docker build -t my-api .
      - docker push $ECR_URI/my-api:$CODEBUILD_RESOLVED_SOURCE_VERSION
```

### CodePipeline — CI/CD Orchestration

CodePipeline chains stages together: Source → Build → Test → Deploy.

```
Source: GitHub (push to main)
  ↓
Build: CodeBuild (run tests, build Docker image, push to ECR)
  ↓
Deploy to Staging: ECS update-service (new image → ECS tasks)
  ↓
Manual Approval
  ↓
Deploy to Production: ECS update-service
```

**Local equivalent: Buildkite (what Blink uses), GitHub Actions, ArgoCD**

---

## 10. Infrastructure as Code

Clicking in the AWS console doesn't scale. Teams use code to define infrastructure.

### CloudFormation

AWS's native IaC. You write JSON or YAML, AWS creates the resources.

```yaml
# cloudformation.yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-uploads-bucket
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true

  MyDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: "15.4"
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
```

### Terraform

Provider-agnostic IaC (works with AWS, GCP, Azure). More expressive than CloudFormation.

```hcl
# main.tf
resource "aws_s3_bucket" "uploads" {
  bucket = "my-uploads-bucket"
}

resource "aws_db_instance" "postgres" {
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  username       = "admin"
  password       = var.db_password
}
```

### CDK — Cloud Development Kit

Write infrastructure in TypeScript, Python, Go, Java. Compiles to CloudFormation.

```typescript
// infrastructure.ts
const bucket = new s3.Bucket(this, 'UploadsBucket', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true,
});

const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_4 }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});
```

**Local equivalent: Kustomize (what Blink uses), Helm**

---

## 11. Real Architecture Examples

### Simple Web App (like your fullstack project)

```
Users
  ↓ HTTPS
Route 53 (DNS: app.example.com)
  ↓
CloudFront (CDN, SSL termination)
  ├── /static/* → S3 (React build output — JS, CSS, assets)
  └── /*        → ALB
                    ↓
                  ECS Fargate
                  ├── frontend-service (React + Nginx, 2 tasks)
                  └── backend-service  (Go API, 2 tasks)
                        ↓           ↓
                       RDS       ElastiCache
                    (Postgres)    (Redis)
                                    ↓
                                   S3
                              (uploaded images)
```

**Cost estimate (ap-southeast-2, low traffic):**
```
CloudFront:          ~$1/month (1GB transfer, 1M requests)
ALB:                 ~$20/month (fixed + LCU charges)
ECS Fargate (4 tasks): ~$25/month (0.5 vCPU, 1GB each)
RDS t3.micro:        ~$20/month
ElastiCache t3.micro: ~$16/month
S3:                  ~$1/month (10GB storage)
Route 53:            ~$1/month
Total:               ~$84/month
```

### Microservices Architecture (like Blink in production)

```
Internet
  ↓
Route 53
  ↓
CloudFront
  ↓
ALB
  ├── api.example.com → EKS (go-micro API gateway)
  │                        ├── api-user
  │                        ├── api-job
  │                        ├── api-run
  │                        └── api-notification
  │                     EKS (go-micro services)
  │                        ├── service-user      ─→ RDS (user-db)
  │                        ├── service-job       ─→ RDS (job-db)
  │                        ├── service-run       ─→ RDS (run-db)
  │                        ├── service-notification ─→ ElastiCache
  │                        └── service-emailer   ─→ SES (email)
  │                     RabbitMQ (Amazon MQ)
  │                        └── events between services
  └── web.example.com → EKS (React + Nginx frontend)
  
ECR: stores all Docker images
S3: file uploads, exports
SES: email delivery
CloudWatch: metrics, logs, alarms
X-Ray: distributed tracing
Secrets Manager: all passwords and API keys
```

---

## 12. Cost Model

Understanding AWS billing prevents surprises.

### How you're charged

**Compute (EC2, ECS, Lambda):**
- EC2/ECS: per hour or second the instance/task runs
- Lambda: per invocation + per GB-second of compute

**Storage:**
- S3: per GB stored per month + per request
- EBS: per GB provisioned per month (whether you use it or not)
- EFS: per GB stored (pay for what you use)

**Data Transfer (the sneaky one):**
- Inbound to AWS: FREE
- Within the same AZ: FREE
- Between AZs in same region: $0.01/GB each way
- Outbound to internet: $0.09-0.114/GB (first 10TB/month)

```
This is why: Loki/Mimir in kustomize-flux use S3 in the SAME REGION.
Data stays inside AWS = no transfer costs.
If you replicated to another region = pay per GB.
```

**Databases:**
- RDS: per hour (instance running) + per GB storage per month
- DynamoDB: per read/write unit + per GB storage
- ElastiCache: per hour

### Cost optimization strategies

1. **Right-size instances:** Don't run db.r6g.4xlarge for a database with 10 users
2. **Reserved instances:** 1-year commitment = 30-40% discount on EC2/RDS
3. **Spot instances:** 70-90% cheaper for interruptible workloads (batch jobs)
4. **S3 lifecycle policies:** Auto-move old files to cheaper storage classes
5. **Turn off dev environments:** Stop non-production RDS/EC2 overnight
6. **Use CloudWatch cost anomaly detection:** Get alerted when spending spikes

---

## 13. AWS Free Tier

What you can actually use for free:

| Service | Free Tier |
|---|---|
| EC2 | t2.micro or t3.micro, 750 hours/month, 12 months |
| RDS | db.t2.micro or db.t3.micro, 750 hours/month, 20GB storage, 12 months |
| S3 | 5GB storage, 20k GET, 2k PUT requests/month, always free |
| Lambda | 1 million invocations/month, 400k GB-seconds, always free |
| DynamoDB | 25GB storage, 25 WCU, 25 RCU, always free |
| CloudWatch | 10 metrics, 5GB logs, 3 dashboards, always free |
| CloudFront | 1TB transfer, 10M requests/month, 12 months |
| ECR | 500MB/month, 12 months |
| SNS | 1 million notifications/month, always free |
| SQS | 1 million requests/month, always free |

**12-month free tier:** Most compute/storage services. After 12 months, standard rates apply.
**Always free:** Lambda, DynamoDB, S3 (5GB), CloudWatch (basic).

---

## 14. AWS vs Your Local Stack

| AWS Service | Local Equivalent | What to Learn |
|---|---|---|
| EC2 | Your Linux machine | SSH, Linux admin |
| ECS / EKS | Minikube | Docker, Kubernetes |
| S3 | MinIO | S3 API, bucket policies |
| RDS PostgreSQL | PostgreSQL in Docker | SQL, migrations, backups |
| ElastiCache Redis | Redis in Docker | Redis commands, patterns |
| ALB | Nginx Ingress (K8s) | HTTP routing, SSL |
| Route 53 | /etc/hosts, CoreDNS | DNS concepts |
| CloudFront | Nginx caching | CDN, cache headers |
| Secrets Manager | K8s Secrets, Vault | Secret management |
| ACM | cert-manager | TLS certificates |
| CloudWatch Metrics | Prometheus | PromQL, metrics |
| CloudWatch Logs | Loki | Log aggregation |
| CloudWatch Dashboards | Grafana | Dashboards, alerts |
| X-Ray | Tempo / Jaeger | Distributed tracing |
| CodePipeline | Buildkite, ArgoCD | CI/CD pipelines |
| ECR | minikube docker registry | Container registries |
| IAM Roles | K8s RBAC, ServiceAccounts | Access control |
| CloudFormation | Kustomize / Helm | IaC, templating |
| VPC | K8s Namespaces, NetworkPolicy | Network isolation |
| Auto Scaling | HPA (K8s) | Horizontal scaling |
| SNS / SQS | RabbitMQ | Message queues |

Everything you learn locally transfers directly to AWS. The concepts are identical — only the managed service wrapper is different.
