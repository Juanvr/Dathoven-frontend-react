import * as React from 'react';
//import Grid from './components/Grid'
//import Canvas from './components/Canvas'
import Tile from './utils/Tile'


function App() {

  const config = {
    gridWidth: 15, 
    gridHeight: 20,
    tileMargin: 1
  };

  const bgCanvasRef = React.useRef(null);
  const canvasRef = React.useRef(null);


  /**
   * the background context
   */
  const [bgContext, setBgContext] = React.useState(null);
  const [context, setContext] = React.useState(null);

  const [mouseDown, setMouseDown] = React.useState(false);
  const [lastDragTile, setLastDragTile] = React.useState({});


  const [start, setStart] = React.useState({ x: 0, y: 0 });
  const [end, setEnd] = React.useState({ x: 0, y: 0 });

  const [canvasOffsetLeft, setOffsetLeft] = React.useState(0);
  const [canvasOffsetTop, setOffsetTop] = React.useState(0);

  const [canvasClientWidth, setClientWidth] = React.useState(0);
  const [canvasClientHeight, setClientHeight] = React.useState(0);

  const[tiles, setTiles] = React.useState([]);
  const[tilesToDelete, setTilesToDelete] = React.useState([]);

  const[width, setWidth] = React.useState(500);
  const[height, setHeight] = React.useState(500);

  const[tileWidth, setTileWidth] = React.useState(0);
  const[tileHeight, setTileHeight] = React.useState(0);

  const[activeColumn, setActiveColumn] = React.useState(1);


  function resize(){
		// setWidth(canvasRef.current.offsetWidth * 2);
		// setHeight(canvasRef.current.offsetHeight * 2);

		setTileWidth(width / config.gridWidth);
		setTileHeight(height / config.gridHeight);
		drawLines();
  }


	function drawLines() {
		let gridWidth = config.gridWidth;
		let gridHeight = config.gridHeight;
    if (bgContext){
      bgContext.strokeStyle = 'rgba(22, 168, 240, 0.4)';
      bgContext.lineWidth = 1;
      console.log(tileWidth);
      for (var x = 0; x < gridWidth; x++) {
        for (var y = 0; y < gridHeight; y++) {
          //draw tile with border
          bgContext.beginPath();
          bgContext.strokeRect(
            x * tileWidth, 
            y * tileHeight, 
            tileWidth, 
            tileHeight
          );
        }
      }
    }
	};

  function gridPositionFromCoordinates(clientX, clientY) {
		return {
			x: Math.floor((clientX - canvasOffsetLeft) / (canvasClientWidth/config.gridWidth)),
			y: Math.floor((clientY - canvasOffsetTop)/ (canvasClientHeight/config.gridHeight) )
		};
	};

  function handleMouseDown(e) {
    
    // console.log(e.clientX, e.clientY);
    setMouseDown(true);
    console.log('mouse down');


		addOrRemoveTile(e.clientX, e.clientY);

  }

  function handleMouseUp(evt) {
    setMouseDown(false);
  }

  function handleMouseMove(evt) {

    if (mouseDown && context) {

      let tileToDraw = gridPositionFromCoordinates(evt.clientX, evt.clientY);

      if ( lastDragTile.x - tileToDraw.x === -1 || lastDragTile.x - tileToDraw.x === -1 || lastDragTile.y === tileToDraw.y){
        
        joinTiles(lastDragTile, tileToDraw);

      }
    }
  }

  function joinTiles(tile1, tile2){
    let newTiles = removeTile(context, tile1.x, tile1.y, tileWidth, tileHeight, tiles);

    let newTile = { x: Math.min(tile1.x, tile1.x), y:tile1.y, length:}

    setLastDragTile(newTile);


  }

  function randomColor() {
    const color = new Array(6);

    for (let i = 0; i < 6; i++) {
      const val = Math.floor(Math.random() * 16);

      if (val < 10) {
        color[i] = val.toString();
      } else {
        color[i] = String.fromCharCode(val + 87);
      }
    }

    return color.join('');
  }

  function highlightActiveColumn(){
    if (activeColumn !== -1) {
      context.fillStyle = 'rgba(22, 168, 240, .08)';
      context.fillRect(activeColumn * tileWidth, 0, tileWidth, height);
    }
  }

  function drawTile(context, x, y, tileSize, tileWidth, tileHeight, color){
    let margin = config.tileMargin;
    context.fillStyle = color;
    context.beginPath();
    context.fillRect(x * tileWidth  * tileSize + margin, y * tileHeight + margin, tileWidth - margin * 2, tileHeight - margin * 2);
  }

  function drawTiles(){
    console.log('drawing', tiles.length, 'tiles')
		for (let i = 0; i < tiles.length; i++) {
			let tile = tiles[i];
			if (tile) {
				drawTile(context, tile.x, tile.y, tile.size, tileWidth, tileHeight, 'blue');
			}
		}
	};

  function deleteTile(tile){
    let margin = config.tileMargin;
    context.clearRect(tile.x * tileWidth * tile.length + margin, tile.y * tileHeight + margin, tileWidth - margin * 2, tileHeight - margin * 2);
  }

  function deleteTiles(){
    for (let i = 0; i < tilesToRemove.length; i++) {
			let tile = tilesToRemove[i];
			if (tile) {
				deleteTile(tile);
			}
		}
  }

  function removeTile(context, x, y, tileWidth, tileHeight, tiles) {
    let newTiles = tiles.filter( tile => tile.x !== x && tile.y !== y);
    return newTiles;
	};

  function addOrRemoveTile(clientX, clientY) {

    let newTile = gridPositionFromCoordinates(clientX, clientY);

    let x = newTile.x;
    let y = newTile.y;

    let alreadyExistingTile = tiles.find( tile => tile.x === x && tile.y === y);
    
    let newTiles = [...tiles];
    if (alreadyExistingTile){
      newTiles = removeTile(context, x, y, tileWidth, tileHeight, tiles);
      
    } else{

      setLastDragTile(newTile);

      let existingTileInSameColumn = tiles.find( tile => tile.x === x);

      if (existingTileInSameColumn){
        newTiles = removeTile(context, x, existingTileInSameColumn.y, tileWidth, tileHeight, tiles);
      }
      newTiles = newTiles.concat(newTile)

    }

    setTiles(newTiles);
	};




  function draw(){
    // requestAnimationFrame(this._boundDraw);
      if (context){
        context.clearRect(0, 0, width, height);
        console.log('fill')

        //draw the active column
        highlightActiveColumn();
        // this._drawAI();

        drawTiles();

        // TWEEN.update();

        // Draw a rectangle
        // console.log('draw rectangle')
        // if (context){
          
        //   context.fillRect(5, 5, 100, 100);
        // }
      }

  };


  React.useEffect(() => {
    console.log('useEffect');
    console.log('tiles length', tiles.length);
    console.log('tiles', tiles);
    if (bgCanvasRef.current) {
      const renderCtx = canvasRef.current.getContext('2d');
      const bgRenderCtx = bgCanvasRef.current.getContext('2d');
      if (bgRenderCtx) {
        setContext(renderCtx);
        setBgContext(bgRenderCtx);

        setOffsetLeft(canvasRef.current.offsetLeft);
        setOffsetTop(canvasRef.current.offsetTop);

        setClientWidth(canvasRef.current.clientWidth);
        setClientHeight(canvasRef.current.clientHeight);

        setWidth(canvasRef.current.width);
        setHeight(canvasRef.current.height);

        // setWidth(canvasRef.current.offsetWidth * 2);
        // setHeight(canvasRef.current.offsetHeight * 2);
        
        // resize();
        setTileWidth(width / config.gridWidth);
        setTileHeight(height / config.gridHeight);

        
        // drawLines();
        



        console.log('fill')

        draw();
        
      }
    }



    // // Draw a rectangle
    // if (context) context.fillRect(5, 5, 100, 100);


    // // Draw a circle
    // if(context) {
    //   context.beginPath();
    //   context.fillStyle = '#ff7f50';
    //   context.arc(440, 60, 50, 0, Math.PI * 2, true);
    //   context.fill();
    //   context.fillStyle = '#000';
    //   context.closePath();
    // }

    return function cleanup() {
      if (canvasRef.current) {
        //canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        // canvasRef.current.removeEventListener('mouseup', handleMouseUp);
        // canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }, [bgContext, tiles]);

  return (
    <div className="App">
      
      <div
        style={{
          textAlign: 'center',
        }}>
        <canvas
          id="background-canvas"
          ref={bgCanvasRef}
          width={width}
          height={height}
          style={{
            border: '2px solid #000',
            marginTop: 10,
          }}
        ></canvas>
        <canvas
          id="canvas"
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            border: '2px solid #000',
            marginTop: 10,
          }}
          onMouseDown = {handleMouseDown}
          onMouseUp = {handleMouseUp}
          onMouseMove = {handleMouseMove}
        ></canvas>
      </div>
    </div>
  );
}

export default App;
