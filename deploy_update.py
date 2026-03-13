"""
Quick deploy: Upload only .next/ directory (server + static) to production.
For use after code changes that don't affect node_modules.
"""

import ftplib
import os
import sys
import time

FTP_HOST = "192.185.7.4"
FTP_USER = "benjaise"
FTP_PASS = "Gx$~vxyU7yT37xuq"
REMOTE_DIR = "/httpdocs"
LOCAL_DIR = os.path.join(
    os.path.dirname(__file__),
    ".next", "standalone", "BenjaminChaise", "bca-platform"
)

# Only upload .next directory
LOCAL_NEXT = os.path.join(LOCAL_DIR, ".next")
REMOTE_NEXT = f"{REMOTE_DIR}/.next"

SKIP_PATTERNS = ["__pycache__"]


def ftp_connect():
    ftp = ftplib.FTP(FTP_HOST, timeout=60)
    ftp.login(FTP_USER, FTP_PASS)
    return ftp


def ftp_rmtree(ftp, path):
    try:
        names = ftp.nlst(path)
    except ftplib.error_perm:
        return
    for name in names:
        basename = name.split("/")[-1]
        if basename in (".", ".."):
            continue
        full = f"{path}/{basename}" if not name.startswith("/") else name
        try:
            ftp.delete(full)
        except ftplib.error_perm:
            ftp_rmtree(ftp, full)
            try:
                ftp.rmd(full)
            except:
                pass


def ensure_remote_dir(ftp, remote_path):
    dirs = remote_path.replace("\\", "/").split("/")
    current = ""
    for d in dirs:
        if not d:
            continue
        current += "/" + d
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
            except:
                pass


def upload_directory(ftp, local_path, remote_path, stats):
    ensure_remote_dir(ftp, remote_path)
    for item in sorted(os.listdir(local_path)):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"

        if any(p in item for p in SKIP_PATTERNS):
            continue

        if os.path.isdir(local_item):
            upload_directory(ftp, local_item, remote_item, stats)
        else:
            size = os.path.getsize(local_item)
            stats["current"] += 1
            pct = (stats["current"] / stats["total"]) * 100
            print(f"  [{stats['current']}/{stats['total']}] ({pct:.0f}%) {remote_item} ({size // 1024}KB)")
            try:
                with open(local_item, "rb") as f:
                    ftp.storbinary(f"STOR {remote_item}", f)
                stats["uploaded"] += size
            except Exception as e:
                print(f"    ERROR: {e}")
                stats["errors"] += 1
                try:
                    ftp.pwd()
                except:
                    print("    Reconnecting...")
                    ftp2 = ftp_connect()
                    ftp.__dict__.update(ftp2.__dict__)
                    try:
                        with open(local_item, "rb") as f:
                            ftp.storbinary(f"STOR {remote_item}", f)
                        stats["uploaded"] += size
                        stats["errors"] -= 1
                    except Exception as e2:
                        print(f"    RETRY FAILED: {e2}")


def count_files(path):
    total = 0
    for root, dirs, files in os.walk(path):
        total += len([f for f in files if not any(p in f for p in SKIP_PATTERNS)])
    return total


def main():
    if not os.path.isdir(LOCAL_NEXT):
        print(f"ERROR: .next directory not found: {LOCAL_NEXT}")
        sys.exit(1)

    # Copy static files into standalone build (Next.js doesn't include them automatically)
    import shutil
    static_src = os.path.join(os.path.dirname(__file__), ".next", "static")
    static_dst = os.path.join(LOCAL_NEXT, "static")
    if os.path.isdir(static_src):
        if os.path.isdir(static_dst):
            shutil.rmtree(static_dst)
        shutil.copytree(static_src, static_dst)
        print(f"Copied static assets into standalone build.")

    total_files = count_files(LOCAL_NEXT)
    print(f"Files to upload: {total_files}")

    print("Connecting to FTP...")
    ftp = ftp_connect()
    print(f"Connected.")

    # Sync Prisma client (schema may have changed)
    print("\nSyncing Prisma client...")
    import glob
    prisma_pattern = os.path.join(
        os.path.dirname(__file__), "node_modules", ".pnpm",
        "@prisma+client@*", "node_modules", ".prisma", "client"
    )
    prisma_dirs = glob.glob(prisma_pattern)
    if prisma_dirs:
        prisma_src = prisma_dirs[0]
        remote_prisma = f"{REMOTE_DIR}/node_modules/.prisma/client"
        for fname in os.listdir(prisma_src):
            fpath = os.path.join(prisma_src, fname)
            if os.path.isfile(fpath) and (fname.endswith('.js') or fname.endswith('.json') or fname.endswith('.prisma') or fname.endswith('.mjs')):
                with open(fpath, "rb") as f:
                    ftp.storbinary(f"STOR {remote_prisma}/{fname}", f)
        print("Prisma client synced.")
    else:
        print("WARNING: Prisma client not found locally, skipping sync.")

    # Upload public directory (videos, images, etc.)
    public_dir = os.path.join(os.path.dirname(__file__), "public")
    if os.path.isdir(public_dir):
        print("\nUploading public/ assets...")
        public_stats = {"current": 0, "total": count_files(public_dir), "uploaded": 0, "errors": 0}
        upload_directory(ftp, public_dir, REMOTE_DIR, public_stats)
        print(f"Public assets uploaded ({public_stats['current']} files).")

    # Skip cleaning — just overwrite files in-place to avoid locked file errors

    print("\nUploading .next/...")
    start = time.time()
    stats = {"current": 0, "total": total_files, "uploaded": 0, "errors": 0}
    upload_directory(ftp, LOCAL_NEXT, REMOTE_NEXT, stats)

    # Upload production .env with latest credentials
    print("\nUploading production .env...")
    env_content = """# Database (localhost since same server)
DATABASE_URL="sqlserver://127.0.0.1:1433;database=benjaise_BCA;user=benjaise_sqluser;password=Aragon21!;trustServerCertificate=true"

# Auth
AUTH_SECRET="k8Xm2pQ7vR4wT9nL6jF3hY0bA5dG1cE8"
AUTH_TRUST_HOST=true
AUTH_URL="https://yourdebtcollectors.com"

# SendGrid
SENDGRID_API_KEY="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"

# SMS Gateway (Android)
SMS_API_URL="https://api.sms-gate.app/3rdparty/v1"
SMS_USERNAME="QNDGHH"
SMS_PASSWORD="rjnk6f-yilcym5"

# App
NEXT_PUBLIC_APP_NAME="PulseBC"
NODE_ENV=production
"""
    from io import BytesIO as _BytesIO
    ftp.storbinary(f"STOR {REMOTE_DIR}/.env", _BytesIO(env_content.encode("utf-8")))
    print("Production .env uploaded.")

    # Upload web.config
    web_config_path = os.path.join(os.path.dirname(__file__), "web.config")
    if os.path.exists(web_config_path):
        with open(web_config_path, "rb") as f:
            ftp.storbinary(f"STOR {REMOTE_DIR}/web.config", f)
        print("web.config uploaded.")

    # Generate iisnode-compatible server.js from the standalone build
    print("\nGenerating iisnode-compatible server.js...")
    server_js_path = os.path.join(LOCAL_DIR, "server.js")
    if os.path.exists(server_js_path):
        import re
        with open(server_js_path, "r") as f:
            content = f.read()
        match = re.search(r'const nextConfig = ({.*?})\n', content, re.DOTALL)
        if match:
            next_config_json = match.group(1)
            iis_server = (
                "const path = require('path')\n"
                "const { createServer } = require('http')\n"
                "\n"
                "const dir = path.join(__dirname)\n"
                "process.env.NODE_ENV = 'production'\n"
                "process.chdir(__dirname)\n"
                "\n"
                "const nextConfig = " + next_config_json + "\n"
                "\n"
                "process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)\n"
                "\n"
                "const next = require('next')\n"
                "const app = next({ dev: false, dir, conf: nextConfig })\n"
                "const handle = app.getRequestHandler()\n"
                "\n"
                "app.prepare().then(() => {\n"
                "  const server = createServer((req, res) => {\n"
                "    handle(req, res)\n"
                "  })\n"
                "  const port = process.env.PORT || 3000\n"
                "  server.listen(port, () => {\n"
                "    console.log('> Ready on', port)\n"
                "  })\n"
                "})\n"
            )
            from io import BytesIO
            ftp.storbinary("STOR " + REMOTE_DIR + "/server.js", BytesIO(iis_server.encode("utf-8")))
            print("Uploaded iisnode-compatible server.js")
        else:
            print("WARNING: Could not extract nextConfig, uploading original server.js")
            with open(server_js_path, "rb") as f:
                ftp.storbinary(f"STOR {REMOTE_DIR}/server.js", f)

    elapsed = time.time() - start
    mb = stats["uploaded"] / (1024 * 1024)
    print(f"\nDone! {stats['current']} files, {mb:.1f} MB, {elapsed:.0f}s, {stats['errors']} errors")
    print("Visit https://yourdebtcollectors.com")

    ftp.quit()


if __name__ == "__main__":
    main()
