# Fullstack Local Playbook — From Scratch

A learning guide for the fullstack project. Read top to bottom. Every command is explained before you run it.

---

## 0. What We're Building

```
Browser
  │
  ▼
Next.js (frontend :3000)
  │  rewrites /auth/* and /api/* via Next.js proxy
  ▼
Go API (backend :8080)
  ├── PostgreSQL (database :5432)
  ├── MinIO     (local S3 :9000)
  └── /metrics  ──► Prometheus ──► Grafana
```

| Problem | Tool | Local replacement for |
|---|---|---|
| Web UI | Next.js | — |
| REST API | Go + Gin | — |
| Database | PostgreSQL | — |
| File / image storage | MinIO | AWS S3 |
| Metrics collection | Prometheus | AWS CloudWatch |
| Metrics dashboard | Grafana | AWS CloudWatch dashboards |
| Container orchestration | Docker Compose (Phase 1) then Minikube (Phase 2) | AWS ECS / EKS |

---

## 1. Prerequisites

Check these before anything else:

```bash
docker --version          # need 20+
docker compose version    # need v2 (note: no dash)
go version                # need 1.22+
node --version            # need 18+
kubectl version --client  # need 1.26+
minikube version          # need 1.32+
```

If any are missing, install them first. On Ubuntu/WSL:

```bash
# Docker (if missing)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # then log out and back in

# Go
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc && source ~/.bashrc

# Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

---

## 2. Understanding the Project Structure

```
fullstack/
├── backend/              Go REST API
│   ├── main.go           entry point — wires everything together
│   ├── go.mod            Go module + dependency list
│   ├── Dockerfile        how to build the Go binary into a container
│   └── internal/
│       ├── auth/jwt.go       sign and verify JWT tokens
│       ├── db/postgres.go    connect to DB, run migrations, seed users
│       ├── handler/
│       │   ├── auth.go       POST /auth/login
│       │   ├── user.go       GET  /api/users
│       │   └── upload.go     POST /api/upload
│       ├── middleware/
│       │   ├── auth.go       check JWT on every /api/* request
│       │   └── cors.go       allow browser to call the API
│       └── storage/minio.go  talk to MinIO (local S3)
│
├── frontend/             Next.js web app
│   ├── next.config.mjs   rewrites /auth/* and /api/* to Go backend
│   ├── src/app/
│   │   ├── login/page.tsx    login form
│   │   ├── dashboard/page.tsx  users table
│   │   └── upload/page.tsx   image upload
│   └── src/lib/api.ts    fetch helpers used by all pages
│
├── monitoring/
│   ├── prometheus.yml    tells Prometheus where to scrape metrics from
│   └── grafana/
│       └── datasources.yml  auto-connects Grafana to Prometheus
│
├── docker-compose.yml    Phase 1: run everything on your machine
└── k8s/                  Phase 2: run everything on Minikube
    ├── deploy.sh         one-command deploy script
    ├── namespace.yaml
    ├── postgres/
    ├── minio/
    ├── backend/
    ├── frontend/
    └── monitoring/
```

---

## Phase 1 — Docker Compose (Start Here)

Docker Compose is the easiest way to run multi-container apps locally. It replaces the need to manually start each service.

### Step 1 — Generate Go dependencies

The Go backend needs a `go.sum` file (checksums for all dependencies). Generate it:

```bash
cd /home/hadiubuntu/codex-github/fullstack/backend
go mod tidy
```

**What this does:** Downloads all packages listed in `go.mod` (Gin, JWT, MinIO client, Prometheus), verifies their checksums, and writes `go.sum`. You only need to do this once (or when you add new packages).

You should see output like:
```
go: downloading github.com/gin-gonic/gin v1.10.0
go: downloading github.com/golang-jwt/jwt/v5 v5.2.1
...
```

### Step 2 — Start everything

```bash
cd /home/hadiubuntu/codex-github/fullstack
docker compose up --build
```

**What `--build` does:** Rebuilds the Docker images for backend and frontend from scratch. Without it, Docker reuses cached images (faster but won't pick up code changes).

**What happens in order:**
1. PostgreSQL starts, waits until healthy (`pg_isready` passes)
2. MinIO starts, waits until healthy (HTTP `/minio/health/live` returns 200)
3. Backend starts — connects to Postgres, runs DB migration, seeds 6 users, connects to MinIO, creates the `uploads` bucket
4. Frontend starts — builds Next.js, starts the Node server
5. Prometheus starts — begins scraping metrics from backend every 15s
6. Grafana starts — reads datasources config, connects to Prometheus

First run takes 2-5 minutes (downloading images, building Go binary, building Next.js). Subsequent runs are much faster.

### Step 3 — Verify each service is healthy

Open a second terminal and check:

```bash
# Is postgres running?
docker compose ps

# Can the backend reach postgres and respond?
curl http://localhost:8080/health
# Expected: {"status":"ok"}

# Can we see the backend's metrics?
curl http://localhost:8080/metrics
# Expected: lots of Prometheus metric lines starting with # HELP, go_goroutines, etc.

# Is MinIO up?
curl http://localhost:9000/minio/health/live
# Expected: empty 200 response
```

### Step 4 — Test the Login flow

```bash
# Login with admin credentials
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@local.dev",
    "role": "admin"
  }
}
```

**What just happened:**
1. Gin received the POST at `/auth/login`
2. Handler queried `SELECT id, name, password, role FROM users WHERE email = $1`
3. Used `bcrypt.CompareHashAndPassword` to verify "admin123" against the stored hash
4. Signed a JWT with the user's id, email, and role (expires in 24h)
5. Returned the token

Save the token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN
```

### Step 5 — Test the Users table endpoint

```bash
curl http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

Expected:
```json
{
  "users": [
    {"id": 1, "name": "Admin", "email": "admin@local.dev", "role": "admin", "created_at": "..."},
    {"id": 2, "name": "Alice Smith", "email": "alice@example.com", "role": "user", "created_at": "..."},
    ...
  ]
}
```

Try without the token — you should get a 401:
```bash
curl http://localhost:8080/api/users
# Expected: {"error":"missing token"}
```

**What the middleware does:** Every request to `/api/*` passes through `middleware.Auth()`. It reads the `Authorization: Bearer <token>` header, calls `jwt.Verify()`, and rejects requests with missing or expired tokens.

### Step 6 — Test image upload

```bash
# Pick any image on your machine, or download a sample
curl -o /tmp/test.png https://via.placeholder.com/150

curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.png"
```

Expected:
```json
{
  "url": "http://localhost:9000/uploads/20260101120000.png",
  "filename": "20260101120000.png"
}
```

Open that URL in your browser — you should see the image served directly from MinIO (local S3).

### Step 7 — Use the web UI

Open http://localhost:3000 in your browser.

1. You land on `/login` (the root `/` redirects there automatically)
2. Default credentials are pre-filled: `admin@local.dev` / `admin123`
3. Click Sign In → redirected to `/dashboard` with the users table
4. Click "Upload Image" → pick a file → click "Upload to MinIO"
5. After upload, the image URL appears and the image is shown inline

**Why can the browser call `/api/users` without specifying the backend URL?**
Look at `frontend/next.config.mjs`. It defines `rewrites`: any request from the browser to `/api/*` is transparently forwarded by the Next.js server to `http://backend:8080/api/*`. The browser only ever talks to the Next.js server (port 3000). This is the BFF (Backend for Frontend) proxy pattern — no CORS needed.

### Step 8 — Explore MinIO

Open http://localhost:9001 — MinIO console.
Login: `minioadmin` / `minioadmin123`

Navigate to Buckets → `uploads`. You'll see every image you uploaded. This is exactly what the AWS S3 console looks like. MinIO is a 100% S3-compatible API — the same code that talks to MinIO would talk to real S3 by changing the endpoint and credentials.

### Step 9 — Explore Prometheus

Open http://localhost:9090

In the query bar, try:
```
# Total HTTP requests to the backend
gin_requests_total

# Current number of goroutines (Go's lightweight threads)
go_goroutines

# Memory in use
go_memstats_alloc_bytes
```

Click the "Graph" tab to see metrics over time. Prometheus is polling `http://backend:8080/metrics` every 15 seconds and storing what it gets.

### Step 10 — Set up Grafana

Open http://localhost:3001 — Login: `admin` / `admin`

Prometheus is already wired as the default datasource (auto-configured by `monitoring/grafana/datasources.yml`).

**Import a pre-built Go dashboard:**
1. Left sidebar → Dashboards → Import
2. Enter Dashboard ID: `6671`
3. Click "Load"
4. Select "Prometheus" as the datasource
5. Click "Import"

You now have a full Go runtime dashboard: HTTP request rate, latency percentiles, goroutine count, heap memory, GC pauses. All powered by the `/metrics` endpoint your Go backend exposes for free.

---

## Understanding Key Concepts

### How JWT authentication works in this app

```
Login request
  │
  ▼
backend checks email + bcrypt(password) against DB
  │
  ▼ (success)
backend signs a JWT:
  Header: { alg: HS256 }
  Payload: { user_id: 1, email: "admin@local.dev", role: "admin", exp: <now+24h> }
  Signature: HMAC-SHA256(header.payload, JWT_SECRET)
  │
  ▼
browser stores token in localStorage
  │
Every subsequent request:
  Authorization: Bearer eyJhbGci...
  │
  ▼
middleware splits off the token, calls jwt.Verify()
  → checks the signature using the same JWT_SECRET
  → checks exp hasn't passed
  → sets user_id, email, role in the request context
```

The server never stores the token. It's self-contained — the signature proves it hasn't been tampered with.

### How MinIO mimics S3

MinIO implements the AWS S3 REST API exactly. The same `minio-go` client library works against both:

| Setting | MinIO (local) | Real AWS S3 |
|---|---|---|
| Endpoint | `minio:9000` | `s3.amazonaws.com` |
| Access Key | `minioadmin` | Your IAM key |
| Secret Key | `minioadmin123` | Your IAM secret |
| Secure (TLS) | `false` | `true` |
| Bucket | `uploads` | `my-bucket` |

The upload code in `storage/minio.go` would work unchanged against real S3 with only env var changes. That's the point — you learn S3 patterns without the bill.

### How Next.js rewrites eliminate CORS problems

Without the rewrite proxy:
- Browser is on `http://localhost:3000`
- It tries to call `http://localhost:8080/api/users`
- Browser blocks it: different port = different origin = CORS policy violation

With Next.js rewrites:
- Browser calls `http://localhost:3000/api/users` (same origin ✅)
- Next.js server (not the browser) calls `http://backend:8080/api/users`
- Browser never sees a cross-origin request

---

## Phase 2 — Minikube (Kubernetes)

Kubernetes is the production-grade way to run containers. Minikube runs a single-node Kubernetes cluster on your machine. The concepts you learn here are identical to AWS EKS (managed K8s).

### Core K8s concepts you'll use

| Concept | What it is | Analogy |
|---|---|---|
| Pod | Smallest deployable unit — 1+ containers | A running process |
| Deployment | Manages pods — restarts them if they crash | Supervisor |
| Service | Stable network endpoint for a Deployment | Load balancer address |
| ConfigMap | Non-secret config (env vars, config files) | `.env` file (safe to commit) |
| Secret | Sensitive config (passwords, keys) | `.env` file (NOT committed) |
| PersistentVolumeClaim | Request for disk storage | External hard drive |
| Namespace | Group of resources isolated from each other | Folder for K8s objects |
| NodePort | Makes a service accessible from outside the cluster | Port forwarding |

### Step 1 — Start Minikube (if not running)

```bash
minikube start --memory=4096 --cpus=2
```

4GB RAM and 2 CPUs is enough for our 7 pods. Wait until you see:
```
Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

Verify:
```bash
kubectl cluster-info
# Expected: Kubernetes control plane is running at https://192.168.49.2:8443
```

### Step 2 — Understand imagePullPolicy: Never

When you build a Docker image normally, it lives on your machine. But Minikube runs its own mini Docker daemon inside a VM. Images built outside Minikube aren't visible inside it.

Solution: tell Docker to build *inside* Minikube's daemon:
```bash
eval $(minikube docker-env)
# This changes your shell's DOCKER_HOST to point inside Minikube
# Any `docker build` after this goes into Minikube's registry
```

That's why the deploy script starts with `eval $(minikube docker-env)`, and why the K8s deployments have `imagePullPolicy: Never` — "don't try to pull from the internet, use the local image you already have".

### Step 3 — Deploy everything

```bash
cd /home/hadiubuntu/codex-github/fullstack
bash k8s/deploy.sh
```

The script:
1. Points Docker at Minikube's registry
2. Builds `fullstack-backend:latest` and `fullstack-frontend:latest` inside Minikube
3. Gets your Minikube IP and patches it into `k8s/backend/configmap.yaml` (for MinIO's public URL)
4. Applies all YAML files with `kubectl apply`
5. Waits for each deployment to be ready (`kubectl rollout status`)
6. Prints your access URLs

### Step 4 — Watch what's happening

Open a second terminal and watch pods come up:

```bash
kubectl get pods -n fullstack -w
```

You'll see pods go through: `Pending` → `ContainerCreating` → `Running`.

While pods are starting, inspect a deployment:
```bash
kubectl describe deployment backend -n fullstack
```

This shows the pod template, replica count, conditions, and recent events (useful for debugging).

### Step 5 — Inspect running pods

```bash
# List all pods
kubectl get pods -n fullstack

# View backend logs (same as docker logs but in K8s)
kubectl logs -n fullstack deployment/backend

# Follow logs in real time
kubectl logs -n fullstack deployment/backend -f

# Get a shell inside the backend pod
kubectl exec -it -n fullstack deployment/backend -- sh
```

### Step 6 — Understand how services expose ports

Look at `k8s/backend/service.yaml`:
```yaml
type: NodePort
ports:
  - port: 8080        # port inside the cluster
    targetPort: 8080  # port on the pod
    nodePort: 30080   # port on the minikube VM accessible from your machine
```

`NodePort` punches a hole through the VM. Access it at `http://<minikube ip>:30080`.

To get your minikube IP:
```bash
minikube ip
# e.g. 192.168.49.2
```

So your services are at:
```
http://192.168.49.2:30000  →  frontend
http://192.168.49.2:30080  →  backend
http://192.168.49.2:30090  →  MinIO API
http://192.168.49.2:30091  →  MinIO console
http://192.168.49.2:30900  →  Prometheus
http://192.168.49.2:30300  →  Grafana
```

### Step 7 — Understand Secrets vs ConfigMaps

Look at `k8s/backend/secret.yaml` — it holds `DATABASE_URL`, `JWT_SECRET`, passwords.
Look at `k8s/backend/configmap.yaml` — it holds `MINIO_ENDPOINT`, `MINIO_PUBLIC_URL`.

Inside the pod, both become env vars. The pod doesn't care where they came from.

The difference: Secrets are base64-encoded and can be restricted with RBAC. In a real cluster, you'd use Vault or AWS Secrets Manager instead of YAML Secrets (because YAML files can be committed to git accidentally).

Inspect what env vars a pod sees:
```bash
kubectl exec -n fullstack deployment/backend -- env | grep -E 'DATABASE|MINIO|JWT'
```

### Step 8 — Understand PersistentVolumeClaims

Look at `k8s/postgres/pvc.yaml`:
```yaml
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
```

This requests 1GB of disk. Minikube provides it from the host filesystem (via the `standard` StorageClass). In EKS, this would provision an AWS EBS volume.

The PVC is mounted into the Postgres pod at `/var/lib/postgresql/data`. If the pod restarts or is deleted, the data persists because the PVC is separate from the pod.

```bash
# View PVCs
kubectl get pvc -n fullstack

# View the actual PersistentVolumes (the actual disk allocations)
kubectl get pv
```

### Step 9 — Make a code change and redeploy

This is how the dev loop works in K8s:

```bash
# Make a change to backend code, e.g. add a field to the user response

# Rebuild the image inside Minikube
eval $(minikube docker-env)
docker build -t fullstack-backend:latest ./backend

# Restart the deployment to pick up the new image
kubectl rollout restart deployment/backend -n fullstack

# Watch the rollout
kubectl rollout status deployment/backend -n fullstack
```

K8s does a rolling restart: starts a new pod with the new image, waits until it's healthy, then kills the old pod. Zero downtime.

### Step 10 — Clean up

```bash
# Delete everything in the namespace
kubectl delete namespace fullstack

# Stop minikube (saves resources)
minikube stop

# Or destroy it completely
minikube delete
```

---

## Phase 3 — Monitoring Deep Dive

### What Prometheus actually collects

Your Go backend exposes `/metrics` automatically via `github.com/prometheus/client_golang`. View the raw data:

```bash
curl http://localhost:8080/metrics | head -50
```

Key metric families to understand:

```
# Go runtime metrics (free, always there)
go_goroutines                    # how many goroutines are running
go_memstats_alloc_bytes          # memory in use
go_gc_duration_seconds           # garbage collection pauses

# HTTP metrics (from Gin)
gin_requests_total{...}          # counter: total requests by path/method/status
gin_request_duration_seconds{...} # histogram: request latency

# Process metrics
process_cpu_seconds_total        # CPU time used
process_open_fds                 # open file descriptors
```

### Useful Prometheus queries

In the Prometheus UI (`:9090` or `:30900`):

```
# Requests per second over last 5 minutes
rate(gin_requests_total[5m])

# 95th percentile latency for the /api/users endpoint
histogram_quantile(0.95, rate(gin_request_duration_seconds_bucket{path="/api/users"}[5m]))

# Error rate (non-2xx responses)
rate(gin_requests_total{status!~"2.."}[5m])

# Memory growth over time
go_memstats_alloc_bytes
```

### Setting up a custom Grafana dashboard

1. Open Grafana → Dashboards → New Dashboard → Add Panel
2. In the query field, enter: `rate(gin_requests_total[1m])`
3. Set visualization to "Time series"
4. Set a legend: `{{path}} {{method}}`
5. Title: "Requests per second"
6. Save

Add more panels for:
- `go_goroutines` — should stay relatively stable
- `go_memstats_alloc_bytes` — watch for memory leaks (should oscillate, not grow forever)
- `histogram_quantile(0.99, rate(gin_request_duration_seconds_bucket[5m]))` — p99 latency

---

## Troubleshooting

### Backend fails to start: "connection refused" to postgres

Postgres isn't ready yet. Wait 10 seconds and try again. In docker-compose, the `depends_on: condition: service_healthy` handles this automatically.

### Backend fails: "no such host: minio"

In docker-compose, container names are DNS-resolvable by other containers. `minio:9000` works because both backend and minio are in the same docker-compose network.

### Uploaded image shows broken in browser

The `MINIO_PUBLIC_URL` env var controls what URL the backend returns for uploaded images. In docker-compose, it's `http://localhost:9000` (your machine). In minikube, it must be `http://<minikube-ip>:30090`. The deploy script patches this automatically.

### K8s pod stuck in `Pending`

```bash
kubectl describe pod -n fullstack <pod-name>
```
Look at the "Events" section at the bottom. Common causes:
- Not enough resources: reduce `--memory` requirement or free up RAM
- Image not found: make sure you ran `eval $(minikube docker-env)` before `docker build`

### K8s pod stuck in `CrashLoopBackOff`

The container is starting and immediately crashing. Check logs:
```bash
kubectl logs -n fullstack <pod-name> --previous
```
`--previous` shows logs from the last crashed container, not the current one.

### `go mod tidy` fails

Make sure you're inside the `backend/` directory (where `go.mod` lives) and that you have internet access.

### Next.js build fails in Docker

Usually a TypeScript error. Run locally first to see the error:
```bash
cd frontend && npm install && npm run build
```

---

## Credentials Reference

| Service | URL (docker-compose) | Username | Password |
|---|---|---|---|
| App login (admin) | http://localhost:3000 | admin@local.dev | admin123 |
| App login (user) | http://localhost:3000 | alice@example.com | password123 |
| MinIO console | http://localhost:9001 | minioadmin | minioadmin123 |
| Grafana | http://localhost:3001 | admin | admin |
| PostgreSQL | localhost:5432 | fullstack | fullstack123 |

For minikube, replace `localhost` with your `minikube ip` and use the NodePort numbers (30000, 30091, 30300).
