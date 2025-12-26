const db = require("../db");

exports.sendMessage = async (req, res) => {
    try {
        const{appointment_id, sender_role, sender_id, message} = req.body;
        
        if(!appointment_id || !sender_role || !sender_id || !message) {
            return res.status(400).json({message: "All fields are requried"});
        }

        if(!["doctor", "patient"].includes(sender_role)){
            return res.status(400).json({message: "Invalid sender role"});
        }

        await db.query(
            `INSERT INTO chat_messages
            (appointment_id, sender_role, sender_id, message)
            VALUES (?, ?, ?, ?)
            `,
            [appointment_id, sender_role, sender_id, message]
        );

        res.status(201).json({message: "Message sent successfully" });
    } catch (error) {
        console.error("Send Message error:",error);
        res.status(500).json({ message: "Internal server error"})
    }
};


//Get chat by appointment

exports.getChatByAppointment = async (req, res) =>{

    try {
        const {appointment_id} = req.params;
        
        const [messages] = await db.query(
            `SELECT sender_role, sender_id, message, created_at
            From chat_messages
            where appointment_id = ?
            ORDER BY created_at ASC`,
            [appointment_id]
        );
        res.json(messages);
    } catch (error) {
        console.error("Fetch chat error", error);
        res.status(500).json({message: "Internal server error"})
        
    }
};