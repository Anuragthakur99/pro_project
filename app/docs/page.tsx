import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Database, Zap, Clock, CheckCircle } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h1>
          <p className="text-gray-600">Complete documentation for the Data Ingestion API System</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Data Ingestion API System is designed to handle batch processing of data with priority queuing and
                rate limiting. It processes a maximum of 3 IDs at a time and respects a rate limit of 1 batch per 5
                seconds.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">MongoDB Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Priority Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Rate Limited</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POST /api/ingest</CardTitle>
              <CardDescription>Submit a data ingestion request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                  {`{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH"
}`}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Parameters</h4>
                <ul className="space-y-2">
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">ids</code> - Array of integers (1 to 10^9+7)
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">priority</code> - Enum: HIGH, MEDIUM, LOW
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                  {`{
  "ingestion_id": "abc123"
}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GET /api/status/[ingestion_id]</CardTitle>
              <CardDescription>Check the status of an ingestion request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                  {`{
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
}`}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status Values</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">yet_to_start</Badge>
                    <span className="text-sm">Batch hasn't started processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">triggered</Badge>
                    <span className="text-sm">Batch is currently processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      completed
                    </Badge>
                    <span className="text-sm">Batch processing finished</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Batching</h4>
                <p className="text-sm text-gray-600 mb-2">
                  IDs are automatically split into batches of maximum 3 items each.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Priority Processing</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Batches are processed based on priority (HIGH → MEDIUM → LOW) and creation time.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rate Limiting</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Maximum of 1 batch processed every 5 seconds to simulate external API constraints.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Processing Order</h4>
                <div className="bg-gray-100 p-4 rounded text-sm">
                  <div>T0: Request 1 - IDs [1,2,3,4,5], Priority: MEDIUM</div>
                  <div>T4: Request 2 - IDs [6,7,8,9], Priority: HIGH</div>
                  <div className="mt-2 text-gray-600">
                    <div>T0-T5: Process [1,2,3] (first batch of Request 1)</div>
                    <div>T5-T10: Process [6,7,8] (first batch of Request 2 - higher priority)</div>
                    <div>T10-T15: Process [9,4,5] (remaining IDs by priority)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
