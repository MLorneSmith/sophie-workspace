The `<DragOverlay>` component provides a way to render a draggable overlay that is removed from the normal document flow and is positioned relative to the viewport.

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPLpbsfQHd26rAwapkQ%252F-MPPbfi6HZoVlf2b3u6E%252FDragOverlay.png%3Falt%3Dmedia%26token%3D4db2d3e3-bcdd-4e84-97d7-1222bfcc18cd&width=768&dpr=4&quality=100&sign=bb138a60&sv=2)

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#when-should-i-use-a-drag-overlay)    When should I use a drag overlay?

Depending on your use-case, you may want to use a drag overlay rather than transforming the original draggable source element that is connected to the [`useDraggable`](https://docs.dndkit.com/api-documentation/draggable/usedraggable) hook:

- If you'd like to **show a preview** of where the draggable source will be when dropped, you can update the position of the draggable source while dragging without affecting the drag overlay.

- If your item needs to **move from one container to another while dragging**, we strongly recommend you use the `<DragOverlay>` component so the draggable item can unmount from its original container while dragging and mount back into a different container without affecting the drag overlay.

- If your draggable item is within a **scrollable container,** we also recommend you use a `<DragOverlay>`, otherwise you'll need to set the draggable element to `position: fixed` yourself so the item isn't restricted to the overflow and stacking context of its scroll container, and can move without being affected by the scroll position of its container.

- If your `useDraggable` items are within a **virtualized list**, you will absolutely want to use a drag overlay, since the original drag source can unmount while dragging as the virtualized container is scrolled.

- If you want **smooth drop animations** without the effort of building them yourself.

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#usage)    Usage

You may render any valid JSX within the children of the `<DragOverlay>`.

The `<DragOverlay>` component should **remain mounted at all times** so that it can perform the drop animation. If you conditionally render the `<DragOverlay>` component, drop animations will not work.

As a rule of thumb, try to render the `<DragOverlay>` outside of your draggable components, and follow the [presentational component pattern](https://docs.dndkit.com/api-documentation/draggable/drag-overlay#presentational-components) to maintain a good separation of concerns.

Instead, you should conditionally render the children passed to the `<DragOverlay>`:

App.jsxDraggable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext, DragOverlay} from '@dnd-kit/core';

import {Draggable} from './Draggable';

/* The implementation details of <Item> and <ScrollableList> are not
 * relevant for this example and are therefore omitted. */

function App() {
  const [items] = useState(['1', '2', '3', '4', '5']);
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollableList>
        {items.map(id =>
          <Draggable key={id} id={id}>
            <Item value={`Item ${id}`} />
          </Draggable>
        )}
      </ScrollableList>

      <DragOverlay>
        {activeId ? (
          <Item value={`Item ${activeId}`} />
        ): null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd() {
    setActiveId(null);
  }
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

function Draggable(props) {
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <li ref={setNodeRef} {...listeners} {...attributes}>
      {props.children}
    </li>
  );
}
```

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#patterns)    Patterns

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#presentational-components)    Presentational components

While this is an optional pattern, we recommend that the components you intend to make draggable be [presentational components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) that are decoupled from `@dnd-kit`.

Using this pattern, create a presentational version of your component that you intend on rendering within the drag overlay, and another version that is draggable and renders the presentational component.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#wrapper-nodes)    Wrapper nodes

As you may have noticed from the example above, we can create small abstract components that render a wrapper node and make any children rendered within draggable:

Draggable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

function Draggable(props) {
  const Element = props.element || 'div';
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <Element ref={setNodeRef} {...listeners} {...attributes}>
      {props.children}
    </Element>
  );
}
```

Using this pattern, we can then render our presentational components within `<Draggable>` and within `<DragOverlay>`:

App.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext, DragOverlay} from '@dnd-kit/core';

import {Draggable} from './Draggable';

/* The implementation details of <Item> is not
 * relevant for this example and therefore omitted. */

function App() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Draggable id="my-draggable-element">
        <Item />
      </Draggable>

      <DragOverlay>
        {isDragging ? (
          <Item />
        ): null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart() {
    setIsDragging(true);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }
}
```

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#ref-forwarding)    Ref forwarding

Use the [ref forwarding pattern](https://reactjs.org/docs/forwarding-refs.html) to connect your presentational components to the `useDraggable` hook:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {forwardRef} from 'react';

const Item = forwardRef(({children, ...props}, ref) => {
  return (
    <li {...props} ref={ref}>{children}</li>
  )
});
```

This way, you can create two versions of your component, one that is presentational, and one that is draggable and renders the presentational component **without the need for additional wrapper elements**:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

function DraggableItem(props) {
  const {attributes, listeners, setNodeRef} = useDraggable({
    id: props.id,
  });

  return (
    <Item ref={setNodeRef} {...attributes} {...listeners}>
      {value}
    </Item>
  )
});
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#portals)    Portals

The drag overlay is not rendered in a portal by default. Rather, it is rendered in the container where it is rendered.

If you would like to render the `<DragOverlay>` in a different container than where it is rendered, import the [`createPortal`](https://reactjs.org/docs/portals.html) helper from `react-dom`:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {DndContext, DragOverlay} from '@dnd-kit/core';

function App() {
  return (
    <DndContext>
      {createPortal(
        <DragOverlay>{/* ... */}</DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
```

## [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#props)    Props

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
{
  adjustScale?: boolean;
  children?: React.ReactNode;
  className?: string;
  dropAnimation?: DropAnimation | null;
  style?: React.CSSProperties;
  transition?: string | TransitionGetter;
  modifiers?: Modifiers;
  wrapperElement?: keyof JSX.IntrinsicElements;
  zIndex?: number;
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#children)    Children

You may render any valid JSX within the children of the `<DragOverlay>`. However, **make sure that the components rendered within the drag overlay do not use the** `useDraggable` **hook**.

Prefer conditionally rendering the `children` of `<DragOverlay>` rather than conditionally rendering `<DragOverlay>`, otherwise drop animations will not work.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#class-name-and-inline-styles)    Class name and inline styles

If you'd like to customize the [wrapper element](https://docs.dndkit.com/api-documentation/draggable/drag-overlay#wrapper-element) that the `DragOverlay`'s children are rendered into, use the `className` and `style` props:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
<DragOverlay
  className="my-drag-overlay"
  style={{
    width: 500,
  }}
>
  {/* ... */}
</DragOverlay>
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#drop-animation)    Drop animation

Use the `dropAnimation` prop to configure the drop animation.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
interface DropAnimation {
  duration: number;
  easing: string;
}
```

The `duration` option should be a number, in `milliseconds`. The default value is `250` milliseconds. The `easing` option should be a string that represents a valid [CSS easing function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function). The default easing is `ease`.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
<DragOverlay dropAnimation={{
  duration: 500,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
}}>
  {/* ... */}
</DragOverlay>
```

To disable drop animations, set the `dropAnimation` prop to `null`.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
<DragOverlay dropAnimation={null}>
  {/* ... */}
</DragOverlay>
```

The `<DragOverlay>` component should **remain mounted at all times** so that it can perform the drop animation. If you conditionally render the `<DragOverlay>` component, drop animations will not work.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#modifiers)    Modifiers

Modifiers let you dynamically modify the movement coordinates that are detected by sensors. They can be used for a wide range of use-cases, which you can learn more about by reading the [Modifiers](https://docs.dndkit.com/api-documentation/modifiers) documentation.

For example, you can use modifiers to restrict the movement of the `<DragOverlay>` to the bounds of the window:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {DndContext, DragOverlay} from '@dnd-kit';
import {
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

function App() {
  return (
    <DndContext>
      {/* ... */}
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {/* ... */}
      </DragOverlay>
    </DndContext>
  )
}
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#transition)    Transition

By default, the `<DragOverlay>` component does not have any transitions, unless activated by the [`Keyboard` sensor](https://docs.dndkit.com/api-documentation/sensors/keyboard). Use the `transition` prop to create a function that returns the transition based on the [activator event](https://docs.dndkit.com/api-documentation/sensors#activators). The default implementation is:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function defaultTransition(activatorEvent) {
  const isKeyboardActivator = activatorEvent instanceof KeyboardEvent;

  return isKeyboardActivator ? 'transform 250ms ease' : undefined;
};
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#wrapper-element)    Wrapper element

By default, the `<DragOverlay>` component renders your elements within a `div` element. If your draggable elements are list items, you'll want to update the `<DragOverlay>` component to render a `ul` wrapper instead, since wrapping a `li` item without a parent `ul` is invalid HTML:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
<DragOverlay wrapperElement="ul">
  {/* ... */}
</DragOverlay>
```

### [Direct link to heading](https://docs.dndkit.com/api-documentation/draggable/drag-overlay\#z-index)    `z-index`

The `zIndex` prop sets the [z-order](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) of the drag overlay. The default value is `999` for compatibility reasons, but we highly recommend you use a lower value.

Last updated 2 years ago

* * *
