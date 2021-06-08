import React from 'react'

const SuggestionsCanvas = (
  { tiles,
    suggestionTiles, 
    setSuggestionTiles,
    tileWidth,
    tileHeight,
    width, 
    height, 
    config
  }
) => {
  
  const canvasRef = React.useRef(null);

  const [context, setContext] = React.useState(null);
  
  function drawTileOnCanvas(context, tile, gridConfig, fillStyle){
    context.fillStyle = fillStyle;//tile.color;
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

  function drawTilesOnCanvas(context, tiles, gridConfig, fillStyle){
    console.log('drawing', tiles.length, 'tiles')
		for (let i = 0; i < tiles.length; i++) {
			let tile = tiles[i];
			if (tile) {
				drawTileOnCanvas(context, tile, gridConfig, fillStyle);
			}
		}
	};

  React.useEffect(() => {
    let exampleSuggestions = [
    {
      x: 5,
      y: 5,
      size: 1,
      color: 'green'
    },
    {
      x: 6,
      y: 5,
      size: 1,
      color: 'green'
    }];

    setSuggestionTiles(exampleSuggestions);

  }, [tiles]);

  React.useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext('2d');
      if (renderCtx) {
        setContext(renderCtx);

        let gridConfig = {
          tileWidth: tileWidth,
          tileHeight: tileHeight,
          margin: config.tileMargin
        }

        if (context){   
          drawTilesOnCanvas(context, suggestionTiles, gridConfig, '#ccffcc');
        }
      }
    }
  }, [suggestionTiles]);


  return (
    <canvas
      id='suggestions-canvas'
      ref={canvasRef}
      width={width}
      height={height}
    ></canvas>
  )
}

export default SuggestionsCanvas;