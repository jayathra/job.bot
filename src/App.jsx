import { useState } from 'react'
import './App.css'
import FileUpload from './FileUpload.jsx'

function App() {
  const [count, setCount] = useState(0)

  

  return (
    <>
      <h1>job.bot</h1>
      <FileUpload />
    </>
  )
}

export default App
