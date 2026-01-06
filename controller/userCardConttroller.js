const pool = require('../dboperations');

// GET /card/user/:user_id
exports.getUserCard = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [cards] = await pool.query(
      `SELECT
          uc.card_holder_name,
          uc.card_last,
          uc.expiry_month,
          uc.expiry_year,
          b.Bank_Name,
          cd.card_type,
          cd.card_color,
          cd.network
       FROM user_cards uc
       JOIN bank_card_design cd 
         ON uc.card_design_id = cd.card_design_id
       JOIN Bank_register b 
         ON cd.bank_id = b.Bank_id
       WHERE uc.user_id = ?`,
      [user_id]
    );

    // ✅ NO CARD CASE
    if (cards.length === 0) {
      return res.status(404).json({
        message: "No card found for this user",
        cards: []
      });
    }

    // ✅ CARD FOUND
    res.status(200).json({
      message: "User card details fetched successfully",
      cards
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while fetching user cards"
    });
  }
};

