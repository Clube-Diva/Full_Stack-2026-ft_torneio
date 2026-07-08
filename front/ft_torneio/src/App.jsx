import { useState } from 'react'

import TelaTorneio from "./TelaTorneio/TelaTorneio"
function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <TelaTorneio />
    </div>
  )
}

export default App
