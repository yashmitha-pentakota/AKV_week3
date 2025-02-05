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


/**
 * @swagger
 * /signup:
 *   post:
 *     summary: User sign-up
 *     description: Registers a new user with provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Invalid data
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Sends a password reset email to the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent successfully
 *       400:
 *         description: Invalid email
 */
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
/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Allows users to reset their password via a reset link.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email address
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset request successful
 *       400:
 *         description: Invalid email or user does not exist
 */

/**
 * @swagger
 * /user-details:
 *   get:
 *     summary: Get user details
 *     description: Retrieves the details of the currently authenticated user.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user details
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /upload-profile-photo:
 *   post:
 *     summary: Upload a new profile photo
 *     description: Uploads a new profile photo for the authenticated user.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /vendors/count:
 *   get:
 *     summary: Get the count of vendors
 *     description: Retrieves the total number of vendors in the system.
 *     tags:
 *       - Vendors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched vendor count
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get a list of products
 *     description: Fetches all products from the inventory.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched product list
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

//productsssssssssss

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Add a new product
 *     description: Allows users to add a new product to the inventory, including a profile picture.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 description: The name of the product
 *                 example: "Product A"
 *               price:
 *                 type: number
 *                 description: The price of the product
 *                 example: 20.99
 *     responses:
 *       200:
 *         description: Product added successfully
 *       400:
 *         description: Invalid product data or missing fields
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get list of categories
 *     description: Retrieves a list of product categories from the inventory.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched list of categories
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Get list of vendors
 *     description: Retrieves a list of vendors associated with products in the inventory.
 *     tags:
 *       - Vendors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched list of vendors
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /upload-product-image:
 *   post:
 *     summary: Upload a product image
 *     description: Uploads an image for a specific product in the inventory.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product image uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update product details
 *     description: Updates the details of an existing product in the inventory, including the product image.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 description: The name of the product
 *               price:
 *                 type: number
 *                 description: The price of the product
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid product data or missing fields
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     description: Deletes a product from the inventory by its ID.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The ID of the product to delete
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID or operation failed
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /move-to-cart:
 *   post:
 *     summary: Move items to the cart
 *     description: Moves selected items from the inventory to the cart.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to move to the cart
 *                 example: "12345"
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the product
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item successfully moved to the cart
 *       400:
 *         description: Invalid input or missing data
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Retrieve cart items
 *     description: Retrieves the list of items currently in the user's cart.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched cart items
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Cart is empty
 */

/**
 * @swagger
 * /cart/update:
 *   post:
 *     summary: Update cart item quantity
 *     description: Updates the quantity of an item in the cart.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: string
 *                 description: The ID of the cart item to update
 *                 example: "67890"
 *               quantity:
 *                 type: integer
 *                 description: The new quantity of the item
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cart item quantity updated successfully
 *       400:
 *         description: Invalid quantity or missing data
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Cart item not found
 */

/**
 * @swagger
 * /delete-cart-item/{cartId}:
 *   delete:
 *     summary: Delete an item from the cart
 *     description: Removes an item from the user's cart.
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         description: The ID of the cart item to delete
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart item successfully deleted
 *       400:
 *         description: Invalid cart item ID or failed to delete item
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: Cart item not found
 */

/**
 * @swagger
 * /import:
 *   post:
 *     summary: Import a file
 *     description: Uploads a file for processing, with authentication.
 *     tags:
 *       - File Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 */

/**
 * @swagger
 * /retrieve-files:
 *   get:
 *     summary: Retrieve uploaded files
 *     description: Retrieves the list of previously uploaded files.
 *     tags:
 *       - File Upload
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched uploaded files
 *       401:
 *         description: Unauthorized - JWT token is missing or invalid
 *       404:
 *         description: No files found
 */


module.exports = router;