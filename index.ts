import valoo from 'valoo';

const customElements = new WeakMap();

enum BindingType {
  Model,
  Bind,
  Event
};

function handleAttribute(
  target: any,
  type: BindingType,
  elementProperty: string,
  targetProperty: string
) {
  
}

function getBindableProperty(element: any) {
  if (element instanceof HTMLInputElement) {
    switch (element.type) {
      case 'button':
      case 'reset':
      case 'submit':
      case 'image':
        throw new TypeError
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
      default:
        return value;
    }
  } else if (element instanceof HTMLTextAreaElement) {
    return 'value';
  }
}

function handleElement(target: any, element: any) {
  for (const attribute in element.datset) {
    if (attribute === 'model') {
      
      handleAttribute(target, BindingType.Model, element.dataset.model);
    } else if (attribute.startsWith('bind:')) {
      
    } else if (attribute.startsWith('on:')) {

    }
  }
}

type bindOptions = {
  root: ShadowRoot
};
export function bind(target: any, { root }: bindOptions) {
  customElements.set(target, {
    elements: new WeakMap(),
    root
  })

  const observer = new Observer((mutations: MutationRecord[]) => {
    
  });
  observer.observe(root, { attributes: true, childList: true, subtree: true });
}

export function Bind(target: any) {
  return target;
}
