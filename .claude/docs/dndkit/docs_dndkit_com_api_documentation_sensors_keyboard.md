The Keyboard sensor responds to [Keyboard events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent). It is one of the default sensors used by the [DndContext](https://docs.dndkit.com/api-documentation/context-provider) provider if none are defined.

In order for the Keyboard sensor to function properly, the activator element that receives the `useDraggable` [listeners](https://docs.dndkit.com/api-documentation/draggable/usedraggable#listeners) **must** be able to receive focus. To learn more, read the in-depth [Accessibility guide](https://docs.dndkit.com/guides/accessibility).

### [Direct link to heading](https://docs.dndkit.com/api-documentation/sensors/keyboard#activator) Activator

The keyboard activator is the `onKeyDown` event handler. The Keyboard sensor is initialized if the [`event.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) property matches one of the `start` keys passed to `keyboardCodes` option of the Keyboard sensor.

By default, the keys that activate the Keyboard sensor are `Space` and `Enter`.

### [Direct link to heading](https://docs.dndkit.com/api-documentation/sensors/keyboard#options) Options

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/sensors/keyboard#keyboard-codes) Keyboard codes

This option represents the keys that are associated with the drag `start`, `cancel` and `end` events. The `keyboardCodes` options adheres to the following interface:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
type KeyboardCode = KeyboardEvent['code'];

interface KeyboardCodes {
  start: KeyboardCode[];
  cancel: KeyboardCode[];
  end: KeyboardCode[];
};
```

The default values are:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
const defaultKeyboardCodes = {
  start: ['Space', 'Enter'],
  cancel: ['Escape'],
  end: ['Space', 'Enter'],
};
```

You can customize these values, but keep in mind that the [third rule of ARIA](https://www.w3.org/TR/using-aria/#3rdrule) requires that a user **must** be able to activate the action associated with a draggable widget using **both** the `enter` (on Windows) or `return` (on macOS) and the `space` key. To learn more, read the in-depth [accessibility guide](https://docs.dndkit.com/guides/accessibility).

Keep in mind that you should also customize the screen reader instructions using the `screenReaderInstructions` prop of [`<DndContext>`](https://docs.dndkit.com/api-documentation/context-provider) if you update these values, as the screen reader instructions assume that the Keyboard sensor is initialized with the default keyboard shortcuts.

The `move` keyboard codes are not a customizable option, because those are handled by the [coordinate getter function](https://docs.dndkit.com/api-documentation/sensors/keyboard#coordinates-getter). To customize them, write a custom coordinate getter function.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/sensors/keyboard#coordinates-getter) Coordinates getter

By default, the Keyboard sensor moves in any given direction by `25` pixels when any of the arrow keys are pressed while dragging.

This is an arbitrary sensible default that may or may not be suited to the use case you are building.

The `getNextCoordinates` option can be used to define a custom coordinate getter function that is passed the latest keyboard `event` along with the current coordinates:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
function customCoordinatesGetter(event, args) {
  const {currentCoordinates} = args;
  const delta = 50;

  switch (event.code) {
    case 'Right':
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + delta,
      };
    case 'Left':
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - delta,
      };
    case 'Down':
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + delta,
      };
    case 'Up':
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - delta,
      };
  }

  return undefined;
};
```

While the example above is fairly simple, you can build complex coordinate getters to support advanced use cases. The [Sortable](https://docs.dndkit.com/presets/sortable) preset uses the `getNextCoordinates` option to build on top of the Keyboard sensor and move the active sortable item to its new index depending on the arrow key that is pressed.

#### [Direct link to heading](https://docs.dndkit.com/api-documentation/sensors/keyboard#scroll-behavior) Scroll behavior

This option represents the [scroll behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo) that should be used when scrolling to new coordinates. The default value is `smooth`, which results in the scroll container being scrolled smoothly to the new coordinates.

The other possible value is `auto`, which results in the scroll container being scrolled directly to the new coordinates without any animation.

Last updated 4 years ago

---
