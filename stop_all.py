import paramiko
import threading
import time
import json
import paho.mqtt.client as mqtt

# ==========================================
# ⚙️ ตั้งค่า (ให้ตรงกับ start_all_custom.py)
# ==========================================
NODES = [
    { "ip": "100.107.98.48", "username": "pi5",        "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.92.87.106", "username": "pi5node2", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.80.8.105", "username": "pi5node3", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.112.182.89", "username": "pi5node4", "password": "pi51234", "script_path": "~/Desktop/main/main.py" }
]

MQTT_BROKER = "100.70.123.128" # IP เครื่อง Center/Gateway ของอาจารย์

def stop_node(node):
    ip = node["ip"]
    user = node["username"]
    pwd = node["password"]
    
    try:
        print(f"🛑 SSH: Sending stop command to {ip}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pwd, timeout=5)
        
        # pkill -f main.py เพื่อปิด process ของกล้อง
        command = "pkill -f main.py"
        client.exec_command(command)
        
        print(f"✅ SSH: Stopped {ip}")
        client.close()
    except Exception as e:
        print(f"❌ SSH Error {ip}: {e}")

if __name__ == "__main__":
    # --- 1. แจ้งเตือน Gateway ให้หยุดตรวจ Offline ---
    print("📡 Sending STOP_SIMULATION signal to Gateway...")
    try:
        # ใช้ CallbackAPIVersion.VERSION2 ตามมาตรฐานใหม่
        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        mqtt_client.connect(MQTT_BROKER, 1883, 60)
        
        # เริ่ม Loop ชั่วคราวเพื่อให้ Library จัดการการส่งข้อความพื้นหลัง
        mqtt_client.loop_start()
        
        stop_payload = json.dumps({"command": "STOP_SIMULATION"})
        mqtt_client.publish("traffic/command", stop_payload, qos=1) # QoS 1 เพื่อความชัวร์
        
        # 🚨 [KEY FIX] ต้องรอสักครู่ให้ข้อความวิ่งออกไปจริงๆ ก่อนปิดการเชื่อมต่อ
        time.sleep(1.5) 
        
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("✅ Gateway offline-checking disabled successfully!")
    except Exception as e:
        print(f"⚠️ MQTT Warning: Could not signal Gateway ({e})")

    # --- 2. สั่งปิดเครื่องลูก (Nodes) ผ่าน SSH ---
    threads = []
    print("\n--- Stopping All Nodes via SSH ---")
    for node in NODES:
        t = threading.Thread(target=stop_node, args=(node,))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
        
    print("\n--- All Nodes Processed | Monitoring Disabled ---")