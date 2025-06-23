Before getting started, make sure you have followed the installation steps outlined in the [Installation guide](https://docs.dndkit.com/introduction/installation).

### [Direct link to heading](https://docs.dndkit.com/introduction/getting-started#context-provider) Context provider

First, we'll set up the general structure of the app. In order for the `useDraggable` and `useDroppable` hooks to function correctly, you'll need to ensure that the components where they are used are wrapped within a [`<DndContext />`](https://docs.dndkit.com/api-documentation/context-provider) component:

App.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {DndContext} from '@dnd-kit/core';

import {Draggable} from './Draggable';
import {Droppable} from './Droppable';

function App() {
  return (
    <DndContext>
      <Draggable />
      <Droppable />
    </DndContext>
  )
}
```

### [Direct link to heading](https://docs.dndkit.com/introduction/getting-started#droppable) Droppable

![](https://3633755066-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-MMujhzqaYbBEEmDxnZO%2F-MNQc_e_FVewH2dAwjx9%2F-MNQdykNUAckcRaS-rWa%2Fdroppable-large.svg?alt=media&token=18af3a4e-b911-4149-82af-5d67c7198eea)

Next, let's set up your first **Droppable** component. To do so, we'll be using the `useDroppable` hook.

The `useDroppable` hook isn't opinionated about how your app should be structured. At minimum though, it requires you pass a [ref](https://reactjs.org/docs/refs-and-the-dom.html) to the DOM element that you would like to become droppable. You'll also need to provide a unique `id` attribute to all your droppable components.

When a **draggable** element is moved over your droppable element, the `isOver` property will become true.

Droppable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDroppable} from '@dnd-kit/core';

function Droppable(props) {
  const {isOver, setNodeRef} = useDroppable({
    id: 'droppable',
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };


  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
```

### [Direct link to heading](https://docs.dndkit.com/introduction/getting-started#draggable) Draggable

![](https://3633755066-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-MMujhzqaYbBEEmDxnZO%2F-MN0Kqdqp2CU1CxUV_hg%2F-MN0LCrhtymDDEQ6kaJj%2Fdraggable-large.svg?alt=media&token=16954bf4-1357-4890-9e99-a74ca336ddf1)

Next, let's take a look at implementing our first **Draggable** component. To do so, we'll be using the `useDraggable` hook.

The `useDraggable` hook isn't opinionated about how your app should be structured. It does however require you to be able to attach listeners and a ref to the DOM element that you would like to become draggable. You'll also need to provide a unique `id` attribute to all your draggable components.

After a draggable item is picked up, the `transform` property will be populated with the `translate` coordinates you'll need to move the item on the screen.

The `transform` object adheres to the following shape: `{x: number, y: number, scaleX: number, scaleY: number}`

Draggable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

function Draggable(props) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'draggable',
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
```

As you can see from the example above, it really only takes just a few lines to transform your existing components into draggable components.

**Tips:**

- For performance reasons, we recommend you use `transform` over other positional CSS properties to move the dragged element.

- You'll likely want to alter the `z-index` of your Draggable component to ensure it appears on top of other elements.

- If your item needs to move from one container to another, we recommend you use the [`<DragOverlay>`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) component.

Converting the `transform` object to a string can feel tedious. Fear not, you can avoid having to do this by hand by importing the `CSS` utility from the `@dnd-kit/utilities` package:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {CSS} from '@dnd-kit/utilities';

// Within your component that receives `transform` from `useDraggable`:
const style = {
  transform: CSS.Translate.toString(transform),
}
```

### [Direct link to heading](https://docs.dndkit.com/introduction/getting-started#assembling-all-the-pieces) Assembling all the pieces

Once you've set up your **Droppable** and **Draggable** components, you'll want to come back to where you set up your [`<DndContext>`](https://docs.dndkit.com/api-documentation/context-provider) component so you can add event listeners to be able to respond to the different events that are fired.

In this example, we'll assume you want to move your `<Draggable>` component from outside into your `<Droppable>` component:

![](https://docs.dndkit.com/~gitbook/image?url=https%3A%2F%2F3633755066-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252F-MMujhzqaYbBEEmDxnZO%252F-MPBiS011L5t61nqKkYr%252F-MPBjPjCz5hhHlavOpZE%252FExample.png%3Falt%3Dmedia%26token%3D8f1b9699-24ce-42c3-9dd7-17ed4bba15a7&width=768&dpr=4&quality=100&sign=76b6d3e8&sv=2)

To do so, you'll want to listen to the `onDragEnd` event of the `<DndContext>` to see if your draggable item was dropped over your droppable:

App.jsxDroppable.jsxDraggable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

function App() {
  const [isDropped, setIsDropped] = useState(false);
  const draggableMarkup = (
    <Draggable>Drag me</Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {!isDropped ? draggableMarkup : null}
      <Droppable>
        {isDropped ? draggableMarkup : 'Drop here'}
      </Droppable>
    </DndContext>
  );

  function handleDragEnd(event) {
    if (event.over && event.over.id === 'droppable') {
      setIsDropped(true);
    }
  }
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDroppable} from '@dnd-kit/core';

export function Droppable(props) {
  const {isOver, setNodeRef} = useDroppable({
    id: 'droppable',
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };


  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

export function Draggable(props) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'draggable',
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
```

That's it! You've set up your first [**Droppable**](https://docs.dndkit.com/api-documentation/droppable) and [**Draggable**](https://docs.dndkit.com/api-documentation/draggable) components.

### [Direct link to heading](https://docs.dndkit.com/introduction/getting-started#pushing-things-a-bit-further) Pushing things a bit further

The example we've set up above is a bit simplistic. In a real world example, you may have multiple droppable containers, and you may also want to be able to drag your items back out of the droppable containers once they've been dragged within them.

Here's a slightly more complex example that contains multiple **Droppable** containers:

App.jsxDroppable.jsxDraggable.jsx

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

function App() {
  const containers = ['A', 'B', 'C'];
  const [parent, setParent] = useState(null);
  const draggableMarkup = (
    <Draggable id="draggable">Drag me</Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {parent === null ? draggableMarkup : null}

      {containers.map((id) => (
        // We updated the Droppable component so it would accept an `id`
        // prop and pass it to `useDroppable`
        <Droppable key={id} id={id}>
          {parent === id ? draggableMarkup : 'Drop here'}
        </Droppable>
      ))}
    </DndContext>
  );

  function handleDragEnd(event) {
    const {over} = event;

    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null);
  }
};
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDroppable} from '@dnd-kit/core';

export function Droppable(props) {
  const {isOver, setNodeRef} = useDroppable({
    id: props.id,
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };


  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
```

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import React from 'react';
import {useDraggable} from '@dnd-kit/core';

export function Draggable(props) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: props.id,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
```

We hope this quick start guide has given you a glimpse of the simplicity and power of @dnd-kit. There's much more to learn, and we encourage you to keep reading about all of the different options you can pass to `<DndContext>` , `useDroppable` and `useDraggable` by reading their respective API documentation.

Last updated 2 years ago

---
