import * as React from 'react';
import * as Tone from 'tone';

import * as Notes from './utils/Notes'
import * as Sound from './utils/Sound'
import * as TileOperations from './utils/TileOperations'
import * as Predictions from './utils/Predictions_with_time'

import Play from './components/Play'
import Pause from './components/Pause'
import Slider from './components/Slider'
import LightBulb from './components/LightBulb'

import FrontCanvas from './components/FrontCanvas'
import BackCanvas from './components/BackCanvas'
import MainCanvas from './components/MainCanvas'
import SuggestionsCanvas from './components/SuggestionsCanvas'

import * as tf from '@tensorflow/tfjs';


const url = {
  model: "https://dathoven-model.s3.eu-west-3.amazonaws.com/Model_with_tracks/model.json"
  // metadata: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json'
  };


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
    // Dictionary interval
    let number_to_interval = {};
    let interval_to_number = {};
  
    for (let i = 0; i < 100; i++){
      interval_to_number[i] = i
      interval_to_number[-i] = 100 + i
      number_to_interval[i] = i
      number_to_interval[100+i] = -i
    }
  
    let duration_to_number = {}
    let number_to_duration  = {}
    
    // Dictionary duration and offset
    let count=0
    let duration = 0
    while(duration <= 20){
      number_to_duration[count] = duration
      duration_to_number[duration] = count
      count+=1
      duration+=0.25
    }
    
    duration = 0
    while (duration <= 20){
      if (duration_to_number[duration]){
          number_to_duration[count] = duration
          duration_to_number[duration] = count
          count+=1
      }
      duration += 1/3;
    }

  //React Hook
  const [metadata, setMetadata] = React.useState();
  const [model, setModel] = React.useState();

  React.useEffect(()=>{
    console.log('useEffect', 'setModel');

    if (!model){
      tf.ready().then(()=>{
        Predictions.loadModel(url, setModel);
      });
    }

  },[]);
  
  // We will use always the same synth
  const synthRef = React.useRef(melodyPlayer.toDestination()); 

  const handlePlayerClick = () => {
    if (!playing) {
      let allTiles = tiles.concat(suggestionTiles);
      setPlaying(true);
      Tone.Transport.start('+0.1');
      Sound.refreshSchedule(Tone.Transport, activeColumn, allTiles, config, eventId, setActiveColumn, setEventId, synthRef.current, notes);

      setSuggestionEnabled(false);

    } else {
      setPlaying(false);
      Tone.Transport.clear(eventId);
      Tone.Transport.stop();
      setActiveColumn(-1);
      evaluateAndEnableSuggestion(tiles);
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

  const[tempo, setTempo] = React.useState(120);




  const[suggestionTiles, setSuggestionTiles] = React.useState([]);
  const[suggestionEnabled, setSuggestionEnabled] = React.useState(false);

  
 
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
      color: 'white'
    };

    let overlappingExistingTile = 
      newTiles.find( tile => TileOperations.overlappedTiles(newTile, tile));

    // console.log(e.clientX, e.clientY);

    console.log('mouse down');

    if (overlappingExistingTile){
      // add to Tiles to Remove
      newTilesToDelete = newTilesToDelete.concat(overlappingExistingTile);

      // remove from Tiles
      newTiles = newTiles.filter( tile => !(tile.x === overlappingExistingTile.x && tile.y === overlappingExistingTile.y));
    } else {

      let tileInSameColumn = newTiles.find( tile => TileOperations.sameColumnTiles(newTile, tile));

      if (tileInSameColumn){
        // add to Tiles to Remove
        newTilesToDelete = newTilesToDelete.concat(tileInSameColumn);
  
        // remove from Tiles
        newTiles = newTiles.filter( tile => !(tile.x === tileInSameColumn.x && tile.y === tileInSameColumn.y));
      }
  
      newTiles = newTiles.concat(newTile);
      setPreviousTile(newTile);

    }

    Sound.playNoteClick(synthRef.current, notes[newTile.y]);

    setPreviousGridPosition(gridCoordinatesOfCurrentTile);
    setTiles(TileOperations.sortTiles(newTiles));

    evaluateAndEnableSuggestion(newTiles);

    setTilesToDelete(newTilesToDelete);
    setMouseDown(true);
    Sound.refreshSchedule(Tone.Transport, activeColumn, TileOperations.sortTiles(newTiles), config, eventId, setActiveColumn, setEventId, synthRef.current, notes);
  }

  const evaluateAndEnableSuggestion = (tiles) => {
    if (tiles.length >= 2){
      setSuggestionEnabled(true);
    } else {
      setSuggestionEnabled(false);
    }
  }

  const fromTilesToIntervals = (tiles) => {

    let intervals = [];
    for (let i = 0; i<tiles.length - 1; i++){
      let firstTile = tiles[i];
      let secondTile = tiles[i+1]

      let interval = secondTile.y - firstTile.y; 
      interval = -interval; // Canvas higher notes are lower in number

      intervals = [...intervals, interval]; 

    }
    return intervals;

  };
  const fromTilesToIntervalsWithTime = (tiles, time_to_number, interval_to_number) => {

    let intervalsWithTime = [];
    for (let i = 0; i<tiles.length - 1; i++){
      let firstTile = tiles[i];
      let secondTile = tiles[i+1]

      let offset = secondTile.x - firstTile.x;
      let interval = secondTile.y - firstTile.y; 
      let duration = secondTile.size * 2;

      interval = -interval; // Canvas higher notes are lower in number

      let intervalWithTime = [time_to_number[offset], interval_to_number[interval], time_to_number[duration]];


      intervalsWithTime = [...intervalsWithTime, intervalWithTime]; 

    }
    return intervalsWithTime;

  };

  const handleLightBulbClick = (e) => {
    console.log(model);
    console.log(model.summary());

    console.log(tiles);

    let intervals = fromTilesToIntervals(tiles);

    console.log("map", tiles.map( tile => tile.x));
    console.log("map", Math.max(...tiles.map( tile => tile.x)));


    let lastX = Math.max(...tiles.map( tile => tile.x));
    let lastY = tiles[tiles.length - 1].y;

    let suggestion = [];
    console.log("for", lastX, config.gridWidth);

    
    for (let i = lastX + 1; i < config.gridWidth; i++){
      console.log("predict");

      let prediction = Predictions.getNextIntervalPrediction(intervals, 10, model);

      let sorted_indexes = Predictions.argsortDesc(prediction);

      let sortedIntervals = sorted_indexes.map(index => number_to_interval[index]);


      console.log("sortedIntervals", sortedIntervals);


      let maxValidInterval = lastY;
      console.log("maxValidInterval", maxValidInterval);

      let minValidInterval = -(config.gridHeight - 1 - lastY);
      console.log("minValidInterval", minValidInterval);


      let validPredictedIntervals = sortedIntervals.filter( interval => interval <= maxValidInterval && interval >= minValidInterval);

      console.log("validPredictedIntervals", validPredictedIntervals);

      let randomness = 3;

      let randint = Math.floor(Math.random() * randomness);

      let predictedInterval = validPredictedIntervals[randint];

      console.log("predictedInterval", predictedInterval);

      let newY = lastY - predictedInterval; // intervals in canvas and in model are reversed

      let newSuggestionTile = 
        {
          x: i,
          y: newY,
          size: 1,
          color: '#edb738'
        };
      
      console.log("suggestionTile", newSuggestionTile);
      
      lastY = newY;
      
      suggestion = [...suggestion, newSuggestionTile];
      setSuggestionTiles(suggestion);

      intervals = [...intervals, predictedInterval]
    }
  }




  const handleLightBulbClickWithTime = (e) => {
    console.log(model);
    console.log(model.summary());

    console.log(tiles);

    // let intervals = fromTilesToIntervals(tiles);
    let intervals = fromTilesToIntervalsWithTime(tiles, duration_to_number, interval_to_number);

    console.log("map", tiles.map( tile => tile.x));
    console.log("map", Math.max(...tiles.map( tile => tile.x)));


    let lastX = Math.max(...tiles.map( tile => tile.x));
    let lastY = tiles[tiles.length - 1].y;

    let suggestion = [];
    console.log("for", lastX, config.gridWidth);

    
    for (let i = lastX + 1; i < config.gridWidth; i++){
      console.log("predict");

      let prediction = Predictions.getNextIntervalPrediction(intervals, 10, model);

      console.log("predictions!", prediction[0], prediction[1], prediction[2])

      let sorted_indexes_offset = Predictions.argsortDesc(prediction[0]);
      let sorted_indexes_interval = Predictions.argsortDesc(prediction[1]);
      let sorted_indexes_duration = Predictions.argsortDesc(prediction[2]);

      let sortedOffsets = sorted_indexes_offset.map(index => number_to_duration[index]);
      let sortedIntervals = sorted_indexes_interval.map(index => number_to_interval[index]);
      let sortedDurations = sorted_indexes_duration.map(index => number_to_duration[index]);

      console.log("sortedIntervals", sortedIntervals);

      let maxValidInterval = lastY;
      console.log("maxValidInterval", maxValidInterval);

      let minValidInterval = -(config.gridHeight - 1 - lastY);
      console.log("minValidInterval", minValidInterval);



      let validPredictedIntervals = sortedIntervals.filter( interval => interval <= maxValidInterval && interval >= minValidInterval);

      console.log("validPredictedIntervals", validPredictedIntervals);

      let randomness = 3;

      let randint = Math.floor(Math.random() * randomness);

      let predictedInterval = validPredictedIntervals[randint];
      let predictedOffset = sortedOffsets[randint];
      let predictedDuration = sortedDurations[randint];

      console.log("predictedInterval", predictedInterval, predictedOffset, Math.floor(predictedDuration / 0.5));

      let newY = lastY - predictedInterval; // intervals in canvas and in model are reversed

      let newSuggestionTile = 
      {
        x: Math.max(i,Math.ceil(i+predictedOffset/0.5)),
        y: newY,
        size: Math.max(1,Math.ceil(predictedDuration/0.5)),
        color: '#edb738'
      };
      i = newSuggestionTile.x;
      
      console.log("suggestionTile", newSuggestionTile);
      
      lastY = newY;
      
      suggestion = [...suggestion, newSuggestionTile];
      setSuggestionTiles(suggestion);

      intervals = [...intervals, [predictedOffset, predictedInterval, predictedDuration]];
    }
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

    if (TileOperations.adjacentTiles(gridCoordinatesOfCurrentTile, previousGridPosition)){

      let newTilePosition = {
        x: gridCoordinatesOfCurrentTile.x,
        y: gridCoordinatesOfCurrentTile.y,
        size: 1,
        color: 'white'
      };
  
      let tileInSameColumn = newTiles.find( tile => TileOperations.sameColumnTiles(tile, newTilePosition));

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
        color: 'white'
      };
      
      newTiles = newTiles.concat(newTile);
  
      setTiles(TileOperations.sortTiles(newTiles));
      Sound.refreshSchedule(Tone.Transport, activeColumn, TileOperations.sortTiles(newTiles), config, eventId, setActiveColumn, setEventId, synthRef.current, notes);
      setTilesToDelete(newTilesToDelete);
      setPreviousTile(newTile);
      setPreviousGridPosition(gridCoordinatesOfCurrentTile);
    }
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
        <SuggestionsCanvas
          tiles = {tiles}
          suggestionTiles = {suggestionTiles}
          setSuggestionTiles = {setSuggestionTiles}
          tileWidth = {tileWidth}
          tileHeight = {tileHeight}
          width = {width}
          height = {height}
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
        <div className="lightBulbContainer">
          <LightBulb onLightBulbClick={handleLightBulbClickWithTime} enabled={suggestionEnabled}/>
        </div>
        
        <Slider currentTempo={tempo} handleTempoChange={handleTempoChange}/>


      
    </div>
  );
}

export default App;
