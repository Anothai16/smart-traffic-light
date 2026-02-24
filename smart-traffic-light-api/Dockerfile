# ใช้ Official Bun Image
FROM oven/bun:1

WORKDIR /app

# ✅ 1. เพิ่มส่วนนี้เข้าไป: ติดตั้ง Python3, pip และไลบรารี paramiko, paho-mqtt
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages paramiko paho-mqtt

# Copy ไฟล์ package.json และ bun.lockb (ถ้ามี)
COPY package.json bun.lockb* ./

# ลง dependencies
RUN bun install

# Copy โค้ดทั้งหมดเข้า container
COPY . .

# Expose port (Elysia default มักจะเป็น 3000)
EXPOSE 3000

# รันคำสั่ง start ตามที่เขียนใน package.json
CMD ["bun", "run", "start"]