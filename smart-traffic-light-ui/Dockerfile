# smart-traffic-light-ui/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# --- แก้ตรงนี้ครับ ---
# เปลี่ยนจาก RUN npm install เป็น:
RUN npm install --legacy-peer-deps
# ------------------

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# รันคำสั่ง start
CMD ["npm", "run", "start", "--", "--host"]