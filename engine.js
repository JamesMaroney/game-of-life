var options, currentGeneration;
console = { log: function(){ postMessage({cmd: 'log', args: [].slice.call(arguments, 0)}); } }
console.log('loading game engine');


onmessage = function(msg){
  if(msg.data && msg.data.cmd == 'start'){
    console.log('starting game engine');
    options = msg.data.options;
    postMessage(currentGeneration = generateRandomSeed())
    setInterval(computeNextGeneration, 500);
  }
}

var generateRandomSeed = function(){
  var generation = [];
  for(var i=0; i<options.width; i++){
    for(var j=0; j<options.height; j++){
      generation[i] = generation[i] || [];
      generation[i][j] = (Math.random() > 0.9) ? 1 : 0;
    }
  }
  return generation;
}

var computeNextGeneration = function(){
  console.log('computing next generation');
  var prevRow, nextRow, prevCol, nextCol, alive;
  var nextGeneration = [];
  for(var i = 0; i<options.width; i++){
    for(var j=0; j<options.height; j++){
      prevRow = j==0 ? options.height - 1 : j - 1;
      prevCol = i==0 ? options.width - 1 : i - 1;
      nextRow = ( j + 1 ) % options.height;
      nextCol = ( i + 1 ) % options.width;
      livingNeighbors = currentGeneration[prevCol][prevRow]
                        + currentGeneration[i][prevRow]
                        + currentGeneration[nextCol][prevRow]
                        + currentGeneration[prevCol][j]
                        + currentGeneration[nextCol][j]
                        + currentGeneration[prevCol][nextRow]
                        + currentGeneration[i][nextRow]
                        + currentGeneration[nextCol][nextRow];
      alive = false;
      if(currentGeneration[i][j]){
        alive = livingNeighbors == 2 || livingNeighbors == 3;
      } else {
        alive = livingNeighbors == 3;
      }

      nextGeneration[i] = nextGeneration[i] || [];
      nextGeneration[i][j] = alive ? 1 : 0;
    }
  }
  postMessage(currentGeneration = nextGeneration);
}
