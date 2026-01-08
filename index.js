const express=require('express');
const app=express();
const cors=require('cors');
require('dotenv').config();
const userRoute=require('./Route/UserRoute');
const loginRoute=require('./Route/LoginRoute');
const transcationRoute=require('./Route/transcationRoute');
const transfer=require('./Route/TransferRoute');
const addfriend=require('./Route/AddfriendRoute');
const statementdownload=require('./Route/statementRoute');
const bankregister=require('./Route/BankingregisterRoute');
const accountDetails=require('./Route/AccountDetailsRoute');
const admin=require('./Route/AdminCardRoute');
const usercard=require('./Route/userCradRoute');
const kyc=require('./Route/kucRoute');

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;
app.use('/api',userRoute)
app.use('/api',loginRoute)
app.use('/api/transcations',transcationRoute)
app.use('/api/transfer',transfer)
app.use('/api/friend',addfriend)
app.use('/api/statement',statementdownload)
app.use('/api/bank',bankregister)
app.use('/api/account',accountDetails);
app.use('/api/admin',admin);
app.use('/api/usercard',usercard);
app.use('/api/kyc',kyc);


app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
    console.log("Database connected successfully");
});