declare module "@credo/logger" {
    import * as http from 'http';
	
	// ENUMS
	// ============================================================================================
	export enum MessageLevel { debug = 10, info = 20, warning = 30 }
	export namespace MessageLevel {
		export function parse(value: MessageLevel | string): MessageLevel;
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
		log?		: LoggingOptions;
		console?	: ConsoleOptions | boolean;
		telemetry?	: TelemetryOptions;
	}

	export interface LoggingOptions {
		messages?	: MessageLevel | string | boolean;
		errors?		: boolean;
		events?		: boolean;
		metrics?	: boolean;
		services?	: boolean | string[];
		requests?	: boolean;
	}

	export interface ConsoleOptions {
		prefix?		: PrefixOptions;
		formats?	: FormatOptions;
		color?		: Color | ColorOptions;
	}

	export interface PrefixOptions {
		name?		: boolean;
		time?		: boolean;
		stream?		: boolean;
	}

	interface ColorOptions {
		severity?   : { debug?: Color; info?: Color; warning?: Color; error?: Color; };
		services?	: { [service: string]: Color | string; };
	}

	export interface FormatOptions {
		error?		: 'message' | 'stack';
		request?	: 'dev' | 'short';
	}

	export interface TelemetryOptions {
		provider	: 'appinsights';
		key			: string;
	}

	// LOGGER CLASS
	// ============================================================================================
	export class Logger {

		name	: string;
		options	: LoggingOptions;

		constructor(options: Options);

		debug(message: string);
		info (message: string);
		warn(message: string);

		error(error: Error);

		log(event: string, properties?: { [key: string]: any });
		track(metric: string, value: number);
		trace(service: string, command: string, duration: number, success?: boolean);

		request(request: http.IncomingMessage, response: http.ServerResponse);
	}

	// SINGLETON MEMBERS
	// ============================================================================================
	export function configure(options: Options): Logger;
	export function getInstance(): Logger;

	export function debug(message: string);
	export function info (message: string);
	export function warn(message: string);

	export function error(error: Error);

 	export function log(event: string, properties?: { [key: string]: any });
	export function track(metric: string, value: number);
	export function trace(service: string, command: string, duration: number, success?: boolean);

	export function request(request: http.IncomingMessage, response: http.ServerResponse);
}