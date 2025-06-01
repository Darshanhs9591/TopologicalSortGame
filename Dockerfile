FROM node:14-alpine3.12
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port your app listens on
EXPOSE 4000

# Run the app
CMD ["node", "TopologicalSorting.js"]
