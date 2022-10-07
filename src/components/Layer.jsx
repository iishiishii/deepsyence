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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react'

export default function Layer(props){
  const image = props.image
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [color, setColor] = React.useState(image.colorMap)
  const [visibilityIcon, setVisibilityIcon] = React.useState(true)
  const [opacity, setOpacity] = React.useState(image.opacity)
  let Visibility = visibilityIcon ? <VisibilityIcon /> : <VisibilityOffIcon />
  let ArrowIcon = detailsOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon /> 
  let allColors = image.colorMaps().map((colorName) => {
    return (<MenuItem value={colorName} key={colorName}>{colorName}</MenuItem>)
  })
  
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
    // console.log(idx)
		let currentOpacity = opacity
    // console.log(currentOpacity)
		const newOpacity = currentOpacity > 0 ? 0 : 1
    console.log(newOpacity)
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
