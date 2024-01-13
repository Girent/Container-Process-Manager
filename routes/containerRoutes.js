const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer()

const containerController = require('../controllers/containerController')

router.post('/create', upload.any(), containerController.createContainer)
router.post('/start', containerController.startContainer)
router.post('/stop', containerController.stopContainer)

router.get('/', containerController.getAllContainer)
router.get('/info', containerController.getContainerInfo)
router.get('/status', containerController.getContainerStatus)
router.get('/log', containerController.getContainerLog)

router.delete('/delete', containerController.deleteContainer)

module.exports = router
