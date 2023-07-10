import React from 'react'
import { MenuItem, Select } from '@mui/material'
import { Box } from '@mui/material'
import { Fade} from '@mui/material'
import { Popper } from '@mui/material'
import { FormControl } from "@mui/material";
import { InputLabel } from "@mui/material";
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
import { v4 as uuidv4 } from 'uuid';
import {
  createTheme,
  ThemeProvider,
} from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: "#FF9F1C"
    }
  }
});


const nv = new Niivue({
  loadingText: 'Drag-drop images or Click "+" button',
  dragAndDropEnabled: true,
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
  const [penMode, setPenMode] = React.useState(-1)
  const modeValueMaps = [-1,0,1,2,3,8,9,10,11,12]
  const modeNameMaps = ["Off", "Erase", "Red", "Green", "Blue", "Filled Erase", "Filled Red", "Filled Green", "Filled Blue", "Erase Cluster"]
  let allModes = modeValueMaps.map((modeValue, id) =>{
    return (<MenuItem value={modeValue} key={modeNameMaps[id]}>{modeNameMaps[id]}</MenuItem>)
  })

  // write a function to handle the pen drawing
  //   document.getElementById("drawPen").addEventListener("change", doDrawPen);
  function doDrawPen(event) {
    console.log(event.target.value)
    const mode = parseInt(event.target.value);
    nv.setDrawingEnabled(mode >= 0);
    if (mode >= 0) nv.setPenValue(mode & 7, mode > 7);
    if (mode === 12)
      //erase selected cluster
      nv.setPenValue(-0);
    setPenMode(mode);
  }

  nv.opts.onImageLoaded = ()=>{
    console.log(`layer name ${nv.volumes[0]}`)
    setLayers([...nv.volumes])
  }

  nv.opts.onLocationChange = (data)=>{
    setLocationData(data.values)
  }
  // construct an array of <Layer> components. Each layer is a NVImage or NVMesh 
  const layerList = layers.map((layer) => {
    console.log(`layer list ${layer.name}`)
    return (
      <Layer 
        key={layer.name} 
        image={layer}
        colorMaps={nv.colormaps()|| []}
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
    console.log(`file imported ${file}`)
    
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
    // find our processed image
    console.log(array.reduce((partialSum, a) => partialSum + a, 0))
    
    let processedImage = nv.volumes[nv.getVolumeIndexByID(id)];
    // console.log(processedImage)
    if (!processedImage) {
      console.log("image not found");
      return;
    }

    console.log(processedImage.img.reduce((partialSum, a) => partialSum + a, 0))
    processedImage = processedImage.clone();
    processedImage.id = uuidv4();
    console.log(processedImage.img.length, array.length)
    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT
    processedImage.img = array

    console.log(processedImage.img.reduce((partialSum, a) => partialSum + a, 0))
    processedImage.trustCalMinMax = false;
    processedImage.calMinMax();
    console.log(processedImage.img.reduce((partialSum, a) => partialSum + a, 0))
    nv.addVolume(processedImage)
    setLayers([...nv.volumes])

    console.log('image processed');
  
  }

  return (
    <ThemeProvider theme={theme}>
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
            color="companyRed"
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
          <FormControl>
                <InputLabel>Mode</InputLabel>
                <Select
                  style={{width: '100px'}}
                  value={penMode}
                  label='Pen'
                  size='small'
                  onChange={doDrawPen}
                >
                  {allModes}
                </Select>
              </FormControl>
        </SettingsPanel>
        </NavBar>

        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%'
          }}
        >	
        <NiivuePanel
          nv={nv}
          volumes={layers}
        >
        </NiivuePanel>
          <Box
            sx={{
              width: "30%",
              display: "flex",
              flexDirection: "row",
              // height: "20%"
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
            {/* <LocationTable 
              tableData={locationData} 
              decimalPrecision={decimalPrecision}
            /> */}
        </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}