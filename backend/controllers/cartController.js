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
        console.log("userId in cartitems : ", userId);
    
        // Fetch the total count of cart items for the user where quantity > 0 and product is available
        const totalItemsQuery = knex('carts')
          .count('* as total')
          .where('user_id', userId)
          .andWhere('quantity', '>', 0) // Ensure quantity is greater than 0
          .join('products', 'carts.product_id', '=', 'products.product_id')
          .andWhere('products.status', '=', 1) // Ensure the product is available
          .first();
    
        const cartItemsQuery = knex('carts')
      .join('products', 'carts.product_id', '=', 'products.product_id')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .join('product_to_vendor', function () {
        this.on('products.product_id', '=', 'product_to_vendor.product_id')
          .andOn('carts.vendor_id', '=', 'product_to_vendor.vendor_id'); // Ensure cart's vendor matches
      })
      .join('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
      .select(
        'carts.id',
        'products.product_id',
        'products.product_name',
        'products.product_image',
        'categories.category_name',
        'vendors.vendor_name',
        'carts.quantity',
        'carts.quantity as initialQuantity',
        'products.quantity_in_stock'
      )
      .where('carts.user_id', userId)  // Replace userId with the actual user ID or a parameter
      .andWhere('carts.quantity', '>', 0) // Ensure quantity is greater than 0
      .andWhere('products.status', '=', 1) // Ensure the product is available
      .limit(limit) // Limit the number of results
      .offset(offset) // Offset the results for pagination
      .debug(); // Debugging to see the SQL query
    
    
        // Execute both queries in parallel
        const [totalResult, cartItems] = await Promise.all([totalItemsQuery, cartItemsQuery]);
    
         console.log('totalResult:', totalResult);
        console.log('cartItems:', cartItems);
       
        
        // If no cart items are found for the user, respond with an empty list
        if (!totalResult.total || cartItems.length === 0) {
          return res.status(200).json({
            success: true,
            total: 0,
            page: Number(page),
            limit: Number(limit),
            products: [],
          });
        }
    
        // Return the cart items and total count
        res.json({
          success: true,
          total: totalResult.total,
          page: Number(page),
          limit: Number(limit),
          products: cartItems,
        });
      } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
}
async  function updateCartQty(req, res) {
  try {
    const { productId, diff } = req.body.payload; // Receive the product ID and diff from the request body
    const userId = req.user.id;


    console.log('Product ID:', productId);
    console.log('Difference:', diff);
    console.log(userId);

    // Start a transaction
    const trx = await knex.transaction();

    try {
      // Fetch the current product details from the products table
      const product = await trx('products').where('product_id', productId).first();
      if (!product) {
        throw { success: false, status: 404, error: 'Product not found', productId };
      }

      // Update the quantity_in_stock in the products table
      const newStock = product.quantity_in_stock - diff; // Add the diff to the stock
      if (newStock < 0) {
        throw { success: false, status: 400, error: 'Insufficient stock', productId };
      }
      console.log('newstock', newStock);

      await trx('products')
        .where('product_id', productId)
        .update({ quantity_in_stock: newStock });

      // Fetch the current cart item details
      const cartItem = await trx('carts')
        .where('product_id', productId)
        .andWhere('user_id', userId)
        .first();

      if (!cartItem) {
        throw { success: false, status: 404, error: 'Cart item not found', productId };
      }

      // Update the quantity in the cart table
      const updatedCartQuantity = cartItem.quantity + diff; // Reduce the quantity in the cart by the diff
      if (updatedCartQuantity < 0) {
        throw { success: false, status: 400, error: 'Invalid cart quantity', productId };
      }
      console.log('****',updatedCartQuantity);

      await trx('carts')
        .where('product_id', productId)
        .andWhere('user_id', userId)
        .update({ quantity: updatedCartQuantity });

      // Commit the transaction
      await trx.commit();

      return res.status(200).json({
        message: 'Cart and product updated successfully',
        productId,
        newStock,
        updatedCartQuantity,
      });
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback();
      console.error('Transaction error:', error);

      if (error.success === false) {
        return res.status(error.status).json({ error: error.error, productId: error.productId });
      }

      throw error; // Rethrow unexpected errors
    }
  } catch (error) {
    console.error('Error updating cart and product quantities:', error);
    return res.status(500).json({ error: 'Failed to update cart and product quantities' });
  }
}
// Update cart item quantities
async function updateCartItemQuantity(req, res) {

  try {
    const userId = req.user.id;
    console.log(req.user)
    const parsedData = req.body
    // Start a transaction
    const trx = await knex.transaction();

    try {
      for (const { productId, quantity } of parsedData.products) {
        console.log("Product_Id:", productId);
        console.log("quantity:", quantity);
        console.log("UserId:", userId);

        // Fetch current product details from the products table
        const product = await trx('products').where('product_id', productId).first();
        if (!product) {
          throw { success: false, status: 404, error: 'Product not found', productId };
        }

        // Calculate the new stock based on change in quantity
        const newStock = product.quantity_in_stock - quantity;
        if (newStock < 0) {
          throw { success: false, status: 400, error: 'Not enough stock available', productId };
        }

        // Fetch current cart item details
        const cartItem = await trx('carts')
          .where('product_id', productId)
          .andWhere('user_id', userId)
          .first();

        if (!cartItem) {
          throw { success: false, status: 404, error: 'Cart item not found', productId };
        }

        // Calculate the updated cart quantity
        const updatedCartQuantity = cartItem.quantity + quantity;

        if (updatedCartQuantity < 0) {
          throw { success: false, status: 400, error: 'Invalid cart quantity', productId };
        }

        // Update the quantity in the cart table
        await trx('carts')
          .where('product_id', productId)
          .andWhere('user_id', userId)
          .update({ quantity: updatedCartQuantity });

        // Update the product's stock in the products table
        await trx('products')
          .where('product_id', productId)
          .update({ quantity_in_stock: newStock });
      }

      // Commit the transaction if all operations succeed
      await trx.commit();

      return res.status(200).json({ message: 'Cart and product updated successfully' });
    } catch (error) {
      await trx.rollback();
      console.error('Transaction error:', error);

      if (error.success === false) {
        return res.status(error.status).json({ error: error.error, productId: error.productId });
      }

      throw error; // Rethrow unexpected errors
    }
  } catch (error) {
    console.error('Error in updating cart items and products:', error);
    return res.status(500).json({ error: 'Failed to update cart items and products' });
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
