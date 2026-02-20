import paramiko

# ==========================================
# ⚙️ Raspberry Pi Connection Settings
# ==========================================
PI_IP = "100.70.123.128"
PI_USERNAME = "pi4"          # Change to your Pi username
PI_PASSWORD = "pi41234"      # Change to your Pi password
SCRIPT_NAME = "test.py"      # Just the name of the script you want to kill

def stop_remote_script():
    try:
        print(f"Connecting via SSH to {PI_IP} to stop {SCRIPT_NAME}...")
        
        # 1. Create SSH Client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 2. Connect to the Pi
        ssh.connect(PI_IP, username=PI_USERNAME, password=PI_PASSWORD, timeout=5)
        print("Connection successful! Stopping script...")

        # 3. Command to execute (pkill -f kills processes matching the name)
        command = f"pkill -f {SCRIPT_NAME}"
        
        # 4. Execute the command
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Read the error output (if any)
        error = stderr.read().decode('utf-8')

        # pkill doesn't output anything on success, so we just check for errors
        if error:
            print(f"\n❌ Error encountered (maybe it wasn't running?):\n{error}")
        else:
            print(f"\n✅ Successfully sent stop command for {SCRIPT_NAME}.")

        # 5. Close the connection
        ssh.close()
        print("Connection closed successfully.")

    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    stop_remote_script()