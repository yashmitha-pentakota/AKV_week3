const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authenticate = require('../middleware/jwt/authenticate');
const jwtAuth = require('../middleware/jwt/jwtAuth');
const multer = require('multer');
const cartController = require('../controllers/cartController');
const { processFile} = require('../workers/importProcessor');
// Set up multer for file uploads
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

router.post('/signup', authController.signup);
router.post('/login', authController.login);
// Reset Password Request Route (Send Reset Email)
router.post('/forgot-password', authController.forgotPassword);

// Reset Password Route (Update the password)
router.post('/reset-password', authController.resetPassword);
router.get('/user-details', authenticate, authController.getUserDetails);
router.post('/upload-profile-photo', jwtAuth, upload.single('profile_pic'), authController.uploadProfilePhoto);
router.get('/vendors/count', authenticate, authController.getVendorCount);
router.get('/products', authenticate, authController.getProducts);

router.post('/products', upload.single('profile_pic'), authController.addProduct);
router.get('/categories', authenticate, authController.getCategories); // New route for retrieving categories
router.get('/vendors', authenticate, authController.getVendors); // New route for retrieving vendors
router.post('/upload-product-image', upload.single('product_image'), authController.uploadProductImage);
router.put('/products/:productId', upload.single('product_image'), authController.updateProduct);

router.delete('/products/:productId', authenticate, authController.deleteProduct);

//cart routings 
router.post('/move-to-cart', authenticate, cartController.moveToCart);
router.get('/cart', authenticate, cartController.getCartItems);
router.post('/cart/update', authenticate, cartController.updateCartItemQuantity);
router.delete('/delete-cart-item/:cartId', authenticate, cartController.deleteCartItem);

// File upload route with authentication
router.post('/import', authenticate, upload.single('file'), authController.importFile);

router.get('/retrieve-files',authenticate,authController.retrieveFiles);

module.exports = router;