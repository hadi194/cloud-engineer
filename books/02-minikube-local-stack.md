# Minikube & The Local AWS Stack — A Developer's Field Guide

> How to run a production-equivalent infrastructure on your laptop.
> Every tool here is the free, local version of a paid AWS service.

---

## Table of Contents

1. [What Kubernetes Is and Why It Exists](#1-what-kubernetes-is-and-why-it-exists)
2. [Minikube — Kubernetes on Your Laptop](#2-minikube)
3. [Core Kubernetes Objects](#3-core-kubernetes-objects)
4. [kubectl — The CLI You Live In](#4-kubectl)
5. [Helm — The Package Manager for K8s](#5-helm)
6. [Kustomize — Config Without Templating](#6-kustomize)
7. [The Local AWS Equivalents Stack](#7-the-local-aws-equivalents-stack)
8. [Storage — MinIO (local S3)](#8-minio--local-s3)
9. [Databases — PostgreSQL and Redis locally](#9-databases-locally)
10. [Networking — Nginx Ingress (local ALB)](#10-nginx-ingress--local-alb)
11. [Certificates — cert-manager (local ACM)](#11-cert-manager--local-acm)
12. [Monitoring — Prometheus + Grafana (local CloudWatch)](#12-prometheus--grafana--local-cloudwatch)
13. [Logging — Loki (local CloudWatch Logs)](#13-loki--local-cloudwatch-logs)
14. [Tracing — Tempo (local X-Ray)](#14-tempo--local-x-ray)
15. [Secrets — Vault (local Secrets Manager)](#15-vault--local-secrets-manager)
16. [GitOps — ArgoCD (local CodePipeline)](#16-argocd--local-codepipeline)
17. [Message Queue — RabbitMQ (local SQS/SNS)](#17-rabbitmq--local-sqssns)
18. [Building Your Full Local Stack](#18-building-your-full-local-stack)
19. [From Local to Production — How It All Maps](#19-from-local-to-production)

---

## 1. What Kubernetes Is and Why It Exists

### The Problem Docker Alone Doesn't Solve

Docker solved "it works on my machine" by packaging apps into containers. But Docker alone doesn't answer:

- What happens when a container crashes at 3am?
- How do you update 20 containers across 10 servers with no downtime?
- How do you scale from 2 to 20 containers when traffic spikes?
- How do containers on different servers find each other?
- How do you roll back a bad deployment?

**Kubernetes (K8s)** answers all of these. It's an orchestration platform — it manages where containers run, keeps them healthy, scales them, and connects them.

### The Core Idea

You tell Kubernetes the DESIRED STATE. Kubernetes makes reality match that state and keeps it there forever.

```
You say: "I want 3 copies of my API running at all times"

Kubernetes:
  → starts 3 containers
  → one crashes at 3am → restarts it automatically
  → a node (VM) dies → reschedules those containers on surviving nodes
  → you deploy v2 → replaces containers one at a time (zero downtime)
  → traffic spikes → you say "5 copies" → scales up immediately
```

This is called the **reconciliation loop** — K8s constantly compares actual state to desired state and fixes any drift.

### Where K8s Came From

Google ran billions of containers internally for 15 years using an internal system called **Borg**. They open-sourced the ideas as Kubernetes in 2014. Every large tech company that runs containers at scale uses it.

---

## 2. Minikube

### What Minikube Is

Minikube runs a complete Kubernetes cluster as a single node on your machine. It uses a VM (or Docker) to host the cluster.

```
Your machine
└── Minikube VM (hypervisor or Docker)
    └── Kubernetes cluster (1 node)
        ├── Control plane (API server, scheduler, etcd, controller manager)
        └── Worker node (where your pods run)
```

In production, the control plane and worker nodes are separate machines. In Minikube, they're all in one VM — fine for learning and development.

### Minikube vs Other Local K8s

| Tool | Description | Best for |
|---|---|---|
| **Minikube** | Single-node, feature-rich, add-ons ecosystem | Learning, dev, testing add-ons |
| kind | K8s in Docker containers | CI pipelines, lightweight |
| k3s / k3d | Lightweight K8s | Edge, resource-constrained |
| Docker Desktop K8s | Built into Docker Desktop | Mac/Windows devs |
| Rancher Desktop | Open-source Docker Desktop alternative | Alternative to Docker Desktop |

Minikube is recommended for learning because it has built-in add-ons for ingress, metrics-server, dashboard, etc.

### Minikube Commands

```bash
# Start a cluster (specify resources for heavier workloads)
minikube start --memory=4096 --cpus=2 --disk-size=20g

# Start with a specific Kubernetes version
minikube start --kubernetes-version=v1.28.0

# Check cluster status
minikube status

# Get the cluster IP (your cluster's "public" IP from your machine)
minikube ip
# → 192.168.49.2

# Open the K8s dashboard in browser
minikube dashboard

# SSH into the minikube VM
minikube ssh

# Enable add-ons
minikube addons enable ingress          # Nginx ingress controller
minikube addons enable metrics-server   # CPU/memory metrics for HPA
minikube addons enable registry         # Local Docker registry

# List available add-ons
minikube addons list

# Point your Docker CLI to minikube's Docker daemon
eval $(minikube docker-env)
# Now: docker build → builds inside minikube, image available to K8s

# Undo Docker env pointing
eval $(minikube docker-env -u)

# Mount a local directory into the cluster
minikube mount /home/user/code:/code

# Pause the cluster (saves CPU while not using it)
minikube pause

# Stop and destroy
minikube stop
minikube delete
```

### Minikube Profiles (multiple clusters)

```bash
# Create a second cluster with a different name
minikube start --profile dev-cluster --memory=2048
minikube start --profile test-cluster --memory=4096

# Switch between them
minikube profile dev-cluster
kubectl config use-context dev-cluster

# List all profiles
minikube profile list
```

---

## 3. Core Kubernetes Objects

Everything in K8s is an **object** — a record of intent stored in etcd (the cluster database). You create objects with YAML files and `kubectl apply`.

### Pod

The smallest deployable unit. Contains one or more containers that share network and storage.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-api-pod
  namespace: default
  labels:
    app: my-api        # labels are key-value tags for selecting pods
spec:
  containers:
    - name: api
      image: my-api:latest
      imagePullPolicy: Never    # use local minikube image
      ports:
        - containerPort: 8080
      env:
        - name: DATABASE_URL
          value: "postgres://..."
      resources:
        requests:               # minimum guaranteed resources
          cpu: 100m             # 100 millicores = 0.1 vCPU
          memory: 128Mi
        limits:                 # maximum allowed
          cpu: 500m
          memory: 256Mi
```

**You almost never create Pods directly.** You create Deployments, which create and manage Pods.

### Deployment

Manages Pods. Ensures the desired number of replicas run, handles rolling updates and rollbacks.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: default
spec:
  replicas: 3                   # run 3 copies of this pod
  selector:
    matchLabels:
      app: my-api               # this deployment manages pods with this label
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1               # max extra pods during update
      maxUnavailable: 0         # never kill a pod before a new one is ready
  template:                     # the pod template
    metadata:
      labels:
        app: my-api
    spec:
      containers:
        - name: api
          image: my-api:v2
          readinessProbe:       # K8s only sends traffic after this passes
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:        # K8s restarts the container if this fails
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
```

**Rolling update flow:**
```
Before: [v1] [v1] [v1]
Step 1: [v1] [v1] [v1] [v2]  ← start new pod
Step 2: [v1] [v1] [v2]       ← new pod ready, kill old
Step 3: [v1] [v1] [v2] [v2]  ← start another new pod
Step 4: [v1] [v2] [v2]       ← kill another old
Step 5: [v2] [v2] [v2]       ← done, zero downtime
```

### Service

A stable network endpoint for a set of pods. Pods come and go (crashes, deploys), but the Service IP stays constant.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api
  namespace: default
spec:
  selector:
    app: my-api          # routes traffic to pods with this label
  type: ClusterIP        # internal only (default)
  ports:
    - port: 80           # port other services use to reach this service
      targetPort: 8080   # port on the pod
```

**Service types:**
```
ClusterIP:   Internal only. DNS: my-api.default.svc.cluster.local
NodePort:    Expose on every node's IP at a fixed port (30000-32767). 
             Access: http://<node-ip>:<node-port>
LoadBalancer: Provision a cloud load balancer (AWS ALB/NLB). Not available in minikube without add-ons.
ExternalName: DNS alias to external hostname.
```

**DNS inside K8s:**
```
Service name:       my-api
Same namespace:     my-api:80
Different namespace: my-api.production.svc.cluster.local:80
```

### ConfigMap

Non-secret configuration. Injected as environment variables or mounted as files.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  APP_ENV: production
  LOG_LEVEL: info
  DATABASE_HOST: postgres.default.svc.cluster.local
  # Can also store file contents
  app.yaml: |
    server:
      port: 8080
    database:
      max_connections: 50
```

```yaml
# Use in a Deployment
containers:
  - name: api
    envFrom:
      - configMapRef:
          name: app-config      # inject all keys as env vars
    volumeMounts:
      - name: config-file
        mountPath: /etc/app
volumes:
  - name: config-file
    configMap:
      name: app-config          # mount app.yaml as /etc/app/app.yaml
```

### Secret

Same as ConfigMap but for sensitive data. Values are base64-encoded (NOT encrypted by default — use Sealed Secrets or Vault for real encryption).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: default
type: Opaque
stringData:               # stringData auto-encodes to base64
  DATABASE_PASSWORD: my-super-secret-password
  JWT_SECRET: another-secret
  API_KEY: sk-1234567890
```

```bash
# View decoded secret value
kubectl get secret app-secrets -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d
```

**Warning:** Secrets in YAML files committed to git are a security risk. Use Sealed Secrets or Vault (covered later).

### Namespace

Logical isolation within a cluster. Like folders for K8s objects.

```bash
# Default namespaces
default        # where your apps go if you don't specify
kube-system    # K8s system components (DNS, scheduler, etc.)
kube-public    # public cluster info
kube-node-lease # node heartbeat data

# Create your own
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace monitoring
```

Resources in the same namespace can reach each other by short name (`postgres`).
Resources in different namespaces use full DNS (`postgres.production.svc.cluster.local`).

### PersistentVolumeClaim (PVC)

A request for storage. K8s provisions the actual storage (PersistentVolume) based on the claim.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce       # one pod can read AND write
    # ReadOnlyMany        # many pods read, no write
    # ReadWriteMany       # many pods read AND write (needs NFS/EFS)
  storageClassName: standard   # minikube's default storage class
  resources:
    requests:
      storage: 10Gi
```

Minikube's `standard` StorageClass provisions from the host filesystem.
AWS EKS uses StorageClasses backed by EBS (gp3), EFS, etc.

### StatefulSet

Like a Deployment but for stateful apps (databases, queues). Guarantees:
- Stable pod names: `postgres-0`, `postgres-1`, `postgres-2`
- Stable storage: each pod gets its own PVC
- Ordered startup/shutdown: `postgres-0` before `postgres-1`

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres          # headless service for stable DNS
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    # ... pod template ...
  volumeClaimTemplates:          # one PVC per replica, created automatically
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        resources:
          requests:
            storage: 10Gi
```

### DaemonSet

Runs one pod per node. Used for node-level agents: log collectors, monitoring agents, network plugins.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    # ... one of these runs on EVERY node automatically
```

### Ingress

HTTP/HTTPS routing rules. One public endpoint routes to many internal services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: api.local.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8080
    - host: app.local.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
  tls:
    - hosts: [api.local.dev, app.local.dev]
      secretName: local-tls    # TLS certificate stored as K8s secret
```

### HorizontalPodAutoscaler (HPA)

Automatically scales the number of replicas based on CPU/memory or custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # scale up when avg CPU > 70%
```

For this to work in minikube: `minikube addons enable metrics-server`

---

## 4. kubectl

kubectl is your primary tool for interacting with Kubernetes. Memorize these patterns.

### Cluster and Context

```bash
# Which cluster am I talking to?
kubectl config current-context

# List all clusters you've configured
kubectl config get-contexts

# Switch cluster
kubectl config use-context minikube
kubectl config use-context my-eks-cluster

# View the full config
kubectl config view
```

### Resource Operations

```bash
# Apply a YAML file (create or update)
kubectl apply -f deployment.yaml

# Apply all YAMLs in a directory
kubectl apply -f k8s/

# Apply from a URL
kubectl apply -f https://raw.githubusercontent.com/example/repo/main/deploy.yaml

# Delete a resource
kubectl delete -f deployment.yaml
kubectl delete deployment my-api -n production

# Get resources
kubectl get pods                          # pods in default namespace
kubectl get pods -n monitoring            # specific namespace
kubectl get pods --all-namespaces         # all namespaces
kubectl get all -n fullstack              # everything in namespace

# Real-time output
kubectl get pods -w                       # watch for changes
kubectl get pods -o wide                  # extra info (node, IP)
kubectl get pods -o yaml                  # full YAML definition
kubectl get pods -o json                  # JSON format

# Describe a resource (events, conditions, full spec)
kubectl describe pod my-api-abc123
kubectl describe deployment my-api
kubectl describe node minikube
```

### Working With Pods

```bash
# View logs
kubectl logs my-api-abc123
kubectl logs my-api-abc123 -f              # follow (stream)
kubectl logs my-api-abc123 --previous      # logs from crashed container
kubectl logs deployment/my-api -f          # logs from any pod in deployment
kubectl logs deployment/my-api --all-containers

# Execute commands inside a pod
kubectl exec -it my-api-abc123 -- sh
kubectl exec -it my-api-abc123 -- bash
kubectl exec -it deployment/my-api -- sh

# Run a one-off pod (useful for debugging)
kubectl run debug --image=alpine --rm -it --restart=Never -- sh

# Copy files to/from a pod
kubectl cp ./local-file.txt my-api-abc123:/app/file.txt
kubectl cp my-api-abc123:/app/logs/app.log ./app.log
```

### Debugging Patterns

```bash
# Pod not starting? Check events
kubectl describe pod <pod-name>
# Look for: "Back-off pulling image", "OOMKilled", "CrashLoopBackOff"

# Pod in CrashLoopBackOff? Check logs
kubectl logs <pod-name> --previous

# Service not routing correctly? Check endpoints
kubectl get endpoints my-api
# If empty: no pods match the service selector
# If populated: check firewall rules / port numbers

# DNS not resolving?
kubectl run debug --image=alpine --rm -it --restart=Never -- sh
> nslookup my-api.default.svc.cluster.local
> wget -qO- http://my-api:80/health

# Check resource usage
kubectl top pods -n fullstack
kubectl top nodes
```

### Rollouts and Updates

```bash
# Trigger a rolling restart (picks up new image/config)
kubectl rollout restart deployment/my-api -n production

# Watch the rollout progress
kubectl rollout status deployment/my-api -n production

# Rollout history
kubectl rollout history deployment/my-api

# Rollback to previous version
kubectl rollout undo deployment/my-api

# Rollback to specific revision
kubectl rollout undo deployment/my-api --to-revision=3

# Pause a rollout
kubectl rollout pause deployment/my-api

# Resume a paused rollout
kubectl rollout resume deployment/my-api
```

### Port Forwarding

Access K8s services on your local machine (without NodePort or Ingress):

```bash
# Forward local port 8080 to pod port 8080
kubectl port-forward deployment/backend 8080:8080 -n fullstack

# Forward local port 5432 to postgres (query with any SQL client)
kubectl port-forward deployment/postgres 5432:5432 -n fullstack

# Forward grafana to localhost
kubectl port-forward deployment/grafana 3001:3000 -n monitoring
```

---

## 5. Helm

Helm is the package manager for Kubernetes. Like `apt`, `npm`, or `brew` but for K8s applications.

### Why Helm Exists

Installing Prometheus manually requires 10+ YAML files with hundreds of lines. Helm packages these into a **Chart** — a reusable, configurable template.

```bash
# Without Helm: manually write or copy all these files
kubectl apply -f prometheus-serviceaccount.yaml
kubectl apply -f prometheus-clusterrole.yaml
kubectl apply -f prometheus-clusterrolebinding.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f prometheus-deployment.yaml
kubectl apply -f prometheus-service.yaml
# ... 8 more files

# With Helm: one command
helm install prometheus prometheus-community/kube-prometheus-stack
```

### Helm Concepts

**Chart:** A package (collection of YAML templates + metadata + default values).

**Release:** An installed instance of a chart. You can install the same chart multiple times with different names.

**Repository:** A collection of charts (like DockerHub for Helm).

**values.yaml:** Configuration that overrides chart defaults.

### Basic Helm Commands

```bash
# Add a chart repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Update repos (like apt-get update)
helm repo update

# Search for charts
helm search repo prometheus
helm search hub redis          # search the public Helm Hub

# See chart's default values
helm show values prometheus-community/kube-prometheus-stack

# Install a chart
helm install my-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values my-prometheus-values.yaml

# Upgrade (update config or chart version)
helm upgrade my-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values my-prometheus-values.yaml

# Install or upgrade in one command (idempotent)
helm upgrade --install my-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values my-prometheus-values.yaml

# List installed releases
helm list -n monitoring
helm list --all-namespaces

# See release status and history
helm status my-prometheus -n monitoring
helm history my-prometheus -n monitoring

# Rollback to previous release version
helm rollback my-prometheus 1 -n monitoring

# Uninstall
helm uninstall my-prometheus -n monitoring

# Render templates without installing (dry run / debugging)
helm template my-prometheus prometheus-community/kube-prometheus-stack \
  --values my-values.yaml
```

### Custom values.yaml

Charts have many configurable options. Override only what you need:

```yaml
# my-prometheus-values.yaml

prometheus:
  prometheusSpec:
    retention: 30d              # keep 30 days of data
    storageSpec:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 20Gi

grafana:
  adminPassword: my-grafana-password
  persistence:
    enabled: true
    size: 5Gi
  ingress:
    enabled: true
    hosts: [grafana.local.dev]

alertmanager:
  enabled: false               # disable if not needed
```

---

## 6. Kustomize

Kustomize manages K8s YAML without templating. Instead of Go templates (like Helm), it uses **patches** applied on top of a **base**.

This is what Blink uses. The `kustomize-flux` repo you explored IS Kustomize.

### Concept

```
base/                  # common, environment-agnostic definitions
├── kustomization.yaml
├── deployment.yaml
└── service.yaml

overlays/
├── staging/
│   ├── kustomization.yaml   # references base, applies patches
│   └── patch-replicas.yaml  # staging: 1 replica
└── production/
    ├── kustomization.yaml
    └── patch-replicas.yaml  # production: 3 replicas
```

### base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
```

### overlays/staging/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: staging

bases:
  - ../../base

patches:
  - path: patch-replicas.yaml

images:
  - name: my-api
    newTag: "v1.2.3"       # override image tag per environment

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - APP_ENV=staging
      - LOG_LEVEL=debug
```

### patch-replicas.yaml

```yaml
# Strategic merge patch — only specify what changes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  replicas: 1              # staging needs only 1 replica
```

### Using Kustomize

```bash
# Preview what will be applied
kubectl kustomize overlays/staging

# Apply staging overlay
kubectl apply -k overlays/staging

# Apply production overlay
kubectl apply -k overlays/production

# kubectl kustomize is built-in since kubectl 1.14
# or use standalone kustomize tool
kustomize build overlays/staging | kubectl apply -f -
```

---

## 7. The Local AWS Equivalents Stack

This is the full picture of what you can run locally to simulate AWS:

```
┌──────────────────────────────────────────────────────────────┐
│                    YOUR MINIKUBE CLUSTER                     │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Your App      │    │   Your App      │                 │
│  │  (frontend)     │    │   (backend)     │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                          │
│  ┌────────▼──────────────────────▼────────────────────┐     │
│  │         Nginx Ingress Controller (= ALB)            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐  │
│  │  PostgreSQL  │  │  Redis  │  │  MinIO   │  │RabbitMQ │  │
│  │  (= RDS)    │  │(=ElastiC│  │  (= S3)  │  │(=SQS)   │  │
│  └─────────────┘  └─────────┘  └──────────┘  └─────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MONITORING STACK                          │  │
│  │  Prometheus(=CloudWatch) → Grafana(=CW Dashboards)    │  │
│  │  Loki(=CloudWatch Logs) → Grafana                     │  │
│  │  Tempo(=X-Ray) → Grafana                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  cert-manager  │  │    Vault     │  │     ArgoCD       │ │
│  │   (= ACM)     │  │ (=SecretsM.) │  │ (=CodePipeline)  │ │
│  └───────────────┘  └──────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. MinIO — Local S3

MinIO implements the complete AWS S3 API. Any code that works with MinIO works with real S3 by changing 3 environment variables.

### Install MinIO in Minikube

```bash
helm repo add minio https://charts.min.io/
helm repo update

helm upgrade --install minio minio/minio \
  --namespace minio \
  --create-namespace \
  --set rootUser=minioadmin \
  --set rootPassword=minioadmin123 \
  --set mode=standalone \
  --set persistence.size=10Gi \
  --set service.type=NodePort \
  --set consoleService.type=NodePort
```

### Access MinIO

```bash
# Get the NodePort for API
kubectl get svc minio -n minio

# Port-forward for quick access
kubectl port-forward svc/minio 9000:9000 -n minio &
kubectl port-forward svc/minio-console 9001:9001 -n minio &

# Open console: http://localhost:9001
```

### Using the AWS CLI with MinIO

```bash
# Install AWS CLI
pip install awscli

# Configure to point to MinIO
aws configure --profile minio
# AWS Access Key ID: minioadmin
# AWS Secret Access Key: minioadmin123
# Default region: us-east-1 (anything works)

# Use with --endpoint-url
aws --endpoint-url http://localhost:9000 --profile minio s3 mb s3://my-bucket
aws --endpoint-url http://localhost:9000 --profile minio s3 cp ./file.txt s3://my-bucket/
aws --endpoint-url http://localhost:9000 --profile minio s3 ls s3://my-bucket/
```

### MinIO Client (mc)

```bash
# Install mc
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Configure
mc alias set local http://localhost:9000 minioadmin minioadmin123

# Operations (same as AWS S3 but with mc)
mc mb local/my-bucket             # create bucket
mc ls local/                      # list buckets
mc cp ./file.txt local/my-bucket/ # upload
mc ls local/my-bucket/            # list objects
mc cat local/my-bucket/file.txt   # read content
mc rm local/my-bucket/file.txt    # delete
mc mirror ./local-folder/ local/my-bucket/ # sync directory to bucket
mc admin info local               # cluster info
```

### Making a Bucket Public

```bash
mc anonymous set public local/uploads
# Now: http://localhost:9000/uploads/filename is publicly accessible
```

### Difference: MinIO vs Real S3

| Feature | MinIO | AWS S3 |
|---|---|---|
| API | 100% S3-compatible | Native |
| Storage | Local disk / K8s PVC | Global AWS infrastructure |
| Durability | Depends on your disk | 99.999999999% (11 nines) |
| Scale | Limited to your cluster | Unlimited |
| Cost | Free | $0.023/GB/month |
| CDN integration | Manual | CloudFront native |
| Lifecycle policies | Supported | Supported |
| Pre-signed URLs | Supported | Supported |
| Versioning | Supported | Supported |
| Code change to switch | Zero — just env vars | Zero |

---

## 9. Databases Locally

### PostgreSQL in Minikube

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

helm upgrade --install postgres bitnami/postgresql \
  --namespace data \
  --create-namespace \
  --set auth.postgresPassword=mypassword \
  --set auth.database=myapp \
  --set primary.persistence.size=10Gi
```

```bash
# Connect with psql
kubectl port-forward svc/postgres-postgresql 5432:5432 -n data &
psql -h localhost -U postgres -d myapp
# Password: mypassword

# Or exec directly
kubectl exec -it postgres-postgresql-0 -n data -- psql -U postgres
```

**Connection string for your app:**
```
postgres://postgres:mypassword@postgres-postgresql.data.svc.cluster.local:5432/myapp
```

### Redis in Minikube

```bash
helm upgrade --install redis bitnami/redis \
  --namespace data \
  --create-namespace \
  --set auth.password=redispassword \
  --set master.persistence.size=2Gi \
  --set replica.replicaCount=0   # 1 replica only for local
```

```bash
# Connect with redis-cli
kubectl port-forward svc/redis-master 6379:6379 -n data &
redis-cli -h localhost -p 6379 -a redispassword

# Basic operations
SET key "value"
GET key
INCR counter
EXPIRE counter 60
```

**Connection string:**
```
redis://:redispassword@redis-master.data.svc.cluster.local:6379
```

### Key Concepts: Local vs AWS Database

```
Local PostgreSQL pod restarts:
  → Data persists (stored on PVC)
  → Connection string stays the same (Service is stable)
  → Need to wait for pod to restart (~5-30 seconds of downtime)

AWS RDS Multi-AZ failover:
  → Data persists (replicated to standby)
  → Connection string stays the same (RDS endpoint is stable)
  → Automatic failover (~30-60 seconds, usually transparent)

The application code is IDENTICAL.
```

---

## 10. Nginx Ingress — Local ALB

Ingress is how you expose HTTP services in K8s with path/host routing, SSL termination, and a single public IP.

### Enable in Minikube

```bash
minikube addons enable ingress
minikube addons enable ingress-dns    # optional: DNS for *.local domains

# Verify
kubectl get pods -n ingress-nginx
```

### Path-Based Routing

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: fullstack
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
    - host: app.local      # add to /etc/hosts: 192.168.49.2 app.local
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

### Host-Based Routing

```yaml
rules:
  - host: api.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: backend
              port:
                number: 8080
  - host: app.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: frontend
              port:
                number: 3000
  - host: grafana.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: grafana
              port:
                number: 3000
```

### Add local DNS entries

```bash
# Get minikube IP
MINIKUBE_IP=$(minikube ip)

# Add to /etc/hosts
echo "$MINIKUBE_IP app.local api.local grafana.local minio.local" | sudo tee -a /etc/hosts

# Now in browser:
# http://app.local     → your frontend
# http://api.local     → your backend
# http://grafana.local → Grafana
```

### Nginx Ingress Annotations (powerful features)

```yaml
annotations:
  # Rate limiting
  nginx.ingress.kubernetes.io/limit-rps: "10"
  nginx.ingress.kubernetes.io/limit-connections: "5"
  
  # CORS
  nginx.ingress.kubernetes.io/enable-cors: "true"
  nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
  
  # Proxy timeouts
  nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
  nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
  
  # Auth (basic auth)
  nginx.ingress.kubernetes.io/auth-type: basic
  nginx.ingress.kubernetes.io/auth-secret: basic-auth
  
  # SSL redirect
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
  nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  
  # Custom Nginx config
  nginx.ingress.kubernetes.io/configuration-snippet: |
    more_set_headers "X-Frame-Options: SAMEORIGIN";
```

---

## 11. cert-manager — Local ACM

cert-manager automatically provisions and renews TLS certificates in K8s. In production, it uses Let's Encrypt. Locally, it creates self-signed certificates.

### Install cert-manager

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

### Create a Self-Signed Issuer (for local dev)

```yaml
# cert-manager/self-signed-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
```

```bash
kubectl apply -f cert-manager/self-signed-issuer.yaml
```

### Request a Certificate

```yaml
# cert-manager/local-cert.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: local-tls
  namespace: fullstack
spec:
  secretName: local-tls       # cert stored as this K8s Secret
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
  dnsNames:
    - app.local
    - api.local
    - grafana.local
```

### Use in Ingress

```yaml
spec:
  tls:
    - hosts: [app.local, api.local]
      secretName: local-tls    # same name as Certificate.spec.secretName
  rules:
    # ... your rules
```

Now `https://app.local` works (browser will warn about self-signed cert — click through in dev).

### Production: Let's Encrypt

```yaml
# For production with a real domain:
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

cert-manager requests a free certificate from Let's Encrypt, validates domain ownership (via an HTTP challenge through Ingress), stores the cert as a K8s Secret, and renews it automatically before expiry.

---

## 12. Prometheus + Grafana — Local CloudWatch

### Install kube-prometheus-stack (everything in one)

The `kube-prometheus-stack` Helm chart includes:
- Prometheus
- Grafana
- AlertManager
- Node Exporter (hardware metrics)
- kube-state-metrics (K8s object metrics)
- Pre-built dashboards for Kubernetes

```bash
helm upgrade --install kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=30d \
  --set alertmanager.enabled=false   # disable alerts for local dev
```

```bash
# Access Grafana
kubectl port-forward svc/kube-prom-grafana 3001:80 -n monitoring &
# http://localhost:3001  (admin / admin)
```

### What Prometheus Scrapes Automatically

```
Kubernetes node metrics     → CPU, memory, disk, network per node
Pod metrics                 → CPU, memory per pod (via cAdvisor)
K8s API server metrics      → API request rates, latency
CoreDNS metrics             → DNS query rates
kube-state-metrics          → Deployment replicas, pod states, PVC status
```

### Scraping Your Own Apps

Add annotations to your pod/deployment:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

Or create a ServiceMonitor (Prometheus Operator pattern):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-api
  namespace: monitoring
  labels:
    release: kube-prom    # must match Prometheus's serviceMonitorSelector
spec:
  selector:
    matchLabels:
      app: my-api          # select services with this label
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
  namespaceSelector:
    matchNames:
      - fullstack
```

### PromQL — Prometheus Query Language

Essential queries to know:

```promql
# Current value of a gauge
go_goroutines

# Rate of a counter over last 5 minutes
rate(http_requests_total[5m])

# Per-second rate, grouped by status code
rate(http_requests_total[5m]) by (status_code)

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# CPU usage per pod (%)
100 * (rate(container_cpu_usage_seconds_total{namespace="fullstack"}[5m]))

# Memory usage per pod
container_memory_working_set_bytes{namespace="fullstack"}

# Pods not running
kube_pod_status_phase{phase!="Running", namespace="fullstack"}

# Error rate (non-200 responses)
sum(rate(http_requests_total{status!~"2.."}[5m])) /
sum(rate(http_requests_total[5m]))

# Disk usage on PVC
kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes * 100
```

### Alerting Rules

```yaml
# Custom PrometheusRule
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-app-alerts
  namespace: monitoring
  labels:
    release: kube-prom
spec:
  groups:
    - name: my-app
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Error rate above 5%"
            description: "{{ $value | humanizePercentage }} of requests are failing"

        - alert: PodCrashLooping
          expr: |
            rate(kube_pod_container_status_restarts_total[15m]) > 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{ $labels.pod }} is crash looping"
```

---

## 13. Loki — Local CloudWatch Logs

Loki collects and stores logs from all pods. Unlike Elasticsearch, it doesn't index log content — it only indexes labels (pod name, namespace, container). This makes it much cheaper for large log volumes.

### Install Loki Stack

```bash
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \   # use the Grafana from kube-prom
  --set prometheus.enabled=false \
  --set promtail.enabled=true     # promtail collects pod logs
```

### How Log Collection Works

```
Pod stdout/stderr
  ↓
Promtail (DaemonSet, one per node)
  reads /var/log/containers/*.log
  adds labels: namespace, pod, container, app
  ↓
Loki (stores and indexes)
  ↓
Grafana (queries via LogQL)
```

### LogQL — Log Query Language

```logql
# All logs from the fullstack namespace
{namespace="fullstack"}

# Logs from a specific app
{app="backend"}

# Filter for errors
{namespace="fullstack"} |= "ERROR"

# Filter with regex
{namespace="fullstack"} |~ "error|panic|fatal"

# Exclude noise
{namespace="fullstack"} != "health check"

# Parse JSON logs and filter by field
{app="backend"} | json | level="error"

# Count errors per minute over last hour
sum(count_over_time({app="backend"} |= "ERROR" [1m]))

# Rate of log lines per second
rate({namespace="fullstack"}[1m])
```

### Add Loki as Grafana Data Source (if not auto-configured)

```yaml
# In Grafana: Configuration → Data Sources → Add
URL: http://loki:3100
```

---

## 14. Tempo — Local X-Ray

Tempo stores distributed traces. When a request flows through multiple services, Tempo shows you the full journey with timing for each step.

### Install Tempo

```bash
helm upgrade --install tempo grafana/tempo \
  --namespace monitoring \
  --set tempo.storage.trace.backend=local \
  --set tempo.retention=24h
```

### How Tracing Works

Your app adds a Trace ID to every request. Each service that handles the request adds a Span (timing + metadata). Tempo collects and correlates them.

```
HTTP POST /api/booking/create  (Trace ID: abc123)
│  Span: HTTP handler (50ms)
│  Span: JWT validation (2ms)
│  Span: DB query INSERT bookings (15ms)
│  Span: RabbitMQ publish (5ms)
│  Span: HTTP response (1ms)
└── Total: 73ms

If something is slow, you see EXACTLY which span is slow.
```

### Instrument Your Go App

```go
// go.mod — add:
// go.opentelemetry.io/otel
// go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc
// go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin

// main.go
func initTracer() func() {
    ctx := context.Background()
    exp, _ := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("tempo.monitoring.svc.cluster.local:4317"),
        otlptracegrpc.WithInsecure(),
    )
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exp),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("my-api"),
        )),
    )
    otel.SetTracerProvider(tp)
    return func() { tp.Shutdown(ctx) }
}

// Add to Gin router:
r.Use(otelgin.Middleware("my-api"))
```

### Add Tempo to Grafana

```
Configuration → Data Sources → Add → Tempo
URL: http://tempo:3100
```

In Grafana's Explore tab, select Tempo and search by Trace ID, or use TraceQL:
```
{ .service.name = "backend" && duration > 100ms }
```

---

## 15. Vault — Local Secrets Manager

Vault is the most powerful secrets management tool. In production it replaces K8s Secrets entirely.

### Install Vault

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com

helm upgrade --install vault hashicorp/vault \
  --namespace vault \
  --create-namespace \
  --set server.dev.enabled=true    # dev mode: no unsealing, no persistence
```

```bash
# Access the Vault UI
kubectl port-forward svc/vault 8200:8200 -n vault &
# http://localhost:8200
# Token: root (dev mode)
```

### Store and Retrieve Secrets

```bash
# Exec into vault pod
kubectl exec -it vault-0 -n vault -- sh

# Write a secret
vault kv put secret/myapp/database \
  url="postgres://user:pass@postgres:5432/myapp" \
  password="super-secret"

# Read a secret
vault kv get secret/myapp/database
vault kv get -field=password secret/myapp/database
```

### Read Secrets from Your Go App

```go
client, _ := vault.New(
    vault.WithAddress("http://vault.vault.svc.cluster.local:8200"),
    vault.WithToken(os.Getenv("VAULT_TOKEN")),
)

secret, _ := client.Secrets.KvV2Read(ctx, "myapp/database",
    vault.WithMountPath("secret"),
)
dbURL := secret.Data.Data["url"].(string)
```

### Vault Agent (sidecar injection)

In production, you don't use static tokens. Vault Agent runs as a sidecar in your pod, authenticates using the K8s ServiceAccount, and writes secrets as files.

```yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "my-app"
  vault.hashicorp.com/agent-inject-secret-database: "secret/data/myapp/database"
  vault.hashicorp.com/agent-inject-template-database: |
    {{- with secret "secret/data/myapp/database" -}}
    DATABASE_URL={{ .Data.data.url }}
    {{ end }}
```

Vault Agent writes the rendered file to `/vault/secrets/database`. Your app reads it as a config file.

---

## 16. ArgoCD — Local CodePipeline

ArgoCD implements GitOps: your Git repository IS the source of truth for what's deployed. ArgoCD continuously syncs the cluster to match what's in Git.

```
Developer pushes to git
  ↓
ArgoCD detects change (polls every 3 minutes, or webhook)
  ↓
ArgoCD compares git state vs cluster state
  ↓
ArgoCD applies the difference (kubectl apply)
  ↓
Cluster matches git

If someone makes a manual kubectl change:
  → ArgoCD detects drift
  → Either alerts (manual sync mode) or auto-corrects (auto-sync mode)
```

### Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access the UI
kubectl port-forward svc/argocd-server 8080:443 -n argocd &
# https://localhost:8080

# Get initial admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath='{.data.password}' | base64 -d
```

### Define an Application

```yaml
# argocd/fullstack-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: fullstack
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourname/fullstack.git
    targetRevision: main
    path: k8s                        # deploy everything in k8s/ directory
  destination:
    server: https://kubernetes.default.svc
    namespace: fullstack
  syncPolicy:
    automated:
      prune: true                    # delete resources removed from git
      selfHeal: true                 # auto-fix manual changes
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f argocd/fullstack-app.yaml
```

Now every `git push` to main automatically deploys to your cluster. This is exactly what Blink uses with Flux CD (`kustomize-flux` repo).

### ArgoCD CLI

```bash
# Install
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd /usr/local/bin/argocd

# Login
argocd login localhost:8080 --username admin --insecure

# List apps
argocd app list

# Sync manually
argocd app sync fullstack

# Check app status
argocd app get fullstack

# View history
argocd app history fullstack

# Rollback
argocd app rollback fullstack 3
```

---

## 17. RabbitMQ — Local SQS/SNS

RabbitMQ is a message broker. Services publish messages; other services consume them asynchronously.

```
Publisher (service-job)            Consumer (service-notification)
    │                                      │
    │ publish("booking.created", data)     │
    ↓                                      │
  RabbitMQ Exchange                        │
    │ routing: booking.#                   │
    ↓                                      │
  Queue: notification-queue               │
                    ↑                      │
                    └──── consume ─────────┘
```

### Install RabbitMQ

```bash
helm upgrade --install rabbitmq bitnami/rabbitmq \
  --namespace messaging \
  --create-namespace \
  --set auth.username=rabbit \
  --set auth.password=rabbitpassword \
  --set service.type=NodePort
```

```bash
# Access management UI
kubectl port-forward svc/rabbitmq 15672:15672 -n messaging &
# http://localhost:15672 (rabbit / rabbitpassword)
```

### Publish and Consume in Go

```go
import "github.com/rabbitmq/amqp091-go"

// Connect
conn, _ := amqp.Dial("amqp://rabbit:rabbitpassword@rabbitmq.messaging.svc:5672/")
ch, _ := conn.Channel()

// Declare exchange
ch.ExchangeDeclare("events", "topic", true, false, false, false, nil)

// Publish
ch.Publish("events", "booking.created", false, false,
    amqp.Publishing{
        ContentType: "application/json",
        Body:        []byte(`{"booking_id":"123","status":"pending"}`),
    },
)

// Declare queue and bind
q, _ := ch.QueueDeclare("notification-queue", true, false, false, false, nil)
ch.QueueBind(q.Name, "booking.*", "events", false, nil)

// Consume
msgs, _ := ch.Consume(q.Name, "", false, false, false, false, nil)
for msg := range msgs {
    // process msg.Body
    msg.Ack(false)
}
```

### RabbitMQ vs AWS SQS/SNS

| Feature | RabbitMQ | AWS SQS | AWS SNS |
|---|---|---|---|
| Message routing | Topics, exchanges, bindings | Queues only | Fan-out to multiple queues |
| Message order | Configurable | FIFO queues available | Not guaranteed |
| Delivery | At-least-once | At-least-once | At-least-once |
| Retention | Until consumed | 4 days (max 14) | No storage |
| Push to consumer | AMQP push | Poll-based | Push to SQS/Lambda/HTTP |
| Local dev | Docker/K8s | LocalStack | LocalStack |

---

## 18. Building Your Full Local Stack

Here's how to install all tools in one go on a freshly started minikube cluster.

```bash
#!/bin/bash
set -e

minikube start --memory=8192 --cpus=4

# Core add-ons
minikube addons enable ingress
minikube addons enable metrics-server

# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana              https://grafana.github.io/helm-charts
helm repo add bitnami              https://charts.bitnami.com/bitnami
helm repo add minio                https://charts.min.io/
helm repo add jetstack             https://charts.jetstack.io
helm repo add hashicorp            https://helm.releases.hashicorp.com
helm repo update

# cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true

# PostgreSQL
helm upgrade --install postgres bitnami/postgresql \
  --namespace data --create-namespace \
  --set auth.postgresPassword=postgres \
  --set auth.database=myapp

# Redis
helm upgrade --install redis bitnami/redis \
  --namespace data \
  --set auth.password=redis \
  --set replica.replicaCount=0

# MinIO
helm upgrade --install minio minio/minio \
  --namespace storage --create-namespace \
  --set rootUser=minioadmin \
  --set rootPassword=minioadmin123 \
  --set mode=standalone

# RabbitMQ
helm upgrade --install rabbitmq bitnami/rabbitmq \
  --namespace messaging --create-namespace \
  --set auth.username=rabbit \
  --set auth.password=rabbit

# Monitoring stack (Prometheus + Grafana + Alertmanager)
helm upgrade --install kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=admin

# Loki (log aggregation)
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set prometheus.enabled=false

# Tempo (distributed tracing)
helm upgrade --install tempo grafana/tempo \
  --namespace monitoring \
  --set tempo.storage.trace.backend=local

# Vault
helm upgrade --install vault hashicorp/vault \
  --namespace vault --create-namespace \
  --set server.dev.enabled=true

echo "Full local stack deployed!"
MINIKUBE_IP=$(minikube ip)
echo "MinIO:      kubectl port-forward svc/minio 9000:9000 -n storage"
echo "Grafana:    kubectl port-forward svc/kube-prom-grafana 3001:80 -n monitoring"
echo "RabbitMQ:   kubectl port-forward svc/rabbitmq 15672:15672 -n messaging"
echo "Vault:      kubectl port-forward svc/vault 8200:8200 -n vault"
```

---

## 19. From Local to Production

Everything you learn locally maps directly to production. The concepts are the same. Only the managed service provider changes.

### The Mapping

```
LOCAL (minikube)                    PRODUCTION (AWS EKS)
═══════════════════════════════════════════════════════════
minikube start                   →  aws eks create-cluster
kubectl apply -f                 →  kubectl apply -f (same command)
NodePort service                 →  LoadBalancer service → ALB
Nginx Ingress                    →  AWS Load Balancer Controller
storageClass: standard           →  storageClass: gp3 (EBS)
MinIO                            →  S3
PostgreSQL pod                   →  RDS PostgreSQL
Redis pod                        →  ElastiCache Redis
RabbitMQ pod                     →  Amazon MQ (managed RabbitMQ)
kube-prometheus-stack            →  Amazon Managed Prometheus + Grafana
Loki                             →  CloudWatch Logs
Tempo                            →  AWS X-Ray
Vault (dev mode)                 →  AWS Secrets Manager + Vault Enterprise
ArgoCD                           →  ArgoCD on EKS / Flux CD / CodePipeline
self-signed cert                 →  ACM + cert-manager (Let's Encrypt)
/etc/hosts entries               →  Route 53 DNS records
eval $(minikube docker-env)      →  aws ecr get-login-password | docker login
imagePullPolicy: Never           →  imagePullPolicy: Always (pull from ECR)
K8s Secrets                      →  External Secrets Operator → Secrets Manager
```

### What Changes When Moving to AWS

**1. Storage classes**
```yaml
# Local
storageClassName: standard

# AWS
storageClassName: gp3
```

**2. Service type**
```yaml
# Local (NodePort — expose on VM port)
type: NodePort
nodePort: 30080

# AWS (LoadBalancer — AWS provisions an ALB automatically)
type: LoadBalancer
```

**3. Image pull (from ECR, not local)**
```yaml
# Local
image: my-api:latest
imagePullPolicy: Never

# AWS
image: 123456.dkr.ecr.ap-southeast-2.amazonaws.com/my-api:v1.2.3
imagePullPolicy: Always
```

**4. Secrets source**
```yaml
# Local — store directly in K8s Secret YAML
stringData:
  DATABASE_URL: "postgres://..."

# AWS — External Secrets Operator fetches from Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
spec:
  secretStoreRef:
    name: aws-secretsmanager
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: prod/myapp/database
        property: url
```

**5. IAM / Service Account (IRSA)**
```yaml
# AWS — pod assumes an IAM role for S3/RDS/etc access
spec:
  serviceAccountName: my-api
  # ServiceAccount has annotation:
  # eks.amazonaws.com/role-arn: arn:aws:iam::123456:role/my-api-role
```

### The Learning Path

```
Week 1-2:  Docker fundamentals
           docker build, run, compose
           Understand images, layers, volumes, networks

Week 3-4:  Kubernetes basics
           Pods, Deployments, Services, ConfigMaps
           kubectl get/describe/logs/exec
           minikube

Week 5-6:  Kubernetes storage and networking
           PVCs, StatefulSets
           Ingress, cert-manager
           DNS inside K8s

Week 7-8:  Helm and Kustomize
           Install community charts
           Write your own Helm chart
           Understand Kustomize overlays (study kustomize-flux repo)

Week 9-10: Observability
           Prometheus metrics in your app
           PromQL queries
           Grafana dashboards and alerts
           Loki + LogQL
           Tempo tracing

Week 11-12: GitOps and CI/CD
            ArgoCD
            Automated rollouts
            Rollback strategies

Month 4+:  AWS
           Start with free tier
           EC2 → ECS → EKS progression
           Apply local knowledge to AWS equivalents
           Infrastructure as Code (Terraform or CDK)
```

### You Already Know More Than You Think

You've seen Kustomize in `kustomize-flux`. You've seen Prometheus/Grafana/Loki/Tempo in `kustomize-flux/monitoring`. You've seen IRSA in the K8s 401 Slack incident. You've worked with Docker and containers daily.

**The gap between where you are and "cloud engineer" is smaller than it looks.** The tools are the same. The concepts are the same. What differs is scale, managed services, and IAM complexity.

Run the local stack. Break things. Fix them. Read the logs. That builds intuition faster than any course.
