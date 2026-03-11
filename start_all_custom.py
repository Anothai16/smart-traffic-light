import paramiko
import threading
import time
import json
import paho.mqtt.client as mqtt

# ==========================================
# ⚙️ ตั้งค่า
# ==========================================
# รายชื่อเครื่องลูกข่าย (ต้องรู้ว่า IP ไหนคือ Lane ไหน เพื่อรอเช็คชื่อ)
NODES = [
    { "ip": "100.107.98.48", "username": "pi5",        "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.92.87.106", "username": "pi5node2", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.80.8.105", "username": "pi5node3", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
    { "ip": "100.112.182.89", "username": "pi5node4", "password": "pi51234", "script_path": "~/Desktop/main/main.py" }
]
# NODES = [
#     { "ip": "192.168.1.202", "username": "pi5",        "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
#     { "ip": "192.168.1.203", "username": "pi5node2", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
#     { "ip": "192.168.1.204", "username": "pi5node3", "password": "pi51234", "script_path": "~/Desktop/main/main.py" },
#     { "ip": "192.168.1.205", "username": "pi5node4", "password": "pi51234", "script_path": "~/Desktop/main/main.py" }
# ]

MQTT_BROKER = "100.70.123.128" # IP เครื่อง Center เอง
EXPECTED_NODES_COUNT = 4      # จำนวนเครื่องที่ต้องรอ

ready_nodes = set()
all_nodes_ready = threading.Event()

# ==========================================
# MQTT Listener (รอฟังเสียงตอบรับ)
# ==========================================
def on_connect(client, userdata, flags, rc, properties=None):
    print("📡 Connected to MQTT Broker. Listening for READY signals...")
    client.subscribe("traffic/status/system")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        lane_id = payload.get("lane_id")
        status = payload.get("status")

        if status == "READY" and lane_id:
            if lane_id not in ready_nodes:
                ready_nodes.add(lane_id)
                print(f"✅ Node {lane_id} is READY! ({len(ready_nodes)}/{EXPECTED_NODES_COUNT})")
            
            if len(ready_nodes) >= EXPECTED_NODES_COUNT:
                all_nodes_ready.set() # ปลดล็อก Event
    except Exception as e:
        print(f"Error parsing message: {e}")

# ==========================================
# SSH Runner
# ==========================================
def run_command_on_node(node_config):
    ip = node_config["ip"]
    user = node_config["username"]
    pwd = node_config["password"]
    full_path = node_config["script_path"]
    folder_path = full_path.rsplit('/', 1)[0]
    file_name = full_path.rsplit('/', 1)[1]

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pwd, timeout=5)
        
        # ฆ่า process เก่าก่อนกันเหนียว แล้วค่อยรันใหม่
        kill_cmd = f"pkill -f {file_name}"
        try: client.exec_command(kill_cmd) 
        except: pass
        
        # สั่งรัน
        command = f"cd {folder_path} && export DISPLAY=:0 && export XAUTHORITY=/home/{user}/.Xauthority && nohup /usr/bin/python3 {file_name} > /home/{user}/traffic.log 2>&1 &"
        client.exec_command(command)
        print(f"🚀 Launch command sent to {ip}")
        client.close()
    except Exception as e:
        print(f"❌ Error on {ip}: {e}")

# ==========================================
# Main Execution
# ==========================================
if __name__ == "__main__":
    # 1. Setup MQTT Listener
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.connect(MQTT_BROKER, 1883, 60)
    mqtt_client.loop_start()

    # 2. Launch Nodes via SSH
    print("\n--- 1. Launching Nodes via SSH ---")
    threads = []
    for node in NODES:
        t = threading.Thread(target=run_command_on_node, args=(node,))
        t.start()
        threads.append(t)
    for t in threads: t.join()
        
    print("\n--- 2. Waiting for ALL nodes to be READY ---")
    # รอจนกว่าจะครบ หรือ Timeout 60 วินาที
    is_ready = all_nodes_ready.wait(timeout=60)

    if is_ready:
        print("\n🟢 ALL SYSTEMS GO! Sending START signal in 3... 2... 1...")
        time.sleep(1)
        
        # 3. Send Global START Signal
        start_payload = json.dumps({"command": "START_SIMULATION"})
        mqtt_client.publish("traffic/command", start_payload)
        print("🚀 START SIGNAL SENT!")
    else:
        print(f"\n❌ TIMEOUT! Only {len(ready_nodes)} nodes reported ready.")
        print("Nodes ready:", ready_nodes)

    time.sleep(2)
    mqtt_client.loop_stop()
    mqtt_client.disconnect()