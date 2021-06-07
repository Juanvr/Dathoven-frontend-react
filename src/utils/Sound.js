let Sound = {}

  export function playNoteWithDuration(instrument, note, duration){
    instrument.triggerAttackRelease(note, duration);
  }

  export function playNoteClick(instrument, note){
    this.playNoteWithDuration(instrument, note, '8n');
  }

  
  function buildNoteElementFromTile(tile, notes){
    let element = {
      note: notes[tile[0].y],
      duration: "0:0:" + tile[0].size * 2, // Size of tile * 2 sixteenths of measure == 8n * note length
      velocity: 1
    }
    return element;
  }
  
  function callBackTick(time, count, tiles, config, setActiveColumn, instrument, notes){

    // We calculate current active column
    let activeColumn = count % config.gridWidth;

    // We get the tile in current active column
    let tile = tiles.filter(tile => tile.x === (activeColumn));

    // We save active column state to trigger column highlight
    setActiveColumn(activeColumn);

    // If there's a tile on active column we play it
    if (tile && tile.length > 0){
      let element = buildNoteElementFromTile( tile, notes);
      playNoteWithDuration(instrument, element.note, element.duration);
    }
    count++;
    return count;
  }

  export function refreshSchedule(transport, activeColumn, tiles, config, eventId, setActiveColumn, setEventId, instrument, notes) {

    // We clear the current even scheduled
    transport.clear(eventId);

    // We keep the count of the current active column
    let count = (activeColumn + 1) % config.gridWidth;

    // We schedule the new event with current tiles
    let newEventId = transport.scheduleRepeat(
      (time) =>{
        count = callBackTick(time, count, tiles, config, setActiveColumn, instrument, notes );
      }, 
      "8n"
    );
    setEventId(newEventId);
  }


export { Sound as default };
