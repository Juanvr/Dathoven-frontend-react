import React from 'react'

const FrontCanvas = ({width, height, handleMouseDown, handleMouseUp, handleMouseMove, activeColumn, tileWidth}) => {
  const frontCanvasRef =  React.useRef(null);

  function highlightActiveColumn(context, activeColumn, tileWidth, width, height){
    context.clearRect(
      0, 
      0, 
      width, 
      height
      );
    if (activeColumn !== -1) {
      context.fillStyle = 'rgba(255, 255, 102, .3)';
      context.fillRect(activeColumn * tileWidth, 0, tileWidth, height);
    }
  }

  React.useEffect(() => {
    if (frontCanvasRef.current) {
      const frontRenderCtx = frontCanvasRef.current.getContext('2d');
      if (frontRenderCtx){
        highlightActiveColumn(frontRenderCtx, activeColumn, tileWidth, width, height);
      }
    }

  }, [activeColumn]);

  return (
    <canvas
      id='front-canvas'
      ref={frontCanvasRef}
      width={width}
      height={height}
      onMouseDown = {handleMouseDown}
      onMouseUp = {handleMouseUp}
      onMouseMove = {handleMouseMove}
    ></canvas>
  )
}

export default FrontCanvas;