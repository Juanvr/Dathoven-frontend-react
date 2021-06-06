import React from 'react'

const MainCanvas = (
    { tiles, 
      setOffsetLeft, 
      setOffsetTop, 
      setClientWidth, 
      setClientHeight, 
      setWidth, 
      setHeight,
      setTileWidth,
      setTileHeight,
      setTilesToDelete,
      tilesToDelete,
      tileWidth,
      tileHeight,
      width, 
      height, 
      config
    }) => {
  
  const canvasRef = React.useRef(null);

  const [context, setContext] = React.useState(null);

  
  function drawTileOnCanvas(context, tile, gridConfig){
    context.fillStyle = tile.color;
    context.beginPath();

    let rectX = tile.x * gridConfig.tileWidth + gridConfig.margin;
    let rectY = tile.y * gridConfig.tileHeight + gridConfig.margin - 1;
    let rectWidth = gridConfig.tileWidth * tile.size - gridConfig.margin * 2 + 1;
    let rectHeight = gridConfig.tileHeight - gridConfig.margin * 2 + 1 ;

    console.log('fillRect', {
      rectX, rectY, rectWidth, rectHeight
    });
    context.fillRect(
      rectX, 
      rectY, 
      rectWidth, 
      rectHeight
      );
  }

  function drawTilesOnCanvas(context, tiles, gridConfig){
    console.log('drawing', tiles.length, 'tiles')
		for (let i = 0; i < tiles.length; i++) {
			let tile = tiles[i];
			if (tile) {
				drawTileOnCanvas(context, tile, gridConfig);
			}
		}
	};

  function deleteTileOnCanvas(context, tile, gridConfig){
    console.log('delete', gridConfig)

    let rectX = tile.x * gridConfig.tileWidth + gridConfig.margin;
    let rectY = tile.y * gridConfig.tileHeight + gridConfig.margin - 1;
    let rectWidth = gridConfig.tileWidth * tile.size - gridConfig.margin * 2 + 1;
    let rectHeight = gridConfig.tileHeight - gridConfig.margin * 2 + 1 ;

    // We make sure we do not leave any painted pixels due to rounding
    rectX -= gridConfig.margin*2;
    rectY -= gridConfig.margin;
    rectWidth += gridConfig.margin*3;
    rectHeight += gridConfig.margin*2;

    console.log('clearRect', {
      rectX, rectY, rectWidth, rectHeight
    });
    context.clearRect(
      rectX, 
      rectY, 
      rectWidth, 
      rectHeight
      );
  }

  function deleteTilesOnCanvas(context, tilesToRemove, gridConfig){
    console.log('deleting', tilesToRemove.length, 'tiles')
		for (let i = 0; i < tilesToRemove.length; i++) {
			let tile = tilesToRemove[i];
			if (tile) {
				deleteTileOnCanvas(context, tile, gridConfig);
			}
		}
  }

  React.useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext('2d');
      if (renderCtx) {
        setContext(renderCtx);

        setOffsetLeft(canvasRef.current.offsetLeft);
        setOffsetTop(canvasRef.current.offsetTop);

        setClientWidth(canvasRef.current.clientWidth);
        setClientHeight(canvasRef.current.clientHeight);

        setWidth(canvasRef.current.width);
        setHeight(canvasRef.current.height);

        setTileWidth(Math.round(width / config.gridWidth * 100) / 100);
        setTileHeight(Math.round(height / config.gridHeight* 100) / 100);
        
        let gridConfig = {
          tileWidth: tileWidth,
          tileHeight: tileHeight,
          margin: config.tileMargin
        }

        if (context){
          deleteTilesOnCanvas(context, tilesToDelete, gridConfig);

          setTilesToDelete([]);
    
          drawTilesOnCanvas(context, tiles, gridConfig);
        }
      }
    }
  }, [tiles]);


  return (
    <canvas
      id='canvas'
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        // border: '2px solid #000',
        // marginTop: 10,
      }}
    ></canvas>
  )
}

export default MainCanvas;