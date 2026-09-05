import { loadSkill, selectSkill } from '../src/skill-registry.js';
const [stage = 'plan', preset = 'balanced'] = process.argv.slice(2);
const skill = stage.includes('/') ? loadSkill(stage) : selectSkill(stage, preset);
console.log(JSON.stringify({ ...skill, content: process.argv.includes('--content') ? skill.content : undefined }, null, 2));
