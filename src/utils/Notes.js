
let Notes = {

  tones : ['C', 'Db', 'D','Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
  octaves : ['0','1','2','3','4','5','6'],
}

export function getNoteFromNumber(n){
  let quotient = Math.floor(n/Notes.tones.length);

  let remainder = n % Notes.tones.length;

  quotient = Math.min(Notes.octaves.length - 1, quotient);
  remainder = Math.min(Notes.tones.length - 1, remainder);


  return Notes.tones[remainder] + Notes.octaves[quotient] ;
}

export function getNumberFromNote(note){

  let octavePart = note.match(/\d+/g)[0];

  console.log('octavePart', octavePart);
  let notePart = note.match(/[A-z]+/g)[0];
  console.log('notePart', notePart);


  let indexOctave = Notes.octaves.indexOf(octavePart);
  console.log('indexOctave', indexOctave);

  let indexTone = Notes.tones.indexOf(notePart);
  console.log('indexTone', indexTone);


  return indexOctave * Notes.tones.length + indexTone;
}

export { Notes as default };
