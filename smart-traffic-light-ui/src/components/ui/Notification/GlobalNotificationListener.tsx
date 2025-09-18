// src/components/ui/Notification/GlobalNotificationListener.tsx
import { useEffect } from 'react';
import toast from '@/components/ui/toast';
import Notification from '@/components/ui/Notification';
import { socket } from '@/services/socket';

// ✅ เพิ่ม username ใน interface
interface SocketData {
    message: string;
    senderId: string;
    username?: string;
}

const GlobalNotificationListener = () => {
    useEffect(() => {
        console.log("GLOBAL_LISTENER: Component mounted. Initializing listeners.");

        const showNotification = (title: string, message: string) => {
            toast.push(
                <Notification title={title} type="info">
                    {message}
                </Notification>
            );
        };

        const handleModeChange = (data: SocketData) => {
            console.log("GLOBAL_LISTENER: Received 'traffic_mode_change' event.");
            console.log("GLOBAL_LISTENER: My socket.id:", socket.id);
            console.log("GLOBAL_LISTENER: Sender's socket.id:", data.senderId);
            
            if (data.senderId !== socket.id) {
                console.log("GLOBAL_LISTENER: Condition 'data.senderId !== socket.id' is TRUE. Showing notification.");
                
                // ✅ ใช้ username ในการแสดงผล
                const displayMessage = data.username ? data.message.replace('by an admin', `by ${data.username}`) : data.message;
                showNotification('Traffic Mode Updated', displayMessage);
            } else {
                console.log("GLOBAL_LISTENER: Condition 'data.senderId !== socket.id' is FALSE. Ignoring for sender.");
            }
        };

        const handleTimeChange = (data: SocketData) => {
            console.log("GLOBAL_LISTENER: Received 'traffic_time_change' event.");
            console.log("GLOBAL_LISTENER: My socket.id:", socket.id);
            console.log("GLOBAL_LISTENER: Sender's socket.id:", data.senderId);

            if (data.senderId !== socket.id) {
                console.log("GLOBAL_LISTENER: Condition 'data.senderId !== socket.id' is TRUE. Showing notification.");
                
                // ✅ ใช้ username ในการแสดงผล
                const displayMessage = data.username ? data.message.replace('by an admin', `by ${data.username}`) : data.message;
                showNotification('Traffic Times Updated', displayMessage);
            } else {
                console.log("GLOBAL_LISTENER: Condition 'data.senderId !== socket.id' is FALSE. Ignoring for sender.");
            }
        };

        socket.on('traffic_mode_change', handleModeChange);
        socket.on('traffic_time_change', handleTimeChange);

        return () => {
            console.log("GLOBAL_LISTENER: Cleaning up listeners.");
            socket.off('traffic_mode_change', handleModeChange);
            socket.off('traffic_time_change', handleTimeChange);
        };
    }, []);

    return null;
};

export default GlobalNotificationListener;