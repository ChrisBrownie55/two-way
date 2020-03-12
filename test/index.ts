// Setup
import '../mock/window.ts';

// Tools
import tap from 'tap';
import { screen, getByTestId, prettyDOM } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Setup
import '../mock/window.ts';

// Code being tested
import { Bind, bind } from '../index';

@Bind
class TestBidirectional extends HTMLElement {
  value: string = 'initial value';

  isChecked: boolean = false;

  checkedNames: string[] = ['Brown'];
  uniqueNames: Set<string> = new Set('Joe');
  
  radioPicked: string = 'One';

  selected: string = 'A';
  multiSelected: string[] = ['A'];

  #shadowRoot: ShadowRoot;
  get shadowRoot() { return this.#shadowRoot; } // required for decorator
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });   
    this.render();
  }
 
  render = () => {
    this.#shadowRoot.innerHTML = `
      <div>
        <!-- Text Input (value property) -->
        <input data-testid="text-input" type="text" data-model="value">
        
        <!-- Individual Checkbox (checked property) -->
        <input data-testid="individual-checkbox" type="checkbox" data-model="isChecked">
        
        <!-- Multiple Checkboxes (checked property filtered into & out of Array) -->
        <input data-testid="checkbox-A1" type="checkbox" value="Brown" data-model="checkedNames">
        <input data-testid="checkbox-A2" type="checkbox" value="Boring" data-model="checkedNames">

        <!-- Multiple Checkboxes (checked property added to or removed from Set) -->
        <input data-testid="checkbox-S1" type="checkbox" value="Joe" data-model="uniqueNames">
        <input data-testid="checkbox-S2" type="checkbox" value="Chris" data-model="uniqueNames">

        <!-- Radio Inputs (last one selected is set to active, all other are -->
        <input data-testid="radio-1" type="radio" value="One" data-model="radioPicked">
        <input data-testid="radio-2" type="radio" value="Two" data-model="radioPicked">

        <select data-testid="select" data-model="selected">
          <option>A</option>
          <option>B</option>
        </select>

        <select data-testid="multi-select" data-model="multiSelected" multiple>
          <option>A</option>
          <option>B</option>
        </select>
      </div>
    `;
  }
}
customElements.define('test-bidirectional', TestBidirectional);

class TestUnidirectional extends HTMLElement {
  isChecked = false;

  count = 0;
  handleClick = () => ++this.count;

  #shadowRoot: ShadowRoot;
  get shadowRoot() { return this.#shadowRoot; } // for testing only
  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({ mode: 'open' });
    bind(this, { root: this.#shadowRoot });

    this.render();
  }

  render = () => {
    this.#shadowRoot.innerHTML = `
      <div>
        <input data-testid="unidirectional" data-bind:checked="isChecked">
        <button data-testid="unidirectional-reverse" data-on:click="handleClick">Increment</button>
      </div>
    `;
  }
}
customElements.define('test-unidirectional', TestUnidirectional);

tap.test(`bind class property to a dom element's attributes/properties`, async t => {
  // updates dom properties
  document.body.innerHTML = `
    <test-bidirectional data-testid="custom-element"></test-bidirectional>
  `;

  const root = <HTMLElement>screen.getByTestId('custom-element').shadowRoot.children[0];
  const textInput = <HTMLInputElement>getByTestId(root, 'text-input');

  t.equal(textInput.value, '');
  await userEvent.type(textInput, 'Hello World!');
  t.equal(textInput.value, 'Hello World!');

  const individualCheckbox = getByTestId(root, 'individual-checkbox');
  const checkboxes = {
    array: [getByTestId(root, 'checkbox-A1'), getByTestId(root, 'checkbox-A2')],
    set: [getByTestId(root, 'checkbox-S1'), getByTestId(root, 'checkbox-S2')]
  };
  const radios = [getByTestId(root, 'radio-1'), getByTestId(root, 'radio-2')];
  const select = getByTestId(root, 'select');
  const multipleSelect = getByTestId(root, 'multi-select');

  // only updates dom attributes/properties that are bound with `data-model`
  t.end();
});

  // updates class properties when dom event fires
    // value
    // checked
    // custom
