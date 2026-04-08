FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests first (cache layer)
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all workspace deps
RUN npm install

# Copy the rest of the source
COPY . .

# Build the client
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
