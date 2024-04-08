const {Category} = require('../models/category');
const {Product} = require('../models/product');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage })

// http://localhost:3000/api/v1/products
router.get(`/`, async (req, res) => {
    let filter = {};
    if(req.query.categories) {
        filter = {category: req.query.categories.split(',')}
    }
    
    const productList = await Product.find(filter).populate('category');
    if(!productList) {
        res.status(500).json({success: false})
    }
    res.send(productList); 
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category");
 
    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.body.category);
        if(!category) return res.status(400).send('Invalid Category ID')

        const file = req.file;
        if(!file) return res.status(400).send('No image in the request')

        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        const imagePath = `${basePath}${fileName}`;

        let product = new Product({
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath, // Single image
            images: [imagePath], // Add single image to images array
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        })

        product = await product.save();
        res.send(product);
    } catch (error) {
        console.error("Product creation error:", error);
        res.status(500).send(error.message);
    }
});


router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product ID')
    }

    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category ID')

    const file = req.file;
    let imagePath;

    if(file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            $set: req.body,
            ...(file && { image: imagePath, images: [imagePath] }) // Update both image and images array if file is uploaded
        },
        { new: true }
    );

    if(!updatedProduct)
        return res.status(500).send('Product cannot be updated!')

    res.send(updatedProduct);
});


router.delete('/:id', (req, res) => {
    Product.findByIdAndDelete(req.params.id).then(product => {
        if(product) {
            return res.status(200).json({success: true, message: 'Product deleted successfully'})
        } else {
            return res.status(404).json({success: false, message: 'Product not found'})
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err})
    })
});

router.get(`/get/count`, async (req, res) =>{
    try {
        const productCount = await Product.countDocuments();

        res.send({
            productCount: productCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})


router.get('/get/featured/:count', async (req, res) =>{
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({isFeatured: true}).limit(+count);

    if(!products) {
        res.status(500).json({success: false})
    }

    res.send(products);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product ID')
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    
    if(files) {
        files.map(async file => {
            imagesPaths.push(`${basePath}${file.filename}`);
        })
    }
    
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        {new: true}
    )

    if(!product)
    return res.status(500).send('Product cannot be updated!')

    res.send(product);
})
module.exports = router;