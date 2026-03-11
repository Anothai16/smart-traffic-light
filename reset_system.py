import paho.mqtt.client as mqtt
import json

# ==========================================
# ⚙️ Settings
# ==========================================
MQTT_BROKER = "100.70.123.128" # IP ของ Tailscale เครื่องที่รัน MQTT

def send_reset_signal():
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.connect(MQTT_BROKER, 1883, 60)
        
        # ส่งคำสั่ง RESET ไปที่ Topic หลัก
        payload = json.dumps({"command": "RESET_SYSTEM"})
        client.publish("traffic/command", payload)
        
        client.disconnect()
        print("✅ Successfully sent RESET_SYSTEM command.")
    except Exception as e:
        print(f"❌ Error sending reset command: {e}")

if __name__ == "__main__":
    send_reset_signal()