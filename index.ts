import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { Request, Response } from "express";

interface Product {
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  createdAt?: Date;
}

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




// Replace the placeholder with your Atlas connection string
const uri = process.env.MONGODB_URI!;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function run() {
  try {

    await client.connect();
    const db = client.db('gadget-galaxy')
    const productsCollection = db.collection("products");
    const usersCollection = db.collection("user")
    const ordersCollection = db.collection("order")



    app.get("/products", async (req, res) => {
  const {
    page = 1,
    limit = 8,
    search,
    category,
    brand,
    sort,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {};

  // Search by product name
  if (search) {
    query.name = {
      $regex: search,
      $options: "i",
    };
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by brand
  if (brand) {
    query.brand = brand;
  }

  // Sort products
  let sortOption = {};

  if (sort === "lowToHigh") {
    sortOption = { price: 1 };
  } else if (sort === "highToLow") {
    sortOption = { price: -1 };
  } else {
    sortOption = { createdAt: -1 };
  }

  try {
    const result = await productsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const totalData =
      await productsCollection.countDocuments(query);

    const totalPage = Math.ceil(
      totalData / Number(limit)
    );

    res.send({
      data: result,
      page: Number(page),
      totalPage,
      totalData,
    });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.send(product);
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

    // .....................Admin Route.....................
    // add product route
    app.post("/api/add-product", async (req: Request, res: Response) => {
      console.log(req)
      try {
        const productData: Product = {
          ...req.body,
          createdAt: new Date(),
        };

        const result = await productsCollection.insertOne(productData);

        res.send(result);
      } catch (error) {
        console.log(error);

        res.status(500).send({
          success: false,
          message: "Failed to add product.",
        });
      }
    });

     // get manageProduct route
    app.get("/api/manage-products", async (req: Request, res: Response) => {
      const result = await productsCollection.find().toArray();

      res.send(result);
    });

//     // Delete manageProduct route 
    app.delete("/api/products/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await productsCollection.deleteOne(query);

      res.send(result);
    });

//     // Update product route
    app.patch("/api/products-update/:id", async (req, res) => {
      const id = req.params.id;

      const updatedProduct = req.body;

      const query = {
        _id: new ObjectId(id),
      };

      const updateDoc = {
        $set: updatedProduct,
      };

      const result = await productsCollection.updateOne(query, updateDoc);

      res.send(result);
    });

// get user route
    app.get("/api/users", async (req, res) => {
      const result = await usersCollection.find().toArray();

      res.send(result);
    });
    
  // manage user delete
    app.delete("/api/users/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await usersCollection.deleteOne(query);

      res.send(result);
    });



    // .............. user route ..........
// add order 
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;

    orderData.status = "Pending";
    orderData.createdAt = new Date();

    const result = await ordersCollection.insertOne(orderData);

    res.send(result);
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});
// my order route
app.get("/api/orders/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const result = await ordersCollection .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(result);
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});










    const result = await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    return result;
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);






app.get("/", (req, res) => {
  res.send("Gadget Galaxy Server is Running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});