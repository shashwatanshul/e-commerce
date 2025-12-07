import express from 'express'
import { allUser, changePassword, forgotPassword, getUserById, login, logout, register, reVerify, updateUser, verify, verifyOTP } from '../controllers/userController.js'
import { isAuthenticated } from '../middleware/isAuthenticated.js'
import { singleUpload } from '../middleware/multer.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify', verify)
router.post('/reverify', reVerify)
router.post('/login', login)
router.post('/logout',isAuthenticated, logout)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp/:email', verifyOTP)
router.post('/change-password', changePassword)
router.get('/all-user', allUser)
router.put("/update/:id", isAuthenticated, singleUpload, updateUser);
router.get('/get-user/:userId', getUserById)

export default router;