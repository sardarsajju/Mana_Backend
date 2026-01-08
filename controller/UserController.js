

const pool = require('../dboperations');
const sendMail = require('./utils/sendMail');

exports.postuser_register = async (req, res) => {
    try {
        const {
            FirstName,
            LastName,
            MobileNumber,
            Email,
            Password,
            account_number,
            TotalAmount = 0,
            Bank_id,
        } = req.body;
        const [result] = await pool.query(
            `INSERT INTO user_register (FirstName,LastName,MobileNumber,Email,Password,account_number,TotalAmount,Bank_id)
            VALUES(?,?,?,?,?,?,?,?)`,
            [FirstName, LastName, MobileNumber, Email, Password, account_number, TotalAmount, Bank_id]
        );
        const [[bank]] = await pool.query(
            `SELECT * FROM Bank_register WHERE Bank_id=?`,
            [Bank_id]
        )
        const emailTemplate = `
      <div style="font-family: Arial; line-height:1.6;">
        <h2>${bank.Bank_Name}</h2>

        <p>Dear ${FirstName},</p>

        <p>
          We are pleased to inform you that your account has been successfully
          registered with <strong>${bank.Bank_Name}</strong>.
        </p>

        <p>
          You can now access our digital banking services using your registered
          mobile number.
        </p>

        <br/>

        <p>Regards,<br/>
        <strong>${bank.Bank_Name} Administration</strong></p>

        <small>
          This is an automated message. Please do not reply.
        </small>
      </div>
    `;
        await sendMail(Email, `Welcome to ${bank.Bank_Name}`,  emailTemplate)
        res.status(200).send({
            message: "Data inserted successfully",
            user_register: result
        })
    } catch (error) {
        res.status(500).send("Error while inserting data")
        console.log(error)
    }
}
exports.getuserdetails = async (req, res) => {
    const { user_id } = req.params;
    try {
        const [result] = await pool.query(
            ` SELECT 
                u.user_id,
                u.FirstName,
                u.LastName,
                u.MobileNumber,
                u.Email,
                u.account_number,
                u.TotalAmount,
                b.Bank_Name,
                b.Branch_Name,
                b.IFSC_Code
            FROM user_register u
            JOIN Bank_register b
            ON u.Bank_id = b.Bank_id
            WHERE u.user_id = ?`,
            [user_id]
        )
        if (result.length === 0) {
            res.status(404).send("data not found")
        }
        else {
            res.status(200).send(result)
        }
    }
    catch (error) {
        res.send("Error while fetching data")
        console.log(error)
    }
}