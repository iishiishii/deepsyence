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

  const onnxFunct = async () => {
    try {
      let id = image.id
      // let processImage
      // let tensorType
      ort.env.wasm.wasmPaths = new URL('./assets/onnxruntime-web/', document.baseURI).href
      // switch (image.hdr.datatypeCode) {
      //   case image.DT_UNSIGNED_CHAR:
      //     processImage = Uint8Array.from(image.img);
      //     tensorType = "uint8"
      //     break;
      //   case image.DT_SIGNED_SHORT:
      //     processImage = Int16Array.from(image.img);
      //     tensorType = "int16"
      //     break;
      //   case image.DT_FLOAT:
      //     processImage = Float32Array.from(image.img);
      //     tensorType = "float32"
      //     break;
      //   case image.DT_DOUBLE:
      //     throw "datatype " + image.hdr.datatypeCode + " not supported";
      //   case image.DT_RGB:
      //     processImage = Uint8Array.from(image.img);
      //     tensorType = "uint8"
      //     break;
      //   case image.DT_UINT16:
      //     processImage = Uint16Array.from(image.img);
      //     tensorType = "uint16"
      //     break;
      //   case image.DT_RGBA32:
      //     processImage = Uint8Array.from(image.img);
      //     tensorType = "uint8"
      //     break;
      //   default:
      //     throw "datatype " + image.hdr.datatypeCode + " not supported";
      // }

      
      // @ts-ignore
      let session = await ort.InferenceSession.create('./assets/model/model_dynamic.onnx');
      const float32Data = Float32Array.from(image.img)
      console.log(image.dims.slice(1).concat([1]))
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

      props.onSetProcess(id, newImage)
      // setImage(newImage)
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `)
    }
  }

  // React.useEffect(() => {

  //   onnxFunct()    

  //   // return () => { // clean-up function
  //   // }
  // }, [])
  
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
            width:600,
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
              justifyContent: 'space-between',
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
