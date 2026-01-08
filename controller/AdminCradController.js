const pool = require('../dboperations');
exports.createCard = async (req, res) => {
    try {
        const { bank_id, card_name, card_type, card_color, network } = req.body;
        if(!bank_id || !card_name || !card_type || !card_color || !network){
            return res.status(400).send({
                message:"All Fields Are required"
            })
        }
        const [result] = await pool.query(
            `INSERT INTO bank_card_design (bank_id, card_name, card_type, card_color, network) VALUES (?,?,?,?,?)`,
            [bank_id, card_name, card_type, card_color, network]
        )
        res.status(200).send({
            message:"Card Created Successfully",
            card_details:result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message:"Error While Creating Card"
        })
    }
}
// exports.assignCard = async (req, res) => {
//   try {
//     const { user_id, card_design_id, card_holder_name } = req.body;

//     if (!user_id || !card_design_id || !card_holder_name) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const last4 = Math.floor(1000 + Math.random() * 9000).toString();
//     const expiryMonth = "12";
//     const expiryYear = "28";

//     await pool.query(
//       `INSERT INTO user_cards
//        (user_id, card_design_id, card_holder_name, card_last, expiry_month, expiry_year)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [user_id, card_design_id, card_holder_name, last4, expiryMonth, expiryYear]
//     );

//     res.status(201).json({ message: "Card assigned to user" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to assign card" });
//   }
// };



exports.assignCard = async (req, res) => {
  try {
    const { user_id, card_design_id, card_holder_name } = req.body;
    console.log(user_id, card_design_id, card_holder_name);

    if (!user_id || !card_design_id || !card_holder_name) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const [kyc] = await pool.query(
      `SELECT kyc_status FROM documents WHERE user_id = ?`,
      [user_id]
    );

    if (kyc.length === 0) {
      return res.status(403).json({
        message: "KYC not submitted. Please complete KYC first."
      });
    }

    if (kyc[0].kyc_status !== 'VERIFIED') {
      return res.status(403).json({
        message: "KYC not verified. Card cannot be issued."
      });
    }


    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryMonth = "12";
    const expiryYear = "28";

    await pool.query(
      `INSERT INTO user_cards
       (user_id, card_design_id, card_holder_name, card_last, expiry_month, expiry_year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, card_design_id, card_holder_name, last4, expiryMonth, expiryYear]
    );

    res.status(201).json({
      message: "Debit card assigned successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to assign card"
    });
  }
};
