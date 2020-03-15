import valoo from 'valoo';

const customElements = new WeakMap();

enum BindingType {
  Model,
  Bind,
  Event
};

function handleAttribute(
  customElement: any,
  type: BindingType,
  // data-model/data-bind - element's property like `value` or `checked`
  // data-on - event to bind to like `click` or `mousemove`
  left: string,
  // data-model/data-bind - customElement's property to bind to
  // data-on - customElement's method to bind to or a function
  right: string
) {
  switch (type) {
    case BindingType.Model:
      
      break;
    case BindingType.Bind:
      break;
    case BindingType.Event:
      break;
    default:
      throw new Error(`${type} is an invalid BindingType`);
  }
}

function getBindableProperty(element: any) {
  if (element instanceof HTMLInputElement) {
    switch (element.type) {
      case 'file':
        return 'files';
      case 'radio':
      case 'checkbox':
        return 'checked';
      case 'week':
      case 'month':
      case 'date':
      case 'datetime':
      case 'datetime-local':
        return 'valueAsDate';
      case 'range':
      case 'number':
        return 'valueAsNumber';
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
        return 'value';
      case 'button':
      case 'reset':
      case 'submit':
      case 'image':
      default:
        throw new Error(`<input type="${element.type}"> does not support data-model.`);
    }
  } else if (element instanceof HTMLTextAreaElement) {
    return 'value';
  }
}

function handleElement(customElement: any, element: any) {
  for (const attribute in element.dataset) {
    if (attribute === 'model') {
      return handleAttribute(customElement, BindingType.Model, getBindableProperty(element), element.dataset.model);
    } else if (attribute.startsWith('bind:')) {
      const match = attribute.match(/^bind:(.+)$/);
      if (!match) {
        throw new Error(`The dataset attribute "${attribute}" is missing the attribute/property name to bind to.`);
      }

      const elementProperty = match[1];
      return handleAttribute(
        customElement,
        BindingType.Bind,
        elementProperty,
        element.dataset[attribute]
      );
    } else if (attribute.startsWith('on:')) {
      const match = attribute.match(/^bind:(.+)$/);
      if (!match) {
        throw new Error(`The dataset attribute "${attribute}" is missing the event to bind to.`);
      }

      const elementProperty = match[1];
      return handleAttribute(
        customElement,
        BindingType.Event,
        elementProperty,
        element.dataset[attribute]
      );
    }
  }
}

type bindOptions = {
  root: ShadowRoot
};
export function bind(customElement: any, { root }: bindOptions) {
  customElements.set(customElement, {
    elements: new WeakMap(),
    root
  })

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    
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
