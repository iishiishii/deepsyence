import React from 'react'
import { createRoot } from 'react-dom/client'
import { Container } from '@mui/material'
import {CssBaseline} from '@mui/material'
import './index.css'
import NiiVue from './niivue'

const volumes = [
  {url: './sub01.nii', name: 'sub01'}
]

const root = createRoot(document.getElementById('root'))
root.render(  
  <NiiVue volumes={volumes}/>
)
