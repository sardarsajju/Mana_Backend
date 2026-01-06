const {Router}=require('express');
const { getUserCard } = require('../controller/userCardConttroller');
const router=Router();
router.get('/card/:user_id',getUserCard);
module.exports=router;