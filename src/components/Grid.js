// import React from 'react'
// import Canvas from './Canvas'

// const draw = (context) => {
//   context.fillStyle = "rgb(200, 0, 0)";
//   context.fillRect(10, 10, 50, 50);

//   context.fillStyle = "rgba(0, 0, 200, 0.5)";
//   context.fillRect(30, 30, 50, 50);
// }; // Example taken from https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage


// const Grid = (gridStyle, Config, Colors, Tile, AI, TWEEN)=>{
  
//   /**
//    * The canvas size
//    */
//   let width = 0;
//   let height = 0;

//   let tileWidth = 0;
//   let tileHeight = 0;

//   /**
//    * The currently active column. -1 for nothing
//    */
//   let activeColumn = -1;

//   /**
//    * Track mouse drag events
//    */
//   let mouseDrag = false;
//   let lastDragTile = {x: null, y: null};

//   /**
//    * All the tiles on the screen
//    */
//   tiles = new Array(Config.gridWidth);

//   resize = function() {
//     this._needsUpdate = true;
//     this.width = this.canvas.offsetWidth * 2;
//     this.height = this.canvas.offsetHeight * 2;
//     this.context.canvas.width = this.width;
//     this.context.canvas.height = this.height;
//     this.bgContext.canvas.width = this.width;
//     this.bgContext.canvas.height = this.height;
//     this.tileWidth = this.width / Config.gridWidth;
//     this.tileHeight = this.height / Config.gridHeight;
//     this._drawLines();
//   };
  
//   tileAtPosition = function(x, y) {
//     return {
//       x: Math.floor(x / (tileWidth / 2)),
//       y: Math.floor(y / (tileHeight / 2))
//     };
//   };
  
//   clicked = function(e) {
//     this.mouseDrag = true;
  
//     e.preventDefault();
//     //get the touch coord
//     if (e.type === 'onTouchStart' || e.type === 'onTouchMove') {
//       for (var i = 0; i < e.changedTouches.length; i++) {
//         var touch = e.changedTouches[i];
//         var touchTilePos = tileAtPosition(touch.clientX, touch.clientY);
//         addTile(touchTilePos.x, touchTilePos.y);
//         lastDragTile = touchTilePos;
//       }
//     } else {
//       var tilePos = tileAtPosition(e.clientX, e.clientY);
//       addTile(tilePos.x, tilePos.y, true);
  
//       lastDragTile = tilePos;
//     }
//   };
  
//   mouseUp = function(e) {
//     e.preventDefault();
  
//     // Reset drag variables
//     mouseDrag = false;
//     lastDragTile = {x: null, y: null};

//   };
  
//   hover = function(e) {
//     const x = e.clientX || e.touches[0].clientX;
//     const y = e.clientY || e.touches[0].clientY;
  
//     var tilePos = tileAtPosition(x, y);
  
//     //get the tile at the pos
//     var tile = tiles[tilePos.x];
  
//     // Call click event on mousedrag
//     if (mouseDrag && (tilePos.x !== lastDragTile.x || tilePos.y !== lastDragTile.y)) {
//       lastDragTile = tilePos;
//       clicked(e);
//     }
  
//     if (tile && !tile.isHovered()) {
//       if (tilePos.y === tile.y) {
//         needsUpdate = true;
//         tile.hover();
//       }
//     }
//     //go through the tiles, and unhover them
//     for (var i = 0; i < this._tiles.length; i++) {
//       var t = this._tiles[i];
//       if (t && t.isHovered() && (t.x !== tilePos.x || t.y !== tilePos.y)) {
//         needsUpdate = true;
//         t.unhover();
//       }
//     }
//   };
  
//   addTile = function(x, y, hover) {
//     needsUpdate = true;
//     //if there's a tile already in that column
//     if (tiles[x]) {
//       var tile = tiles[x];
//       //and row, remove it
//       if (tile.y == y) {
//         removeTile(x, y, tile);
//       } else {
//         //otherwise remove it
//         removeTile(x, y, tile);
//         addTile(x, y, hover);
//       }
//     } else {
//       var t = new Tile(x, y, hover);
//       onNote(y);
//       var ai = new AI(t, this);
//       tiles[x] = t;
//       ai.push(ai);
//     }
//   };
  
//   removeTile = function(x, y, tile) {
//     //remove the AI associated with that tile
//     for (var i = 0; i < ai.length; i++) {
//       var ai = ai[i];
//       if (ai.tile === tile) {
//         ai.dispose();
//         ai.splice(i, 1);
//         break;
//       }
//     }
//     tiles[x] = null;
//     needsUpdate = true;
//   };


//  return (<div id='Grid'> 
//     <Canvas 
//       draw={draw} 
//       height={100} 
//       width={100} 
//       onMouseMove={onMouseMove}
//       onMouseDown={onMouseDown}
//       onMouseUp={onMouseUp}
//       onTouchMove={onTouchMove}
//       onTouchEnd={onTouchEnd}
//       onTouchStart={onTouchStart}
//     />
//   </div>
//  );
// };


// export default Grid;