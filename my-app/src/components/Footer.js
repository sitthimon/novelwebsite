import { Route } from "react-router-dom";
import React, { useContext } from "react";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-4">
      <div className="container rounded-lg bg-gray-800 mx-auto p-4 flex flex-col items-center justify-center space-y-2">
        <p className="text-sm">Comments</p>
        <p className="text-xs">Developed by Your Name</p>
        <p className="text-xs">© 2023 Your Website Name</p>
        <p className="text-xs">All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;