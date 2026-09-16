# Kubernetes Deployment Guide

## Overview

The `k8s/` directory contains production-ready Kubernetes manifests organized with Kustomize overlays and a Helm chart:

```
k8s/
  base/                     — Base manifests (shared across environments)
    namespace.yaml
    serviceaccount.yaml
    configmap.yaml
    secrets.yaml            — Template only — replace values before apply
    deployment.yaml
    service.yaml
    ingress.yaml
    hpa.yaml                — HorizontalPodAutoscaler
    pdb.yaml                — PodDisruptionBudget
    networkpolicy.yaml
    kustomization.yaml

  overlays/
    development/            — 1 replica, debug logging
    staging/                — 2 replicas
    production/             — 3+ replicas, HPA to 20

  helm/                     — Helm chart (alternative to Kustomize)
    Chart.yaml
    values.yaml
    templates/
```

---

## Prerequisites

```bash
# kubectl
kubectl version --client

# kustomize (built into kubectl >= 1.14)
kubectl kustomize --help

# helm
helm version
```

---

## Kustomize Deployment

### Development

```bash
kubectl apply -k k8s/overlays/development/
```

### Staging

```bash
kubectl apply -k k8s/overlays/staging/
```

### Production

```bash
# 1. Replace placeholder secrets first
kubectl create secret generic django-backend-secrets \
  --namespace=backend-prod \
  --from-literal=DJANGO_SECRET_KEY='your-real-key' \
  --from-literal=DB_PASSWORD='your-db-password' \
  --from-literal=DB_USER='your-db-user' \
  --from-literal=DB_NAME='your-db-name' \
  --from-literal=DB_HOST='your-db-host' \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Update image tag in overlay
# k8s/overlays/production/kustomization.yaml → images[].newTag

# 3. Apply
kubectl apply -k k8s/overlays/production/
```

---

## Helm Deployment

```bash
# Install (first time)
helm install django-backend k8s/helm/ \
  --namespace backend-prod \
  --create-namespace \
  --values k8s/helm/values.yaml \
  --set image.tag=v1.2.3 \
  --set secrets.djangoSecretKey='your-real-key'

# Upgrade (subsequent deployments)
helm upgrade django-backend k8s/helm/ \
  --namespace backend-prod \
  --set image.tag=v1.2.4

# Rollback
helm rollback django-backend 1 --namespace backend-prod

# Uninstall
helm uninstall django-backend --namespace backend-prod
```

---

## Production Best Practices

### Security Context

The deployment enforces a hardened security context:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: [ALL]
```

A `/tmp` emptyDir volume is mounted to allow the application to write temporary files without needing a writable root filesystem.

### Resource Management

Default resource requests/limits in `values.yaml`:

```yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi
```

Tune these based on your workload. Run `kubectl top pods` to observe actual usage.

### HPA (Horizontal Pod Autoscaler)

The HPA scales between `minReplicas` and `maxReplicas` based on CPU and memory:

```yaml
# base HPA targets
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

For production, set `minReplicas: 3` (already done in the production overlay).

### PodDisruptionBudget

Ensures at least 1 pod remains available during node drains and rolling updates:

```yaml
spec:
  minAvailable: 1
```

Increase to `minAvailable: 2` for stricter HA requirements.

### Network Policies

The `networkpolicy.yaml` restricts traffic:

- **Ingress**: Only from `ingress-nginx` namespace
- **Egress**: DNS (53), SQL Server (1433), PostgreSQL (5432), Redis (6379), HTTPS (443)

---

## Secrets Management

**Never commit real secrets to git.** Use one of these approaches:

### Option 1: kubectl create secret (simple)

```bash
kubectl create secret generic django-backend-secrets \
  --from-literal=DJANGO_SECRET_KEY='...' \
  --namespace=backend-prod
```

### Option 2: External Secrets Operator (recommended for production)

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

```yaml
# k8s/base/externalsecret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: django-backend-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: azure-keyvault-store     # or aws-secrets-manager-store
    kind: ClusterSecretStore
  target:
    name: django-backend-secrets
  data:
    - secretKey: DJANGO_SECRET_KEY
      remoteRef:
        key: django-secret-key
    - secretKey: DB_PASSWORD
      remoteRef:
        key: django-db-password
```

### Option 3: Azure Key Vault CSI Driver (AKS)

```bash
az aks enable-addons --addons azure-keyvault-secrets-provider --name myAKSCluster --resource-group myRG
```

---

## Running Database Migrations

Run migrations as a Kubernetes Job before deploying new application pods:

```yaml
# k8s/jobs/migrate.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: django-migrate
  namespace: backend-prod
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: your-registry/django-backend:v1.2.4
          command: ["python", "manage.py", "migrate", "--no-input"]
          envFrom:
            - configMapRef:
                name: django-backend-config
            - secretRef:
                name: django-backend-secrets
      restartPolicy: Never
```

```bash
kubectl apply -f k8s/jobs/migrate.yaml --namespace=backend-prod
kubectl wait --for=condition=complete job/django-migrate --namespace=backend-prod --timeout=120s
```

---

## Ingress Configuration

### nginx-ingress

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com]
      secretName: tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: django-backend
                port:
                  number: 80
```

### cert-manager (automatic TLS)

```bash
helm install cert-manager jetstack/cert-manager --namespace cert-manager --set installCRDs=true
```

```yaml
# cluster-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

```yaml
# Annotate the Ingress
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
```

---

## Platform-Specific Notes

### AKS (Azure Kubernetes Service)

```bash
az aks get-credentials --resource-group myRG --name myAKS

# Enable managed identity for secrets
az aks update --enable-managed-identity -g myRG -n myAKS
```

### EKS (Amazon Elastic Kubernetes Service)

```bash
aws eks update-kubeconfig --name myEKS --region us-east-1

# Enable IRSA for Secrets Manager
eksctl create iamserviceaccount --name django-backend-sa --namespace backend-prod ...
```

### GKE (Google Kubernetes Engine)

```bash
gcloud container clusters get-credentials myGKE --region us-central1

# Use Workload Identity for Secret Manager
gcloud iam service-accounts add-iam-policy-binding ...
```

---

## Rollback

```bash
# Kustomize rollback — reapply previous manifest version from git
git checkout <previous-tag> -- k8s/overlays/production/
kubectl apply -k k8s/overlays/production/

# Helm rollback
helm rollback django-backend <REVISION> --namespace backend-prod
helm history django-backend --namespace backend-prod  # list revisions
```

---

## Useful Commands

```bash
# Watch pod status
kubectl get pods -n backend-prod -w

# View logs
kubectl logs -n backend-prod -l app=django-backend -f

# Exec into pod
kubectl exec -it -n backend-prod deployment/django-backend -- /bin/sh

# Check HPA status
kubectl get hpa -n backend-prod

# Describe deployment
kubectl describe deployment django-backend -n backend-prod

# Force restart (rolling)
kubectl rollout restart deployment/django-backend -n backend-prod

# Check rollout status
kubectl rollout status deployment/django-backend -n backend-prod
```
