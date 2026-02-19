import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AllFiles from "./AllFiles.jsx";
import FileDetails from "./FileDetails.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AllFiles />} />
         <Route path="/file/:fileName" element={<FileDetails/>} />
            
            {/* Alternative invoice view route */}
            <Route path="/file/:fileName" element={<FileDetails />} />
            
           
      </Routes>
    </Router>
  );
};

export default App;
