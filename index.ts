import valoo from 'valoo';

const customElements = new WeakMap();

enum BindingType {
  Model,
  Bind,
  Event
};

const isModelData = (data: attributeData): data is IModelData => data.type === BindingType.Model;
interface IModelData {
  type: BindingType.Model;
  viewProp: string;
  viewEvent: string;
  modelProp: string;
}

const isBindData = (data: attributeData): data is IBindData => data.type === BindingType.Bind;
interface IBindData {
  type: BindingType.Bind;
  viewProp: string;
  modelProp: string;
}

const isEventData = (data: attributeData): data is IEventData => data.type === BindingType.Event;
interface IEventData {
  type: BindingType.Event;
  viewEvent: string;
  eventHandler: string;
}

type attributeData = IModelData | IBindData | IEventData;


function handleAttribute(
  customElement: any,
  element: any,
  attributeData: attributeData
) {
  const data = customElements.get(customElement);
  const bindings = data.elements.get(element) || {};

  let id;
  if (isModelData(attributeData) || isBindData(attributeData)) {
    id = `${attributeData.type}:${attributeData.viewProp}=${attributeData.modelProp}`;
  } else {
    id = `${attributeData.type}:${attributeData.viewEvent}=${attributeData.eventHandler}`;
  }

  if (!bindings.hasOwnProperty(id)) {
    bindings[id] = valoo(null);
  }

  switch (attributeData.type) {
    case BindingType.Model: {
      const { viewProp, viewEvent, modelProp } = attributeData;
      const isProp = element.hasOwnProperty(viewProp);
      const isAttribute = element.hasAttribute(viewProp);

      let initialValue;
      if (customElement.hasOwnProperty(modelProp)) {
        console.log('initial value from customElement model property');
        initialValue = customElement[modelProp];
      } else if (isProp) {
        console.log('initial value from property on element');
        initialValue = element[viewProp];
      } else if (isAttribute) {
        console.log('initial value from attribute on element');
        initialValue = element.getAttribute(viewProp);
      } else {
        console.log('initial value not found');
        initialValue = '';
      }
      console.log('initial value:', initialValue);

      console.log('setter and getter set');
      Object.defineProperty(customElement, modelProp, {
        get: bindings[id],
        set: bindings[id]
      });

      const updateView = isProp
        ? v => {
          console.log(`${id} :before-change:`, element[viewProp]);
          element[viewProp] = v;
          console.log(`${id} :after-change:`, element[viewProp]);
        } : v => {
          console.log(`${id} :before-change:`, element.getAttribute(viewProp));
          element.setAttribute(viewProp, v);
          console.log(`${id} :after-change:`, element.getAttribute(viewProp));
        };

      bindings[id].on(updateView);
      bindings[id].on(value => {
        console.log(`New value for ${id}:`, value);
      });

      // set the starting value on model and view
      bindings[id](initialValue);
      break;
    }

    case BindingType.Bind: {
      break;
    }

    case BindingType.Event: {
      break;
    }

    default:
      throw new Error(`${JSON.stringify(attributeData)} has an invalid/non-existent BindingType`);
  }
}

function getBindableProperty(element: any) {
  if (element instanceof HTMLInputElement) {
    switch (element.type) {
      case 'radio':
      case 'checkbox':
        return { property: 'checked', event: 'change' };
      case 'week':
      case 'month':
      case 'date':
      case 'datetime':
      case 'datetime-local':
        return { property: 'valueAsDate', event: 'change' };
      case 'range':
      case 'number':
        return { property: 'valueAsNumber', event: 'input' };
      case 'search':
      case 'email':
      case 'color':
      case 'password':
      case 'tel':
      case 'time':
      case 'url':
      case 'text':
      case 'hidden':
      case '':
        return { property: 'value', event: 'input' };
      case 'button':
      case 'reset':
      case 'submit':
      case 'image':
      case 'file':
      default:
        throw new Error(`<input type="${element.type}"> does not support data-model.`);
    }
  } else if (element instanceof HTMLTextAreaElement) {
    return { property: 'value', event: 'input' };
  } else if (element instanceof HTMLSelectElement) {
    return { property: 'selectedIndex', event: 'change' };
  } else if (customElements.get(element.tagName.toLowerCase())) {
    return { property: 'value', event: 'change' };
  } else {
    throw new Error(`<${element.tagName.toLowerCase()}> does not support data-model.`);
  }
}

function handleAddElement(customElement: any, element: any) {
  console.log('handling node:', element);
  for (const attribute in element.dataset) {
    if (attribute === 'model') {
      const { property: viewProp, event: viewEvent } = getBindableProperty(element);
      console.log('found data-model prop:', viewProp, 'with an event of', viewEvent);

      return handleAttribute(
        customElement,
        element,
        {
          type: BindingType.Model,
          viewProp,
          viewEvent,
          modelProp: element.dataset.model
        }
      );
    } else if (attribute.startsWith('bind:')) {
      const match = attribute.match(/^bind:(.+)$/);
      if (!match) {
        throw new Error(`The dataset attribute "${attribute}" is missing the view attribute/property name to bind to.`);
      }

      const viewProp = match[1];
      return handleAttribute(
        customElement,
        element,
        {
          type: BindingType.Bind,
          viewProp,
          modelProp: element.dataset[attribute]
        }
      );
    } else if (attribute.startsWith('on:')) {
      const match = attribute.match(/^bind:(.+)$/);
      if (!match) {
        throw new Error(`The dataset attribute "${attribute}" is missing the view event to bind to.`);
      }

      const viewEvent = match[1];
      return handleAttribute(
        customElement,
        element,
        {
          type: BindingType.Event,
          viewEvent,
          eventHandler: element.dataset[attribute]
        }
      );
    }
  }
}

function handleRemoveElement(customElement, element) {
  for (const attribute in element.dataset) {
    if (attribute === 'model') {
      
    } else if (attribute.startsWith('bind:')) {

    } else if (attribute.startsWith('on:')) {
      
    }
  }
}

function handleNodesRecursively(node, callback) {
  callback(node);
  node.childNodes.forEach(callback);
}

type bindOptions = {
  root: ShadowRoot
};
export function bind(customElement: any, { root }: bindOptions) {
  customElements.set(customElement, {
    elements: new WeakMap(),
    root
  });

  console.log('Binding a custom-element');

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    console.log('Observed changes');
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          console.log('A node was added!');
          handleNodesRecursively(node, el => handleAddElement(customElement, el));
        });
        mutation.removedNodes.forEach(node => {
          handleNodesRecursively(node, el => handleRemoveElement(customElement, el));
        });
      } else if (mutation.type === 'attributes') {

      }
    }
  });
  observer.observe(root, { attributes: true, childList: true, subtree: true });
}

export function Bind(target: any): any {
  return class extends target {
    constructor() {
      super();
      bind(this, { root: this.shadowRoot });
    }
  }
}
