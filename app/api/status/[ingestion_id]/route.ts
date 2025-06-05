import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { ingestion_id: string } }) {
  try {
    console.log("Status API called for:", params.ingestion_id)
    const ingestionId = params.ingestion_id

    if (!ingestionId) {
      console.log("No ingestion_id provided")
      return NextResponse.json({ error: "ingestion_id is required" }, { status: 400 })
    }

    console.log("Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("Database connected, searching for ingestion...")

    const ingestion = await db.collection("ingestions").findOne({
      ingestion_id: ingestionId,
    })

    console.log("Ingestion found:", !!ingestion)

    if (!ingestion) {
      console.log("Ingestion not found for ID:", ingestionId)
      return NextResponse.json({ error: "Ingestion not found" }, { status: 404 })
    }

    // Format response
    const response = {
      ingestion_id: ingestion.ingestion_id,
      status: ingestion.status,
      batches: ingestion.batches.map((batch) => ({
        batch_id: batch.batch_id,
        ids: batch.ids,
        status: batch.status,
      })),
    }

    console.log("Returning status response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}