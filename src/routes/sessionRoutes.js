const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.post('/', sessionController.createSession);
router.post('/approve', sessionController.approveSession);
router.get('/:id', sessionController.getSessionStatus);

module.exports = router;