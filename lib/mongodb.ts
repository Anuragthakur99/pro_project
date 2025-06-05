import { MongoClient, type Db } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://anuragthkr009:TtmG5J041Z3SooQF@cluster0.n5g7wx2.mongodb.net/"
const MONGODB_DB = process.env.MONGODB_DB || "data_ingestion_api"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

interface MongoConnection {
  client: MongoClient
  db: Db
}

let cachedConnection: MongoConnection | null = null

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cachedConnection) {
    try {
      // Test the connection
      await cachedConnection.client.db("admin").command({ ping: 1 })
      return cachedConnection
    } catch (error) {
      console.log("Cached connection failed, creating new one...")
      cachedConnection = null
    }
  }

  try {
    console.log("Creating new MongoDB connection...")
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    await client.connect()
    console.log("MongoDB client connected")

    const db = client.db(MONGODB_DB)
    console.log("Database selected:", MONGODB_DB)

    // Test the connection
    await db.command({ ping: 1 })
    console.log("Database ping successful")

    cachedConnection = { client, db }

    console.log("Connected to MongoDB successfully")
    return cachedConnection
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw new Error(`Failed to connect to MongoDB: ${error.message}`)
  }
}