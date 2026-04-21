const express = require('express');
const router = express.Router();
const HomeController = require('../app/controllers/HomeController');
const AuthController = require('../app/controllers/AuthController');

// Health check endpoint — used by ALB and Docker HEALTHCHECK
router.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

router.get('/', HomeController.homePage);
router.get('/login', AuthController.loginPage);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/sign-up', AuthController.signUpPage);
router.post('/sign-up', AuthController.signUp);
router.get('/forgot-password', AuthController.forgotPasswordPage);
router.post('/forgot-password', AuthController.forgotPassword);
router.get('/reset-password/:token', AuthController.resetPasswordPage);
router.post('/reset-password/:token', AuthController.resetPassword);

module.exports = router;
