import type { VNode, FunctionalComponent } from 'preact';
import { Fragment, cloneElement, createElement, toChildArray } from 'preact';
import { useRef } from 'preact/hooks';

export type TransitionGroupProps = {
  children: any;
  appear?: boolean;
  enter?: boolean;
  exit?: boolean;
  duration?: number;
};

interface VisibleChild {
  visibleChild: VNode<any>;
  removeTimeout: number;
}

const getChildProp = (child, propName, defaultValue) => {
  const { [propName]: prop = defaultValue } = child.props;
  return prop;
};

const TransitionGroup: FunctionalComponent<TransitionGroupProps> = (props) => {
  const { children, appear = false, enter = true, exit = true, duration = 500 } = props;

  const derivedChildren = toChildArray(children);
  const firstRenderRef = useRef(true);
  const prevVisibleChildrenRef = useRef<VisibleChild[]>([]);
  const nextVisibleChildren: VisibleChild[] = [];
  const nextChildrenKeys = {};
  const nextChildren: VNode<any>[] = [];

  const addVisibleChild = (child, removeTimeout) => {
    // No child to add
    if (!child) {
      return;
    }

    // Create child clone with new props
    const visibleChild = cloneElement(child, {
      enter,
      exit,
      duration,
      ...child.props,
      in: !removeTimeout,
      appear: firstRenderRef.current ? getChildProp(child, 'appear', appear) : getChildProp(child, 'enter', enter),
    });

    // Save child clone and timeout
    nextVisibleChildren.push({ visibleChild, removeTimeout });
    nextChildrenKeys[child.key] = true;
    nextChildren.push(visibleChild);
  };

  const makeRemoveTimeout = (child) =>
    setTimeout(
      () => {
        const { current: prevVisibleChildren } = prevVisibleChildrenRef;
        const indexToDelete = prevVisibleChildren.findIndex(({ visibleChild }) => visibleChild.key === child.key);
        if (indexToDelete > -1) {
          prevVisibleChildren.splice(indexToDelete, 1);
        }
      },
      getChildProp(child, 'duration', duration)
    );

  let lastAddedChildIndex = 0;

  // Check previous visible children first
  prevVisibleChildrenRef.current.forEach(({ visibleChild, removeTimeout }) => {
    // Key is required for proper work
    const { key } = visibleChild;
    // Search visible child in derived children
    const foundIndex = derivedChildren.findIndex((child) => (child as VNode<any>).key === key);
    // Visible child not found, start to remove it
    if (foundIndex < 0) {
      // Visible child already has remove timeout what means child exiting atm
      if (removeTimeout) {
        addVisibleChild(visibleChild, removeTimeout);
      } else {
        // Start remove timeout but render this child
        const shouldAddTimeout = exit && visibleChild.props.exit !== false;
        if (shouldAddTimeout) {
          addVisibleChild(visibleChild, makeRemoveTimeout(visibleChild));
        }
      }
    } else {
      // Visible child found in derived children, remove exiting timeout if it exist
      if (removeTimeout) {
        clearTimeout(removeTimeout);
      }
      // Add this child and all previous children
      for (let i = lastAddedChildIndex; i <= foundIndex; i++) {
        addVisibleChild(derivedChildren[i], null);
      }
    }
    // Save index to loop only through the remaining children
    lastAddedChildIndex = Math.max(lastAddedChildIndex, foundIndex + 1);
  });

  // Add remaining children
  for (let i = lastAddedChildIndex; i < derivedChildren.length; i++) {
    addVisibleChild(derivedChildren[i], null);
  }

  // Save visible children
  prevVisibleChildrenRef.current = nextVisibleChildren;
  firstRenderRef.current = false;
  return createElement(Fragment, {}, ...nextChildren);
};

export default TransitionGroup;
