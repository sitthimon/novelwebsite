import logo from './logo.svg';
import './App.css';

import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Tailwind Test
        </h1>
        
        <div className="text-center">
          <p className="text-xl mb-4">Count: {count}</p>
          
          <div className="space-x-4">
            <button 
              onClick={() => setCount(count - 1)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              -
            </button>
            
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              +
            </button>
          </div>
          
          <button 
            onClick={() => setCount(0)}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded block mx-auto"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
