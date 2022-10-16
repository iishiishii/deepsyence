import React from 'react'
import { Button, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Fade} from '@mui/material'
import { Popper } from '@mui/material'
import { Paper } from '@mui/material'
import { Niivue, NVImage} from '@niivue/niivue'
import NavBar from './components/NavBar'
import {SettingsPanel} from './components/SettingsPanel'
import {ColorPicker} from './components/ColorPicker'
import {NumberPicker} from './components/NumberPicker'
import { LayersPanel } from './components/LayersPanel'
import { NiivuePanel } from './components/NiivuePanel'
import NVSwitch from './components/Switch'
import LocationTable from './components/LocationTable'
import Layer from './components/Layer'
import './index.css'

const nv = new Niivue({
  loadingText: 'Drag-drop images or Click "+" button',
  textHeight: "0.02",
  backColor: [0,0,0,1],
  crosshairColor: [244, 243, 238, 0.5]
})

// The NiiVue component wraps all other components in the UI. 
// It is exported so that it can be used in other projects easily
export default function NiiVue(props) {
  const [openLayers, setOpenLayers] = React.useState(false)

  const [layers, setLayers] = React.useState(nv.volumes)
  const [radiological, setRadiological] = React.useState(false)
  const [crosshair3D, setCrosshair3D] = React.useState(false)
  const [colorBar, setColorBar] = React.useState(nv.opts.isColorbar)
  const [clipPlane, setClipPlane] = React.useState(nv.currentClipPlaneIndex > 0 ? true : false)
  // TODO: add crosshair size state and setter
  const [locationData, setLocationData] = React.useState([])
  const [decimalPrecision, setDecimalPrecision] = React.useState(2)
  const [multiplanarPadPixels, setMultiplanarPadPixels] = React.useState(nv.opts.multiplanarPadPixels)
  const [array, handleArray] = React.useState()

  nv.opts.onImageLoaded = ()=>{
    setLayers([...nv.volumes])
  }

  nv.opts.onLocationChange = (data)=>{
    setLocationData(data.values)
  }
  // construct an array of <Layer> components. Each layer is a NVImage or NVMesh 
  const layerList = layers.map((layer) => {
    return (
      <Layer 
        key={layer.name} 
        image={layer}
        onColorMapChange={nvUpdateColorMap}
        onRemoveLayer={nvRemoveLayer}
        onSetOpacity={nvUpdateOpacity}
        onSetProcess={nvProcess}
      />
    )
  })

  async function addLayer(file){
    const nvimage = await NVImage.loadFromFile({
      file: file
    })
    console.log(nvimage.img)
    
    nv.addVolume(nvimage)
    setLayers([...nv.volumes])
  }

  function toggleLayers(){
    setOpenLayers(!openLayers)
  }


  function nvUpdateMultiplanarPadPixels(v){
    nv.opts.multiplanarPadPixels = v
    setMultiplanarPadPixels(v)
    nv.drawScene()
  }


  function nvUpdateClipPlane(){
    if (!clipPlane){
      setClipPlane(true)
      nv.setClipPlane([0, 270, 0]) //left
    } else {
      setClipPlane(false)
      nv.setClipPlane([2, 0, 0]) //none
    }
  }

  function nvUpdateColorBar(){
    setColorBar(!colorBar)
    nv.opts.isColorbar = !colorBar
    nv.drawScene()
  }

  function updateDecimalPrecision(v){
    setDecimalPrecision(v)
  }

  function nvUpdateCrosshair3D(){
    nv.opts.show3Dcrosshair = !crosshair3D
    nv.updateGLVolume()
    setCrosshair3D(!crosshair3D)
  }

  function nvUpdateRadiological(){
    nv.setRadiologicalConvention(!radiological)
    setRadiological(!radiological)
  }


  function nvUpdateSliceType(newSliceType) {
    if (newSliceType === 'axial'){
      nv.setSliceType(nv.sliceTypeAxial)    
    } else if (newSliceType === 'coronal'){
      nv.setSliceType(nv.sliceTypeCoronal)
    } else if (newSliceType === 'sagittal'){
      nv.setSliceType(nv.sliceTypeSagittal)
    } else if (newSliceType === 'multi'){
      nv.setSliceType(nv.sliceTypeMultiplanar)
    } else if (newSliceType === '3d'){
      nv.setSliceType(nv.sliceTypeRender)
    }
  }

  function nvUpdateColorMap(id, clr){
    nv.volumes[nv.getVolumeIndexByID(id)].setColorMap(clr)
    nv.updateGLVolume()
  }

  function nvRemoveLayer(imageToRemove){
    nv.removeVolume(imageToRemove)
    setLayers([...nv.volumes])
  }

  function nvUpdateOpacity(id, opacity){
    // console.log(nv.getVolumeIndexByID(id))
    nv.setOpacity(nv.getVolumeIndexByID(id),opacity)
    nv.updateGLVolume()
  }

  function nvProcess(id, array){
    console.log(id)
    nv.volumes[nv.getVolumeIndexByID(id)].img.splice(0, array.length, ...array)
    nv.updateGLVolume()
  }

	// nv.on('intensityRange', (nvimage) => {
	// 	//setIntensityRange(nvimage)
	// })

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems:'stretch',
      height: '100vh',
      backgroundColor: 'black'
      }}
    >	
      

      <NavBar
        nvUpdateSliceType={nvUpdateSliceType}
      >
        <SettingsPanel 
        width={300}
      >

        <NVSwitch
          checked={clipPlane}
          title={'Clip plane'}
          onChange={nvUpdateClipPlane}
        >
        </NVSwitch>
        <NVSwitch
          checked={radiological}
          title={'radiological'}
          onChange={nvUpdateRadiological}
        >
        </NVSwitch>
        <NVSwitch
          checked={crosshair3D}
          title={'3D crosshair'}
          onChange={nvUpdateCrosshair3D}
        >
        </NVSwitch>
        <NVSwitch
          checked={colorBar}
          title={'Show color bar'}
          onChange={nvUpdateColorBar}
        >
        </NVSwitch>

        <NumberPicker
          value={decimalPrecision}
          onChange={updateDecimalPrecision}
          title={'Decimal precision'}
          min={0}
          max={8}
          step={1}
        >
        </NumberPicker>
        <NumberPicker
          value={multiplanarPadPixels}
          onChange={nvUpdateMultiplanarPadPixels}
          title={'Multiplanar padding'}
          min={0}
          max={20}
          step={2}
        >
        </NumberPicker>

      </SettingsPanel>
      </NavBar>
      <NiivuePanel
        nv={nv}
        volumes={layers}
      >
      </NiivuePanel>
        <Box
          sx={{
            width: props.width,
            display: "flex",
            flexDirection: "row",
            height: "20%"
          }}
        >
          <LayersPanel
            open={openLayers}
            // width={320}
            onToggleMenu={toggleLayers}
            onAddLayer={addLayer}
          >
            {layerList} 
          </LayersPanel>
          <LocationTable 
            tableData={locationData} 
            decimalPrecision={decimalPrecision}
          />
      </Box>
    </Box>
  )
}
