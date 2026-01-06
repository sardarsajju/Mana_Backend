const {Router}=require('express');
const { addfriend, getfriendlist } = require('../controller/AddfriendController');
const router=Router();
router.post('/addfriend',addfriend);
router.get('/getfriendlist/:user_id',getfriendlist)
module.exports=router;