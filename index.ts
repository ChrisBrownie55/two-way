import valoo from 'valoo';

const customElements = new WeakMap();

enum BindingType {
  Model,
  Bind,
  Event
};

type attributeData = {
  type: BindingType.Model,
  viewProp: string,
  viewEvent: string,
  modelProp: string,
} | {
  type: BindingType.Bind,
  viewProp: string,
  modelProp: string
} | {
  type: BindingType.Event,
  viewEvent: string,
  eventHandler: string
};


function handleAttribute(
  customElement: any,
  element: any,
  { type, viewProp, viewEvent, eventHandler, modelProp }: attributeData
) {
  const data = customElements.get(customElement);
  const bindings = data.elements.get(element) || {};

  const id = `${type}:${viewProp || viewEvent}=${modelProp || eventHandler}`;
  if (!bindings.hasOwnProperty(id)) {
    bindings[id] = valoo();
  }

  switch (type) {
    case BindingType.Model: {
      const isProp = element.hasOwnProperty(viewProp);
      const isAttribute = element.hasAttribute(viewProp);

      let initialValue;
      if (customElement.hasOwnProperty(modelProp)) {
        initialValue = customElement[modelProp];
      } else if (isProp) {
        initialValue = element[viewProp];
      } else if (isAttribute) {
        initialValue = element.getAttribute(viewProp);
      } else {
        initialValue = '';
      }

      const updateView = isProp
        ? v => (element[viewProp] = v)
        : v => element.setAttribute(viewProp, v);

      Object.defineProperty(customElement, modelProp, {
        get: bindings[id],
        set: bindings[id]
      });
      const off = bindings[id].on(updateView);
      break;
    }

    case BindingType.Bind: {
      break;
    }

    case BindingType.Event: {
      break;
    }

    default:
      throw new Error(`${type} is an invalid BindingType`);
  }
}

function getBindableProperty(element: any) {
  if (element instanceof HTMLInputElement) {
    switch (element.type) {
      case 'file':
        return { property: 'files', event: 'change' };
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
      default:
        throw new Error(`<input type="${element.type}"> does not support data-model.`);
    }
  } else if (element instanceof HTMLTextAreaElement) {
    return { property: 'value', event: 'input' };
  } else if (customElements.get(element.tagName.toLowerCase())) {
    return { property: 'value', event: 'change' };
  } else {
    throw new Error(`<${element.tagName.toLowerCase()}> does not support data-model.`);
  }
}

function handleElement(customElement: any, element: any) {
  for (const attribute in element.dataset) {
    if (attribute === 'model') {
      const { property: viewProp, event: viewEvent } = getBindableProperty(element);

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
