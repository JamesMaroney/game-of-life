var o={}, currentGeneration,
    console = { log: function(){ postMessage({cmd: 'log', args: [].slice.call(arguments, 0)}); } };

onmessage = function(msg){
  if(!msg.data) return;
  switch(msg.data.cmd){
    case 'set-options':
      o = msg.data.options;
      break;
    case 'start':
      console.log('starting game engine');
      postMessage(currentGeneration = generateRandomSeed())
      computeNextGeneration();
      break;
    default:
      console.log('unknown message command: ', msg.data.cmd);
  }
}

var generateRandomSeed = function(){
  var generation = [], rand;
  for(var i=0; i<o.boardWidth; i++){
    for(var j=0; j<o.boardHeight; j++){
      generation[i] = generation[i] || [];
      rand = Math.random();
      generation[i][j] = 0;
      if(rand < o.initialHumanPopulation) generation[i][j] = 10;
      if(rand > 1 - o.initialZombiePopulation) generation[i][j] = 1;
    }
  }
  return generation;
}

var findEmptyTarget = function(i,j,nextGeneration, tendTowardPoint){
  var prevRow = j==0 && o.edgeBehavior == 'wrap' ? o.boardHeight - 1 : j - 1;
  var prevCol = i==0 && o.edgeBehavior == 'wrap' ? o.boardWidth - 1 : i - 1;
  var nextRow = j==o.boardHeight-1 && o.edgeBehavior == 'wrap' ? 0 : j + 1;
  var nextCol = i==o.boardWidth-1 && o.edgeBehavior == 'wrap' ? 0 : i+1;

  nextGeneration[prevCol] = nextGeneration[prevCol] || []
  nextGeneration[i] = nextGeneration[i] || []
  nextGeneration[nextCol] = nextGeneration[nextCol] || []

  var emptyCells = [];
  if(prevCol > -1 && prevRow > -1                       && !nextGeneration[prevCol][prevRow] && !currentGeneration[prevCol][prevRow]) emptyCells.push([prevCol, prevRow]);
  if(prevRow > -1                                       && !nextGeneration[i][prevRow]       && !currentGeneration[i][prevRow])       emptyCells.push([i, prevRow]);
  if(nextCol < o.boardWidth && prevRow > -1            && !nextGeneration[nextCol][prevRow] && !currentGeneration[nextCol][prevRow]) emptyCells.push([nextCol, prevRow]);
  if(prevCol > -1                                       && !nextGeneration[prevCol][j]       && !currentGeneration[prevCol][j])       emptyCells.push([prevCol, j]);
  if(nextCol < o.boardWidth                            && !nextGeneration[nextCol][j]       && !currentGeneration[nextCol][j])       emptyCells.push([nextCol, j]);
  if(prevCol > -1 && nextRow < o.boardHeight           && !nextGeneration[prevCol][nextRow] && !currentGeneration[prevCol][nextRow]) emptyCells.push([prevCol, nextRow]);
  if(nextRow < o.boardHeight                           && !nextGeneration[i][nextRow]       && !currentGeneration[i][nextRow])       emptyCells.push([i, nextRow]);
  if(nextCol < o.boardWidth && nextRow < o.boardHeight && !nextGeneration[nextCol][nextRow] && !currentGeneration[nextCol][nextRow]) emptyCells.push([nextCol, nextRow]);
  if(emptyCells.length){
    if(tendTowardPoint){
      return emptyCells.reduce(function(prev, cell){
        cell[2] = Math.sqrt(Math.pow(Math.abs(cell[0]-tendTowardPoint[0]),2) + Math.pow(Math.abs(cell[1]-tendTowardPoint[1]),2));
        return cell[2] < prev[2] ? cell : prev;
      }, [0,0,Infinity])
    } else {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)]
    }
  }
}

var computeNextGeneration = function(){
  var prevRow, nextRow, prevCol, nextCol, alive, neighbors, livingNeighbors;
  var nextGeneration = [];
  for(var i = 0; i<o.boardWidth; i++){
    for(var j=0; j<o.boardHeight; j++){
      prevRow = j==0 && o.edgeBehavior == 'wrap' ? o.boardHeight - 1 : j - 1;
      prevCol = i==0 && o.edgeBehavior == 'wrap' ? o.boardWidth - 1 : i - 1;
      nextRow = j==o.boardHeight-1 && o.edgeBehavior == 'wrap' ? 0 : j + 1;
      nextCol = i==o.boardWidth-1 && o.edgeBehavior == 'wrap' ? 0 : i+1;

      // protecting against out of bounds issues
      currentGeneration[prevCol] = currentGeneration[prevCol] || []
      currentGeneration[nextCol] = currentGeneration[nextCol] || []
      currentGeneration[prevRow] = currentGeneration[prevRow] || []
      currentGeneration[nextRow] = currentGeneration[nextRow] || []

      neighbors = (currentGeneration[prevCol][prevRow] || 0)
                + (currentGeneration[i][prevRow] || 0)
                + (currentGeneration[nextCol][prevRow] || 0)
                + (currentGeneration[prevCol][j] || 0)
                + (currentGeneration[nextCol][j] || 0)
                + (currentGeneration[prevCol][nextRow] || 0)
                + (currentGeneration[i][nextRow] || 0)
                + (currentGeneration[nextCol][nextRow] || 0);

      livingNeighbors = Math.floor(neighbors / 10);
      undeadNeighbors = neighbors % 10;
      nextGeneration[i] = nextGeneration[i] || [];
      currentSpot = currentGeneration[i][j];
      nextGeneration[i][j] = nextGeneration[i][j] || currentSpot;

      if(currentSpot == 10){ // if Human
        if(Math.random() < o.humanMigration){  // if I decide to migrate
          if(target = findEmptyTarget(i,j,nextGeneration,(Math.random() < o.humanColonizing) ? [Math.floor(o.boardWidth/2),Math.floor(o.boardHeight/2)] : false)){
            nextGeneration[target[0]] = nextGeneration[target[0]] || []
            nextGeneration[target[0]][target[1]] = 10;
            nextGeneration[i][j] = 0;
          }
        } else if(undeadNeighbors){ // zombies nearby
          nextGeneration[i][j] = Math.random() > (o.zombieStrength + o.zombieCrowdingBoost * (undeadNeighbors - 1)) ? 10 : 1; // did zombies infect me?
        } else if(o.humanOvercrowding && livingNeighbors >= o.humanOvercrowding){ // did I die from overcrowding?
          nextGeneration[i][j] = 0;
        } else {
          nextGeneration[i][j] = 10;
        }
      } else if(currentSpot == 1) { // if Zombie
        if(Math.random() < o.zombieMigration){  // if I decide to migrate
          if(target = findEmptyTarget(i,j,nextGeneration,false)){
            nextGeneration[target[0]] = nextGeneration[target[0]] || []
            nextGeneration[target[0]][target[1]] = 1;
            nextGeneration[i][j] = 0;
          }
        } else if(livingNeighbors){ // humans nearby
          nextGeneration[i][j] = Math.random() > (o.humanStrength + o.humanCrowdingBoost * (livingNeighbors - 1)) ? 1 : 0; // did humans re-dead me?
        } else if(o.zombieOvercrowding && undeadNeighbors >= o.zombieOvercrowding){ // did I die from overcrowding?
          nextGeneration[i][j] = 0;
        } else {
          nextGeneration[i][j] = 1;
        }
      } else { // if Empty
        peacefulSpawn = livingNeighbors >= o.humansRequiredForSafeReproduction && undeadNeighbors == 0 && Math.random() < o.likelihoodOfSafeReproduction;
        chaosSpawn = livingNeighbors >= o.humansRequiredForChaoticReproduction && Math.random() < o.likelihoodOfChaoticReproduction;
        if(peacefulSpawn || chaosSpawn){
          nextGeneration[i][j] = 10;
        }
      }
    }
  }

  postMessage(currentGeneration = nextGeneration);
  setTimeout(computeNextGeneration,o.generationSpeed);
}
