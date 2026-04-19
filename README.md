# Node Web Application boilerplate

A boilerplate for **Node.js** web applications. This boilerplate gives the basic stucture of application start with while bundling enough useful features so as to remove all those redundant tasks that can derail a project before it even really gets started. This boilerplate users Express with sequelize as ORM and MySQL as database.

### Prerequisites

1. ```NodeJs```
2. ```NPM```
3. ```MySQL```

### Quick start

1. Clone the repository with `git clone https://github.com/mangya/node-express-mysql-boilerplate.git <your_project_folder_name>`
2. Change directory to your project folder `cd <your_project_folder_name>`
3. Install the dependencies with `npm install`
4. Create database in MySQL.
5. Update the your database name and credentials in the `.env` file.
6. Run the application with `npm start` (MySQL service should be up and running).
7. Access `http://localhost:3000` and you're ready to go!

### Folder Structure
```
.
├── app/
│   ├── controllers/           # Controllers
│   ├── middlewares/           # Middlewares
│   ├── models/                # Express database models
├── config/
├── public/
│   ├── css/                   # Stylesheets
│   ├── js/
│	├── fonts/
│   ├── images/
├── .env                       # API keys, passwords, and other sensitive information
├── routes/                    # Route definitions
├── views/                     # All view files
├── index.js                   # Express application
└── package.json               # NPM Dependencies and scripts
```

## Packages used
* [nodemon](https://github.com/remy/nodemon) — tool that helps develop node.js based applications by automatically restarting the node application when file changes in the directory are detected.
* [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — encryption library to hash a password
* [body-parser](https://github.com/expressjs/body-parser) — Node.js body parsing middleware. Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
* [express-flash](https://github.com/RGBboy/express-flash) — middleware to store flash messages in the session.
* [connect-session-sequelize](https://github.com/mweibel/connect-session-sequelize) — SQL session store using Sequelize.js
* [csurf](https://github.com/expressjs/csurf) — Middleware for CSRF token creation and validation. Requires session middleware to be initialized first. We have used `express-session`
* [dotenv](https://github.com/motdotla/dotenv) — module to load environment variables from a .env file
* [express](https://github.com/visionmedia/express) — web application framework for node
* [express-handlebars](https://github.com/express-handlebars/express-handlebars) — Template engine
* [express-session](https://github.com/expressjs/session) — Module to create a session middleware. Required for `csurf`.
* [validator](https://github.com/validatorjs/validator.js) — A library of string validators and sanitizers.
* [mysql2](https://github.com/sidorares/node-mysql2) — MySQL client for Node.js. Required for Sequelize.
* [sequelize](https://github.com/sequelize/sequelize) — Sequelize is a promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server.

## Dockerized Node.js Application
This repository contains a Dockerfile to build and run a Node.js application in a Docker container. The Dockerfile is optimized for production use.

## Getting Started

To get started with running this Dockerized Node.js application, follow these steps:

### Prerequisites

- Docker installed on your system. You can download and install Docker from [here](https://www.docker.com/get-started).

### Building the Docker Image

1. Clone this repository to your local machine:

    ```bash
    git clone git@github.com:satyam0710/node-boilerplate-ecs.git
    ```

2. Navigate to the root directory of the cloned repository:

    ```bash
    cd node-express-mysql-boilerplate
    ```

3. Build the Docker image using the provided Dockerfile:

    ```bash
    docker build -t <image-name> .
    ```

### Running the Docker Container

Once you have built the Docker image, you can run the container using the following command:

```bash
docker run -p 3000:3000 -d <image-name>
```

This command will start the container in detached mode and expose port 3000 of the container to port 3000 on your host machine.

## Accessing the Application
You can access the running application by navigating to http://localhost:3000 in your web browser.

## After Application is live
You can access the running application by navigating to https://app.clouddemo.top in your web browser.

# Automated Deployment Workflow for Node Web App on AWS ECS
This GitHub Actions workflow automates the deployment process for a Node Web App  to **AWS Elastic Container Service (ECS)**. Workflow description:

* **Docker Image Building**: Efficiently builds Docker images encapsulating the Node Web app.

* **Vulnerability Scanning**: Conducts thorough vulnerability scans on the Docker images to ensure robust security measures.

* **ECS Deployment**: Seamlessly deploys the application onto AWS ECS by registering a new task definition revision and updating the ECS service, enabling controlled and reliable deployments.

## Workflow Steps

* **Checkout Code**: Checks out the source code from the repository.

* **Setup AWS Credentials**: Configures AWS credentials to authenticate with Amazon ECR.

* **Login to Amazon ECR**: Logs in to ECR to enable Docker image pushes.

* **Build and Push Docker Image**: Builds Docker images for the Node.js application, tags them with `latest` and the commit ID, and pushes them to ECR.

* **Run Trivy Vulnerability Scanner**: Scans the Docker image for vulnerabilities using Trivy and outputs the results.

* **Render ECS Task Definition**: Updates the container image in the ECS task definition JSON.

* **Deploy to ECS Service**: Registers a new task definition revision and updates the ECS service, waiting for service stability.

* **Optionally sends Alerts to Alack**: Slack alerts can be turned on using input enable_slack_alert.

## Improvements we can do

* Enhance the workflow to support multiple environments such as staging, testing, and production.
* Parameterize environment-specific configurations within ECS task definitions.
* Use GitHub Actions environments and approvals for controlled production deployments.

# Node Boilerplate Infrastructure

## Usage

* Example modules

```
module "vpc" {
  source                     = "./modules/vpc"
  name                       = "${var.name}-${var.environment}"
  region                     = var.region
  cidr_block                 = var.cidr_block
  private_subnet_cidr_blocks = var.private_subnet_cidr_blocks
  public_subnet_cidr_blocks  = var.public_subnet_cidr_blocks
  azs                        = var.azs
  environment                = var.environment
  tags                       = var.tags
  public_subnet_tags         = var.public_subnet_tags
  private_subnet_tags        = var.private_subnet_tags
}

module "ecs" {
  source              = "git@github.com:satyam0710/terraform-aws-modules.git//terraform/modules/ecs?ref=main"
  name                = var.name
  environment         = var.environment
  ecs_cluster_name    = var.ecs_cluster_name
  ecs_service_name    = var.ecs_service_name
  launch_type         = var.launch_type
  cpu                 = var.cpu
  memory              = var.memory
  desired_count       = var.desired_count
  vpc_id              = module.vpc.id
  subnet_ids          = module.vpc.private_subnet_ids
  assign_public_ip    = false
}
```

### Steps To Use

* Customize the module by providing values for the required variables (for example in `terraform.tfvars`).

* Clone this repository to your local machine.

```
git clone <repo_url>
```

* Change directory to terraform

```
cd ecs-terraform/
```

* Run terraform init to initialize the module.

```
terraform init
```

* Run terraform plan to see the execution plan.

```
terraform plan -var-file terraform.tfvars
```

* Run terraform apply to create the resources.

```
terraform apply -var-file terraform.tfvars
```

* To switch the workspace

```
terraform workspace select staging
```

## Terraform pre-commit hooks


Execute this command to run `pre-commit` on all files in the repository (not only changed files):

```
cd ecs-terraform
pre-commit run -a  #This will format the code and creates terraform docs
```

### [tfenv](https://github.com/tfutils/tfenv) - Terraform version manager

[tfenv](https://github.com/tfutils/tfenv) is a Terraform version manager which would help us on setting up the right
terraform client version and update it as we keep moving forward.

Install via Homebrew:

```shell
brew install tfenv
```

```shell
tfenv install 1.5.7
tfenv use 1.5.7
cd terraform
terraform init
```

### [TF Lint](https://github.com/terraform-linters/tflint)

```shell
pip install pre-commit
brew install tflint
brew install terraform-docs
brew install gawk
brew install checkov
brew install tfsec
tflint --init
```

## Accessing MySQL / RDS from ECS (IAM Authentication)

ECS tasks can securely access **Amazon RDS (MySQL)** using **IAM authentication**, without storing database passwords.

### Prerequisites

* RDS MySQL with **IAM DB authentication enabled**
* ECS task **task role** with `rds-db:connect` permission
* Database user created with IAM authentication plugin

---

### Create MySQL User for IAM Authentication

Connect to the database:

```bash
mysql -h <DB_ENDPOINT> -u <admin_user> -p
```

Create an IAM-authenticated user:

```sql
CREATE USER 'demoapp' IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';
GRANT ALL PRIVILEGES ON *.* TO 'demoapp'@'%';
FLUSH PRIVILEGES;
```

> This user **does not have a password**. Authentication is done via IAM.

---

### IAM Policy for RDS Access

Attach this policy to the **ECS task role**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "rds-db:connect",
      "Resource": "arn:aws:rds-db:<REGION>:<ACCOUNT_ID>:dbuser:<DB_RESOURCE_ID>/demoapp"
    }
  ]
}
```

**Replace:**

* `<REGION>` – AWS region
* `<ACCOUNT_ID>` – AWS account ID
* `<DB_RESOURCE_ID>` – RDS DB resource ID (from RDS console)
* `demoapp` – MySQL user created above

---

### ECS Task Configuration

In the **ECS task definition**:

* Assign the IAM role containing the policy above as the **task role**
* Pass DB connection details via environment variables or Secrets Manager:

  * `DB_HOST`
  * `DB_PORT`
  * `DB_DATABASE`
  * `DB_USER=demo_app`

Your application generates an IAM auth token at runtime to connect to RDS.

---

# Monitoring (ECS)

For monitoring ECS workloads, **enable ECS Container Insights** at the cluster level.

Container Insights provides:

* CPU & memory utilization (task + service level)
* Task count and restarts
* Network metrics
* Logs integration with CloudWatch

**How to use:**

* Enable `containerInsights = enabled` on the ECS cluster
* View metrics in **CloudWatch → Container Insights**
* Use **CloudWatch Logs** for application logs
* Use **CloudWatch Alarms** for CPU / memory thresholds

> No Prometheus, Grafana, or agents are required for ECS monitoring.

---
## Readings
* [How to Architect a Node.Js Project](https://dev.to/shadid12/how-to-architect-a-node-js-project-from-ground-up-1n22)

## Contributing

This boilerplate is open to suggestions and contributions, documentation contributions are also welcome! 😊
