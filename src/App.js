import * as React from 'react';
import * as Tone from 'tone';

import * as Notes from './utils/Notes'
import * as Sound from './utils/Sound'
import * as TileOperations from './utils/TileOperations'

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
  model: "https://dathoven.s3.eu-west-3.amazonaws.com/Model/model.json"
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

function argsortDesc(array){
  return array                              // [10, 20, 30, 5]
    .map( (item, index) => [item, index])   // [[10, 0], [20, 1], [30, 2], [5, 3]]
    .sort( (a, b) => b[0] - a[0] )          // [[30, 2], [20, 1], [10, 0], [5, 3]]
    .map( (item) => item[1]);               // [2, 1, 0, 3]
}

function prePadSequence( sequence, maxlen ){
  let resultSequence = [... sequence];
  for (let i = 0; i < maxlen - sequence.length; i++){
    resultSequence.unshift(0);
  }
  return resultSequence;
}

function sample(predictions, n){
  n = Math.min(predictions.length, n);

  let sorted_indexes = argsortDesc(predictions);

  let randint = Math.floor(Math.random() * n);

  return sorted_indexes[randint];

}

function getNextIntervalPrediction(seq, seq_length, model){
  let input_sequence = seq.slice(-seq_length);
  let x = prePadSequence(input_sequence, seq_length);
  let tensor = tf.tensor2d([x]);

  let predictionTensor = model.predict(tensor);

  let prediction = predictionTensor.arraySync();

  return prediction[0];

}

function sampleSeq(seq, seq_length, model, output_seq_length ){
  if (output_seq_length <= seq.length) {
    throw "output_seq_length must be higher than seq_length";
  } 
  let output_seq = [...seq];
  for (let i = 0; i < output_seq_length - seq.length; i++){
    let input_sequence = seq.slice(-seq_length);
    let x = prePadSequence(input_sequence, seq_length);

    let tensor = tf.tensor2d([x]);

    console.log(tensor);
    let predictionTensor = model.predict(tensor);

    console.log('prediction done', predictionTensor);

    let prediction = predictionTensor.arraySync()

    console.log('prediction array', prediction);

    let index = sample(prediction[0], 3);

    console.log('output_seq', output_seq)

    output_seq = [...output_seq, index];

  }
  return output_seq;
}

function generatePrediction( initialSequence, modelSeqLength, model, outputSeqLength){
  let generatedVector = sampleSeq(initialSequence, modelSeqLength, model, outputSeqLength);

  return generatedVector;


}


function App() {  

  let number_to_interval = {};

  for (let i = 0; i < 100; i++){
    // interval_to_number[i] = i
    // interval_to_number[-i] = 100 + i
    number_to_interval[i] = i
    number_to_interval[100+i] = -i
  }

  //React Hook
  const [metadata, setMetadata] = React.useState();
  const [model, setModel] = React.useState();

  async function loadModel(url) {
    try {
      console.log('json', url.model);
      const model = await tf.loadLayersModel(url.model);
      setModel(model);
    } 
    catch (err) {
      console.log(err);
    }}
  async function loadMetadata(url) {
    try {
      const metadataJson = await fetch(url.metadata);
      const metadata = await metadataJson.json();
      setMetadata(metadata);} 
    catch (err) {
      console.log(err);
    }}

  React.useEffect(()=>{
    console.log('useEffect', 'setModel');

    if (!model){
      tf.ready().then(()=>{
        loadModel(url)
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
      color: 'blue'
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

      let prediction = getNextIntervalPrediction(intervals, 30, model);

      let sorted_indexes = argsortDesc(prediction);

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
          color: 'green'
        };
      
      console.log("suggestionTile", newSuggestionTile);
      
      lastY = newY;
      
      suggestion = [...suggestion, newSuggestionTile];
      setSuggestionTiles(suggestion);

      intervals = [...intervals, predictedInterval]
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
        color: 'blue'
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
        color: 'blue'
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
          <LightBulb onLightBulbClick={handleLightBulbClick} enabled={suggestionEnabled}/>
        </div>
        
        <Slider currentTempo={tempo} handleTempoChange={handleTempoChange}/>


      
    </div>
  );
}

export default App;
