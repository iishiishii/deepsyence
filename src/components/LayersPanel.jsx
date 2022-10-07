import { Drawer } from "@mui/material"
import { Box } from "@mui/material"
import { Typography } from "@mui/material"
import { IconButton } from "@mui/material"
import { Button } from "@mui/material"
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import GestureIcon from "@mui/icons-material/Gesture"
import LayersIcon from "@mui/icons-material/Layers"
import AddIcon from '@mui/icons-material/Add'

export function LayersPanel(props){
  function handleAddLayer(){
    let input = document.createElement('input')
    input.type = 'file'
    input.multiple="multiple"

    input.onchange = async function (){
      for(var i=0;i<input.files.length;i++){
        props.onAddLayer(input.files[i])
      }
    }

    input.click()
  }


	return (
      <Box
        sx={{
          width: props.width,
          bottom: 0,
          display: "flex",
          flexDirection: "row",
          height: 150,
          overflow: "hidden",
          overflowY: "scroll",
        }}
      >
        <Box
          sx={{
            width: 48,
            display: 'flex',
            flexDirection: 'column',
            // backgroundColor: '#F8F8F8',
            height: 150,
            alignItems: 'center'
          }}
        >
            <Button
              onClick={handleAddLayer}
              endIcon={<AddIcon />}
              size='big'
            >
              {/* Add Layer */}
            </Button>
        </Box>
        <Box sx={{
          width:props.width,
          role: 'presentation',
          display: 'flex',
          height: '100%',
          flexDirection:'column',
          justifyContent:'flex-start',
          ml: 1,
          mr: 1
          }}
        >
          <Box
            sx={{
              display:'flex'
            }}>
            <IconButton 
              onClick={props.onToggleMenu}
              style={{marginLeft:'auto'}}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              display:'flex',
            }}   
          >

          </Box>
          {props.children}
        </Box>

      </Box>

      
 
	)
}


