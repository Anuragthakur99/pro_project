# Data Ingestion API System

A robust API system for batch processing data with priority queuing and rate limiting, built with Next.js and MongoDB.

## 🚀 Features

- **Batch Processing**: Automatically splits requests into batches of maximum 3 IDs
- **Priority Queue**: Processes HIGH, MEDIUM, LOW priority requests in order
- **Rate Limiting**: Respects 1 batch per 5 seconds limit
- **Async Processing**: Background job processing with status tracking
- **MongoDB Storage**: Persistent storage for requests and processing state
- **Comprehensive Testing**: Extensive test suite with validation

## 📋 API Endpoints

### POST /api/ingest
Submit a data ingestion request.

**Request Body:**
\`\`\`json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH"
}
\`\`\`

**Response:**
\`\`\`json
{
  "ingestion_id": "abc123"
}
\`\`\`

### GET /api/status/[ingestion_id]
Check the status of an ingestion request.

**Response:**
\`\`\`json
{
  "ingestion_id": "abc123",
  "status": "triggered",
  "batches": [
    {
      "batch_id": "uuid-1",
      "ids": [1, 2, 3],
      "status": "completed"
    },
    {
      "batch_id": "uuid-2",
      "ids": [4, 5], 
      "status": "triggered"
    }
  ]
}
\`\`\`

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (connection string provided)

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd data-ingestion-api
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the application**
   - Web Interface: http://localhost:3000
   - API Base: http://localhost:3000/api

### Testing

**Run the comprehensive test suite:**
\`\`\`bash
npm test
\`\`\`

**Or test individual endpoints:**
\`\`\`bash
# Test ingestion
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3, 4, 5], "priority": "HIGH"}'

# Test status (replace with actual ingestion_id)
curl http://localhost:3000/api/status/abc123
\`\`\`

## 🏗️ Architecture

### Processing Logic

1. **Request Submission**: IDs are split into batches of max 3 items
2. **Priority Queuing**: Batches queued by priority (HIGH=3, MEDIUM=2, LOW=1) and timestamp
3. **Rate-Limited Processing**: Background processor handles 1 batch every 5 seconds
4. **Status Updates**: Real-time status tracking for ingestions and batches

### Database Schema

**Collections:**
- `ingestions`: Stores ingestion requests and batch information
- `processing_queue`: Priority queue for batch processing
- `processing_state`: Tracks processing state for rate limiting

### Priority Processing Example

\`\`\`
T0: Request 1 - IDs [1,2,3,4,5], Priority: MEDIUM
T4: Request 2 - IDs [6,7,8,9], Priority: HIGH

Processing Order:
T0-T5:   Process [1,2,3] (first batch of Request 1)
T5-T10:  Process [6,7,8] (first batch of Request 2 - higher priority)  
T10-T15: Process [9,4,5] (remaining IDs by priority)
\`\`\`

## 🧪 Test Coverage

The test suite covers:

- ✅ Basic ingestion and status checking
- ✅ Batch size limits (max 3 IDs per batch)
- ✅ Priority-based processing order
- ✅ Input validation and error handling
- ✅ Rate limiting compliance
- ✅ Non-existent resource handling
- ✅ Concurrent request handling

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Deploy automatically**

The MongoDB connection string is already configured for the provided Atlas cluster.

### Environment Variables

No additional environment variables needed - MongoDB connection is pre-configured.

## 📊 Performance Considerations

- **Rate Limiting**: 1 batch per 5 seconds (configurable)
- **Batch Size**: Maximum 3 IDs per batch (configurable)
- **Priority Levels**: 3 levels with timestamp-based ordering
- **Database Indexes**: Optimized for priority queue operations

## 🔧 Configuration

Key configuration options in the code:

\`\`\`javascript
// Batch size limit
const BATCH_SIZE = 3

// Rate limit (milliseconds)
const RATE_LIMIT_MS = 5000

// Priority values
const PRIORITY_VALUES = { HIGH: 3, MEDIUM: 2, LOW: 1 }
\`\`\`

## 📝 API Validation

**Input Validation:**
- IDs must be integers between 1 and 10^9+7
- Priority must be HIGH, MEDIUM, or LOW
- IDs array cannot be empty

**Error Responses:**
- 400: Bad Request (validation errors)
- 404: Not Found (invalid ingestion_id)
- 500: Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
