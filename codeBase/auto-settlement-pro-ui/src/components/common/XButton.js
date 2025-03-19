import { ClipLoader } from 'react-spinners';

const XButton = ({
  variant = 'primary',
  type = 'button',
  className = 'btn-theme',
  disabled = false,
  onClick = () => { },
  loading = false,
  loadingText = 'Loading...',
  buttonText = 'Submit',
}) => {
  return (
    <button
      variant={variant}
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <ClipLoader size={15} color={"#fff"} />}
      {loading ? ` ${loadingText}` : buttonText}
    </button>
  );
};

export default XButton;
