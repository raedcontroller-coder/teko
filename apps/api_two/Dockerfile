FROM node:22-slim

# Set working directory
WORKDIR /app

# Install Python 3, pip, and system dependencies required for numpy/scipy
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python to avoid EXTERNALLY-MANAGED errors
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Python requirements and install them
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy package.json and install Node dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (TypeScript -> dist + copy Python files)
RUN npm run build

# Expose the API port
EXPOSE 3002

# Set the start command
CMD ["npm", "run", "start"]
