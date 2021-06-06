import React from 'react'

const MainCanvas = ({width, height, handleMouseDown, handleMouseUp, handleMouseMove, activeColumn, tileWidth}) => {

  

  return (
    <canvas
      id='canvas'
      ref={canvasRef}
      width={width}
      height={height}
    ></canvas>
  )
}

export default MainCanvas;