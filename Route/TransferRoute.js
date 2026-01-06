const{Router}=require('express');
const { postTransfer } = require('../controller/TransferController');
const router=Router();
router.post('/transfermoney',postTransfer);
module.exports=router;