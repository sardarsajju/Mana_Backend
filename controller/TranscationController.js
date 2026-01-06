const pool = require('../dboperations');

exports.addtranscations = async (req, res) => {
    try {
        const { user_id, type, amount, recipient, category, date } = req.body;

        const [result] = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, recipient, category, date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, type, amount, recipient, category, date, "completed"]
        );
         if (type.toLowerCase() === "credit") { 
            await pool.query(
                `UPDATE user_register SET TotalAmount = TotalAmount + ? WHERE user_id = ?`,
                [amount, user_id]
            );
        } else if(type.toLowerCase() === "debit") {
            await pool.query(
                `UPDATE user_register SET TotalAmount = TotalAmount - ? WHERE user_id = ?`,
                [amount, user_id]
            );
        }
        res.send({
            message: "Transaction saved",
            transaction_id: result.insertId
        });

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};
exports.getTranscations = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [result] = await pool.query(
            `SELECT * FROM transactions WHERE user_id = ?`,
            [user_id]
        );

        if (result.length === 0) {
            return res.status(404).send({
                message: "No transactions found",
            });
        }

        res.status(200).send({
            message: "Transactions fetched successfully",
            transactions: result
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error fetching transactions",
            error: error.message
        });
    }
};
