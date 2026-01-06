const pool = require('../dboperations');

exports.postTransfer = async (req, res) => {
  try {
    const { sender_id, receiver_account, amount } = req.body;

    if (!sender_id || !receiver_account || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const [sender] = await pool.query(
      "SELECT account_number, TotalAmount FROM user_register WHERE user_id = ?",
      [sender_id]
    );

    if (sender.length === 0)
      return res.status(404).json({ message: "Sender not found" });

    if (Number(sender[0].TotalAmount) < Number(amount))
      return res.status(400).json({ message: "Insufficient balance" });

    const [receiver] = await pool.query(
      "SELECT user_id, account_number FROM user_register WHERE account_number = ?",
      [receiver_account]
    );

    if (receiver.length === 0)
      return res.status(404).json({ message: "Receiver not found" });

    const receiver_id = receiver[0].user_id;

    await pool.query(
      `INSERT INTO user_transfer 
       (sender_id, receiver_id, sender_account, receiver_account, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sender_id,
        receiver_id,
        sender[0].account_number,
        receiver_account,
        amount
      ]
    );

    await pool.query(
      "UPDATE user_register SET TotalAmount = TotalAmount - ? WHERE user_id = ?",
      [amount, sender_id]
    );

    await pool.query(
      "UPDATE user_register SET TotalAmount = TotalAmount + ? WHERE user_id = ?",
      [amount, receiver_id]
    );

    await pool.query(
      `UPDATE addfriend_list
       SET Amount = Amount + ?
       WHERE user_id = ? AND friend_AccountNumber = ?`,
      [amount, sender_id, receiver_account]
    );
    await pool.query(
      `INSERT INTO transactions (user_id,type,amount,recipient,category,date,status)
       VALUES (?,?,?,?,?,?,?)`,
      [
        sender_id,
        "Debit",
        amount,
        receiver_account,
        "Transfer",
        new Date(),
        "completed"
      ]
    )
    await pool.query(
      `INSERT INTO transactions (user_id,type,amount,recipient,category,date,status)
       VALUES (?,?,?,?,?,?,?)`,
      [
        receiver_id,
        "Credit",
        amount,
        sender[0].account_number,
        "Transfer",
        new Date(),
        "completed"
      ]
    )
    res.status(200).json({ message: "Transfer Successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Transfer Failed" });
  }
};
