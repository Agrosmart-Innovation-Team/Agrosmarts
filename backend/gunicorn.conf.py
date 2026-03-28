import multiprocessing
import os

# Network binding
bind = os.getenv('GUNICORN_BIND', '0.0.0.0:8000')

# Keep defaults conservative for small/free instances to avoid OOM restarts.
default_workers = min(2, multiprocessing.cpu_count() or 1)
workers = int(os.getenv('GUNICORN_WORKERS', str(default_workers)))

# Threads per worker (good for I/O-bound Django views)
threads = int(os.getenv('GUNICORN_THREADS', '2'))

# Worker class: 'sync' is safe for SQLite dev, use 'gthread' when scaling on PostgreSQL
worker_class = os.getenv('GUNICORN_WORKER_CLASS', 'gthread')

# Max concurrent connections per worker
worker_connections = int(os.getenv('GUNICORN_WORKER_CONNECTIONS', '1000'))

# Kill workers that exceed request timeout seconds
timeout = int(os.getenv('GUNICORN_TIMEOUT', '120'))

# Keep-alive connections from load balancer
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', '5'))

# Recycle workers after N requests to prevent memory leaks
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', '1000'))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', '100'))

# Load app before forking workers (shares memory, faster startup)
preload_app = True

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'
