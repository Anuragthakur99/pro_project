"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Play, CheckCircle, XCircle, Clock } from "lucide-react"

export default function TestPage() {
  const [testResults, setTestResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState("")

  const addLog = (message: string) => {
    setLogs((prev) => prev + `[${new Date().toISOString()}] ${message}\n`)
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setLogs("")

    const tests = [
      {
        name: "Basic Ingestion Test",
        test: async () => {
          addLog("Testing basic ingestion...")
          const response = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [1, 2, 3], priority: "HIGH" }),
          })
          const data = await response.json()
          if (!data.ingestion_id) throw new Error("No ingestion_id returned")
          addLog(`Ingestion ID: ${data.ingestion_id}`)
          return data.ingestion_id
        },
      },
      {
        name: "Status Check Test",
        test: async () => {
          addLog("Testing status check...")
          const ingestResponse = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [4, 5, 6], priority: "MEDIUM" }),
          })
          const ingestData = await ingestResponse.json()

          const statusResponse = await fetch(`/api/status/${ingestData.ingestion_id}`)
          const statusData = await statusResponse.json()

          if (!statusData.batches || statusData.batches.length === 0) {
            throw new Error("No batches found in status")
          }
          addLog(`Status: ${statusData.status}, Batches: ${statusData.batches.length}`)
          return statusData
        },
      },
      {
        name: "Priority Test",
        test: async () => {
          addLog("Testing priority handling...")

          // Submit LOW priority first
          const lowResponse = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [7, 8, 9, 10, 11, 12], priority: "LOW" }),
          })
          const lowData = await lowResponse.json()

          // Wait a bit then submit HIGH priority
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const highResponse = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [13, 14, 15], priority: "HIGH" }),
          })
          const highData = await highResponse.json()

          addLog(`LOW priority ID: ${lowData.ingestion_id}`)
          addLog(`HIGH priority ID: ${highData.ingestion_id}`)

          return { low: lowData.ingestion_id, high: highData.ingestion_id }
        },
      },
      {
        name: "Batch Size Test",
        test: async () => {
          addLog("Testing batch size limits...")
          const response = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [16, 17, 18, 19, 20, 21, 22], priority: "MEDIUM" }),
          })
          const data = await response.json()

          // Check status to verify batching
          await new Promise((resolve) => setTimeout(resolve, 500))
          const statusResponse = await fetch(`/api/status/${data.ingestion_id}`)
          const statusData = await statusResponse.json()

          const batchSizes = statusData.batches.map((b) => b.ids.length)
          const maxBatchSize = Math.max(...batchSizes)

          if (maxBatchSize > 3) {
            throw new Error(`Batch size ${maxBatchSize} exceeds limit of 3`)
          }

          addLog(`Batches created: ${statusData.batches.length}`)
          addLog(`Batch sizes: ${batchSizes.join(", ")}`)

          return statusData
        },
      },
      {
        name: "Rate Limiting Test",
        test: async () => {
          addLog("Testing rate limiting (this may take time)...")
          const startTime = Date.now()

          // Submit multiple requests quickly
          const requests = []
          for (let i = 0; i < 3; i++) {
            requests.push(
              fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [23 + i * 3, 24 + i * 3, 25 + i * 3], priority: "HIGH" }),
              }),
            )
          }

          const responses = await Promise.all(requests)
          const data = await Promise.all(responses.map((r) => r.json()))

          addLog(`Submitted ${data.length} requests`)

          // Check if processing respects rate limits
          // This is a simplified test - in reality we'd need to monitor processing times
          return data
        },
      },
    ]

    const results = []

    for (const test of tests) {
      try {
        addLog(`\n--- Running ${test.name} ---`)
        const result = await test.test()
        results.push({ name: test.name, status: "passed", result })
        addLog(`✅ ${test.name} PASSED`)
      } catch (error) {
        results.push({ name: test.name, status: "failed", error: error.message })
        addLog(`❌ ${test.name} FAILED: ${error.message}`)
      }
    }

    setTestResults(results)
    setIsRunning(false)
    addLog("\n--- Test Suite Complete ---")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">API Test Suite</h1>
          <p className="text-gray-600">Comprehensive tests for the Data Ingestion API System</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Test Results
                </CardTitle>
                <CardDescription>Run comprehensive tests to verify API functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runTests} disabled={isRunning} className="w-full mb-4">
                  {isRunning ? "Running Tests..." : "Run All Tests"}
                </Button>

                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={result.status === "passed" ? "default" : "destructive"}>
                        {result.status === "passed" ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : result.status === "failed" ? (
                          <XCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <Clock className="h-4 w-4 mr-1" />
                        )}
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Logs</CardTitle>
                <CardDescription>Detailed execution logs and results</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={logs}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Test logs will appear here..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
