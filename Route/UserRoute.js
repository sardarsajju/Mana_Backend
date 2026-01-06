const {Router}=require('express');
const { postuser_register, getuserdetails } = require('../controller/UserController');
const router=Router();

router.post('/register',postuser_register);
router.get('/getuserdetails/:user_id',getuserdetails);

module.exports=router;