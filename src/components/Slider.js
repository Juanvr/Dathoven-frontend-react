

import * as React from 'react';
import metronome from '../assets/images/metronome.png'; 

const Slider = ({currentTempo, handleTempoChange}) => {
  return (
    <div id="tempoControlContainer">
        <div className="sliderContainer">
          <input 
            className="slider"
            type="range"
            min="70" max="250" 
            value={currentTempo} 
            onChange={handleTempoChange}
            step="1"
          />
        </div>
        <div>
          <img src={metronome} alt="Metronome" id='Metronome'/>
          <span id='TempoLabel'>{currentTempo}</span>
        </div>

    </div>
  );
}

export default Slider;