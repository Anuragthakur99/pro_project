// Comprehensive test suite for the Data Ingestion API
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.testResults = []
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running: ${name}`)
    const startTime = Date.now()

    try {
      const result = await testFn()
      const duration = Date.now() - startTime

      this.testResults.push({
        name,
        status: "PASSED",
        duration,
        result,
      })

      console.log(`✅ ${name} - PASSED (${duration}ms)`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime

      this.testResults.push({
        name,
        status: "FAILED",
        duration,
        error: error.message,
      })

      console.log(`❌ ${name} - FAILED (${duration}ms)`)
      console.log(`   Error: ${error.message}`)
      throw error
    }
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async testBasicIngestion() {
    const data = { ids: [1, 2, 3], priority: "HIGH" }
    const result = await this.post("/api/ingest", data)

    if (!result.ingestion_id) {
      throw new Error("No ingestion_id returned")
    }

    console.log(`   Ingestion ID: ${result.ingestion_id}`)
    return result.ingestion_id
  }

  async testStatusCheck() {
    const ingestionId = await this.testBasicIngestion()
    await this.sleep(100) // Brief delay

    const status = await this.get(`/api/status/${ingestionId}`)

    if (!status.batches || status.batches.length === 0) {
      throw new Error("No batches found in status response")
    }

    if (status.ingestion_id !== ingestionId) {
      throw new Error("Ingestion ID mismatch in status response")
    }

    console.log(`   Status: ${status.status}`)
    console.log(`   Batches: ${status.batches.length}`)

    return status
  }

  async testBatchSizeLimit() {
    const data = { ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], priority: "MEDIUM" }
    const result = await this.post("/api/ingest", data)

    await this.sleep(200)
    const status = await this.get(`/api/status/${result.ingestion_id}`)

    // Check that no batch has more than 3 IDs
    for (const batch of status.batches) {
      if (batch.ids.length > 3) {
        throw new Error(`Batch ${batch.batch_id} has ${batch.ids.length} IDs, exceeds limit of 3`)
      }
    }

    // Check that all IDs are accounted for
    const allIds = status.batches.flatMap((b) => b.ids).sort((a, b) => a - b)
    const expectedIds = data.ids.sort((a, b) => a - b)

    if (JSON.stringify(allIds) !== JSON.stringify(expectedIds)) {
      throw new Error("Not all IDs are accounted for in batches")
    }

    console.log(`   Created ${status.batches.length} batches for ${data.ids.length} IDs`)
    console.log(`   Batch sizes: ${status.batches.map((b) => b.ids.length).join(", ")}`)

    return status
  }

  async testPriorityHandling() {
    // Submit LOW priority request first
    const lowPriorityData = { ids: [100, 101, 102, 103, 104, 105], priority: "LOW" }
    const lowResult = await this.post("/api/ingest", lowPriorityData)

    // Wait a bit, then submit HIGH priority
    await this.sleep(1000)

    const highPriorityData = { ids: [200, 201, 202], priority: "HIGH" }
    const highResult = await this.post("/api/ingest", highPriorityData)

    console.log(`   LOW priority ID: ${lowResult.ingestion_id}`)
    console.log(`   HIGH priority ID: ${highResult.ingestion_id}`)

    // Check initial statuses
    await this.sleep(500)

    const lowStatus = await this.get(`/api/status/${lowResult.ingestion_id}`)
    const highStatus = await this.get(`/api/status/${highResult.ingestion_id}`)

    console.log(`   LOW status: ${lowStatus.status}`)
    console.log(`   HIGH status: ${highStatus.status}`)

    return { low: lowStatus, high: highStatus }
  }

  async testInputValidation() {
    const testCases = [
      { data: { ids: [], priority: "HIGH" }, expectedError: "empty array" },
      { data: { ids: [1, 2, 3], priority: "INVALID" }, expectedError: "invalid priority" },
      { data: { ids: [0], priority: "HIGH" }, expectedError: "invalid ID range" },
      { data: { ids: [1000000008], priority: "HIGH" }, expectedError: "invalid ID range" },
      { data: { priority: "HIGH" }, expectedError: "missing ids" },
      { data: { ids: [1, 2, 3] }, expectedError: "missing priority" },
    ]

    let validationsPassed = 0

    for (const testCase of testCases) {
      try {
        await this.post("/api/ingest", testCase.data)
        throw new Error(`Expected validation error for: ${JSON.stringify(testCase.data)}`)
      } catch (error) {
        if (error.message.includes("HTTP 400")) {
          validationsPassed++
          console.log(`   ✓ Validation caught: ${testCase.expectedError}`)
        } else {
          throw error
        }
      }
    }

    console.log(`   Passed ${validationsPassed}/${testCases.length} validation tests`)
    return validationsPassed
  }

  async testRateLimiting() {
    console.log("   ⚠️  This test takes time due to rate limiting...")

    const startTime = Date.now()

    // Submit multiple requests quickly
    const requests = []
    for (let i = 0; i < 3; i++) {
      const data = { ids: [300 + i * 3, 301 + i * 3, 302 + i * 3], priority: "HIGH" }
      requests.push(this.post("/api/ingest", data))
    }

    const results = await Promise.all(requests)
    console.log(`   Submitted ${results.length} requests in ${Date.now() - startTime}ms`)

    // Wait and check processing
    await this.sleep(2000)

    const statuses = await Promise.all(results.map((r) => this.get(`/api/status/${r.ingestion_id}`)))

    let processingCount = 0
    let completedCount = 0

    for (const status of statuses) {
      const batchStatuses = status.batches.map((b) => b.status)
      if (batchStatuses.some((s) => s === "triggered")) processingCount++
      if (batchStatuses.some((s) => s === "completed")) completedCount++
    }

    console.log(`   Processing: ${processingCount}, Completed: ${completedCount}`)

    return { submitted: results.length, processing: processingCount, completed: completedCount }
  }

  async testNonExistentStatus() {
    const fakeId = "non-existent-id-12345"

    try {
      await this.get(`/api/status/${fakeId}`)
      throw new Error("Expected 404 error for non-existent ingestion ID")
    } catch (error) {
      if (!error.message.includes("HTTP 404")) {
        throw error
      }
      console.log("   ✓ Correctly returned 404 for non-existent ID")
    }

    return true
  }

  async runAllTests() {
    console.log(`🚀 Starting API Test Suite`)
    console.log(`📍 Base URL: ${this.baseUrl}`)
    console.log(`⏰ Started at: ${new Date().toISOString()}`)

    const tests = [
      ["Basic Ingestion", () => this.testBasicIngestion()],
      ["Status Check", () => this.testStatusCheck()],
      ["Batch Size Limit", () => this.testBatchSizeLimit()],
      ["Priority Handling", () => this.testPriorityHandling()],
      ["Input Validation", () => this.testInputValidation()],
      ["Non-existent Status", () => this.testNonExistentStatus()],
      ["Rate Limiting", () => this.testRateLimiting()],
    ]

    let passed = 0
    let failed = 0

    for (const [name, testFn] of tests) {
      try {
        await this.runTest(name, testFn)
        passed++
      } catch (error) {
        failed++
      }
    }

    console.log(`\n📊 Test Results Summary:`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log(`\n❌ Failed Tests:`)
      this.testResults.filter((r) => r.status === "FAILED").forEach((r) => console.log(`   - ${r.name}: ${r.error}`))
    }

    console.log(`\n⏱️  Total Duration: ${this.testResults.reduce((sum, r) => sum + r.duration, 0)}ms`)
    console.log(`🏁 Completed at: ${new Date().toISOString()}`)

    return { passed, failed, total: passed + failed }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester(BASE_URL)
  tester
    .runAllTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error("Test suite failed:", error)
      process.exit(1)
    })
}

module.exports = APITester
