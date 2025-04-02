FROM node:18-alpine 

WORKDIR /app
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port 5173 (Vite's default port)
EXPOSE 5173

# Start server
CMD ["npm", "run", "dev"]