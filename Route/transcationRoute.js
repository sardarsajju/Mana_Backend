const{Router}=require('express');
const { addtranscations, getTranscations } = require('../controller/TranscationController');
const router=Router();
router.post('/addtranscations',addtranscations);
router.get('/gettranscations/:user_id',getTranscations);
module.exports=router;