"use client"

import { useState } from "react"
import PropTypes from "prop-types"
import Stats from "./Stats"
import QNA from "./QNA"
import "./Result.css"

const Result = ({ totalQuestions, correctAnswers, timeTaken, questionsAndAnswers, replayQuiz, resetQuiz }) => {
  const [activeTab, setActiveTab] = useState("Stats")

  const handleTabClick = (tabName) => {
    setActiveTab(tabName)
  }

  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Outstanding Performance! 🌟"
    if (percentage >= 80) return "Excellent Work! 🎉"
    if (percentage >= 70) return "Great Job! 👏"
    if (percentage >= 60) return "Good Effort! 💪"
    return "Keep Practicing! 📚"
  }

  return (
    <div className="result-container">
      {/* Header */}
      <div className="result-header">
        <div className="header-content">
          <div className="completion-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">Quiz Completed</span>
          </div>
          <h1 className="result-title">{getPerformanceMessage()}</h1>
          <p className="result-subtitle">
            You scored {correctAnswers} out of {totalQuestions} questions ({percentage}%)
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "Stats" ? "active" : ""}`}
            onClick={() => handleTabClick("Stats")}
            aria-label="View performance statistics"
          >
            <span className="tab-icon">📊</span>
            <span className="tab-text">Your Score</span>
          </button>
          <button
            className={`tab-button ${activeTab === "QNA" ? "active" : ""}`}
            onClick={() => handleTabClick("QNA")}
            aria-label="Review questions and answers"
          >
            <span className="tab-icon">📝</span>
            <span className="tab-text">Review Questions</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="result-content">
        {activeTab === "Stats" && (
          <Stats
            totalQuestions={totalQuestions}
            correctAnswers={correctAnswers}
            timeTaken={timeTaken}
            replayQuiz={replayQuiz}
            resetQuiz={resetQuiz}
          />
        )}
        {activeTab === "QNA" && <QNA questionsAndAnswers={questionsAndAnswers} />}
      </div>
    </div>
  )
}

Result.propTypes = {
  totalQuestions: PropTypes.number.isRequired,
  correctAnswers: PropTypes.number.isRequired,
  timeTaken: PropTypes.number.isRequired,
  questionsAndAnswers: PropTypes.array.isRequired,
  replayQuiz: PropTypes.func.isRequired,
  resetQuiz: PropTypes.func.isRequired,
}

export default Result
