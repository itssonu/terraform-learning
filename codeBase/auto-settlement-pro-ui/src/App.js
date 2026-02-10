import Routes from "./Routes";
import { ToastContainer } from 'react-toastify';
import 'react-loading-skeleton/dist/skeleton.css'
import "./assets/css/global-styles.css"
import { useEffect } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import 'bootstrap/dist/js/bootstrap.bundle.min';

function App() {
  useEffect(() => {
    console.log(process.env);
    
  }, [])
  return (
    <SkeletonTheme>
      <div className="App">
        <Routes />
        <ToastContainer />
      </div>
    </SkeletonTheme>
  );
}

export default App;
