import * as React from 'react';
import * as Tone from 'tone';
  import Tile from './utils/Tile'
import * as Notes from './utils/Notes'
import Play from './components/Play'
import Pause from './components/Pause'
import Slider from './components/Slider'

let melodyPlayer = new Tone.PolySynth(Tone.Synth).set({
  'volume' : -4,
  'oscillator' : {
    'type' : 'triangle17',
    // 'partials' : [16, 8, 4, 2, 1, 0.5, 1, 2]
  },
  'envelope' : {
    'attack' : 0.01,
    'decay' : 0.1,
    'sustain' : 0.2,
    'release' : 1.7,
  }
});

function App() {  

  // We will use always the same synth
  const synthRef = React.useRef(melodyPlayer.toDestination()); 

  function sortTiles(tiles){
    function compare( a, b ) {
      if ( a.x < b.x ){
        return -1;
      }
      if ( a.x > b.x ){
        return 1;
      }
      return 0;
    }
    return tiles.sort(compare);
  }

  function playNoteWithDuration(note, duration) {
    synthRef.current.triggerAttackRelease(note, duration);
  }

  function playNoteClick(note) {
    playNoteWithDuration(note, '8n');
  }

  function refreshSchedule(tiles) {

    // We clear the current even scheduled
    Tone.Transport.clear(eventId);

    // We keep the count of the current active column
    let count = (activeColumn + 1) % config.gridWidth;

    // We schedule the new event with current tiles
    let newEventId = Tone.Transport.scheduleRepeat(
      (time) =>{
        count = callBackTick(time, count, tiles);
      }, 
      "8n"
    );
    setEventId(newEventId);
  }

  function buildNoteElementFromTile(tile, notes){
    let element = {
      note: notes[tile[0].y],
      duration: "0:0:" + tile[0].size * 2, // Size of tile * 2 sixteenths of measure == 8n * note length
      velocity: 1
    }
    return element;
  }

  function callBackTick(time, count, tiles){

    // We calculate current active column
    let activeColumn = count % config.gridWidth;

    // We get the tile in current active column
    let tile = tiles.filter(tile => tile.x === (activeColumn));

    // We save active column state to trigger column highlight
    setActiveColumn(activeColumn);

    // If there's a tile on active column we play it
    if (tile && tile.length > 0){
      let element = buildNoteElementFromTile( tile, notes);
      playNoteWithDuration(element.note, element.duration);
    }

    count++;
    return count;
  }

  const handlePlayerClick = () => {
    if (!playing) {
      setPlaying(true);
      Tone.Transport.start('+0.1');
      refreshSchedule(tiles);

    } else {
      setPlaying(false);
      Tone.Transport.clear(eventId);
      Tone.Transport.stop();
      setActiveColumn(-1);
    }
  }

  const config = {
    gridWidth: 30, 
    gridHeight: 15,
    tileMargin: 1
  };

  const bgCanvasRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const frontCanvasRef =  React.useRef(null);


  /**
   * the background context
   */
  const [bgContext, setBgContext] = React.useState(null);
  const [context, setContext] = React.useState(null);
  const [frontCanvasContext, setFrontContext] = React.useState(null);

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

  const[activeColumn, setActiveColumn] = React.useState(-1);

  const[notes, setNotes] = React.useState([]);

  const[playing, setPlaying] = React.useState(false);
  const[eventId, setEventId] = React.useState('');

  const[song, setSong] = React.useState([]);

  const[tempo, setTempo] = React.useState(120);
 

  function drawGridLinesOnCanvas(canvasContext, gridWidth, gridHeight, tileWidth, tileHeight) {
    
    let lineWidth = 1;
    if (bgContext){
      bgContext.translate(0.5, 0.5);
      console.log('drawlines',gridWidth, gridHeight, tileWidth, tileHeight)
      bgContext.strokeStyle = 'rgba(22, 168, 240, 0.9)';
      console.log(tileWidth);

      bgContext.beginPath();

      for (var x = 0; x < gridWidth; x++) {
        bgContext.lineWidth = lineWidth;
        bgContext.moveTo(Math.floor(x*tileWidth), 0);
        bgContext.lineTo(Math.floor(x*tileWidth), gridHeight*tileHeight);
      }
      bgContext.moveTo(Math.floor(gridWidth*tileWidth)-1, 0);
      bgContext.lineTo(Math.floor(gridWidth*tileWidth)-1, gridHeight*tileHeight);

      for (var y = 0; y < gridHeight; y++) {
        bgContext.lineWidth = lineWidth;
        bgContext.moveTo(0, Math.floor(y*tileHeight));
        bgContext.lineTo(gridWidth*tileWidth, Math.floor(y*tileHeight));        
      }
      bgContext.moveTo(0, Math.floor(gridHeight*tileHeight)-1);
      bgContext.lineTo(gridWidth*tileWidth, Math.floor(y*tileHeight)-1);  

      bgContext.stroke();
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

    playNoteClick(notes[newTile.y]);

    setPreviousGridPosition(gridCoordinatesOfCurrentTile);
    setTiles(sortTiles(newTiles));
    setTilesToDelete(newTilesToDelete);
    setMouseDown(true);
    refreshSchedule(sortTiles(newTiles));
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
  
      setTiles(sortTiles(newTiles));
      refreshSchedule(sortTiles(newTiles));
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

  function drawTileOnCanvas(context, tile, gridConfig){
    // bgContext.translate(0.5, 0.5);

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

  let handleTempoChange = (event) =>{
    setTempo(event.target.value);

    Tone.Transport.bpm.value = event.target.value;

  }


  React.useEffect(() => {
    const bgRenderCtx = bgCanvasRef.current.getContext('2d');
    if (bgRenderCtx) {
      drawGridLinesOnCanvas(bgRenderCtx, config.gridWidth, config.gridHeight, tileWidth, tileHeight);
    }

  }, [tileWidth]);




  React.useEffect(() => {
    if (frontCanvasRef.current) {
      const frontRenderCtx = frontCanvasRef.current.getContext('2d');
      if (frontRenderCtx){
        setFrontContext(frontRenderCtx); 

        highlightActiveColumn(frontRenderCtx, activeColumn, tileWidth, width, height);

      }
    }

  }, [activeColumn]);




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
        // setTileWidth(Math.floor(width / config.gridWidth));
        // setTileHeight(Math.floor(height / config.gridHeight));

        setTileWidth(Math.round(width / config.gridWidth * 100) / 100);
        setTileHeight(Math.round(height / config.gridHeight* 100) / 100);

        


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


        // let newSong = fromTileListToSong(tiles, notes, '');
        // setSong(newSong);

        // fromTileListToSequence(tiles, notes, config.gridWidth)
      }

        console.log('fill')

        //draw();
        
      }
    }

    return function cleanup() {
      if (canvasRef.current) {
        //canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        // canvasRef.current.removeEventListener('mouseup', handleMouseUp);
        // canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }, [tiles, activeColumn]);

  return (
    <div className='App'>
      <div id='canvasDiv'
        style={{
          textAlign: 'center',
        }}>
        <canvas
          id='background-canvas'
          ref={bgCanvasRef}
          width={width}
          height={height}
          style={{
            // border: '2px solid #000',
            // marginTop: 10,
          }}
        ></canvas>
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
        <canvas
          id='front-canvas'
          ref={frontCanvasRef}
          width={width}
          height={height}
          style={{
            // border: '2px solid #000',
            // marginTop: 10,
          }}
          onMouseDown = {handleMouseDown}
          onMouseUp = {handleMouseUp}
          onMouseMove = {handleMouseMove}
        ></canvas>
      </div>
      
        <div className="player" >
          {playing? <Pause onPlayerClick={() => handlePlayerClick(tempo)} /> : <Play onPlayerClick={() => handlePlayerClick(tempo)} />}
        </div>
        <div id='sliderContainer'>
          <Slider currentTempo={tempo} handleTempoChange={handleTempoChange}/>
        </div>


      
    </div>
  );
}

export default App;
