import paramiko
import threading

# ก๊อปปี้ NODES จากไฟล์ start_all_custom.py มาใส่ที่นี่ด้วย
NODES = [
    { "ip": "192.168.1.202", "username": "pi5", "password": "pi51234" },
    { "ip": "192.168.1.203", "username": "pi5node2", "password": "pi51234" },
    { "ip": "192.168.1.204", "username": "pi5node3", "password": "pi51234" },
    { "ip": "192.168.1.205", "username": "pi5node4", "password": "pi51234" }
]

def stop_node(node):
    ip = node["ip"]
    user = node["username"]
    pwd = node["password"]
    
    try:
        print(f"🛑 Stopping {ip}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pwd, timeout=5)
        
        # คำสั่ง Kill Python (ระวังถ้ามี python อื่นรันอยู่จะโดนปิดไปด้วย)
        # pkill -f main.py = ปิด process ที่มีชื่อว่า main.py
        command = "pkill -f main.py"
        
        client.exec_command(command)
        print(f"✅ Stopped {ip}")
        client.close()
    except Exception as e:
        print(f"❌ Error {ip}: {e}")

if __name__ == "__main__":
    threads = []
    print("--- Stopping All Nodes ---")
    for node in NODES:
        t = threading.Thread(target=stop_node, args=(node,))
        t.start()
        threads.append(t)
    for t in threads:
        t.join()
    print("--- All Stopped ---")