// const pool = require('../dboperations');
// exports.submitKycDetails = async (req, res) => {
//     try {
//         const { user_id, aadhaar_number, pan_number } = req.body;


//         if (!user_id || !aadhaar_number || !pan_number) {
//             return res.status(400).send({
//                 message: 'All fields are required'
//             });
//         }

//         const [result] = await pool.query(
//             `INSERT INTO documents (user_id, aadhaar_number, pan_number)
//              VALUES (?, ?, ?)`,
//             [user_id, aadhaar_number, pan_number]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(400).send({
//                 message: 'KYC submission failed'
//             });
//         }

//         res.status(201).send({
//             message: 'KYC Details Submitted Successfully'
//         });

//     } catch (error) {
//         console.error(error);

//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(409).send({
//                 message: 'KYC already exists for this user'
//             });
//         }

//         res.status(500).send({
//             message: 'Error while submitting KYC details'
//         });
//     }
// };



// exports.verifyKycDetails = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         if (!user_id) {
//             return res.status(400).send({
//                 message: 'User ID is required'
//             });
//         }

//         const [result] = await pool.query(
//             `UPDATE documents 
//              SET kyc_status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP
//              WHERE user_id = ?`,
//             [user_id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).send({
//                 message: 'KYC record not found'
//             });
//         }

//         res.status(200).send({
//             message: 'KYC verified successfully'
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({
//             message: 'Error while verifying KYC'
//         });
//     }
// };

// exports.getKycDetails = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         if (!user_id) {
//             return res.status(400).send({
//                 message: 'User ID is required'
//             });
//         }

//         const [result] = await pool.query(
//             `SELECT * FROM documents WHERE user_id = ?`,
//             [user_id]
//         );

//         if (result.length === 0) {
//             return res.status(404).send({
//                 message: 'KYC record not found'
//             });
//         }

//         res.status(200).send(result);

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({
//             message: 'Error while fetching KYC details'
//         });
//     }
// };



const pool = require('../dboperations');

exports.submitKycDetails = async (req, res) => {
    try {
        const { user_id, aadhaar_number, pan_number } = req.body;

        if (!user_id || !aadhaar_number || !pan_number) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        await pool.query(
            `INSERT INTO documents (user_id, aadhaar_number, pan_number, kyc_status)
             VALUES (?, ?, ?, 'PENDING')`,
            [user_id, aadhaar_number, pan_number]
        );

        res.status(201).json({
            message: 'KYC submitted successfully. Awaiting verification.'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'KYC already exists' });
        }
        res.status(500).json({ message: 'KYC submission failed' });
    }
};


exports.verifyKycDetails = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [result] = await pool.query(
            `UPDATE documents 
             SET kyc_status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'KYC not found' });
        }

        res.json({ message: 'KYC verified successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Verification failed' });
    }
};

exports.getKycStatus = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [result] = await pool.query(
            `SELECT kyc_status FROM documents WHERE user_id = ?`,
            [user_id]
        );

        if (result.length === 0) {
            return res.json({ status: 'NOT_SUBMITTED' });
        }

        res.json({ status: result[0].kyc_status });

    } catch (error) {
        res.status(500).json({ message: 'Failed to get KYC status' });
    }
};
