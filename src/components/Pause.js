import React from 'react'

const Pause = ({onPlayerClick}) => {
  return (
    <svg className="button" viewBox="0 0 60 60" onClick={onPlayerClick}>
      <polygon points="0,0 15,0 15,60 0,60" style={{"fill":"white"}}/>
      <polygon points="25,0 40,0 40,60 25,60" style={{"fill":"white"}}/>
    </svg>
  )
}

export default Pause;