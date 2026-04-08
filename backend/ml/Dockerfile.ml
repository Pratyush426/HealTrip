FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the specific service provided via build arg
ARG SERVICE_PATH
COPY ${SERVICE_PATH}/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY ${SERVICE_PATH}/ .

# Default port - will be overridden by docker-compose
EXPOSE 8000

CMD ["python", "main.py"]
