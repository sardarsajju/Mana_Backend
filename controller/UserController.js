

 const pool = require('../dboperations');

exports.postuser_register=async(req,res)=>{
    try {
        const{
            FirstName,
            LastName,
            MobileNumber,
           Email,
           Password,
           account_number,
           TotalAmount=0,
           Bank_id,
        }=req.body;
        const[result]=await pool.query(
            `INSERT INTO user_register (FirstName,LastName,MobileNumber,Email,Password,account_number,TotalAmount,Bank_id)
            VALUES(?,?,?,?,?,?,?,?)`,
            [FirstName,LastName,MobileNumber,Email,Password,account_number,TotalAmount,Bank_id]
        )
        res.status(200).send({
            message:"Data inserted successfully",
            user_register:result
        })
    } catch (error) {
        res.status(500).send("Error while inserting data")
        console.log(error)
    }
}
exports.getuserdetails=async(req,res)=>{
    const{user_id}=req.params;
    try{
        const[result]=await pool.query(
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
        if(result.length===0){
            res.status(404).send("data not found")
        }
        else{
            res.status(200).send(result)
        }
    }
    catch(error){
        res.send("Error while fetching data")
        console.log(error)
    }
}