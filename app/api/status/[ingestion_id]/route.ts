import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { ingestion_id: string } }) {
  try {
    const ingestionId = params.ingestion_id

    if (!ingestionId) {
      return NextResponse.json({ error: "ingestion_id is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const ingestion = await db.collection("ingestions").findOne({
      ingestion_id: ingestionId,
    })

    if (!ingestion) {
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

    return NextResponse.json(response)
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
