import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Clock, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Ingestion API System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A robust API system for batch processing data with priority queuing and rate limiting
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Batch Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Process up to 3 IDs at a time with intelligent batching</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Priority Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>HIGH, MEDIUM, LOW priority processing with timestamp ordering</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>1 batch per 5 seconds rate limiting for external API simulation</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">API Endpoints</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900">POST /api/ingest</h3>
              <p className="text-gray-600 mb-2">Submit data ingestion request</p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                {`{"ids": [1, 2, 3, 4, 5], "priority": "HIGH"}`}
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900">GET /api/status/[id]</h3>
              <p className="text-gray-600 mb-2">Check ingestion status</p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">{`GET /api/status/abc123`}</div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button asChild>
              <Link href="/test">Run Tests</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
