FROM node:20-bookworm-slim

WORKDIR /app

# Install Python3, pip, and system libraries required for machine learning (like libgomp1 for LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Setup python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run Express server
CMD ["node", "server.js"]
