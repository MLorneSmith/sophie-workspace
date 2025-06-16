/**
 * @name createRegistry
 * @description Creates a new registry instance with the provided implementations.
 * @returns A new registry instance.
 */
export function createRegistry() {
    const implementations = new Map();
    const setupCallbacks = new Map();
    const setupPromises = new Map();
    const registry = {
        register(name, factory) {
            implementations.set(name, factory);
            return registry;
        },
        // Updated get method overload that supports tuple inference
        get: (async (...names) => {
            await registry.setup();
            if (names.length === 1) {
                const firstName = names[0];
                if (!firstName) {
                    throw new Error("No implementation name provided");
                }
                return await getImplementation(firstName);
            }
            return await Promise.all(names.map((name) => getImplementation(name)));
        }),
        async setup(group) {
            var _a;
            if (group) {
                if (!setupPromises.has(group)) {
                    const callbacks = (_a = setupCallbacks.get(group)) !== null && _a !== void 0 ? _a : [];
                    setupPromises.set(group, Promise.all(callbacks.map((cb) => cb())).then(() => void 0));
                }
                return setupPromises.get(group);
            }
            const groups = Array.from(setupCallbacks.keys());
            await Promise.all(groups.map((group) => registry.setup(group)));
        },
        addSetup(group, callback) {
            var _a;
            if (!setupCallbacks.has(group)) {
                setupCallbacks.set(group, []);
            }
            (_a = setupCallbacks.get(group)) === null || _a === void 0 ? void 0 : _a.push(callback);
            return registry;
        },
    };
    async function getImplementation(name) {
        const factory = implementations.get(name);
        if (!factory) {
            throw new Error(`Implementation "${name}" not found`);
        }
        const implementation = await factory();
        if (!implementation) {
            throw new Error(`Implementation "${name}" is not available`);
        }
        return implementation;
    }
    return registry;
}
