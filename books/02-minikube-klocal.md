# klocal — Running Your Team's Full Stack Locally

> How to bypass Buildkite and run the real production stack on your laptop.
> klocal wraps Minikube, kustomize, and Docker into a single developer workflow.

---

## Table of Contents

1. [The Problem klocal Solves](#1-the-problem-klocal-solves)
2. [How klocal Works — The Architecture](#2-how-klocal-works)
3. [Prerequisites](#3-prerequisites)
4. [Installing klocal](#4-installing-klocal)
5. [First-Time Setup](#5-first-time-setup)
6. [Controlling Resources — Memory, CPU, Disk](#6-controlling-resources)
7. [Starting Your First Cluster](#7-starting-your-first-cluster)
8. [The Dev Iteration Loop](#8-the-dev-iteration-loop)
9. [Accessing Your Cluster](#9-accessing-your-cluster)
10. [Inspecting the Cluster](#10-inspecting-the-cluster)
11. [Regenerating from the Infra Repo](#11-regenerating-from-the-infra-repo)
12. [klocal vs Raw Minikube](#12-klocal-vs-raw-minikube)
13. [From klocal to Production — How It Maps](#13-from-klocal-to-production)
14. [Understanding Tunnels — Theory, Reasons, and Options](#14-understanding-tunnels)
15. [Bastion Hosts, SSH -L, and Jump Boxes](#15-bastion-hosts-ssh--l-and-jump-boxes)

---

## 1. The Problem klocal Solves

### The Normal Iteration Loop (the slow way)

Without klocal, every code change goes through CI:

```
Write code on laptop
  ↓
git push
  ↓
Buildkite picks it up
  ↓
Buildkite builds Docker image
  ↓
Pushes image to ECR (AWS container registry)
  ↓
Deploys to shared staging environment
  ↓
You can finally test it
  ↑
  └── total wait: 5-15 minutes per change
```

Problems:
- 5-15 minute feedback loop for every single change
- Shared staging: your in-progress work breaks everyone else's testing
- If CI is down or slow, you're blocked entirely
- Proto changes regenerate protobufs in CI, adding even more time

### The klocal Way (the fast way)

```
Write code on laptop
  ↓
klocal dev sandbox rebuild service-user
  ↓
Image built locally → injected into local cluster → pod hot-swapped
  ↑
  └── total wait: 20-60 seconds
```

klocal runs the **entire production stack on your laptop** — every microservice, postgres, redis, S3 mock, SQS mock, ingress, TLS certs — identical to what runs in production. You iterate locally and only push when you're done.

### What "the production stack locally" actually means

The team maintains a **kustomize-flux** git repo — the infrastructure definitions. It describes every service, every environment variable, every image tag, every database config. Normally this is applied to AWS EKS by Flux CD (GitOps automation).

klocal reads that same repo, rewrites the parts that can't work locally (AWS endpoints, ECR image paths, TLS config), and applies everything to a local Minikube cluster. The result is a cluster that behaves like production, running entirely on your machine.

---

## 2. How klocal Works

### The Four Layers

```
┌─────────────────────────────────────────────────────────┐
│                    klocal binary                        │
│                                                         │
│  ┌──────────────┐   reads + merges                      │
│  │ Config Layer │ ◄── ~/.config/klocal/profiles/        │
│  └──────┬───────┘     blink.base.yaml (embedded)        │
│         │             blink.yaml (your overrides)        │
│         ▼                                               │
│  ┌──────────────────┐   runs                            │
│  │ Cluster Layer    │ ──► minikube start -p klocal-sandbox│
│  │ (Minikube wrap)  │ ──► kubectl --context klocal-sandbox│
│  └──────┬───────────┘ ──► /etc/hosts management         │
│         │             ──► mkcert TLS certs               │
│         ▼                                               │
│  ┌──────────────────┐   reads kustomize-flux repo        │
│  │ Manifest Layer   │ ──► renders Jinja2 templates       │
│  │ (generate+apply) │ ──► rewrites postgres DSNs         │
│  └──────┬───────────┘ ──► swaps S3→minio, SQS→ElasticMQ │
│         │             ──► kubectl apply                  │
│         ▼                                               │
│  ┌──────────────────┐   builds into cluster's Docker    │
│  │ Dev Layer        │ ──► saves name→image mapping       │
│  │ (build/rebuild)  │ ──► regenerates service manifests  │
│  └──────────────────┘ ──► applies only changed services  │
└─────────────────────────────────────────────────────────┘
```

### The Config Layering

klocal resolves config in order (last wins):

```
blink.base.yaml         ← shipped inside the binary, sane defaults
      ↓
~/.config/klocal/profiles/blink.yaml   ← your personal overrides
      ↓
environments.<env> block               ← per-environment overrides
      ↓
KLOCAL_* environment variables
      ↓
CLI flags (--workspace, --root, etc.)
```

You almost never need to touch anything except `blink.yaml` — and usually only the `cluster:` section to tune resources for your machine.

### The Dev Build Flow (what happens on rebuild)

```
klocal dev sandbox rebuild service-user
         │
         ├── 1. Read saved source path from dev-src.sandbox.env
         │
         ├── 2. Run make targets in the source dir
         │       (builds protobufs, vendor deps, etc.)
         │
         ├── 3. docker build -t klocal-dev/service-user:dev-<timestamp>
         │       (builds INTO minikube's Docker daemon, no push needed)
         │
         ├── 4. Save new tag to dev-images.sandbox.env
         │
         ├── 5. Regenerate the service's kustomize wrapper
         │       (points to new local image tag)
         │
         └── 6. kubectl apply (only the changed service)
```

No registry. No CI. The image lives inside the Minikube VM's Docker daemon.

---

## 3. Prerequisites

klocal shells out to these tools. Install them before running `klocal up`.

| Tool | Purpose | Install |
|---|---|---|
| **minikube** | The local Kubernetes cluster | `brew install minikube` / [minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/start/) |
| **kubectl** | K8s CLI (klocal falls back to minikube's if missing) | `brew install kubectl` |
| **docker** | Container builds | Docker Desktop / Rancher Desktop |
| **mkcert** | Local TLS certificates | `brew install mkcert` |
| **psql** | Used by `klocal db` command | `brew install postgresql` (client only) |
| **AWS CLI** | SSO login (for ECR image pulls) | `brew install awscli` |

For WSL2 on Windows:
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

---

## 4. Installing klocal

klocal ships as a single static binary. No runtime dependencies.

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/blink-system/klocal/releases/latest/download/klocal-aarch64-apple-darwin \
  -o /usr/local/bin/klocal && chmod +x /usr/local/bin/klocal

# Linux / WSL2 (x86_64)
curl -fsSL https://github.com/blink-system/klocal/releases/latest/download/klocal-x86_64-unknown-linux-musl \
  -o /usr/local/bin/klocal && chmod +x /usr/local/bin/klocal

# Verify
klocal --version

# Self-update later
klocal upgrade
```

### Shell completions (optional but useful)

```bash
# bash
klocal completions install bash

# zsh
klocal completions install zsh

# fish
klocal completions install fish
```

---

## 5. First-Time Setup

### Run init

```bash
klocal init
```

This creates `~/.config/klocal/profiles/blink.yaml` and opens it in your `$EDITOR`. It also prints a report of what's configured and what's missing.

### What blink.yaml looks like

```yaml
# ~/.config/klocal/profiles/blink.yaml
# This file overrides the base profile (blink.base.yaml) shipped in the binary.
# You only need to set what differs from the base.

workspace: ~/codex-github        # where your service repos live
root: ~/codex-github/kustomize-flux   # the infra/kustomize repo

settings:
  cluster:
    cpus: "6"       # tune for your machine (see section 6)
    memory: 12g
    disk: 40g
```

### Check the resolved config

```bash
# See the full merged config for sandbox env
klocal config sandbox

# See the raw base profile that ships in the binary
klocal config --base
```

---

## 6. Controlling Resources

### The Problem on Potato Laptops

The base profile (`blink.base.yaml`) ships with generous defaults designed for developer workstations:

```yaml
cluster:
  cpus: "10"      # 10 vCPUs
  memory: 16g     # 16 GB RAM
  disk: 40g       # 40 GB disk
  max_pods: 200   # kubelet pod limit
```

On a laptop with 16 GB total RAM, giving 16 GB to Minikube means your OS and browser get nothing. The cluster will thrash and feel slow or crash.

### Tuning for your machine

Override these in `~/.config/klocal/profiles/blink.yaml`:

```yaml
settings:
  cluster:
    cpus: "4"       # leave some for your OS and browser
    memory: 8g      # on a 16 GB machine, 8g is a reasonable split
    disk: 20g       # less disk if you're tight on space
    max_pods: 150   # keep above ~112 or pods will fail to schedule
    max_parallel_pulls: 3   # fewer parallel image pulls (less network burst)
```

### Guidelines by machine size

```
Your RAM    Recommended memory=   Leave for OS
─────────   ────────────────────  ────────────
8 GB        4g–5g                 3–4 GB
16 GB       8g–10g                6–8 GB
32 GB       16g–20g               12–16 GB
```

For CPUs: a good rule is `total_cores - 2`. If you have 8 cores, set `cpus: "6"`. Minikube's CPU setting is a **cap**, not a reservation — if the cluster is idle your OS gets those cycles back.

### Per-environment override

If you run multiple environments (sandbox, staging) and want different sizes:

```yaml
settings:
  cluster:
    cpus: "4"       # default for all environments
    memory: 8g

environments:
  sandbox:
    settings:
      cluster:
        cpus: "6"   # sandbox gets a bit more because it has more services
        memory: 10g
```

### Applying resource changes

Resource settings are only applied when Minikube starts. If the cluster is already running:

```bash
# 1. Stop the cluster (data and images survive on disk)
klocal stop sandbox

# 2. Start it again — klocal reads your new settings
klocal up sandbox
```

Or if you want a completely fresh cluster:

```bash
klocal down sandbox    # destroys cluster AND data
klocal up sandbox      # fresh start with new settings
```

### The max_pods gotcha

Minikube's default kubelet limit is 110 pods. The full Blink stack needs ~112+. If you set `max_pods` too low you'll see pods stuck in `Pending` with the error `Too many pods`. The base profile sets it to 200, which is safe. Don't go below 120.

---

## 7. Starting Your First Cluster

### The full `klocal up` sequence

Running `klocal up sandbox` does all of this in one command:

```
klocal up sandbox
  │
  ├── 1. AWS SSO login (opens browser for auth)
  │
  ├── 2. minikube start -p klocal-sandbox
  │       --cpus 4 --memory 8g --disk-size 20g
  │       --container-runtime=docker
  │       --extra-config=kubelet.max-pods=200
  │
  ├── 3. Configure kubelet for parallel image pulls
  │
  ├── 4. ECR login (pulls the team's private images)
  │       (uses AWS SDK directly — no aws CLI needed)
  │
  ├── 5. klocal generate sandbox
  │       (renders kustomize overlays from the flux repo)
  │
  ├── 6. klocal apply sandbox
  │       (localisation pass + kubectl apply)
  │       - rewrites postgres DSNs
  │       - swaps S3 → minio, SQS → ElasticMQ
  │       - patches imagePullPolicy: Always → IfNotPresent
  │       - injects CA trust
  │
  ├── 7. klocal certs sandbox
  │       (issues mkcert TLS certs for ingress hostnames)
  │
  └── 8. klocal hosts sandbox --write
          (updates /etc/hosts with ingress IPs)
```

### First `up` takes a while

The first time, Minikube has to:
- Download the Kubernetes images (~500 MB)
- Pull all the team's service images from ECR (~several GB depending on how many services)

Subsequent `up` calls after a `stop` are fast — images are cached on the Minikube disk.

### Checking the cluster came up healthy

```bash
# Are all pods running?
klocal status sandbox

# Wait until everything is ready (useful in CI or after a slow start)
klocal wait sandbox --timeout 1200
```

---

## 8. The Dev Iteration Loop

This is the core workflow — the one that replaces Buildkite.

### First build: register a service

The first time you want to work on a service, you do a `build`. This registers the source directory so `rebuild` knows where to find your code.

```bash
# Build service-user from its default source path
klocal dev sandbox build service-user

# If the repo folder name differs from the service name, supply the path
klocal dev sandbox build ui-jelvix ~/codex-github/web

# If you have a non-standard Dockerfile location
klocal dev sandbox build service-user --dockerfile Dockerfile.local
```

What this saves (persists across sessions):
```
~/.config/klocal/overrides/dev-images.sandbox.env
    service-user    klocal-dev/service-user:dev-1722345678901

~/.config/klocal/overrides/dev-src.sandbox.env
    service-user    ~/codex-github/service-user    Dockerfile
```

### Daily iteration: rebuild

Once a service is registered, you use `rebuild` from then on:

```bash
# Rebuild one service (most common — fast inner loop)
klocal dev sandbox rebuild service-user

# Rebuild multiple services at once
klocal dev sandbox rebuild service-user service-job

# Rebuild all registered services
klocal dev sandbox rebuild
```

### The rebuild loop in practice

```
Make a code change in ~/codex-github/service-user
  ↓
klocal dev sandbox rebuild service-user
  ↓
  ├── Runs make targets (proto gen, vendor, etc.)  ~10-30s
  ├── docker build                                 ~10-30s
  ├── kubectl apply (only service-user)            ~5s
  └── Pod rolls over with new image                ~5s
  ↓
Total: ~30-90 seconds depending on what changed
```

### Skip vendor prep when you know it'll fail

If your service has committed `vendor/` but the make target would fail (e.g. trying to re-vendor without network access):

```bash
klocal dev sandbox rebuild service-user --no-vendor
```

This skips the vendor make targets and goes straight to `docker build`.

### Proto change workflow

Proto changes are the slowest part because protobufs must regenerate before build. The recommended approach:

```bash
# 1. In your service's go.mod, add a local replace directive
#    pointing at your local proto repo:
#    replace github.com/your-org/proto => ../proto

# 2. Build with your local proto changes
klocal dev sandbox rebuild service-user

# 3. Remove the replace directive before committing
```

### See what's currently mapped

```bash
klocal dev sandbox
```

Output example:
```
service-user    klocal-dev/service-user:dev-1722345678901  (built 2h ago)
ui-jelvix       klocal-dev/ui-jelvix:dev-1722301234567     (built 5h ago)
```

### Clear a mapping (restore to the production image)

```bash
# Clear one service — reverts to the ECR image
klocal dev sandbox clear service-user

# Clear everything — all services use ECR images again
klocal dev sandbox clear all
```

---

## 9. Accessing Your Cluster

### Tunnel — the main access method

```bash
klocal tunnel sandbox
```

This runs in the **foreground** (keep the terminal open) and:
- Sets up ingress on `localhost:80` and `localhost:443`
- Creates TCP port-forwards for all services
- Manages the `/etc/hosts` mappings for ingress hostnames

Now you can open `https://app.sandbox.local` (or whatever the configured hostnames are) in your browser.

### Hosts — what's registered

```bash
# List all ingress hostnames and their IPs
klocal hosts sandbox

# Write them to /etc/hosts (requires sudo)
klocal hosts sandbox --write

# Clean them out of /etc/hosts
klocal hosts sandbox --clear
```

klocal marks its block in `/etc/hosts` with:
```
# >>> klocal:sandbox
192.168.49.2  app.sandbox.local api.sandbox.local
# <<< klocal:sandbox
```

### Direct Docker access

Sometimes you want to run `docker` commands against the cluster's daemon (inspect images, run one-off containers, etc.):

```bash
# Run any docker command against the cluster daemon
klocal docker sandbox images
klocal docker sandbox ps

# Or export the env vars to your shell session
eval "$(klocal docker-env sandbox)"
# Now: docker images → shows cluster images
# To undo:
eval "$(klocal docker-env sandbox -u)"
```

### Reading a pod's environment variables

Useful for debugging config issues:

```bash
# Print all env vars for service-user as shell export lines
klocal env sandbox service-user

# For a specific workload (if a service runs multiple deployments)
klocal env sandbox service-user worker
```

### psql into local postgres

```bash
# Opens psql connected to the cluster's postgres
klocal db sandbox

# Connect to a specific database
klocal db sandbox myapp_db
```

---

## 10. Inspecting the Cluster

### Status

```bash
# All environments — shows which clusters are running
klocal status

# One environment — shows pods and jobs
klocal status sandbox
```

Example output:
```
NAMESPACE  NAME                    READY   STATUS    RESTARTS
default    service-user-abc123     1/1     Running   0
default    service-job-def456      1/1     Running   2
default    ui-jelvix-ghi789        1/1     Running   0
default    postgres-0              1/1     Running   0
```

### List services

```bash
# All individually-deployable services in the sandbox env
klocal services sandbox
```

This shows the services defined in the kustomize repo that can be built/rebuilt individually, including "did you mean" suggestions if you typo a service name.

### Restart a service

```bash
# Rolling restart (picks up config changes without a rebuild)
klocal restart sandbox service-user

# Restart multiple
klocal restart sandbox service-user service-job
```

---

## 11. Regenerating from the Infra Repo

When someone updates the kustomize-flux repo (new service added, env var changed, dependency updated), you need to regenerate:

```bash
# Step 1: Pull the latest infra repo
cd ~/codex-github/kustomize-flux && git pull

# Step 2: Regenerate klocal's rendered manifests
klocal generate sandbox

# Step 3: Apply the new manifests to the cluster
klocal apply sandbox
```

Or in one shot:

```bash
klocal generate sandbox && klocal apply sandbox
```

### Apply just one service

```bash
# Useful if only one service's config changed
klocal apply sandbox service-user
```

### Build (dry run — see what would be applied)

```bash
# Preview the YAML that would be applied, without changing anything
klocal build sandbox service-user
```

---

## 12. klocal vs Raw Minikube

You already know how raw Minikube works from `02-minikube-local-stack.md`. Here is how klocal relates:

| Raw Minikube | klocal equivalent | What klocal adds |
|---|---|---|
| `minikube start --memory=8g --cpus=4` | `klocal up sandbox` | Also does SSO, generate, apply, certs, hosts in one command |
| `kubectl apply -k overlays/sandbox` | `klocal apply sandbox` | Also localises DSNs, mocks, pull policy, CA trust |
| `eval $(minikube docker-env)` then `docker build` | `klocal dev sandbox build service-user` | Also saves mappings, regenerates manifests, applies to cluster |
| `minikube profile list` | `klocal status` | Shows klocal-managed clusters only |
| `minikube stop -p klocal-sandbox` | `klocal stop sandbox` | Same, plus tears down tunnel and cleans hosts |
| `minikube delete -p klocal-sandbox` | `klocal down sandbox` | Same |
| Edit `/etc/hosts` manually | `klocal hosts sandbox --write` | Manages a marked block, won't corrupt other entries |
| `minikube docker-env` | `klocal docker-env sandbox` | Same |

The key insight: klocal is a **workflow automation layer** on top of Minikube + kubectl + Docker. It doesn't replace any of those tools — it scripts the repetitive parts so you don't forget a step.

### Cluster naming

klocal names Minikube profiles `klocal-<env>`. You can still use raw Minikube commands against them if you need to:

```bash
minikube status -p klocal-sandbox
minikube ssh -p klocal-sandbox
minikube dashboard -p klocal-sandbox
```

---

## 13. From klocal to Production — How It Maps

klocal's "localisation pass" is the glue between local and production. Here is what it rewrites and why:

```
PRODUCTION (EKS + AWS)                  LOCAL (klocal + Minikube)
══════════════════════════════════════════════════════════════════

Image: 123456.ecr.amazonaws.com/        Image: klocal-dev/service-user:dev-<ts>
       service-user:v1.2.3              (built into cluster daemon, no push)

imagePullPolicy: Always                 imagePullPolicy: IfNotPresent
(always fetch from ECR)                 (use what's already in the daemon)

postgres://rds.endpoint.aws/mydb        postgres://localhost:5432/mydb
(AWS RDS)                               (postgres pod in cluster)

s3://my-bucket / aws s3 client          http://minio:9000 / minio
(AWS S3)                                (Minio pod, 100% S3-compatible API)

https://sqs.amazonaws.com/...           http://elasticmq:9324
(AWS SQS)                               (ElasticMQ pod, SQS-compatible API)

TLS cert from ACM                       mkcert self-signed cert
(Amazon Certificate Manager)           (trusted locally via mkcert CA)

Route 53 DNS                            /etc/hosts entries
(api.yourdomain.com → ALB)             (api.sandbox.local → Minikube IP)

ECR image pull                          No pull secret needed
(requires aws ecr get-login-password)  (image already in daemon)
```

### Your application code sees none of this

The rewrites happen at the Kubernetes manifest level — in the pod's environment variables and image spec. Your Go/Node service code reads `DATABASE_URL`, `S3_ENDPOINT`, `SQS_URL` from env vars exactly as it does in production. You don't add `if local` branches in application code.

### The lifecycle of a feature

```
1. klocal up sandbox
   └── cluster running, all production services deployed

2. klocal dev sandbox build service-user ~/codex-github/service-user
   └── your local code is now running inside the cluster

3. Write code → klocal dev sandbox rebuild service-user
   └── 30-90 second hot-swap loop, no CI involved

4. When happy, git push → Buildkite CI → ECR → staging
   └── CI now validates what you already know works locally

5. Merge PR → production deploy via Flux CD
   └── identical kustomize manifest that ran locally
```

This is why klocal is worth understanding: the local stack and the production stack are the **same manifest**, just with a localisation pass applied. If it works locally, the odds of it working in production are very high.

---

## 14. Understanding Tunnels

### What a Tunnel Is

A tunnel is a **pipe between two network locations that wouldn't normally be able to talk to each other directly**.

The classic example is an SSH tunnel:

```
Your laptop          Firewall          Remote server
    │                   │                   │
    │  direct connect?  │                   │
    │ ──────────────────X  (blocked)        │
    │                                       │
    │  SSH tunnel (port forward)            │
    │ ══════════════════════════════════════│
    │  localhost:5432 ──────────────────► postgres:5432
```

You open `localhost:5432` on your laptop and it comes out the other side at the remote server's postgres. The firewall never sees "postgres traffic" — it just sees an SSH connection.

The same idea applies everywhere: ngrok, kubectl port-forward, `klocal tunnel`. They are all just pipes.

---

### Why Tunnels Exist — The Real Situations

Tunneling was invented because networks have walls. Here are the real situations that keep coming up:

**1. Firewalls blocking direct access**

Corporate networks block everything except port 80/443. You need to reach port 5432 (postgres) on a remote server.

```
Your laptop :5432 ──X── firewall ──X── server :5432
                    (blocked)

Solution: SSH tunnel
Your laptop :5432 ══════════════════════ server :5432
               (disguised as SSH on port 22, which IS allowed)
```

The firewall sees SSH traffic (allowed). You get postgres.

**2. NAT — your machine is hidden behind a router**

Your home router has one public IP. Your laptop, phone, and TV all share it. From the internet, none of your devices are directly reachable — the router hides them all.

```
Internet only sees: 203.0.113.5  (your router's public IP)
                    has no idea about 192.168.1.x  (your devices)

Solution: connect both sides to a relay in the middle
  your laptop ══ relay server ══ target machine
```

This is how VPNs, P2P apps (BitTorrent, Zoom), and remote desktop tools work.

**3. Sharing localhost with the internet (webhooks)**

You're building a webhook handler on your laptop. Stripe/GitHub/Twilio needs to POST to your server — but your server is `localhost:3000` behind your home router. The internet has no idea your laptop exists.

```
Stripe servers → your-laptop:3000   ✗  unreachable (behind NAT/router)

Solution: ngrok
Stripe → https://abc123.ngrok.io → ngrok relay servers → your laptop:3000
```

ngrok gives you a public URL that tunnels back to your laptop. This is how most developers test webhooks locally without deploying.

**4. Bastion hosts — private subnets in AWS**

In AWS, databases and internal services are in a **private subnet** — no public IP, completely unreachable from the internet. A **bastion host** (or jump box) sits in the public subnet as the only allowed entry point.

```
Internet
    │
    ▼
Bastion host  (public subnet, has public IP)
    │
    └── Private subnet
          ├── postgres  (no public IP — unreachable directly)
          ├── redis     (no public IP — unreachable directly)
          └── internal APIs

You can SSH into the bastion. From the bastion you can reach postgres.
But you cannot reach postgres directly from your laptop.

Solution: SSH tunnel through bastion
your laptop :5432 ══ bastion ══ postgres:5432
```

Every AWS engineer uses this pattern daily to connect SQL clients to RDS databases in private subnets.

**5. VM / container network boundaries**

Your WSL2 situation is this category. Minikube runs inside WSL2 which runs inside Windows. Each layer has its own network — there is no direct route from a Windows browser to a pod inside Minikube.

The tunnel is the bridge between those network layers.

---

### The Pattern Behind All of Them

Every tunnel in history is the same shape:

```
A cannot reach B directly
      │
      └── A and B both CAN reach C
          (or A can reach C, and C can reach B)
                │
                └── C becomes the relay

A ══ C ══ B
```

What changes is only what is blocking the direct connection:
- A firewall blocking a port
- NAT hiding the machine behind a router
- A private subnet with no public IP
- A network boundary (WSL2 / VM / container)
- Geography (relay closer to both parties is faster)

The solution is always the same: find a path both sides can use and pipe traffic through it.

---

### The WSL2 Network Problem

This is the specific problem `klocal tunnel` solves. On Windows with WSL2 your machine has **two separate network stacks**:

```
Your Windows machine
│
├── Windows network
│     Your browser and apps live here
│     IP: 192.168.1.x  (visible to your router)
│
└── WSL2 VM  (Linux lives here)
      IP: 172.x.x.x  (internal — Windows apps can't reach this)
      │
      └── Minikube VM  (nested inside WSL2)
            IP: 192.168.49.2  (even more internal)
            │
            └── Ingress controller
                  listening on port 80 and 443
```

Your Windows browser wants to open `https://app.sandbox.local`. But the ingress controller is buried **three layers deep** — inside a VM inside another VM. There is no direct route.

```
Windows browser → 192.168.49.2:443   ✗  unreachable
```

---

### What klocal tunnel Does

`klocal tunnel sandbox` punches a pipe through all those layers and exposes the ingress on `localhost` — which Windows CAN reach from a browser:

```
Windows browser
      │
      │  https://app.sandbox.local
      │  (DNS → 127.0.0.1 via /etc/hosts)
      ▼
 localhost:443   ← klocal tunnel is listening here
      │
      │  pipes traffic through WSL2 networking
      ▼
 WSL2 VM
      │
      │  kubectl port-forward
      ▼
 Minikube VM: 192.168.49.2:443
      │
      ▼
 Ingress controller
      │
      ├── app.sandbox.local  →  frontend Service  →  frontend Pod
      └── api.sandbox.local  →  backend Service   →  backend Pod
```

The tunnel "flattens" the three-layer problem into a single `localhost` address your browser understands.

---

### Why the Tunnel Must Stay Open

A tunnel is not a setting you configure once and forget — it is an **active process**. The pipe exists only while the process runs.

```
klocal tunnel sandbox  is running   →   browser works  ✅
klocal tunnel sandbox  is killed    →   browser gets "connection refused"  ✗
```

This is the same for all tunnels: SSH `-L` port forwards, ngrok, kubectl port-forward. Kill the process, kill the pipe. This is expected behaviour — just restart the tunnel.

In practice: keep `klocal tunnel sandbox` running in a dedicated terminal tab while you work. You will often also see this used in CI (`klocal wait sandbox`) where the tunnel is opened and held open by the CI process.

---

### The Two Things You Need

The tunnel handles *routing* but not *DNS*. Your browser also needs to know that `app.sandbox.local` means `127.0.0.1`. That is what `/etc/hosts` is for:

```
# /etc/hosts — manual DNS, checked before any real DNS server
127.0.0.1   app.sandbox.local
127.0.0.1   api.sandbox.local
```

```
Browser types: https://app.sandbox.local
      │
      ├── 1. Check /etc/hosts → found: 127.0.0.1
      │        (never even asks a real DNS server)
      ▼
      2. Connect to 127.0.0.1:443
      │
      ▼
      3. klocal tunnel picks it up → forwards to Minikube ingress
      │
      ▼
      4. Ingress routes by hostname → correct Service → Pod
```

| What it does | Command |
|---|---|
| Writes `/etc/hosts` entries | `klocal hosts sandbox --write` |
| Opens the tunnel pipe | `klocal tunnel sandbox` (keep running) |
| Both together at startup | `klocal up sandbox` (does both automatically) |

---

### Tunnel vs Ingress vs Service — The Full Picture

These three things work together. A common point of confusion is thinking they overlap — they don't:

```
Internet / your browser
        │
        │  TUNNEL
        │  (solves the WSL2 network gap — gets traffic to Minikube at all)
        ▼
Minikube VM: ingress controller
        │
        │  INGRESS
        │  (HTTP routing rules — which hostname/path goes to which service)
        ▼
Kubernetes Service
        │
        │  SERVICE
        │  (stable internal address — finds the right pods regardless of restarts)
        ▼
Pod (your running container)
```

Each layer solves a different problem:
- **Tunnel** — bridges the network gap between your browser and Minikube
- **Ingress** — routes HTTP traffic to the right service by hostname or path
- **Service** — gives pods a stable address so other things can find them

Remove any one layer and the whole chain breaks.

---

### Other Ways to Tunnel

kubectl port-forward is not the only option. Here are all the common tools and when to use each:

**`kubectl port-forward` — quickest for one pod or service**

```bash
# Forward local 8080 to nginx pod port 80
kubectl port-forward pod/nginx 8080:80

# Forward local 5432 to postgres service port 5432
kubectl port-forward svc/postgres 5432:5432
```

Works against any Kubernetes cluster — Minikube, EKS, GKE, anything. Most common for quick debugging or database access. One port at a time.

**`minikube service` — Minikube only, opens browser automatically**

```bash
# Print the URL for a service
minikube service nginx --url
# → http://192.168.49.2:31234

# Open it directly in browser
minikube service nginx
```

Simpler than port-forward for Minikube. Does not work against real clusters.

**`minikube tunnel` — needed for LoadBalancer services**

When a Service is type `LoadBalancer` it needs a cloud load balancer to get an external IP. In Minikube that never happens — it stays `<pending>` forever:

```bash
kubectl get svc
# NAME    TYPE           EXTERNAL-IP
# nginx   LoadBalancer   <pending>    ← stuck forever without tunnel
```

`minikube tunnel` fakes the cloud load balancer and assigns a real IP:

```bash
minikube tunnel   # keep this running
kubectl get svc
# NAME    TYPE           EXTERNAL-IP
# nginx   LoadBalancer   127.0.0.1   ← now reachable
```

This is what `klocal tunnel` is built on top of — it runs `minikube tunnel` and also manages port-forwards for every service in one command.

**`ngrok` — share localhost with the internet**

Every other option only makes services reachable on your machine. ngrok gives your local service a public URL anyone on the internet can reach:

```bash
ngrok http 8080
# → https://abc123.ngrok.io  forwards to  localhost:8080
```

Real use case: webhook testing. Stripe/GitHub/Twilio need to POST to your server. They can't reach `localhost:8080` — but they can reach `https://abc123.ngrok.io`.

```
Stripe (internet) → https://abc123.ngrok.io → ngrok servers → your laptop:8080
```

Not for Kubernetes specifically — works for any local process.

**`ssh -L` — the classic, for bastion/jump box access**

```bash
# Tunnel local port 5432 through bastion to reach private RDS
ssh -L 5432:my-rds.internal:5432 user@bastion-host

# Now in another terminal, connect as if postgres were local:
psql -h localhost -p 5432 -U myuser mydb
```

Standard AWS workflow for accessing RDS, Redis, or any service in a private subnet. The bastion is the relay — you can SSH into it, and from there it can reach the private resources.

**VSCode Remote SSH — transparent tunnel for development**

Not usually called a tunnel but it is one. When you open a folder on a remote machine via VSCode Remote SSH, VSCode silently tunnels the filesystem, terminal, and even the browser preview back to your local editor.

```
Your VSCode (Windows)
      │  SSH tunnel
      ▼
Remote server or WSL2
      └── your code runs here, VSCode displays it there
```

The "Open in Browser" button when running a dev server inside WSL2 also auto-creates a port-forward from WSL2 → your Windows browser.

---

### Summary — Which Tool for Which Situation

| Situation | Tool |
|---|---|
| Quick access to one pod/service in any cluster | `kubectl port-forward` |
| Quick access to a service in Minikube only | `minikube service` |
| LoadBalancer services in Minikube | `minikube tunnel` |
| Full team stack access (all services at once) | `klocal tunnel` |
| Share localhost with the internet (webhooks, demos) | `ngrok` |
| Access private server through a bastion/jump box | `ssh -L` |
| Develop on a remote machine transparently | VSCode Remote SSH |

The underlying mechanic is identical in all of them — pipe traffic through a path that both sides can already reach.

---

## 15. Bastion Hosts, SSH -L, and Jump Boxes

### What a Bastion Host Is

A bastion is a **single hardened server whose only job is to be the one allowed entry point into a private network**.

The name comes from military architecture — a bastion is a fortified structure that sticks out from a castle wall, designed to be the one point defenders focus on protecting.

```
Internet
    │
    │  only port 22 (SSH) allowed in
    ▼
┌──────────────────┐
│  Bastion Host    │  ← the only server with a public IP
│  (= jump box)    │    hardened: no apps, minimal software,
└────────┬─────────┘    SSH keys only (no passwords)
         │
         │  private network — nothing here has a public IP
         ├── postgres (RDS)
         ├── redis
         ├── service-user
         ├── service-job
         └── internal APIs
```

Everything in the private network is invisible to the internet. The bastion is the single door. You secure the door extremely well and stop worrying about everything behind it.

**Jump box** is just another name for the same thing. Bastion = jump box. You "jump" through it to reach internal servers.

---

### Why Private Subnets Exist

In AWS every resource lives in a VPC (Virtual Private Cloud). Inside a VPC you can have two types of subnets:

```
VPC: 10.0.0.0/16
│
├── Public subnet: 10.0.1.0/24
│     Resources here CAN have public IPs
│     Route table points to Internet Gateway
│     └── Bastion host (EC2)  ← lives here
│
└── Private subnet: 10.0.2.0/24
      Resources here CANNOT have public IPs
      Route table has NO Internet Gateway
      └── RDS postgres         ← lives here
      └── Redis ElastiCache    ← lives here
      └── App servers (EC2)    ← live here
```

Even if someone finds your RDS endpoint URL they cannot connect — there is literally no network path from the internet to a private subnet. The only way in is through the bastion.

---

### What `ssh -L` Means

`-L` stands for **Local port forward**.

Full syntax:

```bash
ssh -L [local_port]:[destination_host]:[destination_port] [user@bastion]
```

Read it as: **"on my Local machine, open [local_port], and forward anything connecting there through the SSH connection to [destination_host]:[destination_port]"**

Concrete example:

```bash
ssh -L 5432:my-rds.internal.amazonaws.com:5432 ec2-user@bastion.mycompany.com
```

Breaking it down:

```
5432                              → open this port on MY laptop
my-rds.internal.amazonaws.com     → the final destination host
5432                              → the final destination port
ec2-user@bastion.mycompany.com    → the SSH server to tunnel through
```

What happens when you run this:

```
Your laptop
  ├── opens localhost:5432  (listening for connections)
  └── establishes SSH connection to bastion

You run: psql -h localhost -p 5432
  ↓
localhost:5432
  ↓  SSH tunnel (encrypted)
bastion.mycompany.com
  ↓  bastion connects onward (it CAN reach the private subnet)
my-rds.internal.amazonaws.com:5432
  ↓
postgres responds
```

Your laptop never talks to RDS directly. Your laptop talks to `localhost:5432`, which the SSH process silently pipes to RDS through the bastion. From RDS's perspective the connection is coming from the bastion — it never knows about your laptop.

---

### The Three SSH Port Forward Flags

There are three, not just `-L`:

```
-L   Local forward     you → bastion → remote
     "open a port on MY machine, forward to remote"
     use case: reach a private server from your laptop

-R   Remote forward    remote → bastion → you
     "open a port on the REMOTE server, forward back to my machine"
     use case: expose your localhost to a remote server
     (this is what ngrok does internally)

-D   Dynamic forward   SOCKS proxy
     "turn the SSH connection into a proxy for ALL traffic"
     use case: browse the internet as if you were on the remote network
     (how many corporate VPNs work under the hood)
```

You will use `-L` 95% of the time.

---

### How to Set Up a Bastion in AWS

**Step 1 — Launch a small EC2 in the public subnet**

```
Instance type:  t3.micro  (bastion does almost nothing, cheapest is fine)
AMI:            Amazon Linux 2 or Ubuntu
Subnet:         public subnet
Security Group:
  Inbound:   port 22 (SSH)  from YOUR IP only  ← not 0.0.0.0/0
  Outbound:  all  (it needs to reach the private subnet)
Key pair:       create or use existing SSH key
Public IP:      enabled
```

**Step 2 — Allow bastion to reach your private resource**

Your RDS security group needs to allow connections from the bastion:

```
RDS Security Group:
  Inbound:  port 5432  from  bastion's Security Group ID
```

You reference the security group ID, not an IP — this means "allow anything in that security group", so if the bastion IP ever changes you don't need to update this rule.

**Step 3 — Test the bastion itself**

```bash
ssh -i ~/.ssh/my-key.pem ec2-user@<bastion-public-ip>

# Once inside the bastion, can you reach RDS?
psql -h my-rds.internal.amazonaws.com -U myuser mydb
# ✅ works — bastion is in the same VPC as RDS
```

**Step 4 — Open the tunnel from your laptop**

Now you want your local tools (TablePlus, DBeaver, psql) to connect. You don't need to live inside the bastion terminal — open the tunnel and work from your laptop:

```bash
ssh -i ~/.ssh/my-key.pem \
    -L 5432:my-rds.internal.amazonaws.com:5432 \
    -N \
    ec2-user@<bastion-public-ip>
```

The `-N` flag means "don't open a shell, just hold the tunnel open". Without it you get an interactive bastion terminal which you don't need.

Now in another terminal on your laptop:

```bash
psql -h localhost -p 5432 -U myuser mydb
# ✅ connects through bastion to RDS
```

---

### SSH Config File — Save Yourself the Typing

Typing that long command every time is painful. Put it in `~/.ssh/config`:

```
# ~/.ssh/config

Host bastion
    HostName 54.123.45.67
    User ec2-user
    IdentityFile ~/.ssh/my-key.pem

Host rds-tunnel
    HostName 54.123.45.67
    User ec2-user
    IdentityFile ~/.ssh/my-key.pem
    LocalForward 5432 my-rds.internal.amazonaws.com:5432
    ServerAliveInterval 60    # keep connection alive, don't time out
```

Now:

```bash
ssh bastion          # jump into bastion shell
ssh -N rds-tunnel    # open the tunnel silently, no shell
```

---

### The Jump Flag `-J` — Modern Shortcut

Modern SSH (OpenSSH 7.3+) has a cleaner way to SSH directly to a private machine without manually going through the bastion first:

```bash
# Old way — two hops manually
ssh ec2-user@bastion
ssh ec2-user@10.0.2.50    # from inside bastion

# New way — -J handles the hop in one command from your laptop
ssh -J ec2-user@bastion ec2-user@10.0.2.50
```

Or in `~/.ssh/config`:

```
Host private-server
    HostName 10.0.2.50
    User ec2-user
    IdentityFile ~/.ssh/my-key.pem
    ProxyJump bastion
```

Then from your laptop:

```bash
ssh private-server
# SSH automatically jumps through bastion → private-server
```

---

### The Full Picture

```
Your laptop
    │
    │  ssh -L 5432:rds:5432 -N ec2-user@bastion   (tunnel open)
    ▼
localhost:5432  ← your psql/TablePlus connects here
    │
    │  SSH tunnel (encrypted, looks like normal SSH to firewalls)
    ▼
Bastion EC2 (public subnet, public IP)
    │
    │  bastion opens a TCP connection (it's in the same VPC)
    ▼
RDS postgres (private subnet, no public IP)
    │
    ▼
your query runs
```

---

### Summary

```
Bastion / jump box
  = single hardened server in the public subnet
  = the only allowed entry point to private resources
  = secure one thing well instead of every private server

Private subnet
  = no public IPs, no internet gateway
  = your databases and internal services live here
  = unreachable from internet without going through bastion

ssh -L [local]:[dest-host]:[dest-port] user@bastion
  = Local port forward
  = open a port on MY laptop, pipe it through SSH to destination
  = your local tools connect to localhost, traffic comes out at RDS

-N flag
  = no shell, just hold the tunnel open

-J flag
  = jump directly to a machine behind bastion in one SSH command

~/.ssh/config
  = save long commands as short aliases (ssh rds-tunnel)
```
