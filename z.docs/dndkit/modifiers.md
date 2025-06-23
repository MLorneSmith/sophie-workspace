Modifiers let you dynamically modify the movement coordinates that are detected by sensors. They can be used for a wide range of use cases, for example:

- Restricting motion to a single axis

- Restricting motion to the draggable node container's bounding rectangle

- Restricting motion to the draggable node's scroll container bounding rectangle

- Applying resistance or clamping the motion

## [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#installation) Installation

To start using modifiers, install the modifiers package via yarn or npm:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/modifiers
```

## [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#usage) Usage

The modifiers repository contains a number of useful modifiers that can be applied on [`DndContext`](https://docs.dndkit.com/api-documentation/context-provider) as well as [`DragOverlay`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay).

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {DndContext, DragOverlay} from '@dnd-kit';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

function App() {
  return (
    <DndContext modifiers={[restrictToVerticalAxis]}>
      {/* ... */}
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {/* ... */}
      </DragOverlay>
    </DndContext>
  )
}
```

As you can see from the example above, `DndContext` and `DragOverlay` can both have different modifiers.

## [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#built-in-modifiers) Built-in modifiers

### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricting-motion-to-an-axis) Restricting motion to an axis

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricttohorizontalaxis) `restrictToHorizontalAxis`

Restrict movement to only the horizontal axis.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricttoverticalaxis) `restrictToVerticalAxis`

Restrict movement to only the vertical axis.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restrict-motion-to-a-containers-bounding-rectangle) Restrict motion to a container's bounding rectangle

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricttowindowedges) `restrictToWindowEdges`

Restrict movement to the edges of the window. This modifier can be useful to prevent the `DragOverlay` from being moved outside of the bounds of the window.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricttoparentelement) `restrictToParentElement`

Restrict movement to the parent element of the draggable item that is picked up.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#restricttofirstscrollableancestor) `restrictToFirstScrollableAncestor`

Restrict movement to the first scrollable ancestor of the draggable item that is picked up.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#snap-to-grid) Snap to grid

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#createsnapmodifier) `createSnapModifier`

Function to create modifiers to snap to a given grid size.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
import {createSnapModifier} from '@dnd-kit/modifiers';

const gridSize = 20; // pixels
const snapToGridModifier = createSnapModifier(gridSize);
```

## [Direct link to heading](https://docs.dndkit.com/api-documentation/modifiers#building-custom-modifiers) Building custom modifiers

To build your own custom modifiers, refer to the implementation of the built-in modifiers of `@dnd-kit/modifiers`: [https://github.com/clauderic/dnd-kit/tree/master/packages/modifiers/src](https://github.com/clauderic/dnd-kit/tree/master/packages/modifiers/src)

For example, here is an implementation to create a modifier to snap to grid:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const gridSize = 20;

function snapToGrid(args) {
  const {transform} = args;

  return {
    ...transform,
    x: Math.ceil(transform.x / gridSize) * gridSize,
    y: Math.ceil(transform.y / gridSize) * gridSize,
  };
 }
```

Last updated 4 years ago

---
