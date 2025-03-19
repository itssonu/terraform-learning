import { toast } from 'react-toastify';

// Function to show a success toast
export const successToast = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 2000, 
  });
};

// Function to show an error toast
export const errorToast = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 2000, 
  });
};

// Function to show an error toast
export const toaster = ({message, success}) => {
  if (success) {
    successToast(message)
  }else{
    errorToast(message)
  }
};
