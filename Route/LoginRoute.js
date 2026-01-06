const{Router}=require('express');

const { postlogindetails } = require('../controller/loginController');
const router=Router();
router.post('/login',postlogindetails);
module.exports=router;