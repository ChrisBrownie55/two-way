// Setup
import '../mock/window.ts';

// Tools
import tap from 'tap';
import { screen, getByTestId, getByDisplayValue, prettyDOM } from '@testing-library/dom';
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

/* START OF TESTS */

tap.Test.prototype.addAssert('includesOnly', 2, function (iterable, items, messages=items.map(item => `should include ${item}`)) {
  const set = new Set(iterable);

  const multipleMessages = Array.isArray(messages);

  items.forEach((item, index) => {
    const hasItem = set.delete(item);
    this.equal(hasItem, true, multipleMessages ? messages[index] : messages);
  });
  this.equal(set.size, 0, multipleMessages ? `shouldn't include more than ${items} in ${iterable}` : messages);
});

tap.test('bi-directional', t => {
  document.body.innerHTML = `
    <test-bidirectional data-testid="custom-element"></test-bidirectional>
  `;

  const component = <TestBidirectional>screen.getByTestId('custom-element');
  const root = <HTMLElement>component.shadowRoot.children[0];

  t.test(`bind class property to input's value`, async t => {
    const textInput = <HTMLInputElement>getByTestId(root, 'text-input');

    t.equal(component.value, textInput.value, 'Text input should match initial value on bound property');

    await userEvent.type(textInput, 'Hello World!');
    t.equal(component.value, 'Hello World!', 'Typing in input updates bound property');

    component.value = 'Another change';
    t.equal(textInput.value, 'Another change', 'Changing value on property reflects to input');

    t.end();
  });

  t.test(`bind class property to checkbox`, async t => {
    const checkbox = <HTMLInputElement>getByTestId(root, 'individual-checkbox');
    
    t.equal(component.isChecked, checkbox.checked, 'Checkbox should match initial value');
    
    await userEvent.click(checkbox);
    t.equal(component.isChecked, true, 'Clicking checkbox updates bound property');

    component.isChecked = false;
    t.equal(checkbox.checked, false, 'Changing property updates DOM property');

    t.end();
  });

  t.test(`bind class property to multiple checkboxes`, async t => {
    await t.test('with array', async t => {
      const checkboxes = {
        brown: <HTMLInputElement>getByDisplayValue(root, 'Brown'),
        boring: <HTMLInputElement>getByDisplayValue(root, 'Boring')
      };

      t.equal(checkboxes.brown.checked, true, 'Brown should start checked');
      t.equal(checkboxes.boring.checked, false, 'Boring should start unchecked');
      
      await userEvent.click(checkboxes.boring);
      t.includesOnly(component.checkedNames, ['Brown', 'Boring'], 'should add Boring when checked');
          
      await userEvent.click(checkboxes.brown);
      t.includesOnly(component.checkedNames, ['Boring'], 'should remove Brown when unchecked');

      component.checkedNames = [];
      t.equal(checkboxes.boring.checked, false, 'should uncheck Boring when removed');

      component.checkedNames = ['Brown', 'Boring'];
      t.equal(checkboxes.brown.checked, true, 'should update Brown to true');
      t.equal(checkboxes.boring.checked, true, 'should update Boring to true');

      t.end();
    });

    await t.test('with set', async t => {
      const checkboxes = {
        joe: <HTMLInputElement>getByDisplayValue(root, 'Joe'),
        chris: <HTMLInputElement>getByDisplayValue(root, 'Chris')
      };

      t.equal(checkboxes.joe.checked, true, 'Joe should start checked');
      t.equal(checkboxes.chris.checked, false, 'Chris should start unchecked');

      await userEvent.click(checkboxes.chris);
      t.includesOnly(component.uniqueNames, ['Joe', 'Chris'], 'should add Chris on check');

      await userEvent.click(checkboxes.joe);
      t.includesOnly(component.uniqueNames, ['Chris'], 'should remove Joe on uncheck');

      component.uniqueNames.clear();
      t.equal(checkboxes.joe.checked, false, 'should uncheck all bound checkboxes on .clear');
      t.equal(checkboxes.chris.checked, false, 'should uncheck all bound checkboxes on .clear');

      component.uniqueNames.add('Joe');
      t.equal(checkboxes.joe.checked, true, 'should check Joe when using .add');
      
      component.uniqueNames.delete('Joe');
      t.equal(checkboxes.joe.checked, false, 'should uncheck Joe when using .delete');

      t.end();
    });
  });

  t.test(`bind class property to radio inputs`, async t => {
    

    t.end();
  });

  t.test(`bind class property to selected options in <select>`, async t => {
    const select = getByTestId(root, 'select');

    t.end();
  });

  t.test(`bind class property to multiple selected options in <select multiple>`, async t => { 
    const multipleSelect = getByTestId(root, 'multi-select');

    t.end();
  });

  t.end();
});

/* TODO: one way data binding tests */
