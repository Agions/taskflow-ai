# Cloud Deployment Guide

Comprehensive guide for deploying TaskFlow AI on major cloud platforms.

## Prerequisites

### Common Requirements

- **Node.js**: >= 18.0.0 (required for all platforms)
- **npm**: >= 8.0.0
- **Git**: For CI/CD deployments
- **Docker**: For containerized deployments (optional but recommended)

### Environment Variables

Configure these before deployment:

```bash
# AI Model Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key
ZHIPU_API_KEY=your-zhipu-api-key
QWEN_API_KEY=your-qwen-api-key

# Application Settings
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE=/var/log/taskflow/taskflow.log

# Performance Settings
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=60000
```

---

## Alibaba Cloud

### 阿里云

Alibaba Cloud offers two deployment options: Serverless (函数计算) for auto-scaling and cost efficiency, and ECS (Virtual Machines) for full control.

---

### Alibaba Cloud - 函数计算 (Serverless)

#### Step 1: Prepare Your Application

```bash
# Clone and build TaskFlow AI
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
```

#### Step 2: Create the Function

1. Log in to [Alibaba Cloud Console](https://console.aliyun.com)
2. Navigate to **函数计算 FC**
3. Create a new function:
   - **Region**: Choose nearest region (e.g., cn-hangzhou)
   - **Service**: Create new or select existing
   - **Function Name**: `taskflow-ai`
   - **Runtime**: Node.js 18.x

#### Step 3: Upload Code Package

```bash
# Create deployment package
zip -r taskflow-deployment.zip dist/ package.json node_modules/

# Upload via CLI
aliyun fc deploy --serviceName taskflow-service --functionName taskflow-ai --codeZipFile taskflow-deployment.zip
```

#### Step 4: Configure Environment Variables

```bash
# Set environment variables
aliyun fc put function --serviceName taskflow-service --functionName taskflow-ai \
  --environmentVariables '{"NODE_ENV":"production","DEEPSEEK_API_KEY":"your-key"}'
```

#### Step 5: Set Up HTTP Trigger

```bash
# Create HTTP trigger
aliyun fc createTrigger --serviceName taskflow-service --functionName taskflow-ai \
  --triggerName http-trigger --triggerType http --invocationRole acs:fc:invocation
```

#### Step 6: Test the Function

```bash
# Invoke the function
curl https://{account-id}.{region}.fc.aliyuncs.com/2016-08-15/proxy/taskflow-service/taskflow-ai/
```

#### Full serverless.yml Example

```yaml
# serverless.yml for Alibaba Cloud
service: taskflow-ai

provider:
  name: aliyun
  region: cn-hangzhou
  stage: production
  runtime: nodejs18

functions:
  taskflow:
    handler: index.handler
    memorySize: 512
    timeout: 60
    environment:
      NODE_ENV: production
      DEEPSEEK_API_KEY: ${env:DEEPSEEK_API_KEY}
    events:
      - http:
          path: /taskflow
          method: any
```

---

### Alibaba Cloud - ECS (Virtual Machine)

#### Step 1: Create an ECS Instance

1. Log in to [Alibaba Cloud Console](https://console.aliyun.com)
2. Navigate to **云服务器 ECS**
3. Create instance:
   - **Region**: Choose nearest region
   - **Instance Type**: ecs.s6-c1m2.large (2 vCPU, 4 GB) minimum
   - **OS**: Ubuntu 22.04 LTS or CentOS 7.x
   - **Security Group**: Allow ports 22, 80, 443, 3000

#### Step 2: Connect to Instance

```bash
# Connect via SSH
ssh root@<your-ecs-ip>

# Update system
apt update && apt upgrade -y  # Ubuntu
# or
yum update -y  # CentOS
```

#### Step 3: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # v20.x.x
npm --version  # 10.x.x
```

#### Step 4: Install TaskFlow AI

```bash
# Install TaskFlow AI globally
npm install -g taskflow-ai

# Verify installation
taskflow --version
```

#### Step 5: Configure Environment

```bash
# Create application directory
mkdir -p /opt/taskflow
cd /opt/taskflow

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
DEEPSEEK_API_KEY=your-deepseek-api-key
ZHIPU_API_KEY=your-zhipu-api-key
LOG_LEVEL=info
LOG_FILE=/var/log/taskflow/taskflow.log
MAX_CONCURRENT_REQUESTS=10
EOF

# Create log directory
mkdir -p /var/log/taskflow
chown -R root:root /var/log/taskflow
```

#### Step 6: Set Up Systemd Service

```bash
# Create systemd service file
cat > /etc/systemd/system/taskflow.service << 'EOF'
[Unit]
Description=TaskFlow AI Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/taskflow
Environment=NODE_ENV=production
EnvironmentFile=/opt/taskflow/.env
ExecStart=/usr/bin/node /usr/lib/node_modules/taskflow-ai/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/taskflow/taskflow.log
StandardError=append:/var/log/taskflow/taskflow.log

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable taskflow
systemctl start taskflow

# Check status
systemctl status taskflow
```

#### Step 7: Configure Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/taskflow << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site and configure SSL
ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install SSL certificate
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

#### Step 8: Set Up Auto-Restart and Monitoring

```bash
# Install process manager for resilience
npm install -g pm2

# Start with PM2
cd /opt/taskflow
pm2 start /usr/lib/node_modules/taskflow-ai/dist/index.js --name taskflow-ai

# Configure startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

## Tencent Cloud

### 腾讯云

Tencent Cloud provides SCF (Serverless Cloud Function) for serverless and CVM for virtual machines.

---

### Tencent Cloud - SCF (Serverless Cloud Function)

#### Step 1: Prepare the Application

```bash
# Clone repository
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
```

#### Step 2: Create SCF Function via Console

1. Log in to [Tencent Cloud Console](https://console.cloud.tencent.com)
2. Navigate to **云函数 SCF**
3. Create function:
   - **Region**: Choose nearest (e.g., ap-guangzhou)
   - **Namespace**: default
   - **Function Name**: taskflow-ai
   - **Runtime**: Nodejs18.16

#### Step 3: Package and Upload

```bash
# Create deployment package (excluding dev dependencies)
npm install --production
zip -r taskflow-scf.zip dist/ package.json node_modules/

# Upload via qshell or console
```

#### Step 4: Configure via serverless.yml

```yaml
# serverless.yml for Tencent Cloud
component: scf
name: taskflow-ai
stage: prod

inputs:
  name: taskflow-ai
  region: ap-guangzhou
  runtime: Nodejs18.16
  handler: index.handler
  memorySize: 512
  timeout: 60
  environment:
    variables:
      NODE_ENV: production
      DEEPSEEK_API_KEY: ${env:DEEPSEEK_API_KEY}
  events:
    - apigw:
        name: taskflow-api
        parameters:
          protocols:
            - http
          method: ANY
```

#### Step 5: Deploy with Serverless Framework

```bash
# Install serverless Tencent Cloud plugin
npm install -g serverless-tencent-scf

# Deploy
serverless deploy
```

#### Step 6: Test the Function

```bash
# Get function URL from console or CLI
curl https://service-xxxxx.gz.apigw.tencentcs.com/release/taskflow-ai
```

---

### Tencent Cloud - CVM (Virtual Machine)

#### Step 1: Create a CVM Instance

1. Log in to [Tencent Cloud Console](https://console.cloud.tencent.com)
2. Navigate to **云服务器 CVM**
3. Create instance:
   - **Region**: Choose nearest (e.g., ap-guangzhou)
   - **Instance Type**: S6.LARGE2 (2 vCPU, 4 GB)
   - **OS**: Ubuntu Server 22.04 LTS
   - **Security Group**: Allow 22, 80, 443, 3000

#### Step 2: Connect and Install

```bash
# SSH into instance
ssh ubuntu@<your-cvm-ip>

# Update and install dependencies
sudo apt update
sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Install TaskFlow AI
sudo npm install -g taskflow-ai
```

#### Step 3: Create Service User and Directory

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash taskflow
sudo mkdir -p /opt/taskflow
sudo chown taskflow:taskflow /opt/taskflow

# Switch to user and configure
sudo su - taskflow
cd /opt/taskflow
npm install taskflow-ai

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
DEEPSEEK_API_KEY=your-api-key
LOG_FILE=/home/taskflow/logs/taskflow.log
EOF
```

#### Step 4: Set Up Service with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start TaskFlow AI
sudo pm2 start $(which taskflow) --name taskflow-ai

# Setup startup script
sudo pm2 startup
sudo pm2 save

# Configure log rotation
sudo pm2 install pm2-logrotate
sudo pm2 set pm2-logrotate:max_size 10M
sudo pm2 set pm2-logrotate:retain 5
```

#### Step 5: Configure Nginx and SSL

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo cat > /etc/nginx/sites-available/taskflow << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable configuration
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## AWS (Amazon Web Services)

### AWS Lambda (Serverless)

#### Step 1: Prepare Application for Lambda

Lambda functions have `/tmp` storage (512 MB) and a 15-minute max execution time. For most TaskFlow AI operations, this is sufficient.

```bash
# Clone and build
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
```

#### Step 2: Create Lambda Function

**Option A: Via AWS Console**

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Lambda**
3. Create function:
   - **Name**: taskflow-ai
   - **Runtime**: Node.js 18.x
   - **Architecture**: x86_64 or arm64
   - **Permissions**: Create new execution role with basic permissions

**Option B: Via AWS CLI**

```bash
# Create execution role
aws iam create-role --role-name taskflow-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy --role-name taskflow-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create Lambda function
aws lambda create-function --function-name taskflow-ai \
  --runtime nodejs18.x \
  --role arn:aws:iam::123456789012:role/taskflow-lambda-role \
  --handler index.handler \
  --zip-file fileb://taskflow-deployment.zip \
  --timeout 60 \
  --memory-size 512
```

#### Step 3: Package and Deploy

```bash
# Create deployment package
npm install --production
zip -r taskflow-lambda.zip dist/ package*.json node_modules/

# Update function code
aws lambda update-function-code --function-name taskflow-ai \
  --zip-file fileb://taskflow-lambda.zip
```

#### Step 4: Configure Environment Variables

```bash
aws lambda update-function-configuration --function-name taskflow-ai \
  --environment "Variables={NODE_ENV=production,DEEPSEEK_API_KEY=your-key}"
```

#### Step 5: Set Up API Gateway (HTTP API)

```bash
# Create API Gateway HTTP API
aws apigatewayv2 create-api --name taskflow-api --protocol-type HTTP

# Note the API ID and default stage URL
# Create route and integration
aws apigatewayv2 create-integration --api-id <api-id> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:<region>:<account>:function:taskflow-ai

aws apigatewayv2 create-route --api-id <api-id> \
  --route-key "ANY /{proxy+}" \
  --target "integrations/<integration-id>"
```

#### Step 6: Test the Function

```bash
# Invoke directly
aws lambda invoke --function-name taskflow-ai response.json

# Test via API Gateway
curl https://<api-id>.execute-api.<region>.amazonaws.com/taskflow
```

#### serverless.yml Example for AWS

```yaml
service: taskflow-ai

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  memorySize: 512
  timeout: 60
  environment:
    NODE_ENV: production
    DEEPSEEK_API_KEY: ${env:DEEPSEEK_API_KEY}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: arn:aws:logs:*:*:*

functions:
  api:
    handler: dist/index.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY
```

---

### AWS EC2 (Virtual Machine)

#### Step 1: Launch an EC2 Instance

1. Log in to [AWS Console](https://console.aws.amazon.com/ec2)
2. Launch instance:
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: t3.medium (2 vCPU, 4 GB) minimum
   - **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)
   - **Key Pair**: Create or select existing

#### Step 2: Connect to Instance

```bash
# Connect via SSH
ssh -i "your-key.pem" ubuntu@<your-ec2-ip>

# Update system
sudo apt update
sudo apt upgrade -y
```

#### Step 3: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version

# Install TaskFlow AI globally
sudo npm install -g taskflow-ai

# Verify
taskflow --version
```

#### Step 4: Configure Application

```bash
# Create application directory
sudo mkdir -p /opt/taskflow
sudo chown ubuntu:ubuntu /opt/taskflow
cd /opt/taskflow

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
DEEPSEEK_API_KEY=your-api-key
ZHIPU_API_KEY=your-zhipu-api-key
LOG_FILE=/var/log/taskflow/taskflow.log
MAX_CONCURRENT_REQUESTS=10
EOF

# Create log directory
sudo mkdir -p /var/log/taskflow
sudo chown ubuntu:ubuntu /var/log/taskflow
```

#### Step 5: Set Up Application User and Service

```bash
# Create application user
sudo useradd -m -s /bin/bash app
sudo mkdir -p /opt/taskflow
sudo chown app:app /opt/taskflow

# Copy application files
sudo cp -r /opt/taskflow /home/app/
sudo chown -R app:app /home/app/taskflow

# Create systemd service
sudo cat > /etc/systemd/system/taskflow.service << 'EOF'
[Unit]
Description=TaskFlow AI
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/home/app/taskflow
EnvironmentFile=/home/app/taskflow/.env
ExecStart=/usr/bin/node /usr/lib/node_modules/taskflow-ai/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable taskflow
sudo systemctl start taskflow
sudo systemctl status taskflow
```

#### Step 6: Configure Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Configure reverse proxy
sudo cat > /etc/nginx/sites-available/taskflow << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Step 7: Set Up Auto-Scaling (Optional)

1. Create an AMI from your configured instance
2. Navigate to **Auto Scaling Groups**
3. Create ASG with:
   - **Launch Template**: Use your AMI
   - **Min Size**: 1
   - **Max Size**: 3
   - **Desired Capacity**: 1
   - **Scaling Policy**: Based on CPU utilization

---

## Google Cloud

### Google Cloud Platform

Google Cloud offers Cloud Functions (serverless) and Compute Engine (VMs).

---

### Google Cloud - Cloud Functions

#### Step 1: Prepare Application

```bash
# Clone and build
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
```

#### Step 2: Create Cloud Function

**Option A: Via Google Cloud Console**

1. Navigate to [Cloud Functions](https://console.cloud.google.com/functions)
2. Create function:
   - **Environment**: 2nd gen (recommended)
   - **Function name**: taskflow-ai
   - **Region**: us-central1 (or nearest)
   - **Runtime**: Node.js 18

**Option B: Via gcloud CLI**

```bash
# Set project
gcloud config set project your-project-id

# Create deployment package
npm install --production
zip -r taskflow-function.zip dist/ package*.json node_modules/

# Deploy function
gcloud functions deploy taskflow-ai \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --timeout 60s \
  --memory 512MB \
  --region us-central1 \
  --source=.
```

#### Step 3: Set Environment Variables

```bash
gcloud functions deploy taskflow-ai \
  --set-env-vars "NODE_ENV=production,DEEPSEEK_API_KEY=your-key"
```

#### Step 4: Configure Entry Point

Create a wrapper function in `index.js`:

```javascript
// index.js for Cloud Functions
const taskflow = require('./dist/index.js');

exports.taskflow = async (req, res) => {
  try {
    const { action, input } = req.body || {};
    
    switch (action) {
      case 'parse':
        const result = await taskflow.parse(input);
        res.json({ success: true, data: result });
        break;
      case 'think':
        const thought = await taskflow.think(input);
        res.json({ success: true, data: thought });
        break;
      default:
        res.json({ 
          status: 'ok', 
          availableActions: ['parse', 'think', 'flow'] 
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### Step 5: Test the Function

```bash
# Get function URL
gcloud functions describe taskflow-ai --region us-central1

# Test with curl
curl -X POST https://us-central1-your-project.cloudfunctions.net/taskflow-ai \
  -H "Content-Type: application/json" \
  -d '{"action":"think","input":"Explain microservices"}'
```

---

### Google Cloud - Compute Engine (Virtual Machine)

#### Step 1: Create a VM Instance

1. Navigate to [Compute Engine](https://console.cloud.google.com/compute)
2. Create instance:
   - **Name**: taskflow-vm
   - **Region**: us-central1 (or nearest)
   - **Machine type**: e2-medium (2 vCPU, 4 GB)
   - **Boot disk**: Ubuntu 22.04 LTS
   - **Firewall**: Allow HTTP/HTTPS

#### Step 2: Connect to Instance

```bash
# Connect via SSH
gcloud compute ssh taskflow-vm

# Update system
sudo apt update
sudo apt upgrade -y
```

#### Step 3: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version

# Install TaskFlow AI
sudo npm install -g taskflow-ai

# Verify
taskflow --version
```

#### Step 4: Configure Application

```bash
# Create application directory
sudo mkdir -p /opt/taskflow
cd /opt/taskflow

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
DEEPSEEK_API_KEY=your-api-key
ZHIPU_API_KEY=your-zhipu-api-key
LOG_FILE=/var/log/taskflow/taskflow.log
MAX_CONCURRENT_REQUESTS=10
EOF

# Create log directory
sudo mkdir -p /var/log/taskflow
sudo chown -R $USER:$USER /var/log/taskflow
```

#### Step 5: Set Up Service

```bash
# Create systemd service
sudo cat > /etc/systemd/system/taskflow.service << 'EOF'
[Unit]
Description=TaskFlow AI
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/taskflow
EnvironmentFile=/opt/taskflow/.env
ExecStart=/usr/bin/node /usr/lib/node_modules/taskflow-ai/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable taskflow
sudo systemctl start taskflow
sudo systemctl status taskflow
```

#### Step 6: Configure Firewall and Load Balancer (Optional)

```bash
# Allow port 3000 in firewall
gcloud compute firewall-rules create taskflow-rule \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0

# For production, use Cloud Load Balancer with managed instance group
```

#### Step 7: Set Up Managed Instance Group (Optional)

1. Create instance template from your configured VM
2. Create Instance Group:
   - **Group type**: Managed instance group (regional)
   - **Instance template**: Use your template
   - **Autoscaling**: Based on CPU (target 70%)
   - **Min instances**: 1
   - **Max instances**: 3

---

## Security Configuration

### Environment Variable Management

**Alibaba Cloud:**
```bash
# Use Key Management Service
aliyun kms CreateKey --KeyUsage ENCRYPT_DECRYPT
aliyun kms PutSecretValue --SecretName taskflow-api-keys --SecretData '{"DEEPSEEK_API_KEY":"..."}'
```

**Tencent Cloud:**
```bash
# Use Secrets Manager
qcloud cli CAM CreateSecret --SecretName taskflow-keys --SecretData '{"DEEPSEEK_API_KEY":"..."}'
```

**AWS:**
```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret --name taskflow-api-keys \
  --secret-string '{"DEEPSEEK_API_KEY":"..."}'

# Or use Parameter Store (free)
aws ssm put-parameter --name /taskflow/DEEPSEEK_API_KEY \
  --value "your-key" --type SecureString
```

**Google Cloud:**
```bash
# Use Secret Manager
gcloud secrets create taskflow-api-keys --data-file=secrets.json
```

### Network Security

| Platform | Security Feature | Configuration |
|----------|------------------|---------------|
| Alibaba Cloud | Security Groups | Configure inbound/outbound rules |
| Tencent Cloud | Security Groups | Whitelist necessary ports |
| AWS | Security Groups + NACLs | Layered network security |
| Google Cloud | VPC Firewall Rules | Define network policies |

### SSL/TLS Configuration

All platforms provide free SSL certificates via Let's Encrypt:

```bash
# Alibaba Cloud (using Certbot)
certbot --nginx -d your-domain.com

# Tencent Cloud (using Certbot)
certbot --nginx -d your-domain.com

# AWS (using Certbot or ACM)
certbot --nginx -d your-domain.com
# Or use AWS ACM for ELB

# Google Cloud (using Certbot)
certbot --nginx -d your-domain.com
# Or use Google-managed certificates
```

---

## Monitoring and Logging

### Alibaba Cloud

```bash
# View logs
aliyun fc get-function-log --serviceName taskflow-service --functionName taskflow-ai --tail
```

### Tencent Cloud

```bash
# View logs via CLI
tccli scf GetFunctionLogs --function-name taskflow-ai
```

### AWS

```bash
# View CloudWatch logs
aws logs tail /aws/lambda/taskflow-ai --follow
```

### Google Cloud

```bash
# View logs
gcloud functions logs read taskflow-ai --region us-central1
```

### Centralized Logging (All Platforms)

```yaml
# Example: Fluentd configuration for centralized logging
<source>
  @type tail
  path /var/log/taskflow/taskflow.log
  pos_file /var/log/taskflow/taskflow.log.pos
  tag taskflow.app
</source>

<match taskflow.**>
  @type elasticsearch
  host elasticsearch.example.com
  port 9200
  logstash_format true
</match>
```

---

## Troubleshooting

### Common Issues

**1. Function/Instance Won't Start**

```bash
# Check logs
journalctl -u taskflow -n 50

# Verify Node.js installation
node --version

# Verify TaskFlow AI installation
taskflow --version
```

**2. Environment Variables Not Loading**

```bash
# Reload systemd
sudo systemctl daemon-reload
sudo systemctl restart taskflow

# Verify .env file
cat /opt/taskflow/.env
```

**3. Permission Denied Errors**

```bash
# Fix directory permissions
sudo chown -R ubuntu:ubuntu /opt/taskflow
sudo chmod -R 755 /opt/taskflow

# Fix log directory
sudo chown -R ubuntu:ubuntu /var/log/taskflow
```

**4. Timeout Issues**

For serverless functions, increase timeout:
- Alibaba Cloud: `--timeout 300`
- Tencent Cloud: `--timeout 300`
- AWS Lambda: `--timeout 900` (15 min max)
- Google Cloud: `--timeout 300s`

---

## Cost Estimation

### Serverless (Monthly Estimates)

| Platform | Requests | Compute Time | Est. Monthly Cost |
|----------|----------|---------------|-------------------|
| Alibaba FC | 10,000 | 50,000 GB-s | $5-15 |
| Tencent SCF | 10,000 | 50,000 GB-s | $5-15 |
| AWS Lambda | 10,000 | 50,000 GB-s | $5-20 |
| Google Cloud Functions | 10,000 | 50,000 GB-s | $5-15 |

### Virtual Machines (Monthly Estimates)

| Platform | Instance Type | Est. Monthly Cost |
|----------|---------------|-------------------|
| Alibaba ECS | ecs.s6-c1m2.large | $20-30 |
| Tencent CVM | S6.LARGE2 | $20-30 |
| AWS EC2 | t3.medium | $25-35 |
| Google Compute | e2-medium | $25-35 |

*Costs vary by region and usage. Always check official pricing pages for accurate estimates.*

---

## Related Documentation

- [Docker Deployment](./docker.md)
- [Environment Configuration](./environment.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)
- [Security Best Practices](../security.md)
