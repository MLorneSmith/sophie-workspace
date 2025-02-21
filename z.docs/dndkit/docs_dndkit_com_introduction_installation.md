To get started with **@dnd-kit**, install the core library via `npm` or `yarn`:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/core
```

You'll also need to be make sure you have peer dependencies installed. Chances are you already have `react` and `react-dom` installed in your project, but if not, make sure to install them:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install react react-dom
```

## [Direct link to heading](https://docs.dndkit.com/introduction/installation\#packages)    Packages

**@dnd-kit** is a [monorepo](https://en.wikipedia.org/wiki/Monorepo). Depending on your needs, you may also want to install other sub-packages that are available under the `@dnd-kit` namespace.

### [Direct link to heading](https://docs.dndkit.com/introduction/installation\#core-library)    Core library

In order to keep the core of the library small, `@dnd-kit/core` only ships with the main building blocks that the majority of users will need most of the time for building drag and drop experiences:

- [Context provider](https://docs.dndkit.com/api-documentation/context-provider)

- Hooks for:



- [Draggable](https://docs.dndkit.com/api-documentation/draggable)

- [Droppable](https://docs.dndkit.com/api-documentation/droppable)


- [Drag Overlay](https://docs.dndkit.com/api-documentation/draggable/drag-overlay)

- Sensors for:



- [Pointer](https://docs.dndkit.com/api-documentation/sensors/pointer)

- [Mouse](https://docs.dndkit.com/api-documentation/sensors/mouse)

- [Touch](https://docs.dndkit.com/api-documentation/sensors/touch)

- [Keyboard](https://docs.dndkit.com/api-documentation/sensors/keyboard)


- [Accessibility features](https://docs.dndkit.com/guides/accessibility)


### [Direct link to heading](https://docs.dndkit.com/introduction/installation\#modifiers)    Modifiers

Modifiers let you dynamically modify the movement coordinates that are detected by sensors. They can be used for a wide range of use cases, for example:

- Restricting motion to a single axis

- Restricting motion to the draggable node container's bounding rectangle

- Restricting motion to the draggable node's scroll container bounding rectangle

- Applying resistance or clamping the motion


The modifiers repository contains a number of useful modifiers that can be applied on [`DndContext`](https://docs.dndkit.com/api-documentation/context-provider) as well as [`DraggableClone`](https://docs.dndkit.com/api-documentation/draggable/drag-overlay).

To start using modifiers, install the modifiers package via yarn or npm:

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/modifiers
```

### [Direct link to heading](https://docs.dndkit.com/introduction/installation\#presets)    Presets

#### [Direct link to heading](https://docs.dndkit.com/introduction/installation\#sortable)    [Sortable](https://docs.dndkit.com/presets/sortable)

The `@dnd-kit/core` package provides all the building blocks you would need to build a sortable interface from scratch should you choose to, but thankfully you don't need to.

If you plan on building a sortable interface, we highly recommend you try out `@dnd-kit/sortable`, which is a small layer built on top of `@dnd-kit/core` and optimized for building silky smooth, flexible, and accessible sortable interfaces.

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/sortable
```

## [Direct link to heading](https://docs.dndkit.com/introduction/installation\#development-releases)    Development releases

Each commit merged into the @dnd-kit main branch will trigger a development build to be released to npm under the `next` tag.

To try a development release before the official release, install each @dnd-kit package you intend to use with the `@next` tag

Copy

```min-w-full inline-grid grid-cols-[auto_1fr] p-2 [count-reset:line]
npm install @dnd-kit/core@next @dnd-kit/sortable@next
```

Development releases can be unstable, we recommend you lock to a specific development release if you intend to use them in production.

Last updated 2 years ago

* * *