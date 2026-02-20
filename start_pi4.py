import paramiko

# ==========================================
# ⚙️ Raspberry Pi Connection Settings
# ==========================================
PI_IP = "100.70.123.128"
PI_USERNAME = "pi4"          # Change to your Pi username
PI_PASSWORD = "pi41234"      # Change to your Pi password
SCRIPT_PATH = "/home/pi4/Desktop/main/test.py" # Actual path to test.py on the Pi

def run_remote_script():
    try:
        print(f"Connecting via SSH to {PI_IP}...")
        
        # 1. Create SSH Client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 2. Connect to the Pi
        ssh.connect(PI_IP, username=PI_USERNAME, password=PI_PASSWORD, timeout=5)
        print("Connection successful! Executing script...")

        # 3. Command to execute (using python3)
        command = f"python3 {SCRIPT_PATH}"
        
        # 4. Execute and fetch the output
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Read the printed output from test.py
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')

        if output:
            print(f"\n✅ Output from Pi:\n{output}")
        if error:
            print(f"\n❌ Error encountered:\n{error}")

        # 5. Close the connection
        ssh.close()
        print("Connection closed successfully.")

    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    run_remote_script()