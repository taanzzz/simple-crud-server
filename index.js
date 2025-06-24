require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let plantCollection;

async function run() {
  try {
    await client.connect();
    console.log('✅ MongoDB Connected');

    const db = client.db('plantCareDB');
    plantCollection = db.collection('plants');

    // Routes
    app.get('/', (req, res) => {
      res.send('🌱 Plant Care Tracker Server is Running!');
    });

    app.post('/plants', async (req, res) => {
      try {
        const result = await plantCollection.insertOne(req.body);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: 'Failed to add plant' });
      }
    });

    app.get('/plants', async (req, res) => {
      try {
        const plants = await plantCollection.find().toArray();
        res.send(plants);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch plants' });
      }
    });

    app.get('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const plant = await plantCollection.findOne({ _id: new ObjectId(id) });
        res.send(plant);
      } catch (err) {
        res.status(500).send({ error: 'Failed to get plant' });
      }
    });

    app.get('/my-plants/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const userPlants = await plantCollection.find({ userEmail: email }).toArray();
        res.send(userPlants);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch user plants' });
      }
    });

    app.put('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedPlant = { ...req.body };
        delete updatedPlant._id;

        const result = await plantCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedPlant }
        );

        res.send({ message: 'Updated', result });
      } catch (err) {
        res.status(500).send({ error: 'Failed to update plant' });
      }
    });

    app.delete('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: 'Failed to delete plant' });
      }
    });

    // ✅ This runs only locally, NOT on Vercel
    if (process.env.NODE_ENV !== 'production') {
      app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}

run();

// ✅ Vercel needs this to export the app
module.exports = app;
