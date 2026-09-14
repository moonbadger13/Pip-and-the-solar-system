import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTIONS,CrystalSprint,SupplyQuiz,loadBest,saveBest,BEST_KEY,medalFor} from '../dist/challenges.mjs';
const resources=()=>({energy:50,roverFuel:85,rocketFuel:99,credits:2});
const answer=(q,g,correct=true)=>{const c=q.open();assert(c);return {card:c,result:q.answer(c.token,correct?c.question.correct:(c.question.correct+1)%3,g)};};
test('16 distinct questions, three choices, valid answers and feedback',()=>{
 assert.equal(QUESTIONS.length,16);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,16);
 for(const q of QUESTIONS){assert(q.question.trim());assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3);assert(q.explanation.trim());}
});
test('all 16 correct answers reward once, with no repeated exploration cards',()=>{
 const quiz=new SupplyQuiz(),seen=new Set();
 for(let i=0;i<QUESTIONS.length;i++){const game=resources(),{card,result}=answer(quiz,game);assert(result.correct);assert(!seen.has(card.question.id));seen.add(card.question.id);
 assert.deepEqual(game,{energy:75,roverFuel:100,rocketFuel:100,credits:7});assert.equal(quiz.answer(card.token,card.question.correct,game),null);
 assert.deepEqual(game,{energy:75,roverFuel:100,rocketFuel:100,credits:7});quiz.close();quiz.collected(5);}
 assert(!quiz.exhausted);
});
test('delivery points and new-colour bonus apply exactly once per colour',()=>{
 const s=new CrystalSprint();s.start();assert.equal(s.recordDelivery([2,0,1,0,0,0,0,0]),70);
 assert.equal(s.recordDelivery([1,0,2,0,0,0,0,0]),30);assert.equal(s.recordDelivery([0,0,0,1,0,0,0,0]),30);
 assert.equal(s.recordDelivery([0,0,0,0,0,0,0,0]),0);assert.equal(s.score,130);assert.equal(s.delivered,7);assert.equal(s.colours.size,3);
});
test('invalid delivery counts do not partly mutate scores',()=>{
 const s=new CrystalSprint();s.start();
 for(const c of [[],null,[1,0,0,0,0,0,0,-1],[1,0,0,0,0,0,0,NaN],[1,0,0,0,0,0,0,1.2]]){assert.equal(s.recordDelivery(c),0);assert.equal(s.score,0);assert.equal(s.colours.size,0);}
});
test('five-minute expiry is exact, idempotent and blocks late scores',()=>{
 const s=new CrystalSprint(10);s.start();s.recordDelivery([1,0,0,0,0,0,0,0]);
 assert.equal(s.tick(2.5),false);assert.equal(s.remaining,297.5);
 for(const dt of [0,-1,NaN,Infinity]){s.tick(dt);assert.equal(s.remaining,297.5);}
 assert.equal(s.tick(1000),true);assert.equal(s.active,false);assert.equal(s.remaining,0);
 const result=structuredClone(s.result);assert.equal(result.newBest,true);assert.equal(s.recordDelivery(Array(8).fill(99)),0);
 assert.equal(s.tick(1),false);assert.deepEqual(s.finish(),result);assert.equal(s.score,30);
 s.start();assert.equal(s.remaining,300);assert.equal(s.score,0);assert.equal(s.best,30);assert.equal(s.colours.size,0);assert.equal(s.result,null);
});
test('best scores and medal thresholds are stable',()=>{
 const s=new CrystalSprint(200);s.start();s.recordDelivery([1,0,0,0,0,0,0,0]);assert.equal(s.finish().best,200);assert.equal(s.result.newBest,false);
 for(const [score,medal] of [[149,'Space explorer'],[150,'Bronze explorer'],[399,'Bronze explorer'],[400,'Silver explorer'],[799,'Silver explorer'],[800,'Gold explorer']])assert.equal(medalFor(score),medal);
});
test('unanswered card survives closing, wrong answers preserve resources',()=>{
 const q=new SupplyQuiz();q.reset(true);const c=q.open();q.close();assert.equal(q.open(),c);
 const g=resources(),before=structuredClone(g),r=q.answer(c.token,(c.question.correct+1)%3,g);
 assert.equal(r.correct,false);assert.equal(r.correctAnswer,c.question.options[c.question.correct]);assert.deepEqual(g,before);assert.equal(q.needed,5);assert.equal(q.available,false);
 q.close();assert.equal(q.open(),null);
});
test('only five new crystals unlock another card',()=>{
 const q=new SupplyQuiz();q.collected(50);const {card}=answer(q,resources());q.close();assert.equal(q.needed,5);
 q.collected(4);assert.equal(q.needed,1);assert.equal(q.open(),null);q.collected(1);assert.equal(q.needed,0);
 const next=q.open();assert.notEqual(next.token,card.token);assert.notEqual(next.question.id,card.question.id);
});
test('four sprint attempts count both right and wrong answers',()=>{
 const q=new SupplyQuiz();q.reset(true);
 for(let i=0;i<4;i++){assert(q.available);answer(q,resources(),i%2===0);q.close();q.collected(5);}
 assert.equal(q.correct,2);assert.equal(q.attempts,4);assert(q.exhausted);q.collected(100);assert.equal(q.available,false);assert.equal(q.open(),null);
});
test('invalid choices and stale tokens cannot answer or reward a new card',()=>{
 const q=new SupplyQuiz(),c=q.open(),g=resources(),before=structuredClone(g);
 for(const choice of[-1,3,NaN,.5,undefined,'0'])assert.equal(q.answer(c.token,choice,g),null);
 assert.deepEqual(g,before);assert.equal(c.answered,false);q.reset(true);const next=q.open();assert.notEqual(next.token,c.token);
 assert.equal(q.answer(c.token,c.question.correct,g),null);assert.deepEqual(g,before);assert.equal(next.answered,false);
});
test('best-score persistence tolerates corrupt and denied storage',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
 assert.equal(loadBest(storage),0);assert(saveBest(storage,170));assert.equal(loadBest(storage),170);assert.equal(JSON.parse(data.get(BEST_KEY)),170);
 for(const value of['broken','null','{}','"bad"','-1','1.5','true']){data.set(BEST_KEY,value);assert.equal(loadBest(storage),0);}
 const denied={getItem(){throw Error('Denied');},setItem(){throw Error('Denied');}};
 assert.equal(loadBest(denied),0);assert.equal(saveBest(denied,5),false);assert.equal(loadBest(null),0);
});
