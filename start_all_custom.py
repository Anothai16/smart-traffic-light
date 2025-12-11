import paramiko
import threading
import time

# ==========================================
# ⚙️ ตั้งค่าเครื่องลูกข่าย
# ==========================================
NODES = [
    { "ip": "192.168.1.202", "username": "pi5",      "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "192.168.1.203", "username": "pi5node2", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "192.168.1.204", "username": "pi5node3", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "192.168.1.205", "username": "pi5node4", "password": "pi51234", "script_path": "~/Desktop/main/main.py" }
]

def run_command_on_node(node_config):
    ip = node_config["ip"]
    user = node_config["username"]
    pwd = node_config["password"]
    full_path = node_config["script_path"]
    
    # แยกชื่อโฟลเดอร์ กับ ชื่อไฟล์
    # ตัวอย่าง: "~/Desktop/main/main.py" -> folder="~/Desktop/main", file="main.py"
    folder_path = full_path.rsplit('/', 1)[0]
    file_name = full_path.rsplit('/', 1)[1]

    try:
        print(f"🚀 Connecting to {user}@{ip}...")
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pwd, timeout=5)
        
        # 🟢 สิ่งที่แก้ไข:
        # 1. เพิ่ม "cd {folder_path} &&" เพื่อเข้าไปในโฟลเดอร์งานก่อน
        # 2. สั่งรันชื่อไฟล์เฉยๆ เพราะเราเข้าไปในโฟลเดอร์แล้ว
        
        command = f"cd {folder_path} && export DISPLAY=:0 && export XAUTHORITY=/home/{user}/.Xauthority && nohup /usr/bin/python3 {file_name} > /home/{user}/traffic.log 2>&1 &"
        
        client.exec_command(command)
        
        print(f"✅ Sent start command to {ip} (Running inside {folder_path})")
        client.close()
        
    except Exception as e:
        print(f"❌ Error on {ip}: {e}")

# ==========================================
# Main Execution
# ==========================================
if __name__ == "__main__":
    threads = []
    print("--- Starting Traffic System with GUI (Fixed Path) ---")
    
    for node in NODES:
        t = threading.Thread(target=run_command_on_node, args=(node,))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
        
    print("--- All commands sent! ---")