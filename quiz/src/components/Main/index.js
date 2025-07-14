"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Container,
  Segment,
  Grid,
  Header,
  Dropdown,
  Button,
  Message,
  Card,
  Statistic,
  Progress,
  Divider,
  Icon,
} from "semantic-ui-react"

import mindImg from "../../images/mind.svg"
import { COUNTDOWN_TIME } from "../../constants"
import { shuffle } from "../../utils"
import Offline from "../Offline"

const Main = ({ startQuiz }) => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [countdownTime, setCountdownTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    fetch("http://localhost:5000/api/questions/categories")
      .then((res) => res.json())
      .then((uniqueCategories) => {
        setCategories(
          uniqueCategories.map((c) => ({
            key: c,
            text: c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " "),
            value: c,
          })),
        )
      })
      .catch(() => {
        setOffline(true)
      })
  }, [])

const handleTimeChange = useCallback((e, { name, value }) => {
  setCountdownTime((prev) => ({
    ...prev,
    [name]: parseInt(value, 10) || 0, // ensures numeric value, defaults to 0
  }))
}, [])


  const fetchData = useCallback(async () => {
    setProcessing(true)
    setError(null)
    setLoadingProgress(0)

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => Math.min(prev + 10, 90))
    }, 100)

    try {
      const response = await fetch("http://localhost:5000/api/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")

      const data = await response.json()
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const filtered = data.filter((q) => q.category === selectedCategory)

      if (filtered.length === 0) {
        throw new Error(`No questions found in category "${selectedCategory}".`)
      }

      const finalData = filtered.map((q) => ({
        ...q,
        options: shuffle([q.correct_answer, ...q.incorrect_answers]),
      }))

      setLoadingProgress(100)
      clearInterval(progressInterval)

      setTimeout(() => {
        setProcessing(false)
const totalTime =
  parseInt(countdownTime.hours) * 3600 +
  parseInt(countdownTime.minutes) * 60 +
  parseInt(countdownTime.seconds)
        startQuiz(finalData, totalTime)
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setProcessing(false)
      setLoadingProgress(0)

      if (!navigator.onLine) {
        setOffline(true)
      } else {
        setError({
          message: err.message || "Failed to fetch questions",
        })
      }
    }
  }, [selectedCategory, countdownTime, startQuiz])

  if (offline) return <Offline />

 const getTotalSeconds = (h, m, s) =>
  parseInt(h || 0) * 3600 + parseInt(m || 0) * 60 + parseInt(s || 0)

const totalTime = getTotalSeconds(
  countdownTime.hours,
  countdownTime.minutes,
  countdownTime.seconds
)

const allFieldsSelected = selectedCategory && totalTime > 0

const formatTime = (hours, minutes, seconds) => {
  const h = parseInt(hours) || 0
  const m = parseInt(minutes) || 0
  const s = parseInt(seconds) || 0

  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0) parts.push(`${s}s`)

  return parts.length > 0 ? parts.join(" ") : "0s"
}

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "calc(100vh - 64px)" }}>
      <Container style={{ padding: "2rem 0" }}>
        <Segment
          style={{
            backgroundColor: "white",
            border: "1px solid #e1e8ed",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            padding: "0",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              padding: "2rem",
              borderBottom: "1px solid #e1e8ed",
              textAlign: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <img
              src={mindImg || "/placeholder.svg"}
              alt="Quiz"
              style={{
                width: "64px",
                height: "64px",
                marginBottom: "1rem",
                opacity: 0.8,
              }}
            />
            <Header as="h1" style={{ color: "#2c3e50", marginBottom: "0.5rem", fontWeight: "600" }}>
              Scholastic Assessment Test(SAT)
            </Header>
            <p style={{ color: "#6c757d", fontSize: "1.1rem", margin: "0" }}>
              Select your test parameters to begin the assessment
            </p>
          </div>

          <div style={{ padding: "2rem" }}>
            {error && (
              <Message error onDismiss={() => setError(null)} style={{ marginBottom: "2rem" }}>
                <Message.Header>Assessment Error</Message.Header>
                {error.message}
              </Message>
            )}

            {/* Configuration Section */}
            <Grid stackable columns={2} style={{ margin: "0" }}>
              <Grid.Column style={{ paddingRight: "1rem" }}>
                <Card fluid style={{ border: "1px solid #e1e8ed", boxShadow: "none" }}>
                  <Card.Content>
                    <Card.Header style={{ color: "#2c3e50", marginBottom: "1rem" }}>
                      <Icon name="list" />
                      Test Category
                    </Card.Header>
                    <Dropdown
                      fluid
                      selection
                       direction="upward"
                      placeholder="Select test category"
                      options={categories}
                      value={selectedCategory}
                      onChange={(e, { value }) => setSelectedCategory(value)}
                      disabled={processing}
                      style={{
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                      }}
                    />
                  </Card.Content>
                </Card>
              </Grid.Column>

              <Grid.Column style={{ paddingLeft: "1rem" }}>
                <Card fluid style={{ border: "1px solid #e1e8ed", boxShadow: "none" }}>
                  <Card.Content>
                    <Card.Header style={{ color: "#2c3e50", marginBottom: "1rem" }}>
                      <Icon name="clock" />
                      Time Allocation
                    </Card.Header>
                    <Grid columns={3} style={{ margin: "0" }}>
                      <Grid.Column style={{ padding: "0 0.25rem" }}>
                        <label
                          style={{ fontSize: "0.875rem", color: "#6c757d", marginBottom: "4px", display: "block" }}
                        >
                          Hours
                        </label>
                        <Dropdown
                          fluid
                          selection
                          name="hours"
                           direction="upward"
                          options={COUNTDOWN_TIME.hours}
                          value={countdownTime.hours}
                          onChange={handleTimeChange}
                          disabled={processing}
                          style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
                        />
                      </Grid.Column>
                      <Grid.Column style={{ padding: "0 0.25rem" }}>
                        <label
                          style={{ fontSize: "0.875rem", color: "#6c757d", marginBottom: "4px", display: "block" }}
                        >
                          Minutes
                        </label>
                        <Dropdown
                          fluid
                          selection
                          name="minutes"
                                                     direction="upward"

                          options={COUNTDOWN_TIME.minutes}
                          value={countdownTime.minutes}
                          onChange={handleTimeChange}
                          disabled={processing}
                          style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
                        />
                      </Grid.Column>
                      <Grid.Column style={{ padding: "0 0.25rem" }}>
                        <label
                          style={{ fontSize: "0.875rem", color: "#6c757d", marginBottom: "4px", display: "block" }}
                        >
                          Seconds
                        </label>
                        <Dropdown
                          fluid
                          selection
                                                     direction="upward"

                          name="seconds"
                          options={COUNTDOWN_TIME.seconds}
                          value={countdownTime.seconds}
                          onChange={handleTimeChange}
                          disabled={processing}
                          style={{ border: "1px solid #ced4da", borderRadius: "4px" }}
                        />
                      </Grid.Column>
                    </Grid>
                  </Card.Content>
                </Card>
              </Grid.Column>
            </Grid>

            {/* Time Display */}
            {totalTime > 0 && (
              <Segment
                textAlign="center"
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e1e8ed",
                  borderRadius: "4px",
                  margin: "2rem 0",
                  padding: "1.5rem",
                }}
              >
                <Statistic>
                <Statistic.Value style={{ color: "#2c3e50" }}>
  <Icon name="hourglass half" />
  {formatTime(countdownTime.hours, countdownTime.minutes, countdownTime.seconds)}
</Statistic.Value>

                  <Statistic.Label style={{ color: "#6c757d" }}>Total Assessment Time</Statistic.Label>
                </Statistic>
              </Segment>
            )}

            {/* Loading Progress */}
            {processing && (
              <Segment style={{ margin: "2rem 0", padding: "2rem", textAlign: "center" }}>
                <Header as="h4" style={{ color: "#2c3e50", marginBottom: "1rem" }}>
                  <Icon name="cog" loading />
                  Preparing Assessment
                </Header>
                <Progress percent={loadingProgress} color="blue" size="medium" style={{ margin: "1rem 0" }} />
                <p style={{ color: "#6c757d", margin: "0" }}>Loading questions and configuring test environment...</p>
              </Segment>
            )}

            <Divider style={{ margin: "2rem 0" }} />

            {/* Start Button */}
            <div style={{ textAlign: "center" }}>
              <Button
                primary
                size="large"
                onClick={fetchData}
                disabled={!allFieldsSelected || processing}
                loading={processing}
                style={{
                  backgroundColor: allFieldsSelected && !processing ? "#3498db" : "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "12px 32px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  minWidth: "200px",
                }}
              >
                <Icon name={processing ? "cog" : "play"} />
                {processing ? "Preparing..." : "Start Assessment"}
              </Button>

              {!allFieldsSelected && (
                <Message
                  info
                  style={{
                    marginTop: "1rem",
                    textAlign: "left",
                    backgroundColor: "#e3f2fd",
                    border: "1px solid #bbdefb",
                    borderRadius: "4px",
                  }}
                >
                  <Icon name="info circle" />
                  Please select a test category and configure the time limit to proceed.
                </Message>
              )}
            </div>

            {/* Assessment Summary */}
            {selectedCategory && !processing && (
              <Grid columns={3} stackable style={{ margin: "2rem 0 0 0" }}>
                <Grid.Column textAlign="center">
                  <div style={{ padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <Icon name="list" size="large" style={{ color: "#3498db", marginBottom: "0.5rem" }} />
                    <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>Category</div>
                    <div style={{ fontWeight: "500", color: "#2c3e50" }}>
                      {categories.find((c) => c.value === selectedCategory)?.text}
                    </div>
                  </div>
                </Grid.Column>
                <Grid.Column textAlign="center">
                  <div style={{ padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <Icon name="clock" size="large" style={{ color: "#e67e22", marginBottom: "0.5rem" }} />
                    <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>Duration</div>
                    <div style={{ fontWeight: "500", color: "#2c3e50" }}>
                      {formatTime(countdownTime.hours, countdownTime.minutes, countdownTime.seconds)}
                    </div>
                  </div>
                </Grid.Column>
                <Grid.Column textAlign="center">
                  <div style={{ padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <Icon name="certificate" size="large" style={{ color: "#27ae60", marginBottom: "0.5rem" }} />
                    <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>Assessment</div>
                    <div style={{ fontWeight: "500", color: "#2c3e50" }}>Online Quiz</div>
                  </div>
                </Grid.Column>
              </Grid>
            )}
          </div>
        </Segment>
      </Container>
    </div>
  )
}

export default Main
