export const meta = { title: 'From tester to AI engineer: the road to Napkin', width: 520, height: 320 };

// A zigzag road with one stop per chapter. Low stops carry their label below, high stops above.
const STOPS = [
  { x: 58, y: 222, up: false },
  { x: 145, y: 112, up: true },
  { x: 232, y: 222, up: false },
  { x: 319, y: 112, up: true },
  { x: 406, y: 222, up: false },
  { x: 470, y: 102, up: true },
];

export default (d) => {
  const road = (a, b, pen = 'muted') => {
    const p = STOPS[a];
    const q = STOPS[b];
    d.curve(
      [
        [p.x + 16, p.y + (q.y < p.y ? -14 : 14)],
        [(p.x + q.x) / 2 + 6, (p.y + q.y) / 2],
        [q.x - 16, q.y + (q.y < p.y ? 14 : -14)],
      ],
      { pen, dashed: true, single: true },
    );
  };
  const label = (i, text, pen) => {
    const s = STOPS[i];
    const y = s.up ? s.y - 52 : s.y + 50;
    const anchor = i === 0 ? 'start' : i === STOPS.length - 1 ? 'end' : 'middle';
    const x = i === 0 ? 16 : i === STOPS.length - 1 ? 508 : s.x;
    d.text(x, y, text, { size: 15, pen, anchor });
  };

  d.step('A tester who could code');
  d.group(() => {
    const { x, y } = STOPS[0];
    d.circle(x, y, 36, { pen: 'red', fill: 'red' });
    d.ellipse(x, y + 2, 14, 18, { pen: 'red', single: true });
    d.line(x - 12, y - 4, x - 6, y - 2, { pen: 'red', single: true });
    d.line(x + 12, y - 4, x + 6, y - 2, { pen: 'red', single: true });
    d.line(x - 12, y + 8, x - 6, y + 6, { pen: 'red', single: true });
    d.line(x + 12, y + 8, x + 6, y + 6, { pen: 'red', single: true });
  });
  label(0, 'a tester who\ncould code', 'red');

  d.step('C++ for payment gateways');
  road(0, 1);
  d.group(() => {
    const { x, y } = STOPS[1];
    d.rect(x - 24, y - 16, 48, 32, { pen: 'blue', fill: 'blue', rough: 0.7 });
    d.line(x - 24, y - 6, x + 24, y - 6, { pen: 'blue', single: true });
    d.text(x, y + 6, 'C++', { size: 14, pen: 'blue', mono: true });
  });
  label(1, 'C++ for payment\ngateways', 'blue');

  d.step('Python, and the joy of simple');
  road(1, 2);
  d.group(() => {
    const { x, y } = STOPS[2];
    d.circle(x, y, 36, { pen: 'green', fill: 'green' });
    d.curve(
      [
        [x - 12, y + 6],
        [x - 4, y - 7],
        [x + 4, y + 6],
        [x + 12, y - 6],
      ],
      { pen: 'green', thick: true, single: true },
    );
  });
  label(2, 'Python: code that\nreads like the idea', 'green');

  d.step('Data science and system design');
  road(2, 3);
  d.group(() => {
    const { x, y } = STOPS[3];
    d.rect(x - 24, y - 18, 48, 36, { pen: 'violet', fill: 'violet', rough: 0.7 });
    d.poly(
      [
        [x - 15, y + 10],
        [x - 6, y - 2],
        [x + 3, y + 4],
        [x + 15, y - 10],
      ],
      { pen: 'violet', single: true },
    );
  });
  label(3, 'data science +\nsystem design', 'violet');

  d.step('Deep into AI');
  road(3, 4);
  d.group(() => {
    const { x, y } = STOPS[4];
    d.circle(x, y, 38, { pen: 'orange', fill: 'orange' });
    for (const [dx, dy] of [
      [-9, -8],
      [-9, 8],
    ])
      d.line(x + dx, y + dy, x + 9, y, { pen: 'orange', single: true });
    d.dot(x - 9, y - 8, 7, { pen: 'orange' });
    d.dot(x - 9, y + 8, 7, { pen: 'orange' });
    d.dot(x + 9, y, 7, { pen: 'orange' });
  });
  label(4, 'deep into AI,\nnow Sr. SWE (AI)', 'orange');

  d.step('So I drew Napkin');
  road(4, 5, 'ink');
  d.group(() => {
    const { x, y } = STOPS[5];
    d.poly(
      [
        [x - 24, y - 22],
        [x + 22, y - 20],
        [x + 22, y + 8],
        [x + 8, y + 22],
        [x - 22, y + 20],
      ],
      { pen: 'ink', fill: 'paper', closed: true, thick: true },
    );
    d.curve(
      [
        [x - 14, y + 2],
        [x - 6, y - 8],
        [x + 2, y + 4],
        [x + 12, y - 6],
      ],
      { pen: 'blue', thick: true, single: true },
    );
  });
  label(5, 'so I drew\nNapkin', 'ink');
};
