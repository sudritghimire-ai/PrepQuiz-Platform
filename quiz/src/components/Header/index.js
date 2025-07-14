import { useState, useEffect } from "react"
import { Menu, Button, Icon, Modal, Input, Label, Message } from "semantic-ui-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Header = () => {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [secretCode, setSecretCode] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const adminAccess = localStorage.getItem("admin_access")
    setIsAdmin(adminAccess === "true")
  }, [])

  useEffect(() => {
    let interval
    if (isLocked && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsLocked(false)
      setAttempts(0)
    }
    return () => clearInterval(interval)
  }, [isLocked, timeLeft])

  const handleSecretAccess = () => {
    if (isLocked) {
      toast.error(`Access locked. Try again in ${timeLeft} seconds.`)
      return
    }
    setModalOpen(true)
  }

  const handleCodeSubmit = () => {
    if (secretCode.toLowerCase() === "chatgptsucks") {
      localStorage.setItem("admin_access", "true")
      setIsAdmin(true)
      setModalOpen(false)
      setSecretCode("")
      setAttempts(0)
      toast.success("Admin access granted")
      setTimeout(() => navigate("/admin"), 500)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= 3) {
        setIsLocked(true)
        setTimeLeft(30)
        setModalOpen(false)
        toast.error("Too many failed attempts. Access locked for 30 seconds.")
      } else {
        toast.error(`Incorrect code. ${3 - newAttempts} attempts remaining.`)
      }
      setSecretCode("")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_access")
    setIsAdmin(false)
    toast.info("Logged out successfully")
    navigate("/")
  }

  return (
    <>
      <Menu
        borderless
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e1e8ed",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          margin: "0",
          borderRadius: "0",
          minHeight: "64px",
          padding: "0 1rem",
        }}
      >
        <Menu.Item
          header
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#2c3e50",
            letterSpacing: "-0.025em",
          }}
        >
          <Icon name="graduation cap" style={{ color: "#3498db", marginRight: "8px" }} />
          SAT
          <span
            style={{
              fontSize: "0.75rem",
              color: "#7f8c8d",
              fontWeight: "400",
              marginLeft: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Testing Platform
          </span>
        </Menu.Item>

        <Menu.Menu position="right">
          {isAdmin && (
            <Menu.Item>
              <Label
                size="small"
                style={{
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  marginRight: "12px",
                }}
              >
                <Icon name="shield" />
                Admin
              </Label>
            </Menu.Item>
          )}

          <Menu.Item>
            {!isAdmin ? (
              <Button
                primary
                size="small"
                onClick={handleSecretAccess}
                disabled={isLocked}
                style={{
                  backgroundColor: isLocked ? "#95a5a6" : "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "500",
                  padding: "8px 16px",
                }}
              >
                <Icon name={isLocked ? "lock" : "plus"} />
                {isLocked ? `Locked (${timeLeft}s)` : "Create Questions"}
              </Button>
            ) : (
              <Button.Group size="small">
                <Button
                  primary
                  onClick={() => navigate("/admin")}
                  style={{
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    fontWeight: "500",
                  }}
                >
                  <Icon name="settings" />
                  Admin Panel
                </Button>
                <Button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    fontWeight: "500",
                  }}
                >
                  <Icon name="sign out" />
                  Logout
                </Button>
              </Button.Group>
            )}
          </Menu.Item>
        </Menu.Menu>
      </Menu>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSecretCode("")
        }}
        size="tiny"
      >
        <Modal.Header style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
          <Icon name="key" />
          Admin Access Required
        </Modal.Header>

        <Modal.Content style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#6c757d", marginBottom: "1.5rem" }}>
            Enter the access code to unlock administrative privileges
          </p>

          <Input
            fluid
            type="password"
            placeholder="Enter access code"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCodeSubmit()}
            style={{ marginBottom: "1rem" }}
          />

          {attempts > 0 && (
            <Message warning size="small">
              <Icon name="warning" />
              {attempts} failed attempt{attempts > 1 ? "s" : ""} - {3 - attempts} remaining
            </Message>
          )}
        </Modal.Content>

        <Modal.Actions style={{ padding: "1rem 2rem", backgroundColor: "#f8f9fa" }}>
          <Button
            onClick={() => {
              setModalOpen(false)
              setSecretCode("")
            }}
            style={{ marginRight: "8px" }}
          >
            Cancel
          </Button>
          <Button
            primary
            onClick={handleCodeSubmit}
            disabled={!secretCode.trim()}
            style={{
              backgroundColor: "#3498db",
              color: "white",
            }}
          >
            <Icon name="unlock" />
            Access
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  )
}

export default Header
