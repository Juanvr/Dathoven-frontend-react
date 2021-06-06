import React from 'react'

const BackCanvas = ({bgCanvasRef, bgContext, width, height, tileWidth, tileHeight, config}) => {

  function drawGridLinesOnCanvas(canvasContext, gridWidth, gridHeight, tileWidth, tileHeight) {
    
    let lineWidth = 1;
    if (canvasContext){
      canvasContext.translate(0.5, 0.5); // We avoid blurriness due to canvas scaling
      canvasContext.strokeStyle = 'rgba(22, 168, 240, 0.9)';

      canvasContext.beginPath();

      for (var x = 0; x < gridWidth; x++) {
        canvasContext.lineWidth = lineWidth;
        canvasContext.moveTo(Math.floor(x*tileWidth), 0);
        canvasContext.lineTo(Math.floor(x*tileWidth), gridHeight*tileHeight);
      }
      // Last line
      canvasContext.moveTo(Math.floor(gridWidth*tileWidth)-1, 0);
      canvasContext.lineTo(Math.floor(gridWidth*tileWidth)-1, gridHeight*tileHeight);

      for (var y = 0; y < gridHeight; y++) {
        canvasContext.lineWidth = lineWidth;
        canvasContext.moveTo(0, Math.floor(y*tileHeight));
        canvasContext.lineTo(gridWidth*tileWidth, Math.floor(y*tileHeight));        
      }
      // Last line
      canvasContext.moveTo(0, Math.floor(gridHeight*tileHeight)-1);
      canvasContext.lineTo(gridWidth*tileWidth, Math.floor(y*tileHeight)-1);  

      canvasContext.stroke();
    }
	};

  React.useEffect(() => {
    if (bgContext) {
      // Clear Canvas
      bgContext.clearRect(
        0, 
        0, 
        width, 
        height
        );
      drawGridLinesOnCanvas(bgContext, config.gridWidth, config.gridHeight, tileWidth, tileHeight);
    }
  }, [tileWidth]);

  return (
    <canvas
      id='background-canvas'
      ref={bgCanvasRef}
      width={width}
      height={height}
    ></canvas>
  )
}

export default BackCanvas;