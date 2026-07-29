#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo ">>> Pointing Docker at Minikube's internal registry"
eval $(minikube docker-env)

echo ">>> Building images inside Minikube"
docker build -t fullstack-backend:latest ./backend
docker build -t fullstack-frontend:latest ./frontend

MINIKUBE_IP=$(minikube ip)
echo ">>> Minikube IP: $MINIKUBE_IP"

echo ">>> Patching MinIO public URL in backend configmap"
sed -i "s|MINIO_PUBLIC_URL:.*|MINIO_PUBLIC_URL: \"http://$MINIKUBE_IP:30090\"|" k8s/backend/configmap.yaml

echo ">>> Applying all manifests"
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/minio/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/prometheus/
kubectl apply -f k8s/monitoring/grafana/

echo ">>> Waiting for deployments to be ready..."
kubectl rollout status deployment/postgres   -n fullstack --timeout=120s
kubectl rollout status deployment/minio      -n fullstack --timeout=120s
kubectl rollout status deployment/backend    -n fullstack --timeout=120s
kubectl rollout status deployment/frontend   -n fullstack --timeout=120s
kubectl rollout status deployment/prometheus -n fullstack --timeout=120s
kubectl rollout status deployment/grafana    -n fullstack --timeout=120s

echo ""
echo "=========================================="
echo " All services are up!"
echo "=========================================="
echo " Frontend:    http://$MINIKUBE_IP:30000"
echo " Backend API: http://$MINIKUBE_IP:30080"
echo " MinIO API:   http://$MINIKUBE_IP:30090"
echo " MinIO UI:    http://$MINIKUBE_IP:30091  (minioadmin / minioadmin123)"
echo " Prometheus:  http://$MINIKUBE_IP:30900"
echo " Grafana:     http://$MINIKUBE_IP:30300  (admin / admin)"
echo "=========================================="
