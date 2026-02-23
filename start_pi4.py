import paramiko

# ==========================================
# ⚙️ Raspberry Pi Connection Settings
# ==========================================
PI_IP = "100.70.123.128"
PI_USERNAME = "pi4"          # Change to your Pi username
PI_PASSWORD = "pi41234"      # Change to your Pi password

# ✅ แยก Path โฟลเดอร์ กับ ชื่อไฟล์ ออกจากกัน
FOLDER_PATH = "/home/pi4/Desktop/main" 
FILE_NAME = "test.py"

def run_remote_script():
    try:
        print(f"Connecting via SSH to {PI_IP}...")
        
        # 1. Create SSH Client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 2. Connect to the Pi (✅ เพิ่ม look_for_keys=False กันอาการหน่วง/ค้าง)
        ssh.connect(PI_IP, username=PI_USERNAME, password=PI_PASSWORD, timeout=5, look_for_keys=False, allow_agent=False)
        print("Connection successful! Executing script in background...")

        # 3. Command to execute 
        # ✅ ใช้ cd เข้าโฟลเดอร์ก่อน
        # ✅ ใช้ nohup และ & เพื่อให้รันพื้นหลัง (ไม่ดับตอนปิด SSH)
        # ✅ เก็บ Log ไว้เช็ค Error ที่ไฟล์ controller_log.txt
        command = f"cd {FOLDER_PATH} && nohup python3 {FILE_NAME} > /home/pi4/controller_log.txt 2>&1 &"
        
        # 4. Execute the command
        ssh.exec_command(command)
        
        print(f"\n✅ Successfully sent launch command to {PI_IP}")
        print("Script is now running in the background.")

        # 5. Close the connection
        ssh.close()
        print("Connection closed successfully.")

    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    run_remote_script()