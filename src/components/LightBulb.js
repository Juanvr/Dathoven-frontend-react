import React from 'react'
import lightbulb from '../assets/images/light_bulb.png'; 
import lightbulbGray from '../assets/images/light_bulb_gray.png'; 

const LightBulb = ({onLightBulbClick, enabled}) => {
  if (enabled){

    return <img src={lightbulb} className="LightBulbEnabled" alt="LightBulb" id='LightBulb' onClick={onLightBulbClick}/>

  } else {

    return <img src={lightbulbGray} alt="LightBulb" id='LightBulb' />

  }
}

export default LightBulb;