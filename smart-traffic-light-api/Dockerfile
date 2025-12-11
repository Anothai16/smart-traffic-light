# ใช้ Official Bun Image
FROM oven/bun:1

WORKDIR /app

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