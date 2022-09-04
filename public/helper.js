export function randomColour() {return [Math.random(), Math.random(), Math.random()];}
export function repeat(n, pattern) {return [...Array(n)].reduce(sum => sum.concat(pattern), []);}