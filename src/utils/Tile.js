
  export default class Tile {
    constructor(x, y, hover, tileMargin, color){

      this.x = x;
      this.y = y;
    
      this.hovered = hover || false;
    
      this.tileMargin = tileMargin;
      this.color = color;
    }
  
      
    draw = function(context, width, height, activeColumn) {
      
      console.log('drawing tile on', width, height);
      console.log('on column', activeColumn);
      //get the note and color
      var margin = this.tileMargin;
      context.fillStyle = 'blue';
      context.beginPath();
      context.fillRect(this.x * width + margin, this.y * height + margin, width - margin * 2, height - margin * 2);
      if (this._hovered || this.x === activeColumn) {
        context.fillStyle = 'rgba(255, 255, 255, 0.4)';
        context.beginPath();
        context.fillRect(this.x * width + margin, this.y * height + margin, width - margin * 2, height - margin * 2);
      }
    };
    
    setPosition = function(x, y) {
      this.x = x;
      this.y = y;
    };
    
    hover = function() {
      this._hovered = true;
    };
    
    unhover = function() {
      this._hovered = false;
    };
    
    isHovered = function() {
      return this._hovered;
    };

  }

