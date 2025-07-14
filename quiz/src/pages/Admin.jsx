"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Form,
  Button,
  Message,
  Segment,
  Header,
  Image,
  Grid,
  Card,
  Icon,
  Modal,
  Confirm,
  Loader,
  Divider,
} from "semantic-ui-react"
import "./Admin.css"

const Admin = () => {
  // Existing state (unchanged)
  const [category, setCategory] = useState(localStorage.getItem("quiz_category") || "")
  const [question, setQuestion] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [incorrectAnswers, setIncorrectAnswers] = useState(["", "", ""])
  const [imageBase64, setImageBase64] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // New state for CRUD functionality
  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [crudSuccess, setCrudSuccess] = useState("")
  const [crudError, setCrudError] = useState("")

  // Edit form state
  const [editCategory, setEditCategory] = useState("")
  const [editQuestionText, setEditQuestionText] = useState("")
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("")
  const [editIncorrectAnswers, setEditIncorrectAnswers] = useState(["", "", ""])
  const [editImageBase64, setEditImageBase64] = useState("")

  //search
  const [searchTerm, setSearchTerm] = useState("")


  // Existing functions (unchanged)
  const handleIncorrectChange = (index, value) => {
    const updated = [...incorrectAnswers]
    updated[index] = value
    setIncorrectAnswers(updated)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB")
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Original handleSubmit function (completely unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    if (!category.trim() || !question.trim() || !correctAnswer.trim() || incorrectAnswers.some((ans) => !ans.trim())) {
      setError("Please fill in all fields.")
      setLoading(false)
      return
    }

    const payload = {
      category: category.trim(),
      question: question.trim(),
      correct_answer: correctAnswer.trim(),
      incorrect_answers: incorrectAnswers.map((a) => a.trim()),
      image_base64: imageBase64 || "",
    }

    try {
      const token = process.env.REACT_APP_API_SECRET_TOKEN

      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ This is critical
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        localStorage.setItem("quiz_category", category)
        setSuccess(true)
        setQuestion("")
        setCorrectAnswer("")
        setIncorrectAnswers(["", "", ""])
        setImageBase64("")
        // Refresh questions list after adding new question
        if (category.trim()) {
          fetchQuestions(category.trim())
        }
      } else {
        setError("Failed to save question.")
      }
    } catch (err) {
      setError("Error connecting to backend.")
    } finally {
      setLoading(false)
    }
  }

  // New CRUD functions
  const fetchQuestions = async (selectedCategory) => {
    if (!selectedCategory.trim()) {
      setQuestions([])
      return
    }

    setLoadingQuestions(true)
    setCrudError("")

    try {
      const res = await fetch("http://localhost:5000/api/questions")
      if (res.ok) {
        const allQuestions = await res.json()
        console.log("Fetched questions:", allQuestions);
console.log("Selected category:", selectedCategory);

const filteredQuestions = allQuestions.filter(
  (q) =>
    typeof q.category === "string" &&
    q.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
)


        setQuestions(filteredQuestions)
      } else {
        setCrudError("Failed to fetch questions")
      }
    } catch (err) {
  console.error("❌ Fetch failed:", err);
  setCrudError("Error connecting to backend");
}
finally {
      setLoadingQuestions(false)
    }
  }

  const handleEditIncorrectChange = (index, value) => {
    const updated = [...editIncorrectAnswers]
    updated[index] = value
    setEditIncorrectAnswers(updated)
  }

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.size > 2 * 1024 * 1024) {
      setCrudError("Image must be under 2MB")
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImageBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const openEditModal = (questionData) => {
    setSelectedQuestion(questionData)
    setEditCategory(questionData.category)
    setEditQuestionText(questionData.question)
    setEditCorrectAnswer(questionData.correct_answer)
    setEditIncorrectAnswers(questionData.incorrect_answers)
    setEditImageBase64(questionData.image_base64 || "")
    setEditModal(true)
    setCrudError("")
    setCrudSuccess("")
  }

  const handleEditSubmit = async () => {
  setCrudError("")
  setCrudSuccess("")
  setEditLoading(true)

  if (
    !editCategory.trim() ||
    !editQuestionText.trim() ||
    !editCorrectAnswer.trim() ||
    editIncorrectAnswers.some((ans) => !ans.trim())
  ) {
    setCrudError("Please fill in all fields.")
    setEditLoading(false)
    return
  }

  const payload = {
    category: editCategory.trim(),
    question: editQuestionText.trim(),
    correct_answer: editCorrectAnswer.trim(),
    incorrect_answers: editIncorrectAnswers.map((a) => a.trim()),
    image_base64: editImageBase64 || "",
  }

  try {
const token = process.env.REACT_APP_API_SECRET_TOKEN

    if (!selectedQuestion || !selectedQuestion._id) {
      setCrudError("Invalid question selected")
      setEditLoading(false)
      return
    }

    const res = await fetch(`http://localhost:5000/api/questions/${selectedQuestion._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setCrudSuccess("Question updated successfully!")
      setEditModal(false)
      fetchQuestions(category)
    } else {
      setCrudError("Failed to update question.")
    }
  } catch (err) {
    setCrudError("Error connecting to backend.")
  } finally {
    setEditLoading(false)
  }
}

  const openDeleteConfirm = (questionData) => {
    setSelectedQuestion(questionData)
    setDeleteConfirm(true)
    setCrudError("")
    setCrudSuccess("")
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setCrudError("")
    setCrudSuccess("")

    try {
const token = process.env.REACT_APP_API_SECRET_TOKEN
      const res = await fetch(`http://localhost:5000/api/questions/${selectedQuestion._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setCrudSuccess("Question deleted successfully!")
        setDeleteConfirm(false)
        fetchQuestions(category)
      } else {
        setCrudError("Failed to delete question.")
      }
    } catch (err) {
      setCrudError("Error connecting to backend.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Effect to fetch questions when category changes
  useEffect(() => {
    if (category.trim()) {
      fetchQuestions(category.trim())
    } else {
      setQuestions([])
    }
  }, [category])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Container>
          <div className="header-content">
            <Icon name="plus circle" size="big" className="header-icon" />
            <div className="header-text">
              <h1>Quiz Question Dashboard</h1>
              <p>Create and manage your SAT practice questions</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="dashboard-main">
        <Grid stackable>
          <Grid.Row>
            <Grid.Column width={16}>
              <Card fluid className="question-form-card">
                <Card.Content>
                  <Card.Header>
                    <Icon name="edit" />
                    Add New Question
                  </Card.Header>
                  <Card.Meta>Fill out all fields to create a new quiz question</Card.Meta>
                </Card.Content>

                <Card.Content>
                  <Form onSubmit={handleSubmit} success={success} error={!!error} loading={loading}>
                    <Grid stackable>
                      <Grid.Row>
                        <Grid.Column width={16}>
                          <Form.Input
                            label="Category"
                            placeholder="e.g. Math, Reading, Writing"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className="form-field"
                            icon="tag"
                            iconPosition="left"
                          />
                        </Grid.Column>
                      </Grid.Row>

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <Form.TextArea
                            label="Question"
                            placeholder="Enter your question here..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            required
                            className="form-field question-field"
                            rows={4}
                          />
                        </Grid.Column>
                      </Grid.Row>

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <Form.TextArea
                            label="Correct Answer"
                            placeholder="Enter the correct answer"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            required
                            className="form-field correct-answer-field"
                            rows={2}
                          />
                        </Grid.Column>
                      </Grid.Row>

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <div className="incorrect-answers-section">
                            <label className="section-label">Incorrect Answers</label>
                            <Grid stackable>
                              {incorrectAnswers.map((answer, idx) => (
                                <Grid.Column width={16} key={idx}>
                                  <Form.TextArea
                                    label={`Option ${idx + 1}`}
                                    placeholder={`Enter incorrect answer ${idx + 1}`}
                                    value={answer}
                                    onChange={(e) => handleIncorrectChange(idx, e.target.value)}
                                    required
                                    className="form-field incorrect-answer-field"
                                    rows={2}
                                  />
                                </Grid.Column>
                              ))}
                            </Grid>
                          </div>
                        </Grid.Column>
                      </Grid.Row>

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <div className="image-upload-section">
                            <label className="section-label">
                              <Icon name="image" />
                              Upload Image (Optional)
                            </label>
                            <div className="upload-wrapper">
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
                              <Button
                                type="button"
                                icon="upload"
                                content="Choose Image"
                                className="upload-button"
                                onClick={() => document.querySelector(".file-input").click()}
                              />
                            </div>
                          </div>
                        </Grid.Column>
                      </Grid.Row>

                      {imageBase64 && (
                        <Grid.Row>
                          <Grid.Column width={16}>
                            <div className="image-preview-section">
                              <label className="section-label">Image Preview</label>
                              <div className="image-preview">
                                <Image src={imageBase64 || "/placeholder.svg"} size="medium" bordered />
                                <Button
                                  type="button"
                                  icon="trash"
                                  color="red"
                                  size="small"
                                  className="remove-image"
                                  onClick={() => setImageBase64("")}
                                />
                              </div>
                            </div>
                          </Grid.Column>
                        </Grid.Row>
                      )}

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <Message success header="Success!" content="Your question has been added successfully." />
                          <Message error content={error} />
                        </Grid.Column>
                      </Grid.Row>

                      <Grid.Row>
                        <Grid.Column width={16}>
                          <div className="submit-section">
                            <Button
                              primary
                              type="submit"
                              size="large"
                              className="submit-button"
                              icon="plus"
                              content="Add Question"
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Form>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>

          {/* CRUD Section - Questions List */}
          {category.trim() && (
            <Grid.Row>
              <Grid.Column width={16}>
                <Divider horizontal>
                  <Header as="h3">
                    <Icon name="list" />
                    Manage Questions - {category}
                  </Header>
                </Divider>
                <Form className="search-bar" style={{ marginBottom: "1.5rem" }}>
  <Form.Input
    icon="search"
    iconPosition="left"
    placeholder="Search question text..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    fluid
  />
</Form>


                {crudSuccess && (
                  <Message success>
                    <Icon name="check circle" />
                    {crudSuccess}
                  </Message>
                )}

                {crudError && (
                  <Message error>
                    <Icon name="exclamation triangle" />
                    {crudError}
                  </Message>
                )}

                {loadingQuestions ? (
                  <Segment>
                    <Loader active inline="centered">
                      Loading questions...
                    </Loader>
                  </Segment>
                ) : questions.length === 0 ? (
                  <Message info>
                    <Icon name="info circle" />
                    No questions found for category "{category}". Add some questions above!
                  </Message>
                ) : (
                  <Card.Group stackable>
                    {questions
  .filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .map((q, index) => (
    <Card fluid key={q._id}>
                        <Card.Content>
                          <Card.Header>
                            <Icon name="help circle" />
                            Question #{index + 1}
                          </Card.Header>
                          <Card.Meta>
                            <Icon name="tag" />
                            {q.category}
                          </Card.Meta>
                          <Card.Description>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Question:</strong>
                              <p
                                style={{
                                  marginTop: "5px",
                                  padding: "10px",
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "4px",
                                }}
                              >
                                {q.question}
                              </p>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ color: "#21ba45" }}>Correct Answer:</strong>
                              <p
                                style={{
                                  marginTop: "5px",
                                  padding: "8px",
                                  backgroundColor: "#f0fff4",
                                  borderRadius: "4px",
                                  border: "1px solid #21ba45",
                                }}
                              >
                                {q.correct_answer}
                              </p>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                              <strong style={{ color: "#db2828" }}>Incorrect Answers:</strong>
                              {q.incorrect_answers.map((ans, idx) => (
                                <p
                                  key={idx}
                                  style={{
                                    marginTop: "5px",
                                    padding: "8px",
                                    backgroundColor: "#fff5f5",
                                    borderRadius: "4px",
                                    border: "1px solid #db2828",
                                  }}
                                >
                                  {idx + 1}. {ans}
                                </p>
                              ))}
                            </div>

                            {q.image_base64 && (
                              <div style={{ marginTop: "10px" }}>
                                <strong>Image:</strong>
                                <div style={{ marginTop: "5px" }}>
                                  <Image src={q.image_base64 || "/placeholder.svg"} size="small" bordered />
                                </div>
                              </div>
                            )}
                          </Card.Description>
                        </Card.Content>
                        <Card.Content extra>
                          <div className="ui two buttons">
                            <Button basic color="blue" onClick={() => openEditModal(q)} icon="edit" content="Edit" />
                            <Button
                              basic
                              color="red"
                              onClick={() => openDeleteConfirm(q)}
                              icon="trash"
                              content="Delete"
                            />
                          </div>
                        </Card.Content>
                      </Card>
                    ))}
                  </Card.Group>
                )}
              </Grid.Column>
            </Grid.Row>
          )}
        </Grid>

        {/* Edit Modal */}
        <Modal open={editModal} onClose={() => setEditModal(false)} size="large">
          <Modal.Header>
            <Icon name="edit" />
            Edit Question
          </Modal.Header>
          <Modal.Content>
            <Form loading={editLoading}>
              <Form.Input
                label="Category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />

              <Form.TextArea
                label="Question"
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                required
                rows={4}
              />

              <Form.TextArea
                label="Correct Answer"
                value={editCorrectAnswer}
                onChange={(e) => setEditCorrectAnswer(e.target.value)}
                required
                rows={2}
              />

              <div>
                <label>Incorrect Answers</label>
                {editIncorrectAnswers.map((answer, idx) => (
                  <Form.TextArea
                    key={idx}
                    label={`Incorrect Answer ${idx + 1}`}
                    value={answer}
                    onChange={(e) => handleEditIncorrectChange(idx, e.target.value)}
                    required
                    rows={2}
                    style={{ marginBottom: "10px" }}
                  />
                ))}
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Upload New Image (Optional)</label>
                <div style={{ marginTop: "10px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    style={{ display: "none" }}
                    id="edit-file-input"
                  />
                  <Button
                    type="button"
                    icon="upload"
                    content="Choose New Image"
                    onClick={() => document.getElementById("edit-file-input").click()}
                  />
                </div>
              </div>

              {editImageBase64 && (
                <div style={{ marginTop: "15px" }}>
                  <label>Image Preview</label>
                  <div style={{ marginTop: "10px", position: "relative" }}>
                    <Image src={editImageBase64 || "/placeholder.svg"} size="medium" bordered />
                    <Button
                      type="button"
                      icon="trash"
                      color="red"
                      size="small"
                      style={{ marginTop: "10px" }}
                      onClick={() => setEditImageBase64("")}
                      content="Remove Image"
                    />
                  </div>
                </div>
              )}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={() => setEditModal(false)}>
              <Icon name="remove" /> Cancel
            </Button>
            <Button color="blue" onClick={handleEditSubmit} loading={editLoading}>
              <Icon name="checkmark" /> Update Question
            </Button>
          </Modal.Actions>
        </Modal>

        {/* Delete Confirmation */}
        <Confirm
          open={deleteConfirm}
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={handleDelete}
          header="Delete Question"
          content={`Are you sure you want to delete this question? This action cannot be undone.`}
          confirmButton={
            <Button color="red" loading={deleteLoading}>
              <Icon name="trash" /> Delete
            </Button>
          }
        />
      </Container>
    </div>
  )
}

export default Admin
