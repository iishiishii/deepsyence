import { Drawer } from "@mui/material"
import { Box } from "@mui/material"
import { IconButton } from "@mui/material"
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import React from "react"

export function SettingsPanel(props){
	return (

		<Box sx={{
			width:props.width,
			role: 'presentation',
			display: 'flex',
			flexDirection:'row',
			flexGrow: 1,
			m: 2
			}}
		>

			{props.children}
		</Box>

	)
}



