import { createServer } from 'http'
import { Server } from 'socket.io'

const server = createServer()
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

// ใช้ Map ที่มี email เป็น Key (Stable ID) สำหรับเก็บข้อมูลผู้ใช้ออนไลน์
const onlineUsers = new Map<string, { email: string, firstName: string, socketId: string }>()

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('user_online', (userData: { email: string, firstName: string }) => {
        // อัปเดตข้อมูลผู้ใช้ใน Map ด้วย email เป็น Key
        onlineUsers.set(userData.email, {
            ...userData,
            socketId: socket.id
        })
        console.log(`User online: ${userData.firstName} (${userData.email}) with ID: ${socket.id}`)
        // แจ้งผู้ใช้ทั้งหมดว่ามีผู้ใช้ออนไลน์อัปเดต
        io.emit('update_online_users', Array.from(onlineUsers.values()))
    })
    
    // Event สำหรับส่งข้อความส่วนตัว (รับและส่ง Stable ID: email)
    socket.on('send_private_message', (data: { 
        senderId: string, 
        senderFirstName: string, 
        senderEmail: string, 
        receiverId: string, 
        receiverEmail: string, 
        message: string, 
        timestamp: number 
    }) => {
        
        const receiverSocketId = data.receiverId;
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);

        if (receiverSocket) {
            // ส่ง data ทั้งหมดไปยังผู้รับ (รวมถึง Stable ID)
            receiverSocket.emit('private_message', data); 
            
            console.log(`✅ Message sent from ${data.senderEmail} to ${data.receiverEmail} (${receiverSocketId}).`);
        } else {
            console.log(`❌ Error: Receiver Socket ID ${receiverSocketId} not found or disconnected. Message for ${data.receiverEmail} will be stored in sender's Redux.`);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`)
        
        // ค้นหาและลบผู้ใช้ที่หลุดการเชื่อมต่อด้วย socket.id
        let disconnectedUserEmail = null;
        for (const [email, user] of onlineUsers.entries()) {
            if (user.socketId === socket.id) {
                disconnectedUserEmail = email;
                break;
            }
        }
        if (disconnectedUserEmail) {
            onlineUsers.delete(disconnectedUserEmail);
            io.emit('update_online_users', Array.from(onlineUsers.values()))
        }
    })
    
    socket.on('request_online_users', () => {
        socket.emit('update_online_users', Array.from(onlineUsers.values()))
        console.log(`Server sent updated user list to: ${socket.id}`)
    })

    socket.on('traffic_mode_change', (data) => {
        socket.broadcast.emit('traffic_mode_change', data)
        console.log(`Server broadcasted 'traffic_mode_change' event from ${data.senderId}`)
    })

    socket.on('traffic_time_change', (data) => {
        socket.broadcast.emit('traffic_time_change', data)
        console.log(`Server broadcasted 'traffic_time_change' event from ${data.senderId}`)
    })
})

server.listen(3000, () => {
    console.log('Socket.IO server listening on http://localhost:3000')
})

export { io }