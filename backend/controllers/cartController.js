const vendorModel = require('../models/vendorModel');
const productModel = require('../models/productModel');
const knex = require('../mysql/connection');
const cartsModel = require('../models/cartsModel');
const multer = require('multer');
const XLSX = require('xlsx');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');  // Define the folder to save the file
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);  // Generate unique file name
    }
  });
  
  const upload = multer({ storage: storage }).single('file');  // Accept a single file from the form
  // Route to handle Excel file upload
  const importCartData = (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error uploading file', details: err.message });
      }
  
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      // Read the Excel file
      const filePath = req.file.path;
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);  // Convert to JSON
  
      if (data.length === 0) {
        return res.status(400).json({ error: 'No data found in the file' });
      }
  
      // Process data and insert into the database
      const cartItems = data.map((item) => ({
        user_id: req.user.id,  // Assuming you have user info in the request
        product_id: item.product_id,
        vendor_id: item.vendor_id,
        quantity: item.quantity,
      }));
  
      knex('carts')
        .insert(cartItems)
        .then(() => {
          res.status(200).json({ message: 'Cart data imported successfully' });
        })
        .catch((error) => {
          res.status(500).json({ error: 'Error inserting data into the database', details: error.message });
        });
    });
  };
  

// Helper function to check if product and vendor exist and move products to the cart
async function moveToCart(req, res) {
    try {
        const { products } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array is required and cannot be empty.' });
        }

        const errors = [];
        const successful = [];

        for (const product of products) {
            const { productId, vendorId, quantity } = product;

            try {
                // Check if the product exists
                const productExists = await productModel.getProductById(productId);
                if (!productExists) throw new Error(`Product with ID ${productId} does not exist.`);

                // Check if the vendor exists
                const vendorExists = await vendorModel.getVendorById(vendorId);
                if (!vendorExists) throw new Error(`Vendor with ID ${vendorId} does not exist.`);

                // Add item to cart
                await cartsModel.addItemToCart({
                    user_id: userId,
                    product_id: productId,
                    vendor_id: vendorId,
                    quantity: quantity || 1,
                });

                successful.push(productId);
            } catch (error) {
                errors.push({ productId, message: error.message });
            }
        }

        res.status(200).json({ message: 'Processed products', successful, errors });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// Get paginated cart items
async function getCartItems(req, res) {
    try {
        const { page = 1, limit = 5 } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        const totalItemsQuery = knex('carts')
            .count('* as total')
            .where('user_id', userId)
            .join('products', 'carts.product_id', '=', 'products.product_id')
            .andWhere('products.status', '=', 1)
            .first();

        const cartItemsQuery = knex('carts')
            .join('products', 'carts.product_id', '=', 'products.product_id')
            .join('categories', 'products.category_id', '=', 'categories.category_id')
            .join('vendors', 'carts.vendor_id', '=', 'vendors.vendor_id')
            .select(
                'carts.id',
                'products.product_id',
                'products.product_name',
                'products.product_image',
                'categories.category_name',
                'vendors.vendor_name',
                'carts.quantity',
                'products.quantity_in_stock'
            )
            .where('carts.user_id', userId)
            .andWhere('products.status', '=', 1)
            .limit(limit)
            .offset(offset);

        const [totalResult, cartItems] = await Promise.all([totalItemsQuery, cartItemsQuery]);

        if (!totalResult?.total || cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'No cart items found for this user' });
        }

        res.json({
            success: true,
            total: totalResult.total,
            page: Number(page),
            limit: Number(limit),
            products: cartItems,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', details: error.message });
    }
}

// Update cart item quantities
async function updateCartItemQuantity(req, res) {
    try {
        const userId = req.user.id;
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid request body. Products array is required.' });
        }

        const trx = await knex.transaction();

        try {
            for (const { productId, quantity } of products) {
                // Fetch current product details
                const product = await trx('products').where('product_id', productId).first();
                if (!product) throw new Error(`Product with ID ${productId} not found.`);

                // Calculate new stock
                const newStock = product.quantity_in_stock - quantity;
                if (newStock < 0) throw new Error('Not enough stock available.');

                // Fetch current cart item details
                const cartItem = await trx('carts')
                    .where('product_id', productId)
                    .andWhere('user_id', userId)
                    .first();
                if (!cartItem) throw new Error('Cart item not found.');

                // Update cart and product tables
                await trx('carts')
                    .where('product_id', productId)
                    .andWhere('user_id', userId)
                    .update({ quantity: cartItem.quantity + quantity });

                await trx('products')
                    .where('product_id', productId)
                    .update({ quantity_in_stock: newStock });
            }

            await trx.commit();
            res.status(200).json({ message: 'Cart and product quantities updated successfully' });
        } catch (error) {
            await trx.rollback();
            res.status(400).json({ error: error.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

// Delete cart item
async function deleteCartItem(req, res) {
    const { cartId } = req.params;

    const trx = await knex.transaction();
    try {
        const cartItem = await trx('carts').where('id', cartId).first();
        if (!cartItem) throw new Error('Cart item not found.');

        await trx('products')
            .where('product_id', cartItem.product_id)
            .increment('quantity_in_stock', cartItem.quantity);

        await trx('carts').where('id', cartId).del();
        await trx.commit();

        res.status(200).json({ message: 'Cart item deleted successfully' });
    } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: 'Failed to delete cart item', details: error.message });
    }
}

module.exports = {
    moveToCart,
    getCartItems,
    updateCartItemQuantity,
    deleteCartItem,
    importCartData,
};
