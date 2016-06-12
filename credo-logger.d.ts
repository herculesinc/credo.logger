declare module "@credo/logger" {
    import * as http from 'http';
	
	// ENUMS
	// ============================================================================================
	export enum SeverityLevel { debug = 1, info, warning, error }
	export namespace SeverityLevel {
		export function parse(value: SeverityLevel | string): SeverityLevel;
	}

	export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey';
	export const Color: {
		black   : Color;
		red     : Color;
		green   : Color;
		yellow  : Color;
		blue    : Color;
		magenta : Color;
		cyan    : Color;
		white   : Color;
		grey    : Color;
	};

	// ENUMS
	// ============================================================================================
	export interface Options {
		name		: string;
		level?		: SeverityLevel | string;
		console?	: ConsoleOptions | boolean;
		telemetry?	: TelemetryOptions;
	}

	export interface ConsoleOptions {
		prefix?		: PrefixOptions;
		formats?	: FormatOptions;
		color?		: Color | ColorOptions;
	}

	export interface PrefixOptions {
		name?		: boolean;
		time?		: boolean;
		level?		: boolean;
	}

	interface ColorOptions {
		levels?     : { debug?: Color; info?: Color; warning?: Color; error?: Color; };
		services?	: { [service: string]: Color; };
	}

	export interface FormatOptions {
		errors?		: 'message' | 'stack';
		events?		: boolean;
		metrics?	: boolean;
		traces?		: boolean;
		requests?	: boolean | 'dev' | 'short';
	}

	export interface TelemetryOptions {
		provider	: 'appinsights';
		key			: string;
	}

	// LOGGER CLASS
	// ============================================================================================
	export class Logger {

		name	: string;
		level	: SeverityLevel;

		constructor(options: Options);

		debug(message: string);
		info (message: string);
		warn(message: string);

		error(error: Error);

		log(event: string, properties?: { [key: string]: any });
		track(metric: string, value: number);
		trace(service: string, command: string, time: number, success?: boolean);

		request(request: http.ServerRequest, response: http.ServerResponse);
	}
}