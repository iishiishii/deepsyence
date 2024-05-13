import { Box, Divider, MenuItem } from "@mui/material";
import { Typography } from "@mui/material";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ListItemIcon } from "@mui/material";
import { Select } from "@mui/material";
import { InputLabel } from "@mui/material";
import { FormControl } from "@mui/material";
import { Paper } from "@mui/material";
import { IconButton } from "@mui/material";
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react'
import * as ort from 'onnxruntime-web'

export default function Layer(props){
  const image = props.image
  // const [processedImage, setImage] = React.useState(image.img)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [color, setColor] = React.useState(image.colorMap)
  const [visibilityIcon, setVisibilityIcon] = React.useState(true)
  const [opacity, setOpacity] = React.useState(image.opacity)
  let Visibility = visibilityIcon ? <VisibilityIcon /> : <VisibilityOffIcon />
  let ArrowIcon = detailsOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon /> 
  let allColors = image.colorMaps().map((colorName) => {
    return (<MenuItem value={colorName} key={colorName}>{colorName}</MenuItem>)
  })

  function colToRow(colArray) {
    let dims = image.dimsRAS
    // let colArray = image.img
    let rowArray = new Float32Array(dims[1] * dims[2] * dims[3])
    console.log(dims)
    for (var i = 0; i < dims[1]; i++) {
      for (var j = 0; j < dims[2]; j++) {
        for (var k = 0; k < dims[3]; k++) {
          let indexCol = i + j * dims[1] + k * dims[1] * dims[2]
          let indexRow = i * dims[2] * dims[3] + j * dims[3] + k
          rowArray[indexRow] = colArray[indexCol]
        }
      }
    }
    return rowArray;
  }

  function rowToCol(rowArray) {
    let dims = image.dimsRAS
    // let colArray = image.img
    let colArray = new Float32Array(dims[1] * dims[2] * dims[3])
    console.log(dims)
    for (var i = 0; i < dims[1]; i++) {
      for (var j = 0; j < dims[2]; j++) {
        for (var k = 0; k < dims[3]; k++) {
          let indexCol = i + j * dims[1] + k * dims[1] * dims[2]
          let indexRow = i * dims[2] * dims[3] + j * dims[3] + k
          colArray[indexCol] = rowArray[indexRow]
        }
      }
    }
    return colArray;
  }

  const onnxFunct = async () => {
    try {
      let id = image.id

      ort.env.wasm.wasmPaths = new URL('./assets/onnxruntime-web/', document.baseURI).href


      
      // @ts-ignore
      let session = await ort.InferenceSession.create('./assets/model/model_dynamic.onnx');
      const float32Data = colToRow(image.img)
      console.log(image.dims.slice(1).concat([1]))
      console.log(`${float32Data.reduce((partialSum, a) => partialSum + a, 0)}`)
      const inputTensor = new ort.Tensor("float32", float32Data, image.dims.slice(1).concat([1]));

      // prepare feeds. use model input names as keys
      //const feeds = { a: tensorA, b: tensorB }
      var feeds = { input_2:inputTensor };


      // feed inputs and run
      var results = await session.run(feeds, ['conv2d_transpose_9']);

      // read from results
      const newImage = results['conv2d_transpose_9'].data;
      console.log(newImage)
      console.log(`data of result tensor 'c': ${newImage.reduce((partialSum, a) => partialSum + a, 0)}`);
      const rasImage = rowToCol(newImage)
      props.onSetProcess(id, rasImage)

    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `)
    }
  }


  
  function handleDetails(){
    setDetailsOpen(!detailsOpen)
  }


  function handleColorChange(event){
    let clr = event.target.value
    let id = image.id
    console.log(clr)
    props.onColorMapChange(id, clr)
    setColor(clr)
  }

  function handleDelete(){
    props.onRemoveLayer(image)
  }

  function handleOpacity(){
    let idx = image.id
		let currentOpacity = opacity
		const newOpacity = currentOpacity > 0 ? 0 : 1
		props.onSetOpacity(idx, newOpacity)
    setOpacity(newOpacity)
  }

  function visibilityToggle() {
    setVisibilityIcon(!visibilityIcon)
	}

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        
      }}
    >
      <Paper 
        elevation={2}
        sx={{
          m:1
        }}
      >
        <Box 
          sx={{
            margin: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: 20
          }}
        >
          <ListItemIcon onClick={(e) => { e.stopPropagation(); visibilityToggle(image); handleOpacity(image.opacity)}}>
						{Visibility}
					</ListItemIcon>
          <Typography sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {image.name}
          </Typography>
          <IconButton 
            onClick={handleDetails}
            style={{marginLeft:'auto'}}
          >
            {ArrowIcon}
          </IconButton>
        </Box>
        <Box
          sx={{
            display: detailsOpen ? 'flex' : 'none'
          }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection:'row',
              justifyContent: 'left',
              width: '100%'
            }}
            m={1}
          >
            <FormControl>
              <InputLabel>Color</InputLabel>
              <Select
                style={{width: '200px'}}
                value={color}
                label='Color'
                size='small'
                onChange={handleColorChange}
              >
                {allColors}
              </Select>
            </FormControl>
            <IconButton
              onClick={onnxFunct}
            >
              <PlayCircleFilledWhiteIcon />
            </IconButton>
            <IconButton
              onClick={handleDelete}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
