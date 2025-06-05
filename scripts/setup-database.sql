-- Database setup for Data Ingestion API
-- This script creates the necessary collections and indexes

-- Note: MongoDB doesn't use traditional SQL, but this represents the structure

-- Collections that will be created:
-- 1. ingestions - stores ingestion requests and their batches
-- 2. processing_queue - queue for batch processing
-- 3. processing_state - tracks processing state for rate limiting

-- Indexes for performance:
-- ingestions: { ingestion_id: 1 }
-- processing_queue: { status: 1, priority: -1, created_at: 1 }
-- processing_state: { key: 1 }

-- Sample document structures:

-- ingestions collection:
{
  "ingestion_id": "uuid",
  "priority": "HIGH|MEDIUM|LOW",
  "status": "yet_to_start|triggered|completed",
  "batches": [
    {
      "batch_id": "uuid",
      "ids": [1, 2, 3],
      "status": "yet_to_start|triggered|completed",
      "created_at": "ISODate"
    }
  ],
  "created_at": "ISODate",
  "updated_at": "ISODate"
}

-- processing_queue collection:
{
  "ingestion_id": "uuid",
  "batch_id": "uuid", 
  "ids": [1, 2, 3],
  "priority": 3, -- 3=HIGH, 2=MEDIUM, 1=LOW
  "status": "queued|processing|completed",
  "created_at": "ISODate",
  "started_at": "ISODate",
  "completed_at": "ISODate",
  "result": [
    {"id": 1, "data": "processed"},
    {"id": 2, "data": "processed"},
    {"id": 3, "data": "processed"}
  ]
}

-- processing_state collection:
{
  "key": "is_processing",
  "value": true,
  "updated_at": "ISODate"
}
