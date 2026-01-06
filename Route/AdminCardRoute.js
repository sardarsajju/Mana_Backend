const {Router}=require('express');
const { createCard, assignCard } = require('../controller/AdminCradController');
const router=Router();
router.post('/admincard',createCard);
router.post('/assigncard',assignCard);
module.exports=router;
