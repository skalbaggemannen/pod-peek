import { useEffect, useState } from "react"

function statusColor(status: string) {
  switch (status) {
    case "Running":
      return "#22c55e"
    case "Pending":
      return "#f59e0b"
    case "Failed":
      return "#ef4444"
    default:
      return "#94a3b8"
  }
}

function getRestartCount(pod: any) {
  if (!pod.status?.containerStatuses) return 0

  return pod.status.containerStatuses.reduce(
    (total: number, container: any) => total + container.restartCount,
    0
  )
}

function getPodPriority(pod: any) {
  const phase = pod.status?.phase
  const waitingReason =
    pod.status?.containerStatuses?.[0]?.state?.waiting?.reason

  if (waitingReason === "CrashLoopBackOff") return 0
  if (phase === "Failed") return 1
  if (phase === "Pending") return 2
  if (phase === "Running") return 3

  return 4
}

function App() {
  const [pods, setPods] = useState<any[]>([])
  const [logs, setLogs] = useState("")
  const [selectedPod, setSelectedPod] = useState("")
  const [selectedNamespace, setSelectedNamespace] = useState("all")
  const [lastUpdated, setLastUpdated] = useState("")
  const [search, setSearch] = useState("")

  const fetchPods = () => {
    fetch("/api/pods")
      .then((res) => res.json())
      .then((data) => {
        setPods(Array.isArray(data) ? data : [])
        setLastUpdated(new Date().toLocaleTimeString())
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchPods()

    const interval = setInterval(() => {
      fetchPods()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchLogs = async (podName: string, namespace: string) => {
    try {
      setSelectedPod(podName)

      const res = await fetch(
        `/api/logs?pod=${encodeURIComponent(
          podName
        )}&namespace=${encodeURIComponent(namespace)}`
      )

      const text = await res.text()
      setLogs(text)
    } catch (err) {
      console.error(err)
      setLogs("Failed to fetch logs")
    }
  }

  const restartPod = async (podName: string, namespace: string) => {
    try {
      await fetch(
        `/api/restart?pod=${encodeURIComponent(
          podName
        )}&namespace=${encodeURIComponent(namespace)}`,
        {
          method: "POST",
        }
      )

      fetchPods()
    } catch (err) {
      console.error(err)
    }
  }

  const namespaces = [
    "all",
    ...Array.from(
      new Set(
        pods
          .map((pod) => pod.metadata?.namespace)
          .filter(Boolean)
      )
    ),
  ]

  const visiblePods = [...pods]
  .filter((pod) => {
    const matchesNamespace =
      selectedNamespace === "all" ||
      pod.metadata?.namespace === selectedNamespace

    const matchesSearch =
      pod.metadata?.name
        ?.toLowerCase()
        .includes(search.toLowerCase())

    return matchesNamespace && matchesSearch
  })
  .sort((a, b) => getPodPriority(a) - getPodPriority(b))

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        color: "white",
        padding: "2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        PodPeek
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
        Auto-refresh every 5s · Last updated: {lastUpdated || "never"}
      </p>

      <select
        value={selectedNamespace}
        onChange={(e) => setSelectedNamespace(e.target.value)}
        style={{
          padding: "0.75rem",
          marginBottom: "2rem",
          borderRadius: "8px",
          background: "#1e293b",
          color: "white",
          border: "none",
        }}
      >
        {namespaces.map((ns) => (
          <option key={ns} value={ns}>
            {ns}
          </option>
        ))}
      </select>
      <input
  type="text"
  placeholder="Search pods..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    width: "100%",
    padding: "0.75rem",
    marginBottom: "2rem",
    borderRadius: "8px",
    background: "#1e293b",
    color: "white",
    border: "none",
    fontSize: "1rem",
    boxSizing: "border-box",
  }}
/>

      {visiblePods.map((pod) => (
        <div
          key={pod.metadata?.uid}
          onClick={() =>
            fetchLogs(
              pod.metadata?.name,
              pod.metadata?.namespace
            )
          }
          style={{
            background: "#1e293b",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1rem",
            cursor: "pointer",
          }}
        >
          <h3>{pod.metadata?.name}</h3>

          <p>
            Status:
            <span
              style={{
                color: statusColor(pod.status?.phase),
                marginLeft: "8px",
                fontWeight: "bold",
              }}
            >
              {pod.status?.phase}
            </span>
          </p>

          <p>Namespace: {pod.metadata?.namespace}</p>

          <p>
            Restarts:{" "}
            <span
              style={{
                color:
                  getRestartCount(pod) > 0
                    ? "#f59e0b"
                    : "#22c55e",
                fontWeight: "bold",
              }}
            >
              {getRestartCount(pod)}
            </span>
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation()
              restartPod(
                pod.metadata?.name,
                pod.metadata?.namespace
              )
            }}
            style={{
              marginTop: "0.75rem",
              background: "#334155",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Restart Pod
          </button>
        </div>
      ))}

      {logs && (
        <div
          style={{
            marginTop: "2rem",
            background: "#020617",
            padding: "1rem",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>
            Logs: {selectedPod}
          </h2>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.85rem",
              overflowX: "auto",
            }}
          >
            {logs}
          </pre>
        </div>
	)}
    </div>
      )
    }

export default App
