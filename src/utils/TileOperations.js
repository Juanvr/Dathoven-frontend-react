let TileOperations = {}

export function adjacentTiles( tile1, tile2){

  let adjacentColumn = tile1.x - tile2.x === -1 || tile1.x - tile2.x === 1;
  let sameRow = tile1.y === tile2.y;

  return sameRow && adjacentColumn;
}

export function overlappedTiles( tile1, tile2 ){
  let sameColumn = sameColumnTiles(tile1, tile2);

  let sameRow = tile1.y === tile2.y;

  return sameRow && sameColumn;
}

export function sameColumnTiles( tile1, tile2){

  let overlappedX = 
  (tile1.x <= tile2.x && tile1.x + tile1.size > tile2.x) || 
  (tile2.x <= tile1.x && tile2.x + tile2.size > tile1.x);

  return overlappedX;
}

export function sortTiles(tiles){
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


export { TileOperations as default };
