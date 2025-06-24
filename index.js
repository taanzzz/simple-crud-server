require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000; // Keep for local testing if needed

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

let plantCollection; // Declare it here

// Connect to MongoDB and set up routes inside an async function
async function initializeApp() {
  try {
    await client.connect();
    console.log('✅ MongoDB Connected');

    const db = client.db('plantCareDB');
    plantCollection = db.collection('plants');

    // Define all your routes AFTER MongoDB is connected and collection is ready
    app.get('/', (req, res) => {
      res.send('🌱 Plant Care Tracker Server is Running!');
    });

    app.post('/plants', async (req, res) => {
      try {
        const result = await plantCollection.insertOne(req.body);
        res.send(result);
      } catch (err) {
        console.error("Error adding plant:", err); // Log error for debugging
        res.status(500).send({ error: 'Failed to add plant', details: err.message });
      }
    });

    app.get('/plants', async (req, res) => {
      try {
        const plants = await plantCollection.find().toArray();
        res.send(plants);
      } catch (err) {
        console.error("Error fetching plants:", err);
        res.status(500).send({ error: 'Failed to fetch plants', details: err.message });
      }
    });

    app.get('/plants/:id', async (req, res) => {
      try {
        const plant = await plantCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!plant) {
          return res.status(404).send({ error: 'Plant not found' });
        }
        res.send(plant);
      } catch (err) {
        console.error("Error getting plant by ID:", err);
        res.status(500).send({ error: 'Failed to get plant', details: err.message });
      }
    });

    app.get('/my-plants/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const userPlants = await plantCollection.find({ userEmail: email }).toArray();
        res.send(userPlants);
      } catch (err) {
        console.error("Error fetching user plants:", err);
        res.status(500).send({ error: 'Failed to fetch user plants', details: err.message });
      }
    });

    app.put('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedPlant = { ...req.body };
        delete updatedPlant._id; // _id should not be updated

        const result = await plantCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedPlant }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({ error: 'Plant not found for update' });
        }
        res.send({ message: 'Updated', result });
      } catch (err) {
        console.error("Error updating plant:", err);
        res.status(500).send({ error: 'Failed to update plant', details: err.message });
      }
    });

    app.delete('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).send({ error: 'Plant not found for deletion' });
        }
        res.send(result);
      } catch (err) {
        console.error("Error deleting plant:", err);
        res.status(500).send({ error: 'Failed to delete plant', details: err.message });
      }
    });

    // Local testing only
    if (process.env.NODE_ENV !== 'production') {
      app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
      });
    }

  } catch (err) {
    console.error('❌ Failed to initialize app:', err);
    // Exit process or handle error appropriately if connection fails
    process.exit(1); // Exit if cannot connect to DB
  }
}

// Call the initialization function immediately
initializeApp();

// Export the app. Vercel will wait for the async initialization to complete
// if you configure it correctly, or more reliably, use a serverless function
// that directly handles the request and calls the initialized app.
// For a simple Express app, Vercel will often "warm up" the function by
// calling it once, which will trigger initializeApp().
module.exports = app;