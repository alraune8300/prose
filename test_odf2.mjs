import { htmlToOdt } from 'odf-kit';
async function run() {
  const result = htmlToOdt("<h1>Hello</h1><p>Test</p>");
  console.log(result.constructor.name);
  if (result instanceof Promise) {
    const res = await result;
    console.log(res.constructor.name);
    console.log(res.length);
  }
}
run();
