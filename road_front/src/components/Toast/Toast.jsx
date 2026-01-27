import './Toast.css';

const Toast = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === 'success' && <i className="fas fa-check"></i>}
        {type === 'error' && <i className="fas fa-times"></i>}
        {type === 'warning' && <i className="fas fa-exclamation"></i>}
        {type === 'info' && <i className="fas fa-info"></i>}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Toast;

