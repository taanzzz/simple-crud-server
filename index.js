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
  }
});

let plantCollection;

async function run() {
  try {
    await client.connect();
    console.log('MongoDB Connected');

    const db = client.db('plantCareDB');
    plantCollection = db.collection('plants');

    
    app.get('/', (req, res) => {
      res.send('🌱Plant Care Tracker Server is Running!');
    });

    
    app.post('/plants', async (req, res) => {
      try {
        const plant = req.body;
        const result = await plantCollection.insertOne(plant);
        res.send(result);
      } catch (err) {
        console.error('POST /plants error:', err);
        res.status(500).send({ error: 'Failed to add plant' });
      }
    });

    
    app.get('/plants', async (req, res) => {
      try {
        const plants = await plantCollection.find().toArray();
        res.send(plants);
      } catch (err) {
        console.error('GET /plants error:', err);
        res.status(500).send({ error: 'Failed to fetch plants' });
      }
    });

    
    app.get('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const plant = await plantCollection.findOne({ _id: new ObjectId(id) });
        res.send(plant);
      } catch (err) {
        console.error('GET /plants/:id error:', err);
        res.status(500).send({ error: 'Failed to get plant' });
      }
    });

    
    app.get('/my-plants/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const userPlants = await plantCollection.find({ userEmail: email }).toArray();
        res.send(userPlants);
      } catch (err) {
        console.error('GET /my-plants/:email error:', err);
        res.status(500).send({ error: 'Failed to fetch user plants' });
      }
    });

   
    app.put('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedPlant = { ...req.body };
        delete updatedPlant._id; // remove _id if present

        const result = await plantCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedPlant }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Plant not found' });
        }

        res.send({ message: 'Plant updated successfully', modifiedCount: result.modifiedCount });
      } catch (err) {
        console.error('❌ PUT /plants/:id error:', err);
        res.status(500).send({ error: 'Failed to update plant' });
      }
    });

    
    app.delete('/plants/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        console.error('❌ DELETE /plants/:id error:', err);
        res.status(500).send({ error: 'Failed to delete plant' });
      }
    });

   
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}

run();