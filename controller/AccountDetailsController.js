const pool = require("../dboperations");

exports.verifyAccount = async (req, res) => {
  try {
    const { accountNumber, IFSC_Code } = req.body;

    if (!accountNumber || !IFSC_Code) {
      return res.status(400).json({
        message: "Account number and IFSC code are required"
      });
    }

    const [result] = await pool.query(
      `
      SELECT 
        CONCAT(u.FirstName, ' ', u.LastName) AS accountHolderName
      FROM user_register u
      JOIN Bank_register b 
        ON u.Bank_id = b.Bank_id
        
      WHERE u.account_number = ?
        AND b.IFSC_Code = ?
      LIMIT 1
      `,
      [accountNumber, IFSC_Code]
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Invalid account number or IFSC code"
      });
    }

    res.status(200).json({
      message: "Account verified successfully",
      accountHolderName: result[0].accountHolderName,
      AccountHolderBankName: result[0].AccountHolderBankName
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Account verification failed"
    });
  }
};
