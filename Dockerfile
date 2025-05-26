FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Install Vite globally for WebGPU dev server (or you can use parcel, http-server, etc.)
RUN npm install -g vite

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose dev server port
EXPOSE 5173

# Start dev server
CMD ["vite"]
