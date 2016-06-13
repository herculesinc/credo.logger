// SEVERITY LEVEL
// ================================================================================================
export enum MessageLevel { debug = 1, info, warning }
export namespace MessageLevel {
    export function parse(value: any): MessageLevel {
        if (!value) return;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return MessageLevel[value];
        if (typeof value === 'boolean') return value ? MessageLevel.debug : undefined;
    }
}

// COLOR
// ================================================================================================
export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey';
export const Color = {
    black       : 'black' as Color,
    red         : 'red' as Color,
    green       : 'green' as Color,
    yellow      : 'yellow' as Color,
    blue        : 'blue' as Color,
    magenta     : 'magenta' as Color,
    cyan        : 'cyan' as Color,
    white       : 'white' as Color,
    grey        : 'grey' as Color
};