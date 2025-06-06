import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

// Generate a simple UUID-like string
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function POST(request: NextRequest) {
  try {
    console.log("Ingest API called")
    const body = await request.json()
    console.log("Request body:", body)

    const { ids, priority } = body

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.log("Invalid ids:", ids)
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 })
    }

    if (!priority || !["HIGH", "MEDIUM", "LOW"].includes(priority)) {
      console.log("Invalid priority:", priority)
      return NextResponse.json({ error: "priority must be HIGH, MEDIUM, or LOW" }, { status: 400 })
    }

    // Validate ID range
    for (const id of ids) {
      if (!Number.isInteger(id) || id < 1 || id > 1000000007) {
        console.log("Invalid ID:", id)
        return NextResponse.json({ error: "ids must be integers between 1 and 10^9+7" }, { status: 400 })
      }
    }

    console.log("Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("Database connected")

    const ingestionId = generateId()
    console.log("Generated ingestion ID:", ingestionId)

    // Create batches of max 3 IDs each
    const batches = []
    for (let i = 0; i < ids.length; i += 3) {
      const batchIds = ids.slice(i, i + 3)
      batches.push({
        batch_id: generateId(),
        ids: batchIds,
        status: "yet_to_start",
        created_at: new Date(),
      })
    }

    console.log("Created batches:", batches.length)

    // Store ingestion request
    const ingestionRequest = {
      ingestion_id: ingestionId,
      priority,
      status: "yet_to_start",
      batches,
      created_at: new Date(),
      updated_at: new Date(),
    }

    console.log("Inserting ingestion request...")
    await db.collection("ingestions").insertOne(ingestionRequest)
    console.log("Ingestion request inserted")

    // Add batches to processing queue
    const priorityValue = { HIGH: 3, MEDIUM: 2, LOW: 1 }[priority]

    console.log("Adding batches to queue...")
    for (const batch of batches) {
      await db.collection("processing_queue").insertOne({
        ingestion_id: ingestionId,
        batch_id: batch.batch_id,
        ids: batch.ids,
        priority: priorityValue,
        status: "queued",
        created_at: new Date(),
      })
    }
    console.log("Batches added to queue")

    // Trigger background processing
    processQueue().catch(console.error)

    console.log("Returning response with ingestion_id:", ingestionId)
    return NextResponse.json({ ingestion_id: ingestionId })
  } catch (error) {
    console.error("Ingest API error:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

// Background processing function
async function processQueue() {
  try {
    console.log("Processing queue...")
    const { db } = await connectToDatabase()

    // Check if we're already processing (simple rate limiting)
    const isProcessing = await db.collection("processing_state").findOne({
      key: "is_processing",
    })

    if (isProcessing?.value) {
      console.log("Already processing, skipping...")
      return // Already processing
    }

    // Set processing flag
    await db
      .collection("processing_state")
      .updateOne({ key: "is_processing" }, { $set: { value: true, updated_at: new Date() } }, { upsert: true })

    // Get next batch to process (highest priority, oldest first)
    const nextBatch = await db
      .collection("processing_queue")
      .findOne({ status: "queued" }, { sort: { priority: -1, created_at: 1 } })

    if (nextBatch) {
      console.log("Processing batch:", nextBatch.batch_id)

      // Update batch status to triggered
      await db
        .collection("processing_queue")
        .updateOne({ _id: nextBatch._id }, { $set: { status: "processing", started_at: new Date() } })

      // Update ingestion status
      await updateIngestionStatus(nextBatch.ingestion_id, nextBatch.batch_id, "triggered")

      // Simulate processing (external API call)
      setTimeout(async () => {
        try {
          // Simulate API processing time
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const { db } = await connectToDatabase()

          // Mark batch as completed
          await db.collection("processing_queue").updateOne(
            { _id: nextBatch._id },
            {
              $set: {
                status: "completed",
                completed_at: new Date(),
                result: nextBatch.ids.map((id) => ({ id, data: "processed" })),
              },
            },
          )

          // Update ingestion status
          await updateIngestionStatus(nextBatch.ingestion_id, nextBatch.batch_id, "completed")

          // Clear processing flag and continue with next batch after rate limit
          await db
            .collection("processing_state")
            .updateOne({ key: "is_processing" }, { $set: { value: false, updated_at: new Date() } })

          // Schedule next processing after 5 seconds (rate limit)
          setTimeout(() => processQueue(), 5000)
        } catch (error) {
          console.error("Processing error:", error)
          const { db } = await connectToDatabase()
          await db
            .collection("processing_state")
            .updateOne({ key: "is_processing" }, { $set: { value: false, updated_at: new Date() } })
        }
      }, 0)
    } else {
      console.log("No batches to process")
      // No batches to process, clear flag
      await db
        .collection("processing_state")
        .updateOne({ key: "is_processing" }, { $set: { value: false, updated_at: new Date() } })
    }
  } catch (error) {
    console.error("Process queue error:", error)
  }
}

async function updateIngestionStatus(ingestionId: string, batchId: string, batchStatus: string) {
  try {
    const { db } = await connectToDatabase()

    // Update batch status in ingestion document
    await db.collection("ingestions").updateOne(
      { ingestion_id: ingestionId, "batches.batch_id": batchId },
      {
        $set: {
          "batches.$.status": batchStatus,
          updated_at: new Date(),
        },
      },
    )

    // Calculate overall status
    const ingestion = await db.collection("ingestions").findOne({ ingestion_id: ingestionId })
    if (ingestion) {
      const batchStatuses = ingestion.batches.map((b) => b.status)
      let overallStatus = "yet_to_start"

      if (batchStatuses.every((status) => status === "completed")) {
        overallStatus = "completed"
      } else if (batchStatuses.some((status) => status === "triggered" || status === "completed")) {
        overallStatus = "triggered"
      }

      await db
        .collection("ingestions")
        .updateOne({ ingestion_id: ingestionId }, { $set: { status: overallStatus, updated_at: new Date() } })
    }
  } catch (error) {
    console.error("Update ingestion status error:", error)
  }
}