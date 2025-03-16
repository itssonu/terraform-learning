import Swal from "sweetalert2";

export const confirm = ({ title = 'Are you sure?', text = '', html = '', icon, confirmButtonText = 'Okay', showCancelButton = false, cancelButtonText = 'No' } = {}) => {
    return Swal.fire({
        title,
        text,
        html,
        icon,
        showCancelButton,
        confirmButtonText,
        cancelButtonText,
        customClass: {
            confirmButton: 'custom-swal-button'
        },
    });
}