# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (Vite default is 5173)
EXPOSE 5173

# รันคำสั่ง start พร้อม flag --host เพื่อให้เข้าถึงได้จากนอก container
CMD ["npm", "run", "start", "--", "--host"]