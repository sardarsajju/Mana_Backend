const{Router}=require('express');
const { postBankregister, loginbank, getBankdetails, getBankuserdetails, getBankUserDetailsByBank } = require('../controller/BankregisterController');
const router=Router();
router.post('/bankregister',postBankregister);
router.post('/loginbank',loginbank);
router.get('/getbankdetails',getBankdetails);
router.get('/getbankuserdetails/:bankId',getBankUserDetailsByBank);
module.exports=router;