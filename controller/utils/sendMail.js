const nodemailer=require('nodemailer');
const sendMail=async(to,subject,html)=>{
    const transporter=nodemailer.createTransport({
        host:"smtp.gmail.com",
        port:587,
        secure:false,
        auth:{
            user:process.env.Email_User,
            pass:process.env.Email_Pass
        }
    });
    await transporter.sendMail({
        from:`"Bank Administration" <${process.env.Email_User}>`,
        to,
        subject,
        html
    })
}
console.log(process.env.Email_User);

module.exports=sendMail;