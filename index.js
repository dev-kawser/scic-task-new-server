const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://productprism.netlify.app'
    ]
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.euq4zn2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        const productsCollection = client.db('newScicTask').collection('products');


        // API to add products
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });


        // API to get products with pagination
        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 9;
            const skip = (page - 1) * limit;
        
            const { search, category, brand, priceRange, sort } = req.query;
        
            let query = {};
            if (search) query.name = { $regex: search, $options: 'i' };
            if (category) query.category = category;
            if (brand) query.brand = brand;
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                query.price = { $gte: min, $lte: max };
            }
        
            let sortOption = {};
            if (sort === 'price-asc') sortOption = { price: 1 };
            if (sort === 'price-desc') sortOption = { price: -1 };
            if (sort === 'date-newest') sortOption = { createdAt: -1 };
        
            const products = await productsCollection.find(query).sort(sortOption).skip(skip).limit(limit).toArray();
            const totalProducts = await productsCollection.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);
        
            res.send({
                products,
                totalProducts,
                totalPages,
                currentPage: page,
            });
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Do not close the connection here as the app needs to remain connected.
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
