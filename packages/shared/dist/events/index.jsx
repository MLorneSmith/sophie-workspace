"use client";
import { createContext, useCallback, useContext, useRef } from "react";
const AppEventsContext = createContext(null);
export function AppEventsProvider({ children }) {
    const listeners = useRef({});
    const emit = useCallback((event) => {
        var _a;
        const eventListeners = (_a = listeners.current[event.type]) !== null && _a !== void 0 ? _a : [];
        for (const callback of eventListeners) {
            callback(event);
        }
    }, [listeners]);
    const on = useCallback((eventType, callback) => {
        var _a;
        listeners.current = Object.assign(Object.assign({}, listeners.current), { [eventType]: [...((_a = listeners.current[eventType]) !== null && _a !== void 0 ? _a : []), callback] });
    }, []);
    const off = useCallback((eventType, callback) => {
        var _a;
        listeners.current = Object.assign(Object.assign({}, listeners.current), { [eventType]: ((_a = listeners.current[eventType]) !== null && _a !== void 0 ? _a : []).filter((cb) => cb !== callback) });
    }, []);
    return (<AppEventsContext.Provider value={{ emit, on, off }}>
			{children}
		</AppEventsContext.Provider>);
}
export function useAppEvents() {
    const context = useContext(AppEventsContext);
    if (!context) {
        throw new Error("useAppEvents must be used within an AppEventsProvider");
    }
    return context;
}
