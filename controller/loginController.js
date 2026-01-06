const pool = require('../dboperations');

function generateAccountNumber() {
    return Math.floor(100000000000 + Math.random() * 900000000000);
}

exports.postlogindetails = async (req, res) => {
    try {
        const { Email, Password } = req.body;
        console.log(Email, Password);

        const [result] = await pool.query(
            `SELECT * FROM user_register WHERE Email = ? AND Password = ?`,
            [Email, Password]
        );
console.log(result);
        if (result.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        const user = result[0];
        const user_id = user.user_id;

        const [checkLogin] = await pool.query(
            `SELECT * FROM login WHERE user_id = ?`,
            [user_id]
        );

        if (checkLogin.length === 0) {
            await pool.query(
                `INSERT INTO login (user_id, Email, Password) VALUES (?, ?, ?)`,
                [user_id, Email, Password]
            );
        }

        let accountNumber = user.account_number;
        if (!accountNumber) {
            accountNumber = generateAccountNumber();
            await pool.query(
                `UPDATE user_register SET account_number = ? WHERE user_id = ?`,
                [accountNumber, user_id]
            );
        }

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            user_id: user_id,
            user: user
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};
