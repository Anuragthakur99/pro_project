import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = "mongodb+srv://anuragthkr009:TtmG5J041Z3SooQF@cluster0.n5g7wx2.mongodb.net/"
const MONGODB_DB = "data_ingestion_api"

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
    return cachedConnection
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db(MONGODB_DB)

    cachedConnection = { client, db }

    console.log("Connected to MongoDB")
    return cachedConnection
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}
