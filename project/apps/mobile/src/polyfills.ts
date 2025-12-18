import { LogBox, Platform } from 'react-native';

if (Platform.OS === 'web') {
	const POINTER_EVENTS_WARNING = 'props.pointerEvents is deprecated. Use style.pointerEvents';

	LogBox.ignoreLogs([POINTER_EVENTS_WARNING]);

	const originalWarn = console.warn;
	console.warn = (...args: unknown[]) => {
		if (typeof args[0] === 'string' && args[0].includes(POINTER_EVENTS_WARNING)) {
			return;
		}

		originalWarn(...args);
	};
}

type PolyfillField = {
	name: string;
	value: unknown;
	filename?: string;
};

const getGlobalObject = (): Record<string, unknown> => {
	if (typeof globalThis !== 'undefined') {
		return globalThis as Record<string, unknown>;
	}
	if (typeof global !== 'undefined') {
		return global as Record<string, unknown>;
	}
	if (typeof window !== 'undefined') {
		return window as unknown as Record<string, unknown>;
	}
	if (typeof self !== 'undefined') {
		return self as unknown as Record<string, unknown>;
	}
	return {};
};

const globalRef = getGlobalObject();

if (typeof globalRef.FormData === 'undefined') {
	class FormDataPolyfill {
		private _fields: PolyfillField[] = [];

		append(name: string, value: unknown, filename?: string) {
			this._fields.push({ name, value, filename });
		}

		set(name: string, value: unknown, filename?: string) {
			this.delete(name);
			this.append(name, value, filename);
		}

		delete(name: string) {
			this._fields = this._fields.filter((field) => field.name !== name);
		}

		get(name: string): unknown | null {
			const field = this._fields.find((item) => item.name === name);
			return field ? field.value : null;
		}

		getAll(name: string): unknown[] {
			return this._fields
				.filter((item) => item.name === name)
				.map((item) => item.value);
		}

		has(name: string): boolean {
			return this._fields.some((item) => item.name === name);
		}

		forEach(callback: (value: unknown, name: string, formData: FormDataPolyfill) => void, thisArg?: unknown) {
			this._fields.forEach((field) => {
				callback.call(thisArg ?? null, field.value, field.name, this);
			});
		}

		*entries(): IterableIterator<[string, unknown]> {
			for (const field of this._fields) {
				yield [field.name, field.value];
			}
		}

		*keys(): IterableIterator<string> {
			for (const field of this._fields) {
				yield field.name;
			}
		}

		*values(): IterableIterator<unknown> {
			for (const field of this._fields) {
				yield field.value;
			}
		}

		[Symbol.iterator]() {
			return this.entries();
		}
	}

	Object.defineProperty(globalRef, 'FormData', {
		value: FormDataPolyfill,
		writable: true,
		configurable: true,
	});
}

export { }; // ensure this file is treated as a module

