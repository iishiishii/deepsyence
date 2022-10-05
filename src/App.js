import logo from './logo.svg';
import './App.css';
import { useRef, useEffect } from 'react'
import { Niivue } from '@niivue/niivue'

const NiiVue = ({ imageUrl }) => {
  
  const canvas = useRef()
  useEffect(() => {
    async function fetchData() { 
    const volumeList = [
        {
          url: imageUrl,
        },
      ]
      const nv = new Niivue()
      nv.attachToCanvas(canvas.current)
    nv.loadVolumes(volumeList)} // press the "v" key to cycle through volumes
    fetchData();
  }, [imageUrl])

  return (
    <canvas ref={canvas} height={480} width={640} />
  )
}

function App() {
  return (
    <div className="App">

      <NiiVue imageUrl={'./sub01.nii'}> </NiiVue>

    </div>
  );
}



// use as: <NiiVue imageUrl={someUrl}> </NiiVue>
export default App;