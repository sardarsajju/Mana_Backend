const{Router}=require('express');
const { downloadStatement } = require('../controller/statementDownloadConroller');
const router=Router();
router.get('/downloadstatement/:user_id',downloadStatement);
module.exports=router;