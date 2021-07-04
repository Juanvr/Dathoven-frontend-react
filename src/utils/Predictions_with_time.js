import * as tf from '@tensorflow/tfjs';

let Predictions = {}


export async function loadModel(url, setModel) {
  try {
    console.log('json', url.model);
    const model = await tf.loadLayersModel(url.model);
    setModel(model);
  } 
  catch (err) {
    console.log(err);
  }}
export async function loadMetadata(url, setMetadata) {
  try {
    const metadataJson = await fetch(url.metadata);
    const metadata = await metadataJson.json();
    setMetadata(metadata);} 
  catch (err) {
    console.log(err);
  }}

export function argsortDesc(array){
  console.log('argsortDesc', array);
  return array                              // [10, 20, 30, 5]
    .map( (item, index) => [item, index])   // [[10, 0], [20, 1], [30, 2], [5, 3]]
    .sort( (a, b) => b[0] - a[0] )          // [[30, 2], [20, 1], [10, 0], [5, 3]]
    .map( (item) => item[1]);               // [2, 1, 0, 3]
}

function prePadSequence( sequence, maxlen ){
  let resultSequence = [...sequence];
  for (let i = 0; i < maxlen - sequence.length; i++){
    resultSequence.unshift([0,0,0]);
  }
  return resultSequence;
}

function sample(predictions, n){
  n = Math.min(predictions.length, n);

  let sorted_indexes = argsortDesc(predictions);

  let randint = Math.floor(Math.random() * n);

  return sorted_indexes[randint];

}

export function getNextIntervalPrediction(seq, seq_length, model){
  console.log('getNextIntervalPrediction');
  let input_sequence = seq.slice(-seq_length);
  let x = prePadSequence(input_sequence, seq_length);

  console.log('x', x);
  let tensor = tf.tensor3d([x]);

  console.log('tensor', tensor);
  let predictionTensor = model.predict(tensor);

  console.log('predictionTensor', predictionTensor);
  let predictionOffset = predictionTensor[0].arraySync();
  let predictionInterval = predictionTensor[1].arraySync();
  let predictionDuration = predictionTensor[2].arraySync();

  console.log('PREDICTION[0]', predictionOffset[0],predictionInterval[0],predictionDuration[0]);

  return [predictionOffset[0], predictionInterval[0], predictionDuration[0]];

}

export function sampleSeq(seq, seq_length, model, output_seq_length ){
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

export { Predictions as default };
