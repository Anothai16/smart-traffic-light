import paramiko
import threading
import time
import json
import paho.mqtt.client as mqtt

# ==========================================
# ⚙️ ตั้งค่า
# ==========================================
NODES = [
    # { "ip": "192.168.1.202", "username": "pi5",        "password": "pi51234", "script_path": "~/Desktop/main/2lanesample.py" },
    { "ip": "192.168.1.203", "username": "pi5node2", "password": "pi51234", "script_path": "~/Desktop/main/2lanesample.py", "lane_id": "Lane_2" },
    # { "ip": "192.168.1.204", "username": "pi5node3", "password": "pi51234", "script_path": "~/Desktop/main/2lanesample.py" },
    { "ip": "192.168.1.205", "username": "pi5node4", "password": "pi51234", "script_path": "~/Desktop/main/2lanesample.py", "lane_id": "Lane_4" }
]

MQTT_BROKER = "100.70.123.128" # IP เครื่อง Center
EXPECTED_NODES_COUNT = len(NODES)  # นับจำนวนออโต้

ready_nodes = set()
all_nodes_ready = threading.Event()

# ==========================================
# MQTT Listener
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
                all_nodes_ready.set() 
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
        
        kill_cmd = f"pkill -f {file_name}"
        try: client.exec_command(kill_cmd) 
        except: pass
        
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
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.connect(MQTT_BROKER, 1883, 60)
    mqtt_client.loop_start()

    print("\n--- 1. Launching Nodes via SSH ---")
    threads = []
    for node in NODES:
        t = threading.Thread(target=run_command_on_node, args=(node,))
        t.start()
        threads.append(t)
    for t in threads: t.join()
        
    print("\n--- 2. Waiting for ALL nodes to be READY ---")
    is_ready = all_nodes_ready.wait(timeout=60)

    if is_ready:
        print("\n🟢 ALL SYSTEMS GO! Sending START signal in 3... 2... 1...")
        time.sleep(1)
        
        # 🟢 [LOGIC UPDATE] เปลี่ยนวิธีตะโกนเป็นการ "กระซิบ" ทีละคน
        # แทนที่จะตะโกน "traffic/command" กลางวง ให้ชี้เป้าส่ง ID ไปด้วย
        for node in NODES:
            lane_id = node.get("lane_id")
            if lane_id:
                # ส่งคำสั่งพร้อมระบุ Target Lane
                start_payload = json.dumps({"command": "START_SIMULATION", "target_lane": lane_id})
                mqtt_client.publish("traffic/command", start_payload)
                print(f"🚀 START SIGNAL SENT to {lane_id}!")
    else:
        print(f"\n❌ TIMEOUT! Only {len(ready_nodes)} nodes reported ready.")
        print("Nodes ready:", ready_nodes)

    time.sleep(2)
    mqtt_client.loop_stop()
    mqtt_client.disconnect()