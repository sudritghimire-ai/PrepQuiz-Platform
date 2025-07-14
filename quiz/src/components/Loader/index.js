import "./Loader.css"

const Loader = ({ title, message }) => (
  <div className="loader-container">
    <div className="spinner"></div>
    <h3>{title || "Loading..."}</h3>
    <p>{message || "Please wait while we prepare your content."}</p>
  </div>
)

export default Loader
