const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { signupValidation } = require('../validations/userValidation');
const dotenv = require('dotenv');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const vendorModel = require('../models/vendorModel');
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const knex = require('../mysql/connection');
const productToVendorModel = require('../models/productToVendor');
const cartsModel = require('../models/cartsModel');
const crypto=require('crypto');
dotenv.config();

 
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
   
  },
}); 
async function uploadToS3(fileBuffer, fileName, mimeType, userId) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `yash@0768/${userId}/${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
  };
 
  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

module.exports = {
  uploadToS3,
  
  async signup(req, res, next) {
    try {
      const { error } = signupValidation.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const { first_name, last_name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const username = `${first_name} ${last_name}`;

      await userModel.createUser({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        username,
      });

      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userModel.findByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async getUserDetails(req, res, next) {
    try {
      const user = await userModel.findEmail(req.user.email); // Fetch user by email from token
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic || null,
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadProfilePhoto(req, res, next) {
    try {
      const file = req.file;  // Get file from request

      const processedImage = await sharp(file.buffer)
        .resize(200, 200)  // Resize to 200x200
        .toBuffer();

      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `profile_photos/${Date.now()}_${file.originalname}`, 
        Body: processedImage,
        ContentType: file.mimetype,  
      };

      const command = new PutObjectCommand(s3Params);
      const s3Response = await s3.send(command);

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

      await userModel.updateProfilePic(req.user.email, fileUrl);

      res.status(200).json({ message: 'Profile picture updated successfully!', url: fileUrl });
    } catch (err) {
      next(err);
    }
  },

  async getVendorCount(req, res) {
    try {
      const count = await knex('vendors').count('vendor_id as count').first();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error fetching vendor count:', error);
      res.status(500).json({ message: 'Error fetching vendor count' });
    }
  },

  async getProducts(req, res) {
    try {
      let { page = 1, limit = 10 } = req.query;

      page = parseInt(page); 
      limit = parseInt(limit); 
      const offset = (page - 1) * limit;

      const allProducts = await knex('products')
        .join('categories', 'products.category_id', '=', 'categories.category_id')
        .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
        .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
        .select('products.*', 'categories.category_name', 'vendors.vendor_name')
        .where('products.status', 1); 

      const groupedProducts = allProducts.reduce((acc, product) => {
        const { product_id, vendor_name, ...productData } = product;

        if (!acc[product_id]) {
          acc[product_id] = { ...product, vendors: [] };
        }

        if (vendor_name) {
          acc[product_id].vendors.push(vendor_name);
        }

        return acc;
      }, {});

      const productList = Object.values(groupedProducts);

      const totalItems = productList.length;
      const paginatedProducts = productList.slice(offset, offset + limit);

      res.json({
        products: paginatedProducts,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  },

  async addProduct(req, res, next) {
    try {
      const { productName, category, vendor, quantity, unitPrice, unit, status } = req.body;
      let productImage = null;

      if (req.file) {
        const processedImage = await sharp(req.file.buffer)
          .resize(50, 50)  
          .toBuffer();

        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `product_images/${Date.now()}_${req.file.originalname}`, 
          Body: processedImage,
          ContentType: req.file.mimetype,  
        };
        const command = new PutObjectCommand(s3Params);
        const s3Response = await s3.send(command);

        productImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
      }

      const productData = {
        product_name: productName,
        category_id: category,
        quantity_in_stock: quantity,
        unit_price: unitPrice,
        product_image: productImage,
        status: status,
        unit: unit,
      };

      const [productId] = await productModel.createProduct(productData);

      const productToVendorData = {
        product_id: productId,
        vendor_id: vendor,
        status: 1,
      };

      await productModel.createProductToVendor(productToVendorData);

      res.status(201).json({ message: 'Product added successfully', product: { ...productData, product_id: productId } });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await categoryModel.getAllCategories();
      res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  },

  async getVendors(req, res, next) {
    try {
      const vendors = await vendorModel.getAllVendors();
      res.status(200).json({ vendors });
    } catch (err) {
      next(err);
    }
  },

  async uploadProductImage(req, res, next) {
    try {
      const { productId } = req.body;
      const file = req.file;

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const processedImage = await sharp(file.buffer)
        .resize(50, 50)  
        .toBuffer();

      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `product_images/${Date.now()}_${file.originalname}`, 
        Body: processedImage,
        ContentType: file.mimetype,  
      };

      const command = new PutObjectCommand(s3Params);
      const s3Response = await s3.send(command);

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

      await productModel.updateProduct(productId, { product_image: fileUrl });

      res.status(200).json({ message: 'Product image uploaded and updated successfully!', url: fileUrl });
    } catch (err) {
      next(err);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const productData = req.body;

      const productObj = JSON.parse(JSON.stringify(productData));
      delete productObj.vendor_id;

      await knex.transaction(async (trx) => {
        await trx('products').where('product_id', productId).update(productObj);

        if (req.file) {
          const file = req.file;

          const processedImage = await sharp(file.buffer)
            .resize(50, 50)  
            .toBuffer();

          const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `product_images/${Date.now()}_${file.originalname}`, 
            Body: processedImage,
            ContentType: file.mimetype,  
          };

          const command = new PutObjectCommand(s3Params);
          await s3.send(command);

          const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

          await trx('products').where('product_id', productId).update({ product_image: fileUrl });
        }

        if (productData.vendor_id) {
          const productToVendorData = {
            product_id: productData.product_id,
            vendor_id: productData.vendor_id,
            status: 1, 
          };

          const existing = await trx('product_to_vendor')
            .where('product_id', productData.product_id)
            .andWhere('vendor_id', productData.vendor_id)
            .first();

          if (existing) {
            await trx('product_to_vendor')
              .where('id', existing.id)
              .update({
                status: 1,
                updated_at: trx.fn.now(),
              });
          } else {
            await trx('product_to_vendor').insert(productToVendorData);
          }
        }

        if (productData.category_id) {
          await trx('categories')
            .where('category_id', productData.category_id)
            .update({ status: 1 });

          await trx('products').where('product_id', productId).update({ category_id: productData.category_id });
        }

        if (productData.vendor_id) {
          const vendorData = {
            vendor_name: productData.vendor_name, 
            status: 1,
          };
          await trx('vendors').where('vendor_id', productData.vendor_id).update(vendorData);
        }
      });

      res.status(200).json({ message: 'Product updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async deleteProduct(req, res, next) {
    const { productId } = req.params;

    try {
      await knex.transaction(async (trx) => {
        await trx('products')
          .where('product_id', productId)
          .update({ status: 99 });

        await trx('product_to_vendor')
          .where('product_id', productId)
          .update({ status: 99 });
      });

      return res.status(200).json({ message: 'Product and related vendors deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
  },

  

   // Import data controller
   async importFile(req, res) {
    try {
      const { file } = req;
      const userId = req.user.id;
   
      if (!file || !userId) {
        return res.status(400).json({ error: 'File or User ID missing' });
      }
   
       // Compute file checksum (SHA-256)
       const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
       console.log('hash',hash);
   
   
      // Upload the file to S3
      const fileUrl = await uploadToS3(file.buffer, file.originalname, file.mimetype, userId);
   
      // Insert into import_files table with "pending" status
      const [fileId] = await knex('import_files').insert({
        user_id: userId,
        file_url: fileUrl,
        file_name: file.originalname,
        checksum: hash,
        status: 'pending',
      });
   
      res.status(200).json({ message: 'File uploaded successfully, processing in background.', fileId, fileUrl });
   
    } catch (error) {
      console.error('Error importing file:', error);
      res.status(500).json({ error: 'File import failed' });
    }
    },

    async retrieveFiles(req, res) {
      try {
        // Assuming user ID is stored in req.user (after authentication)
        const userId = req.user.id;
        console.log('user id :::', userId);
       
        // Fetch the import files for the logged-in user
        const importFiles = await knex('import_files')
          .where('user_id', userId)
          .select('id', 'file_name', 'status', 'error_file_url');
     
     
          console.log('****',importFiles);
       
        // Return the data as JSON response
        res.json(importFiles);
      } catch (error) {
        console.error('Error fetching import files:', error);
        res.status(500).json({ error: 'Failed to fetch import files' });
      }
    },

 
};