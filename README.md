# PodPeek

A lightweight Kubernetes dashboard for homelabs and small clusters.

PodPeek is a minimal web UI for quickly inspecting your cluster without opening a full dashboard.

<img width="1146" height="918" alt="Screenshot from 2026-05-27 07-25-34" src="https://github.com/user-attachments/assets/66f12f11-fabc-4d68-9c7f-c65bf837f669" />


---

## Features

- View all pods across namespaces
- Live auto-refresh every 5 seconds
- Pod status with color indicators
- Restart count per pod
- Click a pod to view logs
- Restart pods directly from the UI
- Filter by namespace
- Search pods by name

---

## Stack

- Go
- Kubernetes client-go
- React
- TypeScript
- Vite

---

## Preview

PodPeek displays:

- Pod name
- Status
- Namespace
- Restart count
- Pod logs
- Restart actions

Built for:
- homelabs
- local Kubernetes clusters
- Minikube
- k3s
- small self-hosted environments

---

## Run locally

### Backend

```bash
cd backend
go run main.go
```

Backend runs on:

`http://localhost:8080`


### Frontend
cd frontend
npm install
npm run dev

Frontend runs on:

`http://localhost:5173`


## Requirements
kubectl configured locally
access to a Kubernetes cluster
Node 22+
Go
 
## Possible future ideas
- Node metrics
- CPU / memory usage
- Live log streaming
- Deployment scaling
- Dark/light themes
- Helm deployment support

Why?
PodPeek was built as a lightweight alternative to heavier Kubernetes dashboards.
Fast to start, easy to run locally, and focused only on the essentials.
