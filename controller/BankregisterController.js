const pool = require('../dboperations');
exports.postBankregister = async (req, res) => {
  try {
    const { Bank_Name, Branch_Name, IFSC_Code, MobileNumber } = req.body;
    const [result] = await pool.query(
      `INSERT INTO Bank_register (Bank_Name,Branch_Name,IFSC_Code,MobileNumber) values(?,?,?,?)`,
      [Bank_Name, Branch_Name, IFSC_Code, MobileNumber]
    )

    res.status(200).send({ message: 'Data Inserted Successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error While Instering Data" });
  }
}
exports.loginbank = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    const [result] = await pool.query(
      `SELECT * FROM Bank_register WHERE MobileNumber = ?`,
      [mobileNumber]
    );

    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number"
      });
    }

    res.status(200).json({
      success: true,
      message: "Mobile number verified",
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error while fetching data"
    });
  }
};
exports.getBankUserDetailsByBank = async (req, res) => {
  try {
    const { bankId } = req.params;
    // console.log(bankId);
    const [result] = await pool.query(
      `SELECT 
        u.FirstName,
        u.LastName,
        u.MobileNumber,
        u.user_id,
        u.account_number,

        b.Bank_Name,
        b.Branch_Name,
        b.IFSC_Code
      FROM user_register u
      JOIN Bank_register b 
        ON u.Bank_id = b.Bank_id
      WHERE b.Bank_id = ?`,
      [bankId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "No users found for this bank" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error while fetching bank users" });
  }
};

exports.getBankdetails = async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT Bank_id, Bank_Name FROM Bank_register`
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "No banks found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while fetching banks" });
  }
};
