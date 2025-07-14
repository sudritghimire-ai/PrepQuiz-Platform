"use client"

import PropTypes from "prop-types"
import ShareButton from "../ShareButton"
import { calculateScore, calculateGrade, timeConverter } from "../../utils"
import "./Stats.css"

const Stats = ({ totalQuestions, correctAnswers, timeTaken, replayQuiz, resetQuiz }) => {
  const score = calculateScore(totalQuestions, correctAnswers)
  const { grade, remarks } = calculateGrade(score)
  const { hours, minutes, seconds } = timeConverter(timeTaken)

  // Calculate SAT-style score (200-800 scale)
  const satScore = Math.round(200 + (score / 100) * 600)
  const percentile = Math.min(99, Math.round(score * 0.9 + 10))

  return (
    <div className="stats-container">
      {/* Score Overview */}
      <div className="score-overview">
        <div className="main-score">
          <div className="score-circle">
            <div className="score-number">{satScore}</div>
            <div className="score-label">Total Score</div>
          </div>
          <div className="score-range">
            <div className="range-bar">
              <div className="range-fill" style={{ width: `${(satScore - 200) / 6}%` }}></div>
              <div className="range-marker" style={{ left: `${(satScore - 200) / 6}%` }}></div>
            </div>
            <div className="range-labels">
              <span>200</span>
              <span>800</span>
            </div>
          </div>
        </div>

        <div className="performance-grid">
          <div className="performance-card">
            <div className="card-value">{correctAnswers}</div>
            <div className="card-label">Correct</div>
            <div className="card-total">out of {totalQuestions}</div>
          </div>
          <div className="performance-card">
            <div className="card-value">{percentile}th</div>
            <div className="card-label">Percentile</div>
            <div className="card-total">nationally</div>
          </div>
          <div className="performance-card">
            <div className="card-value">
              {hours > 0 ? `${hours}h ` : ""}
              {minutes}m {seconds}s
            </div>
            <div className="card-label">Time</div>
            <div className="card-total">total</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="breakdown-section">
        <h3 className="section-title">Performance Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-label">Reading and Writing</span>
              <span className="breakdown-score">{Math.round(satScore * 0.5)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${score}%` }}></div>
            </div>
            <div className="breakdown-details">
              <span>{correctAnswers} correct</span>
              <span>{score}% accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h3 className="section-title">Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <div className="insight-title">Accuracy</div>
              <div className="insight-description">
                {score >= 80
                  ? "Excellent accuracy! You're demonstrating strong mastery."
                  : score >= 60
                  ? "Good accuracy. Focus on reviewing missed concepts."
                  : "Keep practicing to improve accuracy and confidence."}
              </div>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⏱️</div>
            <div className="insight-content">
              <div className="insight-title">Pacing</div>
              <div className="insight-description">
                {timeTaken / totalQuestions < 60
                  ? "Great pacing! You managed your time effectively."
                  : "Consider practicing time management strategies."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-section">
        <div className="action-buttons">
          <button className="action-btn primary" onClick={replayQuiz}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Practice Again</span>
          </button>
          <button className="action-btn secondary" onClick={resetQuiz}>
            <span className="btn-icon">🏠</span>
            <span className="btn-text">Back to Home</span>
          </button>
        </div>
        <div className="share-section">
          <ShareButton />
        </div>
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h3 className="section-title">Recommended Next Steps</h3>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Review Incorrect Answers</div>
              <div className="step-description">Check the "Review Answers" tab to understand your mistakes</div>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Practice Similar Questions</div>
              <div className="step-description">Focus on question types where you need improvement</div>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Take Another Practice Test</div>
              <div className="step-description">Regular practice helps build confidence and skills</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Stats.propTypes = {
  totalQuestions: PropTypes.number.isRequired,
  correctAnswers: PropTypes.number.isRequired,
  timeTaken: PropTypes.number.isRequired,
  replayQuiz: PropTypes.func.isRequired,
  resetQuiz: PropTypes.func.isRequired,
}

export default Stats
