"use client"
import html2canvas from "html2canvas"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Tesseract from "tesseract.js"

import { FaTelegramPlane } from "react-icons/fa"

import { useState, useEffect, useRef } from "react"
import PropTypes from "prop-types"
import he from "he"
import Countdown from "../Countdown"

import "./Quiz.css"

const Quiz = ({ data, countdownTime, endQuiz }) => {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [userSlectedAns, setUserSlectedAns] = useState(null)
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([])
  const [timeTaken, setTimeTaken] = useState(null)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [showDirections, setShowDirections] = useState(false)
  const [showAnnotate, setShowAnnotate] = useState(false)
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [annotations, setAnnotations] = useState({})
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState("pen") // pen, highlighter, eraser
  const [currentColor, setCurrentColor] = useState("#FF5252") // default red
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const passageContentRef = useRef(null)
  const [crossedOutAnswers, setCrossedOutAnswers] = useState({})
  const [showCrossOut, setShowCrossOut] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [distractionAlert, setDistractionAlert] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micStream, setMicStream] = useState(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false)
  const [hiddenOptions, setHiddenOptions] = useState({}) // Track hidden options per question
  const [fateFlipUsed, setFateFlipUsed] = useState(false)
  const [showFateFlipConfirm, setShowFateFlipConfirm] = useState(false)
  const [fateFlipAnimating, setFateFlipAnimating] = useState(false)
  const [dictionaryMode, setDictionaryMode] = useState(false)
  const [showGravityModal, setShowGravityModal] = useState(false)

  // TTS State
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const current = data[questionIndex]
  const category = current.category

  // TTS Functions
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    } else {
      toast.error("❌ Text-to-Speech not supported in this browser")
    }
  }

  const readCurrentQuestion = () => {
    if (!current) return

    const questionText = he.decode(current.question)
    const optionsText = current.options
      .filter((_, index) => !hiddenOptions[questionIndex]?.includes(index))
      .map((option, index) => {
        const originalIndex = current.options.indexOf(option)
        const letter = String.fromCharCode(65 + originalIndex)
        return `Option ${letter}: ${he.decode(option)}`
      })
      .join(". ")

    const fullText = `Question ${questionIndex + 1}. ${questionText}. The answer choices are: ${optionsText}`
    speakText(fullText)
  }

  const toggleTTS = () => {
    if (ttsEnabled) {
      // Turning OFF - stop any current speech
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setTtsEnabled(false)
      toast.info("🔇 Text-to-Speech disabled")
    } else {
      // Turning ON - enable and read current question
      setTtsEnabled(true)
      readCurrentQuestion()
      toast.success("🔊 Text-to-Speech enabled - Auto-reading questions")
    }
  }

  const handleTTSButtonClick = () => {
    if (ttsEnabled) {
      // Turn OFF - stop speaking and disable TTS
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setTtsEnabled(false)
      toast.info("🔇 Text-to-Speech disabled")
    } else {
      // Turn ON - enable TTS and start reading
      setTtsEnabled(true)
      readCurrentQuestion()
      toast.success("🔊 Text-to-Speech enabled")
    }
  }

  // Auto-read when question changes if TTS is enabled
  useEffect(() => {
    if (ttsEnabled && current) {
      // Small delay to ensure the question has loaded
      const timer = setTimeout(() => {
        readCurrentQuestion()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [questionIndex, ttsEnabled])

  const toggleGravityModal = () => {
    setShowGravityModal(!showGravityModal)
  }

  const handleGravityOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowGravityModal(false)
    }
  }

  const openCalculator = () => {
    window.open("https://www.desmos.com/calculator", "_blank")
    toast.success("🧮 Desmos Calculator opened in new tab!")
  }

  // Apply night mode to document
  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add("night-mode")
    } else {
      document.documentElement.classList.remove("night-mode")
    }
  }, [nightMode])

  // Distraction Alert functionality
  useEffect(() => {
    if (!distractionAlert) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Play a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz beep
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime) // Volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3) // 300ms beep

        // Show toast notification
        toast.warning("⚠️ Stay focused! You switched away from the quiz.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [distractionAlert])

  useEffect(() => {
    console.log("📦 Full Question:", JSON.stringify(current, null, 2))
    if (answers[questionIndex]) {
      setUserSlectedAns(answers[questionIndex])
    } else {
      setUserSlectedAns(null)
    }

    // Load saved annotations for this question if they exist
    if (showAnnotate && annotations[questionIndex]) {
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      const img = new Image()
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(img, 0, 0)
      }
      img.src = annotations[questionIndex]
    }
  }, [questionIndex, answers, showAnnotate, annotations])

  // Initialize canvas when annotation mode is toggled
  useEffect(() => {
    if (showAnnotate && passageContentRef.current) {
      const canvas = canvasRef.current
      const passageContent = passageContentRef.current
      const rect = passageContent.getBoundingClientRect()

      canvas.width = rect.width
      canvas.height = rect.height

      const context = canvas.getContext("2d")
      context.lineCap = "round"
      context.lineJoin = "round"
      context.strokeStyle = currentColor

      if (currentTool === "pen") {
        context.lineWidth = 2
        context.globalAlpha = 1
      } else if (currentTool === "highlighter") {
        context.lineWidth = 15
        context.globalAlpha = 0.3
      } else if (currentTool === "eraser") {
        context.lineWidth = 20
        context.globalAlpha = 1
      }

      contextRef.current = context

      // Load saved annotations for this question if they exist
      if (annotations[questionIndex]) {
        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(img, 0, 0)
        }
        img.src = annotations[questionIndex]
      }
    }
  }, [showAnnotate, currentTool, currentColor, questionIndex, annotations])

  // Dictionary Mode Event Listener
  useEffect(() => {
    if (!dictionaryMode || !passageContentRef.current) return

    const handleDoubleClick = (event) => {
      event.preventDefault()

      const selection = window.getSelection()
      let word = ""

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        word = range.toString().trim()
      }

      // If no selection, try to get word at click position
      if (!word) {
        const target = event.target
        if (target.nodeType === Node.TEXT_NODE || target.tagName === "P" || target.tagName === "SPAN") {
          const textContent = target.textContent || target.innerText
          const clickX = event.clientX
          const rect = target.getBoundingClientRect()

          // Simple word extraction at click position
          const words = textContent.split(/\s+/)
          const charWidth = rect.width / textContent.length
          const clickPosition = Math.floor((clickX - rect.left) / charWidth)

          let currentPos = 0
          for (const w of words) {
            if (currentPos <= clickPosition && clickPosition <= currentPos + w.length) {
              word = w.replace(/[^\w]/g, "")
              break
            }
            currentPos += w.length + 1
          }
        }
      }

      if (word && word.length > 1) {
        fetchWordDefinition(word)
      }
    }

    const passageElement = passageContentRef.current
    passageElement.addEventListener("dblclick", handleDoubleClick)

    // Add visual indicator for dictionary mode
    passageElement.style.cursor = dictionaryMode ? "help" : "default"

    return () => {
      if (passageElement) {
        passageElement.removeEventListener("dblclick", handleDoubleClick)
        passageElement.style.cursor = "default"
      }
    }
  }, [dictionaryMode])

  const startDrawing = ({ nativeEvent }) => {
    if (!showAnnotate) return

    const { offsetX, offsetY } = nativeEvent
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !showAnnotate) return

    const { offsetX, offsetY } = nativeEvent
    contextRef.current.lineTo(offsetX, offsetY)
    contextRef.current.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !showAnnotate) return

    contextRef.current.closePath()
    setIsDrawing(false)

    // Save the current canvas state
    const canvas = canvasRef.current
    const imageData = canvas.toDataURL()
    setAnnotations((prev) => ({
      ...prev,
      [questionIndex]: imageData,
    }))
  }

  const clearAnnotations = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Remove saved annotations for this question
    setAnnotations((prev) => {
      const newAnnotations = { ...prev }
      delete newAnnotations[questionIndex]
      return newAnnotations
    })
  }

  const handleItemClick = (e, { name }) => {
    setUserSlectedAns(name)
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: name,
    }))
  }

  const toggleMarkForReview = () => {
    const newMarked = new Set(markedForReview)
    if (newMarked.has(questionIndex)) {
      newMarked.delete(questionIndex)
    } else {
      newMarked.add(questionIndex)
    }
    setMarkedForReview(newMarked)
  }

  const handleNext = () => {
    if (questionIndex === data.length - 1) {
      let correctCount = 0
      const qna = data.map((question, index) => {
        const userAnswer = answers[index] || null
        const isCorrect = userAnswer === he.decode(question.correct_answer)
        if (isCorrect) correctCount++

        return {
          question: he.decode(question.question),
          user_answer: userAnswer,
          correct_answer: he.decode(question.correct_answer),
          point: isCorrect ? 1 : 0,
        }
      })

      return endQuiz({
        totalQuestions: data.length,
        correctAnswers: correctCount,
        timeTaken,
        questionsAndAnswers: qna,
      })
    }

    setQuestionIndex(questionIndex + 1)
  }

  const handlePrevious = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1)
    }
  }

  const timeOver = (timeTaken) => {
    let correctCount = 0
    const qna = data.map((question, index) => {
      const userAnswer = answers[index] || null
      const isCorrect = userAnswer === he.decode(question.correct_answer)
      if (isCorrect) correctCount++

      return {
        question: he.decode(question.question),
        user_answer: userAnswer,
        correct_answer: he.decode(question.correct_answer),
        point: isCorrect ? 1 : 0,
      }
    })

    return endQuiz({
      totalQuestions: data.length,
      correctAnswers: correctCount,
      timeTaken,
      questionsAndAnswers: qna,
    })
  }

  const getOptionLabel = (index) => String.fromCharCode(65 + index)

  const jumpToQuestion = (index) => {
    setQuestionIndex(index)
    setShowQuestionNav(false)
  }

  const getQuestionStatus = (index) => {
    if (answers[index]) return "answered"
    if (markedForReview.has(index)) return "marked"
    if (index === questionIndex) return "current"
    return "unanswered"
  }

  const toggleCrossOut = (optionIndex) => {
    const questionKey = `${questionIndex}-${optionIndex}`
    setCrossedOutAnswers((prev) => ({
      ...prev,
      [questionKey]: !prev[questionKey],
    }))
  }

  const undoCrossOut = (optionIndex) => {
    const questionKey = `${questionIndex}-${optionIndex}`
    setCrossedOutAnswers((prev) => {
      const newState = { ...prev }
      delete newState[questionKey]
      return newState
    })
  }

  const isCrossedOut = (optionIndex) => {
    const questionKey = `${questionIndex}-${optionIndex}`
    return crossedOutAnswers[questionKey] || false
  }

  const takeScreenshot = async () => {
    const quizElement = document.querySelector(".sat-test-container")
    if (!quizElement) return

    try {
      const canvas = await html2canvas(quizElement)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))

      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([clipboardItem])
        toast.success("📋 Screenshot copied to clipboard!")
      } else {
        toast.error("❌ Clipboard API not supported.")
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err)
      toast.error("⚠️ Failed to copy screenshot.")
    }
  }

  const searchFromScreenshot = async () => {
    const quizElement = document.querySelector(".passage-content") // just question area
    if (!quizElement) return

    try {
      const canvas = await html2canvas(quizElement)
      const imageData = canvas.toDataURL("image/png")

      const {
        data: { text },
      } = await Tesseract.recognize(imageData, "eng")
      const cleanedText = encodeURIComponent(text.trim().replace(/\s+/g, " "))

      if (cleanedText) {
        const searchUrl = `https://www.google.com/search?q=${cleanedText}`
        window.open(searchUrl, "_blank")
      } else {
        alert("No text detected to search.")
      }
    } catch (err) {
      console.error("Search failed:", err)
    }
  }

  const useFiftyFiftyLifeline = () => {
    if (hiddenOptions[questionIndex]) return

    const correctAnswer = he.decode(current.correct_answer)
    const incorrectOptions = []

    // Find all incorrect options with their indices
    current.options.forEach((option, index) => {
      const decodedOption = he.decode(option)
      if (decodedOption !== correctAnswer) {
        incorrectOptions.push(index)
      }
    })

    // Randomly select 2 incorrect options to hide
    if (incorrectOptions.length >= 2) {
      const shuffled = [...incorrectOptions].sort(() => Math.random() - 0.5)
      const optionsToHide = shuffled.slice(0, 2)

      setHiddenOptions((prev) => ({
        ...prev,
        [questionIndex]: optionsToHide,
      }))

      toast.success("🎯 50:50 Lifeline used! 2 incorrect answers removed.")
    }
  }

  const useFateFlipLifeline = () => {
    if (fateFlipUsed) return
    setShowFateFlipConfirm(true)
  }

  const confirmFateFlip = () => {
    setShowFateFlipConfirm(false)
    setFateFlipAnimating(true)

    // Play heartbeat sound
    const playHeartbeat = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(60, audioContext.currentTime) // Low heartbeat frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.8)
    }

    // Play coin flip sound after heartbeat
    const playCoinFlip = () => {
      setTimeout(() => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3)
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }, 1000)
    }

    playHeartbeat()
    playCoinFlip()

    // Randomly select an answer after animation
    setTimeout(() => {
      const availableOptions = current.options.filter((_, index) => {
        return !hiddenOptions[questionIndex]?.includes(index)
      })

      if (availableOptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableOptions.length)
        const selectedOption = he.decode(availableOptions[randomIndex])

        setUserSlectedAns(selectedOption)
        setAnswers((prev) => ({
          ...prev,
          [questionIndex]: selectedOption,
        }))

        toast.success("🔮 Fate has chosen your answer!")
      }

      setFateFlipUsed(true)
      setFateFlipAnimating(false)
    }, 2000)
  }

  const cancelFateFlip = () => {
    setShowFateFlipConfirm(false)
  }

  const fetchWordDefinition = async (word) => {
    try {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "")
      if (!cleanWord) return

      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)

      if (!response.ok) {
        toast.error(`📖 No definition found for "${word}"`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        return
      }

      const data = await response.json()
      const entry = data[0]
      const meaning = entry.meanings[0]
      const definition = meaning.definitions[0]

      const definitionText = definition.definition
      const example = definition.example ? `\n\nExample: "${definition.example}"` : ""
      const partOfSpeech = meaning.partOfSpeech ? ` (${meaning.partOfSpeech})` : ""

      toast.success(
        <div>
          <strong>📖 {word.charAt(0).toUpperCase() + word.slice(1)}</strong>
          {partOfSpeech}
          <br />
          <span style={{ fontSize: "0.9em", marginTop: "4px", display: "block" }}>
            {definitionText}
            {example}
          </span>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            maxWidth: "400px",
            fontSize: "14px",
          },
        },
      )
    } catch (error) {
      console.error("Dictionary API error:", error)
      toast.error(`📖 Failed to fetch definition for "${word}"`, {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  const toggleDictionaryMode = () => {
    setDictionaryMode(!dictionaryMode)
    if (!dictionaryMode) {
      toast.info("📖 Dictionary Mode Activated! Double-click any word in the passage to see its meaning instantly.", {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: "500",
        },
      })
    } else {
      toast.info("📖 Dictionary Mode Deactivated", {
        position: "top-center",
        autoClose: 2000,
      })
    }
  }

  const startScreenRecording = async () => {
    try {
      // Get screen capture stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true, // This captures system audio
      })

      // Get microphone audio stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      // Create audio context for mixing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const destination = audioContext.createMediaStreamDestination()

      // Create gain nodes for volume control
      const micGain = audioContext.createGain()
      const systemGain = audioContext.createGain()

      // Set volumes (adjust as needed)
      micGain.gain.value = 1.0 // Microphone volume
      systemGain.gain.value = 0.7 // System audio volume (slightly lower)

      // Connect microphone audio
      if (micStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(micStream)
        micSource.connect(micGain)
        micGain.connect(destination)
      }

      // Connect system audio if available
      if (screenStream.getAudioTracks().length > 0) {
        const systemSource = audioContext.createMediaStreamSource(screenStream)
        systemSource.connect(systemGain)
        systemGain.connect(destination)
      }

      // Create combined stream with video from screen and mixed audio
      const combinedStream = new MediaStream()

      // Add video track from screen
      screenStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track)
      })

      // Add mixed audio track
      destination.stream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track)
      })

      // Create MediaRecorder with combined stream
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      })

      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Clean up audio context
        audioContext.close()

        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
        const url = URL.createObjectURL(blob)

        // Create download link with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
        const a = document.createElement("a")
        a.href = url
        a.download = `quiz-recording-${timestamp}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Clean up
        URL.revokeObjectURL(url)
        toast.success("📹 Recording saved successfully!")
      }

      // Handle screen share ending
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenRecording()
      }

      mediaRecorderRef.current = mediaRecorder
      setMicStream(micStream)
      mediaRecorder.start()
      setIsRecording(true)
      toast.success("📹 Screen + microphone recording started!")
    } catch (err) {
      console.error("Error starting screen recording:", err)
      if (err.name === "NotAllowedError") {
        toast.error("❌ Please allow screen sharing and microphone access to start recording.")
      } else {
        toast.error("❌ Failed to start recording. Please try again.")
      }
    }
  }

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()

      // Stop all tracks from the recorder's stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }

    // Stop microphone stream
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop())
      setMicStream(null)
    }

    setIsRecording(false)
    toast.info("⏹️ Recording stopped and saved!")
  }

  const toggleScreenRecording = () => {
    if (isRecording) {
      stopScreenRecording()
    } else {
      startScreenRecording()
    }
  }

  return (
    <div className="sat-test-container">
      {/* SAT Header */}
      <div className="sat-header">
        <div className="header-left">
          <h1 className="section-title">{current.category}</h1>
        </div>
        <div className="header-right">
          <Countdown countdownTime={countdownTime} timeOver={timeOver} setTimeTaken={setTimeTaken} />
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-left">
          <button className="nav-button directions-button" onClick={() => setShowDirections(!showDirections)}>
            Directions <span className="dropdown-arrow">▼</span>
          </button>
          <button className="nav-button hide-button">Hide</button>
        </div>
        <div className="nav-right">
          <button
            className={`nav-button annotate-button ${showAnnotate ? "active" : ""}`}
            onClick={() => {
              setShowAnnotate(!showAnnotate)
              if (showCrossOut) setShowCrossOut(false)
            }}
            title="Annotate"
          >
            <span className="icon">✎</span>
            <span className="btn-text">Annotate</span>
          </button>
          <button
            className={`nav-button cross-out-button ${showCrossOut ? "active" : ""}`}
            onClick={() => {
              setShowCrossOut(!showCrossOut)
              if (showAnnotate) setShowAnnotate(false)
            }}
            title="Cross out answer choices you think are wrong"
          >
            <span className="icon">⊗</span>
            <span className="btn-text">Cross out</span>
          </button>
        </div>
      </div>

      {/* Colorful Separator */}
      <div className="rainbow-separator"></div>

      {/* Annotation Tools */}
      {showAnnotate && (
        <div className="annotation-toolbar">
          <div className="tool-group">
            <button
              className={`tool-btn ${currentTool === "pen" ? "active" : ""}`}
              onClick={() => setCurrentTool("pen")}
              title="Pen"
            >
              ✏️
            </button>
            <button
              className={`tool-btn ${currentTool === "highlighter" ? "active" : ""}`}
              onClick={() => setCurrentTool("highlighter")}
              title="Highlighter"
            >
              🖌️
            </button>
            <button
              className={`tool-btn ${currentTool === "eraser" ? "active" : ""}`}
              onClick={() => setCurrentTool("eraser")}
              title="Eraser"
            >
              🧽
            </button>
          </div>
          <div className="color-group">
            <button
              className={`color-btn red ${currentColor === "#FF5252" ? "active" : ""}`}
              onClick={() => setCurrentColor("#FF5252")}
              title="Red"
            ></button>
            <button
              className={`color-btn blue ${currentColor === "#2196F3" ? "active" : ""}`}
              onClick={() => setCurrentColor("#2196F3")}
              title="Blue"
            ></button>
            <button
              className={`color-btn green ${currentColor === "#4CAF50" ? "active" : ""}`}
              onClick={() => setCurrentColor("#4CAF50")}
              title="Green"
            ></button>
            <button
              className={`color-btn yellow ${currentColor === "#FFEB3B" ? "active" : ""}`}
              onClick={() => setCurrentColor("#FFEB3B")}
              title="Yellow"
            ></button>
          </div>
          <div className="action-group">
            <button className="action-btn clear" onClick={clearAnnotations} title="Clear All">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Panel - Passage */}
        <div className="passage-panel">
          <div className="passage-tools">
            <button className="tool-button" onClick={takeScreenshot} title="Take Screenshot">
              <span className="tool-icon">📸</span>
            </button>

            <button className="tool-button" onClick={searchFromScreenshot} title="Search this question on Google">
              <span className="tool-icon">🔍</span>
            </button>

            <button
              className="tool-button"
              onClick={() => window.open("https://t.me/digitalsatpdf12", "_blank")}
              title="Join our Telegram group"
            >
              <span className="tool-icon">
                <FaTelegramPlane />
              </span>{" "}
            </button>

            {/* TTS Button - Replaces Profile Icon */}
            <button
              className={`tool-button ${ttsEnabled ? "active" : ""} ${isSpeaking ? "speaking" : ""}`}
              onClick={handleTTSButtonClick}
              title={
                ttsEnabled
                  ? "TTS ON - Click to turn OFF and stop speaking"
                  : "TTS OFF - Click to turn ON and start reading"
              }
            >
              <span className="tool-icon">{isSpeaking ? "🔊" : ttsEnabled ? "🔉" : "🔇"}</span>
            </button>

            <button
              className={`tool-button ${distractionAlert ? "active" : ""}`}
              onClick={() => setDistractionAlert(!distractionAlert)}
              title={`Distraction Alert: ${distractionAlert ? "ON" : "OFF"}`}
            >
              <span className="tool-icon">{distractionAlert ? "🔔" : "🔕"}</span>
            </button>
            <button
              className={`tool-button ${isRecording ? "active recording-blink" : ""}`}
              onClick={toggleScreenRecording}
              title={`Screen + Mic Recording: ${isRecording ? "Recording... Click to stop" : "Click to start recording"}`}
            >
              <span className="tool-icon">{isRecording ? "⏹️" : "📹"}</span>
            </button>
            <button
              className={`tool-button ${fiftyFiftyUsed || hiddenOptions[questionIndex] ? "disabled" : ""}`}
              onClick={useFiftyFiftyLifeline}
              disabled={hiddenOptions[questionIndex]}
              title={
                hiddenOptions[questionIndex]
                  ? "50:50 already used on this question"
                  : "Use 50:50 Lifeline - Remove 2 incorrect answers"
              }
            >
              <span className="tool-icon">🎯</span>
            </button>
            <button
              className={`tool-button ${fateFlipUsed ? "disabled" : ""} ${fateFlipAnimating ? "fate-flip-animating" : ""}`}
              onClick={useFateFlipLifeline}
              disabled={fateFlipUsed}
              title={fateFlipUsed ? "Fate Flip already used" : "Use Fate Flip - Let fate choose your answer"}
            >
              <span className="tool-icon">🔮</span>
            </button>
            <button
              className="tool-button"
              onClick={() => {
                // Get all possible question indices except current one
                const availableIndices = Array.from({ length: data.length }, (_, i) => i).filter(
                  (i) => i !== questionIndex,
                )

                if (availableIndices.length > 0) {
                  // Randomly select from available indices
                  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
                  setQuestionIndex(randomIndex)
                  toast.success(`🎲 Jumped to question ${randomIndex + 1}!`)
                }
              }}
              title="Jump to a random question"
            >
              <span className="tool-icon">🎲</span>
            </button>
            <button
              className={`tool-button ${dictionaryMode ? "active" : ""}`}
              onClick={toggleDictionaryMode}
              title={
                dictionaryMode
                  ? "Dictionary Mode: ON - Double-click words for definitions"
                  : "Dictionary Mode: OFF - Click to activate"
              }
            >
              <span className="tool-icon">📖</span>
            </button>
            <button className="tool-button calculator-button" onClick={openCalculator} title="Open Desmos Calculator">
              <span className="tool-icon">🔢</span>
            </button>
            <button className="tool-button gravity-button" onClick={toggleGravityModal} title="Who Am I?">
              <span className="tool-icon">👤</span>
            </button>
          </div>
          <div className="passage-content" ref={passageContentRef}>
            {/* Canvas for annotations */}
            {showAnnotate && (
              <canvas
                ref={canvasRef}
                className="annotation-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            )}

            {/* Question Image */}
            {current.image_base64 && (
              <div className="question-image-container">
                <img
                  src={current.image_base64 || "/placeholder.svg"}
                  alt="Question diagram"
                  className="question-image"
                />
              </div>
            )}

            {/* Question Text */}
            <p className="passage-text">{he.decode(current.question)}</p>
          </div>
        </div>

        {/* Right Panel - Question */}
        <div className="question-panel">
          <div className="question-header">
            <div className="question-number-badge">{questionIndex + 1}</div>
            <button
              className={`review-button ${markedForReview.has(questionIndex) ? "marked" : ""}`}
              onClick={toggleMarkForReview}
            >
              <span className="bookmark-icon">🔖</span> Mark for Review
            </button>
            <button
              className={`night-mode-toggle ${nightMode ? "active" : ""}`}
              onClick={() => setNightMode(!nightMode)}
              title="Toggle Night Mode"
            >
              <span className="night-mode-icon">{nightMode ? "☀️" : "🌙"}</span>
            </button>
          </div>

          <div className="rainbow-separator small"></div>

          <div className="question-content">
            <div className="answer-options">
              {current.options.map((option, i) => {
                const decoded = he.decode(option)
                const isSelected = userSlectedAns === decoded
                const isCrossed = isCrossedOut(i)
                const isHidden = hiddenOptions[questionIndex]?.includes(i)

                // Don't render hidden options
                if (isHidden) {
                  return (
                    <div key={i} className="option-container hidden-option">
                      <div className="option disabled-option">
                        <div className="option-letter">{getOptionLabel(i)}</div>
                        <span className="option-text eliminated">--- Eliminated ---</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={i} className="option-container">
                    <button
                      onClick={(e) => handleItemClick(e, { name: decoded })}
                      className={`option ${isSelected ? "selected" : ""} ${isCrossed ? "crossed-out" : ""}`}
                      disabled={isCrossed && !isSelected}
                    >
                      <div className="option-letter">{getOptionLabel(i)}</div>
                      <span className="option-text">{decoded}</span>
                      {isCrossed && <div className="cross-out-line"></div>}
                    </button>

                    {showCrossOut && !isHidden && (
                      <div className="option-controls">
                        {!isCrossed ? (
                          <button
                            className="cross-out-btn"
                            onClick={() => toggleCrossOut(i)}
                            title="Cross out this answer"
                          >
                            <span className="cross-icon">⊗</span>
                          </button>
                        ) : (
                          <button className="undo-btn" onClick={() => undoCrossOut(i)} title="Undo cross out">
                            Undo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Rainbow Separator */}
      <div className="rainbow-separator bottom"></div>

      {/* Fate Flip Confirmation Popup */}
      {showFateFlipConfirm && (
        <div className="fate-flip-popup-overlay">
          <div className="fate-flip-popup">
            <div className="fate-flip-header">
              <h3>🔮 Fate Flip</h3>
            </div>
            <div className="fate-flip-content">
              <p>Wanna use Fate Flip to randomly answer this question?</p>
              <div className="fate-flip-buttons">
                <button className="fate-flip-confirm" onClick={confirmFateFlip}>
                  Yes, go for it
                </button>
                <button className="fate-flip-cancel" onClick={cancelFateFlip}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fate Flip Animation Overlay */}
      {fateFlipAnimating && (
        <div className="fate-flip-animation-overlay">
          <div className="fate-flip-animation">
            <div className="spinning-coin">🪙</div>
            <p>Fate is deciding...</p>
          </div>
        </div>
      )}

      {/* Gravity Profile Modal */}
      {showGravityModal && (
        <div className="gravity-modal-overlay" onClick={handleGravityOverlayClick}>
          <div className="gravity-modal">
            <button
              className="gravity-modal-close"
              onClick={() => setShowGravityModal(false)}
              aria-label="Close gravity modal"
            >
              ×
            </button>

            <div className="gravity-modal-content">
              <div className="gravity-header">
                <div className="gravity-icon">🌌</div>
                <h1 className="gravity-title">Resources We Used:</h1>
              </div>

              <div className="gravity-quote">
                <p className="quote-text">
                  "You can resist me. You can deny me. But in the end, I pull everything back into focus."
                </p>
              </div>

              <div className="gravity-subtext">
                <p>Unseen. Unstoppable. Unshakable.</p>
              </div>

              <div className="gravity-footer">
                <div className="gravity-particles">
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Navigator Popup */}
      {showQuestionNav && (
        <div className="question-navigator-popup">
          <div className="nav-popup-header">
            <h3>Question Navigator</h3>
            <button className="close-nav" onClick={() => setShowQuestionNav(false)}>
              ×
            </button>
          </div>
          <div className="nav-legend">
            <div className="legend-item">
              <div className="legend-dot answered"></div>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot marked"></div>
              <span>Marked</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot current"></div>
              <span>Current</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot unanswered"></div>
              <span>Not Answered</span>
            </div>
          </div>
          <div className="nav-grid">
            {data.map((_, index) => (
              <button
                key={index}
                className={`nav-question ${getQuestionStatus(index)}`}
                onClick={() => jumpToQuestion(index)}
              >
                {index + 1}
                {markedForReview.has(index) && <span className="review-flag">🔖</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="question-counter" onClick={() => setShowQuestionNav(!showQuestionNav)}>
          Question {questionIndex + 1} of {data.length} <span className="dropdown-arrow">▲</span>
        </button>
        <button onClick={handleNext} className="next-btn">
          Next
        </button>
      </div>
    </div>
  )
}

Quiz.propTypes = {
  data: PropTypes.array.isRequired,
  countdownTime: PropTypes.number.isRequired,
  endQuiz: PropTypes.func.isRequired,
}

export default Quiz
