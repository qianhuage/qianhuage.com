const mathStart = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">';
const thetaA = '<msub><mi>θ</mi><mi>A</mi></msub>';
const thetaB = '<msub><mi>θ</mi><mi>B</mi></msub>';
const responseB = '<msubsup><mi>θ</mi><mi>B</mi><mo>*</mo></msubsup>';
const lossA = '<msub><mi>L</mi><mi>A</mi></msub>';
const lossB = '<msub><mi>L</mi><mi>B</mi></msub>';
const gradA = '<msub><mo>∇</mo><mi>A</mi></msub>';
const gradB = '<msub><mo>∇</mo><mi>B</mi></msub>';

// Authored MathML stays separate from journal prose and renders without a library.
const equations = {
  'closest-approach': {
    label: 'For nonzero relative velocity: time to closest approach equals minus r dot v divided by v dot v. Closest separation equals the norm of r plus v times that time.',
    markup: `${mathStart}<mtable rowspacing="0.8em">
      <mtr><mtd><msup><mi>t</mi><mo>*</mo></msup><mo>=</mo><mo>−</mo><mfrac><mrow><mi mathvariant="bold">r</mi><mo>·</mo><mi mathvariant="bold">v</mi></mrow><msup><mrow><mo>‖</mo><mi mathvariant="bold">v</mi><mo>‖</mo></mrow><mn>2</mn></msup></mfrac></mtd></mtr>
      <mtr><mtd><msup><mi>d</mi><mo>*</mo></msup><mo>=</mo><mo>‖</mo><mi mathvariant="bold">r</mi><mo>+</mo><mi mathvariant="bold">v</mi><msup><mi>t</mi><mo>*</mo></msup><mo>‖</mo></mtd></mtr>
      </mtable></math>`,
  },
  'best-response': {
    label: 'B’s best response to theta A minimizes B’s loss over theta B, with theta A held fixed.',
    markup: `${mathStart}<mrow>${responseB}<mo>(</mo>${thetaA}<mo>)</mo><mo>=</mo><munder><mo>arg min</mo>${thetaB}</munder>${lossB}<mo>(</mo>${thetaB}<mo>,</mo>${thetaA}<mo>)</mo></mrow></math>`,
  },
  'total-response': {
    label: 'F is A’s loss evaluated at B’s best response. Its gradient is the direct gradient with respect to A, plus the transpose of B’s response Jacobian times A’s loss gradient with respect to B.',
    markup: `${mathStart}<mtable rowspacing="0.8em">
      <mtr><mtd><mi>F</mi><mo>(</mo>${thetaA}<mo>)</mo><mo>=</mo>${lossA}<mo>(</mo>${thetaA}<mo>,</mo>${responseB}<mo>(</mo>${thetaA}<mo>)</mo><mo>)</mo></mtd></mtr>
      <mtr><mtd><mo>∇</mo><mi>F</mi><mo>=</mo>${gradA}${lossA}<mo>+</mo><msup><mrow><mo>(</mo><mi mathvariant="normal">D</mi>${responseB}<mo>)</mo></mrow><mi mathvariant="normal">T</mi></msup>${gradB}${lossA}</mtd></mtr>
      </mtable></math>`,
  },
};

export function createJournalEquation(id) {
  if (!Object.hasOwn(equations, id)) return null;
  const equation = equations[id];
  const panel = document.createElement('div');
  panel.className = 'entry-equation';
  panel.setAttribute('role', 'math');
  panel.setAttribute('aria-label', equation.label);
  panel.innerHTML = equation.markup;
  return panel;
}
