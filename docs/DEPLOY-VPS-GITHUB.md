# Deploy captable to Ubuntu VPS with GitHub auto-deploy

This guide sets up your Ubuntu VPS so that **every push to `main`** triggers a Docker Compose build and app restart.

## Overview

1. **VPS**: Clone the repo, install Docker, add a deploy user and SSH key.
2. **GitHub**: Add secrets and (optional) environment; the workflow SSHs into the VPS and runs `git pull` + `docker compose build` + `docker compose up -d`.

---

## 1. Prepare the Ubuntu VPS

### 1.1 Install Docker and Docker Compose

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# Log out and back in (or newgrp docker) so docker runs without sudo
```

### 1.2 Clone the repo

Use a path you’ll reference in GitHub secrets (e.g. `/opt/captable`):

```bash
sudo mkdir -p /opt
sudo git clone https://github.com/YOUR_USERNAME/captable.git /opt/captable
sudo chown -R "$USER:$USER" /opt/captable
cd /opt/captable
```

If the repo is **private**, either:

- Use a **deploy key** (read-only SSH key), or  
- Use **HTTPS + Personal Access Token (PAT)**:

  ```bash
  git remote set-url origin https://YOUR_GITHUB_USERNAME:YOUR_PAT@github.com/YOUR_USERNAME/captable.git
  ```

### 1.3 Create `.env` on the VPS

Copy from example and fill in real values (database, auth, SMTP, etc.):

```bash
cp .env.example .env
nano .env   # or vim
```

Set at least:

- `DATABASE_URL` (Postgres on the VPS or external)
- `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` (e.g. `https://your-domain.com`)
- `EMAIL_FROM` and `EMAIL_SERVER`
- `UPLOAD_STORAGE_PATH=/app/uploads` (default; matches Docker volume)

### 1.4 Create a deploy user (recommended)

Running the GitHub Action as a dedicated user is safer than using `root`:

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy   # only if this user must run migrations as root; otherwise omit
sudo mkdir -p /opt/captable
sudo chown -R deploy:deploy /opt/captable
```

Use `deploy` (or this user’s name) as `VPS_USERNAME` in GitHub secrets. Clone/repo path and `.env` should be under a directory this user owns (e.g. `/opt/captable`).

### 1.5 SSH key for GitHub Actions

On your **local machine** (or the VPS), generate a key **only for deploy**:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/captable_deploy -N ""
```

- **Private key** (`~/.ssh/captable_deploy`): you’ll paste this into GitHub secrets as `VPS_SSH_PRIVATE_KEY`.
- **Public key** (`~/.ssh/captable_deploy.pub`): add to the VPS so the Action can log in.

On the **VPS**, as the user you use for deploy (e.g. `deploy`):

```bash
sudo -u deploy bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Paste contents of captable_deploy.pub into ~/.ssh/authorized_keys
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Test from your machine (replace `deploy` and `your-vps-ip`):

```bash
ssh -i ~/.ssh/captable_deploy deploy@your-vps-ip
```

Once in, you should be able to run `cd /opt/captable && docker compose up -d` (after Docker is installed and `.env` is in place).

---

## 2. Configure GitHub

### 2.1 Repository secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name           | Description                          | Example              |
|-----------------------|--------------------------------------|----------------------|
| `VPS_HOST`           | VPS IP or hostname                   | `123.45.67.89`       |
| `VPS_USERNAME`       | SSH user (e.g. `deploy`)            | `deploy`             |
| `VPS_SSH_PRIVATE_KEY`| Full private key (e.g. `captable_deploy`) | Paste entire file including `-----BEGIN ... END ...-----` |

Optional:

| Secret name      | Description              | Default        |
|------------------|--------------------------|----------------|
| `VPS_REPO_PATH`  | Path to repo on VPS      | `/opt/captable` |
| `VPS_BRANCH`     | Branch to deploy         | `main`         |
| `VPS_SSH_PORT`   | SSH port                 | `22`           |

### 2.2 (Optional) Environment “production”

The workflow uses `environment: production`. To add it:

- **Settings → Environments → New environment** → name: `production`.
- You can add protection rules or environment-specific secrets here if you want.

If you remove `environment: production` from the workflow, it still runs; only the “Production” badge in the Actions UI goes away.

---

## 3. What runs on each push to `main`

The workflow [`.github/workflows/deploy-vps.yml`](../.github/workflows/deploy-vps.yml) does the following on the VPS (path and branch from secrets or defaults):

1. `cd` to repo path (e.g. `/opt/captable`).
2. `git fetch` and `git reset --hard origin/main` (or your `VPS_BRANCH`).
3. `docker compose build --no-cache`.
4. `docker compose up -d`.
5. `docker compose exec -T app pnpm db:migrate` (ignores errors if not needed).

So: **push to `main` → GitHub Action runs → VPS pulls, rebuilds, restarts**.

---

## 4. First-time run on the VPS

Before relying on the Action, bring the stack up once and run migrations:

```bash
cd /opt/captable
docker compose up -d
docker compose exec app pnpm db:migrate
```

Check the app (e.g. `http://YOUR_VPS_IP:3000` or your domain). After that, future pushes to `main` will update and restart via GitHub Actions.

---

## 5. Manual deploy

To deploy without pushing (e.g. after changing `.env` on the server):

```bash
cd /opt/captable
./scripts/deploy-vps.sh
# or for another branch:
./scripts/deploy-vps.sh main
```

---

## 6. Troubleshooting

- **Permission denied (publickey)**  
  - Check `VPS_SSH_PRIVATE_KEY` is the full private key and that the matching public key is in `~/.ssh/authorized_keys` for `VPS_USERNAME` on the VPS.  
  - Confirm `VPS_HOST`, `VPS_USERNAME`, and (if not 22) `VPS_SSH_PORT`.

- **fatal: not a git repository**  
  - `VPS_REPO_PATH` must be the directory that contains `.git` (e.g. `/opt/captable`).

- **docker: permission denied**  
  - Ensure `VPS_USERNAME` is in the `docker` group (`groups deploy` shows `docker`).

- **Compose build fails**  
  - SSH in and run `docker compose build --no-cache` and `docker compose up -d` manually to see the same errors.

- **App or DB not starting**  
  - Check `.env` (especially `DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`).  
  - Run `docker compose logs app` and `docker compose logs pg`.

---

## 7. Security notes

- Use a **dedicated deploy user** and key; don’t use root or your personal key.
- Restrict the deploy key to **this repo only** (GitHub: Settings → Deploy keys).
- Keep **secrets** (e.g. `.env`) only on the VPS; never commit them.
- Put the app behind **HTTPS** (e.g. Nginx + Let’s Encrypt) and a firewall (e.g. `ufw`) so only 80/443 (and optionally SSH) are open.
