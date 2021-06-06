import * as React from 'react';
import * as Tone from 'tone';
  import Tile from './utils/Tile'
import * as Notes from './utils/Notes'
import Play from './components/Play'
import Pause from './components/Pause'
import Slider from './components/Slider'

import FrontCanvas from './components/FrontCanvas'
import BackCanvas from './components/BackCanvas'
import MainCanvas from './components/MainCanvas'

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
    if (!mouseDown){
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
    let newNotes = calculateNotesOnGrid(config.gridHeight, 1, 'C4');
    setNotes(newNotes);
  }, [config.gridHeight]);

  return (
    <div className='App'>
      <div id='canvasDiv'
        style={{
          textAlign: 'center',
        }}>
        
        <BackCanvas
          width = {width}
          height = {height}
          tileWidth = {tileWidth}
          tileHeight = {tileHeight}
          config = {config}
        />
        <MainCanvas
          tiles = {tiles}
          setOffsetLeft = {setOffsetLeft}
          setOffsetTop = {setOffsetTop}
          setClientWidth = {setClientWidth}
          setClientHeight = {setClientHeight}
          setWidth = {setWidth}
          setHeight = {setHeight}
          setTileWidth = {setTileWidth}
          setTileHeight = {setTileHeight}
          setTilesToDelete = {setTilesToDelete}
          tilesToDelete = {tilesToDelete}
          tileWidth = {tileWidth}
          tileHeight = {tileHeight}
          width = {width}
          height = {height}
          config = {config}
        />
        <FrontCanvas 
          width = {width}
          height = {height}
          handleMouseDown = {handleMouseDown} 
          handleMouseUp = {handleMouseUp}
          handleMouseMove = {handleMouseMove}
          activeColumn = {activeColumn}
          tileWidth = {tileWidth}
        />   
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
