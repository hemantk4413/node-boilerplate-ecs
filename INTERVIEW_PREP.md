# Interview Preparation — Node.js App on AWS ECS with CI/CD

---

## 1. Project Overview (30-second pitch)

> "I built and deployed a Node.js Express web application on AWS ECS Fargate using a fully automated CI/CD pipeline with GitHub Actions. The app includes user authentication, session management, and connects to an RDS MySQL database. All secrets are managed via AWS Secrets Manager, and the infrastructure uses an Application Load Balancer for traffic routing. Every push to main triggers an automated build, security scan, and zero-downtime deployment."

---

## 2. Architecture — Be Ready to Draw This

```
Developer → GitHub (push to main)
                ↓
         GitHub Actions
         ├── Build Docker image
         ├── Push to ECR
         ├── Trivy security scan
         ├── Register new ECS task definition
         └── Update ECS service
                ↓
         AWS ECS Fargate
         ├── ALB (public) → Target Group → Container (port 3000)
         ├── Task pulls secrets from Secrets Manager at startup
         └── Logs → CloudWatch Log Groups
                ↓
         RDS MySQL (private subnet)
```

---

## 3. Tech Stack — Know Every Component

| Component | Technology | Why |
|---|---|---|
| App | Node.js + Express | Lightweight, fast web framework |
| ORM | Sequelize | Abstracts MySQL queries, handles migrations |
| Templating | Handlebars (HBS) | Server-side rendering |
| Auth | bcryptjs + express-session | Password hashing, session-based auth |
| Security | csurf | CSRF token protection on all forms |
| Container | Docker (multi-stage) | Small Alpine image, dumb-init for signal handling |
| Registry | Amazon ECR | Private Docker registry in AWS |
| Compute | ECS Fargate | Serverless containers, no EC2 management |
| Load Balancer | ALB | Health checks, traffic distribution |
| Database | RDS MySQL | Managed relational database |
| Secrets | AWS Secrets Manager | No credentials in code or environment files |
| CI/CD | GitHub Actions | Automated build, scan, deploy on push |
| Security Scan | Trivy | Container vulnerability scanning |
| Auth to AWS | OIDC (no keys) | Short-lived tokens, no stored AWS credentials |
| Logs | CloudWatch | Centralized container logging |

---

## 4. Key Concepts — Deep Dive

### Docker Multi-Stage Build
**Q: Why multi-stage?**
- Stage 1 (`base`): Uses `node:18` full image, installs all dependencies
- Stage 2 (`release`): Uses `node:18-alpine` (tiny), copies only production modules
- Result: Final image is ~80% smaller, smaller attack surface

```dockerfile
FROM node:18 AS base        # full image for building
FROM node:18-alpine AS release  # minimal image for running
```

---

### ECS Fargate vs EC2
**Q: Why Fargate over EC2?**
- No server management — AWS handles the underlying infrastructure
- Pay per task (CPU/memory), not per instance
- Auto-scales tasks without managing ASGs
- Better for variable/unpredictable traffic

---

### OIDC Authentication (no AWS keys)
**Q: How does GitHub Actions authenticate to AWS without storing keys?**
- GitHub generates a short-lived JWT token per workflow run
- AWS IAM verifies the token against the registered OIDC provider (`token.actions.githubusercontent.com`)
- AWS issues temporary credentials (15 min expiry) via `sts:AssumeRoleWithWebIdentity`
- No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` stored anywhere

**Q: What's the trust condition?**
```json
"repo:hemantk4413/node-boilerplate-ecs:*"
```
Only this specific repo can assume the role.

---

### Secrets Manager vs Environment Variables
**Q: Why Secrets Manager instead of env vars in task definition?**
- Secrets are encrypted at rest (AES-256)
- Access is audited via CloudTrail
- Secrets can be rotated without redeploying
- No plaintext values in task definition JSON or code

**Q: How does ECS pull secrets?**
- Task execution role has `secretsmanager:GetSecretValue` permission
- ECS injects secrets as environment variables before container starts
- App reads them via `process.env.DB_PASSWORD`

---

### Health Checks
**Q: How does the ALB know the container is healthy?**
- ALB sends `GET /health` every 30 seconds
- App returns `200 {"status":"ok"}`
- If 2 consecutive checks fail → ALB stops routing traffic to that task
- Docker also runs `HEALTHCHECK` internally using `wget`

---

### Zero-Downtime Deployment
**Q: How do you deploy without downtime?**
- ECS uses rolling deployment by default
- `deployment_minimum_healthy_percent: 100` — old task stays up until new one is healthy
- `deployment_maximum_percent: 200` — allows running both old and new tasks simultaneously
- ALB only routes to healthy tasks
- Old task is stopped only after new task passes health checks

---

## 5. CI/CD Pipeline — Walk Through Every Step

```
1. Checkout code          # pulls latest code from main
2. Configure AWS (OIDC)   # gets temp credentials via GitHub OIDC
3. Reset Docker context   # avoids Docker context naming conflicts
4. Login to ECR           # authenticates Docker to push images
5. Build & push image     # builds multi-stage image, tags with commit SHA + latest
6. Trivy scan             # scans for OS and library vulnerabilities
7. Render task definition # injects new image URI into task definition JSON
8. Deploy to ECS          # registers new task def revision, updates service, waits for stability
```

**Q: Why tag with commit SHA?**
- Every deployment is traceable to an exact commit
- Easy rollback — just deploy a previous SHA tag
- `latest` tag always points to the most recent build

---

## 6. Security — Be Ready for This

**Q: What security measures are in place?**

- CSRF protection on all forms (`csurf` middleware)
- Passwords hashed with bcrypt (cost factor 12)
- Sessions stored in MySQL (not in-memory — survives restarts)
- Secrets in AWS Secrets Manager (never in code or `.env`)
- No AWS long-lived credentials (OIDC only)
- Docker runs as non-root `node` user
- Trivy scans every build for vulnerabilities
- IAM roles follow least privilege principle
- RDS in private subnet (not publicly accessible)
- ALB as the only public entry point

---

## 7. Problems You Solved — Tell These as Stories

| Problem | Root Cause | Fix |
|---|---|---|
| OIDC auth failing | Wrong GitHub org name in trust policy (`satyam0710` vs `hemantk4413`) | Updated trust policy condition |
| ECR login failing | `DOCKER_CONTEXT` is a reserved Docker env var | Renamed to `BUILD_CONTEXT` |
| Secrets not loading | Wrong account ID in secret ARNs (`569144120749` vs `115019372174`) | Updated all ARNs |
| DB access denied | Wrong password in Secrets Manager | Updated correct RDS password |
| Unknown database | RDS instance created but database not initialized | Added `CREATE DATABASE IF NOT EXISTS` on startup |
| Container crashing | `postinstall` script tried to copy `.env-example` which wasn't in image | Removed postinstall script |
| Health check failing | `curl` not available in Alpine image | Switched to `wget` |
| Token logged to CloudWatch | Debug code left in `database.js` | Removed token logging |

---

## 8. Possible Interview Questions

### Architecture
- How would you add a staging environment?
- How would you handle database migrations?
- How would you add HTTPS?

### Scaling
- How does ECS autoscaling work?
- What happens if the database becomes a bottleneck?

### Security
- What happens if a secret needs to be rotated?
- How would you restrict which IPs can access the ALB?

### CI/CD
- How would you roll back a bad deployment?
- How would you add integration tests to the pipeline?
- What does `wait-for-service-stability` do?

---

## 9. What You'd Add Next (shows maturity)

- HTTPS with ACM certificate + Route 53 custom domain
- Separate staging and production environments
- Database migration step in CI/CD (Sequelize migrations)
- Automated rollback on health check failure
- CloudWatch alarms for CPU/memory thresholds
- WAF on ALB for DDoS protection
- Secrets rotation with Lambda

---

## 10. AWS Resources Created (your account: 115019372174)

| Resource | Name |
|---|---|
| ECS Cluster | `dev-ecs-fargate` |
| ECS Service | `node-demo` |
| ECR Repository | `demo-app-staging` |
| RDS Instance | `node-database-1` |
| RDS Database | `node-database-1` |
| Secrets Manager | `ECS-RDS-Secrets-hFuKrD` |
| CloudWatch Log Group | `/ecs/dev-ecs-fargate/node-demo` |
| ALB | (your ALB DNS name) |
| Target Group | `node-demo-tg` |
| IAM Role (CI/CD) | `github-actions-ecs-deploy-role` |
| IAM Role (Task Execution) | `dev-ecs-fargate-task-execution` |
| IAM Role (Task) | `dev-ecs-fargate-task-role` |
| OIDC Provider | `token.actions.githubusercontent.com` |

---

## 11. App Features Implemented

- User signup with validation (name, email, password strength)
- Login with bcrypt password comparison
- Session-based authentication stored in MySQL
- CSRF protection on all forms
- Logout with session destruction
- Forgot password with token generation
- Password reset with token validation and expiry (1 hour)
- 404 error page
- `/health` endpoint for ALB and Docker health checks
- Auto-creates database on first startup if it doesn't exist

---

## 12. Repo Structure

```
node-boilerplate-ecs/
├── .github/
│   └── workflows/
│       └── deploy-ecs.yml          # CI/CD pipeline
├── ecs/
│   └── task-definition.json        # ECS task definition (source of truth)
├── node-express-mysql-boilerplate/
│   ├── app/
│   │   ├── controllers/            # AuthController, HomeController, ErrorController
│   │   ├── middlewares/            # isAuth.js (route guard)
│   │   └── models/                 # User.js, Session.js
│   ├── config/
│   │   └── database.js             # Sequelize connection (password auth)
│   ├── public/                     # Static assets (CSS, JS, fonts)
│   ├── routes/
│   │   └── web.js                  # All route definitions
│   ├── views/                      # Handlebars templates
│   ├── Dockerfile                  # Multi-stage Docker build
│   ├── index.js                    # App entry point
│   └── package.json
├── .pre-commit-config.yaml         # Code quality hooks
└── INTERVIEW_PREP.md               # This file
```
