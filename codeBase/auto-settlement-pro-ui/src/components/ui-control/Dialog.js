import React, { useEffect, useState } from 'react'
import Modal from 'react-modal'


// import { MdOutlineClose } from 'react-icons/md';

import RenderIf from '../render-if/Renderif';
import zIndex from '@mui/material/styles/zIndex';

const Dialog = ({ onToggleDialog, isModalOpen, children, shouldNotShowButtons, okBtnText, cancelBtnText, okBtnClick, cancelBtnClick, mode, style, okBtnStyleType = 'primary', cancelBtnStyleType = 'danger', additionalStyle, dialogContentClass, isCloseIconHidden, onAfterModalOpen }) => {

  const [selectedStyle, setSelectedStyle] = useState({});
  const [isModalDialogOpen, setIsModalDialogOpen] = useState(false);

  const clickableAreaFromTopOfDialogInPixels = 100;

  const dialogStyles = [

    {
      mode: 'full', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          height: '80vh',
          width: '80vw',
          border: '2px solid blue',
          overflow: 'hidden',
          ...additionalStyle
        },
      }
    },
    {
      mode: 'half', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '85vh',
          width: '768px',
          borderRadius: '18px',
          overflow: 'hidden',
          ...additionalStyle
        },
      }
    },
    {
      mode: 'single-column', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '85vh',
          width: '400px',
          borderRadius: '18px',
          overflow: 'hidden',
          height: "100%",
          ...additionalStyle
        },
      }
    },
    {
      mode: 'semi-half', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          minHeight: '321px',
          maxHeight: '85vh',
          width: '768px',
          borderRadius: '18px',
          overflow: 'hidden',
          ...additionalStyle
        },
      }
    },
    {
      mode: 'fit', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          //minHeight: '321px',
          //maxHeight: '85vh',
          width: '768px',
          borderRadius: '18px',
          overflow: 'hidden',
          ...additionalStyle
        },
      }
    },
    {
      mode: 'small-half', style: {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          minHeight: '280px',
          maxHeight: '75vh',
          width: '600px',
          borderRadius: '18px',
          overflow: 'hidden',
          ...additionalStyle
        },
      }
    },
    {
      mode: 'custom', style: {
        content: style
      }
    }];

  useEffect(() => {

    function dragElement(elmnt) {
      var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      var currentElement = null
      if (elmnt) {
        /* if present, the header is where you move the DIV from:*/
        elmnt.onmousedown = dragMouseDown;
      } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {

        currentElement = e.currentTarget;

        if (shouldRestrictDragging(e.srcElement.nodeName)) return;
        e = e || window.event;
        // e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        const isThisSectionOfDialogClickable = checkIfClickedSectionOfDialogIsClickable(currentElement, pos4);
        if (!isThisSectionOfDialogClickable) return;

        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    if (isModalDialogOpen) {
      dragElement(document.getElementById("modal-dialog"));
    }

  }, [isModalDialogOpen])

  useEffect(() => {
    if (isModalOpen) {
      openModal()
      return
    }
    closeModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen])

  useEffect(() => {
    setSelectedStyle(getSelectedModeStyle());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const checkIfClickedSectionOfDialogIsClickable = (element, clickedYCoord) => {
    const dialogRect = element.getBoundingClientRect();
    const dialogTop = dialogRect.top + window.scrollY; // Top position of the dialog including the scroll offset
    const distanceFromTop = clickedYCoord - dialogTop;

    const isThisSectionOfDialogClickable = distanceFromTop <= clickableAreaFromTopOfDialogInPixels;

    return isThisSectionOfDialogClickable;
  }

  const shouldRestrictDragging = (nodeName) => {
    return nodeName.toLowerCase() === "input" || nodeName.toLowerCase() === "select";
  }

  const getSelectedModeStyle = () => dialogStyles.find(x => x.mode === mode)?.style || dialogStyles[0].style;

  const openModal = () => {
    onToggleDialog(true);
    setIsModalDialogOpen(true);
  }

  const closeModal = () => {
    onToggleDialog(false)
    setIsModalDialogOpen(false);
  }

  return (

    <Modal
      id="modal-dialog"
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={false}
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      style={selectedStyle}
      contentLabel="Example Modal"
      ariaHideApp={false}
      onAfterOpen={onAfterModalOpen}
    >
      {/* <RenderIf shouldRender={!isCloseIconHidden}>
        <div className="btn btn-theme">
          <button size={25} color="#2F3846" onClick={() => closeModal()} style={{ background: 'none', border: 'none', fontSize: '20px' }}>X</button>
        </div>
      </RenderIf> */}

      {/* <div style={{height:"100%",position:'relative', background:'red', width:"100%"}}>jnlkjn</div> */}


      <div className={`dialog-content-container ${dialogContentClass ? ' ' + dialogContentClass : ''}`}>
        {children}
      </div>

      <RenderIf shouldRender={!shouldNotShowButtons}>
        <div class="mt-35"></div>
      </RenderIf>

      {/* {!shouldNotShowButtons ? <div className="dialog-btn-container " >
        {okBtnText ? <Button text={okBtnText} onClick={okBtnClick} styleType={okBtnStyleType} /> : React.Fragment}
        <span className="ml-10"></span>
        {cancelBtnText ? <Button text={cancelBtnText} styleType={cancelBtnStyleType} onClick={cancelBtnClick} /> : React.Fragment}
      </div> : React.Fragment} */}
    </Modal>
  )
}

export default Dialog
