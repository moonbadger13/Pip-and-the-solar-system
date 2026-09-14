export const QUESTIONS = [
{id:'sun',question:'What is the Sun?',options:['A planet','A star','A moon'],correct:1,explanation:'The Sun is a star that gives us light and heat.'},
{id:'flag',question:'Which Scratch block starts code when you click the green flag?',options:['move 10 steps','when green flag clicked','say Hello'],correct:1,explanation:'This event block starts its script when the flag is clicked.'},
{id:'mercury',question:'Which planet is closest to the Sun?',options:['Mercury','Earth','Mars'],correct:0,explanation:'Mercury is the first planet from the Sun.'},
{id:'sprite',question:'What is a sprite in Scratch?',options:['A saved password','The whole computer','A character or object you can code'],correct:2,explanation:'Sprites are characters and objects that you can program.'},
{id:'earth',question:'Which planet is our home?',options:['Venus','Jupiter','Earth'],correct:2,explanation:'Earth is our home and the third planet from the Sun.'},
{id:'mars',question:'Which planet is called the Red Planet?',options:['Neptune','Mars','Saturn'],correct:1,explanation:'Rusty material on its surface gives Mars its reddish colour.'},
{id:'x',question:'What does change x by 10 do in Scratch?',options:['Moves the sprite right','Moves the sprite up','Makes the sprite bigger'],correct:0,explanation:'Positive x values move a sprite to the right.'},
{id:'jupiter',question:'Which planet is the largest?',options:['Jupiter','Mercury','Earth'],correct:0,explanation:'Jupiter is the largest planet in our solar system.'},
{id:'saturn',question:'Which planet is famous for its large, bright rings?',options:['Mars','Venus','Saturn'],correct:2,explanation:'Saturn’s rings contain many pieces of ice and rock.'},
{id:'y',question:'What does change y by 10 do in Scratch?',options:['Moves the sprite left','Moves the sprite up','Plays a sound'],correct:1,explanation:'Positive y values move a sprite up.'},
{id:'neptune',question:'Which of the eight planets is farthest from the Sun?',options:['Neptune','Uranus','Saturn'],correct:0,explanation:'Neptune is the eighth and farthest planet from the Sun.'},
{id:'gas',question:'Could you stand on solid ground on Jupiter?',options:['Yes, just like Earth','No, it has no solid surface','Only at night'],correct:1,explanation:'Jupiter has no solid surface. Our game’s platforms are imaginary.'},
{id:'moon',question:'What does Earth’s Moon travel around?',options:['Mars','Saturn','Earth'],correct:2,explanation:'The Moon orbits Earth.'},
{id:'repeat',question:'Which block runs the same instructions several times?',options:['say Hello','stop all','repeat'],correct:2,explanation:'A repeat block runs the blocks inside it again.'},
{id:'day',question:'What causes day and night on Earth?',options:['Earth spinning','The Sun switching off','Clouds covering the Sun'],correct:0,explanation:'Earth spins, turning different places towards and away from the Sun.'},
{id:'debug',question:'Your sprite moves the wrong way. What should you try?',options:['Test and change the movement code','Delete every sprite','Keep clicking faster'],correct:0,explanation:'Finding and fixing a problem in your code is called debugging.'}
];
export const SPRINT_SECONDS=300;
export const medalFor=score=>score>=800?'Gold explorer':score>=400?'Silver explorer':score>=150?'Bronze explorer':'Space explorer';
export const BEST_KEY='pip-crystal-sprint-best-v1';
export function loadBest(storage){try{const value=JSON.parse(storage?.getItem(BEST_KEY)||'0');return Number.isSafeInteger(value)&&value>=0?value:0;}catch{return 0;}}
export function saveBest(storage,value){try{if(Number.isSafeInteger(value)&&value>=0)storage?.setItem(BEST_KEY,JSON.stringify(value));return !!storage;}catch{return false;}}
export class CrystalSprint{
 constructor(best=0){this.best=Number.isSafeInteger(best)&&best>=0?best:0;this.active=false;this.result=null;this.remaining=SPRINT_SECONDS;this.score=0;this.colours=new Set();this.delivered=0;}
 start(){this.active=true;this.result=null;this.remaining=SPRINT_SECONDS;this.score=0;this.colours=new Set();this.delivered=0;}
 tick(seconds){if(!this.active||!Number.isFinite(seconds)||seconds<=0)return false;this.remaining=Math.max(0,this.remaining-seconds);if(this.remaining<=0){this.finish();return true;}return false;}
 recordDelivery(colours){if(!this.active||this.remaining<=0||!Array.isArray(colours)||colours.length!==8)return 0;let points=0;
  for(let i=0;i<8;i++){const n=colours[i];if(!Number.isSafeInteger(n)||n<0)return 0;}
  for(let i=0;i<8;i++){const n=colours[i];if(n>0){points+=n*10;this.delivered+=n;if(!this.colours.has(i)){this.colours.add(i);points+=20;}}}this.score+=points;return points;
 }
 finish(){if(this.result)return this.result;this.active=false;const previousBest=this.best;this.best=Math.max(this.best,this.score);this.result={score:this.score,delivered:this.delivered,colours:this.colours.size,medal:medalFor(this.score),newBest:this.score>previousBest,best:this.best};return this.result;}
}
export class SupplyQuiz{
 constructor(){this.reset();}
 reset(sprint=false){this.sprint=sprint;this.pickups=0;this.nextAt=0;this.attempts=0;this.correct=0;this.pending=null;this.sequence=this.sequence||0;}
 collected(count){if(Number.isSafeInteger(count)&&count>0)this.pickups+=count;}
 get needed(){return Math.max(0,this.nextAt-this.pickups);}
 get available(){return !!(this.pending&&!this.pending.answered)||((!this.sprint||this.attempts<4)&&this.needed===0);}
 get exhausted(){return this.sprint&&this.attempts>=4&&!this.pending;}
 open(){if(this.pending)return this.pending;if(!this.available)return null;
  const question=QUESTIONS[this.sequence%QUESTIONS.length];this.pending={token:++this.sequence,question,answered:false,result:null};return this.pending;
 }
 answer(token,choice,game){
  const card=this.pending;if(!card||card.token!==token||card.answered||!Number.isInteger(choice)||choice<0||choice>=card.question.options.length)return null;
  card.answered=true;this.attempts++;this.nextAt=this.pickups+5;
  const correct=choice===card.question.correct;let addedCredits=0;
  if(correct){this.correct++;for(const key of ['energy','roverFuel','rocketFuel'])game[key]=Math.min(100,Math.max(0,Number(game[key])||0)+25);game.credits=Math.max(0,Number(game.credits)||0)+5;addedCredits=5;}
  card.result={correct,correctAnswer:card.question.options[card.question.correct],explanation:card.question.explanation,addedCredits};return card.result;
 }
 close(){if(this.pending?.answered)this.pending=null;}
}
