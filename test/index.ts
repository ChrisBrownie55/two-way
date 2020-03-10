import tap from 'tap';
import '../mock/window.ts';
import { bind } from '../index';

class TestElement extends HTMLElement {
  shadowRoot: ShadowRoot;
  render: any;
 
  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    
    if (typeof this.render === 'function') {
      this.render();
    }
  }
}

class TestChild extends HTMLElement {
  value = '';
}

@bind
class TestBidirectional extends TestElement {
  value: string = 'initial value';

  isChecked: boolean = false;

  checkedNames: string[] = ['Brown'];
  uniqueNames: Set<string> = new Set('Joe');
  
  radioPicked: string = 'One';

  selected: string = 'A';
  multiSelected: string[] = ['A'];
 
  render = () => {
    this.shadowRoot.innerHTML = `
      <!-- Text Input (value property)
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

      <select data-testid="multi-select" data-model="multiSelected">
        <option>A</option>
        <option>B</option>
      </select>
    `;
  }
}
customElements.define('test-bidirectional', TestBidirectional);

@bind
class TestUnidirectional extends TestElement {
  isChecked = false;

  count = 0;
  handleClick = () => ++this.count;

  render = () => {
    this.shadowRoot.innerHTML = `
      <input data-testid="unidirectional" data-bind:checked="isChecked">
      <button data-testid="unidirectional-reverse" data-on:click="handleClick">Increment</button>
    `;
  }
}
customElements.define('test-unidirectional', TestUnidirectional);

tap.test(`bind class property to a dom element's attributes/properties`, t => {
  // updates dom attributes
  // updates dom properties
  // only updates dom attributes/properties that are bound with `data-model`
  t.end();
});

  // updates class properties when dom event fires
    // value
    // checked
    // custom
