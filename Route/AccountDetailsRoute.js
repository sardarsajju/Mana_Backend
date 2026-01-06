const{Router}=require('express');
const { verifyAccount } = require('../controller/AccountDetailsController');

const router=Router();
router.post('/verifyAccount',verifyAccount);
module.exports=router;