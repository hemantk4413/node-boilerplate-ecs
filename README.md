# Three-Tier Application Deployment on AWS ECS

A production-ready **Node.js** web application deployed on **AWS ECS Fargate** with a fully automated CI/CD pipeline using GitHub Actions. The app features user authentication, session management, and connects to an **RDS MySQL** database. All secrets are managed via **AWS Secrets Manager**.

---

## Architecture

```
Developer → GitHub (push to main)
                ↓
         GitHub Actions
         ├── Build Docker image
         ├── Push to Amazon ECR
         ├── Trivy vulnerability scan
         ├── Register new ECS task definition
         └── Update ECS service (zero-downtime)
                ↓
         AWS ECS Fargate
         ├── ALB (public) → Target Group → Container (port 3000)
         ├── Secrets injected from Secrets Manager at startup
         └── Logs → CloudWatch Log Groups
                ↓
         RDS MySQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| App | Node.js + Express |
| ORM | Sequelize |
| Templating | Handlebars (HBS) |
| Auth | bcryptjs + express-session |
| Security | csurf (CSRF protection) |
| Container | Docker (multi-stage, Alpine) |
| Registry | Amazon ECR |
| Compute | AWS ECS Fargate |
| Load Balancer | Application Load Balancer (ALB) |
| Database | Amazon RDS MySQL |
| Secrets | AWS Secrets Manager |
| CI/CD | GitHub Actions |
| Security Scan | Trivy |
| AWS Auth | OIDC (no long-lived keys) |
| Logs | Amazon CloudWatch |

---

## Repo Structure

```
node-boilerplate-ecs/
├── .github/
│   └── workflows/
│       └── deploy-ecs.yml                  # CI/CD pipeline
├── ecs/
│   └── task-definition.json                # ECS Fargate task definition
├── node-express-mysql-boilerplate/
│   ├── app/
│   │   ├── controllers/                    # AuthController, HomeController, ErrorController
│   │   ├── middlewares/                    # isAuth.js (route guard)
│   │   └── models/                         # User.js, Session.js
│   ├── config/
│   │   └── database.js                     # Sequelize MySQL connection
│   ├── public/                             # Static assets (CSS, JS, fonts)
│   ├── routes/
│   │   └── web.js                          # All route definitions
│   ├── views/                              # Handlebars templates
│   ├── Dockerfile                          # Multi-stage Docker build
│   ├── index.js                            # App entry point
│   ├── package.json
│   └── .env-example                        # Environment variable template for local dev
└── README.md
```

---

## App Features

- User signup with input validation (name, email, password strength)
- Login with bcrypt password comparison
- Session-based authentication stored in MySQL
- CSRF protection on all forms
- Logout with session destruction
- Forgot password with secure token generation
- Password reset with token validation and 1-hour expiry
- 404 error page
- `/health` endpoint for ALB and Docker health checks
- Auto-creates database on first startup if it doesn't exist

---

## Local Development

### Prerequisites

- Node.js
- NPM
- MySQL (local instance)

### Quick Start

1. Clone the repository:
    ```bash
    git clone https://github.com/hemantk4413/node-boilerplate-ecs.git
    cd node-boilerplate-ecs/node-express-mysql-boilerplate
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Copy the env example and fill in your local values:
    ```bash
    cp .env-example .env
    ```

4. Update `.env` with your local MySQL credentials:
    ```
    PORT=3000
    SESSION_SECRET=your-random-secret
    DB_HOST=localhost
    DB_PORT=3306
    DB_DATABASE=your_database
    DB_USERNAME=root
    DB_PASSWORD=your_password
    DB_REGION=us-east-1
    ```

5. Start the app:
    ```bash
    npm start
    ```

6. Open `http://localhost:3000`

---

## Docker

### Build the image

```bash
cd node-express-mysql-boilerplate
docker build -t node-demo .
```

### Run the container

```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e SESSION_SECRET=secret \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_DATABASE=mydb \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=password \
  -d node-demo
```

---

## CI/CD Pipeline

Every push to `main` triggers the pipeline automatically.

### Pipeline Steps

1. **Checkout code** — pulls latest code from main
2. **Configure AWS credentials** — authenticates via GitHub OIDC (no stored AWS keys)
3. **Login to ECR** — authenticates Docker to push images
4. **Build & push image** — builds multi-stage image, tags with commit SHA + `latest`
5. **Trivy scan** — scans for OS and library vulnerabilities
6. **Render task definition** — injects new image URI into `ecs/task-definition.json`
7. **Deploy to ECS** — registers new task definition revision, updates service, waits for stability

### Required GitHub Secret

| Secret | Description |
|---|---|
| *(none)* | AWS auth uses OIDC — no AWS keys needed |

---

## AWS Setup

### Resources Required

| Resource | Name |
|---|---|
| ECS Cluster | `dev-ecs-fargate` |
| ECS Service | `node-demo` |
| ECR Repository | `demo-app-staging` |
| RDS MySQL | your RDS instance |
| Secrets Manager | your secret with DB credentials |
| CloudWatch Log Group | `/ecs/dev-ecs-fargate/node-demo` |
| ALB + Target Group | health check path: `/health` |
| IAM Role (CI/CD) | `github-actions-ecs-deploy-role` |
| IAM Role (Task Execution) | `dev-ecs-fargate-task-execution` |
| IAM Role (Task) | `dev-ecs-fargate-task-role` |
| OIDC Provider | `token.actions.githubusercontent.com` |

### Secrets Manager Keys

The following keys must exist in your Secrets Manager secret:

```
DB_HOST
DB_USERNAME
DB_DATABASE
DB_PASSWORD
DB_PORT
DB_REGION
SESSION_SECRET
```

### IAM Role — GitHub Actions (OIDC)

Trust policy condition:
```json
"repo:hemantk4413/node-boilerplate-ecs:*"
```

Permissions needed:
- `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
- `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`, `ecs:DescribeTaskDefinition`
- `iam:PassRole` for task execution and task roles

---

## Security

- CSRF protection on all forms
- Passwords hashed with bcrypt (cost factor 12)
- Sessions stored in MySQL (survives container restarts)
- All secrets in AWS Secrets Manager (never in code or `.env`)
- No AWS long-lived credentials — OIDC only
- Docker runs as non-root `node` user
- Trivy scans every build for vulnerabilities
- IAM roles follow least privilege principle
- ALB is the only public entry point

---

## Monitoring

ECS Container Insights is enabled on the cluster.

- View metrics: **CloudWatch → Container Insights**
- View logs: **CloudWatch → Log Groups → `/ecs/dev-ecs-fargate/node-demo`**
- Set alarms on CPU/memory thresholds via CloudWatch Alarms

---

## Packages Used

| Package | Purpose |
|---|---|
| [express](https://github.com/expressjs/express) | Web framework |
| [sequelize](https://github.com/sequelize/sequelize) | MySQL ORM |
| [mysql2](https://github.com/sidorares/node-mysql2) | MySQL client |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [express-session](https://github.com/expressjs/session) | Session management |
| [connect-session-sequelize](https://github.com/mweibel/connect-session-sequelize) | MySQL session store |
| [csurf](https://github.com/expressjs/csurf) | CSRF protection |
| [express-handlebars](https://github.com/express-handlebars/express-handlebars) | Templating engine |
| [express-flash](https://github.com/RGBboy/express-flash) | Flash messages |
| [dotenv](https://github.com/motdotla/dotenv) | Local env variable loading |
| [validator](https://github.com/validatorjs/validator.js) | Input validation |
| [body-parser](https://github.com/expressjs/body-parser) | Request body parsing |
| [nodemon](https://github.com/remy/nodemon) | Auto-restart in development |

---

## What's Next

- HTTPS with ACM certificate + Route 53 custom domain
- Staging and production environment separation
- Database migrations in CI/CD pipeline
- Automated rollback on health check failure
- CloudWatch alarms for CPU/memory thresholds
- WAF on ALB for DDoS protection
