import * as React from 'react';
import * as Tone from 'tone';
//import Grid from './components/Grid'
//import Canvas from './components/Canvas'
import Tile from './utils/Tile'
import * as Notes from './utils/Notes'


function App() {

  // Synth with Tone js
  const synth = new Tone.Synth().toDestination();

  function playNote(note) {
    synth.triggerAttackRelease(`${note}`, "8n");
  }

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

  const [previousGridPosition, setPreviousGridPosition] = React.useState({});
  const [previousTile, setPreviousTile] = React.useState({});

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

  const[notes, setNotes] = React.useState([]);


  function resize(){
		// setWidth(canvasRef.current.offsetWidth * 2);
		// setHeight(canvasRef.current.offsetHeight * 2);

		setTileWidth(width / config.gridWidth);
		setTileHeight(height / config.gridHeight);
		drawGridLinesOnCanvas();
  }


	function drawGridLinesOnCanvas(canvasContext, gridWidth, gridHeight, tileWidth, tileHeight) {
		// let gridWidth = config.gridWidth;
		// let gridHeight = config.gridHeight;
    if (bgContext){
      bgContext.strokeStyle = 'rgba(22, 168, 240, 1)';
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
    
    let newTiles = [...tiles];
    let newTilesToDelete = [...tilesToDelete];

    let gridCoordinatesOfCurrentTile = gridPositionFromCoordinates(e.clientX, e.clientY);

    let newTile = {
      x: gridCoordinatesOfCurrentTile.x,
      y: gridCoordinatesOfCurrentTile.y,
      size: 1,
      color: 'blue'
    };

    let overlappingExistingTile = 
      newTiles.find( tile => overlappedTiles(newTile, tile));

    // console.log(e.clientX, e.clientY);

    console.log('mouse down');

    if (overlappingExistingTile){
      // add to Tiles to Remove
      newTilesToDelete = newTilesToDelete.concat(overlappingExistingTile);

      // remove from Tiles
      newTiles = newTiles.filter( tile => !(tile.x === overlappingExistingTile.x && tile.y === overlappingExistingTile.y));
    } else {

      let tileInSameColumn = newTiles.find( tile => sameColumnTiles(newTile, tile));

      if (tileInSameColumn){
        // add to Tiles to Remove
        newTilesToDelete = newTilesToDelete.concat(tileInSameColumn);
  
        // remove from Tiles
        newTiles = newTiles.filter( tile => !(tile.x === tileInSameColumn.x && tile.y === tileInSameColumn.y));
      }
  
      newTiles = newTiles.concat(newTile);
      setPreviousTile(newTile);

    }

    playNote(notes[newTile.y]);

    setPreviousGridPosition(gridCoordinatesOfCurrentTile);
    setTiles(newTiles);
    setTilesToDelete(newTilesToDelete);
    setMouseDown(true);
  }

  function handleMouseUp(e) {
    setMouseDown(false);
    setPreviousTile({});
    setPreviousGridPosition({});
  }

  function handleMouseMove(e) {
    if (!mouseDown || !context){
      return;
    }
    let gridCoordinatesOfCurrentTile = gridPositionFromCoordinates(e.clientX, e.clientY);

    let newTiles = [...tiles];
    let newTilesToDelete = [...tilesToDelete];

    if (adjacentTiles(gridCoordinatesOfCurrentTile, previousGridPosition)){

      let newTilePosition = {
        x: gridCoordinatesOfCurrentTile.x,
        y: gridCoordinatesOfCurrentTile.y,
        size: 1,
        color: 'blue'
      };
  
      let tileInSameColumn = newTiles.find( tile => sameColumnTiles(tile, newTilePosition));

      if (tileInSameColumn){
        // add to Tiles to Remove
        newTilesToDelete = newTilesToDelete.concat(tileInSameColumn);
  
        // remove from Tiles
        newTiles = newTiles.filter( tile => !(tile.x === tileInSameColumn.x && tile.y === tileInSameColumn.y));
      }        
      
      newTilesToDelete = newTilesToDelete.concat(previousTile);
      newTiles = newTiles.filter( tile => !(tile.x === previousTile.x && tile.y === previousTile.y));

      let growing = 1;
      if (gridCoordinatesOfCurrentTile.x >= previousTile.x && gridCoordinatesOfCurrentTile.x < previousTile.x + previousTile.size){
        growing = -1;
      }
 
      let newTile = {
        x: Math.min(gridCoordinatesOfCurrentTile.x, previousTile.x),
        y: gridCoordinatesOfCurrentTile.y,
        size: previousTile.size + growing,
        color: 'blue'
      };
      
      newTiles = newTiles.concat(newTile);
  
      setTiles(newTiles);
      setTilesToDelete(newTilesToDelete);
      setPreviousTile(newTile);
      setPreviousGridPosition(gridCoordinatesOfCurrentTile);
    }
  }

  function adjacentTiles( tile1, tile2){

    let adjacentColumn = tile1.x - tile2.x === -1 || tile1.x - tile2.x === 1;
    let sameRow = tile1.y === tile2.y;

    return sameRow && adjacentColumn;
  }

  function overlappedTiles( tile1, tile2 ){
    let sameColumn = sameColumnTiles(tile1, tile2);

    let sameRow = tile1.y === tile2.y;

    return sameRow && sameColumn;
  }

  function sameColumnTiles( tile1, tile2){

    let overlappedX = 
    (tile1.x <= tile2.x && tile1.x + tile1.size > tile2.x) || 
    (tile2.x <= tile1.x && tile2.x + tile2.size > tile1.x);

    return overlappedX;
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
      // context.fillStyle = 'rgba(22, 168, 240, .08)';
      context.fillStyle = 'rgba(255, 255, 102, .3)';
      context.fillRect(activeColumn * tileWidth, 0, tileWidth, height);
    }
  }

  function drawTileOnCanvas(context, tile, gridConfig){
    context.fillStyle = tile.color;
    context.beginPath();

    let rectX = tile.x * gridConfig.tileWidth + gridConfig.margin;
    let rectY = tile.y * gridConfig.tileHeight + gridConfig.margin;
    let rectWidth = gridConfig.tileWidth * tile.size - gridConfig.margin * 2;
    let rectHeight = gridConfig.tileHeight - gridConfig.margin * 2;

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

    let rectX = tile.x * gridConfig.tileWidth + gridConfig.margin;
    let rectY = tile.y * gridConfig.tileHeight + gridConfig.margin;
    let rectWidth = gridConfig.tileWidth * tile.size - gridConfig.margin * 2;
    let rectHeight = gridConfig.tileHeight - gridConfig.margin * 2;

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

  function draw(){
    // requestAnimationFrame(this._boundDraw);
      if (context){
        context.clearRect(0, 0, width, height);
        console.log('fill')

        //draw the active column
        highlightActiveColumn();
        // this._drawAI();

        drawTilesOnCanvas();

        // TWEEN.update();

        // Draw a rectangle
        // console.log('draw rectangle')
        // if (context){
          
        //   context.fillRect(5, 5, 100, 100);
        // }
      }

  };
  function calculateNotesOnGrid(gridHeight, noteStepLength, middleNote){ 
    
    let notes = [middleNote];
    let initialNumber = Notes.getNumberFromNote(middleNote);
    console.log(gridHeight);
    console.log(noteStepLength);
    for (let i = 1; i <= gridHeight / 2; i+=noteStepLength){
      console.log(i);
      notes.unshift( Notes.getNoteFromNumber(initialNumber + i));
      notes.push( Notes.getNoteFromNumber(initialNumber - i));
    }
    if (notes.length > gridHeight){
      notes.pop();
    }

    return notes;

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
        setTileWidth(Math.floor(width / config.gridWidth));
        setTileHeight(Math.floor(height / config.gridHeight));

        
        drawGridLinesOnCanvas(bgRenderCtx, config.gridWidth, config.gridHeight, tileWidth, tileHeight);

        let notes = calculateNotesOnGrid(config.gridHeight, 1, 'C4');

        setNotes(notes);

        
      let gridConfig = {
        tileWidth: tileWidth,
        tileHeight: tileHeight,
        margin: config.tileMargin
      }


      if (context){
        deleteTilesOnCanvas(context, tilesToDelete, gridConfig);

        setTilesToDelete([]);
  
        drawTilesOnCanvas(context, tiles, gridConfig);

        // highlightActiveColumn();
      }

        console.log('fill')

        //draw();
        
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
            // border: '2px solid #000',
            marginTop: 10,
          }}
        ></canvas>
        <canvas
          id="canvas"
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            // border: '2px solid #000',
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
