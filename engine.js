var zombieStrength = 0.4,                 // Percentage likelihood that a single Zombie will infect a human
    zombieCrowdingStrength = 0.02,        // Percentage boost for each additional Zombie surrounding a human
    humanStrength = 0.7,                  // Percentage likelihood that a human will kill a Zombie
    humanCrowdingStrength = 0.2,          // Percentage boost for each additional human surrounding a Zombie
    peacefulReproductionLikelihood = 0.6, // Percentage chance that humans will reproduce in peaceful surroundings
    humansNeededForPeacefulSpawn = 4,     // Number of humans needed to constitute peaceful surroundings (and no Zombies)
    chaosReproductionLikelihood = 0.05,   // Percentage chance that humans will reproduce with Zombies around
    humansNeededForChaoticSpawn = 2,      // Number of humans needed to reproduce with Zombies around
    initialHumanSeed = 0.1,               // Percentage of the initial board that will contain human population
    initialZombieSeed = 0.001,            // Percentage of the initial board that will contain Zombie population
    humanOvercrowdingThreshold = 8,       // Number of surrounding humans that will result in death due to overcrowding
    zombieOvercrowdingThreshold = false;  // Number of surrounding zombies that will result in death due to overcrowding

var options, currentGeneration;
console = { log: function(){ postMessage({cmd: 'log', args: [].slice.call(arguments, 0)}); } }
console.log('loading game engine');


onmessage = function(msg){
  if(msg.data && msg.data.cmd == 'start'){
    console.log('starting game engine');
    options = msg.data.options;
    postMessage(currentGeneration = generateRandomSeed())
    computeNextGeneration();
  }
}

var generateRandomSeed = function(){
  var generation = [], rand;
  for(var i=0; i<options.width; i++){
    for(var j=0; j<options.height; j++){
      generation[i] = generation[i] || [];
      rand = Math.random();
      generation[i][j] = 0;
      if(rand < initialHumanSeed) generation[i][j] = 10;
      if(rand > 1 - initialZombieSeed) generation[i][j] = 1;
    }
  }
  return generation;
}

var computeNextGeneration = function(){
  var prevRow, nextRow, prevCol, nextCol, alive, neighbors, livingNeighbors;
  var nextGeneration = [];
  for(var i = 0; i<options.width; i++){
    for(var j=0; j<options.height; j++){
      prevRow = j==0 ? options.height - 1 : j - 1;
      prevCol = i==0 ? options.width - 1 : i - 1;
      nextRow = ( j + 1 ) % options.height;
      nextCol = ( i + 1 ) % options.width;
      neighbors = currentGeneration[prevCol][prevRow]
                        + currentGeneration[i][prevRow]
                        + currentGeneration[nextCol][prevRow]
                        + currentGeneration[prevCol][j]
                        + currentGeneration[nextCol][j]
                        + currentGeneration[prevCol][nextRow]
                        + currentGeneration[i][nextRow]
                        + currentGeneration[nextCol][nextRow];
      livingNeighbors = Math.floor(neighbors / 10);
      undeadNeighbors = neighbors % 10;
      nextGeneration[i] = nextGeneration[i] || [];
      currentSpot = currentGeneration[i][j];
      nextGeneration[i][j] = currentSpot;
      if(currentSpot == 10){ // if Human
        if(undeadNeighbors){ // zombies nearby
          nextGeneration[i][j] = Math.random() > (zombieStrength + zombieCrowdingStrength * (undeadNeighbors - 1)) ? 10 : 1; // did zombies infect me?
        } else if(humanOvercrowdingThreshold && livingNeighbors >= humanOvercrowdingThreshold){ // did I die from overcrowding?
          nextGeneration[i][j] = 0;
        } else {
          nextGeneration[i][j] = 10;
        }
      } else if(currentSpot == 1) { // if Zombie
        if(livingNeighbors){ // humans nearby
          nextGeneration[i][j] = Math.random() > (humanStrength + humanCrowdingStrength * (livingNeighbors - 1)) ? 1 : 0; // did humans re-dead me?
        } else if(zombieOvercrowdingThreshold && undeadNeighbors >= zombieOvercrowdingThreshold){ // did I die from overcrowding?
          nextGeneration[i][j] = 0;
        } else {
          nextGeneration[i][j] = 1;
        }
      } else { // if Empty
        peacefulSpawn = livingNeighbors >= humansNeededForPeacefulSpawn && undeadNeighbors == 0 && Math.random() < peacefulReproductionLikelihood;
        chaosSpawn = livingNeighbors >= humansNeededForChaoticSpawn && Math.random() < chaosReproductionLikelihood;
        if(peacefulSpawn || chaosSpawn){
          nextGeneration[i][j] = 10;
        }
      }
    }
  }

  postMessage(currentGeneration = nextGeneration);
  setTimeout(computeNextGeneration,0);
}
