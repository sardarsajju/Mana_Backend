const{Router}=require('express');
const { submitKycDetails, verifyKycDetails, getKycStatus } = require('../controller/kycController');
const router=Router();
router.post('/kycdetails',submitKycDetails);
router.put('/verifykycdetails/:user_id',verifyKycDetails);
router.get('/getkycdetails/:user_id',getKycStatus);
module.exports=router;