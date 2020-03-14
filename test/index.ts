// Setup
import '../mock/window.ts';

// Tools
import tap from 'tap';
import { screen, getByTestId, getByText, getByDisplayValue, prettyDOM } from '@testing-library/dom';
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

  selected: string = '';
  multiSelected: string[] = ['JavaScript'];

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
          <option disabled value="">Please select one</option>
          <option>Dogs</option>
          <option>Cats</option>
        </select>

        <select data-testid="multi-select" data-model="multiSelected" multiple>
          <option>JavaScript</option>
          <option>TypeScript</option>
          <option>PureScript</option>
          <option>SvelteScript</option>
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
    t.equal(textInput.value, 'Another change', 'Changing bound property reflects to input value');

    t.end();
  });

  t.test(`bind class property to checkbox`, async t => {
    const checkbox = <HTMLInputElement>getByTestId(root, 'individual-checkbox');
    
    t.equal(component.isChecked, checkbox.checked, 'Checkbox should match initial value');
    
    await userEvent.click(checkbox);
    t.equal(component.isChecked, true, 'Clicking checkbox updates bound property');

    component.isChecked = false;
    t.equal(checkbox.checked, false, 'Changing bound property updates checkbox.checked');

    t.end();
  });

  t.test(`bind class property to multiple checkboxes`, async t => {
    await t.test('with array', async t => {
      const checkboxes = {
        brown: <HTMLInputElement>getByDisplayValue(root, 'Brown'),
        boring: <HTMLInputElement>getByDisplayValue(root, 'Boring')
      };

      t.equal(checkboxes.brown.checked, true, 'Brown checkbox should start checked');
      t.equal(checkboxes.boring.checked, false, 'Boring checkbox should start unchecked');

      await userEvent.click(checkboxes.boring);
      t.includesOnly(component.checkedNames, ['Brown', 'Boring'], 'should add Boring to bound Array when checked');

      await userEvent.click(checkboxes.brown);
      t.includesOnly(component.checkedNames, ['Boring'], 'should remove Brown from bound Array when unchecked');

      component.checkedNames = [];
      t.equal(checkboxes.boring.checked, false, 'should uncheck Boring when removed from bound Array');

      component.checkedNames = ['Brown', 'Boring'];
      t.equal(checkboxes.brown.checked, true, 'should check Brown checkbox when bound Array contains Brown');
      t.equal(checkboxes.boring.checked, true, 'should check Boring checkbox when bound Array contains Boring');

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
      t.includesOnly(component.uniqueNames, ['Joe', 'Chris'], 'should add Chris to bound Set when checked');

      await userEvent.click(checkboxes.joe);
      t.includesOnly(component.uniqueNames, ['Chris'], 'should remove Joe from bound Set when unchecked');

      component.uniqueNames.clear();
      t.equal(checkboxes.joe.checked, false, 'should uncheck all bound checkboxes on Set#clear');
      t.equal(checkboxes.chris.checked, false, 'should uncheck all bound checkboxes on Set#clear');

      component.uniqueNames.add('Joe');
      t.equal(checkboxes.joe.checked, true, 'should check Joe when using Set#add');

      component.uniqueNames.delete('Joe');
      t.equal(checkboxes.joe.checked, false, 'should uncheck Joe when using Set#delete');

      t.end();
    });
  });

  t.test(`bind class property to radio inputs`, async t => {
    const radios = {
      one: <HTMLInputElement>getByDisplayValue(root, 'One'),
      two: <HTMLInputElement>getByDisplayValue(root, 'Two')
    };

    t.equal(radios.one.checked, true, 'One should start selected');

    await userEvent.click(radios.two);
    t.equal(component.radioPicked, 'Two', 'Two should be selected after clicking on it');

    component.radioPicked = 'One';
    t.equal(radios.one.checked, true, 'should select One when changing radioPicked to One');

    t.end();
  });

  t.test(`bind class property to selected options in <select>`, async t => {
    const select = <HTMLSelectElement>getByTestId(root, 'select');
    const options = {
      default: <HTMLOptionElement>getByText(root, 'Please select one'),
      dogs: <HTMLOptionElement>getByText(root, 'Dogs'),
      cats: <HTMLOptionElement>getByText(root, 'Cats')
    };

    t.equal(select.value, '', '<select> value should be an empty string on initialization');
    t.equal(options.default.selected, true, 'default <option> should be selected');

    await userEvent.selectOptions(select, 'Dogs');
    t.equal(component.selected, 'Dogs', 'selecting dogs should update bound property');
    
    component.selected = 'Cats';
    t.equal(select.value, 'Cats', 'changing bound property should update <select> value');

    t.end();
  });

  t.test(`bind class property to multiple selected options in <select multiple>`, async t => { 
    const multipleSelect = <HTMLSelectElement>getByTestId(root, 'multi-select');
    const options = {
      js: <HTMLOptionElement>getByText(root, 'JavaScript'),
      ts: <HTMLOptionElement>getByText(root, 'TypeScript'),
      ps: <HTMLOptionElement>getByText(root, 'PureScript'),
      ss: <HTMLOptionElement>getByText(root, 'SvelteScript')
    };

    t.equal(options.js.selected, true, 'values in array start out selected');

    await userEvent.selectOptions(multipleSelect, 'TypeScript');
    t.includesOnly(component.multiSelected, ['JavaScript', 'TypeScript'], 'should add TypeScript to bound Array when selected');

    component.multiSelected = ['PureScript', 'SvelteScript'];
    t.includesOnly(multipleSelect.selectedOptions, [options.ps, options.ss], 'updating bound Array with multiple items should select those items');

    component.multiSelected = [];
    t.equal(multipleSelect.selectedOptions.length, 0, 'emptying the bound Array should deselect all options');

    await userEvent.selectOptions(multipleSelect, ['JavaScript', 'PureScript', 'SvelteScript']);
    t.includesOnly(component.multiSelected, ['JavaScript', 'PureScript', 'SvelteScript'], 'selecting multiple options should populate the bound Array');

    /* TODO: Add <select multiple> with Set */

    t.end();
  });

  t.end();
});

/* TODO: one way data binding tests */
