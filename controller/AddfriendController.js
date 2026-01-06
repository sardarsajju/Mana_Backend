const pool = require('../dboperations');

exports.addfriend = async (req, res) => {
    try {
        const { user_id, Name, Bank_name, friend_AccountNumber } = req.body;
        const [existing] = await pool.query(
            `SELECT * FROM addfriend_list WHERE user_id=? AND friend_AccountNumber=?`,
            [user_id, friend_AccountNumber]
        )
        if (existing.length > 0) {
            return res.status(400).json({ message: "Friend already exists" });
        }
        const [result] = await pool.query(
            `INSERT INTO addfriend_list 
       (user_id, Name, Bank_name, friend_AccountNumber, Amount)
       VALUES (?, ?, ?, ?, 0)`,
            [user_id, Name, Bank_name, friend_AccountNumber]
        );
        if (result.friend_AccountNumber === 0) {
            return res.status(400).json({ message: "Friend already exists" });
        }
        res.status(200).json({ message: "Friend added successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error while adding friend" });
    }
};

exports.getfriendlist = async (req, res) => {
    const { user_id } = req.params;
    try {
        const [result] = await pool.query(
            `SELECT * FROM addfriend_list WHERE user_id=?`,
            [user_id]
        )
        if (result.length === 0) {
            res.status(404).send("Data Not Found")
        } else {
            res.status(200).send(result)
        }
    } catch (error) {
        res.status(500).send("Error While Fetching Data")
        console.log(error);
    }
}