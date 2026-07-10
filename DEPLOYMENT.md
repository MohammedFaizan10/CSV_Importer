# Deployment Guide - GrowEasy CSV Importer

This guide covers multiple deployment options for your AI-powered CSV importer.

## 🚀 Quick Deployment Options

| Platform | Best For | Difficulty | Cost |
|----------|----------|------------|------|
| **Docker (VPS)** | Full control, any cloud | Medium | $5-20/mo |
| **Vercel + Railway** | Fastest deployment | Easy | Free tier available |
| **Render** | Simple all-in-one | Easy | Free tier available |
| **AWS/Azure/GCP** | Enterprise | Hard | Variable |

---

## Option 1: Docker Deployment (Recommended) 🐳

Deploy to any VPS (DigitalOcean, Linode, AWS EC2, Azure VM, etc.)

### Prerequisites
- A server with Docker and Docker Compose installed
- Your NVIDIA API key
- A domain name (optional, but recommended)

### Step 1: Prepare Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Create project directory
mkdir groweasy-csv-importer
cd groweasy-csv-importer
```

### Step 2: Upload Project Files

```bash
# From your local machine, upload the project
scp -r C:\Users\mfaiz\Downloads\groweasy-csv-importer/* user@your-server-ip:/home/user/groweasy-csv-importer/
```

Or use Git:
```bash
# On server
git clone <your-repo-url>
cd groweasy-csv-importer
```

### Step 3: Configure Environment Variables

```bash
# Create .env file for docker-compose
nano .env
```

Add this content:
```env
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=openai/gpt-oss-120b
```

### Step 4: Update docker-compose for Production

For production with a domain, update `docker-compose.yml`:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
    ports:
      - "4000:4000"
    environment:
      - NVIDIA_API_KEY=${NVIDIA_API_KEY}
      - NVIDIA_MODEL=${NVIDIA_MODEL:-openai/gpt-oss-120b}
      - PORT=4000
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      # IMPORTANT: Change this to your actual backend URL
      - NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
    depends_on:
      - backend
    restart: unless-stopped
```

### Step 5: Deploy

```bash
# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

Your app is now running:
- Frontend: http://your-server-ip:3000
- Backend: http://your-server-ip:4000

### Step 6: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/groweasy
```

Add this configuration:
```nginx
# Frontend (main domain)
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (subdomain)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Important for file uploads
        client_max_body_size 10M;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/groweasy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

Done! Your app is now accessible at:
- https://yourdomain.com (frontend)
- https://api.yourdomain.com (backend)

---

## Option 2: Vercel (Frontend) + Railway (Backend) ⚡

This is the fastest deployment with minimal configuration.

### Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app/)** and sign up
2. **Create New Project** → Deploy from GitHub repo
3. **Select your repository** or upload the `backend` folder
4. **Add Environment Variables**:
   ```
   NVIDIA_API_KEY=nvapi-your-key-here
   NVIDIA_MODEL=openai/gpt-oss-120b
   PORT=4000
   ```
5. **Deploy** - Railway will automatically detect it's a Node.js app
6. **Copy your Railway URL** (e.g., `https://your-app.railway.app`)

### Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com/)** and sign up
2. **Import Git Repository** or drag the `frontend` folder
3. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `frontend`
4. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
   ```
5. **Deploy** - Vercel will build and deploy automatically
6. **Your app is live!** at `https://your-project.vercel.app`

**Pros**: 
- ✅ Free tier available
- ✅ Auto-scaling
- ✅ Zero DevOps
- ✅ Global CDN

**Cons**:
- ❌ Railway free tier has limited hours
- ❌ Less control

---

## Option 3: Render (All-in-One) 🎨

Deploy both frontend and backend on Render.

### Deploy Backend

1. Go to [Render.com](https://render.com/) and sign up
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Name: `groweasy-backend`
   - Runtime: `Node`
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && node dist/index.js`
4. **Environment Variables**:
   ```
   NVIDIA_API_KEY=nvapi-your-key-here
   NVIDIA_MODEL=openai/gpt-oss-120b
   PORT=4000
   ```
5. **Create Web Service**
6. **Copy URL** (e.g., `https://groweasy-backend.onrender.com`)

### Deploy Frontend

1. **New Static Site** on Render
2. **Configure**:
   - Name: `groweasy-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/.next`
3. **Environment Variable**:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://groweasy-backend.onrender.com
   ```
4. **Create Static Site**

**Note**: Render free tier may spin down after inactivity (cold starts).

---

## Option 4: AWS/Azure/GCP (Enterprise) ☁️

For production-grade deployments with auto-scaling, monitoring, and high availability.

### AWS Option: ECS + RDS

1. **Push Docker images to ECR**
2. **Create ECS Cluster** with Fargate
3. **Deploy containers** from ECR
4. **Setup Application Load Balancer**
5. **Configure Route 53** for DNS
6. **Add CloudWatch** for monitoring

### Azure Option: Container Instances

1. **Push images to Azure Container Registry**
2. **Create Container Instances**
3. **Setup Application Gateway**
4. **Configure DNS in Azure DNS**

### GCP Option: Cloud Run

1. **Build containers with Cloud Build**
2. **Deploy to Cloud Run** (serverless containers)
3. **Setup Cloud Load Balancing**
4. **Configure Cloud DNS**

---

## 🔒 Security Checklist

Before going live:

- [ ] Never commit `.env` files with real API keys
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Set up firewall rules (only allow 80, 443, 22)
- [ ] Use strong passwords for SSH
- [ ] Enable fail2ban for SSH protection
- [ ] Set up automated backups (if using a database)
- [ ] Monitor API usage and costs
- [ ] Set up rate limiting on the backend
- [ ] Add CORS restrictions in production
- [ ] Use a CDN for static assets (optional)

---

## 📊 Monitoring & Maintenance

### Check Application Health

```bash
# Docker logs
docker-compose logs -f

# Check if containers are running
docker-compose ps

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Update and redeploy
git pull
docker-compose up -d --build
```

### Monitor Resource Usage

```bash
# CPU and memory usage
docker stats

# Disk usage
df -h
du -sh /var/lib/docker
```

### Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 💰 Cost Estimates

| Platform | Tier | Monthly Cost | Notes |
|----------|------|--------------|-------|
| **DigitalOcean Droplet** | Basic (1 vCPU, 2GB RAM) | $12 | Flat rate |
| **Railway** | Free | $0 (500 hours) | Hobby plan $5/mo |
| **Vercel** | Free | $0 | Hobby, pro starts at $20 |
| **Render** | Free | $0 | Spins down on inactivity |
| **AWS EC2 t3.small** | On-demand | ~$15 | Plus data transfer |
| **NVIDIA API** | Usage | Variable | Based on tokens used |

**Recommended for Production**: DigitalOcean/Linode VPS ($12-20/mo) with Docker = Predictable costs + full control.

---

## 🆘 Troubleshooting

### Frontend can't reach backend

**Issue**: "Could not reach the server"

**Solutions**:
1. Check `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Verify backend is running: `curl http://localhost:4000/api/import`
3. Check CORS settings in backend
4. Ensure firewall allows traffic on port 4000

### Docker containers won't start

**Issue**: Container exits immediately

**Solutions**:
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose up --build

# Check disk space
df -h
```

### NVIDIA API errors

**Issue**: 404 or 429 errors from NVIDIA

**Solutions**:
1. Verify API key is correct in `.env`
2. Check model name: `openai/gpt-oss-120b`
3. Check rate limits on NVIDIA dashboard
4. Verify batch size in `backend/src/constants/config.ts` (currently 10)

### File upload fails

**Issue**: "File too large" or upload hangs

**Solutions**:
1. Check Nginx `client_max_body_size 10M;`
2. Verify backend `MAX_FILE_SIZE_BYTES` limit
3. Check Docker memory limits

---

## 📞 Support

If you run into issues:
1. Check the logs first: `docker-compose logs -f`
2. Review this guide's troubleshooting section
3. Check NVIDIA API status: [build.nvidia.com](https://build.nvidia.com/)

---

## ✅ Deployment Checklist

Use this checklist for your deployment:

- [ ] Choose deployment platform
- [ ] Set up server/account
- [ ] Configure environment variables
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` for production
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Set up domain (optional)
- [ ] Configure SSL/HTTPS
- [ ] Test with sample CSV files
- [ ] Set up monitoring
- [ ] Review security checklist
- [ ] Document your deployment

**Good luck with your deployment!** 🚀
