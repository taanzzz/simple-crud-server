require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();


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

async function initDb() {
  try {
    await client.connect();
    plantCollection = client.db("plantCareDB").collection("plants");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
  }
}
initDb();


function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ error: 'Unauthorized access' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ error: 'Forbidden access' });
    req.decoded = decoded;
    next();
  });
}


app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  res.send({ token });
});


app.post('/plants', async (req, res) => {
  const plant = req.body;
  const result = await plantCollection.insertOne(plant);
  res.send(result);
});


app.get('/plants', async (req, res) => {
  const result = await plantCollection.find().toArray();
  res.send(result);
});


app.get('/plants/:id', async (req, res) => {
  const id = req.params.id;
  const result = await plantCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});


app.get('/my-plants/:email', verifyToken, async (req, res) => {
  const decodedEmail = req.decoded.email;
  const email = req.params.email;

  if (decodedEmail !== email) {
    return res.status(403).send({ error: 'Forbidden access' });
  }

  const result = await plantCollection.find({ userEmail: email }).toArray();
  res.send(result);
});


app.put('/plants/:id', async (req, res) => {
  const id = req.params.id;
  const updatedPlant = req.body;
  const result = await plantCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedPlant }
  );
  res.send(result);
});


app.delete('/plants/:id', async (req, res) => {
  const id = req.params.id;
  const result = await plantCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});


app.get('/', (req, res) => {
  res.send('🌱 Plant Care Tracker Server is Running!');
});


module.exports = app;
